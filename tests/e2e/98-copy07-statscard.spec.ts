// @covers COPY-07 (criterion 1)
//
// Phase 98 — COPY-07's dedicated oracle. Cloned from `96-calendar-family.spec.ts`: header
// discipline, inline auth, `--no-deps`, DOM assertions.
//
// RECONCILIATION WITH 98-VALIDATION, stated because the two documents disagreed. The
// `98-VALIDATION.md` requirement table offers COPY-07 as "folded into the C1 or C8 spec"; its own
// Wave 0 Requirements list demands EIGHT `tests/e2e/98-*.spec.ts` files. Eight named oracles is
// the stronger reading (D-08: a criterion no oracle NAMES fails grading), so COPY-07 gets this
// file and the fold-in option is superseded.
//
// THE CRITERION (D-13): the hardcoded English `"% of total active dossiers"` in
// `DossierTypeStatsCard.tsx` routes through `t()` and closes on the RENDERED CARD in both locales.
// THE STRING IS THE ANCHOR, NOT THE LINE NUMBER — the residue table said `:229`, the ruling
// verified `:228`, and that file's comments move.
//
// ORACLE POPULATION DEFINITION. One region: the elected-officials stats card on /dossiers —
// `[data-testid="dossier-type-card-elected_official"]` — at a desktop viewport, admin, both locale
// legs. Nothing else on /dossiers is asserted here.
//
// WHY THE `ar` LEG IS THE WHOLE DISCRIMINATOR. 98-UI-SPEC C1 keeps the EN value BYTE-IDENTICAL
// (`% of total active dossiers` already obeys voice law, and the EN render must stay pixel-
// unchanged). So the `en` leg cannot distinguish a `t()` call from the hardcoded literal — it
// passes either way, and this spec says so rather than counting it as evidence. The `ar` leg is
// the discriminator and the HEAD RED: pre-repair the English literal renders under `?lng=ar`.
//
// STATED EXCLUSIONS. The seven sibling type cards' percentage labels are NOT asserted — the same
// repair covers them by construction (one component, one string), and pinning eight cards would
// red this oracle whenever staging holds no dossier of some type. The card's COUNTS, percentages
// and trend badges are out of criterion 1 entirely: those are numbers, not copy.
//
// LOCALE AND ROLE: both legs (`?lng=en`, `?lng=ar`), admin (TEST_USER_EMAIL).
//
// AUTHENTICATION: inline, --no-deps (E2ECRED-01 → P101). See 96-calendar-family.spec.ts.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000

const EO_CARD = '[data-testid="dossier-type-card-elected_official"]'

/** 98-UI-SPEC C1: EN stays byte-identical; the AR value is new. */
const LABEL_EN = '% of total active dossiers'
const LABEL_AR = 'النسبة من إجمالي الملفات النشطة'
/** The English fragment that must NOT survive under `?lng=ar`. */
const ENGLISH_FRAGMENT = 'of total active dossiers'

/** Sign in inline; never echo either credential value. */
const signInInline = async (page: Page): Promise<void> => {
  if (email === '' || password === '') {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing from .env.test')
  }
  const login = new LoginPage(page)
  await login.goto()
  await login.signIn(email, password)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 })
}

test.describe('COPY-07 — the stats-card percentage label is localized', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  // /dossiers loads 111 rows behind the type-card grid; under the 30s default this test timed
  // out before the card settled — a red that names the clock, not the copy.
  test.beforeEach(() => {
    test.setTimeout(150_000)
  })

  test('the EO card renders the English label under en', async ({ page }) => {
    // NOT a discriminator, and labelled as such: the EN value is unchanged by the repair, so this
    // leg passes before and after. It exists to prove the card and its label region render at all
    // — without it the `ar` assertion below could be satisfied by an absent card.
    await signInInline(page)
    await page.goto('/dossiers?lng=en')
    const card = page.locator(EO_CARD)
    await expect(card).toBeVisible({ timeout: SETTLE_TIMEOUT })
    await expect(card, 'EO card percentage label under en').toContainText(LABEL_EN)
  })

  test('the EO card renders the Arabic label under ?lng=ar and no English residue', async ({
    page,
  }) => {
    await signInInline(page)
    await page.goto('/dossiers?lng=ar')
    const card = page.locator(EO_CARD)
    await expect(card).toBeVisible({ timeout: SETTLE_TIMEOUT })

    const text = (await card.innerText()) ?? ''
    expect(text, 'EO card percentage label under ar').toContain(LABEL_AR)
    expect(text, 'the hardcoded English label survives under ar — the label is not routed through t()')
      .not.toContain(ENGLISH_FRAGMENT)
  })
})
