---
phase: 81-visible-bugs
verified: 2026-07-04T13:05:00Z
status: passed
human_signoff: 2026-07-04 — user approved both visual glances (BUG-01 kanban unclipped @1400/1024 LTR+RTL; BUG-05 KPI single-line @1024); see 81-HUMAN-UAT.md (status: passed)
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: 'Load /kanban at 1400px then 1024px, in EN/LTR and AR/RTL, dark + light. Confirm all four columns (To Do / In Progress / Review / Done — and the AR مكتمل) render their header + mono count fully; at 1400 no column is clipped without scrolling, and at 1024 the board row shows a visible scrollbar and scrolls to reach Done (right edge in LTR, left edge in RTL).'
    expected: "Done/مكتمل header + count fully visible/reachable at both widths, both directions; no 'No ite…' truncation; empty columns show header + 0."
    why_human: 'BUG-01 outcome is a pixel-level layout result at specific breakpoints in RTL. The CSS geometry (4×260 min-width + 3×12 gap = 1076 ≤ ~1090 content) and inline-scroll affordance are code-correct, but actual no-clip rendering depends on true sidebar width + font metrics and cannot be render-confirmed by static analysis.'
  - test: "Load the dashboard at 1024px in EN/LTR and AR/RTL. Read the four KPI-strip labels (incl. 'ACTIVE ENGAGEMENTS' and the long AR 'SLA at risk' label)."
    expected: 'Each KPI label sits on a single line with no ellipsis truncation at 1024px in both languages; uppercase mono styling preserved.'
    why_human: 'BUG-05: nowrap + a ≤1024 size reduction (10px/0.05em) guarantees single-line, but whether the longest EN/AR labels fit without ellipsis truncation is a rendered-font-metrics outcome only a live view can confirm.'
---

# Phase 81: Visible Bugs Verification Report

**Phase Goal:** Fix the visible design bugs from the 6-route Linear audit with zero regressions, dark+light, EN/LTR + AR/RTL.
**Verified:** 2026-07-04T13:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth (requirement)                                                                                                                                                                                   | Status                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | BUG-01 — `.col` is flexible (not rigid 300px) + logical inline-scroll affordance so all 4 columns are reachable/unclipped at 1400 & 1024, LTR+RTL; no physical left/right, no raw hex, no card shadow | ✓ VERIFIED (code) — visual outcome → human | board.css:109 `flex: 1 1 250px`, :110 `min-width: 260px`; `.board-columns` `overflow-x: auto` (:269) + `scrollbar-width/scrollbar-color: var(--line-strong)` (:275-276) + `::-webkit-scrollbar` rules using `--line-strong`/`--radius-sm` (:279-290). Grep gate: 0 physical left/right, 0 raw hex, scrollbar present. ≤640 block re-asserts `flex: 0 0 auto` (:353-360). `.kcard.overdue border-inline-start` (:29) unchanged (F16 deferred). WorkBoard suite 42/42. |
| 2   | BUG-02 — `SettingsSectionCard` renders header only when title provided; 6 duplicating sections drop the header; Security intentionally excluded                                                       | ✓ VERIFIED                                 | `SettingsSectionCard.tsx`: `title?: string` (:11), `CardHeader` gated on `{title && (…)}` (:43). All 6 sections (Profile/General/Appearance/DataPrivacy/Accessibility/Notifications) call `<SettingsSectionCard>` with no title prop. Security passes `title={t('security.title')}` — the D-81-02 carve-out (differently-named page header, not a verbatim duplicate — not a failure). settings suite 8/8.                                                           |
| 3   | BUG-03 — `UnifiedCalendar` toolbar create-event button removed; route keeps exactly one primary create action → /calendar/new                                                                         | ✓ VERIFIED                                 | `form.create_event` count: UnifiedCalendar.tsx = 0, calendar.tsx route = 1 (`<Link to="/calendar/new">` in PageHeader actions, :33-36). `showCreateForm` state preserved, driven by `handleCreateFromTemplate` from `CalendarEmptyWizard` (:99-101, :184-185). `Plus` import orphan cleaned (0 matches).                                                                                                                                                             |
| 4   | BUG-04 — all 6 LifecycleStage `weekAhead.status.*` labels present, sentence-case, byte-parallel EN/AR, no raw enum/marketing; coverage test uses real JSON                                            | ✓ VERIFIED                                 | EN+AR `weekAhead.status` each contain intake/preparation/briefing/execution/follow_up/closed (follow_up = "Follow-up" / "المتابعة"). Key parity EN==AR = true. WeekAhead.tsx uses `useTranslation('dashboard-widgets')` + `t('weekAhead.status.'+stage,{defaultValue:stage})` on `event.lifecycle_stage`; WeekAhead.tsx untouched (0 in phase diff). `WeekAheadStatusKeys.test.ts` imports real EN/AR JSON + `LIFECYCLE_STAGES`, no mock — 12/12 pass.               |
| 5   | BUG-05 — `.kpi-label` single-line at ≤1024 (nowrap + size reduction)                                                                                                                                  | ✓ VERIFIED (code) — visual outcome → human | dashboard.css:135-138 `.kpi-label` gets `white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis`; `@media (max-width: 1024px)` (:1082-1088) reduces `.kpi-label` and `.dir-linear .kpi-label` to `10px / 0.05em`, declared last for source-order win. Uppercase preserved. No raw hex / physical props in changed region.                                                                                                                      |

**Score:** 5/5 truths verified (code-level). 2 carry a visual confirmation item (BUG-01, BUG-05).

### Required Artifacts

| Artifact                                                                     | Expected                               | Status     | Details                                                                       |
| ---------------------------------------------------------------------------- | -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `frontend/src/pages/WorkBoard/board.css`                                     | Flexible `.col` + scrollbar affordance | ✓ VERIFIED | `flex: 1 1 250px` / `min-width: 260px`; token scrollbar; contains "scrollbar" |
| `frontend/src/components/settings/SettingsSectionCard.tsx`                   | Conditional CardHeader                 | ✓ VERIFIED | `title?` optional; `{title && <CardHeader>}`                                  |
| 6× `sections/*SettingsSection.tsx`                                           | Header props dropped                   | ✓ VERIFIED | No title prop; orphaned lucide icons removed                                  |
| `frontend/src/components/calendar/UnifiedCalendar.tsx`                       | Toolbar create button removed          | ✓ VERIFIED | 0 `form.create_event`; `Plus` import gone; state preserved                    |
| `frontend/src/i18n/en/dashboard-widgets.json`                                | 6 lifecycle keys                       | ✓ VERIFIED | All present, sentence-case                                                    |
| `frontend/src/i18n/ar/dashboard-widgets.json`                                | 6 Arabic keys                          | ✓ VERIFIED | All present, byte-parallel with EN                                            |
| `frontend/src/pages/Dashboard/widgets/__tests__/WeekAheadStatusKeys.test.ts` | Real-JSON coverage guard               | ✓ VERIFIED | Imports real bundles + LIFECYCLE_STAGES; 12/12 pass                           |
| `frontend/src/pages/Dashboard/widgets/dashboard.css`                         | Single-line KPI label ≤1024            | ✓ VERIFIED | nowrap + ≤1024 size reduction                                                 |

### Key Link Verification

| From                             | To                       | Via                                                       | Status  |
| -------------------------------- | ------------------------ | --------------------------------------------------------- | ------- |
| `WorkBoard.tsx`                  | `board.css`              | `.board-columns` flex scroll container                    | ✓ WIRED |
| `routes/_protected/calendar.tsx` | `/calendar/new`          | PageHeader actions `<Link>` (single create action)        | ✓ WIRED |
| `WeekAhead.tsx`                  | `dashboard-widgets.json` | `t('weekAhead.status.'+stage)` on `event.lifecycle_stage` | ✓ WIRED |
| `WeekAheadStatusKeys.test.ts`    | `lifecycle.types.ts`     | `LIFECYCLE_STAGES` drives coverage                        | ✓ WIRED |

### Behavioral Spot-Checks

| Behavior              | Command                                  | Result              | Status |
| --------------------- | ---------------------------------------- | ------------------- | ------ |
| BUG-04 coverage guard | `vitest run WeekAheadStatusKeys.test.ts` | 12 passed (12)      | ✓ PASS |
| BUG-01 regression     | `vitest run src/pages/WorkBoard`         | 42 passed (4 files) | ✓ PASS |
| BUG-02 regression     | `vitest run src/components/settings`     | 8 passed (1 file)   | ✓ PASS |
| EN/AR key parity      | node key-diff of weekAhead.status        | PARITY: true        | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description                      | Status                               | Evidence                                                 |
| ----------- | ----------- | -------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| BUG-01      | 81-01       | Kanban 4-column overflow         | ✓ SATISFIED (visual confirm pending) | board.css flexible + scroll affordance                   |
| BUG-02      | 81-02       | Settings duplicate header        | ✓ SATISFIED                          | 6 sections de-duplicated; Security carve-out per D-81-02 |
| BUG-03      | 81-02       | Calendar duplicate create button | ✓ SATISFIED                          | toolbar button removed; single PageHeader action         |
| BUG-04      | 81-03       | Raw enum status pills            | ✓ SATISFIED                          | 6 keys EN+AR; real-JSON test 12/12                       |
| BUG-05      | 81-03       | KPI label wrap @1024             | ✓ SATISFIED (visual confirm pending) | nowrap + ≤1024 size reduction                            |

All five requirement IDs (BUG-01..05) are accounted for and delivered; REQUIREMENTS.md marks each Complete.

### Anti-Patterns Found

| File | Line | Pattern                                              | Severity | Impact |
| ---- | ---- | ---------------------------------------------------- | -------- | ------ |
| —    | —    | None (0 TBD/FIXME/XXX/placeholder in modified files) | —        | —      |

Note: dashboard.css:940 contains `#bf5542` inside a pre-existing WCAG-contrast prose comment (not a style rule, not in the BUG-05 region, not modified this phase) — not a violation. D-81-06 carve-outs (`index.css`, `public/bootstrap.js`, `list-pages.css`, `design-system/tokens/`, `types/*`) confirmed untouched by the phase diff.

### Human Verification Required

1. **Kanban 4-column layout (BUG-01)** — Load /kanban at 1400px and 1024px, EN/LTR + AR/RTL, dark+light. Confirm all four columns (incl. Done/مكتمل) are unclipped at 1400 and reachable via the visible scrollbar at 1024 (Done on the right in LTR, on the left in RTL); empty columns show header + 0. _Why human:_ pixel-level layout outcome at specific breakpoints in RTL — geometry is code-correct but no-clip rendering is a live-view fact.

2. **KPI labels single-line @1024 (BUG-05)** — Load the dashboard at 1024px, EN/LTR + AR/RTL. Confirm all four KPI labels ("ACTIVE ENGAGEMENTS" and the long AR "SLA at risk") sit on one line with no ellipsis truncation. _Why human:_ nowrap guarantees single-line; absence of ellipsis truncation is a rendered-font-metrics fact.

### Gaps Summary

No gaps. All five must-haves are verified in the actual codebase with passing tests and clean token/scope discipline. Status is `human_needed` (not `passed`) solely because BUG-01 and BUG-05 close on pixel-level visual outcomes at 1400/1024 in EN+AR that require a human glance to sign off — the verifier cannot render pixels. BUG-02, BUG-03, BUG-04 are fully deterministic and need no human check. The 2 code-review Info items (Security stacked header → deferred taste lane; 6 dead generic i18n keys → hygiene) are non-blocking and out of this corrective phase's scope.

---

_Verified: 2026-07-04T13:05:00Z_
_Verifier: Claude (gsd-verifier)_
