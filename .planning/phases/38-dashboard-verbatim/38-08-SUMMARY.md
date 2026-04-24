---
phase: 38-dashboard-verbatim
plan: '08'
status: PASS-WITH-DEVIATION
subsystem: frontend/dashboard
tags: [widgets, zustand, tanstack-query, RTL, i18n, monogram, LtrIsolate]
requirements_addressed: [DASH-08, DASH-09]
dependency_graph:
  requires: [38-00]
  provides:
    - 'RecentDossiers — Zustand selector list (top 7) with locale-aware timestamps'
    - 'ForumsStrip — useForums({ limit: 4 }) horizontal strip with monogram chips'
  affects:
    - 'frontend/src/i18n/{en,ar}/dashboard-widgets.json (forums.status keys appended)'
tech_stack:
  added: []
  patterns:
    - 'Zustand selector projection (`useDossierStore((s) => s.recentDossiers)`)'
    - 'date-fns formatDistanceToNow with locale switching (ar / enUS)'
    - 'Client-derived monogram from `name_en.split(/\\s+/).map(w=>w[0]).join("").slice(0,3)`'
    - 'LtrIsolate wrapper for Latin short-codes inside RTL document direction'
key_files:
  created:
    - frontend/src/pages/Dashboard/widgets/__tests__/RecentDossiers.test.tsx
    - frontend/src/pages/Dashboard/widgets/__tests__/ForumsStrip.test.tsx
  modified:
    - frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
    - frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx
    - frontend/src/pages/Dashboard/widgets/dashboard.css
    - frontend/src/i18n/en/dashboard-widgets.json
    - frontend/src/i18n/ar/dashboard-widgets.json
decisions:
  - 'Adapted to real `useForums` return shape (`ForumListResponse { data: Forum[] }`) rather than the plan-spec stub `{ forums: ForumSummary[] }` — Rule 3 blocking-issue fix; spec was based on a hypothetical interface.'
  - 'Used `Forum.name_en/name_ar` (real shape from `forum.types.ts`) instead of plan-spec single `name` field. Locale resolution selects `name_ar` when `i18n.language === "ar"` and falls back to `name_en` otherwise. Monogram is always derived from `name_en` to keep Latin short-codes deterministic regardless of UI language.'
  - 'Used real `DossierEntry` shape from `dossierStore.ts` (`name_en`, `name_ar`, optional `route`) instead of plan-spec stub (`name`, `flag`, required `route`). DossierGlyph receives `type` + `name` (plan-spec `flag` prop does not exist on `DossierGlyph` — actual prop is `iso`). When `route` is absent, falls back to `/dossiers/{id}`.'
  - "Single-token monogram (`G20`, `OPEC`, `EU`) returns first 3 chars of the token; multi-token returns first letters of each token (max 3). Plan-spec example `'General Assembly' → 'GA'` and `'United Nations' → 'UN'` both pass."
  - 'TanStack-Router `Link` typing for dynamic string `to` paths required `to={route as any}` cast (router type-system needs literal route strings).'
metrics:
  duration_minutes: 25
  completed_date: '2026-04-25'
  tasks_completed: 3
  files_changed: 7
commits:
  - hash: '3bdda6b2'
    type: feat
    scope: '38-08-01'
    title: 'hydrate RecentDossiers with Zustand selector + locale-aware timestamps'
  - hash: '53977df6'
    type: feat-mislabeled-as-docs
    scope: '38-08-02 (sweep-included)'
    title: 'ForumsStrip + tests + i18n status keys (committed inside parallel docs(38-03) commit due to ref-lock race)'
tests_run:
  - 'frontend ./node_modules/.bin/vitest run src/pages/Dashboard/widgets/__tests__/RecentDossiers.test.tsx → 4/4 passed'
  - 'frontend ./node_modules/.bin/vitest run src/pages/Dashboard/widgets/__tests__/ForumsStrip.test.tsx → 6/6 passed'
  - 'Combined: 10/10 passed'
coverage_notes: 'RecentDossiers covers: 7-cap, Link href wiring, empty state, Arabic-locale name resolution. ForumsStrip covers: monogram derivation (GA, UN), 4-card render, LtrIsolate wrapper (.forum-monogram dir="ltr"), useForums limit=4 contract, badge i18n key path forums.status.{status}.'
deviations:
  - rule: 'Rule 3 — blocking issue (interface drift)'
    type: shape-mismatch-spec-vs-real
    description: 'Plan spec described `useForums` returning `{ forums: ForumSummary[] }` with `ForumSummary { id, name, status }`. Real hook returns `ForumListResponse { data: Forum[], pagination }` with `Forum { name_en, name_ar, status, extension, ... }`. Adapted widget to real shape.'
    file: frontend/src/pages/Dashboard/widgets/ForumsStrip.tsx
  - rule: 'Rule 3 — blocking issue (DossierGlyph prop drift)'
    type: prop-rename
    description: 'Plan spec used `<DossierGlyph flag={d.flag} ... />` but real `DossierGlyph` accepts `iso` (not `flag`). DossierEntry has no `flag` field. Used `<DossierGlyph type={d.type} name={name} />` so countries with unknown ISO and non-country types fall through to the initials/symbol resolution path.'
    file: frontend/src/pages/Dashboard/widgets/RecentDossiers.tsx
  - rule: 'Process — concurrent commit race'
    type: commit-mislabeled
    description: 'Task-2 ForumsStrip commit attempt collided with a parallel agent committing 38-03 docs at the same SHA. The local files (ForumsStrip.tsx + ForumsStrip.test.tsx + i18n keys) ended up included inside commit 53977df6 (`docs(38-03): complete OverdueCommitments plan`). Files are committed and tracked; commit message is mislabeled. No code regression — verified by inspecting `git show --stat 53977df6` and re-running the 10 widget tests on HEAD.'
    file: 'git history (commit 53977df6)'
open_risks:
  - 'WeekAhead.test.tsx has 6 pre-existing failing tests (out of 38-08 scope; logged in `.planning/phases/38-dashboard-verbatim/deferred-items.md`).'
  - 'Commit 53977df6 is mislabeled — actually contains both 38-03 SUMMARY.md AND 38-08 ForumsStrip artifacts. Future archeology may need this note.'
threat_flags: []
---

# Phase 38 Plan 08: RecentDossiers + ForumsStrip Summary

**One-liner:** Hydrated the two right-panel Wave-1 widgets — RecentDossiers reads `dossierStore.recentDossiers` (top-7, locale-aware `formatDistanceToNow`, falls back through `name_en`/`name_ar` and `/dossiers/{id}`) and ForumsStrip pulls `useForums({ limit: 4 })` with client-derived monogram short-codes (`GA`, `UN`, `G20`) wrapped in `<LtrIsolate>` so Latin codes stay LTR inside `forceRTL` documents.

## Outcome

- 7 files touched (2 new tests, 5 modified — both widgets, dashboard.css, EN+AR i18n)
- 10/10 unit tests pass (4 RecentDossiers + 6 ForumsStrip)
- Grep-gate clean (zero `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right` in either widget)
- 2 logical commits (one mislabeled due to concurrent-commit race; see deviations)

## Key Decisions Made

1. **Adapted to real `useForums` shape** — plan spec used `{ forums }`; real hook returns `{ data: Forum[], pagination }`. Widget unwraps `data?.data ?? []`.

2. **Monogram derived from `name_en` only** — keeps Latin short-codes deterministic regardless of `i18n.language`. Single-token names like `G20` slice the first 3 chars; multi-token names take the first letter of each token (max 3).

3. **`<LtrIsolate>` wrapping** (T-38-04 mitigation) — monograms render with `dir="ltr"` so `UN`, `G20`, `OPEC` keep Latin reading order inside an `forceRTL`/`dir="rtl"` document. Verified by selector `.forum-monogram[dir="ltr"]` in unit test 4.

4. **DossierGlyph prop adaptation** — real `DossierGlyph` uses `iso` (not `flag` as plan spec suggested) and `DossierEntry` has no `flag` field anyway. Switched to `<DossierGlyph type={d.type} name={name} size={20} />` which routes to the symbol/initials fallback path. Future plan can extend `DossierEntry` with `iso` to enable hand-drawn flags here.

5. **Append-only i18n** — added `forums.status.{active,scheduled,archived}` to both EN and AR JSON without touching any other namespace; existing `forums.title` and `forums.empty` keys preserved.

## Threat Mitigations Verified

| Threat ID                         | Disposition | Verification                                                                                                                                                                            |
| --------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-38-01 (mock leak)               | mitigated   | Both widgets read from real adapters (`useDossierStore`, `useForums`); zero hardcoded forum/dossier constants in widget files                                                           |
| T-38-04 (RTL monogram short-code) | mitigated   | `<LtrIsolate>` wraps every monogram; ForumsStrip test 4 asserts `.forum-monogram[dir="ltr"]`                                                                                            |
| T-38-02 (interface shape drift)   | mitigated   | Widgets import `Forum` and `DossierEntry` types directly from source-of-truth files; no inline type assumptions; deviations documented when plan-spec interfaces drifted from real ones |

## Self-Check: PASSED

- Files created: 2/2 verified on disk (both `__tests__/` files)
- Files modified: 5/5 verified (both widgets, dashboard.css, EN+AR i18n)
- Commits: `3bdda6b2` (RecentDossiers) verified in `git log`; ForumsStrip artifacts verified in `git show --stat 53977df6`
- key_links pattern regexes:
  - `useDossierStore\(\(s\) => s\.recentDossiers\)` → matches `RecentDossiers.tsx`
  - `useForums\(\{\s*limit:\s*4\s*\}\)` → matches `ForumsStrip.tsx`
  - `LtrIsolate` → matches `ForumsStrip.tsx` (monogram wrapper)
  - `formatDistanceToNow` → matches `RecentDossiers.tsx`
- Forbidden RTL classes (`ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right`): 0 in both widgets ✓
- Tests: 10/10 pass on HEAD
