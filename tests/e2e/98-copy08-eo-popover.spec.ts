// @covers COPY-08 (criterion 7)
//
// Phase 98 — criterion 7 oracle, the one surface in this phase where a RENDER assertion, not a
// string assertion, is the whole proof. Cloned from `96-calendar-family.spec.ts`: header
// discipline, inline auth, `--no-deps`, DOM assertions.
//
// THE CRITERION (D-12, bounded by `RULING-P98A2-01-SCOPE` F3 Reading B, amended by
// `RULING-P98A2-03` at `b5ba2ac37`): the Elected Officials type-guide popover renders — header,
// description and ALL FOUR sections resolved, no raw key, no empty section, both locales — through
// the SAME component path as its seven siblings. The five `dossier:` keys and the deletion of the
// `type !== 'elected_official' &&` guard in `DossierTypeStatsCard.tsx` land in the SAME change or
// not at all: guard-without-keys prints a raw key on screen; keys-without-guard are dead bytes.
//
// ORACLE POPULATION DEFINITION. Two things, both named:
//   (1) the RENDERED popover opened from `[data-testid="dossier-type-card-elected_official"]` on
//       /dossiers, desktop viewport, admin, both locale legs;
//   (2) a STATIC CENSUS of the five authored key paths in `frontend/src/i18n/{en,ar}/dossier.json`.
//
// THE CENSUS LIVES IN THIS SPEC, DELIBERATELY. 98-RESEARCH proposed cloning
// `scripts/check-copilot-i18n.mjs` scoped to the five paths. A second script would be a second
// thing to keep in step with the render assertions, and its EN/AR parity + non-empty + array-shape
// checks are exactly the assertions below. One file, one owner, one place to read what criterion 7
// requires.
//
// DESKTOP VIEWPORT IS REQUIRED, NOT PREFERRED. The help trigger is `hidden sm:inline-flex` by
// shipped design (`DossierTypeStatsCard.tsx` ~:176). Below `sm` it does not exist and this oracle
// would measure the breakpoint rather than the guard.
//
// GLYPH COHERENCE IS IN SCOPE (D-27). Deleting the guard makes `DossierTypeGuide.tsx` render a
// NINTH case whose switches have no arm for it: `getTypeIcon`'s `default:` (:78) returns
// `<Globe/>` — the COUNTRY glyph — and `getTypeColors`'s default (:136) is muted, while the stats
// card beside it maps EO to `<Crown/>`. Un-amended, criterion 7 was satisfiable with the wrong
// glyph. A criterion-7 green with a Globe or a muted popover is a FAIL, so this spec asserts the
// crown, the ABSENCE of a globe, and `text-primary` (the country/primary family — WR-07 verified:
// `semantic-colors.ts:84` is `dossierTypeColors[type] ?? dossierTypeColors.country!` and
// `elected_official` appears ZERO times in that map, so country/primary IS EO's canonical
// fallback today). Allocating EO its own colour family is OUT and stays out (D-28).
//
// WHY THE ASSERTIONS ARE PRESENCE ASSERTIONS AND NOT "NO RAW KEY". `DossierTypeGuide.tsx:162,165`
// call `t(key, '')` and the `Array.isArray` / `length > 0` guards at :224,241 make a missing
// section VANISH rather than leak. A raw-key detector returns CLEAN over a hollow guide. So each
// of the four sections is asserted PRESENT with a non-empty body, and every authored `examples`
// and `commonLinks` item is asserted RENDERED.
//
// THE EXPECTED PROSE COMES FROM THE BUNDLE, NOT FROM THIS FILE. The five values are authored by a
// later plan under the voice law; this spec asserts `rendered === bundle`, byte-for-byte, per
// locale. That is a stronger claim than pinning prose this file guessed: it proves the component
// reads the key rather than a literal, and it cannot go stale against a legitimate rewording.
//
// STATED EXCLUSIONS. NOTHING is asserted about the seven sibling types' section bodies. After this
// phase EO is the ONLY type with a full guide body; the siblings render header + description only.
// That asymmetry is the TRACKED STATE (`GUIDE-HOLLOW-01` → Phase 102), not a defect of this phase,
// and a spec that asserted sibling bodies would red a correct implementation. Also out: the
// trigger's `aria-label` `t('typeGuide.learnMore', 'Learn more about this type')`, which renders
// its inline English default in BOTH locales — that is the Phase 99 `AR-04a` silent-default class,
// recorded here (D-03) and swept there.
//
// LOCALE AND ROLE: both legs (`?lng=en`, `?lng=ar`), admin (TEST_USER_EMAIL). HEAD negative
// control: the EO trigger is ABSENT pre-fix, so the red→green flip proves this spec watches the
// guard and not merely the card.
//
// AUTHENTICATION: inline, --no-deps (E2ECRED-01 → P101). See 96-calendar-family.spec.ts.
import { test, expect, type Page } from '@playwright/test'
import LoginPage from './support/pages/LoginPage'
import enDossier from '../../frontend/src/i18n/en/dossier.json'
import arDossier from '../../frontend/src/i18n/ar/dossier.json'

const email = process.env.TEST_USER_EMAIL ?? ''
const password = process.env.TEST_USER_PASSWORD ?? ''

const SETTLE_TIMEOUT = 20_000

const EO_CARD = '[data-testid="dossier-type-card-elected_official"]'
const POPOVER = '[data-slot="popover-content"]'

/** A raw dotted key from either family criterion 7 touches. */
const RAW_KEY_TOKEN = /typeGuide\.|typeDescription\./

type Bundle = Record<string, unknown>

const BUNDLES: Readonly<Record<'en' | 'ar', Bundle>> = {
  en: enDossier as Bundle,
  ar: arDossier as Bundle,
}

/** Walks a dotted path through a bundle. Returns `undefined` for any miss. */
const resolvePath = (bundle: Bundle, path: string): unknown =>
  path.split('.').reduce<unknown>((node, segment) => {
    if (node === null || typeof node !== 'object') return undefined
    return (node as Record<string, unknown>)[segment]
  }, bundle)

const asString = (bundle: Bundle, path: string): string => {
  const value = resolvePath(bundle, path)
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`dossier.json: ${path} is missing or not a non-empty string`)
  }
  return value
}

const asArray = (bundle: Bundle, path: string): string[] => {
  const value = resolvePath(bundle, path)
  if (!Array.isArray(value)) throw new Error(`dossier.json: ${path} is missing or not an array`)
  return value as string[]
}

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

test.describe('criterion 7 — the elected-officials type guide renders', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('STATIC CENSUS: the five EO keys carry the shapes the component consumes, both locales', async () => {
    for (const locale of ['en', 'ar'] as const) {
      const bundle = BUNDLES[locale]

      // BOTH-POLARITY SELF-TEST of the census resolver, per locale: a known-present sibling path
      // resolves and a bogus path does not. Without it a resolver bug would report every path
      // missing and look like a finding.
      expect(
        typeof resolvePath(bundle, 'typeDescription.person'),
        `${locale}/dossier.json: control path typeDescription.person must resolve`,
      ).toBe('string')
      expect(
        resolvePath(bundle, 'typeDescription.zzNope'),
        `${locale}/dossier.json: bogus path must not resolve`,
      ).toBeUndefined()

      expect(
        typeof resolvePath(bundle, 'typeDescription.elected_official'),
        `${locale}/dossier.json: typeDescription.elected_official must be a string`,
      ).toBe('string')
      expect(
        (resolvePath(bundle, 'typeDescription.elected_official') as string | undefined)?.trim(),
        `${locale}/dossier.json: typeDescription.elected_official must be non-empty`,
      ).not.toBe('')

      expect(
        typeof resolvePath(bundle, 'typeGuide.elected_official.whenToUse'),
        `${locale}/dossier.json: typeGuide.elected_official.whenToUse must be a string`,
      ).toBe('string')
      expect(
        typeof resolvePath(bundle, 'typeGuide.elected_official.notFor'),
        `${locale}/dossier.json: typeGuide.elected_official.notFor must be a string`,
      ).toBe('string')

      const examples = resolvePath(bundle, 'typeGuide.elected_official.examples')
      expect(
        Array.isArray(examples),
        `${locale}/dossier.json: examples must be a JSON ARRAY — a string fails the ` +
          'Array.isArray guard and the section vanishes silently',
      ).toBe(true)
      expect(
        (examples as string[] | undefined)?.length,
        `${locale}/dossier.json: examples must hold 3-5 items (code renders slice(0, 5))`,
      ).toBeGreaterThanOrEqual(3)
      expect((examples as string[]).length).toBeLessThanOrEqual(5)

      const commonLinks = resolvePath(bundle, 'typeGuide.elected_official.commonLinks')
      expect(
        Array.isArray(commonLinks),
        `${locale}/dossier.json: commonLinks must be a JSON ARRAY`,
      ).toBe(true)
      expect(
        (commonLinks as string[] | undefined)?.length,
        `${locale}/dossier.json: commonLinks must hold 3-4 items (code renders slice(0, 4))`,
      ).toBeGreaterThanOrEqual(3)
      expect((commonLinks as string[]).length).toBeLessThanOrEqual(4)
    }
  })

  for (const locale of ['en', 'ar'] as const) {
    test(`the EO popover renders header, description and all four sections [${locale}]`, async ({
      page,
    }) => {
      await signInInline(page)
      await page.goto(`/dossiers?lng=${locale}`)

      const card = page.locator(EO_CARD)
      await expect(card).toBeVisible({ timeout: SETTLE_TIMEOUT })

      // THE HEAD NEGATIVE CONTROL. Pre-fix `DossierTypeStatsCard.tsx` withholds the trigger behind
      // `type !== 'elected_official' &&`, so this is the assertion that reds at HEAD. The card
      // renders exactly one <button>: the help trigger.
      const trigger = card.locator('button')
      await expect(
        trigger,
        'the EO stats card renders no help trigger — the render guard is still in place',
      ).toHaveCount(1)
      await trigger.click()

      const popover = page.locator(POPOVER)
      await expect(popover).toBeVisible({ timeout: SETTLE_TIMEOUT })

      const bundle = BUNDLES[locale]
      const typeTitle = asString(bundle, `type.elected_official`)
      const description = asString(bundle, 'typeDescription.elected_official')
      const whenToUse = asString(bundle, 'typeGuide.elected_official.whenToUse')
      const notFor = asString(bundle, 'typeGuide.elected_official.notFor')
      const examples = asArray(bundle, 'typeGuide.elected_official.examples')
      const commonLinks = asArray(bundle, 'typeGuide.elected_official.commonLinks')

      // (a) header title
      await expect(popover.locator('h4'), `popover header title [${locale}]`).toHaveText(typeTitle)

      // (b) + (c) glyph coherence — crown, no globe, on the country/primary family
      const crown = popover.locator('svg[class*="lucide-crown"]')
      await expect(crown, `popover renders no Crown glyph [${locale}]`).toHaveCount(1)
      await expect(
        popover.locator('svg[class*="lucide-globe"]'),
        `popover renders the COUNTRY glyph for elected_official [${locale}]`,
      ).toHaveCount(0)
      const crownClass = (await crown.getAttribute('class')) ?? ''
      expect(
        crownClass,
        `popover header glyph is not on the country/primary family (D-27/WR-07) [${locale}]`,
      ).toContain('text-primary')

      // (d) description, byte-for-byte against the bundle
      await expect(
        popover.locator('h4 + p'),
        `popover description [${locale}]`,
      ).toHaveText(description)

      const popoverText = (await popover.innerText()) ?? ''

      // (e) all FOUR sections PRESENT with non-empty bodies. Presence, not absence-of-key: the
      // silent-default guards make a missing section vanish rather than leak.
      expect(popoverText, `whenToUse label [${locale}]`).toContain(asString(bundle, 'typeGuide.whenToUse'))
      expect(popoverText, `whenToUse body [${locale}]`).toContain(whenToUse)
      expect(popoverText, `examples label [${locale}]`).toContain(asString(bundle, 'typeGuide.examples'))
      expect(popoverText, `commonLinks label [${locale}]`).toContain(
        asString(bundle, 'typeGuide.commonLinks'),
      )
      expect(popoverText, `notFor label [${locale}]`).toContain(asString(bundle, 'typeGuide.notFor'))
      expect(popoverText, `notFor body [${locale}]`).toContain(notFor)

      const badges = popover.locator('[data-slot="badge"]')
      expect(
        await badges.count(),
        `examples section renders no Badge chip [${locale}]`,
      ).toBeGreaterThanOrEqual(1)
      for (const example of examples.slice(0, 5)) {
        expect(popoverText, `example chip "${example}" not rendered [${locale}]`).toContain(example)
      }

      const linkRows = popover.locator('li')
      expect(
        await linkRows.count(),
        `commonLinks section renders no row [${locale}]`,
      ).toBeGreaterThanOrEqual(1)
      for (const link of commonLinks.slice(0, 4)) {
        expect(popoverText, `common link "${link}" not rendered [${locale}]`).toContain(link)
      }

      // (f) no raw key anywhere in the popover
      expect(popoverText, `popover leaks a raw key [${locale}]`).not.toMatch(RAW_KEY_TOKEN)
    })
  }
})
