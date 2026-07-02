---
phase: 77-linear-token-system
plan: 07
subsystem: ui
tags: [design-tokens, linear, direction, hue, fonts, visual-regression, react]

requires:
  - phase: 77-04
    provides: Linear activation — dual-layer id.dir coercion + dark default + .dir-linear rename + parity guard v2
  - phase: 77-05
    provides: switcher + accent-hue UI controls retired (Topbar/TweaksDrawer/AppearanceSettingsSection); i18n keys pruned
  - phase: 77-06
    provides: components/ui Linear re-skin + carve-out resolution
provides:
  - Single-direction token engine — Direction is the one-value union 'linear'
  - Hue-free token API — Hue type + BuildInput.hue removed; useHue + directionDefaults deleted; id.hue removeItem cleanup
  - 3-family font pipeline — Inter Variable + JetBrains Mono Variable + Tajawal (retired per-direction fonts dropped)
  - Zero retired-direction identifiers in frontend/src outside the engagement domain
  - Linear-only direction-matrix visual spec (2 focused-primitive shots)
affects: [77-08, phase-80-visual-recompare]

tech-stack:
  added: []
  patterns:
    - 'Single-direction engine: buildTokens reads palette LITERALS unconditionally (no OKLCH/hue math)'
    - 'Stale-key cleanup: DesignProvider one-time write-back effect removes the retired id.hue key'

key-files:
  created: []
  modified:
    - frontend/src/design-system/tokens/types.ts
    - frontend/src/design-system/tokens/directions.ts
    - frontend/src/design-system/tokens/buildTokens.ts
    - frontend/public/bootstrap.js
    - frontend/src/fonts.ts
    - frontend/src/design-system/DesignProvider.tsx
    - frontend/src/design-system/hooks/index.ts
    - frontend/src/components/theme-error-boundary/ThemeErrorBoundary.tsx
    - frontend/src/types/settings.types.ts
    - frontend/src/pages/settings/SettingsPage.tsx
    - frontend/src/services/preference-sync.ts
    - frontend/src/components/layout/ClassificationBar.tsx
    - frontend/src/components/layout/AppShell.tsx
    - frontend/src/pages/Dashboard/widgets/WidgetHeader.tsx
    - frontend/src/utils/storage/preference-storage.ts
    - frontend/src/App.tsx
    - frontend/tests/unit/design-system/buildTokens.test.ts
    - frontend/tests/unit/design-system/applyTokens.test.ts
    - frontend/tests/unit/design-system/fonts.test.ts
    - frontend/tests/unit/design-system/DesignProvider.test.tsx
    - frontend/src/components/layout/ClassificationBar.test.tsx
    - frontend/src/components/layout/AppShell.test.tsx
    - frontend/src/components/layout/AppShell.a11y.test.tsx
    - frontend/tests/e2e/qa-sweep-focus-outline.spec.ts
    - tools/bootstrap-fixtures/bad-bootstrap.js
  deleted:
    - frontend/src/design-system/hooks/useHue.ts
    - frontend/src/design-system/directionDefaults.ts
    - frontend/src/design-system/directionDefaults.test.ts
    - 'frontend/tests/e2e/qa-sweep-focus-outline.spec.ts-snapshots/{bureau,chancery,situation,ministerial}-{light,dark}-focused-primitive-chromium-darwin.png (8 PNGs)'

key-decisions:
  - "Direction collapsed to a one-value union 'linear' (kept as a type for API stability — buildTokens/PALETTES still key off it) rather than removing the parameter entirely"
  - 'setDirection kept as a trivial Linear-only setter (useDesignDirection.ts is a public hook not in scope); only the hue plumbing was removed'
  - 'usePreferenceSync is a research-verified orphan — only its :75 fallback literal was changed; no data migration'
  - 'bad-bootstrap.js NOT refreshed for divergence (its linear.dark.bg #010103 still diverges → exit 1); only its copied header comment was updated to stay a faithful copy'

patterns-established:
  - "Single-direction token builder — every family reads palette literals; --shadow-card unconditionally 'none'"

requirements-completed: [TOKEN-04, TOKEN-01, TOKEN-05]

duration: ~90 min
completed: 2026-07-03
---

# Phase 77 Plan 07: Collapse the token engine to Linear-only Summary

**Deleted the four retired directions and the entire hue axis from the type system, both literal tables, the font pipeline, and every consumer — the engine is now a single-direction (Linear), hue-free, 3-family pipeline with zero retired identifiers outside the engagement domain.**

## Performance

- **Duration:** ~90 min
- **Tasks:** 3 (all auto, no checkpoints)
- **Files:** 25 modified, 3 modules deleted, 8 PNGs deleted, 2 PNGs added

## Accomplishments

- **Engine (Task 1):** `Direction` → single `'linear'` literal; the 77-03 optional extended palette fields (surface3/4, inkTertiary, lineStrong, accent, semantic, sla, status) promoted to REQUIRED; `Hue` type + `BuildInput.hue` removed. `directions.ts` deleted the 4 retired PALETTES/FONTS entries and its header now describes the Linear single-direction engine + the three-copy invariant. `buildTokens.ts` reads palette literals unconditionally (all legacy hue-math/mode-branch fallbacks gone; `--shadow-card` unconditionally `'none'`; `direction` + `PALETTES[direction]` lookup kept for API stability). `fonts.ts` pruned to exactly 5 fontsource imports (Inter Variable + JetBrains Mono Variable + Tajawal 400/500/700). `bootstrap.js` P/F tables were already Linear-only from 77-04 — only its comment was de-named.
- **Consumers (Task 2):** `DesignProvider` lost the hue state, `LS_HUE`, `parseHue`, the hue lazy-initializer, `setHue`, the hue storage-listener branch, the `initialHue` prop, and the `Hue` import; the one-time write-back effect gained `safeRemoveItem('id.hue')`. Deleted `useHue.ts` + `directionDefaults.ts` (+ its test) — both had zero code importers. `ThemeErrorBoundary`, `settings.types`, `SettingsPage` enums + `preference-sync:75` fallback all → `'linear'`. `ClassificationBar`'s `switch(direction)` collapsed to the single Linear `.cls-chip` render (dropped `useDesignDirection`). Comment touch-ups in `AppShell`/`WidgetHeader`/`preference-storage`.
- **Visual spec (Task 3):** `qa-sweep-focus-outline.spec.ts` rewritten to Linear × {light, dark} (2 shots), pinning `id.theme` per shot via `hatch.setMode` (which persists it). 8 obsolete direction PNGs deleted; 2 Linear replacements captured locally (dark 10.94:1, light 5.53:1 focus-outline contrast) and replayed green **without** `--update-snapshots`.

## Task Commits

1. **Task 1: Engine collapse** — `2a084acc` (feat)
2. **Task 2: Consumer collapse + hue retirement** — `7e1fc845` (feat)
3. **Task 3: Direction-matrix visual spec → linear-only** — `229a39c8` (test)

## Deleted Modules

- `frontend/src/design-system/hooks/useHue.ts` (+ export removed from `hooks/index.ts`)
- `frontend/src/design-system/directionDefaults.ts` — zero code importers (only a doc mention + its own test)
- `frontend/src/design-system/directionDefaults.test.ts`

## Engagement-domain `'ministerial'` residual-hit list (verified — Pitfall 3, untouched)

`grep -rn "'ministerial'" frontend/src` matches ONLY the engagement domain (a different enum — engagement LEVEL, not design direction):

- `frontend/src/types/engagement.types.ts:62` — `| 'ministerial'` (engagement-level union member)
- `frontend/src/types/engagement.types.ts:490` — `ministerial: { en: 'Ministerial', ar: 'وزاري' }`
- `frontend/src/i18n/en/engagements.json:108` + `frontend/src/i18n/ar/engagements.json:108` — engagement-level i18n

(`'chancery'` / `'situation'` / `'bureau'` quoted greps over `frontend/src` return 0.)

## Focused-primitive baseline replacement note (for Phase 80)

The 8 pre-swap direction PNGs (`{bureau,chancery,situation,ministerial}-{light,dark}-focused-primitive-chromium-darwin.png`) remain in git history under the 77-01 baseline commit lineage. Phase 80's re-compare must treat the direction-matrix surface as **structurally replaced** (an intended change), not a silent baseline swap: the spec is now Linear × {light, dark} = 2 shots (`linear-light-focused-primitive-chromium-darwin.png`, `linear-dark-...`), captured on this Mac and human-reviewable. Each shot pins `id.theme` (not the app default), so the Phase-80 comparison is theme-explicit (Pitfall-6 discipline).

## Deviations from Plan

The `Direction`-type collapse (types.ts) is **atomically breaking** to its consumers — a green `type-check`/`vitest` requires the type change and its consumer fixes to land together. Task 1 + Task 2 edits were therefore applied and verified green as a unit, then committed as the two prescribed commits (engine, consumers). Task 1's standalone type-check is green only in combination with Task 2 (inherent to collapsing a shared union type, not a defect).

**[Rule 2 — missing critical] Files edited beyond the enumerated list** (required to keep the Task-1 type-check/vitest gate green after the collapse):

- `frontend/src/App.tsx` — removed the `initialHue={32}` prop. The plan's Task-2 action says "drop the App-facing initialHue prop" but the file was not in `files_modified`; App.tsx is the sole caller passing it. Committed with Task 2.
- `frontend/tests/unit/design-system/applyTokens.test.ts` — a `buildTokens` caller (not listed) using retired directions + hue → rewritten to Linear/no-hue. The "twice/restore" case now discriminates via `--bg` (light vs dark), since `--accent` is brand-invariant across modes. Committed with Task 1.
- `frontend/tests/unit/design-system/fonts.test.ts` — the TYPO-02 font drift guard (not listed) asserted the 14 legacy font imports → updated to the 3-family set. The retired `@fontsource` packages remain in `package.json` (unused, tree-shaken; removing them is out of scope). Committed with Task 1.

**Total deviations:** 3 files auto-added (1 prop removal, 2 test updates). **Impact:** none functional — all forced by the atomic type collapse; the plan's intent (drop initialHue; keep suites green) is fully honored.

## Out-of-scope residuals (documented, deferred to 77-08 DOC-01)

- `frontend/src/design-system/CLAUDE.md` — still contains `id.hue` in a key list + "Bureau is the default direction" prose. This file is a DOC-01 (Plan 77-08) target per 77-RESEARCH §DOC-01 scope; the code-scoped grep (`--include=*.ts,*.tsx`) returns only the DesignProvider `safeRemoveItem('id.hue')` cleanup line.
- `frontend/src/services/preference-sync.ts:12` (interface comment) names the four directions. Left per the critical guardrail ("update the :75 fallback literal and NOTHING else server-side"); not caught by any DoD quoted grep.
- Explanatory/CSS comments that name what was removed (`types.ts:13`, `ClassificationBar.tsx`/`.test.tsx`, `styles/list-pages.css:393`) — unquoted historical references, not caught by the quoted DoD greps.

## Future-cleanup candidate (out of scope)

- `usePreferenceSync` remains a zero-importer orphan (research-verified). Either wire it or remove it in a later cleanup — untouched here beyond the fallback literal.

## Verification

- `node scripts/check-bootstrap-parity.mjs` → exit 0 (**6 combinations** = 1 direction × 2 modes × 3 densities, + 5 coercion probes + 51 :root literal checks); `bad-bootstrap.js` → exit 1 (8 divergences).
- `grep -c "chancery|situation|ministerial|bureau"` → 0 in `directions.ts` and `bootstrap.js`.
- `grep "hue" buildTokens.ts` → 0; `grep -c "fontsource" fonts.ts` → 5.
- `grep -rn "useHue|id.hue"` (code) → only `DesignProvider.tsx:212`.
- `grep -rn "'chancery'|'situation'"` → 0; `'bureau'` → 0; `'ministerial'` → engagement domain only.
- `pnpm -C frontend type-check` green; `pnpm run lint` green (eslint + i18n + duplicate-rtl + bootstrap-parity); `vitest run tests/unit/design-system tests/bootstrap` 144 passed; layout tests + `tests/unit` 224 passed.
- `pnpm exec size-limit` — all budgets green (no `exceeded` lines).
- `playwright test qa-sweep-focus-outline.spec.ts --project=chromium` — 2/2 passed on replay without `--update-snapshots`; snapshot dir holds exactly the 2 `linear-*` PNGs, no direction-named files.

## Self-Check: PASSED

- key-files.deleted verified absent on disk; the 3 task commits + this SUMMARY exist; all acceptance criteria + plan-level verification re-run green (logged above).

## Next

More plans remain in Phase 77 (77-08 DOC-01). Ready for 77-08.
