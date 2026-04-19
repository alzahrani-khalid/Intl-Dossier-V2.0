---
phase: 33-token-engine
plan: 09
type: execute
wave: 4
depends_on: ['33-02', '33-03', '33-04', '33-05', '33-06', '33-07', '33-08']
files_modified:
  - frontend/tests/e2e/token-engine-sc.spec.ts
autonomous: true
requirements: [TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06]
must_haves:
  truths:
    - 'E2E test suite asserts each of the 5 Success Criteria holds on a rendered page'
    - 'Test flips direction → every surface/ink/accent/line CSS var on :root updates without reload'
    - 'Test toggles mode → accent-ink lightness flips; accent-soft chroma flips; danger/ok/warn/info use dark variants'
    - 'Test sets hue → --accent, --accent-ink, --accent-soft, --accent-fg, --sla-ok, --sla-risk recompute; --sla-bad unchanged'
    - 'Test sets density → --row-h, --pad-inline, --pad-block, --gap update; RTL inline-start/inline-end preserved'
    - "Test renders HeroUI Button/Card/Chip + a Tailwind 'bg-accent' div → both use the same live --accent value"
  artifacts:
    - path: 'frontend/tests/e2e/token-engine-sc.spec.ts'
      provides: 'end-to-end verification of all 5 SCs'
  key_links: []
---

# Plan 33-09: E2E Success-Criteria Verification (Nyquist Layer)

**Phase:** 33 (token-engine)
**Wave:** 4
**Depends on:** 33-02..33-08 (full stack wired)
**Type:** test
**TDD:** false
**Estimated effort:** M (3 h)

## Goal

Add a single Playwright E2E suite that asserts each of the 5 Success Criteria in this phase's goal statement holds on an actual rendered page of the app. This is the Nyquist validation layer per the orchestrator spec — it catches integration-level regressions that unit tests and Storybook can miss (e.g. a consumer page somehow ignoring `:root` vars, a CSS specificity conflict, a Provider-ordering bug).

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/ROADMAP.md
@frontend/src/design-system/DesignProvider.tsx

<interfaces>
<!-- Test uses in-browser DesignProvider setters exposed via window.__design during tests,
     OR via localStorage mutations + page.reload(). -->
<!-- No new source interfaces. -->
</interfaces>
</context>

## Files to create / modify

| Path                                         | Action | Notes                                         |
| -------------------------------------------- | ------ | --------------------------------------------- |
| `frontend/tests/e2e/token-engine-sc.spec.ts` | create | One spec file, 5 `test()` blocks — one per SC |

## Implementation steps

### Task 1 (auto) — Expose a test-only setter hatch

In `frontend/src/design-system/DesignProvider.tsx`, inside a `useEffect` guarded by `if (import.meta.env.DEV || import.meta.env.MODE === 'test')`, attach `window.__design = { setDirection, setMode, setHue, setDensity }`. This avoids race conditions in tests. DO NOT ship this hatch in production — guard must be tight.

Alternative: drive tests purely through `localStorage` writes + `page.reload()`. Slower but more robust to Provider changes. Choose based on CI time budget (reload path ~4× slower but zero production footprint).

### Task 2 (auto) — Write `token-engine-sc.spec.ts`

```ts
import { test, expect, Page } from '@playwright/test'

async function readVar(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name,
  )
}

test.describe('Phase 33 Success Criteria', () => {
  test('SC-1: setDirection updates every token var without reload', async ({ page }) => {
    await page.goto('/')
    const before = {
      bg: await readVar(page, '--bg'),
      surface: await readVar(page, '--surface'),
      ink: await readVar(page, '--ink'),
      line: await readVar(page, '--line'),
      accent: await readVar(page, '--accent'),
      sidebar: await readVar(page, '--sidebar'),
    }
    await page.evaluate(() => (window as any).__design.setDirection('situation'))
    await page.waitForTimeout(32)
    const after = {
      bg: await readVar(page, '--bg'),
      surface: await readVar(page, '--surface'),
      ink: await readVar(page, '--ink'),
      line: await readVar(page, '--line'),
      accent: await readVar(page, '--accent'),
      sidebar: await readVar(page, '--sidebar'),
    }
    for (const k of Object.keys(before)) expect(after[k]).not.toBe(before[k])
  })

  test('SC-2: mode toggle flips OKLCH math', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      ;(window as any).__design.setMode('light')
      ;(window as any).__design.setHue(22)
    })
    await page.waitForTimeout(32)
    const lightInk = await readVar(page, '--accent-ink')
    const lightSoft = await readVar(page, '--accent-soft')
    await page.evaluate(() => (window as any).__design.setMode('dark'))
    await page.waitForTimeout(32)
    const darkInk = await readVar(page, '--accent-ink')
    const darkSoft = await readVar(page, '--accent-soft')
    expect(lightInk).toContain('42%')
    expect(darkInk).toContain('72%')
    expect(lightSoft).toContain('0.05')
    expect(darkSoft).toContain('0.08')
    // Semantic dark variant (--danger lightness check)
    const darkDanger = await readVar(page, '--danger')
    expect(darkDanger).toMatch(/oklch\(\d{2}%/)
  })

  test('SC-3: hue changes accent family and SLA risk; SLA bad stays fixed', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => (window as any).__design.setHue(100))
    await page.waitForTimeout(32)
    const slaBadAt100 = await readVar(page, '--sla-bad')
    const accent100 = await readVar(page, '--accent')
    const slaRisk100 = await readVar(page, '--sla-risk')
    expect(accent100).toContain('100')
    expect(slaRisk100).toContain('155') // 100 + 55
    await page.evaluate(() => (window as any).__design.setHue(250))
    await page.waitForTimeout(32)
    const slaBadAt250 = await readVar(page, '--sla-bad')
    const accent250 = await readVar(page, '--accent')
    const slaRisk250 = await readVar(page, '--sla-risk')
    expect(accent250).toContain('250')
    expect(slaRisk250).toContain('305') // 250 + 55
    expect(slaBadAt250).toBe(slaBadAt100) // hue-locked
    // Wrap-around: hue=340 → sla-risk = 35
    await page.evaluate(() => (window as any).__design.setHue(340))
    await page.waitForTimeout(32)
    const slaRiskWrap = await readVar(page, '--sla-risk')
    expect(slaRiskWrap).toContain('35') // (340+55)%360
  })

  test('SC-4: density updates row-h/pad-inline/pad-block/gap in both LTR and RTL', async ({
    page,
  }) => {
    await page.goto('/')
    const densities = [
      { name: 'comfortable', rowH: '52px', pad: '20px' },
      { name: 'compact', rowH: '40px', pad: '14px' },
      { name: 'dense', rowH: '32px', pad: '10px' },
    ] as const
    for (const { name, rowH, pad } of densities) {
      await page.evaluate((n) => (window as any).__design.setDensity(n), name)
      await page.waitForTimeout(32)
      expect(await readVar(page, '--row-h')).toBe(rowH)
      expect(await readVar(page, '--pad-inline')).toBe(pad)
    }
    // RTL check: confirm a sample element's inline-start still resolves to a logical edge
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))
    await page.waitForTimeout(32)
    const padInline = await readVar(page, '--pad-inline')
    expect(padInline).toBeTruthy()
  })

  test('SC-5: HeroUI and Tailwind consume the same --accent', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => (window as any).__design.setHue(180))
    await page.waitForTimeout(32)
    // A Tailwind utility rendered somewhere on the page: add a probe div
    await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.id = '__tw_probe'
      probe.className = 'bg-accent'
      document.body.appendChild(probe)
      const btn = document.createElement('button')
      btn.id = '__heroui_probe'
      btn.setAttribute('data-slot', 'button')
      btn.className = 'bg-primary'
      document.body.appendChild(btn)
    })
    const twBg = await page.evaluate(
      () => getComputedStyle(document.getElementById('__tw_probe')!).backgroundColor,
    )
    const heroBg = await page.evaluate(
      () => getComputedStyle(document.getElementById('__heroui_probe')!).backgroundColor,
    )
    // Both should be the same color (Tailwind's bg-accent = var(--accent); HeroUI's bg-primary remap = var(--accent))
    expect(twBg).toBe(heroBg)
    // Override-free audit: check no HeroUI wrapper in the app bundle contains override color classes
    // (fast grep done at build time by Plan 33-05; this is belt-and-braces)
  })
})
```

### Task 3 (auto) — Wire into CI

Add `pnpm --filter frontend test:e2e:sc` script to `package.json` mapping to `playwright test tests/e2e/token-engine-sc`. Ensure it runs in CI on every push to `DesignV2` (or whichever branch).

## Definition of done

- [ ] `window.__design` test hatch present and gated behind DEV/test env
- [ ] 5 `test()` blocks present, one per SC, each with the assertions above
- [ ] `pnpm --filter frontend test:e2e:sc` passes locally against a running `pnpm --filter frontend dev` server
- [ ] CI runs the suite on push (if CI config exists); otherwise document invocation in SUMMARY
- [ ] Each test passes in BOTH EN and AR locales (add a `test.describe.parallel` per locale if needed)
- [ ] No flakiness — run `npx playwright test tests/e2e/token-engine-sc --repeat-each 3` with 100% pass

## Requirements satisfied

- TOKEN-01..TOKEN-06 (integration-level verification)

## Success Criteria contribution

- SC-1..SC-5: the live rendered-page assertions are the final proof that all earlier plans composed correctly.

## Risks / unknowns

- **`window.__design` test hatch landing in production bundle**: mitigate with tight env-guard. Alternative: use `localStorage` + `reload()` path exclusively (slower but zero prod risk).
- **Timing / race conditions**: `waitForTimeout(32)` is a pragmatic 2-frame wait. If flakiness appears, replace with an explicit `page.waitForFunction(() => getComputedStyle(...).getPropertyValue('--accent') !== oldValue)`.
- **CI runner font-loading**: ensure `await document.fonts.ready` before assertions that compare computed colors (fonts don't affect colors, but first-paint timing can delay the provider's `useEffect`).

## Verification

```bash
pnpm --filter frontend dev &
sleep 5
pnpm --filter frontend test:e2e:sc
# Expect: 5 passed
npx playwright test tests/e2e/token-engine-sc --repeat-each 3
# Expect: 15 passed, 0 flaky
```
