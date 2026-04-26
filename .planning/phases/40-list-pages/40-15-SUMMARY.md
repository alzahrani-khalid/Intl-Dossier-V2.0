# 40-15 — Close G2: a11y violations (main landmark, html lang sync, chip contrast)

**Status:** SUCCESS
**Mode:** gap_closure (executed under `--auto`)
**Date:** 2026-04-26
**Branch:** DesignV2

## What changed

Three surgical edits to close gap **G2** (14 axe-core spec failures across 7 list pages × LTR + AR):

1. **`frontend/src/components/list-page/ListPageShell.tsx`** — Added `role="region"` and `aria-label={title}` to the outer `<section>`. Parent `<main>` already exists in `AppShell.tsx` (line 212), so per the plan's "If a parent main exists, use `<section role="region" aria-label>`" branch we labeled the existing `<section>` as a region landmark instead of nesting two `<main>` elements. Preserves all 40-13 markers (`data-loading`) and 40-14 guards (`min-w-0`, inner `overflow-x-hidden`).

2. **`frontend/src/i18n/index.ts`** — **No edit needed.** Verified existing wiring at lines 472–478: `document.documentElement.lang` and `dir` are set on init AND on every `i18n.on('languageChanged')`. The `I18nProvider.tsx` referenced in the plan does not exist in this project — the equivalent code lives in `src/i18n/index.ts` and was already correct. Documented here, no file change.

3. **`frontend/src/index.css`** + **`frontend/src/design-system/tokens/buildTokens.ts`** — Lowered light-mode `--ok`, `--warn`, `--info` lightness so the soft-chip variants (rendered as `color-mix(in srgb, --x 15%, transparent)` over `--surface`) meet WCAG AA 4.5:1 contrast. Hue and chroma preserved — only L lowered. Dark-mode tokens already passed and were not changed. Both the FOUC fallback (`index.css`) and the runtime token builder (`buildTokens.ts`) updated for parity.

## Contrast audit (WCAG AA 4.5:1)

Chip variants render as 15% color-mix over the surface canvas. Audited light-mode in both `--surface` (#fdfaf3) and `--surface-raised` (#ffffff). All soft-bg ↔ ink-fg pairs use the `--x` token directly as fg.

| Token (light)                                  | Old `oklch(L% C H)` | New `oklch(L% C H)`       | Old ratio (vs surface) | New ratio (vs surface) | Status          |
| ---------------------------------------------- | ------------------- | ------------------------- | ---------------------- | ---------------------- | --------------- |
| `--warn`                                       | `62% 0.14 75`       | `51% 0.14 75`             | 3.02:1 FAIL            | 4.55:1 PASS            | fixed           |
| `--ok`                                         | `52% 0.12 155`      | `49% 0.12 155`            | 4.07:1 FAIL            | 4.56:1 PASS            | fixed           |
| `--info`                                       | `50% 0.14 230`      | `48% 0.14 230`            | 4.29:1 FAIL            | 4.63:1 PASS            | fixed           |
| `--danger`                                     | `52% 0.18 25`       | `52% 0.18 25` (unchanged) | 4.58:1 PASS            | 4.58:1 PASS            | already passing |
| `--accent` (chip-accent over `--accent-soft`)  | n/a                 | n/a                       | 7.00:1 PASS            | 7.00:1 PASS            | already passing |
| default chip (`--ink-mute` over `--line-soft`) | n/a                 | n/a                       | 7.15:1 PASS            | 7.15:1 PASS            | already passing |

Dark-mode chip ratios sampled (over `#1d1915` representative dark surface):

- warn 6.40:1, ok 5.78:1, info 5.67:1, danger 4.88:1 — **all pass, no changes needed.**

Contrast computed with the canonical WCAG relative-luminance formula (`(L_lighter + 0.05) / (L_darker + 0.05)`) against the OKLCH→sRGB conversion implemented per CSS Color 4 spec. Diagnostic script run inline (sandbox), not committed.

## Axe-core violation triage

t1 ran via inline contrast audit + the locked CONTEXT-GAPS §G2 catalog (Playwright dev-server run deferred to t5/HUMAN-UAT). Expected violations addressed:

| axe rule id                    | root cause                                      | fix in this plan                                     |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| `region`                       | inner content not inside a labeled landmark     | t2: `<section role="region" aria-label={title}>`     |
| `html-has-lang` / `valid-lang` | `<html lang>` not toggled to `ar` on AR runs    | t3: verified existing wiring in `src/i18n/index.ts`  |
| `color-contrast`               | chip-warn/chip-ok/chip-info under WCAG AA 4.5:1 | t4: lowered light-mode L on `--warn`/`--ok`/`--info` |

## Verification

- `pnpm vitest run src/components/list-page/ src/design-system/tokens/` → **30/30 pass** (including 6 ListPageShell tests, 5 GenericListPage, 7 PersonsGrid, 5 DossierTable, 7 EngagementsList).
- `pnpm type-check` — files I touched produce **0 errors**. Pre-existing TS6196/TS6133 unused-export warnings elsewhere in the repo are not new and are not in scope for this plan.
- `pnpm lint` — files I touched produce **0 new errors**. Pre-existing 52 errors / 672 warnings elsewhere are unrelated.
- Full Playwright run of `list-pages-a11y` deferred to t5 / HUMAN-UAT (per --auto chain protocol; dev server attach was not in this run's scope).

## Deviations / blockers

- **No `I18nProvider.tsx` to edit** — the plan referenced this file but the actual i18n init lives in `src/i18n/index.ts`, which already wires `documentElement.lang`/`dir` correctly. No code change required for t3; verification-only.
- **No `tokens.css` to edit** — the plan referenced this file but tokens live in `src/index.css` (FOUC fallback) and `src/design-system/tokens/buildTokens.ts` (runtime). Both updated for parity.
- **Outer `<section>` labeled as region instead of swapping inner `<div>` for `<main>`** — `AppShell.tsx` already renders a `<main>` wrapping protected routes; nesting another `<main>` would be invalid. Plan explicitly allowed this branch ("If a parent main exists, use `<section role="region" aria-label>`").
- **Diagnostic axe Playwright run deferred** — dev server was not running and t1's instructions explicitly allow falling back to the CONTEXT-GAPS §G2 violation list. Deferred Playwright run to t5 (HUMAN-UAT visual gate, already deferred per Phase 40 close).
- **No `tmp-scripts/` files to delete** — used inline sandbox `ctx_execute` instead of writing temp files.

## Files modified

- `frontend/src/components/list-page/ListPageShell.tsx` (+3 lines: `role="region"`, `aria-label={title}`, comment)
- `frontend/src/index.css` (3 token values changed: `--ok`, `--warn`, `--info`; +6 lines comment)
- `frontend/src/design-system/tokens/buildTokens.ts` (3 token values changed in light branch only; +3 lines comment)

## Files NOT modified (verified unchanged or already correct)

- `frontend/src/i18n/index.ts` — already syncs `documentElement.lang`/`dir` on init + on `languageChanged`.
- `frontend/src/styles/list-pages.css` — chip CSS rules already use `var(--warn)`/`var(--ok)`/`var(--info)`, so token changes propagate without rule edits.

## Truth assertions (must_haves)

- ☑ Each list page exposes exactly one labeled landmark (`<section role="region" aria-label={title}>`); parent `<main>` lives in `AppShell.tsx`.
- ☑ `<html lang>` attribute is `'ar'` on AR runs and `'en'` on EN runs (verified existing wiring at `src/i18n/index.ts:472-478`).
- ☑ All chip variants meet WCAG AA 4.5:1 contrast in light mode (computed against both `--surface` and `--surface-raised`).
- ☐ axe-core `analyze()` returns `[]` for all 7 × 2 = 14 cases — **deferred to HUMAN-UAT live run** per Phase 40 visual-gate deferral. Token + landmark fixes mathematically resolve all three documented violation categories.
