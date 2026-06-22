import { test, expect, type Page } from '@playwright/test'

/**
 * Phase-73 Plan 05 (GENUI-02/03/04) — copilot HITL WRITE flows: confirm-before-commit,
 * caller-JWT actor, and same-session cache sync. Mirrors copilot.spec.ts (72-08): FAB-open,
 * EN/AR dual-name getByRole, CDP `Network.setBlockedURLs` forced-error + role="alert" +
 * indistinguishable-empty innerText check, language via localStorage['id.locale'].
 *
 * The four propose_* tools echo `{ proposed, action, args }`; on a tool call the
 * ConfirmActionCard renders from the INNER args BEFORE anything commits (73-02/73-03). On
 * Approve, useApproveWrite commits under the caller JWT (the four INVOKER paths) and
 * invalidates the conventional query cache; on Reject nothing commits (D-05). publish_digest
 * carries the D-04 strong-confirm: Approve stays disabled until the dossier name is typed.
 *
 * VERIFICATION REALITY (MEMORY / 72-VALIDATION / project CDP UAT protocol):
 * - RLS denial returns an EMPTY 200, NOT an error status. NEVER assert on HTTP status.
 *   Force failures via CDP `Network.setBlockedURLs` and assert role="alert" + neutral copy.
 * - Language persists under localStorage['id.locale'] (NOT i18nextLng). AR renders dir="rtl"
 *   + Tajawal. The confirm.* / genui.* strings live in i18n/{en,ar}/copilot.json
 *   (static-bundled — there is no http-backend); the exact EN/AR strings are dual-name-matched.
 * - Screenshots can wedge in this CDP flow — DOM assertions only.
 * - Auth: the suite consumes the persisted storageState (playwright.config.ts) — no inline
 *   login. The clearance-correct actor is the admin test user ($TEST_USER_EMAIL) the stored
 *   session was minted for.
 *
 * DEPLOY GATE: the WRITE loop needs the agent-runtime /chat route reachable (the on-prem
 * GPU/agent stack — DEPLOY-GATED per the P72 SUMMARY; qwen3 model-parity gap on Mac). These
 * tests are skip-annotated behind E2E_COPILOT_STACK so CI stays green until the stack is up;
 * the authoritative live proof is the 73-05 Task-3 blocking human-verify checkpoint. Flip the
 * flag (E2E_COPILOT_STACK=1) once the stack is reachable to exercise them live.
 */

/** Deploy gate: only run the agent-dependent flows when the copilot stack is reachable. */
const COPILOT_STACK_UP = process.env.E2E_COPILOT_STACK === '1'
const STACK_GATE_REASON =
  'DEPLOY-GATED: agent-runtime /chat (GPU stack) not reachable — live proof is the 73-05 Task-3 checkpoint. Set E2E_COPILOT_STACK=1 to run.'

/** A seeded dossier + signal the admin session can edit/act on (override via env for staging). */
const SEED_DOSSIER_ID = process.env.E2E_DIGEST_DOSSIER_ID ?? '__SEED_DOSSIER_ID__'
const SEED_DOSSIER_NAME = process.env.E2E_DIGEST_DOSSIER_NAME ?? '__SEED_DOSSIER_NAME__'
const SEED_SIGNAL_ID = process.env.E2E_SIGNAL_ID ?? '__SEED_SIGNAL_ID__'

/**
 * GENUI-03 ACTOR ASSERTION (encoded for the Task-3 live checkpoint).
 *
 * Headless E2E cannot read the DB; after an approved write the live checkpoint runs these
 * via the Supabase MCP (a service-role READ only INSPECTS the row the CALLER JWT wrote) and
 * confirms the actor == the test user's auth.uid() — never service-role:
 *
 *   -- dismiss/escalate (intelligence_event): status + actor + timestamp
 *   select status, dismissed_by, escalated_by, status_changed_at
 *     from intelligence_event where id = '<SEED_SIGNAL_ID>';
 *   -- EXPECT: status='dismissed', dismissed_by = '<test user auth.uid()>', status_changed_at not null
 *
 *   -- brief (persist_brief, gated by additive briefs_insert_via_dossier_edit):
 *   select created_by, source_dossier_id, content
 *     from briefs where source_dossier_id = '<SEED_DOSSIER_ID>' order by created_at desc limit 1;
 *   -- EXPECT: created_by = '<test user auth.uid()>', source_dossier_id = '<SEED_DOSSIER_ID>',
 *   --         content is the bilingual { en, ar } jsonb (NO content_en/content_ar/dossier_id columns)
 */
const ACTOR_ASSERTION_SQL_SIGNAL =
  "select status, dismissed_by, status_changed_at from intelligence_event where id = '<SEED_SIGNAL_ID>'"
void ACTOR_ASSERTION_SQL_SIGNAL // referenced documentation; the live run executes it via MCP.

/** Open the copilot drawer from the topbar FAB (EN+AR aria-name). Returns the dialog. */
async function openCopilot(page: Page): ReturnType<Page['getByRole']> {
  await page.getByRole('button', { name: /Ask the copilot|اسأل المساعد/ }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  return drawer
}

/** Send a free-text prompt through the composer (the model decides the propose_* tool call). */
async function sendPrompt(page: Page, prompt: string): Promise<void> {
  const composer = page.getByRole('textbox', { name: /Send message|إرسال الرسالة|message/i })
  await expect(composer).toBeVisible()
  await composer.fill(prompt)
  await page.getByRole('button', { name: /Send message|إرسال الرسالة/ }).click()
}

// ---------------------------------------------------------------------------
// GENUI-02 — confirm-before-commit + Reject-commits-nothing (EN + AR), op #1: dismiss signal.
// ---------------------------------------------------------------------------
test.describe('GENUI-02: HITL confirm-before-commit — signal dismiss', () => {
  test.skip(!COPILOT_STACK_UP, STACK_GATE_REASON)

  for (const locale of ['en', 'ar'] as const) {
    test(`[${locale}] a dismiss proposal shows a token-bound card and commits ONLY on Approve`, async ({
      page,
    }) => {
      if (locale === 'ar') {
        await page.addInitScript(() => window.localStorage.setItem('id.locale', 'ar'))
      }
      await page.goto('/intelligence')
      const drawer = await openCopilot(page)

      await sendPrompt(page, `Dismiss signal ${SEED_SIGNAL_ID}`)

      // The ConfirmActionCard appears (token-bound) with the op summary BEFORE any commit.
      const card = drawer.locator('.copilot-confirm')
      await expect(card).toBeVisible({ timeout: 30000 })
      // The card names the op (signal update title) — confirm.title.signal_status (EN/AR).
      await expect(card).toContainText(/Update signal|تحديث الإشارة/)
      // Approve affordance present; committed state NOT yet shown (nothing committed pre-Approve).
      await expect(card.getByRole('button', { name: /Approve|موافقة/ })).toBeEnabled()
      await expect(card).not.toContainText(/Done\.|تم\./)

      // Approve → the card reaches its committed post-state (confirm.state.committed EN/AR).
      await card.getByRole('button', { name: /Approve|موافقة/ }).click()
      await expect(card).toContainText(/Done\.|تم\./, { timeout: 30000 })
    })

    test(`[${locale}] Reject commits nothing — the signal stays in the queue`, async ({ page }) => {
      if (locale === 'ar') {
        await page.addInitScript(() => window.localStorage.setItem('id.locale', 'ar'))
      }
      await page.goto('/intelligence')
      const drawer = await openCopilot(page)

      await sendPrompt(page, `Dismiss signal ${SEED_SIGNAL_ID}`)
      const card = drawer.locator('.copilot-confirm')
      await expect(card).toBeVisible({ timeout: 30000 })

      // Reject → reason input → confirm reject. The terminal state is "rejected", NOT committed.
      await card.getByRole('button', { name: /^Reject$|^رفض$/ }).click()
      await card.getByRole('button', { name: /Confirm reject|تأكيد الرفض/ }).click()
      await expect(card).toContainText(/Rejected\.|رُفض\./, { timeout: 30000 })
      await expect(card).not.toContainText(/Done\.|تم\./)

      // GENUI-04 (no-commit cache): the signal row is unchanged — still present in the queue,
      // NOT dismissed — in the SAME session (DOM membership, not a status assertion).
      await expect(page.locator(`[data-signal-id="${SEED_SIGNAL_ID}"]`)).toBeVisible()
    })
  }
})

// ---------------------------------------------------------------------------
// GENUI-02 + D-04 strong-confirm — op #2: publish digest (typed-confirm gate, EN + AR).
// ---------------------------------------------------------------------------
test.describe('GENUI-02: HITL strong-confirm — publish digest (D-04)', () => {
  test.skip(!COPILOT_STACK_UP, STACK_GATE_REASON)

  for (const locale of ['en', 'ar'] as const) {
    test(`[${locale}] Approve stays DISABLED until the dossier name is typed, then commits`, async ({
      page,
    }) => {
      if (locale === 'ar') {
        await page.addInitScript(() => window.localStorage.setItem('id.locale', 'ar'))
      }
      await page.goto('/intelligence')
      const drawer = await openCopilot(page)

      await sendPrompt(page, `Publish the daily digest for dossier ${SEED_DOSSIER_ID}`)
      const card = drawer.locator('.copilot-confirm')
      await expect(card).toBeVisible({ timeout: 30000 })
      await expect(card).toContainText(/Publish digest|نشر الموجز/)

      // D-04: the typed-confirm prompt is shown and Approve is DISABLED until the name matches.
      const approve = card.getByRole('button', { name: /Approve|موافقة/ })
      await expect(approve).toBeDisabled()
      const typed = card.getByRole('textbox', {
        name: /Type the dossier name to publish to subscribers|اكتب اسم الملف للنشر للمشتركين/,
      })
      await typed.fill('not-the-name')
      await expect(approve).toBeDisabled()
      await expect(card).toContainText(/does not match yet|غير مطابق بعد/)

      // Type the exact dossier name → Approve enables → commit reaches the committed state.
      await typed.fill('')
      await typed.fill(SEED_DOSSIER_NAME)
      await expect(approve).toBeEnabled()
      await approve.click()
      await expect(card).toContainText(/Done\.|تم\./, { timeout: 30000 })
    })
  }
})

// ---------------------------------------------------------------------------
// GENUI-04 — same-session cache sync after an approved write (no reload).
// ---------------------------------------------------------------------------
test.describe('GENUI-04: same-session cache sync — approved dismiss leaves the queue', () => {
  test.skip(!COPILOT_STACK_UP, STACK_GATE_REASON)

  test('an approved dismiss removes the signal from the queue WITHOUT a reload', async ({
    page,
  }) => {
    await page.goto('/intelligence')

    // Precondition: the signal is present in the conventional queue before the write.
    const row = page.locator(`[data-signal-id="${SEED_SIGNAL_ID}"]`)
    await expect(row).toBeVisible()

    const drawer = await openCopilot(page)
    await sendPrompt(page, `Dismiss signal ${SEED_SIGNAL_ID}`)
    const card = drawer.locator('.copilot-confirm')
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.getByRole('button', { name: /Approve|موافقة/ }).click()
    await expect(card).toContainText(/Done\.|تم\./, { timeout: 30000 })

    // useApproveWrite invalidates the signals query → the dismissed row leaves the queue in the
    // SAME session. Assert via DOM membership (no page.reload(), no screenshot wait).
    await expect(row).toBeHidden({ timeout: 30000 })

    // GENUI-03 ACTOR (encoded): the Task-3 checkpoint runs ACTOR_ASSERTION_SQL_SIGNAL via the
    // Supabase MCP and confirms intelligence_event.dismissed_by == the test user's auth.uid()
    // and status='dismissed' — proving the write committed under the caller JWT, not service-role.
  })
})

// ---------------------------------------------------------------------------
// Indistinguishable-empty (T-73-05-01) — a CDP-forced commit failure stays neutral.
// ---------------------------------------------------------------------------
test.describe('GENUI-02: forced commit failure stays indistinguishable-empty', () => {
  test.skip(!COPILOT_STACK_UP, STACK_GATE_REASON)

  test('a blocked commit shows neutral error copy with NO clearance/filtered/restricted leak', async ({
    page,
  }) => {
    // Block the commit RPCs at the network layer; '*' globs cross '/'. An RLS denial and a
    // generic outage MUST read the same (carried P71 GRAPH-03 / P72 AGENT-03).
    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.setBlockedURLs', {
      urls: ['*/api/copilot/*', '*publish_digest*', '*persist_brief*', '*signal_status*'],
    })

    await page.goto('/intelligence')
    const drawer = await openCopilot(page)
    await sendPrompt(page, `Dismiss signal ${SEED_SIGNAL_ID}`)
    const card = drawer.locator('.copilot-confirm')
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.getByRole('button', { name: /Approve|موافقة/ }).click()

    // The card settles to the neutral error post-state (confirm.state.error EN/AR) — and a
    // commit-failed surface must never claim success.
    await expect(card).toContainText(/did not go through|لم يكتمل ذلك/, { timeout: 30000 })
    await expect(card).not.toContainText(/Done\.|تم\./)

    // INDISTINGUISHABLE-EMPTY: nothing in the drawer reveals clearance filtering.
    const drawerText = await drawer.innerText()
    expect(drawerText).not.toMatch(/clearance|filtered|restricted/i)

    // Nothing committed: the signal is still in the conventional queue.
    await expect(page.locator(`[data-signal-id="${SEED_SIGNAL_ID}"]`)).toBeVisible()

    await client.send('Network.setBlockedURLs', { urls: [] })
  })
})
