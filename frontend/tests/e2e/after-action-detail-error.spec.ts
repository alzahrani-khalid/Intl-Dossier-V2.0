// @covers WRITE-02
//
// Phase 94 Wave 2 (94-07) — the forced-query-error oracle for the after-action detail route.
//
// WHAT THIS KILLS. `$afterActionId.tsx:65` called `t('afterActions.loadError')` in the DOT form.
// i18next reads the dot as a nested lookup inside the aliased default bundle, the key was absent
// from `common.json`'s `afterActions` subtree in BOTH locales, and so the literal string
// `afterActions.loadError` was painted on screen every time the detail query rejected. Adding the
// key while keeping the dot form reproduces the bug silently (D-10) — which is why this spec
// asserts the RESOLVED copy and the ABSENCE of the raw key, not merely that "an error appeared".
//
// WHY IT FORCES THE ERROR RATHER THAN FINDING ONE. The failing path is a query rejection, and on
// staging the detail query succeeds. Aborting the request at the network layer is the only way to
// reach the branch deterministically. The function name is DERIVED from `useAfterAction.ts` rather
// than hardcoded: if the hook is ever repointed, this spec follows it instead of silently routing
// nothing and passing on a page that never errored.
//
// "NO ERROR SHOWN" IS NEVER A PASS (P94 W1). The assertion of record is a positive one — the
// translated sentence is VISIBLE inside a `role="alert"` region. An empty page, a redirect, or a
// silently-swallowed rejection all fail here.
//
// AUTHENTICATION: this spec runs under `frontend/playwright.config.ts`, whose `globalSetup` signs
// in once with TEST_USER_EMAIL / TEST_USER_PASSWORD and persists a storageState every project
// inherits. It does NOT touch the repo-root config's `setup` project, which throws without six
// E2E_* keys `.env.test` does not carry (E2ECRED-01). No credential value is read or printed here.
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * The detail-fetch edge function, derived from the hook the route actually calls. Scoped to the
 * `useAfterAction(` declaration so a later `invoke()` in the same file (the list hook calls
 * `after-actions-list-all`) can never be picked up instead.
 */
const detailFunctionName = ((): string => {
  const hookPath = path.resolve(__dirname, '..', '..', 'src', 'hooks', 'useAfterAction.ts')
  const source = readFileSync(hookPath, 'utf8')
  const declaration = source.indexOf('export function useAfterAction(')
  if (declaration === -1) {
    throw new Error(`useAfterAction declaration not found in ${hookPath}`)
  }
  const match = /functions\.invoke\(\s*'([^']+)'/.exec(source.slice(declaration))
  if (match === null) {
    throw new Error(`no functions.invoke(...) found after useAfterAction in ${hookPath}`)
  }
  return match[1]
})()

// The route's query rejects, then TanStack Query runs its retry ladder — the app default is 3
// retries at 1s/2s/4s, so the error arm cannot land before ~7s. A PostgrestError carries no
// numeric `status`, so the 4xx short-circuit never applies. 20s is that ladder plus headroom.
const RETRY_LADDER_TIMEOUT = 20_000

/** The EN copy authored for `common:afterActions.loadError` (94-UI-SPEC Copywriting Contract). */
const LOAD_ERROR_COPY = 'Unable to load this after-action record'

/** The exact symptom: the key itself, painted because the dot form never resolved it. */
const RAW_KEY = 'afterActions.loadError'

/** Postgres / PostgREST internals must never reach a user-facing surface (D-08, P93 copy rule). */
const INTERNAL_CODE_PATTERN = /PGRST|42P17|23502/

test.describe('WRITE-02 a failed after-action detail load renders translated copy, never a raw key', () => {
  test('forced query error renders the translated load error and no raw key', async ({ page }) => {
    await page.route(`**/functions/v1/${detailFunctionName}*`, (route) => route.abort())

    // Well-formed and absent — the id never matters, the request is aborted before it is read.
    await page.goto(`/after-actions/${crypto.randomUUID()}`)

    // Guard the environment rather than the subject: an auth redirect would otherwise read as a
    // missing error state (GATE-STANDARD C2 — a red must be attributable to the subject).
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })

    // THE ASSERTION OF RECORD. Positive, and inside the error region's alert semantics.
    const errorRegion = page.getByRole('alert')
    await expect(errorRegion).toBeVisible({ timeout: RETRY_LADDER_TIMEOUT })
    await expect(errorRegion).toContainText(LOAD_ERROR_COPY, { timeout: RETRY_LADDER_TIMEOUT })

    // THE SYMPTOM, asserted absent over what the user can actually read.
    const rendered = await page.locator('body').innerText()
    expect(rendered).not.toContain(RAW_KEY)
    expect(rendered).not.toMatch(INTERNAL_CODE_PATTERN)
  })
})
