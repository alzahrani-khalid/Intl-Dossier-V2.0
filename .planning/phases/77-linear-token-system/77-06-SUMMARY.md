---
phase: 77-linear-token-system
plan: 06
subsystem: ui
tags: [linear, design-tokens, css-recipes, tailwind-v4, carve-out, components-ui]

# Dependency graph
requires:
  - phase: 77-04
    provides: 'Activated Linear palette (--accent-hover, --line-strong, surface-3/4 utilities, --shadow-card none, dir-linear class)'
  - phase: 77-03
    provides: 'Widened Linear token DATA (surface ladder, status-tag palette, shadow tokens)'
provides:
  - 'Linear-faithful primitive recipes: flat cards/buttons (no drop shadows), hairline 1px var(--line) borders, token-only radii (--radius-sm/--radius/--radius-lg), surface-1..4 ladder applied (cards on surface, popover/menu on surface-3, drawer/modal on surface-4)'
  - 'Removed the terracotta Bureau-residue drop shadow from primary buttons (carried verbatim through the 77-04 dir-class rename)'
  - 'The 6 live components/ui carve-out files migrated from Tailwind palette literals to semantic token utilities (zero palette literals remain)'
  - 'Per-item keep/migrate/skip decision recorded for every one of the 14 carve-out files (74 palette-literal lines + 20 raw-hex occurrences)'
affects: [77-08, phase-79-aceternity-removal, phase-80-visual-a11y-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Semantic soft washes via opacity modifiers on existing tokens (bg-warn/10, bg-ok/10) — same convention as the .status-* recipes — since --color-*-soft are not exposed as @theme utilities'
    - 'dark: color-variant pairs collapse to a single theme-aware semantic token (text-ink handles both modes; the token engine branches per mode)'

key-files:
  created:
    - .planning/phases/77-linear-token-system/77-06-SUMMARY.md
  modified:
    - frontend/src/index.css
    - frontend/src/styles/list-pages.css
    - frontend/src/components/ui/file-upload.tsx
    - frontend/src/components/ui/enhanced-progress.tsx
    - frontend/src/components/ui/sidebar-collapsible.tsx
    - frontend/src/components/ui/timeline.tsx
    - frontend/src/components/ui/pull-to-refresh-indicator.tsx
    - frontend/src/components/ui/form-wizard.tsx

key-decisions:
  - 'The effective btn/card/input/drawer recipes live in styles/list-pages.css (side-effect import), NOT only index.css as the plan frontmatter assumed — edited both (Rule-2 deviation) to satisfy the recipe-pass intent.'
  - 'Carve-out final tally is 6 migrate / 2 keep / 6 skip (14 files). The brief/research "7 skipped" is an off-by-one — research prose says "7 dead files" but its own arithmetic (25 palette lines + 10 hex) sums to exactly the 6 dead files in its table.'
  - 'Soft washes use opacity modifiers (bg-warn/10) rather than adding --color-*-soft @theme utilities, keeping Task 2 scoped to the 6 component files.'
  - 'chart.tsx and world-map.tsx kept byte-unchanged (data-viz palettes; deferred chart-token phase per Phase-51 D-03); the 6 Phase-79-dead animated primitives skipped; eslint.config.mjs carve-out block left intact.'

patterns-established:
  - 'Linear recipe metrics: flat surfaces, hairline borders, token radii, surface ladder — enforced in the recipe CSS, not just the token values.'
  - 'Carve-out literal migration by rendered intent (success→ok, error→danger, warning→warn, informational→info, neutral grays→ink/surface/line), not mechanical color-name mapping.'

requirements-completed: [TOKEN-06]

# Metrics
duration: 40 min
completed: 2026-07-03
---

# Phase 77 Plan 06: Linear Primitive Re-skin + Carve-out Resolution (TOKEN-06) Summary

**Re-skinned the `components/ui/*` primitive layer to Linear's recipes (flat cards/buttons, hairline borders, token radii, surface-1..4 ladder) — removing the terracotta Bureau-residue button shadow — and resolved the full ESLint carve-out with an explicit per-item keep/migrate/skip decision, migrating the 6 live files to semantic tokens.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-07-02T21:29Z (2026-07-03 local)
- **Tasks:** 2 of 2 (both `type=auto`, no checkpoints)
- **Files modified:** 8 (2 CSS recipe files + 6 migrated components)

## Accomplishments

- **Task 1 — Linear recipe pass:** cards and primary buttons are now flat (the terracotta `box-shadow: 0 1px 2px rgba(190,80,30,.15)` on `.dir-linear .btn-primary`, a Bureau-accent artifact carried through the 77-04 `.dir-bureau`→`.dir-linear` rename, is gone); primary-button hover uses the Linear `var(--accent-hover)` (#828fff) instead of a color-mix-toward-black hack; hard-coded recipe radii tokenised (`.dir-linear .card` 12px→`var(--radius-lg)`, `.dir-linear .btn` 8px→`var(--radius)`); surface ladder wired — popover/menu content → `var(--surface-3)` (`--color-popover`), drawer/modal → `var(--surface-4)` (`.dir-linear .drawer`, `.id-dialog-content`).
- **Task 2 — Carve-out sweep:** re-counted the carve-out (74 palette-literal lines / 12 files + 20 raw-hex / 4 files — exact match to research), then made the final per-item call against the actual code and migrated the 6 live files to semantic token utilities. Zero palette literals remain in the 6 files; chart.tsx + world-map.tsx are byte-unchanged; the 6 Phase-79-dead primitives were skipped; the eslint carve-out block was left intact.
- Full verification green: lint (Design Token Check + bootstrap parity guard), type-check, `handoff-css-contract` test (6/6), and the vitest unit suite (319/319).

## Task Commits

1. **Task 1: Linear recipe pass over the primitive CSS** — `385b59ca` (feat)
2. **Task 2: Carve-out sweep — live files migrated to semantic tokens** — `715c0a97` (feat)

**Plan metadata:** this SUMMARY commit (docs).

## TOKEN-06 carve-out decision table (required deliverable)

Re-counted at execution across `frontend/src/components/ui/**`. Palette-literal
count uses the ESLint Design-Token-Check pattern
(`(text|bg|border|ring|fill|stroke|from|to|via|…)-(red|blue|…|neutral|…)-\d{2,3}`);
hex uses `#[0-9a-fA-F]{3,8}`. **Totals: 74 palette-literal lines + 20 hex
occurrences across 14 unique files — 100% covered below.**

| #   | File                                | Palette lines | Hex | Decision                  | Live? (importers)                                                                 | Mapping / rationale                                                                                                                                                                                                                                                                   |
| --- | ----------------------------------- | ------------- | --- | ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `file-upload.tsx`                   | 15            | 0   | **MIGRATE**               | 0 (unused; not P79-scheduled)                                                     | Neutral chrome: `white/neutral-9xx`→`surface`/`bg`; primary/secondary text→`ink`/`ink-mute`/`ink-faint`; type + size pills→`surface-3`; drag-active dashed border `sky-400`→`accent`. rgba() arbitrary shadows left (not palette/hex).                                                |
| 2   | `enhanced-progress.tsx`             | 9             | 0   | **MIGRATE**               | 0 (unused; not P79-scheduled)                                                     | Status map by intent: `blue`→`info`, `amber`→`warn`, `green`→`ok`, `red`→`danger`, `gray`→`ink-faint`/`ink-mute`. `idle` already used `muted`/`muted-foreground`.                                                                                                                     |
| 3   | `sidebar-collapsible.tsx`           | 8             | 0   | **MIGRATE**               | 0 (unused; not P79-scheduled)                                                     | `white/neutral`→`surface`/`surface-raised`/`ink`; toggle border→`line`; link hover→`line-soft`; nav label→`ink-mute`.                                                                                                                                                                 |
| 4   | `timeline.tsx`                      | 7             | 0   | **MIGRATE**               | 0 (unused Aceternity demo; not P79-scheduled)                                     | Root/dot bg→`bg`; heading→`ink`; body→`ink-mute`; muted titles→`ink-faint`; node dot→`surface-3`+`line`; static line `via`→`line`; scroll-beam gradient `purple/blue`→`accent/info`.                                                                                                  |
| 5   | `pull-to-refresh-indicator.tsx`     | 7             | 0   | **MIGRATE**               | **LIVE — 5** (CommitmentsList, Donut, IntakeQueue, WorkItemList, DossierListPage) | Complete check `green`→`ok`; two offline-queue badges `amber`→`warn/10` wash + `text-warn`.                                                                                                                                                                                           |
| 6   | `form-wizard.tsx`                   | 3             | 0   | **MIGRATE**               | **LIVE — 20+** (dossier create/edit wizard tree)                                  | Draft-restored notice `amber`→`warn/10` bg + `warn/20` border + `text-warn`.                                                                                                                                                                                                          |
| 7   | `chart.tsx`                         | 0             | 5   | **KEEP (byte-unchanged)** | LIVE                                                                              | The 5 hex are recharts internal attribute-selectors (`[stroke='#ccc']`, `[stroke='#fff']`) that MATCH recharts' own default inline output and re-map it to `stroke-border`/`stroke-transparent` — not colors we author. Deferred chart-token phase (Phase-51 D-03). `git diff` empty. |
| 8   | `world-map.tsx`                     | 0             | 5   | **KEEP (byte-unchanged)** | LIVE (1 importer)                                                                 | Data-viz map colors: `lineColor #0ea5e9` default, dot `#FFFFFF40`/`#00000040`, marker fills `#fff`/`#000`. Deferred chart-token phase. `git diff` empty.                                                                                                                              |
| 9   | `expandable-card.tsx`               | 8             | 0   | **SKIP**                  | dead                                                                              | Phase-79 Aceternity removal deletes this file — migration would be wasted work.                                                                                                                                                                                                       |
| 10  | `floating-dock.tsx`                 | 6             | 0   | **SKIP**                  | dead                                                                              | Phase-79 deletion supersedes.                                                                                                                                                                                                                                                         |
| 11  | `placeholders-and-vanish-input.tsx` | 5             | 1   | **SKIP**                  | dead                                                                              | Phase-79 deletion supersedes.                                                                                                                                                                                                                                                         |
| 12  | `background-boxes.tsx`              | 3             | 9   | **SKIP**                  | dead                                                                              | Phase-79 deletion supersedes.                                                                                                                                                                                                                                                         |
| 13  | `animated-tooltip.tsx`              | 2             | 0   | **SKIP**                  | dead                                                                              | Phase-79 deletion supersedes.                                                                                                                                                                                                                                                         |
| 14  | `moving-border.tsx`                 | 1             | 0   | **SKIP**                  | dead                                                                              | Phase-79 deletion supersedes.                                                                                                                                                                                                                                                         |

**Tally:** 6 migrate (49 palette lines → 0) / 2 keep (10 hex, byte-unchanged) /
6 skip (25 palette lines + 10 hex, annotated for Phase-79 deletion).
Palette lines: 49 + 25 = 74 ✓. Hex: 5 + 5 + 1 + 9 = 20 ✓.

**Re-count reconciliation / drift note:** all per-file counts match the
`77-RESEARCH.md` §carve-out table exactly (line-vs-occurrence only differed on
chart/world-map: research counted 5 hex _occurrences_ each, an initial line-count
pass showed 1 and 3 respectively — occurrence counts confirm 5 + 5). The one real
discrepancy: the brief/DoD say **"7 skipped"**, but the honest re-count and the
research's own arithmetic yield **6 dead files**. Research prose says "The 7 dead
files (25 palette lines + 10 hex)" while `25 palette + 10 hex` sums to exactly the
**6** files listed in its table (expandable-card 8 + floating-dock 6 +
placeholders 5 + background-boxes 3 + animated-tooltip 2 + moving-border 1 = 25
palette; placeholders 1 + background-boxes 9 = 10 hex). No 7th dead-verdict file
with carve-out literals exists in the re-count (verified recursively, incl.
subdirs). Recorded here as **6 skipped**.

## Files Created/Modified

- `frontend/src/index.css` — `.card` @layer recipe flattened (dropped `shadow-sm`); `.btn-primary` @layer hover → `bg-accent-hover`; `--color-popover` → `var(--surface-3)` (popover/menu surface ladder).
- `frontend/src/styles/list-pages.css` — effective recipes: removed terracotta `.dir-linear .btn-primary` box-shadow + residual `.dir-linear .card` box-shadow; tokenised `.dir-linear .card`/`.dir-linear .btn` radii; `.dir-linear .btn-primary:hover` → `var(--accent-hover)`; `.dir-linear .drawer` + `.id-dialog-content` → `var(--surface-4)`.
- `frontend/src/components/ui/file-upload.tsx` — 15 palette literals → semantic tokens.
- `frontend/src/components/ui/enhanced-progress.tsx` — 9 → semantic (status map).
- `frontend/src/components/ui/sidebar-collapsible.tsx` — 8 → semantic.
- `frontend/src/components/ui/timeline.tsx` — 7 → semantic.
- `frontend/src/components/ui/pull-to-refresh-indicator.tsx` — 7 → semantic.
- `frontend/src/components/ui/form-wizard.tsx` — 3 → semantic.

## Verification

| Check                                                                                       | Result                                                      |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `grep box-shadow frontend/src/index.css` — no card-class shadow                             | PASS (only a comment + `.theme-transition` transition-prop) |
| Popover/menu → `var(--surface-3)`; drawer/modal → `var(--surface-4)`                        | PASS                                                        |
| Recipe radii resolve to `var(--radius*)` (no hard-coded px on `.btn-*`/`.card`/`.id-input`) | PASS                                                        |
| 6 migrated files: zero Tailwind palette literals (re-count grep)                            | PASS (0/0/0/0/0/0)                                          |
| chart.tsx / world-map.tsx byte-unchanged                                                    | PASS (empty `git diff`)                                     |
| Decision table covers every re-counted file (14 rows)                                       | PASS                                                        |
| `pnpm run lint` (Design Token Check + i18n + duplicate-rtl + bootstrap parity)              | PASS                                                        |
| `pnpm type-check`                                                                           | PASS                                                        |
| `pnpm exec vitest run tests/unit/design-system/handoff-css-contract.test.ts`                | PASS (6/6)                                                  |
| `pnpm exec vitest run tests/unit`                                                           | PASS (319/319, 16 files)                                    |

## Deviations from Plan

**[Rule 2 — Missing critical] Recipe CSS also lives in `styles/list-pages.css`, not only `index.css`**

- Found during: Task 1. The plan `files_modified` and DoD scoped Task 1 to `index.css`, but the _effective_ `.btn`/`.btn-primary`/`.btn-ghost`/`.card`/`.id-input`/`.drawer` recipes are unlayered rules in `styles/list-pages.css` (side-effect import from `main.tsx`), which override the `@layer components` versions in `index.css`. The brief's stated Task-1 intent — "buttons → NO box-shadow… accent-hover uses `var(--accent-hover)`… fix hard-coded px stragglers… drawer/modal on surface-4" — is only satisfiable there.
- Fix: edited `styles/list-pages.css` alongside `index.css` (color/border/shadow/radius/surface only; no layout/spacing changes), committed together in Task 1.
- Verification: `handoff-css-contract` test still green (it asserts base `.card` has no shadow and dialog overlays stay blur-free — both hold); lint + type-check green.
- Commit: `385b59ca`.

**[Rule 1 — Documentation drift correction] "7 skipped" is an off-by-one; actual is 6**

- Found during: Task 2 re-count. See the reconciliation note under the decision table. Reported the honest count (6 migrate / 2 keep / 6 skip) rather than the brief's expected "7 skipped".

**Total deviations:** 2 (1 missing-critical auto-fix, 1 documentation-drift correction). **Impact:** none negative — the intent is fully delivered; the recipe fixes reach the CSS that actually renders, and the carve-out count is now arithmetically consistent.

## Issues Encountered

None.

## Next Phase Readiness

Ready for **77-07**. TOKEN-06 is complete: the primitive recipes are
Linear-faithful and every carve-out literal has an explicit recorded decision.
The eslint `components/ui` carve-out block remains in place (chart/map + the 6
Phase-79-dead files still need it) — revisit narrowing it post-Phase-79. The
Manual-Only VALIDATION row (Linear re-skin visual fidelity) is satisfied at
phase verify-work / Phase-80 re-compare; no judgment calls beyond the documented
soft-wash-via-opacity and neutral-gray mappings above.

## Self-Check: PASSED

- `key-files.modified` all exist on disk and are committed. ✓
- `git log --grep="77-06"` returns ≥2 feature commits (`385b59ca`, `715c0a97`). ✓
- All `<acceptance_criteria>` re-run and PASS (see Verification table). ✓
- Plan-level `<verification>` (full lint + vitest unit + type-check) green. ✓
