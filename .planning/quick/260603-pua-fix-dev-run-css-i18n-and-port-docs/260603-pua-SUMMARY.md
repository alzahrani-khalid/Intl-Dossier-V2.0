---
quick_id: 260603-pua
slug: fix-dev-run-css-i18n-and-port-docs
date: 2026-06-03
status: complete
---

# Quick Task 260603-pua — Summary

Triaged a dev-run + browser-inspection findings report. Re-verified each finding
against the live code; fixed the three valid code/doc issues, and explicitly
rejected the seed-data / cosmetic / advisory items as not-bugs.

## What changed

| #   | Finding                                                                    | Verdict                        | Fix                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | PostCSS `@import must precede all other statements` (shared-week-list.css) | **Valid**                      | Hoisted `@import './shared-week-list.css';` to the top of `calendar.css` (was at line 96, after rules). Comment relocated.                                                                                                                                                                                                              |
| 2   | Arabic nav labels Engagements as "الالتزامات" (commitments)                | **Valid bug**                  | `ar/common.json` `navigation.engagements` `"الالتزامات"` → `"الارتباطات"`. Grep confirmed single occurrence (no drift).                                                                                                                                                                                                                 |
| 3   | Vite proxy targets :5000 but backend runs :5001                            | **Valid, but config not code** | Backend default IS 5000 (consistent on Linux/CI/Docker); collision is macOS AirPlay-only. Documented the `PORT=5001` + `VITE_BACKEND_PROXY_TARGET` override in `backend/.env.example` (tracked) and `frontend/.env.development` (local). Did NOT change the `vite.config.ts` default — that would break the consistent setup elsewhere. |

## Rejected (verified not-bugs)

- Empty Week Ahead / VIP Visits / Recent Dossiers widgets → seed-data gaps.
- English overdue-commitment titles under Arabic chrome → seed data.
- Stale `baseline-browser-mapping` npm warning → cosmetic.
- Backend "4 overdue deadlines" log → informational, matches the dashboard.
- Shared live password in chat → operational advice (rotate + use `.env.test`); no code action.

## Files

- `frontend/src/components/calendar/calendar.css` — `@import` hoisted to top.
- `frontend/src/i18n/ar/common.json` — engagements nav label corrected.
- `backend/.env.example` — macOS port-5000 collision documented (tracked).
- `frontend/.env.development` — same override documented (local, gitignored).

## Verification

- `ar/common.json` parses as valid JSON; `navigation.engagements === "الارتباطات"`.
- `calendar.css` has a single `@import`, preceded only by comments.
- No default port values changed; `vite.config.ts` untouched.

## Notes

- `frontend/.env.development` is gitignored (`.gitignore:24`), so its note is
  local-only — the durable team-facing copy lives in tracked `backend/.env.example`.
