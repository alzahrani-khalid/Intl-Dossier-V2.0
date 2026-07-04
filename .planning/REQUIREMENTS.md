# Requirements: Intl-Dossier — v8.1 Linear Design Refinement

**Defined:** 2026-07-04
**Core Value:** Unified intelligence management for diplomatic operations — every relationship, commitment, and signal tracked in one secure, bilingual platform.
**Source of truth:** `DESIGN-REFINEMENT-PLAN-260704.md` (findings F1–F15 + F22; user sign-off §7).
**Scope guard:** Corrective only (bugs + Linear spec-compliance). Every correction stays on
logical properties (`ms/me`, `ps/pe`, `text-start/end`, `inline-start`) so RTL parity holds
without re-styling, and must hold across dark-canonical + light and EN/LTR + AR/RTL with zero
regressions.

## v1 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### Visible Bugs (Phase 81)

Fast, high-impact fixes from the 6-route Linear audit (Plan §3A).

- [x] **BUG-01**: All four kanban columns (incl. "Done"/"مكتمل") are fully reachable and unclipped at 1400px and 1024px, in EN/LTR and AR/RTL — via a column min-width + logical inline-scroll container with a visible overflow affordance, or reduced column width so 4 fit. Empty columns still show header + `0`. _(F1, HIGH)_
- [x] **BUG-02**: The settings page shows exactly one "Profile Settings" title + description — the duplicated inner card header is removed (page-level title kept). _(F2, HIGH)_
- [x] **BUG-03**: The calendar view exposes exactly one primary create-event action — the redundant second "Create Event" button is dropped. _(F3, MEDIUM)_
- [x] **BUG-04**: No raw DB enum strings render as user-visible labels — dashboard "Week Ahead" status pills (`preparation`, `follow_up`) map through i18n to human, sentence-case labels in both languages. _(F6, MEDIUM)_
- [x] **BUG-05**: KPI labels render on a single line at 1024px (e.g. "ACTIVE ENGAGEMENTS" no longer wraps) via shortened/abbreviated label or reduced label size at ≤1024. _(F22, LOW)_

### Date / Number Formatting (Phase 82)

Systemic, spec-defined formatting consistency (Plan §3B). **Digit policy (locked, §7.4):**
Latin digits app-wide in Arabic UI; unit text localized (`يوم`), consistent with `lib/format-locale`.

- [x] **FMT-01**: `lib/format-date.ts` is the single date/time formatter, emitting day-first no-comma dates (`Tue 28 Apr`) and GST times (`14:30 GST`); the dashboard greeting and Intelligence Digest read day-first no-comma. _(F4, HIGH)_
- [x] **FMT-02**: The ~66 ad-hoc `toLocaleDateString` call sites (plus the two direct format-string offenders `meeting-minutes/MeetingMinutesCard.tsx` `'MMM d, yyyy'` and `Briefs/BriefsPage.tsx` `en-GB`) are migrated to the central formatter — the app is internally consistent with list rows. _(F4, HIGH)_
- [x] **FMT-03**: A lint/grep guard fails on new raw `toLocaleDateString` usage outside the central formatter. _(F4, HIGH)_
- [x] **FMT-04**: Arabic overdue units no longer mix scripts — kanban cards show a localized unit (`يوم`/`ي`) after Latin digits (no bare Latin `d`), applied via `lib/format-locale` `toFormatLocale` under the locked Latin-digit policy. _(F5, MEDIUM)_

### Token-Debt Consolidation (Phase 83)

Systemic code-level token debt in charts, relationship graphs, and the aceternity `components/ui/`
kit (Plan §3C). **Do NOT touch the verified carve-outs** (see Out of Scope).

- [ ] **DEBT-01**: A shared chart-palette token module (`--chart-1…n` semantic series colors) exists; recharts fills (`analytics/*Chart.tsx`, `dashboard-widgets/ChartWidget`) and graph node palettes (`MiniRelationshipGraph`, `relationships/RelationshipGraph`) consume tokens instead of ~100 raw hex across ~22 files. _(F7, MEDIUM)_
- [ ] **DEBT-02**: Tailwind color literals (~51 across ~11 chart/aceternity files) map to `@theme` utilities (`bg-bg`, `text-ink`, `border-line`, `bg-accent`). _(F8, MEDIUM)_
- [ ] **DEBT-03**: Banned card shadows (`shadow-sm/md/xl/2xl`) are stripped from cards/graph/detail components; shadow reserved for drawers/modals/hover rows (`--shadow-drawer`/`--shadow-lg`). _(F9, MEDIUM)_
- [ ] **DEBT-04**: Hardcoded radii (`rounded-[…]` + px literals) are replaced with `--radius-sm`/`--radius`/`--radius-lg` (6/8/12), including the shadcn/HeroUI primitive re-skin. _(F10, MEDIUM)_
- [ ] **DEBT-05**: Real gradients (`modern-nav-tokens.css`, aceternity `ui/`, `dashboard-widgets/BenchmarkPreview`) are flattened to flat surface tokens. _(F11, LOW-MED)_
- [ ] **DEBT-06**: The bespoke parallel token ladders in `styles/modern-nav-tokens.css` and `components/copilot/copilot-theme.css` are deleted; those files consume design-system tokens. _(F12, MEDIUM)_
- [ ] **DEBT-07**: Row heights are driven by `var(--row-h)` — the `!important` pixel overrides in `styles/vertical-timeline.css` and `styles/list-pages.css` are removed. _(F13, MEDIUM)_
- [ ] **DEBT-08**: User-visible emoji-as-UI (`sla-countdown/SLACountdown.tsx` `⚠️🔴⚡✓`, `dossiers/RelationshipGraph.tsx` empty-state `⚠️`/`🔗`) are replaced with lucide icons (legitimate data emoji — flags, reaction sets — left untouched). _(F14, LOW)_

### Copy / Marketing Voice (Phase 84)

Copy-edit pass on `i18n/en`; `en` drives `ar` (Plan §3D).

- [ ] **COPY-01**: Marketing voice is removed from `i18n/en` — "Discover" (`guided-tours`, `relationships`, `progressive-disclosure`), "easily accessible" (`empty-states`), "Let us show you around" (`guided-tours`), and exclamation marks across `empty-states.json` + `guided-tours.json` are copy-edited to sentence-case, no-`!` prose; the source `en` is fixed so `ar` follows. _(F15, MEDIUM)_

## v2 Requirements

Deferred to future milestones — tracked, not in this roadmap.

### Linear-Taste Refinements (product sign-off required — Plan §3E/§7.2)

Spec-compliant but not what Linear does. Each is a design opinion requiring a before/after
preview and the user's individual call. Handled by a separate previews-only lane; **none pre-approved.**

- **TASTE-01**: Kanban priority signal — replace full-height inline-start accent bar with an inline priority glyph. _(F16)_
- **TASTE-02**: Neutralize active-nav fill to `--surface-raised` gray (indigo reserved for primary actions/on-toggles). _(F17)_
- **TASTE-03**: Settings single-nav — replace the app sidebar with the settings sub-nav + back-to-app on settings routes. _(F18)_
- **TASTE-04**: Sentence-case all form field labels (not UPPERCASE). _(F19)_
- **TASTE-05**: Group the settings sub-nav under muted section headers. _(F20)_
- **TASTE-06**: Add a colored status glyph to each kanban column header. _(F21)_

### Linear Affordance Opportunities (later milestone — Plan §3F/§7.3)

New capability, not corrections.

- **AFFORD-01**: Right "peek" panel with prev/next paging for list→detail. _(F23)_
- **AFFORD-02**: Filter chips + builder popover with live counts, separate Display popover. _(F24)_
- **AFFORD-03**: Command menu (⌘K) audit against Linear's grouped, context-aware menu. _(F25)_
- **AFFORD-04**: Richer empty states (product-glyph cluster + purpose copy + one accent CTA). _(F26)_

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                                                                              | Reason                                                                                         |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `styles/list-pages.css` `[class~=…]` compat shim (251 Tailwind-literal matches)                      | Deliberate compat shim; "normalizing" it breaks working infra — **verified carve-out**         |
| `types/*.ts` `// was #…` / `gradient →` migration comments                                           | Migration provenance comments, not live style — carve-out                                      |
| `design-system/tokens/`, `index.css` `:root` fallback, `public/bootstrap.js` literal palette holders | Legitimately hold the Linear palette; parity-checked in CI (three-copy byte-match) — carve-out |
| Data-gap empty states ("No data available" ×6, `0` engagement counts)                                | Seed/RLS data gaps, not design defects — layouts render correctly                              |
| F16–F21 taste calls                                                                                  | Opinion, not defect; separate previews-only lane, product sign-off pending (v2 TASTE-\*)       |
| F23–F26 affordance enhancements                                                                      | New capability, not correction; later milestone (v2 AFFORD-\*)                                 |

## Traceability

| Requirement | Phase    | Status   |
| ----------- | -------- | -------- |
| BUG-01      | Phase 81 | Complete |
| BUG-02      | Phase 81 | Complete |
| BUG-03      | Phase 81 | Complete |
| BUG-04      | Phase 81 | Complete |
| BUG-05      | Phase 81 | Complete |
| FMT-01      | Phase 82 | Complete |
| FMT-02      | Phase 82 | Complete |
| FMT-03      | Phase 82 | Complete |
| FMT-04      | Phase 82 | Complete |
| DEBT-01     | Phase 83 | Pending  |
| DEBT-02     | Phase 83 | Pending  |
| DEBT-03     | Phase 83 | Pending  |
| DEBT-04     | Phase 83 | Pending  |
| DEBT-05     | Phase 83 | Pending  |
| DEBT-06     | Phase 83 | Pending  |
| DEBT-07     | Phase 83 | Pending  |
| DEBT-08     | Phase 83 | Pending  |
| COPY-01     | Phase 84 | Pending  |

**Coverage:**

- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---

_Requirements defined: 2026-07-04_
_Last updated: 2026-07-04 — roadmap created; all 18 v1 requirements mapped 1:1 to Phases 81-84 (findings F1–F15 + F22 from `DESIGN-REFINEMENT-PLAN-260704.md`)_
