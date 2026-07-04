# Phase 83: Token-Debt Consolidation - Research

**Researched:** 2026-07-04
**Domain:** Frontend design-token migration (Tailwind v4 @theme / Linear token engine / recharts / React Flow)
**Confidence:** HIGH (every claim re-grepped against the working tree at research time; built CSS inspected for Tailwind utility mechanics)

## Summary

The spec-audit inventory is broadly accurate but the working tree has moved in three load-bearing ways.
First, **a large share of the "debt" lives in dead code**: 9 aceternity `components/ui/` files, the entire
`components/timeline/` directory (with `styles/vertical-timeline.css` and the `react-vertical-timeline-component`
dependency), the `WorldMapVisualization` → `ui/world-map.tsx` chain, `ui/chart.tsx`, and `App.css` have **zero
importers** — deletion is the correct fix and removes ~35 hex, ~25 Tailwind literals, ~8 gradients, all the
timeline `!important` px rules, and several shadow/radius sites in one move. Second, **Tailwind v4 utility
mechanics were verified in the built CSS** (`dist/assets/index-CBkpWPYJ.css`): shadow utilities _inline_ their
values (so deleting the modern-nav `--shadow-*` ladder cannot change any `shadow-*` utility), and the HeroUI
theme _hijacks the `rounded-_` namespace multiplicatively* (`rounded-sm`= 4px,`rounded-md`= 6px,`rounded-lg`= 8px,`rounded-xl`= 12px — NOT the Linear 6/8/12 names). This means`rounded-[var(--radius-sm)]`(58 of the 95`rounded-[` matches) is the app's canonical pixel-faithful form, **not debt** — and gives pixel-identical named
swaps for the real debt (`rounded-[2px]`→`rounded-xs`, `rounded-e-[12px]`→`rounded-e-xl`). Third, the
copilot-theme "parallel ladder" has already been consolidated (its `--copilot-kit-\*`vars alias design tokens);
only`modern-nav-tokens.css`still carries a real parallel ladder, and it is consumed **only by the`/modern-nav-standalone` demo route\*\*.

The keystone (DEBT-01) is an 8-slot `--chart-1…8` categorical palette added as literals to all three byte-matched
holders (mirroring the status palette exactly), with 6 of 8 dark/light values byte-copied from the already
AA-proven status fgs, chart-8 copied from the danger family, and one newly derived violet (chart-7). Chart
migration is the one DEBT class that is an **intentional, controlled color change** (Tailwind-default hues →
Linear-family hues); everything else must be pixel-identical or confined to the demo route.

**Primary recommendation:** Wave 1 = dead-code deletion + the chart token module (three copies + parity-guard
extension + contrast tests); Wave 2 = five disjoint file-sliced sweeps; Wave 3 = ESLint carve-out tightening +
re-audit greps + render parity (incl. deliberate re-baseline of chart visual snapshots).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-83-01 — Shared chart-palette token module (DEBT-01, F7, MEDIUM)**
Introduce a **shared chart-palette token module** exposing semantic series colors (`--chart-1 … --chart-n`) with
**dark + derived-light** values that meet AA, wired into the design system (mirror how the status palette is
defined — `design-system/tokens/` + `index.css` `@theme`). Migrate recharts fills
(`components/analytics/*Chart.tsx`, `dashboard-widgets/ChartWidget`) and graph node palettes
(`components/dossiers/MiniRelationshipGraph` ~20 hex, `relationships/RelationshipGraph`) plus
`components/ui/background-boxes` off the ~100 raw hex (22 files) onto the tokens. **Note:** `eslint.config.mjs:245`
currently carves out chart/graph palettes "for a future chart-token phase" — this IS that phase; once tokenized,
tighten that carve-out to only the token-definition files.

**D-83-02 — Tailwind color literals → `@theme` utilities (DEBT-02, F8, MEDIUM)**
Map the ~51 Tailwind color literals across ~11 chart/aceternity `ui/` files to the `@theme` utilities (`bg-bg`,
`bg-surface`, `text-ink`, `border-line`, `bg-accent`, `text-danger/success/warning/info`, the `text-status-N`
pairs). **CARVE-OUT — do NOT touch** the 251 `[class~=…]` matches in `styles/list-pages.css` (that is the
deliberate compat shim).

**D-83-03 — Strip banned card shadows (DEBT-03, F9, MEDIUM)**
Strip `shadow-sm` / `shadow-md` / `shadow-xl` / `shadow-2xl` from cards/graph/detail components (~88 files by
current grep; ~165 occurrences). Reserve shadow strictly for drawers/modals/hover-rows via `--shadow-drawer` /
`--shadow-lg`. Do not blanket-remove shadow on those legitimate surfaces.

**D-83-04 — Hardcoded radii → token scale (DEBT-04, F10, MEDIUM)**
Replace hardcoded radii (`rounded-[…]` arbitrary values + px literals, ~92) with `--radius-sm` / `--radius` /
`--radius-lg` (Linear **6 / 8 / 12**), including radii inherited from shadcn/HeroUI primitives (fold into the
primitive re-skin). Do not hard-code px.

**D-83-05 — Flatten gradients (DEBT-05, F11, LOW-MED)**
Flatten the ~13 real gradients (`styles/modern-nav-tokens.css`, aceternity `ui/`,
`dashboard-widgets/BenchmarkPreview` `bg-gradient-to-br`) to flat surface tokens (surfaces are flat per spec).
Leave any gradient that is legitimate data (e.g. a chart fill stop) — assess each.

**D-83-06 — Delete bespoke token ladders (DEBT-06, F12, MEDIUM)**
`styles/modern-nav-tokens.css` and `components/copilot/copilot-theme.css` define their OWN `--shadow-*` / radius /
gradient ladders in parallel to the design system (architectural drift). Make them CONSUME the design-system
tokens and DELETE the parallel ladders.

**D-83-07 — Row heights → `var(--row-h)` (DEBT-07, F13, MEDIUM)**
Drive row heights from `var(--row-h)` (density-aware); remove the `!important` pixel overrides in
`styles/vertical-timeline.css` (44px/40px) and `styles/list-pages.css` (20/28/34/32px).
**⚠ list-pages.css surgical split:** this file ALSO holds the `[class~='text-*']` color-compat shim (line ~976+,
a **carve-out — do NOT touch**). DEBT-07 edits ONLY the row-height `!important` px rules in that file, NOT the
`[class~=…]` shim block. Same file, two concerns — edit surgically.

**D-83-08 — User-visible emoji → lucide (DEBT-08, F14, LOW)**
Replace emoji-as-UI with lucide icons: `components/sla-countdown/SLACountdown.tsx` (`⚠️`/`🔴`/`⚡`/`✓` status
returns at ~L145-151) and `dossiers/RelationshipGraph.tsx` empty-state (`⚠️`/`🔗`). **Leave legitimate data
emoji** — flag codepoints, reaction sets — untouched (per spec-audit §8, most repo emoji is legitimate data).

**D-83-09 — Carve-out discipline (applies to all)**
**Do NOT touch:** `styles/list-pages.css` `[class~=…]` compat shim (251 matches; DEBT-07's row-height edit is the
ONLY allowed touch, and only the px `!important` rules), `types/*.ts` `// was #…` / `gradient →` migration
comments, and the palette holders `design-system/tokens/` + `index.css` `:root` fallback + `public/bootstrap.js`
(three-copy byte-match, CI parity-checked — the new `--chart-*` tokens are ADDED, not by mangling these holders'
existing Linear palette). No marketing voice; sentence case; logical properties.

### Claude's Discretion

The exact `--chart-N` count + values (derive AA-safe from the Linear accent/status families); whether each
gradient is decorative (flatten) or data (keep); how to re-skin primitive radii; grouping the sweep into
plans/waves by directory to stay parallel-safe.

### Deferred Ideas (OUT OF SCOPE)

- F15 marketing-voice copy → Phase 84. F16–F21 taste → Phase 85. F23–F26 → later milestone.
- Data-gap empty states / `0` counts — seed/RLS, not design.
- Legitimate data emoji (flags, reactions), the `list-pages.css` `[class~=…]` compat shim, and `types/*`
  migration comments — carve-outs, not debt.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                | Research Support                                                                                                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-01 | Shared chart-palette token module; recharts fills + graph node palettes consume tokens instead of ~100 raw hex / ~22 files | §Chart-Palette Token Module: 8-slot design, three-copy wiring spec, parity-guard extension, per-site hex→token map, `var()`-in-SVG in-repo precedent                                         |
| DEBT-02 | ~51 Tailwind color literals → `@theme` utilities                                                                           | §DEBT-02: current inventory (live files after dead-code deletion), per-pattern mapping table (`bg-blue-50 dark:bg-blue-900/20` → `bg-status-1-soft`, etc.)                                   |
| DEBT-03 | Banned card shadows stripped; shadow reserved for drawers/modals/hover-rows                                                | §DEBT-03: 167 occ/94 files current count, strip-vs-keep policy, verified Tailwind v4 shadow-inlining (deleting ladders can't shift utilities), FAB/overlay judgment list                     |
| DEBT-04 | Hardcoded radii → 6/8/12 token scale, incl. shadcn/HeroUI primitive re-skin                                                | §DEBT-04: verified HeroUI multiplicative radius hijack; 58/95 `rounded-[` already token-refs; pixel-identical swap table; CSS px-literal classification                                      |
| DEBT-05 | Real gradients flattened to flat surface tokens                                                                            | §DEBT-05: per-site decorative/data/mask verdict table (13 real sites → 7 flatten, 3 keep-allowlist, 3 dead-delete)                                                                           |
| DEBT-06 | Bespoke parallel ladders in modern-nav-tokens.css + copilot-theme.css deleted; files consume DS tokens                     | §DEBT-06: full ladder inventory, demo-only blast radius proof, copilot already-consolidated evidence, deletion-safety consumer greps                                                         |
| DEBT-07 | Row heights driven by `var(--row-h)`; `!important` px overrides removed                                                    | §DEBT-07: vertical-timeline.css is dead (delete); list-pages.css "row heights" are actually icon/logo/sidebar-item/pill dimensions with NO `!important` — evidence + recommended disposition |
| DEBT-08 | Emoji-as-UI → lucide icons; data emoji untouched                                                                           | §DEBT-08: exact lines + icon-for-icon replacement spec, return-type change note, optional dingbat sites                                                                                      |

</phase_requirements>

## Architectural Responsibility Map

| Capability                              | Primary Tier                                                                        | Secondary Tier                                      | Rationale                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| Chart token definition (`--chart-1…8`)  | Design-system token engine (`design-system/tokens/` + `bootstrap.js` + `index.css`) | Parity guard (`scripts/check-bootstrap-parity.mjs`) | Locked: mirror status palette; three-copy invariant is CI-enforced |
| Chart/graph color consumption           | Feature components (analytics, dossier, relationships)                              | —                                                   | `fill="var(--chart-N)"` / style objects; no new abstraction layer  |
| Utility-class mechanics (shadow/radius) | Tailwind v4 `@theme` + HeroUI theme layer                                           | Built CSS (verified)                                | Utility behavior determines which swaps are pixel-identical        |
| Re-audit gates                          | Lint pipeline (`pnpm --dir frontend lint`) + grep gates                             | Playwright visual suites                            | ESLint owns hex/literal enforcement post-carve-out-tightening      |

All work is frontend presentation-layer; no backend, DB, or API changes.

## Dead Code Discovery (reshapes every DEBT inventory)

Verified by repo-wide reference grep (src + tests + e2e). "Dead" = zero importers anywhere; only mention is
`components/ui/COMPONENT_REGISTRY.md` (a docs file). `[VERIFIED: rg sweep 2026-07-04]`

| Dead file/dir                                                                                   | Debt it carries                                               | Notes                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/background-boxes.tsx`                                                            | 9 hex, 3 literals, physical `left-*`                          | aceternity                                                                                                                      |
| `components/ui/world-map.tsx` + `components/geographic-visualization/WorldMapVisualization.tsx` | 2+ hex, SVG gradient, mask                                    | The live `/geographic-visualization` route imports `pages/geographic-visualization/GeographicVisualizationPage`, NOT this chain |
| `components/ui/floating-dock.tsx`                                                               | 6 literals, physical `left-*`                                 | aceternity                                                                                                                      |
| `components/ui/animated-tooltip.tsx`                                                            | 2 literals, 2 gradients, `shadow-xl`, physical                | aceternity                                                                                                                      |
| `components/ui/moving-border.tsx`                                                               | 1 literal, 1 radial-gradient (`#0ea5e9`)                      | aceternity                                                                                                                      |
| `components/ui/placeholders-and-vanish-input.tsx`                                               | 5 literals, 1 hex                                             | aceternity                                                                                                                      |
| `components/ui/related-entity-carousel.tsx`                                                     | 2 fade gradients                                              | aceternity                                                                                                                      |
| `components/ui/enhanced-progress.tsx`                                                           | 1 shimmer gradient                                            | aceternity                                                                                                                      |
| `components/ui/chart.tsx`                                                                       | 1 hex (attr selectors), 2 `rounded-[2px]`                     | shadcn chart wrapper, never imported                                                                                            |
| `components/timeline/` (all 8 components + `__tests__` + `index.ts`)                            | shadows, 2 `rounded-[`, ALL vertical-timeline usage           | Zero imports of any timeline name or `components/timeline` path outside the dir                                                 |
| `styles/vertical-timeline.css`                                                                  | ALL the DEBT-07 `!important` px rules + hsl borders + shadows | Imported only by the dead timeline components                                                                                   |
| `react-vertical-timeline-component` + `@types/...` (frontend/package.json:92,126)               | dependency                                                    | Only consumer is the dead timeline dir                                                                                          |
| `App.css`                                                                                       | 2 hex drop-shadow filters, `#888`                             | Vite scaffold leftover, never imported                                                                                          |

**Live look-alikes (do NOT delete):** `ui/pull-to-refresh-indicator.tsx`, `ui/file-upload.tsx`,
`ui/expandable-card.tsx` (used by `dossier/ExpandableDossierCard`), `ui/context-aware-fab.tsx`,
`pages/Dashboard/components/TimelineEventCard.tsx` (a _different_ file from the dead
`components/timeline/TimelineEventCard.tsx`).

**Deletion hygiene:** update `components/ui/COMPONENT_REGISTRY.md`; check `scripts/check-deleted-components.sh`
(Phase-79 pattern) for whether deleted components must be registered there; run `pnpm --dir frontend type-check`

- `pnpm --dir frontend build` to prove no dangling references; re-verify liveness at plan time with the
  knowledge graph (`graphify`) or `rg` before each `git rm` (this research's grep is the evidence trail, but
  deletion tasks should re-confirm).

## Chart-Palette Token Module (DEBT-01 — the keystone)

### Arity: 8 categorical slots + semantic reuse

Evidence for N=8: `report-builder/ReportPreview.tsx:55-62` defines an 8-color categorical cycle (blue, green,
amber, red, violet, cyan, orange, pink) — the widest simultaneous categorical need in the codebase.
`MiniRelationshipGraph` needs 7 distinct dossier-type hues + a neutral fallback; `ChartWidget` cycles 5;
`ClusterVisualization` cycles 5. `[VERIFIED: rg 2026-07-04]`

Meaning-bearing series (fulfilled/overdue/pending, health levels, priorities) do NOT use chart slots — they map
to the existing semantic tokens (`--ok`, `--warn`, `--danger`, `--info`, `--ink-faint`). Chart slots are for
_categorical_ series only.

### Values (dark canonical, light derived — Claude's discretion, locked to Linear families)

| Token       | Family (hue)        | Dark                 | Light                | Source                                                                                                                                           |
| ----------- | ------------------- | -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--chart-1` | blue/indigo (h264)  | `#87adfa`            | `#3458ac`            | byte-copy of status-1 fg                                                                                                                         |
| `--chart-2` | cyan/teal (h200)    | `#2ac4cc`            | `#00737c`            | byte-copy of status-2 fg                                                                                                                         |
| `--chart-3` | green (h155)        | `#6ac48c`            | `#007338`            | byte-copy of status-3 fg                                                                                                                         |
| `--chart-4` | amber (h90)         | `#cbaa4b`            | `#7c5700`            | byte-copy of status-4 fg                                                                                                                         |
| `--chart-5` | orange (h35)        | `#ef9179`            | `#9d381f`            | byte-copy of status-5 fg                                                                                                                         |
| `--chart-6` | magenta/pink (h330) | `#d991d2`            | `#873a82`            | byte-copy of status-6 fg                                                                                                                         |
| `--chart-7` | violet (~h300)      | _derive with culori_ | _derive with culori_ | NEW — the only genuinely new hue; must hit ≥3:1 on `--surface`/`--bg` in both modes (mirror the Phase-77 culori + `contrast.test.ts` discipline) |
| `--chart-8` | red (h28)           | `#e86154`            | `#be241f`            | byte-copy of semantic.danger                                                                                                                     |

Rationale: 7 of 8 values are byte-copies of already-AA-proven Linear literals (status fgs pass 4.5:1 as text —
trivially ≥3:1 as graphics per WCAG 1.4.11), which minimizes derivation work and keeps everything in the Linear
families as locked. Duplicate hexes under a new token name are fine — the parity guard compares values per
token, not uniqueness. `[VERIFIED: tokens/directions.ts + contrast.test.ts exists at frontend/tests/unit/design-system/]`

### Where they live (the full three-copy + guard wiring)

The parity guard (`scripts/check-bootstrap-parity.mjs`) compares a **fixed table** of vars (`CORE_PALETTE` /
`EXTENDED_PALETTE` / fonts / densities) — new vars are invisible to it unless its tables are extended. To keep
the three-copy invariant _enforced_ (its whole point — "doc-only discipline has already drifted in the past",
guard header), all six touch-points below land in ONE plan/commit: `[VERIFIED: read check-bootstrap-parity.mjs]`

1. `design-system/tokens/types.ts` — add `chart: string[]` (exactly 8; JSDoc mirroring the `status` entry) to
   `DirectionModePalette`.
2. `design-system/tokens/directions.ts` — `chart: ['#87adfa', …]` arrays in `PALETTES.linear.dark` and `.light`.
3. `design-system/tokens/buildTokens.ts` — emit loop mirroring `statusVars`: `--chart-1 … --chart-8`.
4. `frontend/public/bootstrap.js` — add `chart:['#87adfa',…]` to both `P.linear.light`/`P.linear.dark` +
   an ES5 paint loop (no arrows/template literals — file is ES5-safe by contract).
5. `frontend/src/index.css` —
   - `:root` fallback block: `--chart-1: #87adfa;` … (dark literals; the guard's `:root` check will enforce
     byte-match once the guard tables are extended);
   - `@theme` block: `--color-chart-1: var(--chart-1);` … `--color-chart-8: var(--chart-8);` → auto-generates
     `text-chart-N` / `bg-chart-N` / `fill-chart-N` / `stroke-chart-N` utilities (same mechanism as
     `--color-status-N`).
6. `scripts/check-bootstrap-parity.mjs` — extend `EXTENDED_PALETTE` with a chart loop mirroring the status loop
   (~4 lines): `for i in 0..7: ['--chart-N', p => p.chart && p.chart[i]]`.

Plus test updates (Wave 0 of the module plan): add chart contrast assertions to
`frontend/tests/unit/design-system/contrast.test.ts` (≥3:1 non-text contrast vs `--surface` and `--bg`, both
modes) and extend `buildTokens.test.ts` / `fouc-bootstrap.test.ts` if they assert var counts.

Mode switching is automatic: `DesignProvider` re-runs `buildTokens` and `applyTokens` writes inline
`--chart-*` on `<html>` on every mode flip — no `.dark` CSS needed. `[VERIFIED: buildTokens.ts/applyTokens.ts read]`

### Do CSS vars work in recharts / React Flow? (in-repo precedent: YES)

- `stroke="var(--ok)"` / `fill="var(--ink)"` already ship in `components/signature-visuals/Donut.tsx:64-112`,
  `components/analytics/EngagementMetricsChart.tsx:214` (`stroke="var(--color-accent)"`), and
  `components/sla-monitoring/SLAComplianceChart.tsx:151,198`. `[VERIFIED: rg]`
- React Flow node/edge colors in `MiniRelationshipGraph` are applied via `style` objects (CSS properties) —
  `var()` always works there.
- **Verify at execution:** React Flow `markerEnd.color` (`MiniRelationshipGraph.tsx:372`) and
  `<Background color=…>` (`:452`) are forwarded into SVG attributes; `var()` in SVG presentation attributes
  works in current Chrome/Firefox/Safari but this specific pair should be eyeballed on the rendered graph
  (arrowheads + dot grid colored, not black/transparent). Fallback if it fails: keep those two props as
  `getComputedStyle`-resolved values. [ASSUMED — browser behavior for these two props; in-repo precedent covers
  fill/stroke only]

### Per-site hex → token map (the migration table)

Canonical hue routing (apply everywhere; distinct old colors must stay distinct within a file):

| Old hex (any case)                                                    | Tailwind name      | New token                                                                                                                                      |
| --------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `#3b82f6`, `#1f77b4`                                                  | blue-500 / d3-blue | `var(--chart-1)`                                                                                                                               |
| `#06b6d4`, `#14b8a6`, `#0ea5e9`                                       | cyan/teal/sky-500  | `var(--chart-2)`                                                                                                                               |
| `#10b981`, `#22c55e`, `#2ca02c`, `#34d399`                            | emerald/green      | `var(--chart-3)` (categorical) or `var(--ok)` (semantic "good/fulfilled")                                                                      |
| `#f59e0b`, `#fbbf24`                                                  | amber              | `var(--chart-4)` (categorical) or `var(--warn)` (semantic "at-risk/late")                                                                      |
| `#f97316`, `#ff7f0e`                                                  | orange             | `var(--chart-5)`                                                                                                                               |
| `#ec4899`                                                             | pink-500           | `var(--chart-6)`                                                                                                                               |
| `#8b5cf6`, `#a855f7`, `#9333ea`, `#9467bd`                            | violet/purple      | `var(--chart-7)`                                                                                                                               |
| `#6366f1`                                                             | indigo-500         | `var(--accent-ink)` (brand-indigo band; keeps it distinct from chart-1 AND chart-7 where a file uses all three)                                |
| `#ef4444`, `#d62728`                                                  | red-500            | `var(--chart-8)` (categorical) or `var(--danger)` (semantic "overdue/critical")                                                                |
| `#9ca3af`, `#6b7280`                                                  | gray-400/500       | `var(--ink-faint)` (pending/unknown/fallback)                                                                                                  |
| `#ffffff` node-label fill (`relationships/RelationshipGraph.tsx:192`) | —                  | `var(--accent-fg)` (pixel-identical: `#ffffff` both modes)                                                                                     |
| `#e5e7eb` React Flow dots (`MiniRelationshipGraph.tsx:452`)           | gray-200           | `var(--line)` — **flag: pixel change**; the current light-gray dots are a light-theme leftover that renders wrong in dark mode; token fixes it |

File-by-file (current line numbers, `[VERIFIED: rg 2026-07-04]`):

- `components/dossier/MiniRelationshipGraph.tsx` (20 hex) — `NODE_COLORS` (:103-109): country→chart-1,
  organization→chart-7, person→chart-3, forum→chart-4, engagement→chart-6, working_group→chart-2,
  topic→accent-ink; fallbacks :142/:365/:372/:377→ink-faint; `EDGE_COLORS` (:113-120) same hue routing;
  Background dots :452→line.
- `components/analytics/CommitmentFulfillmentChart.tsx` (11 hex) — STATUS_COLORS (:88-91): onTime→ok,
  late→warn, overdue→danger, pending→ink-faint; SOURCE_COLORS (:95-97): commitment→chart-1, task→chart-7,
  intake→chart-6; :154 fallback→ink-faint; :273 stroke→chart-1; :303 fill→ink-faint; :309 fill→ok.
- `components/analytics/sample-data.ts` (10 hex) — health-level fixture colors (:127-132): excellent→ok,
  good→chart-3, fair→warn, poor→chart-5, critical→danger, unknown→ink-faint; priority (:285-288): low→ink-faint,
  medium→info, high→warn, urgent→danger. (These are data-shaped strings consumed as recharts fills —
  `'var(--ok)'` strings work.)
- `components/analytics/WorkloadDistributionChart.tsx` (4 hex) — :111 fallback→ink-faint, :211→chart-1,
  :218→danger, :275→chart-7.
- `components/analytics/RelationshipHealthChart.tsx` (3 hex) — :110/:119 fallback→ink-faint, :237 stroke→ok.
- `components/dashboard-widgets/ChartWidget.tsx` (5 hex) — CHART_COLORS array (:21-25) → `[var(--chart-1),
var(--chart-3), var(--chart-4), var(--chart-8), var(--chart-7)]`.
- `components/relationships/RelationshipGraph.tsx` (6 hex) — edge type colors (:62-66): reports_to→danger,
  collaborates_with→chart-1, partner→chart-3, colleague→chart-4, other→ink-faint; :192 label→accent-fg.
- `components/stakeholder-influence/InfluenceMetricsPanel.tsx` (8 hex, `color=` props :247-344) —
  #6366f1→accent-ink, #8b5cf6→chart-7, #a855f7→chart-7 (or chart-6 if the two must differ — check the two tiles
  side-by-side), #f59e0b→chart-4, #3b82f6→chart-1, #22c55e→ok, #ef4444→danger.
- `components/stakeholder-influence/InfluenceReport.tsx` (4 hex :263-281) — chart-1, chart-7, chart-7/6, ok.
- `components/report-builder/ReportPreview.tsx` (8 hex :55-62) — the 8-slot cycle → `chart-1…chart-8` in the
  hue-matched order: `[chart-1, chart-3, chart-4, chart-8, chart-7, chart-2, chart-5, chart-6]`.
- `components/analytics/ClusterVisualization.tsx` (:14) — d3 tab10 5-cycle → `[chart-1, chart-5, chart-3,
chart-8, chart-7]`.
- Already clean (in the ESLint carve-out but token-based today — drop from carve-out with zero edits):
  `EngagementMetricsChart.tsx`, `AnalyticsPreviewOverlay.tsx`, `SLAComplianceChart.tsx` (uses `--heroui-success`
  bridge — optionally normalize to `var(--ok)`), `RelationshipHealthChart` partially.
- Deleted instead of migrated: `ui/background-boxes.tsx`, `ui/world-map.tsx`, `ui/chart.tsx` (dead — above).

**Hex that is legitimate — LEAVE:** `signature-visuals/flags/**` (flag SVGs — permanent ESLint carve-out),
`design-system/tokens/directions.ts` + `public/bootstrap.js` + `index.css :root` (the three holders), comment-only
hex (`types/tag-hierarchy.types.ts` ×10, `types/calendar-sync.types.ts:299`, `styles/list-pages.css:797`,
`components/workspace/WorkspaceTabNav.tsx:93`, `pages/Dashboard/widgets/dashboard.css:940`,
`lib/semantic-colors.ts:6`), test fixtures (`signature-visuals/__tests__/Sparkline.test.tsx`), and the inert
copy-string `(#1A1D26)` in `routes/modern-nav-standalone.tsx:99` (handled in the modern-nav slice).

### ESLint carve-out tightening (the phase's own tell)

`eslint.config.mjs` "Design-token Tier-B carve-out" (currently lines ~244-268) lists 15 chart/graph files + the
3 legit holders. After migration, shrink `files:` to exactly:
`frontend/src/design-system/tokens/directions.ts`, `frontend/public/bootstrap.js`,
`frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}`. Running `pnpm --dir frontend lint`
(`--max-warnings 0`) then _becomes_ the DEBT-01/02 re-audit gate — any missed hex or literal fails CI.
`[VERIFIED: eslint.config.mjs read; the no-restricted-syntax selectors ban hex + palette literals incl. template strings]`

## DEBT-02 — Tailwind color literals → @theme utilities

Current: ~51 matches / 11 files; **~24 of them are in the dead aceternity files** (expandable-card is live).
After Wave-1 deletion, the live inventory: `[VERIFIED: rg 2026-07-04]`

| File                                                     | #   | Pattern → replacement                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analytics/WorkloadDistributionChart.tsx` :285-310, :337 | 9   | summary tiles (below) + `text-red-500` → `text-danger`                                                                                                                                                                                                                                                                                                                                                                            |
| `analytics/CommitmentFulfillmentChart.tsx` :320-345      | 8   | summary tiles (below)                                                                                                                                                                                                                                                                                                                                                                                                             |
| `analytics/RelationshipHealthChart.tsx` :276-293         | 6   | summary tiles (below)                                                                                                                                                                                                                                                                                                                                                                                                             |
| `ui/expandable-card.tsx` :31-197 (LIVE)                  | 8   | `text-black`→`text-ink`, `bg-black/20` scrim→`bg-bg/60` (or keep — scrim is mode-legit), `bg-white`/`bg-white dark:bg-neutral-900`→`bg-surface-4` (it is a modal card), `text-neutral-700 dark:text-neutral-200`→`text-ink`, `text-neutral-600 dark:text-neutral-400`→`text-ink-mute`, `bg-green-500 text-white`→`bg-accent text-accent-fg` (CTA pill), `hover:bg-neutral-50 dark:hover:bg-neutral-800`→`hover:bg-surface-raised` |
| `lib/semantic-colors.ts` :6                              | 1   | comment only — no change                                                                                                                                                                                                                                                                                                                                                                                                          |
| `signature-visuals/__tests__/Sparkline.test.tsx`         | 2   | test fixture — no change                                                                                                                                                                                                                                                                                                                                                                                                          |

The recurring tile idiom maps 2-classes→1 token class (tokens are mode-aware, so `dark:` variants drop):

| Old pair                                                                          | New                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `bg-blue-50 dark:bg-blue-900/20` + `text-blue-600 dark:text-blue-400`             | `bg-status-1-soft` + `text-status-1`                   |
| `bg-emerald-50 dark:bg-emerald-900/20` + `text-emerald-600 dark:text-emerald-400` | `bg-ok/10` + `text-ok` (semantic: "completed")         |
| `bg-amber-50 …` + `text-amber-600 …`                                              | `bg-warn/10` + `text-warn`                             |
| `bg-red-50 …` + `text-red-600 …`                                                  | `bg-danger/10` + `text-danger`                         |
| `bg-violet-50 …` + `text-violet-600 …`                                            | `bg-chart-7/10` + `text-chart-7` (categorical "tasks") |
| `bg-orange-50 …` + `text-orange-600 …`                                            | `bg-status-5-soft` + `text-status-5`                   |
| `bg-gray-50 dark:bg-gray-800` + `text-gray-600 dark:text-gray-400`                | `bg-surface-raised` + `text-ink-mute`                  |

(Soft-wash convention per `frontend/CLAUDE.md`: semantic softs via opacity modifiers `bg-ok/10`; status softs via
the `-soft` utilities.) **Flag:** these are near-match, not byte-match colors — a small controlled shift to
Linear values, same class of change as the chart migration. **CARVE-OUT:** the 251 `[class~=…]` selectors in
`styles/list-pages.css` (shim block starts ~:976, plus `body :is([class~='rounded-2xl']…)` :1364-1367) — untouched.

## DEBT-03 — Banned card shadows

Current: **167 occurrences / 94 files** (`\bshadow-(sm|md|xl|2xl)\b`). `[VERIFIED: rg 2026-07-04]`

**Mechanics (verified in built CSS, `dist/assets/index-CBkpWPYJ.css`):** Tailwind v4 shadow utilities INLINE
their values (`.shadow-md{--tw-shadow:0 4px 6px -1px …}`), they do NOT reference `var(--shadow-md)`. Two
consequences: (a) `shadow-sm` renders a real visible shadow today (index.css's `--shadow-sm: none` does not
neuter the utility) — stripping it is the _intended_ visual correction, diffs are subtle (≤10 %-black soft
shadows); (b) deleting the modern-nav `--shadow-*` ladder (DEBT-06) cannot change any `shadow-*` utility — the
two DEBTs are independent. `[VERIFIED: built CSS grep]`

**Policy (per file-role, default = strip the class, hairline border stays):**

1. **Strip (the ~90 % case):** cards, graph containers, detail panels, list pages, form fields, tiles, FAB
   tooltips. Top offenders: `type-specific-fields/TypeSpecificFields.tsx` (11),
   `relationships/AdvancedGraphVisualization.tsx` (11), `pages/dossiers/DossierListPage.tsx` (9),
   `relationships/EnhancedGraphVisualization.tsx` (9), `router/index.tsx` (3 — error/pending screens are cards:
   strip `shadow-xl`/`shadow-sm`), `ui/sidebar.tsx` (3 — unused shadcn floating/inset variant classes + menu
   `data-[active=true]:shadow-sm`: strip), plus ~80 files with 1-2 each (mechanical).
2. **Replace with an allowed tier (planner judgment list):** the two FABs are floating overlay controls —
   `ui/context-aware-fab.tsx` :271 (`shadow-md hover:shadow-lg`) and :502 (`shadow-lg hover:shadow-xl`);
   `dossier/AddToDossierMenu.tsx` :434, :452 (same idiom). Recommend: single static `shadow-lg`, remove the
   banned tier + the hover escalation. Their tooltip poppers (:253, :536, :419) are popovers → per DESIGN.md
   popovers get `--surface-3` + hairline, NO shadow → strip.
3. **Definition sites (NOT card usage):** `styles/modern-nav-tokens.css` (9 — deleted in DEBT-06),
   `components/copilot/copilot-theme.css` (4 — three are `--copilot-kit-shadow-*: none` i.e. already compliant;
   the fourth, `:758 box-shadow: var(--shadow-sm)`, resolves to `none` via index.css `:root` — delete the dead
   declaration), `index.css` (2 — the DS elevation-triplet definitions `--shadow-sm: none` etc. at :264 — KEEP,
   they are the design system).
4. **`shadow-lg` (67 matches / 51 files) is NOT in the banned set** — leave; drawers/modals already use it or
   `--shadow-drawer`.

**Strip-list generation is mechanical at plan time:** the full grep minus §3 definition sites minus the §2
judgment list. No per-file table needed beyond the above — every other match is a strip.

## DEBT-04 — Hardcoded radii

**Verified utility mechanics (built CSS):** the HeroUI theme layer redefines Tailwind's radius namespace
_multiplicatively from `--radius` (8px)_: `rounded-xs`=2px, `rounded-sm`=4px, `rounded-md`=6px, `rounded-lg`=8px,
`rounded-xl`=12px. **The Linear names do NOT line up** (`--radius-sm` 6px ≠ `rounded-sm` 4px). Therefore
`rounded-[var(--radius-sm)]` — 58 of the current 95 `rounded-[` matches — is the app's canonical pixel-faithful
form and is **NOT debt. Do not "simplify" it to `rounded-sm`** (that is a 6px→4px pixel change).
`[VERIFIED: dist CSS — .rounded-sm{border-radius:calc(var(--radius) * .5)} etc.]`

Actual remaining debt (current re-grep):

| Site                                                                               | Old  | Pixel-identical fix                                                  |
| ---------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------- |
| `components/layout/Sidebar.tsx:167` `before:rounded-[2px]` (2px active bar)        | 2px  | `before:rounded-xs` (=calc(8×.25)=2px)                               |
| `components/ui/tooltip.tsx:42` arrow `rounded-[2px]`                               | 2px  | `rounded-xs`                                                         |
| `components/ui/file-upload.tsx:172` swatch `rounded-[2px]`                         | 2px  | `rounded-xs`                                                         |
| `components/ui/chart.tsx:206,297`                                                  | 2px  | dead — deleted                                                       |
| `components/modern-nav/NavigationShell/NavigationShell.tsx:238` `rounded-e-[12px]` | 12px | `rounded-e-xl` (=calc(8×1.5)=12px) or `rounded-e-[var(--radius-lg)]` |
| `rounded-[inherit]` (1)                                                            | —    | legit, leave                                                         |

CSS `border-radius: <N>px` literals (~35, classified):

- **On-scale → token (pixel-identical):** 6px → `var(--radius-sm)` (`pages/WorkBoard/board.css:296`,
  `dashboard.css:864`); 8px → `var(--radius)` (`styles/list-pages.css:294`, `calendar.css:16,118,188`);
  12px → `var(--radius-lg)` (`dashboard.css:834`).
- **Half-scale → calc (pixel-identical):** 4px → `calc(var(--radius) * 0.5)` (`board.css:317,323`,
  `calendar.css:68,175`, `tweaks-drawer.css:60,175`).
- **Pills (99/999/9999px):** idiomatic "full" radius, not on the 6/8/12 scale — KEEP (optionally normalize to
  `9999px`); sites: `list-pages.css:514,753,898`, `copilot-theme.css:124,766`, `board.css:199`, `dashboard.css:82`.
- **Micro radii (1-3px on scrollbar thumbs / kbd / tiny indicators):** sub-scale detail, not surface corners —
  KEEP as-is with the gate scoped to exclude them (`index.css:335,723,785,832`, `list-pages.css:213,235,325`,
  `copilot-theme.css:640`, `dashboard.css:521,703`, `tweaks-drawer.css:186,195,231`). Converting 3px→6px is a
  visible change with no spec backing (the spec governs surface corners).
- **Off-scale 10px (`dashboard.css:890,908`):** snap to `var(--radius-lg)` (12px) or `var(--radius)` (8px) —
  2px visible delta either way; eyeball at the render-parity gate. [Planner: pick one, verify visually.]

**shadcn/HeroUI primitive re-skin:** the primitives in `components/ui/` (`dropdown-menu` 6, `dialog` 2,
`tooltip` 2, `sheet`, `popover`, etc.) already predominantly use `rounded-[var(--radius-*)]` — the re-skin fold-in
is limited to the `rounded-[2px]` arrow/swatch cases above plus verifying no remaining numeric `rounded-[Npx]`
after the sweep (`rg 'rounded-(s-|e-|t-|b-)?\[[0-9]'` → 0).

## DEBT-05 — Gradients (per-site verdicts)

13 real sites re-grepped; after Wave-1 deletions (world-map, animated-tooltip, moving-border,
related-entity-carousel, enhanced-progress dead), the live decisions: `[VERIFIED: rg 2026-07-04]`

| Site                                                                                                                              | Verdict                                                     | Action                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `modern-nav-tokens.css` :272, :297 (icon-button glass radials), :383, :401 (panel-item shine), :559 (glass-highlight)             | Decorative glassmorphism                                    | DELETE with the DEBT-06 rework (demo-only surface)                                         |
| `modern-nav/IconRail.tsx:181` (separator shadow gradient), `:232` (rail bg `from-[hsl(…)]`)                                       | Decorative                                                  | Flatten: separator → `1px solid var(--line)`; rail bg → `var(--sidebar-bg)`                |
| `modern-nav/NavigationShell.tsx:243` `linear-gradient(color-mix(var(--bg)…), color-mix(var(--bg)…)), url(/white-texture.jpg)`     | Two-identical-stop solid tint over a texture — renders FLAT | KEEP, allowlist (it is a solid overlay technique, not a visual gradient)                   |
| `dashboard-widgets/BenchmarkPreview.tsx:141` `from-primary/5 to-primary/10`; `:274` `from-background via-background to-primary/5` | Decorative card wash (live dashboard widget)                | Flatten: :141 → `bg-accent/5`; :274 → `bg-bg`                                              |
| `guided-tours/TourTrigger.tsx:97,206` `from-primary/10 …`                                                                         | Decorative wash                                             | Flatten → `bg-accent/5`                                                                    |
| `milestone-planning/MilestonePlannerEmptyState.tsx:196` `from-primary/20 to-primary/5` circle                                     | Decorative                                                  | Flatten → `bg-accent-soft`                                                                 |
| `relationships/TouchOptimizedGraphControls.tsx:169` `from-primary to-primary/70` (zoom-slider fill)                               | Decorative                                                  | Flatten → `bg-accent`                                                                      |
| `ui/pull-to-refresh-indicator.tsx:144` `from-muted/50 to-transparent`                                                             | Decorative pull-hint fade                                   | Flatten → `bg-muted/30` (or remove — eyeball on mobile)                                    |
| `components/tweaks/tweaks-drawer.css:164` (oklch rainbow)                                                                         | **DATA** — it is a hue-picker slider track                  | KEEP, allowlist                                                                            |
| `components/signature-visuals/globe-loader.css:28` `radial-gradient(color-mix(var(--ink)…))`                                      | Signature-visual glow, already token-driven                 | KEEP, allowlist                                                                            |
| `ui/expandable-card.tsx:160`, `ui/file-upload.tsx:65`, `ui/world-map.tsx:91`                                                      | `mask-image`/`[mask:…]` fades                               | Masks are not gradient _backgrounds_ — out of DEBT-05 scope; leave (world-map dies anyway) |

Re-audit gate allowlist: masks (`[mask`/`mask-image`), `tweaks-drawer.css` hue track, `globe-loader.css`,
`NavigationShell.tsx:243` tint.

## DEBT-06 — Bespoke parallel ladders

**`components/copilot/copilot-theme.css` — already consolidated.** Its only "ladder" is the CopilotKit-required
`--copilot-kit-*` vars (:26-41) which _alias design tokens_ (`var(--surface)`, `var(--ink)`, `var(--accent)`…)
and set `--copilot-kit-shadow-sm/md/lg: none` — that IS the consumption mechanism. Remaining touches: delete the
dead `box-shadow: var(--shadow-sm)` at :758 (resolves to `none` via index.css `:root` — removal is
pixel-identical), leave the pills. Document DEBT-06's copilot half as satisfied-by-evidence.
`[VERIFIED: file read 2026-07-04]`

**`styles/modern-nav-tokens.css` — the real parallel ladder.** Imported globally (`index.css:5`) but its
component classes are consumed ONLY by `components/modern-nav/**` + `routes/modern-nav-standalone.tsx` (a kept
demo route) — blast radius of visual changes is confined to the demo. `[VERIFIED: importer grep]` Inventory:

| Ladder                                                                                                                                                                                                | Lines              | Parallel to                                                           | Disposition                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--shadow-xs/sm/md/lg/xl` + `-dark` + `.dark` swap                                                                                                                                                    | :117-128, :203-207 | index.css elevation triplet                                           | DELETE. Safe: Tailwind shadow utilities inline values (verified); the only `var(--shadow-sm/md)` consumers outside this file resolve against index.css `:root` (`--shadow-sm: none`, `--shadow`, `--shadow-lg`) which stays                     |
| `--radius-xs…-3xl/-full` multiplicative scale                                                                                                                                                         | :136-144           | HeroUI theme layer defines the SAME scale (verified in built CSS)     | DELETE — a byte-duplicate of what `@heroui/styles/themes/default` already provides; deleting is behavior-neutral                                                                                                                                |
| `--space-0…16` (rem)                                                                                                                                                                                  | :91-101            | index.css `:root` `--space-1…12` (px, equal values at 16px root)      | DELETE; re-point any `var(--space-N)` consumers in modern-nav files (index.css's defs remain)                                                                                                                                                   |
| hsl color tables `--icon-rail-*`, `--panel-*`, `--badge-*`, `--content-*`, `--success/warning-indicator`                                                                                              | :14-77, :179-201   | the Linear palette                                                    | DELETE; re-point consumers: rail/panel bg → `var(--sidebar-bg)`/`var(--surface-3)`, borders → `var(--line)`, text → `var(--ink)`/`var(--ink-mute)`, indicators → `var(--ok)`/`var(--danger)`, badge → `var(--surface-raised)`/`var(--ink-mute)` |
| glass effects: `.icon-button::after`/`.active` radials, `.panel-item` shine + inset shadows, `.metric-card` MD3 `!important` shadows, `.metric-value`/`.section-header`/`.text-engraved` text-shadows | :264-545           | flat-surface spec                                                     | FLATTEN (hover → `background: var(--surface-3)`; active bar keeps `var(--accent)`; metric-card → `1px solid var(--line)`, no shadow; drop text-shadows) — demo-only visual change, exempt from render-parity                                    |
| Component dims (`--icon-rail-width`, `--icon-button-size`, `--active-indicator-*`, `--panel-width`, `--panel-indent`)                                                                                 | :104-111           | nothing (local layout constants)                                      | KEEP (not parallel to any DS ladder)                                                                                                                                                                                                            |
| `--transition-*`, `--ease-in/in-out/bounce`, `--z-*`                                                                                                                                                  | :150-171           | `--ease-out`/`--dur*` exist in index.css; rest have no DS counterpart | Delete the duplicate `--ease-out` def; keep or inline the rest — planner discretion, not ladder-parallel                                                                                                                                        |

**Deletion-safety fact:** files outside modern-nav that matched a broad `var(--shadow-*|--space-*|--transition-*…)`
grep (`ui/checkbox.tsx`, `ui/heroui-switch.tsx`, `ui/radio-group.tsx`, `signals/SignalRow.tsx`,
`relationships/AnalyticResultView.tsx`, `AnalyticQueryPicker.tsx`, `DossierDrawer/DrawerSkeleton.tsx`,
`copilot-theme.css`, `vertical-timeline.css`, `index.css`) resolve against index.css `:root` definitions
(`--shadow-sm: none`, `--space-N`, `--ease-out`, `--dur*`) which are NOT being deleted — each plan task deleting
a var must include a `rg "var(--<name>)"` zero-external-consumer check in its verification. `[VERIFIED: grep + index.css read]`

## DEBT-07 — Row heights (evidence overturns half the inventory)

**`styles/vertical-timeline.css`:** all the `!important` px rules are real (`:36-37,60-61` 44px, `:188-189`
40px, `:262-263` min 44px + ~25 more `!important` physical/hsl rules) — but the file styles
`react-vertical-timeline-component` markers and is consumed ONLY by the dead `components/timeline/` directory.
**Disposition: delete the CSS + the dead components + the npm dep** (Wave 1). This satisfies the
vertical-timeline half of DEBT-07 with zero visual risk (nothing mounts it). If the planner prefers not to
delete, the fallback per locked decision is mechanical (`44px !important` → `var(--row-h)`), but deletion is
strictly better. `[VERIFIED: importer grep — zero external references]`

**`styles/list-pages.css` — the 20/28/34/32px values are NOT row heights and NOT `!important`:** `[VERIFIED: file read]`

| Line | Rule                                   | What it actually is                                                                                                        | Disposition                                                           |
| ---- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| :82  | `.page-head-icon svg { height: 20px }` | icon glyph size                                                                                                            | leave — not a row                                                     |
| :224 | `.sb-mark { height: 28px }`            | sidebar logo box                                                                                                           | leave                                                                 |
| :243 | `.sb-item { min-height: 34px }`        | sidebar nav item (deliberate handoff density; also gets a 44px floor at :1407 under `@media (max-width:1024px)` for touch) | leave — converting to `var(--row-h)` (52px) would balloon the sidebar |
| :761 | `.pill { min-height: 32px }`           | filter pill                                                                                                                | leave                                                                 |
| :812 | `.dossier-row { min-height: 44px }`    | row FLOOR under a padded grid row (not an override fighting `--row-h`)                                                     | leave                                                                 |

**None carry `!important`.** The requirement text ("the `!important` pixel overrides … are removed") is
satisfied by the vertical-timeline deletion; the list-pages half should be closed as _verified-not-debt_ with
this evidence cited in the plan's verification (spec-audit §7 misclassified component dimensions as row
heights). The **surgical-split warning stands**: any list-pages.css edit in this phase must not touch the
`[class~=…]` shim block (~:976-1367). Re-audit gate: `rg -n '(min-)?height:\s*\d+px\s*!important' frontend/src/styles/` → 0.

## DEBT-08 — Emoji-as-UI → lucide

`[VERIFIED: file reads 2026-07-04]`

**`components/sla-countdown/SLACountdown.tsx`** — `getStatusIcon(): string` (:144-151) returns emoji rendered
inline at :212 (`{getStatusIcon()} {formatTimeRemaining(…)}`). Change return type to `ReactNode`
(explicit-return-type ESLint rule applies) and add lucide imports (file currently imports none):

| Emoji | Condition       | Lucide replacement (size `h-3.5 w-3.5 inline-block`)        |
| ----- | --------------- | ----------------------------------------------------------- |
| `⚠️`  | isBreached      | `TriangleAlert`                                             |
| `⏸️`  | isPaused        | `CirclePause`                                               |
| `✓`   | >25 % remaining | `Check`                                                     |
| `⚡`  | >10 % remaining | `Zap`                                                       |
| `🔴`  | ≤10 %           | `CircleAlert` (color comes from the existing badge classes) |

**`components/dossiers/RelationshipGraph.tsx`** — error state :299 `<span className="text-2xl">⚠️</span>` →
`<TriangleAlert className="h-6 w-6 text-destructive" />`; empty state :312 `<span className="text-3xl">🔗</span>`
→ `<Link2 className="h-8 w-8 text-muted-foreground" />` (this file is also in the DEBT-01 graph slice — one owner).

**Optional adds (borderline dingbats, planner discretion, cheap):** `tasks/ConflictDialog.tsx:207`,
`field-history/FieldHistoryTimeline.tsx:89`, `entity-comparison/EntityComparisonTable.tsx:87` (`✓`/`✗` boolean
render → lucide `Check`/`X`); `routes/modern-nav-standalone.tsx` `✅`/`✓` checklist bullets (fold into the
modern-nav slice). **Leave (data carve-out):** `ReactionPicker`/`comment.types` EMOJI_LIST,
`multilingual-content.types` flag codepoints, `lib/person-display.ts`, JSDoc-only occurrences
(`DrawerMetaStrip`, `DossierContextIndicator:6`, `TriagePanel:151`).

## Regression Safety — what is pixel-identical vs controlled change

| Class                                                                                   | Pixel outcome                                                                                                                                                                                               | Proof mechanism                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dead-code deletion (Wave 1)                                                             | Zero render change (nothing mounts it)                                                                                                                                                                      | type-check + build green; route smokes unchanged                                                                                                                |
| DEBT-04 swaps (`rounded-[2px]`→`rounded-xs`, on-scale CSS px→`var()`, 4px→`calc(*0.5)`) | Byte-identical computed values (verified against built CSS)                                                                                                                                                 | visual specs stay green without re-baseline                                                                                                                     |
| DEBT-06 ladder deletion                                                                 | Neutral outside `/modern-nav-standalone` (utilities inline; external `var()` consumers resolve to index.css defs); demo route changes deliberately                                                          | targeted before/after screenshot of the demo route only                                                                                                         |
| DEBT-07                                                                                 | Zero (deletion of unmounted CSS; list-pages untouched)                                                                                                                                                      | —                                                                                                                                                               |
| DEBT-03 shadow strip                                                                    | **Subtle intended change**: removes real ≤10 %-black shadows from cards (the spec correction)                                                                                                               | route visual specs re-baselined knowingly; borders unchanged                                                                                                    |
| DEBT-01/02 chart + tile colors                                                          | **Intended controlled hue shift** Tailwind-default → Linear-family (locked by D-83-01 "derive from the Linear accent/status families" — pixel-parity is impossible AND not the goal here)                   | `dashboard-widgets-visual` committed baselines (maxDiffPixelRatio 0.02) WILL fail → deliberate re-baseline with human eyeball at 1400/1024 × dark/light × EN/AR |
| DEBT-05 flattens                                                                        | Subtle intended change on 6 live decorative sites                                                                                                                                                           | per-site eyeball at parity gate                                                                                                                                 |
| DEBT-08 emoji→lucide                                                                    | Intended glyph change, layout-neutral sizes specified                                                                                                                                                       | eyeball SLA badge + graph empty states                                                                                                                          |
| Specific flags                                                                          | `MiniRelationshipGraph:452` dots `#e5e7eb`→`var(--line)` (fixes a dark-mode bug — visible change); `dashboard.css:890,908` 10px→8/12px snap (2px delta); analytics tile washes (near-match, not byte-match) | listed for explicit eyeball                                                                                                                                     |

## Don't Hand-Roll

| Problem                     | Don't build                                           | Use instead                                                                           | Why                                                                                       |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Theme-reactive chart colors | JS color-resolution hook / context re-render plumbing | `var(--chart-N)` in fills/strokes/style objects                                       | In-repo precedent works (Donut.tsx); DesignProvider already flips the vars on mode change |
| Light-mode chart derivation | New color math                                        | culori derivation + `contrast.test.ts` assertions (Phase-77 pattern)                  | Discipline + tooling already exist                                                        |
| Parity enforcement          | New checker                                           | Extend `check-bootstrap-parity.mjs` tables (~4 lines, mirrors status loop)            | Guard is generic by design (`pick(palette)` skips absent groups)                          |
| Hex/literal re-audit        | New audit script                                      | ESLint carve-out tightening — `pnpm --dir frontend lint --max-warnings 0` IS the gate | Rules already error on hex + palette literals incl. template strings                      |
| Icon replacements           | Custom SVG                                            | `lucide-react` (installed, project convention)                                        | —                                                                                         |

## Standard Stack

No new libraries. Everything needed is installed: `lucide-react`, `recharts` (charts-vendor chunk),
`@xyflow/react`/React Flow (graphs), `culori` (dev-time derivation, used in Phase 77), Vitest, Playwright.
One dependency is **removed**: `react-vertical-timeline-component` + `@types/react-vertical-timeline-component`
(frontend/package.json:126, :92) once `components/timeline/` is deleted.

## Package Legitimacy Audit

No packages are installed by this phase (removal only). slopcheck not required. Registry verification N/A.

## Common Pitfalls

### Pitfall 1: "Simplifying" `rounded-[var(--radius-sm)]` → `rounded-sm`

**What goes wrong:** 6px → 4px everywhere (58 sites) — HeroUI's theme layer redefines `rounded-*`
multiplicatively from `--radius`, so the named utilities do NOT match the Linear `--radius-sm/lg` names.
**How to avoid:** treat `rounded-[var(--radius-*)]` as canonical; the plan must state this explicitly so a
sweeping executor doesn't "clean it up". **Warning sign:** any diff touching `rounded-[var(`.

### Pitfall 2: Assuming the modern-nav `--shadow-*`/`--radius-*` ladder affects Tailwind utilities

**What goes wrong:** fear-driven sequencing or, worse, "fixing" utilities that were never affected. Verified:
v4 shadow utilities inline values; radius utilities reference the HeroUI calc which modern-nav byte-duplicates.
**How to avoid:** delete the ladder freely; verify external `var()` consumers per the DEBT-06 safety table.

### Pitfall 3: Byte-match drift when adding `--chart-*`

**What goes wrong:** adding chart tokens to `directions.ts` + `index.css` but forgetting `bootstrap.js`, or
adding all three but not extending the guard tables — the guard silently ignores unknown vars, so drift begins
unchecked. **How to avoid:** all six touch-points (types, directions, buildTokens, bootstrap, index.css ×2,
guard) in ONE plan task; `node scripts/check-bootstrap-parity.mjs` in that task's verification. Also:
`bootstrap.js` is ES5-only (no arrows/const/template literals) — write the paint loop accordingly.

### Pitfall 4: The list-pages.css shim

**What goes wrong:** a regex-driven literal sweep "fixes" the 251 `[class~='text-gray-900']` selectors and
breaks the compat layer. **How to avoid:** exclude `styles/list-pages.css` from every DEBT-02 task's file list;
the D-83-09 gate greps the file for byte-identity of the shim block (`git diff --stat` on the file should show
zero changes, since even the row-height half was overturned by evidence).

### Pitfall 5: ESLint explicit-return-type on the SLACountdown change

**What goes wrong:** changing `getStatusIcon` to return JSX without updating the `: string` annotation fails
`@typescript-eslint/explicit-function-return-type`/type-check. **How to avoid:** `(): ReactNode` and import type.

### Pitfall 6: Deleting "dead" files that tests import

**What goes wrong:** `components/timeline/__tests__/*` reference the timeline components; vitest fails after a
partial delete. **How to avoid:** delete the whole directory including `__tests__`; run
`pnpm --dir frontend exec vitest run` in the deletion task's verification. Same for
`check-deleted-components.sh` / `COMPONENT_REGISTRY.md` bookkeeping.

### Pitfall 7: React Flow marker/Background color `var()` support

**What goes wrong:** edge arrowheads or the dot grid render black/unstyled if those two props reject `var()`.
**How to avoid:** eyeball the dossier relationship graph after the DEBT-01 graph slice; fallback documented in
§Chart module (computed-style resolution for exactly those two props).

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest (unit) + Playwright (e2e/visual), pre-configured                                                                                      |
| Config file        | `frontend/playwright.config.ts` (projects: chromium, chromium-dashboard-widgets w/ committed baselines, a11y); vitest via frontend workspace |
| Quick run command  | `pnpm --dir frontend exec vitest run tests/unit/design-system/`                                                                              |
| Full suite command | `pnpm --dir frontend lint && pnpm --dir frontend type-check && pnpm --dir frontend exec vitest run`                                          |

### Phase Requirements → Test Map

| Req ID  | Behavior                                             | Test Type              | Automated Command                                                                                                                                                                                           | File Exists?                                                                                                 |
| ------- | ---------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| DEBT-01 | chart tokens defined, three-copy parity, AA contrast | unit + guard           | `node scripts/check-bootstrap-parity.mjs` + `pnpm --dir frontend exec vitest run tests/unit/design-system/contrast.test.ts`                                                                                 | ✅ guard exists (needs table extension); ❌ Wave 0: chart cases in contrast.test.ts                          |
| DEBT-01 | no raw hex outside carve-out                         | lint (post-tightening) | `pnpm --dir frontend lint` (eslint `--max-warnings 0`)                                                                                                                                                      | ✅ (carve-out edit makes it bite)                                                                            |
| DEBT-01 | grep gate                                            | grep                   | `rg -n "#[0-9a-fA-F]{6}\b" frontend/src --type-add 'src:*.{tsx,ts,css}' -tsrc -g'!design-system/tokens/*' -g'!index.css' -g'!**/signature-visuals/flags/**'` → comment-only remainder                       | ✅                                                                                                           |
| DEBT-02 | no palette literals outside shim/tests               | lint + grep            | eslint rule (errors) + `rg '\b(text\|bg\|border\|fill\|stroke\|from\|to\|via)-(gray\|neutral\|…)-[0-9]{2,3}\b' frontend/src -g'!styles/list-pages.css' -g'!**/__tests__/**'` → 0                            | ✅                                                                                                           |
| DEBT-03 | banned shadows gone                                  | grep                   | `rg -n '\bshadow-(sm\|md\|xl\|2xl)\b' frontend/src -g'!index.css'` → 0                                                                                                                                      | ✅                                                                                                           |
| DEBT-04 | no numeric arbitrary radii                           | grep                   | `rg -n 'rounded-(s-\|e-\|t-\|b-)?\[[0-9]' frontend/src` → 0; `rg -n 'border-radius:\s*(6\|8\|10\|12)px' frontend/src` → 0 (micro ≤4px + pills allowlisted)                                                  | ✅                                                                                                           |
| DEBT-05 | decorative gradients gone                            | grep                   | `rg -n 'bg-gradient-\|linear-gradient\|radial-gradient' frontend/src` → only the 4 allowlisted sites (masks, tweaks hue track, globe-loader, NavigationShell tint)                                          | ✅                                                                                                           |
| DEBT-06 | ladders deleted                                      | grep                   | `rg -n -- '--shadow-(xs\|sm\|md\|lg\|xl):' frontend/src/styles/modern-nav-tokens.css` → 0 (file may be gone-or-thin); external `var()` consumers resolve (per-var zero-consumer greps in task verification) | ✅                                                                                                           |
| DEBT-07 | no !important px heights                             | grep                   | `rg -n '(min-)?height:\s*[0-9]+px\s*!important' frontend/src/styles/` → 0                                                                                                                                   | ✅ (via deletion)                                                                                            |
| DEBT-08 | no emoji-as-UI                                       | grep                   | `rg -n '[\x{2600}-\x{27BF}\x{1F300}-\x{1FAFF}]' frontend/src/components frontend/src/routes -g'!**/comments/**' -g'!**/__tests__/**'` → only data/JSDoc carve-outs                                          | ✅                                                                                                           |
| ALL     | zero regressions on live chrome                      | e2e visual             | `pnpm --dir frontend exec playwright test dashboard-visual dashboard-widgets-visual list-pages-visual dossier-drawer-visual analytics-dashboard rtl-component-smokes --reporter=list`                       | ✅ suites exist; chart-color changes require a deliberate re-baseline commit for dashboard-widgets snapshots |
| ALL     | build integrity                                      | build                  | `pnpm --dir frontend build` (also gates bundle size in CI)                                                                                                                                                  | ✅                                                                                                           |

### Sampling Rate

- **Per task commit:** `pnpm --dir frontend exec vitest run tests/unit/design-system/` + the task's own grep gate
- **Per wave merge:** `pnpm --dir frontend lint && pnpm --dir frontend type-check && pnpm --dir frontend exec vitest run`
- **Phase gate:** full suite + Playwright visual/rtl specs green (with the one knowing re-baseline) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/tests/unit/design-system/contrast.test.ts` — add `--chart-1…8` ≥3:1 (vs `--surface` and `--bg`, both modes) — covers DEBT-01 AA requirement
- [ ] `scripts/check-bootstrap-parity.mjs` — chart loop in `EXTENDED_PALETTE` (this is guard code, but it functions as the DEBT-01 drift test)
- [ ] Possible assertion updates in `buildTokens.test.ts` / `fouc-bootstrap.test.ts` if they enumerate emitted vars
- No framework installs needed.

### Render-parity protocol (the manual gate)

Routes: `/dashboard` (widgets + charts), `/analytics`, a dossier detail with the relationships tab
(MiniRelationshipGraph), `/reports`/report-builder preview, one list page, one drawer, `/copilot` drawer, and
`/modern-nav-standalone` (before/after, expected to change). Matrix: 1400px + 1024px × dark + light × EN +
AR (`?lng=ar` flips first paint). Expectation: pixel-unchanged everywhere except the declared controlled-change
list (charts/graphs hues, card-shadow removal, the 6 gradient flattens, emoji→lucide, the demo route).

## Suggested Plan/Wave Breakdown (parallel-safe, no file in two slices)

**Wave 1 — foundations (sequential, 2 plans):**

1. **83-01 Dead-code deletion**: `git rm` the 9 dead ui files + `components/timeline/**` +
   `styles/vertical-timeline.css` + `WorldMapVisualization.tsx` + `App.css`; drop
   `react-vertical-timeline-component` (+types) from frontend/package.json; update `COMPONENT_REGISTRY.md` /
   `check-deleted-components.sh` bookkeeping. Verification: type-check + build + vitest + liveness re-grep per
   file. (Closes the vertical-timeline half of DEBT-07 and large chunks of DEBT-01/02/05 inventory.)
2. **83-02 Chart token module**: the six touch-points + guard extension + contrast/buildTokens test updates
   (Wave-0 gaps). Verification: parity guard green, contrast tests green, `text-chart-1` utility resolves in a
   dev build. No consumer migration yet — additive, zero visual change.

**Wave 2 — parallel sweeps (file-disjoint slices; a file with multiple debt classes is owned by exactly one slice):** 3. **83-03 Analytics + widgets slice** (DEBT-01 + DEBT-02 + their shadows/tiles in the SAME files):
`components/analytics/**`, `components/dashboard-widgets/**` (incl. BenchmarkPreview gradients),
`components/stakeholder-influence/**`, `components/report-builder/ReportPreview.tsx`. 4. **83-04 Graphs + dossier slice** (DEBT-01 graph palettes + DEBT-08 + graph shadows/gradients):
`components/dossier/**`, `components/dossiers/**`, `components/relationships/**` (incl.
TouchOptimizedGraphControls gradient), `components/sla-countdown/SLACountdown.tsx`. 5. **83-05 Shadow + radius + gradient long-tail** (DEBT-03/04/05 across everything NOT owned by 83-03/04/06):
`pages/**`, `router/index.tsx`, `components/ui/**` (live files: context-aware-fab, sidebar, tooltip,
file-upload, expandable-card incl. its DEBT-02 literals, pull-to-refresh-indicator), `components/layout/**`,
`components/guided-tours/**`, `components/milestone-planning/**`, remaining components dirs, and the CSS
radius literals (`board.css`, `calendar.css`, `dashboard.css`, `tweaks-drawer.css`, `list-pages.css:294`
only — surgical). 6. **83-06 Modern-nav + copilot slice** (DEBT-06 + its gradients/shadows/emoji/hex):
`styles/modern-nav-tokens.css`, `components/modern-nav/**`, `routes/modern-nav-standalone.tsx`,
`components/copilot/copilot-theme.css` (:758 cleanup).

**Wave 3 — gate (1 plan):** 7. **83-07 Carve-out tightening + re-audit**: shrink the eslint Tier-B list to the 3 holders; run every grep
gate; full lint/type-check/vitest/build; Playwright visual + RTL suites; deliberate dashboard-widgets
re-baseline commit with human eyeball; render-parity matrix walk; document the DEBT-07 list-pages
verified-not-debt disposition in the phase summary.

Slice-overlap resolutions baked in: `dossiers/RelationshipGraph.tsx` (hex + emoji) → 83-04;
`TouchOptimizedGraphControls` (gradient + shadows) → 83-04; `TourTrigger` (gradient + shadows) → 83-05;
analytics files (hex + literals + tile washes) → 83-03; `expandable-card` (literals + mask + radius) → 83-05;
`list-pages.css` is touched ONLY by 83-05 and only at :294.

## Assumptions Log

| #   | Claim                                                                                                                                                    | Section      | Risk if Wrong                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `var()` works in React Flow `markerEnd.color` and `<Background color>` (SVG presentation attrs)                                                          | Chart module | Arrowheads/dots lose color — visible; fallback documented (computed-style for those two props)                                                                                          |
| A2  | `rounded-xs` utility exists in the HeroUI multiplicative scale (=2px) — `rounded-md/xl` verified in built CSS, `rounded-xs` inferred from the same scale | DEBT-04      | Swap fails to compile a class → falls back to `rounded-[var(--radius-sm)]`-style arbitrary value `rounded-[2px]`→`rounded-[calc(var(--radius)*0.25)]`; verify in built CSS during 83-05 |
| A3  | The chromium-dashboard-widgets baselines are the only committed screenshots that intersect chart colors                                                  | Validation   | Additional suites may need knowing re-baselines; the phase-gate run reveals them                                                                                                        |
| A4  | Deleting `react-vertical-timeline-component` has no other consumer (grep found none)                                                                     | Dead code    | Build breaks loudly in the deletion task — caught by its own verification                                                                                                               |

All other claims are `[VERIFIED]` against the working tree or built CSS this session.

## Open Questions

1. **Delete the modern-nav demo entirely instead of re-skinning it?** Route-hygiene (Phase ~74) deliberately
   kept `/modern-nav-standalone`; D-83-06 locks re-point+delete-ladders, not feature deletion. Default: follow
   the locked decision. If the user would rather delete the demo + `components/modern-nav/**` outright, 83-06
   shrinks to a deletion plan — worth one question at plan sign-off.
2. **`--chart-7` exact hexes** — derivation task (culori, h≈300, ≥3:1 both modes vs `--surface`/`--bg`) is
   deterministic but the literal values don't exist yet; the 83-02 task computes and locks them, contrast tests
   prove them.
3. **dashboard.css:890/908 10px radii** — snap direction (8 vs 12px) decided by eyeball at execution.

## Sources

### Primary (HIGH confidence — read/grepped this session)

- Working tree greps (all inventories re-run 2026-07-04; spec-audit `/tmp/design-review-260704/notes/spec-audit.md` used as the map, superseded by re-greps for counts/lines)
- `frontend/dist/assets/index-CBkpWPYJ.css` — Tailwind v4 shadow-inlining + HeroUI radius-hijack verification
- `scripts/check-bootstrap-parity.mjs`, `frontend/public/bootstrap.js`, `frontend/src/design-system/tokens/{directions,buildTokens,types,densities}.ts`, `frontend/src/index.css` (@theme + :root), `eslint.config.mjs`
- `frontend/DESIGN.md` (§Elevation, §recipes), `frontend/src/design-system/CLAUDE.md`, `frontend/CLAUDE.md`, root `CLAUDE.md`
- `frontend/playwright.config.ts` + `frontend/tests/e2e/` listing (visual/rtl suites), `frontend/tests/unit/design-system/` listing
- `.planning/phases/83-token-debt-consolidation/83-CONTEXT.md`, `.planning/REQUIREMENTS.md`

### Secondary (MEDIUM)

- In-repo precedent for `var()` in SVG attrs (Donut.tsx, EngagementMetricsChart, SLAComplianceChart) — extends by analogy to React Flow marker/Background (A1)

## Metadata

**Confidence breakdown:**

- Inventories & line numbers: HIGH — re-grepped this session
- Utility mechanics (shadows inline, radius hijack): HIGH — verified in built CSS
- Chart module wiring: HIGH — guard/bootstrap/engine all read; extension pattern mirrors status verbatim
- React Flow var() edge cases: MEDIUM — flagged A1 with fallback
- Dead-code determinations: HIGH for grep evidence; each deletion task re-verifies before `git rm`

**Research date:** 2026-07-04
**Valid until:** ~2026-07-18 (repo moves fast; line numbers decay — re-grep at execution, the gates are line-number-free)
