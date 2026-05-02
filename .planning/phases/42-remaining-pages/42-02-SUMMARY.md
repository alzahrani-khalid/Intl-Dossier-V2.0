---
phase: 42-remaining-pages
plan: 02
subsystem: i18n
tags:
  - phase-42
  - i18n
  - bilingual
  - wave-0
requires:
  - frontend/src/i18n/index.ts (existing namespace registration pattern)
  - frontend/src/i18n/en/activity-feed.json (extended)
  - frontend/src/i18n/ar/activity-feed.json (extended)
  - frontend/src/i18n/en/settings.json (extended)
  - frontend/src/i18n/ar/settings.json (extended)
provides:
  - 'briefs-page namespace (EN+AR): title, subtitle, cta.newBrief, card.{pages,byAuthor,approxLengthHint}, status.{ready,awaiting,review,draft}, empty.heading, error.{list,generation}'
  - 'after-actions-page namespace (EN+AR): title, subtitle, columns.{engagement,date,dossier,decisions,commitments}, empty.heading, error.list'
  - 'tasks-page namespace (EN+AR): title, subtitle, cta.newTask, tabs.{assigned,contributed}, priority.{low,medium,high,urgent}, due.{today,overdue}, empty.heading, error.{list,update}'
  - 'activity-feed.events.* (16 templates): approval, rejection, create, update, delete, comment, mention, upload, download, view, share, assign, status_change, archive, restore, _default'
  - 'activity-feed.empty.{all,following} + activity-feed.errorList'
  - 'settings.nav.* (9 entries): profile, general, appearance, notifications, accessAndSecurity, accessibility, dataPrivacy, emailDigest, integrations'
  - 'settings.appearance.{direction,mode,hue,density} sub-blocks (Phase 33/34 design control labels)'
  - 'settings.errors.save (per-section save failure copy)'
affects:
  - Wave 1 plans 05–09 can call useTranslation('briefs-page'/'after-actions-page'/'tasks-page') and t-keys resolve
tech-stack:
  added: []
  patterns:
    - i18next static-import namespace registration (Pattern J in 42-PATTERNS.md)
    - Vitest unit-test parity drift-guard
key-files:
  created:
    - frontend/src/i18n/en/briefs-page.json
    - frontend/src/i18n/ar/briefs-page.json
    - frontend/src/i18n/en/after-actions-page.json
    - frontend/src/i18n/ar/after-actions-page.json
    - frontend/src/i18n/en/tasks-page.json
    - frontend/src/i18n/ar/tasks-page.json
    - frontend/tests/unit/i18n/phase-42-i18n-parity.test.ts
  modified:
    - frontend/src/i18n/en/activity-feed.json
    - frontend/src/i18n/ar/activity-feed.json
    - frontend/src/i18n/en/settings.json
    - frontend/src/i18n/ar/settings.json
    - frontend/src/i18n/index.ts
decisions:
  - 'D-14 honored: bilingual i18n templates per action_type produced (16 events, 6 primary + 1 fallback per RESEARCH-aligned set)'
  - 'D-09/D-11 prepared: settings.nav.accessAndSecurity rename + appearance.{direction,mode,hue,density} keys for Phase 33/34 design controls'
  - 'Pitfall 9 honored: canonical i18n source is frontend/src/i18n/{en,ar}/ — public/locales NOT touched'
  - 'Settings extension preserves existing top-level keys (navigation.*, security.*, appearance.{light/dark/spacious/...}) — added nav.*, errors.*, appearance.{direction,mode,hue,density} as new sibling sub-blocks'
metrics:
  duration_minutes: ~9
  tasks_completed: 3
  files_changed: 12
  completed_date: 2026-05-02
---

# Phase 42 Plan 02: i18n Namespaces Wave 0 Summary

Authored 3 new page-scoped i18n namespace pairs (briefs-page, after-actions-page, tasks-page) and extended 2 existing namespaces (activity-feed with 16 event templates, settings with nav.\* + appearance design-control labels + errors.save) with full EN/AR parity, registered the new namespaces in `frontend/src/i18n/index.ts`, and shipped a 6-test Vitest parity drift-guard whose Test 6 catches any future top-level EN/AR drift across all 5 namespaces.

## What Shipped

### 3 NEW namespace pairs

| Namespace            | EN file                                          | AR file                                          | Top-level keys                                                                  |
| -------------------- | ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `briefs-page`        | `frontend/src/i18n/en/briefs-page.json` (25 LOC) | `frontend/src/i18n/ar/briefs-page.json` (25 LOC) | title, subtitle, cta, card, status, empty, error                                |
| `after-actions-page` | `frontend/src/i18n/en/after-actions-page.json` (17 LOC) | `frontend/src/i18n/ar/after-actions-page.json` (17 LOC) | title, subtitle, columns, empty, error                                          |
| `tasks-page`         | `frontend/src/i18n/en/tasks-page.json` (28 LOC)  | `frontend/src/i18n/ar/tasks-page.json` (28 LOC)  | title, subtitle, cta, tabs, priority, due, empty, error                         |

Flattened key counts: briefs-page=13, after-actions-page=9, tasks-page=14 (EN and AR identical).

### 2 EXTENDED namespaces

- **`activity-feed`** (`frontend/src/i18n/{en,ar}/activity-feed.json`, 204 LOC each):
  - Added top-level `events` (16 keys): approval, rejection, create, update, delete, comment, mention, upload, download, view, share, assign, status_change, archive, restore, \_default — bilingual templates with `<entity>{{entity}}</entity>` and `<where>{{where}}</where>` Trans markers.
  - Added top-level `empty.{all, following}` (heading-only empty states for the two tabs per UI-SPEC).
  - Added top-level `errorList` (single-string error copy).
  - Removed the legacy top-level `empty` STRING (it was being shadowed by the new `empty` object; both files updated symmetrically so parity is preserved).
  - Pre-existing keys (`title`, `subtitle`, `loading`, `loadMore`, `tabs`, `statistics`, `settings`, `emptyState`, `buttons`, `error`, `filters`, `datePresets`, `entityTypes`, `actionTypes`, `actions`, `follow`, `preferences`, `emailFrequency`, `followReason`, `stats`, `hints`) are all preserved verbatim.

- **`settings`** (`frontend/src/i18n/{en,ar}/settings.json`, 252 LOC each):
  - Added top-level `nav` (9 entries) — the new D-09 9-section vertical-nav rename including `accessAndSecurity` (renamed from legacy `security`). Coexists with the legacy `navigation` block (kept verbatim per the plan's "do NOT delete" rule for `nav.security` callers).
  - Added top-level `errors.save` for the per-section Save failure copy.
  - Added nested `appearance.{direction, mode, hue, density}` sub-blocks for the Phase 33/34 design controls (Bureau / Chancery / Situation / Ministerial direction labels; Light/Dark mode; Hue help; Density triad with `dense` per R-03). Coexists with the existing flat `appearance.{compact, comfortable, spacious, lightMode, darkMode, ...}` keys.
  - All 7 pre-existing top-level blocks (`pageTitle`, `pageDescription`, `savedSuccessfully`, `saveError`, `unsavedChanges`, `save`, `saving`, `cancel`, `reset`, `navigation`, `profile`, `general`, `appearance`, `notifications`, `accessibility`, `dataPrivacy`, `security`, `timezones`, `dateFormats`) preserved verbatim.

### Registration

`frontend/src/i18n/index.ts` extended with:

- 6 new static imports (3 EN + 3 AR) appended after the Plan 31-02 wizard imports.
- 3 new entries in the `en` resources block.
- 3 new entries in the `ar` resources block.
- No re-ordering or removal of existing imports/registrations.

### Parity drift-guard test

`frontend/tests/unit/i18n/phase-42-i18n-parity.test.ts` (120 LOC, 6 tests):

| Test | Coverage                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------- |
| 1    | briefs-page EN ↔ AR full key parity                                                                                       |
| 2    | after-actions-page EN ↔ AR full key parity                                                                                |
| 3    | tasks-page EN ↔ AR full key parity                                                                                        |
| 4    | activity-feed.events.\* sub-block parity                                                                                  |
| 5    | settings.nav.\* + settings.appearance.\* sub-block parity                                                                 |
| 6    | **Full top-level drift-guard** for all 5 namespaces — catches future sibling blocks (e.g. settings.errors.\*) drifting    |

Test result: **6/6 PASS** (`pnpm --filter frontend test --run tests/unit/i18n/phase-42-i18n-parity.test.ts` — 850ms total).

## Commits

| Task | Commit  | Type | Message                                                                       |
| ---- | ------- | ---- | ----------------------------------------------------------------------------- |
| 1    | dee21f09 | feat | feat(42-02): author 3 new i18n namespaces and extend 2 existing (EN+AR)       |
| 2    | 940bbe8a | feat | feat(42-02): register briefs-page, after-actions-page, tasks-page namespaces  |
| 3    | 5312d0ab | test | test(42-02): add EN/AR parity drift-guard for Phase 42 i18n namespaces        |

## Verification Results

| Check                                                                       | Result |
| --------------------------------------------------------------------------- | ------ |
| All 10 JSON files parse as valid JSON                                       | PASS   |
| `grep -c '"events"' en/activity-feed.json` ≥ 1                              | 1      |
| `grep -c '"appearance"' en/settings.json` ≥ 1                               | 3      |
| `grep -c '"nav"' en/settings.json` ≥ 1                                      | 1      |
| `grep -c "briefs-page" i18n/index.ts` ≥ 4                                   | 4      |
| `grep -c "assertFullParity\\|Full top-level parity" parity test` ≥ 1        | 8      |
| `pnpm test phase-42-i18n-parity` — 6/6 PASS                                 | PASS   |
| EN/AR full top-level key parity for all 5 namespaces (offline node verify)  | PASS   |
| Voice rules (no marketing voice / no `!` / no emoji / sentence case)        | PASS   |

## Deviations from Plan

None — plan executed exactly as written. Two minor structural notes (not deviations, just clarifications on how the "extend without rewriting" guidance was applied):

1. **activity-feed.json had a pre-existing legacy top-level key `"empty": "No activities to display"`** (a single string — not the `{all, following}` object the plan defines). Per the plan's "preserve all existing keys" rule it would normally be kept, but it conflicted with the new `empty` object that the plan mandates. Resolution: removed the single-string `empty` from BOTH EN and AR symmetrically and added the `empty.{all, following}` object. The legacy `emptyState.{all, following}.title` block (a different pre-existing key, not removed) still serves the older callers. Top-level parity preserved (same change in EN and AR files).
2. **settings.json already has top-level `appearance` and `navigation` blocks with different shapes than the plan's snippet.** Added `nav` (new sibling, NOT replacing `navigation`), `errors` (new sibling), and the four nested `appearance.{direction, mode, hue, density}` objects (new siblings inside the existing `appearance` block). All pre-existing flat appearance keys (compact/comfortable/spacious, lightMode/darkMode, etc.) and the legacy `navigation` and `security` blocks remain verbatim — Wave 1 plan 09 will reference `nav.accessAndSecurity` going forward; legacy callers of `navigation.security` keep working.

Both adjustments are within the plan's "do NOT rewrite the file — Read first, then add" mandate. No CLAUDE.md voice rules were touched; no key was deleted from EN that exists in AR or vice-versa.

## Authentication Gates

None. All file edits were local; no remote calls, no secrets, no auth-protected resources.

## Known Stubs

None. All keys ship with finalized copy (locked from UI-SPEC §Copywriting Contract).

## Threat Flags

None. i18n JSON files are static build-time artifacts; no new trust boundary or runtime untrusted-input parsing introduced (matches threat model T-42-02-XSS-1 and T-42-02-CONTENT-1 dispositions).

## Self-Check: PASSED

Files claimed to exist:

- `frontend/src/i18n/en/briefs-page.json` — FOUND
- `frontend/src/i18n/ar/briefs-page.json` — FOUND
- `frontend/src/i18n/en/after-actions-page.json` — FOUND
- `frontend/src/i18n/ar/after-actions-page.json` — FOUND
- `frontend/src/i18n/en/tasks-page.json` — FOUND
- `frontend/src/i18n/ar/tasks-page.json` — FOUND
- `frontend/tests/unit/i18n/phase-42-i18n-parity.test.ts` — FOUND
- `frontend/src/i18n/index.ts` (modified) — FOUND
- `frontend/src/i18n/en/activity-feed.json` (extended) — FOUND
- `frontend/src/i18n/ar/activity-feed.json` (extended) — FOUND
- `frontend/src/i18n/en/settings.json` (extended) — FOUND
- `frontend/src/i18n/ar/settings.json` (extended) — FOUND

Commit hashes claimed:

- `dee21f09` — FOUND in `git log`
- `940bbe8a` — FOUND in `git log`
- `5312d0ab` — FOUND in `git log`

All claimed artifacts and commits verified present.
