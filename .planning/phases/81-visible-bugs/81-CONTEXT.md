# Phase 81: Visible Bugs - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Source:** Transcribed from `DESIGN-REFINEMENT-PLAN-260704.md` §3A + §7 (user sign-off) by gsd-driver

<domain>
## Phase Boundary

Phase 81 fixes the five concrete, visible design bugs surfaced by the 6-route Linear
audit (Plan §3A). Corrective only — no taste refactors, no new capability. Every fix must
hold across dark-canonical + light and EN/LTR + AR/RTL with **zero regressions**, and must
stay on **logical properties** (`ms/me`, `ps/pe`, `text-start/end`, `inline-start`,
`inline-scroll`) so RTL parity is preserved without re-styling.

**In scope (5 bugs):** BUG-01 kanban 4-column overflow · BUG-02 settings duplicate header ·
BUG-03 calendar duplicate create-event button · BUG-04 raw enum status pills · BUG-05 KPI
label wrap @1024.

**NOT in scope (explicitly deferred — do NOT touch in this phase):** the kanban priority
accent bar (F16), kanban column status glyphs (F21), and every other §3E taste call — those
are product-sign-off items in a separate previews-only lane. Fixing the overflow bug must not
restyle the priority signal or the column header beyond what the overflow fix strictly requires.
</domain>

<decisions>
## Implementation Decisions (locked)

### D-81-01 — Kanban 4-column overflow (BUG-01, F1, HIGH)

The 4-column board clips the "Done"/"مكتمل" column at 1400px (Done header cut, "No ite…"
truncated), worse at 1024, mirrored in RTL. **Decision:** make all four columns reachable and
unclipped — either (a) set a column min-width and wrap the lane row in a logical
**inline-scroll** container with a visible overflow affordance (scrollbar/edge-fade), or
(b) reduce column width so 4 fit at 1400. Empty columns still render header + `0`. Must use
logical inline-scroll (not `overflow-x` hardcoded to left/right) so RTL flows correctly and
Done is reachable in both directions. Primary files: `pages/WorkBoard/` (`BoardColumn.tsx`,
the board/lane container), `routes/_protected/kanban.tsx`.

### D-81-02 — Settings duplicate header (BUG-02, F2, HIGH)

"Profile Settings" + subtitle render twice — once as the page header, again verbatim inside
the card header. **Decision:** keep exactly one — remove the inner card header, keep the
page-level title (H2 ~20px) + one-line description. Section cards must not repeat the page
title. Primary file: `routes/_protected/settings.tsx` (+ any Profile settings card component
it renders). Title text comes from `i18n/en/settings.json` ("Profile").

### D-81-03 — Calendar duplicate create-event button (BUG-03, F3, MEDIUM)

Two "Create Event" buttons render — page header + toolbar. **Decision:** keep a single primary
"New event" action; drop the redundant one. Primary files: `routes/_protected/calendar.tsx`
(page header) and `components/calendar/UnifiedCalendar.tsx` (toolbar) — keep the one that is
the natural primary for the view, remove the other.

### D-81-04 — Raw enum status pills (BUG-04, F6, MEDIUM)

Dashboard "Week Ahead" shows `preparation` / `follow_up` (raw snake_case DB enum) as
user-visible pills. **Root cause:** `pages/Dashboard/widgets/WeekAhead.tsx:163` calls
`t('weekAhead.status.${stage}', { defaultValue: stage })` — the raw stage leaks because the
`weekAhead.status.*` label keys are **missing** from the loaded i18n namespace (this is the
`defaultValue` fallback, not a hardcoded raw render). **Decision:** add the missing
sentence-case status labels (`weekAhead.status.preparation`, `.follow_up`, and every other
`lifecycle_stage` value the widget can render) in EN + AR so no raw enum ever surfaces; keep
the `defaultValue` as a safety net but ensure keys exist. No raw DB enum string may render as
a user-visible label anywhere the widget shows. Verify against the `lifecycle_stage` /
operations-hub stage enum so all values are covered.

### D-81-05 — KPI label wrap @1024 (BUG-05, F22, LOW)

KPI labels wrap to 2 lines at 1024px ("ACTIVE ENGAGEMENTS"). **Decision:** keep KPIs
single-line at ≤1024 — shorten/abbreviate the label, reduce label size at the ≤1024
breakpoint, or allow a controlled truncation. Primary file:
`pages/Dashboard/widgets/KpiStrip.tsx`. Uppercase KPI labels are a mono/label affordance and
are allowed to stay uppercase (project rule permits UPPERCASE for mono labels) — only the
wrap is the defect.

### D-81-06 — Design-token & carve-out discipline (applies to all five)

All colors resolve to `var(--*)` tokens or `@theme` utilities (no raw hex, no `text-blue-500`);
borders `1px solid var(--line)`; no card shadows; radii from `--radius-sm/--radius/--radius-lg`
(6/8/12); row heights `var(--row-h)`; logical properties only; no emoji in copy; sentence case
(UPPERCASE only for mono/classification labels). **Do NOT touch** the verified carve-outs:
`styles/list-pages.css` `[class~=…]` compat shim, `types/*` migration comments, and
`design-system/tokens/` + `index.css` `:root` fallback + `public/bootstrap.js` literal palette
holders (CI parity-checked).

### Claude's Discretion

Exact overflow mechanism for D-81-01 (min-width + scroll vs. narrower columns) — pick whichever
keeps all 4 columns usable at 1400 & 1024 without a horizontal scrollbar that hides content;
which of the two calendar buttons to keep as primary; exact abbreviation/size for KPI labels.
File-level tracing beyond the named primaries (find every sibling call site).
</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source of truth

- `DESIGN-REFINEMENT-PLAN-260704.md` §3A (the five findings F1/F2/F3/F6/F22, with evidence
  shots and Linear/Mobbin corrections) and §7 (user sign-off, scope = Phases 1–4 corrective)
- `frontend/DESIGN.md` — the Linear spec (tokens, type, radii 6/8/12, recipes)
- `frontend/src/design-system/CLAUDE.md` — the runtime token engine
- `CLAUDE.md` (repo root) — Linear design rules + RTL rules + responsive breakpoints
  (1400 / 1024 / 768) + Definition-of-Done UI checklist

### Primary code targets

- `pages/WorkBoard/BoardColumn.tsx` + WorkBoard lane/board container — BUG-01
- `routes/_protected/kanban.tsx` — BUG-01 (board mount)
- `routes/_protected/settings.tsx` — BUG-02
- `routes/_protected/calendar.tsx` + `components/calendar/UnifiedCalendar.tsx` — BUG-03
- `pages/Dashboard/widgets/WeekAhead.tsx` — BUG-04
- `pages/Dashboard/widgets/KpiStrip.tsx` — BUG-05
- `i18n/en/settings.json`, and the dashboard/operations-hub i18n namespace for `weekAhead.status.*` (EN drives AR)
  </canonical_refs>

<specifics>
## Specific Ideas

- **BUG-04 is an i18n key gap, not a render rewrite.** The widget already localizes via
  `statusLabel(stage) = t('weekAhead.status.${stage}', { defaultValue: stage })`. Add the
  missing keys for every `lifecycle_stage` value; do not rip out the localization path.
- **BUG-01 RTL:** the audit confirms Done clips on the _left_ in RTL — the scroll/overflow must
  be logical (inline) so both LTR (Done on right) and RTL (Done on left) stay reachable.
- **Verify at the real analyst widths:** 1400px and 1024px, in EN/LTR and AR/RTL (dark canonical
  - light). These are the ground-truth viewport-clip captures the audit used.
    </specifics>

<deferred>
## Deferred Ideas

- F16 (kanban priority accent bar → inline glyph), F21 (column status glyphs), F17/F18/F19/F20
  (§3E taste calls) — **product sign-off pending**, separate previews-only lane. Not this phase.
- F23–F26 affordance enhancements — later milestone.
- Data-gap empty states ("No data available", `0` counts) — seed/RLS, not design.
  </deferred>

---

_Phase: 81-visible-bugs_
_Context gathered: 2026-07-04 — transcribed from the signed-off design-refinement plan by gsd-driver_
