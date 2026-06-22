import { test, expect, type Page } from '@playwright/test'

/**
 * Phase-73 Plan 05 (GENUI-01) — copilot READ generative-UI: the app renders its OWN inline
 * cards (InlineDossierCard → UniversalDossierCard, InlineSignalCard) for a dossier/signal
 * read result instead of plain markdown, with a working in-app router deep-link, in EN + AR;
 * and a forced read failure stays indistinguishable-empty. Mirrors copilot.spec.ts (72-08):
 * FAB-open, EN/AR dual-name getByRole, dir="rtl"+Tajawal computed-font assertion, CDP
 * `Network.setBlockedURLs` forced-error + role="alert" + no clearance/filtered/restricted leak.
 *
 * The three READ tool-UI renderers (genUiToolUIs, 73-04) are FIXED-allowlist:
 *   get_dossier → InlineDossierCard ; list_dossiers → stack ; read_signals → InlineSignalCard
 * The dossier card exposes `.copilot-genui__activate` (aria "Open dossier"/"فتح الملف") and
 * deep-links via getDossierDetailPath → `/dossiers/<segment>/<id>` (segment from
 * DOSSIER_TYPE_TO_ROUTE, e.g. country→countries). The signal card exposes `.copilot-genui-signal`
 * with `[data-signal-id]` and deep-links to `/intelligence`. A null/above-level/not-found read
 * renders ONE neutral line (genui.dossier.unavailable) — naming no reason (indistinguishable-empty).
 *
 * VERIFICATION REALITY (MEMORY / 72-VALIDATION): RLS denial returns an EMPTY 200, NOT an error
 * status — NEVER assert on HTTP status; force failures via CDP and assert role="alert" + neutral
 * copy. Language persists under localStorage['id.locale'] (NOT i18nextLng); AR renders dir="rtl"
 * + Tajawal. Screenshots can wedge — DOM assertions only.
 *
 * DEPLOY GATE: the READ genUI needs the agent-runtime /chat route reachable (on-prem GPU stack,
 * DEPLOY-GATED per the P72 SUMMARY). Tests are skip-annotated behind E2E_COPILOT_STACK so CI
 * stays green until the stack is up; the live proof is the 73-05 Task-3 checkpoint. Set
 * E2E_COPILOT_STACK=1 once the stack is reachable to run them live.
 */

/** Deploy gate: only run the agent-dependent flows when the copilot stack is reachable. */
const COPILOT_STACK_UP = process.env.E2E_COPILOT_STACK === '1'
const STACK_GATE_REASON =
  'DEPLOY-GATED: agent-runtime /chat (GPU stack) not reachable — live proof is the 73-05 Task-3 checkpoint. Set E2E_COPILOT_STACK=1 to run.'

/** A seeded dossier the admin session can read (override via env for staging). */
const SEED_DOSSIER_ID = process.env.E2E_DIGEST_DOSSIER_ID ?? '__SEED_DOSSIER_ID__'
const SEED_DOSSIER_NAME = process.env.E2E_DIGEST_DOSSIER_NAME ?? '__SEED_DOSSIER_NAME__'

/** Open the copilot drawer from the topbar FAB (EN+AR aria-name). Returns the dialog. */
async function openCopilot(page: Page): ReturnType<Page['getByRole']> {
  await page.getByRole('button', { name: /Ask the copilot|اسأل المساعد/ }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  return drawer
}

/** Send a free-text prompt through the composer (the model decides the READ tool call). */
async function sendPrompt(page: Page, prompt: string): Promise<void> {
  const composer = page.getByRole('textbox', { name: /Send message|إرسال الرسالة|message/i })
  await expect(composer).toBeVisible()
  await composer.fill(prompt)
  await page.getByRole('button', { name: /Send message|إرسال الرسالة/ }).click()
}

// ---------------------------------------------------------------------------
// GENUI-01 — the app's OWN inline dossier card renders (not markdown), EN + AR.
// ---------------------------------------------------------------------------
test.describe('GENUI-01: inline app dossier card renders', () => {
  test.skip(!COPILOT_STACK_UP, STACK_GATE_REASON)

  test('[en] a dossier read renders the inline UniversalDossierCard wrapper', async ({ page }) => {
    await page.goto('/')
    const drawer = await openCopilot(page)
    await sendPrompt(page, `Show me dossier ${SEED_DOSSIER_ID}`)

    // The app's own inline card (not plain markdown): the deep-link activate button carries
    // aria-label "Open dossier" and wraps UniversalDossierCard.
    const card = drawer.getByRole('button', { name: /Open dossier/ })
    await expect(card).toBeVisible({ timeout: 30000 })
  })

  test('[ar] the inline card surface renders dir="rtl" + Tajawal', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('id.locale', 'ar'))
    await page.goto('/')
    const drawer = await openCopilot(page)
    await expect(drawer).toHaveAttribute('dir', 'rtl')

    await sendPrompt(page, `Show me dossier ${SEED_DOSSIER_ID}`)
    const card = drawer.getByRole('button', { name: /فتح الملف/ })
    await expect(card).toBeVisible({ timeout: 30000 })

    // Tajawal applies under html[dir="rtl"]; assert the computed font-family (copilot.spec.ts precedent).
    const fontFamily = await drawer.evaluate((el) => getComputedStyle(el).fontFamily)
    expect(fontFamily.toLowerCase()).toContain('tajawal')
  })
})

// ---------------------------------------------------------------------------
// GENUI-01 — clicking the inline card deep-links in-app to the dossier route.
// ---------------------------------------------------------------------------
test.describe('GENUI-01: inline card deep-link stays in-app', () => {
  test.skip(!COPILOT_STACK_UP, STACK_GATE_REASON)

  test('clicking the inline dossier card navigates to /dossiers/<segment>/<id>', async ({
    page,
  }) => {
    await page.goto('/')
    const drawer = await openCopilot(page)
    await sendPrompt(page, `Show me dossier ${SEED_DOSSIER_ID}`)

    const card = drawer.getByRole('button', { name: /Open dossier|فتح الملف/ })
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.click()

    // getDossierDetailPath → `/dossiers/<segment>/<id>` (segment from DOSSIER_TYPE_TO_ROUTE).
    // Match the route shape + the seeded id, staying in-app (no external URL).
    await expect(page).toHaveURL(new RegExp(`/dossiers/[a-z-]+/${SEED_DOSSIER_ID}`))
  })
})

// ---------------------------------------------------------------------------
// GENUI-01 — a forced read failure stays indistinguishable-empty (no leak).
// ---------------------------------------------------------------------------
test.describe('GENUI-01: forced read failure stays indistinguishable-empty', () => {
  test.skip(!COPILOT_STACK_UP, STACK_GATE_REASON)

  test('a blocked dossier read surfaces neutral copy with NO clearance/filtered/restricted leak', async ({
    page,
  }) => {
    // Block the copilot read tool + the RLS-gated full-dossier fetch the inline card makes.
    // An above-level read, a not-found, and a generic outage MUST all read the same.
    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.setBlockedURLs', {
      urls: ['*/api/copilot/*', '*get_dossier*', '*list_dossiers*', '*/rest/v1/dossiers*'],
    })

    await page.goto('/')
    const drawer = await openCopilot(page)
    await sendPrompt(page, `Show me dossier ${SEED_DOSSIER_ID}`)

    // The surface shows a neutral error/empty state — assert via DOM, never HTTP status.
    // Either the neutral genUI empty line (genui.dossier.unavailable) or the copilot's
    // role="alert" surfaces; both must carry NO clearance/filtered/restricted token.
    const neutral = drawer
      .getByRole('alert')
      .or(drawer.getByText(/isn't available to show here|غير متاح للعرض هنا/))
    await expect(neutral.first()).toBeVisible({ timeout: 30000 })

    const drawerText = await drawer.innerText()
    expect(drawerText).not.toMatch(/clearance|filtered|restricted/i)

    await client.send('Network.setBlockedURLs', { urls: [] })
  })
})

// SEED_DOSSIER_NAME is reserved for the live Task-3 checkpoint (strong-confirm typed name);
// referenced here so the staging override is documented alongside the other seed constants.
void SEED_DOSSIER_NAME
