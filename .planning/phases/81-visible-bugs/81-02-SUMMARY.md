---
phase: 81-visible-bugs
plan: 02
subsystem: frontend-ui
tags: [settings, calendar, bug-fix, rtl, linear-design, duplicate-removal]
requires:
  - Phase 81 CONTEXT decisions D-81-02, D-81-03, D-81-06
provides:
  - Settings page renders exactly one section title (page-level header only)
  - Calendar view exposes exactly one primary create-event action
affects:
  - frontend/src/components/settings/*
  - frontend/src/components/calendar/UnifiedCalendar.tsx
tech-stack:
  added: []
  patterns:
    - SettingsSectionCard title is now optional — header renders only when a title is passed
    - Page-level SettingsLayout header is the single owner of the active section title
    - PageHeader action is the single owner of the calendar create-event action
key-files:
  created: []
  modified:
    - frontend/src/components/settings/SettingsSectionCard.tsx
    - frontend/src/components/settings/sections/ProfileSettingsSection.tsx
    - frontend/src/components/settings/sections/GeneralSettingsSection.tsx
    - frontend/src/components/settings/sections/AppearanceSettingsSection.tsx
    - frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx
    - frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx
    - frontend/src/components/settings/sections/NotificationsSettingsSection.tsx
    - frontend/src/components/calendar/UnifiedCalendar.tsx
decisions:
  - 'Root-cause fix in SettingsSectionCard (title optional + conditional CardHeader) rather than per-section patches, so every current and future section is duplicate-free from one guard'
  - 'Kept the calendar PageHeader action (Link to /calendar/new) as the primary; removed the UnifiedCalendar toolbar button — matches the app-wide PageHeader-primary-action pattern and the already-verified standalone form'
  - 'SecuritySettingsSection left untouched — its card uses security.title which differs from the page-level accessAndSecurity header, so it is not a verbatim duplicate'
metrics:
  duration: ~20m
  tasks_completed: 3
  files_modified: 8
  completed: 2026-07-04
requirements: [BUG-02, BUG-03]
---

# Phase 81 Plan 02: Settings Duplicate Header + Calendar Duplicate Create Button Summary

Removed two verbatim-duplicate UI elements — the inner settings section-card title/description (rendered a second time under the page-level header) and the redundant calendar toolbar "Create Event" button — so `/settings` shows exactly one section title and `/calendar` exposes exactly one primary create-event action, across EN/LTR + AR/RTL at 1400 and 1024.

## What Was Built

### BUG-02 — Settings duplicate header (D-81-02)

`SettingsLayout` already renders the active section's title + description as the page-level card header (`t('${navLabelKey(activeSection)}.title')`). Each section component then passed the SAME i18n key into `SettingsSectionCard`, whose `CardHeader` rendered it a second time.

Root-cause fix in the shared component:

- `SettingsSectionCard.tsx`: `title` is now optional; the `CardHeader` block renders only when a non-empty title is provided. A card with no title renders `CardContent` only. `description`/`icon` continue to render only inside that header, so omitting the title omits all three.
- Dropped the duplicated `title` / `description` / `icon` header props from the six sections whose card title equalled the page-level section title: **Profile, General, Appearance, DataPrivacy, Accessibility, Notifications**. Orphaned lucide icon imports created by this change were cleaned (`User`, `Settings2`, `Shield`, `Accessibility`, `Bell`).
- **Security section excluded** — its card uses `t('security.title')` while the page-level header for that section resolves `accessAndSecurity.title` (a different, currently-undefined key that falls back to the nav label). Not a verbatim duplicate, so it is intentionally left rendering its own card title.

`SettingsLayout.tsx` was not touched — it remains the single surviving render of the section title + description.

### BUG-03 — Calendar duplicate create-event button (D-81-03)

Two "Create Event" actions rendered on `/calendar`: the `PageHeader` action (`Link` to `/calendar/new`) in `routes/_protected/calendar.tsx`, and a toolbar `Button` in `UnifiedCalendar.tsx` that opened the inline create form.

- Removed the `UnifiedCalendar` toolbar `Button` (`variant="default"`, `onClick={() => setShowCreateForm(true)}`).
- Kept the `PageHeader` action as the single primary create-event action (`routes/_protected/calendar.tsx` needed no edit).
- `showCreateForm` state + the inline `CalendarEntryForm` render were **preserved** — the empty-state `CalendarEmptyWizard` still drives that path via `handleCreateFromTemplate`, so removing the toolbar button did not orphan the state.
- Dropped the now-orphaned `Plus` icon import. `Today`, month prev/next nav, and the type-filter `Select` are untouched.

## Verification

- **Settings (browser, dev :5173):** exactly 1 `Profile Settings` title element + 1 description element at 1400 EN/LTR; exactly 1 `إعدادات الملف الشخصي` title at 1400 AR/RTL (`<html dir=rtl>`); General and Appearance sections each render exactly 1 title. Card body (avatar upload, Display Name, form fields) renders intact directly under the page header.
- **Calendar (browser, dev :5173):** exactly 1 create-event `<button>` + 1 `/calendar/new` anchor (a single wrapped PageHeader action), with **no** create button inside the toolbar — at 1400 (EN + AR) and 1024 (EN). Clicking it navigates to `/calendar/new`. Today + 2 month-nav buttons + type-filter Select all present at 1024.
- **Type-check:** `pnpm exec tsc --noEmit` clean (exit 0, zero output) after each task.
- **Tests:** `vitest run src/components/settings` — 8/8 passed (1 file). Note: the plan's `--reporter=basic` flag was removed in vitest 4.x and errored on load; re-ran with the default reporter — this was a harness-flag issue, not a test failure.
- **Grep gates:** `profile.title` count in ProfileSettingsSection = 0; `navLabelKey` in SettingsLayout = 4 (untouched); `form.create_event` in UnifiedCalendar = 0, in calendar route = 1.

Screenshots captured: `/tmp/settings-en-1400.png`, `/tmp/settings-ar-1400.png`, `/tmp/calendar-en-1400.png`, `/tmp/calendar-en-1024.png`, `/tmp/calendar-ar-1400.png`.

## Deviations from Plan

None affecting scope. One harness-flag correction: the Task-3 automated verify used `vitest --reporter=basic`, which vitest 4.x no longer ships (fails at reporter load). Re-ran the same suite with the default reporter — 8/8 pass. No source change; documented for future plans.

## Design Compliance (D-81-06)

Removals only. No new colors, shadows, radii, or physical properties introduced. No tokens or carve-outs touched. RTL parity preserved (verified `<html dir=rtl>` with Arabic title rendering once). No emoji or marketing copy added.

## Self-Check: PASSED

- Commit `d8839f16` (Task 1, settings) — FOUND
- Commit `9168a444` (Task 2, calendar) — FOUND
- `frontend/src/components/settings/SettingsSectionCard.tsx` — FOUND
- `frontend/src/components/settings/sections/ProfileSettingsSection.tsx` — FOUND
- `frontend/src/components/calendar/UnifiedCalendar.tsx` — FOUND
