---
phase: 81-visible-bugs
reviewed: 2026-07-04T13:20:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - frontend/src/pages/WorkBoard/board.css
  - frontend/src/components/settings/SettingsSectionCard.tsx
  - frontend/src/components/settings/sections/ProfileSettingsSection.tsx
  - frontend/src/components/settings/sections/GeneralSettingsSection.tsx
  - frontend/src/components/settings/sections/AppearanceSettingsSection.tsx
  - frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx
  - frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx
  - frontend/src/components/settings/sections/NotificationsSettingsSection.tsx
  - frontend/src/components/calendar/UnifiedCalendar.tsx
  - frontend/src/i18n/en/dashboard-widgets.json
  - frontend/src/i18n/ar/dashboard-widgets.json
  - frontend/src/pages/Dashboard/widgets/dashboard.css
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: clean
---

# Phase 81: Visible Bugs — Code Review Report

**Reviewed:** 2026-07-04T13:20:00Z
**Depth:** standard (per-file analysis + language-specific + cross-file removal tracing)
**Files Reviewed:** 12 (WeekAheadStatusKeys.test.ts additionally read as coverage evidence)
**Status:** clean

## Summary

Phase 81 fixes five visible design bugs (BUG-01 kanban overflow, BUG-02 settings
duplicate header, BUG-03 calendar duplicate create button, BUG-04 raw enum status
pills, BUG-05 KPI label wrap). All five changes are surgical removals or additive
CSS/i18n. I traced every removal to its callers, verified the i18n bundles are
byte-parallel, and confirmed the coverage test uses real JSON, and I checked the
full commit file-set against the carve-out and deferred-item boundaries.

**No Critical and no Warning findings.** The removals are safe, the i18n gap is
correctly closed, the test is real-JSON (not mocked `t`), and scope is clean.

Verification highlights:

- **BUG-03 removal is safe.** The only consumer of `UnifiedCalendar` is
  `routes/_protected/calendar.tsx`, which retains the `PageHeader` "New event"
  action (`Link to /calendar/new`). No embedded/dossier-tab usage exists, so
  removing the toolbar button orphans no create affordance. `showCreateForm`
  state is preserved for the empty-state wizard path; the `Plus` import was
  removed cleanly. No test references the removed button.
- **BUG-02 removals are safe.** The page-level `SettingsLayout` card header is the
  single surviving owner of the section title/description. All six sections drop
  only their header props; every orphaned lucide icon import was removed (each
  remaining icon import in all six files is still used in the body). No settings
  test asserts an inner card title. `SettingsSectionCard` gates `CardHeader` on a
  non-empty `title` and documents that `description`/`icon` render only inside it.
- **BUG-04 is complete and parallel.** All six `LifecycleStage` values
  (`intake/preparation/briefing/execution/follow_up/closed`) exist under
  `weekAhead.status` in both EN and AR, mirror `LIFECYCLE_STAGE_LABELS` exactly,
  are sentence-case, contain no raw enum, no `!`, and no marketing voice. AR
  mirrors EN key-for-key. The `dashboard-widgets` namespace is registered in
  `i18n/index.ts` for both languages, so the labels actually load in AR.
  `TimelineEvent.lifecycle_stage` is typed `LifecycleStage | null`, so the six
  new keys cover every value the pill can render.
- **CSS discipline holds.** `board.css` and `dashboard.css` use tokens only
  (`--line-strong`, `--radius-sm`), no raw hex, no card shadow, no hardcoded
  radius, and only direction-neutral / logical properties. `overflow-x: auto` is
  the inline-axis scroll in horizontal writing mode and flips correctly under
  `dir=rtl` (there is no broadly-supported `overflow-inline`). The `≤1024`
  KPI-label block is declared last so it correctly overrides both `.kpi-label` and
  `.dir-linear .kpi-label` on source order.
- **Scope is clean.** All five commits touch only in-scope files. No carve-out
  files (`index.css`, `public/bootstrap.js`, `styles/list-pages.css`,
  `design-system/tokens/`, `types/*`) and no deferred taste items
  (`BoardColumn.tsx` priority bar F16, column glyphs F21, form labels F19,
  settings sub-nav F18/F20) were modified. `.kcard.overdue` in `board.css` is
  unchanged.
- **Test quality is good.** `WeekAheadStatusKeys.test.ts` imports the real EN/AR
  JSON bundles + `LIFECYCLE_STAGES` (no react-i18next mock, no render) and asserts
  each of the 6 stages in both languages exists, is a non-empty string, and is not
  equal to its raw snake_case key — 12 assertions covering all six stages.

## Info

### IN-01: Security section still renders a stacked header after the BUG-02 sweep

**File:** `frontend/src/components/settings/sections/SecuritySettingsSection.tsx` (usage of `SettingsSectionCard`) + `frontend/src/components/settings/SettingsLayout.tsx:80-91`
**Issue:** BUG-02 removed the inner card header from six sections, leaving
`SecuritySettingsSection` as the only section that still passes a `title` to
`SettingsSectionCard`. On the security section the user therefore sees two stacked
headers: the page-level header (`navLabelKey('security')` → `accessAndSecurity.title`,
which falls back to the `nav.accessAndSecurity` label since `accessAndSecurity.title`
is undefined) and the card's own `security.title` ("Security"). The executor's
rationale is that these are not _verbatim_ duplicates (different text), so it was
intentionally left per D-81-02. That reasoning is sound and this is not a
regression — but it is the one remaining visual inconsistency of the class this
phase set out to remove, and worth folding into the deferred settings-taste lane
(F18/F20) rather than leaving indefinitely.
**Fix:** In the follow-up taste lane, either define `accessAndSecurity.title` so the
page header reads correctly and drop the inner `security.title` card header (matching
the other six sections), or keep the card header and give the page header a distinct
purpose. No action required in Phase 81.

### IN-02: Six now-unreachable `weekAhead.status` keys left in the bundle

**File:** `frontend/src/i18n/en/dashboard-widgets.json:31-36` and `frontend/src/i18n/ar/dashboard-widgets.json:31-36`
**Issue:** The pre-existing `scheduled/confirmed/pending/in_progress/completed/cancelled`
keys under `weekAhead.status` are no longer reachable by this widget:
`WeekAhead.tsx` only renders `event.lifecycle_stage`, which is typed
`LifecycleStage | null` (`operations-hub.types.ts:59`), so only the six new
lifecycle labels can ever resolve. The old six are harmless dead entries (kept as a
"safety net" per the summary) and the `defaultValue: stage` fallback already covers
any unexpected value. Low priority; noted for hygiene, not correctness.
**Fix:** Optionally drop the six generic-status keys from both bundles in a future
i18n cleanup so the `weekAhead.status` map matches the `LifecycleStage` domain
exactly. Leave as-is if a different widget is expected to reuse the namespace.

---

_Reviewed: 2026-07-04T13:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
