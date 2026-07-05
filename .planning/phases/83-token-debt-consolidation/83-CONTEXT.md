# Phase 83: Token-Debt Consolidation - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Source:** Transcribed from `DESIGN-REFINEMENT-PLAN-260704.md` §3C (F7–F14) + §6 carve-outs by gsd-driver.
Full mechanical inventory: `/tmp/design-review-260704/notes/spec-audit.md` (sections 1,2,4,5,6,7,8).

<domain>
## Phase Boundary

Phase 83 consolidates the systemic code-level token debt that lives **one layer down** from the
core routes — in charts, relationship graphs, the aceternity `components/ui/` kit, modern-nav, and
the copilot theme. The visible chrome is already clean; this drives the debt classes to
clean/minor. Corrective only, zero visual regressions, dark + light, EN/LTR + AR/RTL. All color
via `var(--*)` tokens / `@theme` utilities; borders `1px solid var(--line)`; radii from the token
scale (6/8/12); no card shadows (shadow reserved for drawers/modals/hover rows); flat surfaces.

**Verify (phase goal):** a `spec-audit` re-run shows the systemic classes (raw hex, Tailwind
literals, banned card shadows, hardcoded radii, gradients, bespoke ladders, `!important` row
heights, user-visible emoji) drop to **clean/minor**; carve-outs byte-untouched; zero visual regressions.
</domain>

<decisions>
## Implementation Decisions (locked)

### D-83-01 — Shared chart-palette token module (DEBT-01, F7, MEDIUM)

Introduce a **shared chart-palette token module** exposing semantic series colors
(`--chart-1 … --chart-n`) with **dark + derived-light** values that meet AA, wired into the
design system (mirror how the status palette is defined — `design-system/tokens/` + `index.css`
`@theme`). Migrate recharts fills (`components/analytics/*Chart.tsx`, `dashboard-widgets/ChartWidget`)
and graph node palettes (`components/dossiers/MiniRelationshipGraph` ~20 hex,
`relationships/RelationshipGraph`) plus `components/ui/background-boxes` off the ~100 raw hex
(22 files) onto the tokens. **Note:** `eslint.config.mjs:245` currently carves out chart/graph
palettes "for a future chart-token phase" — this IS that phase; once tokenized, tighten that
carve-out to only the token-definition files.

### D-83-02 — Tailwind color literals → `@theme` utilities (DEBT-02, F8, MEDIUM)

Map the ~51 Tailwind color literals across ~11 chart/aceternity `ui/` files to the `@theme`
utilities (`bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-accent`, `text-danger/success/
warning/info`, the `text-status-N` pairs). **CARVE-OUT — do NOT touch** the 251 `[class~=…]`
matches in `styles/list-pages.css` (that is the deliberate compat shim).

### D-83-03 — Strip banned card shadows (DEBT-03, F9, MEDIUM)

Strip `shadow-sm` / `shadow-md` / `shadow-xl` / `shadow-2xl` from cards/graph/detail components
(~88 files by current grep; ~165 occurrences). Reserve shadow strictly for
drawers/modals/hover-rows via `--shadow-drawer` / `--shadow-lg`. Do not blanket-remove shadow on
those legitimate surfaces.

### D-83-04 — Hardcoded radii → token scale (DEBT-04, F10, MEDIUM)

Replace hardcoded radii (`rounded-[…]` arbitrary values + px literals, ~92) with
`--radius-sm` / `--radius` / `--radius-lg` (Linear **6 / 8 / 12**), including radii inherited from
shadcn/HeroUI primitives (fold into the primitive re-skin). Do not hard-code px.

### D-83-05 — Flatten gradients (DEBT-05, F11, LOW-MED)

Flatten the ~13 real gradients (`styles/modern-nav-tokens.css`, aceternity `ui/`,
`dashboard-widgets/BenchmarkPreview` `bg-gradient-to-br`) to flat surface tokens (surfaces are flat
per spec). Leave any gradient that is legitimate data (e.g. a chart fill stop) — assess each.

### D-83-06 — Delete bespoke token ladders (DEBT-06, F12, MEDIUM)

`styles/modern-nav-tokens.css` and `components/copilot/copilot-theme.css` define their OWN
`--shadow-*` / radius / gradient ladders in parallel to the design system (architectural drift).
Make them CONSUME the design-system tokens and DELETE the parallel ladders.

### D-83-07 — Row heights → `var(--row-h)` (DEBT-07, F13, MEDIUM)

Drive row heights from `var(--row-h)` (density-aware); remove the `!important` pixel overrides in
`styles/vertical-timeline.css` (44px/40px) and `styles/list-pages.css` (20/28/34/32px).
**⚠ list-pages.css surgical split:** this file ALSO holds the `[class~='text-*']` color-compat
shim (line ~976+, a **carve-out — do NOT touch**). DEBT-07 edits ONLY the row-height `!important`
px rules in that file, NOT the `[class~=…]` shim block. Same file, two concerns — edit surgically.

### D-83-08 — User-visible emoji → lucide (DEBT-08, F14, LOW)

Replace emoji-as-UI with lucide icons: `components/sla-countdown/SLACountdown.tsx`
(`⚠️`/`🔴`/`⚡`/`✓` status returns at ~L145-151) and `dossiers/RelationshipGraph.tsx` empty-state
(`⚠️`/`🔗`). **Leave legitimate data emoji** — flag codepoints, reaction sets — untouched (per
spec-audit §8, most repo emoji is legitimate data).

### D-83-09 — Carve-out discipline (applies to all)

**Do NOT touch:** `styles/list-pages.css` `[class~=…]` compat shim (251 matches; DEBT-07's
row-height edit is the ONLY allowed touch, and only the px `!important` rules), `types/*.ts`
`// was #…` / `gradient →` migration comments, and the palette holders `design-system/tokens/` +
`index.css` `:root` fallback + `public/bootstrap.js` (three-copy byte-match, CI parity-checked —
the new `--chart-*` tokens are ADDED, not by mangling these holders' existing Linear palette).
No marketing voice; sentence case; logical properties.

### Claude's Discretion

The exact `--chart-N` count + values (derive AA-safe from the Linear accent/status families);
whether each gradient is decorative (flatten) or data (keep); how to re-skin primitive radii;
grouping the sweep into plans/waves by directory to stay parallel-safe.
</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design / inventory source of truth

- `DESIGN-REFINEMENT-PLAN-260704.md` §3C (F7–F14 findings + corrections) + §6 (carve-outs)
- `/tmp/design-review-260704/notes/spec-audit.md` — the mechanical sweep with per-class file lists,
  severity, and the **Hotspot summary** (§ end) — the researcher's primary inventory
- `frontend/DESIGN.md` — the Linear token tables (radii 6/8/12, shadow ladder, status palette)
- `frontend/src/design-system/CLAUDE.md` — the runtime token engine (how to add tokens)
- `frontend/CLAUDE.md` — `@theme` utilities list, the eslint hex/literal carve-out, three-copy
  byte-match rule, filename-case per directory
- `CLAUDE.md` (root) — design non-negotiables + DoD checklist

### Primary code targets (per DEBT)

- DEBT-01/02: `components/analytics/*Chart.tsx`, `dashboard-widgets/ChartWidget`,
  `dossiers/MiniRelationshipGraph`, `relationships/RelationshipGraph`, `components/ui/*` (aceternity)
- DEBT-03: ~88 files with `shadow-(sm|md|xl|2xl)` (graph/detail/`type-specific-fields`/FAB)
- DEBT-04: `rounded-[…]` + px radii across layout/dossier/calendar/WorkBoard + shadcn primitives
- DEBT-05: `styles/modern-nav-tokens.css`, aceternity `ui/`, `dashboard-widgets/BenchmarkPreview`
- DEBT-06: `styles/modern-nav-tokens.css`, `components/copilot/copilot-theme.css`
- DEBT-07: `styles/vertical-timeline.css`, `styles/list-pages.css` (row-height rules ONLY)
- DEBT-08: `components/sla-countdown/SLACountdown.tsx`, `dossiers/RelationshipGraph.tsx`
- Token defs (ADD `--chart-*`): `design-system/tokens/`, `index.css` `@theme`
  </canonical_refs>

<specifics>
## Specific Ideas

- **The eslint hex/chart carve-out is the phase's own tell** (`eslint.config.mjs:245`): it exists
  precisely because a chart-token phase was pending. Tokenizing the chart/graph palettes lets the
  carve-out narrow to token-definition files only.
- **Shadow discipline is not blanket-removal:** `--shadow-drawer`/`--shadow-lg` on
  drawers/modals/hover-rows stay. Only card/graph/detail card shadows go.
- **Verify by re-audit + render:** re-run the spec-audit greps (raw hex, literals, shadows, radii,
  gradients, `!important` row heights, emoji) → clean/minor; then render dashboard/charts/graph
  routes at 1400 & 1024 in dark + light, EN + AR — visually unchanged (tokens resolve to the same
  Linear values), zero regressions.
- **Three-copy byte-match:** adding `--chart-*` tokens must keep `directions.ts` ↔ `bootstrap.js`
  ↔ `index.css :root` in parity (`scripts/check-bootstrap-parity.mjs` runs in lint/CI) — if the
  chart tokens are added to the byte-matched holders, add them to ALL THREE in the same edit.
  </specifics>

<deferred>
## Deferred Ideas

- F15 marketing-voice copy → Phase 84. F16–F21 taste → Phase 85. F23–F26 → later milestone.
- Data-gap empty states / `0` counts — seed/RLS, not design.
- Legitimate data emoji (flags, reactions), the `list-pages.css` `[class~=…]` compat shim, and
  `types/*` migration comments — carve-outs, not debt.
  </deferred>

---

_Phase: 83-token-debt-consolidation_
_Context gathered: 2026-07-04 — transcribed from the signed-off plan §3C + spec-audit.md by gsd-driver_
