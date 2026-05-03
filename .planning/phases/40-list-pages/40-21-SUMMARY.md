---
phase: 40-list-pages
plan: 21
subsystem: ui
tags: [i18n, forums, gap-G10, bilingual]

requires:
  - phase: 40-list-pages
    provides: ForumsListPage (Phase 40 ListPageShell wiring) + bundled forums namespace
provides:
  - Localized page heading + subtitle on /dossiers/forums (EN + AR)
  - Localized status chip text via forums.status.{active,completed,planned,cancelled,...} in both locales
affects: [40-list-pages-HUMAN-UAT]

tech-stack:
  added: []
  patterns:
    - 'When namespace is already passed to useTranslation, t() lookups use bare keys (no namespace prefix); double-prefix forces resolver miss'

key-files:
  created: []
  modified:
    - frontend/src/routes/_protected/dossiers/forums/index.tsx
    - frontend/src/i18n/en/forums.json
    - frontend/src/i18n/ar/forums.json

key-decisions:
  - "Replace the unused top-level forums.status string ('Status' / 'الحالة') with the new status object, instead of inserting a second 'status' key after 'statuses'. JSON keys must be unique; the only consumer of forums.status is a metadata column id in report-builder.types.ts that does not pass through i18n. Plural 'statuses' is preserved."

patterns-established:
  - "Status enum localization on list pages: top-level singular 'status' map keyed by enum value, with all known enum members covered for safe defaultValue fallthrough."

requirements-completed: [LIST-03]

duration: ~7min
completed: 2026-05-03
---

# Phase 40 Plan 21: G10 Forums i18n Summary

**`/dossiers/forums` now renders the bilingual page heading, subtitle, and localized status chip text instead of column-header literals and raw enum keys.**

## Performance

- **Duration:** ~7 min
- **Tasks:** 2 of 2 completed
- **Files modified:** 3

## Accomplishments

- Route `frontend/src/routes/_protected/dossiers/forums/index.tsx` now calls `t('forums:pageTitle')` and `t('forums:pageSubtitle')` (keys that were already present in both locales but unused).
- Both `frontend/src/i18n/en/forums.json` and `frontend/src/i18n/ar/forums.json` now expose a top-level singular `status` object covering the four `FORUM_STATUS_CHIP` keys (`active`, `completed`, `planned`, `cancelled`) plus five broader enum values (`inactive`, `scheduled`, `ongoing`, `archived`, `on_hold`).
- `t('forums:status.${status}', { defaultValue: status })` (route line 82) now resolves to localized chip text instead of leaking the raw English enum key.
- All grep gates and JSON-parse acceptance checks pass.

## Task Commits

1. **Tasks 1 + 2 combined: route i18n key fix + bilingual `status` map added** — `a47533ba` (fix)

## Files Created/Modified

- `frontend/src/routes/_protected/dossiers/forums/index.tsx` — lines 114–115: `forums:title` → `forums:pageTitle`; `forums:subtitle` → `forums:pageSubtitle`.
- `frontend/src/i18n/en/forums.json` — replaced top-level `"status": "Status"` string with a 9-key `status` object.
- `frontend/src/i18n/ar/forums.json` — replaced top-level `"status": "الحالة"` string with the same 9-key `status` object in Arabic.

## Decisions Made

- **Replace, don't append.** The plan recommended inserting a NEW `status` key after the existing `statuses` block. JSON keys are unique, so the existing top-level `"status": "Status"` (unused — only `forums.status` reference is `report-builder.types.ts:1039`, a metadata column id, not an i18n key) was replaced in place. The plural `statuses` object is preserved verbatim because it is consumed elsewhere (status-filter UI, status badge labels).

## Deviations from Plan

### Plan deviation (location of new block)

**1. `status` block placed where the unused string lived, not after `statuses`**

- **Found during:** Task 2 attempted insertion.
- **Issue:** The existing forums.json files already had a top-level `"status": "Status"` string at line 12. JSON disallows duplicate keys.
- **Fix:** Replaced the existing string with the new `status` object (insertion location: after `sessions`, before `virtual`). All required keys (`active`, `completed`, `planned`, `cancelled`) are present in both locales. Existing `statuses`, `pageTitle`, `pageSubtitle`, and every other key remain untouched.
- **Verification:** Acceptance grep gates pass; `node -e "JSON.parse(...)"` succeeds for both files; required-key lookups all return non-empty values.
- **Committed in:** `a47533ba`.

### TypeScript

The codebase carries pre-existing TS6133 / TS6196 unused-declaration errors in unrelated files (`view-preferences.types.ts`, `work-item.types.ts`, etc.). This change introduces zero new type errors. The plan's `tsc --noEmit exit 0` criterion is interpreted as "no NEW errors introduced by this plan", consistent with how prior Phase 40 plans treated the same backlog.

---

**Total deviations:** 1 location-of-block deviation (necessary to satisfy JSON key-uniqueness)
**Impact on plan:** Functional intent is fully delivered. All four FORUM_STATUS_CHIP keys + 5 extras resolve in both locales.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- G10 closed at the source level. `40-HUMAN-UAT.md` Test 5 should flip from `result: issue, severity: major` to PASS once the live spec sweep runs (gated on AUTH-FIX, plan 40-23 which shipped earlier in this wave).
- Chip-class variant visual coverage (`chip-info`, `chip-accent`, `chip-danger`) remains a future seed concern — this plan does not seed forum rows with non-active statuses.

---

_Phase: 40-list-pages_
_Plan: 21 — G10 forums i18n_
_Completed: 2026-05-03_
