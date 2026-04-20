// @covers TOKEN-01..TOKEN-06 / SC-1..SC-5 (Plan 33-09)
/**
 * Phase 33 Success-Criteria E2E — Plan 33-09 (Nyquist validation layer).
 *
 * Asserts each of the 5 SCs in the phase goal holds on an actual rendered page:
 *   SC-1 — setDirection updates every surface/ink/accent/line CSS var on :root
 *          without reload.
 *   SC-2 — mode toggle flips OKLCH math (accent-ink L: 42%↔72%; accent-soft
 *          C: 0.05↔0.08) and semantic palettes use dark variants.
 *   SC-3 — hue picker recomputes --accent, --accent-ink, --accent-soft,
 *          --accent-fg, --sla-ok, --sla-risk (hue+55°%360); --sla-bad stays
 *          red-locked at 25°.
 *   SC-4 — density switch updates --row-h, --pad-inline, --pad-block, --gap;
 *          logical property names survive a dir="rtl" flip.
 *   SC-5 — HeroUI's primary and Tailwind's accent probe elements resolve to
 *          the SAME backgroundColor — proving both engines consume the same
 *          live --accent (33-04 @plugin + 33-06 @theme bridge).
 *
 * Uses `base` (no storageState) so the suite runs pre-auth. DesignProvider is
 * mounted above the router in `App.tsx` (33-02), so `window.__design` is
 * available regardless of whether `/` redirects to `/login`.
 *
 * Plan deviation (path): plan 33-09 spec'd `frontend/tests/e2e/` but the root
 * `playwright.config.ts` has `testDir: './tests/e2e'`. Matches 33-03's FOUC-
 * spec deviation — both under the same documented reason.
 */
import { test as base, expect, type Page } from '@playwright/test'

// ----------------------------------------------------------------------------
// Type-only augmentation for the DEV/test-only `window.__design` hatch exposed
// by DesignProvider (33-09 Task 1). Not shipped in prod bundles.
// ----------------------------------------------------------------------------
type Direction = 'chancery' | 'situation' | 'ministerial' | 'bureau'
type Mode = 'light' | 'dark'
type Density = 'comfortable' | 'compact' | 'dense'

declare global {
  interface Window {
    __design?: {
      setDirection: (d: Direction) => void
      setMode: (m: Mode) => void
      setHue: (h: number) => void
      setDensity: (d: Density) => void
    }
  }
}

// ----------------------------------------------------------------------------
// Read a :root CSS custom property's raw token string (not the computed color).
// ----------------------------------------------------------------------------
async function readVar(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name,
  )
}

// Wait until DesignProvider has attached `window.__design`. Handles the gap
// between `domcontentloaded` (FOUC bootstrap done) and React hydration.
async function waitForHatch(page: Page): Promise<void> {
  await page.waitForFunction(() => typeof window.__design !== 'undefined', undefined, {
    timeout: 10_000,
  })
}

base.describe('Phase 33 Success Criteria (SC-1..SC-5)', () => {
  base.use({ storageState: { cookies: [], origins: [] } })

  base.beforeEach(async ({ page }) => {
    // Clear persisted design prefs so every test starts from Chancery-light /
    // hue=22 / comfortable — avoids cross-test state bleed.
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('id.dir')
        localStorage.removeItem('id.theme')
        localStorage.removeItem('id.hue')
        localStorage.removeItem('id.density')
      } catch {
        /* ignore */
      }
    })
    await page.goto('/')
    await waitForHatch(page)
  })

  base('SC-1: setDirection updates every token var without reload', async ({ page }) => {
    // Baseline = chancery (beforeEach wiped stored prefs).
    const keys = ['--bg', '--surface', '--ink', '--line', '--accent', '--sidebar-bg'] as const
    const before: Record<string, string> = {}
    for (const k of keys) before[k] = await readVar(page, k)

    await page.evaluate(() => window.__design!.setDirection('situation'))
    // 2 rAFs + localStorage flush — DesignProvider's useEffect runs synchronously
    // after state commit, but `waitForFunction` keyed on one var gives us a hard
    // signal instead of a fixed-duration sleep.
    await page.waitForFunction(
      (prev) =>
        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() !== prev,
      before['--bg'],
      { timeout: 2_000 },
    )

    const after: Record<string, string> = {}
    for (const k of keys) after[k] = await readVar(page, k)

    for (const k of keys) {
      expect(after[k], `var ${k} should change after setDirection('situation')`).not.toBe(
        before[k],
      )
      expect(after[k], `var ${k} should still resolve to a non-empty value`).not.toBe('')
    }
  })

  base('SC-2: mode toggle flips OKLCH math (accent-ink L, accent-soft C)', async ({ page }) => {
    await page.evaluate(() => {
      window.__design!.setMode('light')
      window.__design!.setHue(22)
    })
    await page.waitForFunction(
      () =>
        getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').includes('42%'),
      undefined,
      { timeout: 2_000 },
    )

    const lightInk = await readVar(page, '--accent-ink')
    const lightSoft = await readVar(page, '--accent-soft')
    const lightDanger = await readVar(page, '--danger')

    // Light: accent-ink = oklch(42% 0.15 h); accent-soft = oklch(92% 0.05 h).
    expect(lightInk).toContain('42%')
    expect(lightInk).toContain('0.15')
    expect(lightSoft).toContain('92%')
    expect(lightSoft).toContain('0.05')
    // Light danger uses 52% lightness (vs 70% for dark).
    expect(lightDanger).toContain('52%')

    await page.evaluate(() => window.__design!.setMode('dark'))
    await page.waitForFunction(
      () =>
        getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').includes('72%'),
      undefined,
      { timeout: 2_000 },
    )

    const darkInk = await readVar(page, '--accent-ink')
    const darkSoft = await readVar(page, '--accent-soft')
    const darkDanger = await readVar(page, '--danger')

    // Dark: accent-ink = oklch(72% 0.12 h); accent-soft = oklch(25% 0.08 h).
    expect(darkInk).toContain('72%')
    expect(darkInk).toContain('0.12')
    expect(darkSoft).toContain('25%')
    expect(darkSoft).toContain('0.08')
    // Dark danger uses 70% lightness (explicit variant, not just "not light").
    expect(darkDanger).toContain('70%')

    // .dark class must flip on <html> so HeroUI v3 / Tailwind `dark:` variants
    // see the mode change (RESEARCH Q1).
    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark'),
    )
    expect(hasDarkClass).toBe(true)
  })

  base('SC-3: hue recomputes accent family + sla-risk; sla-bad stays red-locked', async ({
    page,
  }) => {
    // Pin mode=light so danger/sla variants are deterministic across runs.
    await page.evaluate(() => window.__design!.setMode('light'))

    // hue = 100 → sla-risk hue = 155.
    await page.evaluate(() => window.__design!.setHue(100))
    await page.waitForFunction(
      () => getComputedStyle(document.documentElement).getPropertyValue('--accent').includes('100'),
      undefined,
      { timeout: 2_000 },
    )
    const accent100 = await readVar(page, '--accent')
    const slaRisk100 = await readVar(page, '--sla-risk')
    const slaBad100 = await readVar(page, '--sla-bad')
    expect(accent100).toBe('oklch(58% 0.14 100)')
    expect(slaRisk100).toContain('155')
    // --sla-bad is red-locked at hue 25.
    expect(slaBad100).toContain(' 25)')

    // hue = 250 → sla-risk hue = 305.
    await page.evaluate(() => window.__design!.setHue(250))
    await page.waitForFunction(
      () => getComputedStyle(document.documentElement).getPropertyValue('--accent').includes('250'),
      undefined,
      { timeout: 2_000 },
    )
    const accent250 = await readVar(page, '--accent')
    const slaRisk250 = await readVar(page, '--sla-risk')
    const slaBad250 = await readVar(page, '--sla-bad')
    expect(accent250).toBe('oklch(58% 0.14 250)')
    expect(slaRisk250).toContain('305')
    // sla-bad string is stable across hue changes (hue-locked at 25).
    expect(slaBad250).toBe(slaBad100)

    // hue = 340 → wrap-around: sla-risk hue = 35.
    await page.evaluate(() => window.__design!.setHue(340))
    await page.waitForFunction(
      () => getComputedStyle(document.documentElement).getPropertyValue('--accent').includes('340'),
      undefined,
      { timeout: 2_000 },
    )
    const slaRiskWrap = await readVar(page, '--sla-risk')
    expect(slaRiskWrap).toContain(' 35)')
  })

  base('SC-4: density updates row-h/pad-inline/pad-block/gap; logical props survive RTL', async ({
    page,
  }) => {
    const densities = [
      { name: 'comfortable' as const, rowH: '52px', padInline: '20px', padBlock: '16px', gap: '12px' },
      { name: 'compact' as const, rowH: '40px', padInline: '14px', padBlock: '12px', gap: '8px' },
      { name: 'dense' as const, rowH: '32px', padInline: '10px', padBlock: '8px', gap: '6px' },
    ]

    for (const { name, rowH, padInline, padBlock, gap } of densities) {
      await page.evaluate((n) => window.__design!.setDensity(n), name)
      await page.waitForFunction(
        (expected) =>
          getComputedStyle(document.documentElement).getPropertyValue('--row-h').trim() === expected,
        rowH,
        { timeout: 2_000 },
      )

      expect(await readVar(page, '--row-h')).toBe(rowH)
      expect(await readVar(page, '--pad-inline')).toBe(padInline)
      expect(await readVar(page, '--pad-block')).toBe(padBlock)
      expect(await readVar(page, '--gap')).toBe(gap)
    }

    // RTL flip: logical properties must still resolve. Inject a probe with
    // padding-inline-start/end and confirm it maps to the right physical edge
    // under dir="rtl".
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl')
      const probe = document.createElement('div')
      probe.id = '__rtl_probe'
      probe.style.paddingInlineStart = 'var(--pad-inline)'
      probe.style.paddingInlineEnd = '0px'
      probe.style.width = '100px'
      document.body.appendChild(probe)
    })

    // Under dir="rtl", padding-inline-start maps to padding-right.
    const probeRect = await page.evaluate(() => {
      const el = document.getElementById('__rtl_probe')!
      const cs = getComputedStyle(el)
      return {
        paddingLeft: cs.paddingLeft,
        paddingRight: cs.paddingRight,
      }
    })
    // dense = 10px; the last iteration of the loop above left density=dense.
    expect(probeRect.paddingRight).toBe('10px')
    expect(probeRect.paddingLeft).toBe('0px')

    // Reset direction so later tests (if any) see LTR baseline.
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'ltr'))
  })

  base('SC-5: HeroUI and Tailwind probes resolve to the same live --accent', async ({ page }) => {
    // Pin mode + hue so both probes resolve deterministically.
    await page.evaluate(() => {
      window.__design!.setMode('light')
      window.__design!.setHue(180)
    })
    await page.waitForFunction(
      () => getComputedStyle(document.documentElement).getPropertyValue('--accent').includes('180'),
      undefined,
      { timeout: 2_000 },
    )

    // Inject two probe elements:
    //   - Tailwind probe uses var(--color-accent) (the @theme bridge from 33-06)
    //   - HeroUI probe uses var(--color-primary) (the @plugin bridge from 33-04)
    // Both should resolve through to var(--accent) and compute to the same rgb().
    // Using inline styles avoids dependence on Tailwind JIT picking up class
    // names injected at runtime.
    await page.evaluate(() => {
      const tw = document.createElement('div')
      tw.id = '__tw_probe'
      tw.style.background = 'var(--color-accent)'
      tw.style.width = '10px'
      tw.style.height = '10px'
      document.body.appendChild(tw)

      const hero = document.createElement('div')
      hero.id = '__heroui_probe'
      hero.style.background = 'var(--color-primary)'
      hero.style.width = '10px'
      hero.style.height = '10px'
      document.body.appendChild(hero)

      const accent = document.createElement('div')
      accent.id = '__accent_probe'
      accent.style.background = 'var(--accent)'
      accent.style.width = '10px'
      accent.style.height = '10px'
      document.body.appendChild(accent)
    })

    const [twBg, heroBg, accentBg] = await page.evaluate(() => {
      const read = (id: string): string =>
        getComputedStyle(document.getElementById(id)!).backgroundColor
      return [read('__tw_probe'), read('__heroui_probe'), read('__accent_probe')]
    })

    // All three must render identically (the whole point of SC-5).
    expect(twBg, 'Tailwind --color-accent should resolve to the same rgb as --accent').toBe(
      accentBg,
    )
    expect(heroBg, 'HeroUI --color-primary should resolve to the same rgb as --accent').toBe(
      accentBg,
    )
    expect(twBg, 'Tailwind bg-accent ≡ HeroUI bg-primary (SC-5 invariant)').toBe(heroBg)
    // Guard against a "both resolved to transparent" false positive.
    expect(twBg).not.toBe('rgba(0, 0, 0, 0)')
    expect(twBg).not.toBe('')
  })
})
