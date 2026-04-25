---
phase: 40-list-pages
plan: 01
subsystem: i18n / locale namespaces
tags: [i18n, locales, ar, en, list-pages, wave-0]
requires: []
provides:
  - shared list-pages chrome strings (search, loadMore, pill, shownCount, empty)
  - 7 entity namespaces × EN + AR with title/subtitle/empty/loading parity
  - sensitivity chip label mapping (1→public, 2→internal, 3→restricted, 4→confidential)
  - engagements filter pills + week.of interpolation + loadMore.loading
affects:
  - frontend/public/locales/en/
  - frontend/public/locales/ar/
tech-stack:
  added: []
  patterns: [i18next-namespace-json, ar-en-key-parity, shadcn-style-locale-shape]
key-files:
  created:
    - frontend/public/locales/en/list-pages.json
    - frontend/public/locales/ar/list-pages.json
    - frontend/public/locales/en/countries.json
    - frontend/public/locales/ar/countries.json
    - frontend/public/locales/en/organizations.json
    - frontend/public/locales/ar/organizations.json
    - frontend/public/locales/en/persons.json
    - frontend/public/locales/ar/persons.json
    - frontend/public/locales/en/forums.json
    - frontend/public/locales/ar/forums.json
    - frontend/public/locales/en/topics.json
    - frontend/public/locales/ar/topics.json
    - frontend/public/locales/en/working-groups.json
    - frontend/public/locales/ar/working-groups.json
    - frontend/public/locales/en/engagements.json
    - frontend/public/locales/ar/engagements.json
  modified: []
decisions:
  - 'Sensitivity numeric→label map locked (1=public, 2=internal, 3=restricted, 4=confidential) per RESEARCH §Sensitivity chip + last-touch column mapping'
  - 'Used semantic Unicode ellipsis (…) instead of ASCII (...) across all 16 files for proper Arabic glyph rendering'
  - 'Engagements namespace owns its own search.placeholder + filter.* + loadMore.* (independent of shared list-pages namespace) so engagements page can self-host filter pills without colliding with shared chrome'
  - 'Forums/topics/working-groups added a row.meta key to match the shared row component contract from 40-PATTERNS.md'
metrics:
  duration: ~6 minutes
  completed: 2026-04-25
  tasks: 2
  files_created: 16
  files_modified: 0
---

# Phase 40 Plan 01: Locale Namespace Stubs Summary

Created 16 locale JSON files (8 namespaces × EN + AR) that unblock every Wave 1 page in Phase 40 — without these, every `useTranslation(['{entity}', 'list-pages'])` call would render raw i18n keys (Pitfall 3 from RESEARCH.md).

## What Was Built

### Task 1 — Shared `list-pages` namespace (commit `76feb498`)

`frontend/public/locales/{en,ar}/list-pages.json` — chrome strings shared by all Wave 1 pages:

- `search.placeholder` — global search input
- `loadMore.button` / `loadMore.loading` — pagination chrome (engagements timeline)
- `pill.{all,confirmed,travel,pending}` — engagement filter pill labels
- `shownCount` — "X of Y shown" counter
- `empty.title` / `empty.description` — generic empty state

### Task 2 — Seven entity namespaces (commit `5d5ab9ce`)

14 files at `frontend/public/locales/{en,ar}/{entity}.json`. Every namespace provides `title`, `subtitle`, `empty.{title,description}`, `loading`. Entity-specific shapes:

| Namespace        | Extra keys                                                                      |
| ---------------- | ------------------------------------------------------------------------------- |
| `countries`      | `table.{name,engagements,lastTouch,sensitivity}`, `sensitivity.{public,internal,restricted,confidential}` |
| `organizations`  | Same shape as countries (table + sensitivity)                                   |
| `persons`        | `card.{role,organization}`, `chip.vip`                                          |
| `forums`         | `row.meta`, `status.{active,completed,planned,cancelled}`                       |
| `topics`         | `row.meta`, `status.{active,archived,draft}`                                    |
| `working-groups` | `row.meta`, `status.{active,completed,on_hold}`                                 |
| `engagements`    | `search.placeholder`, `filter.{all,confirmed,travel,pending}`, `week.of` (with `{{date}}` interpolation), `loadMore.{button,loading}`, `status.{confirmed,pending,completed,cancelled}` |

## Key Decisions

1. **Sensitivity mapping locked** — 1→public, 2→internal, 3→restricted, 4→confidential per RESEARCH lock. Both EN and AR reflect this mapping.
2. **Semantic Unicode ellipsis (`…`)** — used across all 16 files instead of ASCII `...`. Required for proper Arabic glyph rendering and matches existing `dossier.json` analog.
3. **Engagements owns its own filter chrome** — `engagements.filter.*` and `engagements.loadMore.loading` exist independently of the shared `list-pages.pill.*` and `list-pages.loadMore.loading` keys. This lets the engagements page self-host filter pills without coupling to shared chrome (per RESEARCH §"Filter pill active styling anatomy").
4. **AR parity** — every EN key has a parallel AR key with proper Arabic translation (no English placeholders, no machine-translation artifacts).

## Threat Model Compliance

- T-40-01-01 (tampering) — accepted: static assets, same-origin.
- T-40-01-02 (sensitivity disclosure) — display-only labels; row visibility enforced by Supabase RLS upstream. No data exposure introduced.
- T-40-01-03 (i18n interpolation) — `week.of: "Week of {{date}}"` uses i18next's default-escaped interpolation; consumer plans render via safe React JSX text nodes only (no raw HTML insertion APIs anywhere in Phase 40).

## Deviations from Plan

None — plan executed exactly as written. All prescribed JSON shapes, key paths, and AR translations match the plan spec verbatim. The `40-01-PLAN.md` and other planning files were checked into the worktree branch (they originated from `DesignV2`) so the worktree had its own copy of the plan during execution; this is incidental, not a content deviation.

## Verification Results

```bash
# Task 1 verification
node -e "JSON.parse(...list-pages.json EN+AR);console.log('OK')"   # → OK

# Task 2 verification (plan-prescribed)
14/14 OK
Acceptance criteria OK
  - countries EN has table.sensitivity AND sensitivity.confidential
  - persons EN has chip.vip
  - engagements EN has filter.travel, week.of, loadMore.loading
  - engagements AR filter.travel === "سفر"
  - forums EN has status.active
```

## Self-Check: PASSED

All 16 files exist on disk:

```
frontend/public/locales/en/list-pages.json     OK
frontend/public/locales/ar/list-pages.json     OK
frontend/public/locales/en/countries.json      OK
frontend/public/locales/ar/countries.json      OK
frontend/public/locales/en/organizations.json  OK
frontend/public/locales/ar/organizations.json  OK
frontend/public/locales/en/persons.json        OK
frontend/public/locales/ar/persons.json        OK
frontend/public/locales/en/forums.json         OK
frontend/public/locales/ar/forums.json         OK
frontend/public/locales/en/topics.json         OK
frontend/public/locales/ar/topics.json         OK
frontend/public/locales/en/working-groups.json OK
frontend/public/locales/ar/working-groups.json OK
frontend/public/locales/en/engagements.json    OK
frontend/public/locales/ar/engagements.json    OK
```

Both commits exist in worktree branch:

- `76feb498` — Task 1 (shared list-pages namespace)
- `5d5ab9ce` — Task 2 (7 entity namespaces × EN + AR)

## Wave 1 Unblocked

Every Wave 1 page plan (40-03 through 40-09) can now safely call `useTranslation(['{entity}', 'list-pages'])` without raw-key fallback. Sensitivity chip rendering, filter pills, load-more buttons, and empty states all have backing translations in both locales.
