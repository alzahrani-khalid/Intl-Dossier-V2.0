# Phase 85: Linear taste refinements (F16-F21) - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Source:** Transcribed from `DESIGN-REFINEMENT-PLAN-260704.md` §3E + the user-signed-off
P5 preview specs in `/tmp/design-review-260704/p5-previews/INDEX.md` and
`F16-F21-previews.html` (2026-07-04 SCOPE ADDENDUM — all six accepted).

<domain>
## Phase Boundary

Land the six **spec-compliant-but-not-Linear** taste refinements (F16–F21) that the user
individually signed off on. These are the last phase of the v8.1 Linear Design Refinement
workstream. All are visual/interaction polish — no data-model, API, or backend change.

**In scope:** TASTE-01..06 (F16–F21) exactly as previewed.
**Out of scope:** F23–F26 (AFFORD-\*, later milestone), any data-gap/empty-state work, any
re-litigation of the accepted framing (esp. F16's overdue-reframing — it is LOCKED).

**Non-negotiable invariants (project CLAUDE.md + DESIGN.md):**

- All color via `var(--*)` tokens / `@theme` utilities — no raw hex, no Tailwind color literals.
- Every directional change on **logical properties** (`inline-start`, `ms/me`, `ps/pe`,
  `text-start/end`) so RTL parity holds without re-styling. `textAlign` values are never
  hardcoded to physical right/left.
- Radii from `--radius-sm/--radius/--radius-lg` (6/8/12); no card drop-shadows.
- Must hold across **dark-canonical + light** and **EN/LTR + AR/RTL** with zero regressions.
- No emoji in copy; status glyphs are lucide/inline-SVG, not emoji.
  </domain>

<decisions>
## Implementation Decisions (LOCKED — from the accepted previews)

### TASTE-01 / F16 — Kanban overdue reframing (NOT a priority accent)

The full-height inline-start bar is `.kcard.overdue { border-inline-start: 3px solid var(--danger) }`
— an **overdue** marker, not a priority signal (priority already renders as the High/Medium chip).
With all-overdue seed data every card gets the stripe → the board reads as a wall of red.

- **Remove** the `.kcard.overdue` `border-inline-start` rule in the board stylesheet.
- **Recolor** the existing overdue due-text red: `.kdue.is-overdue → color: var(--danger)`
  (KCard already builds an "Overdue Nd" string — carry overdue on that red due-date chip).
- **Optional**: prepend a ~13px ascending-bars priority glyph in `.kcard-top`, tinted
  `--danger` / `--warn` / `--ink-faint` by priority. Sits FIRST in the `.kcard-top` flex →
  lands at inline-start (right in RTL) automatically; due digits stay LTR via existing handling.
- Blast radius confined to the WorkBoard/kanban card component + its stylesheet.

### TASTE-02 / F17 — Neutralize active-nav fill

Active = subtle **neutral-gray** filled pill; accent (indigo) reserved for primary buttons +
on-toggles only. Color = meaning, never decoration.

- Settings sub-nav active state: `background: var(--accent-soft) → var(--surface-raised)`,
  `color: var(--accent-ink) → var(--ink)`; **keep** the `::before` 2px accent stripe.
- Main sidebar active item: swap the fill to `var(--surface-raised)` for a truly neutral pill;
  the existing 2px `var(--accent)` `::before` stripe is already Linear-correct — **keep it**.
- Shared app-wide nav → touches every route's active state; visually low-risk. Verify the
  neutral pill still reads against the near-white light sidebar in light mode.

### TASTE-03 / F18 — Settings single-nav + back-to-app (only layout-level change)

Settings is a full-page mode that **replaces** the app sidebar with its own grouped sub-nav.

- On `/settings` routes, suppress the global `<Sidebar/>` (route-conditional in the app shell)
  and let the settings navigation occupy the nav column.
- Add a "‹ Back to app" return link at the top of the settings navigation (chevron flips in RTL).
- Same content column; only the left rail changes. Single nav column sits inline-start (right in AR).
- Verify at 1024 & 1400, EN + AR.

### TASTE-04 / F19 — Sentence-case form field labels (EN-only visual)

UPPERCASE form-field labels violate the project's own rule (UPPERCASE reserved for classification
ribbons, mono labels, table-column headers).

- Give settings **form-field** labels a variant: `text-transform: none; letter-spacing: normal;
font-size: 13px; font-weight: 500; color: var(--ink-mute)`.
- **Do NOT** flip the global `.t-label`/`.label` recipe — it also styles legitimate uppercase meta
  labels elsewhere. **Scope strictly to the form-field label.**
- Arabic has no letter case → EN-only visual change; AR unaffected; Tajawal weight/spacing unchanged.

### TASTE-05 / F20 — Group the settings sub-nav under muted section headers

- Split the flat settings-nav sections into grouped arrays; render a muted section header before
  each group. Header style matches the app sidebar's existing uppercase group headers
  (`--ink-faint`, ~11px, medium).
- Proposed grouping: **Account / Privacy & access / Connected** — a starting point; exact buckets
  are the user's call (do not block on the labels — this is a CHECKPOINT candidate if ambiguous).

### TASTE-06 / F21 — Colored status glyph on kanban column headers

- In the WorkBoard column header, prepend a ~14px status-glyph inline `<svg>` keyed by stage:
  empty ring (todo) · amber (in-progress) · dashed ring (review) · green check (done).
- Tiny stage→glyph map + inline SVG; isolated to the WorkBoard column-header render.

### Claude's Discretion

- Exact glyph SVG shapes (F16 bars, F21 status ring/check) within the token palette.
- Whether the F16 priority-bars glyph ships now or is deferred (it is explicitly "optional").
- The precise CSS variant name/selector for the F19 form-label scope.
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source of truth

- `frontend/DESIGN.md` — Linear token tables (dark verbatim + derived light), palette, radii 6/8/12, recipes.
- `frontend/src/design-system/CLAUDE.md` — the runtime token engine + three-copy palette invariant.
- Root `CLAUDE.md` — design rules (no raw hex, logical properties, no card shadows, no emoji, voice).

### Accepted-preview spec (this phase's contract)

- `/tmp/design-review-260704/p5-previews/INDEX.md` — the six-item summary table + F16 framing note.
- `/tmp/design-review-260704/p5-previews/F16-F21-previews.html` — per-item Before/After/Spec/RTL.
- `DESIGN-REFINEMENT-PLAN-260704.md` §3E — findings F16–F21 evidence + Mobbin references.

### Likely touchpoints (per preview — RESEARCH/pattern-mapper MUST verify exact paths)

- Kanban card + its stylesheet (F16): `KCard.tsx` + `board.css` under the WorkBoard/kanban surface.
- Kanban column header (F21): `WorkBoard.tsx` `.col-head`.
- App sidebar active pill (F17): `Sidebar.tsx` + the `.settings-nav.active` rule in `index.css`.
- Settings nav (F18/F20): `AppShell.tsx` (route-conditional sidebar) + `SettingsNavigation.tsx`.
- Settings form labels (F19): the shared `.t-label`/`.label` recipe consumers on settings forms.

> The file names above are the preview author's reading; the kanban may live under a
> `unified-kanban` surface. Confirm real paths in research before planning tasks against them.
> </canonical_refs>

<specifics>
## Specific Ideas

- F16 red due-date chip reuses the existing "Overdue Nd" string builder — recolor, don't rebuild.
- F17/F18 keep the accent `::before` stripe; only the fill and (F18) the sidebar visibility change.
- All six were shown as token-true dark mocks; light parity is called out per item and must be verified.
  </specifics>

<deferred>
## Deferred Ideas

- F23–F26 (AFFORD-\*): peek panel, filter/display popovers, ⌘K audit, richer empty states — later milestone.
- Data-gap empty states / `0` counts — not design defects, out of this workstream.
  </deferred>

---

_Phase: 85-linear-taste-refinements-f16-f21_
_Context gathered: 2026-07-05 — transcribed from signed-off plan §3E + P5 previews_
