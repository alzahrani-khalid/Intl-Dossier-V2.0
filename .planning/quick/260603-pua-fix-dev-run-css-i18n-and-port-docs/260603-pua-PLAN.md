---
quick_id: 260603-pua
slug: fix-dev-run-css-i18n-and-port-docs
date: 2026-06-03
status: complete
---

# Quick Task 260603-pua: Fix validated dev-run / browser-inspection findings

## Context

A dev-run + browser inspection report surfaced several issues. Each was
re-verified against the live code before action. Only the genuinely valid,
non-seed-data, code/doc issues are in scope here.

## Tasks

### Task 1 — Fix PostCSS `@import` ordering warning (CSS)

- **Files:** `frontend/src/components/calendar/calendar.css`
- **Action:** `@import './shared-week-list.css';` sat at line 96, _after_ CSS
  rules (`.cal-grid` etc. begin at line 5), triggering PostCSS
  "@import must precede all other statements". Hoist the import to the top of
  the file (after the header comment, before `.cal-grid`); relocate its
  explanatory comment with it and trim the now-stale note at the old site.
- **Verify:** `grep @import calendar.css` shows a single import, only comments
  precede it.
- **Done:** No PostCSS `@import` ordering warning for this file.

### Task 2 — Fix Arabic i18n mistranslation (nav.engagements)

- **Files:** `frontend/src/i18n/ar/common.json`
- **Action:** `navigation.engagements` was `"الالتزامات"` (= "commitments",
  identical to `navigation.commitments`). EN is `"Engagements"`. Change to
  `"الارتباطات"`, matching `dossiers.json` ("ارتباط") and `audit-logs.json`
  ("الارتباطات"). Codebase-wide grep confirmed this was the only occurrence
  of the bug class (no drift).
- **Verify:** `node -e` parse → valid JSON, value = "الارتباطات".
- **Done:** Arabic sidebar no longer labels Engagements as "الالتزامات".

### Task 3 — Document the macOS port-5000 proxy collision (docs only)

- **Files:** `backend/.env.example` (tracked), `frontend/.env.development` (local/gitignored)
- **Action:** Backend default port is 5000 and is consistent across
  Linux/CI/Docker; the report's "mismatch" is a macOS-only AirPlay collision on 5000. Do **not** change the `vite.config.ts` default (that would break the
  consistent setup elsewhere). Instead document the override
  (`PORT=5001` + `VITE_BACKEND_PROXY_TARGET=http://localhost:5001`) as comments.
- **Verify:** Comments present; no default values changed.
- **Done:** Next macOS dev sees the workaround in the env files.

## Out of scope (verified NOT bugs)

- Empty Week Ahead / VIP Visits / Recent Dossiers widgets — seed-data gaps.
- Overdue-commitment titles in English while chrome is Arabic — seed data.
- Stale `baseline-browser-mapping` npm warning — cosmetic.
- Backend "4 overdue deadlines" startup log — informational, matches dashboard.
- Shared-password security note — operational advice, not a code change.
