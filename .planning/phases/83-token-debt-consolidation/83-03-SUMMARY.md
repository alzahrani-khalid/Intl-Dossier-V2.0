---
phase: 83-token-debt-consolidation
plan: 03
subsystem: frontend
tags: [design-tokens, chart-palette, DEBT-01, DEBT-02, DEBT-03, DEBT-05, recharts, tailwind-v4]
requires:
  - chart-1-to-8-css-vars
  - color-chart-tailwind-utilities
provides:
  - analytics-charts-on-tokens
  - dashboard-widgets-on-tokens
  - report-builder-on-tokens
  - stakeholder-influence-on-tokens
affects:
  - frontend/src/components/analytics
  - frontend/src/components/dashboard-widgets
  - frontend/src/components/report-builder
  - frontend/src/components/stakeholder-influence
tech-stack:
  added: []
  patterns:
    - 'recharts fill/stroke consume var(--chart-N) / var(--ok|warn|danger|info|ink-faint) strings (in-repo precedent Donut.tsx)'
    - 'summary-tile 2-class dark: idiom collapses to 1 mode-aware @theme utility (bg-status-1-soft/text-status-1, bg-ok/10, etc.)'
    - 'icon-bg alpha overlay via color-mix(in srgb, <token> 12.5%, transparent) — replaces the ${hex}20 concat that breaks with var() tokens'
    - 'semantic-vs-categorical split: meaning-bearing series use --ok/--warn/--danger/--info/--ink-faint; categorical series use --chart-N'
key-files:
  created: []
  modified:
    - frontend/src/components/analytics/CommitmentFulfillmentChart.tsx
    - frontend/src/components/analytics/sample-data.ts
    - frontend/src/components/analytics/WorkloadDistributionChart.tsx
    - frontend/src/components/analytics/RelationshipHealthChart.tsx
    - frontend/src/components/analytics/ClusterVisualization.tsx
    - frontend/src/components/dashboard-widgets/ChartWidget.tsx
    - frontend/src/components/dashboard-widgets/BenchmarkPreview.tsx
    - frontend/src/components/dashboard-widgets/WidgetLibrary.tsx
    - frontend/src/components/report-builder/ReportPreview.tsx
    - frontend/src/components/stakeholder-influence/InfluenceMetricsPanel.tsx
    - frontend/src/components/stakeholder-influence/InfluenceReport.tsx
    - frontend/src/components/stakeholder-influence/InfluenceNetworkGraph.tsx
decisions:
  - 'Two adjacent violet series kept distinct (chart-7 vs chart-6): InfluenceMetricsPanel closeness/eigenvector bars, InfluenceReport total_relationships/key_influencers StatCards'
  - 'Rule 3 fix: MetricCard/StatCard icon-bg `${color}20` hex-alpha concat → color-mix(in srgb, ${color} 12.5%, transparent) so var() tokens resolve (0x20/0xFF ≈ 12.5%)'
  - 'analytics.types.ts color constants (HEALTH_LEVEL_COLORS/PRIORITY_COLORS/TREND_COLORS) LEFT hex — outside the slice + not in any plan files_modified; flagged for verifier (scope gap, see Threat Flags)'
metrics:
  tasks_completed: 3
  files_created: 0
  files_modified: 12
  duration_minutes: 18
  completed: 2026-07-04
---

# Phase 83 Plan 03: Analytics / Widgets / Stakeholder-Influence / Report-Builder Token Migration Summary

Migrated the four-directory chart/tile/shadow/gradient slice onto the Wave-1 chart + semantic tokens: every recharts fill/stroke and inline color prop in `components/analytics/**`, `dashboard-widgets/ChartWidget`, `report-builder/ReportPreview`, and `stakeholder-influence/**` now resolves through `var(--chart-N)` or a semantic token; ~23 summary-tile Tailwind-literal pairs collapsed to mode-aware `@theme` utilities; banned in-slice card shadows stripped; and BenchmarkPreview's two decorative gradient washes flattened. All four slice-scoped grep gates read zero (hex, palette literals, banned shadows, gradients); full lint + type-check + design-system suite green.

## What shipped

### Task 1 — analytics dir (commit `3d9863d0`)

- **CommitmentFulfillmentChart**: `STATUS_COLORS` → semantic (`--ok/--warn/--danger/--ink-faint`); `SOURCE_COLORS` → categorical (`--chart-1/7/6`, distinct from status); trend stroke → `--chart-1`; bar fills → `--ink-faint`/`--ok`; 4 summary tiles → `bg-status-1-soft`/`bg-ok/10`/`bg-warn/10`/`bg-danger/10` + matching text.
- **sample-data.ts**: health fixture colors → `--ok`/`--chart-3`/`--warn`/`--chart-5`/`--danger`/`--ink-faint`; priority → `--ink-faint`/`--info`/`--warn`/`--danger`.
- **WorkloadDistributionChart**: fills → `--chart-1`/`--danger`/`--chart-7`; fallback → `--ink-faint`; tiles → status-1-soft/chart-7/danger/surface-raised idioms; `text-red-500` → `text-danger`.
- **RelationshipHealthChart**: fallbacks → `--ink-faint`; trend stroke → `--ok`; tiles → `bg-danger/10`/`bg-ok/10`/`bg-status-5-soft`.
- **ClusterVisualization**: d3 tab10 5-cycle → `[chart-1, chart-5, chart-3, chart-8, chart-7]`.

### Task 2 — dashboard-widgets + report-builder (commit `c0133b75`)

- **ChartWidget** `FALLBACK_COLORS` → `[chart-1, chart-3, chart-4, chart-8, chart-7]` (name kept; artifact `contains: var(--chart-1)` satisfied); comment corrected (no longer "fallback if CSS vars unavailable").
- **ReportPreview** 8-slot categorical cycle → hue-matched `[chart-1, chart-3, chart-4, chart-8, chart-7, chart-2, chart-5, chart-6]`.
- **BenchmarkPreview** (D-83-05): `from-primary/5 to-primary/10` → `bg-accent/5`; `from-background via-background to-primary/5` → `bg-bg`; `hover:shadow-md` stripped.
- **WidgetLibrary**: `hover:shadow-sm` stripped.

### Task 3 — stakeholder-influence (commit `57f7381b`)

- **InfluenceMetricsPanel**: `#6366f1`→`--accent-ink`; closeness/eigenvector violet bars → `--chart-7`/`--chart-6` (kept distinct); `#f59e0b`→`--chart-4`; `#3b82f6`→`--chart-1`; both `#22c55e`→`--ok`; `#ef4444`→`--danger`.
- **InfluenceReport**: StatCards → `--chart-1`; total_relationships/key_influencers violet → `--chart-7`/`--chart-6` (kept distinct); `#22c55e`→`--ok`.
- **InfluenceNetworkGraph**: `shadow-md` + `shadow-sm` stripped (borders + `shadow-lg` retained).

## Two-violet distinctness decisions (recorded per plan)

Both requested judgment calls resolved the same way — the paired violet series render **adjacent** and carry different meanings, so the second maps to `--chart-6` (magenta-violet) rather than duplicating `--chart-7`:

- **InfluenceMetricsPanel** — `closeness_centrality` and `eigenvector_centrality` are consecutive MetricBars in one column → `--chart-7` / `--chart-6`.
- **InfluenceReport** — `total_relationships` and `key_influencers` are side-by-side StatCards in a `grid-cols-2 lg:grid-cols-4` → `--chart-7` / `--chart-6`.

## Verification

- Slice grep gates (all four dirs): raw hex → 0 (non-comment); palette literals (analytics) → 0; banned `shadow-(sm|md|xl|2xl)` → 0; `bg-gradient-` (dashboard-widgets) → 0.
- `pnpm --dir frontend type-check` — exit 0.
- `pnpm --dir frontend lint` — clean (eslint `--max-warnings 0` + i18n + duplicate-rtl + **bootstrap-parity** + date-formatting). Parity check confirms the three-copy palette holders are byte-untouched (carve-out discipline intact).
- `pnpm --dir frontend exec vitest run tests/unit/design-system/` — 181 pass.
- Per-task eslint on touched files — exit 0 each.

## Deviations from Plan

### Rule 3 — blocking-issue fix (auto-applied)

**`${color}20` hex-alpha concatenation breaks with `var()` tokens**

- **Found during:** Task 3. MetricCard (`InfluenceMetricsPanel:118`) and StatCard (`InfluenceReport:70`) build the icon-background tint as `` `${color}20` `` — appending the hex-alpha byte `20`. Swapping the raw hex for `var(--chart-N)` would produce the invalid CSS `var(--chart-7)20`, silently dropping the tint.
- **Fix:** changed the concat to `color-mix(in srgb, ${color} 12.5%, transparent)` (0x20/0xFF ≈ 12.5%). Works with both the new token strings and any legacy hex. `color-mix` has existing in-repo precedent (NavigationShell, Sidebar, signature-visuals).
- **Files:** `InfluenceMetricsPanel.tsx`, `InfluenceReport.tsx`. **Commit:** `57f7381b`.
- The MetricBar path (`--progress-background: color`, direct) and icon `color:` props take the token directly — no fix needed there. `${tierColor}20` (fed by the out-of-scope `NODE_COLORS` hex import) left untouched — still valid hex-alpha.

### Comment correction (self-caused)

- `ChartWidget.tsx` `FALLBACK_COLORS` comment updated from "Fallback colors if CSS variables not available" to "Default chart series colors (design-system chart tokens)" — the array now _is_ CSS variables, so the old comment contradicted the code.

## Threat Flags

| Flag                   | File                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| threat_flag: scope-gap | frontend/src/types/analytics.types.ts | `HEALTH_LEVEL_COLORS` / `PRIORITY_COLORS` / `TREND_COLORS` (lines 267/278/287) hold raw hex and supply the **primary** fill for the analytics health/priority/trend pie+bar charts (`HEALTH_LEVEL_COLORS[item.level] \|\| 'var(--ink-faint)'`). They live outside `components/analytics/**`, so the plan's slice-scoped grep gate never covers them, and they are **not listed in any 83-0X plan's `files_modified`**. Result: after 83-03, those specific chart series still render old Tailwind-default hex, while the surrounding tiles/legends are on tokens. Left unmigrated to honor 83-03's declared scope + surgical discipline (types-file edits risk colliding with the 83-07 ESLint chart-carve-out tightening). Recommend the phase decide ownership (fold into 83-07 or a follow-up) before declaring DEBT-01 fully closed for analytics. |

## Known Stubs

None introduced by this plan. (The `analytics.types.ts` hex is a pre-existing, out-of-scope constant — flagged above, not a stub added here.)

## Notes for 83-07 (declared controlled changes)

Chart hue shift (Tailwind-default → Linear-family, locked by D-83-01) and BenchmarkPreview gradient flatten are **intentional** — dashboard-widgets/analytics visual baselines will fail until the deliberate re-baseline at the 83-07 render-parity gate. Layout, spacing, borders, and radii in these files are pixel-unchanged. Not re-baselined here.

## Commits

- `3d9863d0` refactor(83-03): migrate analytics dir onto chart/semantic tokens
- `c0133b75` refactor(83-03): dashboard-widgets + report-builder onto chart tokens
- `57f7381b` refactor(83-03): stakeholder-influence color props onto tokens

## Self-Check: PASSED

All 12 touched files present, SUMMARY.md created, all 3 commit hashes resolve in git log.
