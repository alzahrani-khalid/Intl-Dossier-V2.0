---
phase: 33-token-engine
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/package.json
  - frontend/src/index.css
  - frontend/tests/e2e/heroui-smoke.spec.ts
autonomous: true
requirements: [TOKEN-04]
must_haves:
  truths:
    - '@heroui/react and @heroui/styles are in package.json'
    - 'index.css has ''@plugin "@heroui/styles"'' after ''@import "tailwindcss"'' and BEFORE the @theme {} block'
    - "A raw <Button color='primary'> renders using var(--accent) and auto-follows direction/mode/hue changes"
  artifacts:
    - path: 'frontend/src/index.css'
      provides: 'HeroUI v3 CSS-native theme config'
    - path: 'frontend/package.json'
      provides: 'HeroUI dependencies'
  key_links:
    - from: 'frontend/src/index.css'
      to: ':root tokens written by DesignProvider'
      via: '--heroui-primary: var(--accent) chain'
      pattern: '--heroui-primary'
---

# Plan 33-04: HeroUI v3 Install + CSS-Native Theme Config

**Phase:** 33 (token-engine)
**Wave:** 1
**Depends on:** none (but Plans 33-05, 33-06, 33-08 depend on THIS)
**Type:** install + config
**TDD:** false
**Estimated effort:** S (1.5–2 h)

## Goal

Install `@heroui/react` + `@heroui/styles`, wire HeroUI v3's semantic colors (`primary`, `danger`, `success`, `warning`, `default`) to our token vars (`--accent`, `--danger`, `--ok`, `--warn`, `--surface`) via CSS `@plugin` + `--heroui-*` overrides in `frontend/src/index.css`. Confirm a raw HeroUI `<Button color="primary">` renders with `var(--accent)` and auto-updates when any of `direction/mode/hue` change.

**Critical correction applied**: D-06 originally specified `frontend/heroui.config.ts`. Per RESEARCH.md Q1, HeroUI v3 has NO such file — theme config lives exclusively in CSS. This plan does NOT create `heroui.config.ts`.

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/33-token-engine/33-CONTEXT.md
@.planning/phases/33-token-engine/33-RESEARCH.md
@CLAUDE.md
@frontend/package.json
@frontend/src/index.css
@frontend/tailwind.config.ts

<interfaces>
<!-- Plan 33-04 does NOT produce new TS types. It adds CSS + package deps only.
     The downstream consumer in Plan 33-05 imports from @heroui/react. -->
</interfaces>
</context>

## Files to create / modify

| Path                                      | Action | Notes                                                                                                                                                |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/package.json`                   | modify | Add `@heroui/react` + `@heroui/styles` to `dependencies`                                                                                             |
| `frontend/src/index.css`                  | modify | Insert `@plugin '@heroui/styles'` AFTER `@import 'tailwindcss'` and BEFORE any `@theme` block; add `:root { --heroui-* : var(--*) }` semantic bridge |
| `frontend/tests/e2e/heroui-smoke.spec.ts` | create | Playwright smoke: `<Button color="primary">` has computed background matching `var(--accent)`                                                        |

**No `heroui.config.ts` is created.** HeroUI v3 uses CSS-native config — this is the architecturally correct idiom for v3.

## Implementation steps

1. **Install packages**:

   ```bash
   pnpm --filter frontend add @heroui/react @heroui/styles
   ```

   Verify `frontend/package.json` shows both under `dependencies`. Confirm peer deps resolve cleanly (React 19, Tailwind v4 already present). If the install warns about React 19 peer compat, verify against HeroUI v3 latest release notes — v3 announced React 19 support.

2. **Wire `index.css`** — edits to `frontend/src/index.css`:

   Ordering is critical (RESEARCH Gotcha #8): `@import` → `@plugin` → `@theme` → `:root` remaps.

   ```css
   /* Line 10 (existing) */
   @import 'tailwindcss';

   /* NEW: line 11 — load HeroUI's Tailwind v4 plugin */
   @plugin '@heroui/styles';

   /* Existing @config kept or removed per Plan 33-06 */
   @config "../tailwind.config.ts";

   /* @theme block populated in Plan 33-06 */
   /* @theme { … } */

   /* NEW: HeroUI v3 semantic bridge — these vars are read by every HeroUI primitive */
   :root {
     --heroui-primary: var(--accent);
     --heroui-primary-foreground: var(--accent-fg);
     --heroui-default: var(--surface);
     --heroui-default-foreground: var(--ink);
     --heroui-success: var(--ok);
     --heroui-success-foreground: var(--accent-fg);
     --heroui-warning: var(--warn);
     --heroui-warning-foreground: var(--accent-fg);
     --heroui-danger: var(--danger);
     --heroui-danger-foreground: var(--accent-fg);
   }

   /* Chancery-light fallback values for :root so CSS renders even when localStorage is empty
      (defense-in-depth — Plan 33-03's inline script usually populates these first) */
   :root {
     --bg: /* chancery.light.bg literal */;
     --surface: /* chancery.light.surface literal */;
     /* …minimum-viable set matching the inline bootstrap */
   }
   ```

3. **Dark-class strategy check**: Confirm `frontend/tailwind.config.ts` has `darkMode: ['class']` (or equivalent). RESEARCH Q1 confirms HeroUI v3 also responds to `[data-theme="dark"]`. DesignProvider (33-02) toggles `.dark` on `<html>` — so no extra config needed here. Leave tailwind config alone.

4. **Smoke E2E** — `frontend/tests/e2e/heroui-smoke.spec.ts`:

   ```ts
   import { test, expect } from '@playwright/test'
   import { Button } from '@heroui/react' // ensure bundler resolves

   test('HeroUI Button primary background matches --accent', async ({ page }) => {
     await page.goto('/heroui-smoke') // a temporary route with a raw <Button color="primary">Test</Button>
     const rgbFromButton = await page.evaluate(() => {
       const btn = document.querySelector('button[data-slot="button"]')
       return getComputedStyle(btn!).backgroundColor
     })
     const oklchFromRoot = await page.evaluate(() =>
       getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
     )
     expect(oklchFromRoot).toContain('oklch')
     // Color match verified via oklch→rgb roundtrip or by changing hue and asserting bg changes:
     await page.evaluate(() =>
       document.documentElement.style.setProperty('--accent', 'oklch(58% 0.14 250)'),
     )
     await page.waitForTimeout(16) // one paint frame
     const rgbAfter = await page.evaluate(
       () =>
         getComputedStyle(document.querySelector('button[data-slot="button"]')!).backgroundColor,
     )
     expect(rgbAfter).not.toBe(rgbFromButton) // changed
   })
   ```

   The temp `/heroui-smoke` route is created inline (remove in Plan 33-08 when Storybook replaces it, or keep as a dev-only route).

5. **Remove temp route on completion** OR convert to dev-only `if (import.meta.env.DEV)` guard.

## Definition of done

- [ ] `@heroui/react` and `@heroui/styles` in `frontend/package.json` dependencies
- [ ] `pnpm --filter frontend install` succeeds with no peer-dep errors
- [ ] `frontend/src/index.css` has `@plugin '@heroui/styles'` line AFTER `@import 'tailwindcss'` and BEFORE any `@theme` / `:root` blocks
- [ ] `:root { --heroui-primary: var(--accent); … }` bridge present
- [ ] `frontend/heroui.config.ts` does NOT exist (explicit confirmation: `test ! -f frontend/heroui.config.ts`)
- [ ] Smoke E2E passes: raw `<Button color="primary">` bg matches `var(--accent)` and changes when `--accent` is mutated at runtime
- [ ] `pnpm --filter frontend build` produces a bundle with HeroUI tree-shaken correctly (check bundle size delta ≤ +80 KB gzip; report actual)
- [ ] `pnpm --filter frontend dev` — mount the temp route, manually toggle `.dark` on `<html>`, confirm button color flips correctly
- [ ] RTL smoke: toggle `dir="rtl"`, confirm button still renders at correct position (no mirror issues)

## Requirements satisfied

- TOKEN-04 (partial — HeroUI side; Tailwind side completed in 33-06)

## Success Criteria contribution

- SC-5 (partial): HeroUI v3 primitives now consume `var(--accent)` / `var(--danger)` / `var(--ok)` / `var(--warn)` / `var(--surface)` via the `--heroui-*` bridge. Per-component overrides still forbidden; proven by 33-05 tests.

## Risks / unknowns

- **HeroUI v3 beta churn**: version might change `--heroui-*` var names between minor releases. Mitigation: pin exact version in `package.json` (use `@heroui/react@3.x.x` not `^3.x.x`) — document pin rationale in SUMMARY. Re-verify on upgrade.
- **`@plugin` ordering breakage**: If `@plugin` comes AFTER `@theme`, Tailwind v4 may not regenerate utilities. Plan 33-06 must respect the ordering contract.
- **No first-party Storybook + HeroUI v3 recipe** (RESEARCH Q6): if 33-08 hits issues, they're isolated to Storybook config, not this plan.

## Verification

```bash
pnpm --filter frontend add @heroui/react @heroui/styles
pnpm --filter frontend install
grep -n '@plugin' frontend/src/index.css  # must show '@plugin '\''@heroui/styles'\''' before any @theme
test ! -f frontend/heroui.config.ts && echo "correct: no heroui.config.ts"
pnpm --filter frontend test:e2e heroui-smoke
pnpm --filter frontend build
# Bundle size delta
du -sh frontend/dist/assets/*.js | sort -h
```
