# Live-app audit — 2026-08-15

Six consultants drove the running app (localhost:5173, staging Supabase) through real
browser sessions across **190 route/tab URLs** in English and Arabic, capturing 370
screenshots. **144 findings.** Structural claims were re-verified against source and the
live database by the orchestrator; those are marked **[V]** below.

Method and the shared probe are in `00-BRIEF.md` / `probe.mjs` (re-runnable). Screenshots
were session-scoped and are gone; every finding cites its route and observation.

| Lane              | Model    | Scope                                                   | Routes | Findings |
| ----------------- | -------- | ------------------------------------------------------- | -----: | -------: |
| `worksurfaces.md` | Opus 5   | dashboard, my-work, tasks, kanban, intake, approvals    |     28 |       30 |
| `engagements.md`  | Opus 5   | engagements, after-actions, positions, briefs, calendar |     27 |       28 |
| `adminops.md`     | Opus 5   | admin, settings, users, analytics, reports, monitoring  |     44 |       26 |
| `dossiers.md`     | Opus 5   | 8 dossier types × list/create/detail tabs               |     66 |       25 |
| `designcritic.md` | Fable 5  | design-contract fidelity + Arabic quality               |     15 |       24 |
| `sweeper.md`      | Sonnet 5 | auth, 404s, logout, dead-route verdicts                 |     18 |       11 |

---

## The governing pattern: failure is rendered as emptiness

A request fails (401/404/500/malformed) and the UI shows a calm empty state instead of an
error. The user cannot tell "nothing here" from "this broke". This is **one fix repeated**,
not N bugs: distinguish a rejected query from an empty result at the data layer and let
error states render. Several pages already have an `isError` branch that is dead code
because the repository catches the failure and returns `{ data: null }`.

Worst instance **[V]**: `/admin/field-permissions` shows "0 Permissions · No permission
rules configured" while the DB holds **19 active rules**.

---

## Ship-blockers (19)

| #   | Finding                                                                                                                                                                                                                                                                                                            | Source            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| 1   | **No way to log out anywhere in the app.** Sidebar user card is a plain `<div>`; no topbar menu; `/settings` has no sign-out and isn't in the nav. A working dropdown exists at `components/layout/nav-user.tsx` and is imported nowhere. **[V]**                                                                  | sweeper F6        |
| 2   | **133 of 303 edge functions pin `supabase-js@2.3x`** and call bare `getUser()`, so they 401 against a valid session. Root cause behind several "empty" admin pages. **[V]**                                                                                                                                        | adminops F2       |
| 3   | **Every `/settings` tab fails to save, and always has.** `.upsert()` on `users` omits NOT NULL `email` → `23502`. Code comment documents a _previous_ failed fix. **[V]**                                                                                                                                          | adminops F3       |
| 4   | `/delegations` renders "You haven't granted any delegations" over two 401s                                                                                                                                                                                                                                         | engagements F4    |
| 5   | **After-action records cannot be created.** `AfterActionForm.tsx:131` `if (!initialData) return` → never dirty → Save permanently disabled; Publish never rendered (route passes neither `canPublish` nor `onPublish`). List 500s on a bad PostgREST embed; detail shows raw key `afterActions.loadError`. **[V]** | engagements F1–F3 |
| 6   | `/search` throws `Cannot read properties of undefined (reading 'forEach')` on every query                                                                                                                                                                                                                          | worksurfaces F1   |
| 7   | `/intake/new` can never submit — dossier picker writes to display state, not the form field                                                                                                                                                                                                                        | worksurfaces F2   |
| 8   | Kanban rejects every commitment drag (400): board writes kanban stage into `aa_commitments`, whose lifecycle is `pending/in_progress/completed/cancelled`                                                                                                                                                          | worksurfaces F4   |
| 9   | Report generation 400s silently — client sends `template`, function reads `type`                                                                                                                                                                                                                                   | adminops F5       |
| 10  | **Scheduled reports uncreatable** — `custom_reports`.SELECT sub-queries `report_shares` and vice-versa → `42P17` infinite recursion. **[V]**                                                                                                                                                                       | adminops F6       |
| 11  | `/analytics` renders fabricated chart art; its backend endpoint does not exist                                                                                                                                                                                                                                     | adminops F4       |
| 12  | Engagement dossiers render a nameless, dataless shell (404 swallowed)                                                                                                                                                                                                                                              | dossiers F1       |
| 13  | Nonexistent dossier ID → "Check your connection" instead of not-found                                                                                                                                                                                                                                              | sweeper F2        |
| 14  | `/tasks/queue` replaced by raw "Edge Function returned a non-2xx status code"                                                                                                                                                                                                                                      | worksurfaces F3   |
| 15  | `/scenario-sandbox` spins forever on an unsurfaced 500                                                                                                                                                                                                                                                             | sweeper F3        |
| 16  | `/word-assistant` shows "Connected" while returning canned stubs; `isConnected` hardcoded                                                                                                                                                                                                                          | sweeper F4        |
| 17  | `/monitoring` serves raw JSON — Vite proxy shadows the SPA route                                                                                                                                                                                                                                                   | adminops F7       |
| 18  | Session invalidation doesn't bounce; page decays to a "Member/Member" ghost state                                                                                                                                                                                                                                  | sweeper F7        |
| 19  | `/custom-dashboard` queries `calendar_entries.start_datetime`; column doesn't exist (`event_date`). **[V]**                                                                                                                                                                                                        | sweeper F5        |

---

## Cross-cutting patterns (each found independently by 3+ lanes)

1. **Counts disagree on every surface.** Dashboard "18 open commitments" vs `/commitments` 12; `/my-work` badge 18 / footer 21 / **11 rows rendered**; hub counts 16 persons, list renders 15 and page 2 is empty. List queries inner-join the extension table; counters don't.
2. **Features with no entry point.** Elected Officials fully built, zero nav (CLAUDE.md declares 8 dossier types, UI exposes 7); engagement Digests tab renders but isn't in the tab bar; the whole `/settings/*` subtree renders with **no navigation at all**; 9 admin routes have zero inbound links.
3. **DB values and i18n keys shipped as copy.** `in_progress`, `action_item`, `human_entered`, `WEEK OF 2026-W27`; keys `regions.Europe`, `afterActions.loadError`, `CALENDAR.RECURRENCE.TITLE`, `common.loading`, five `entityLinks.*`.
4. **Seed instructions as user copy.** "Add VIP participant data to the dashboard seed, then refresh the widget"; Arabic digest error says check the _test data_. 4 strings in `dashboard-widgets.json`, both locales.
5. **Test fixtures indistinguishable from real records.** `/users` = **415 accounts, all Active**, nearly all fixtures; "Phase 70 staging verification digest"; "E2E MoU 1783364705954".
6. **Seven date formats against one written spec** (`Tue 28 Apr` / `14:30 GST`). A correct shared formatter exists and is used in two places.
7. **Work reported outstanding when finished.** Dashboard lists Completed tasks as Overdue; Kanban Done can never fill (`status` and `workflow_stage` written independently).

## Arabic / RTL — a clean split

**Infrastructure is sound** and needs no work: every AR route returned `dir="rtl"`, `lang="ar"`,
Tajawal applied, **zero horizontal overflow**, correct mirroring. Two lanes checked suspected RTL
bugs by measuring DOM rects and **all were false alarms**.

**Translation coverage is not.** The Arabic name of the core object is unstable — **دوسيه**
(hub) vs **ملف** (dashboard/breadcrumb) vs **دوسييه** (brand); nav says **الارتباطات** while the
page it opens is titled **المشاركات**. No date is ever localised. The 404 page is entirely English
under `dir="rtl"`. Recurring root cause: dot-form keys (`t('intake.description', 'English default')`)
resolve to the English default in **both** languages.

## Design system — no action needed

Zero raw hex, zero Tailwind color literals, zero card shadows, zero gradients, correct surface
ladder and radii across every screen probed. Token discipline is not a problem. The gap is copy:
Title Case is de-facto while the spec mandates sentence case; 46 exclamation-mark strings and 8
first-person-plural strings violate the banned-copy rules.

## Database & security posture (Supabase advisors, cross-checked against query paths)

**207 frontend files query Supabase directly and rely on RLS as the only authorization
boundary** (only 9 touch the Express backend). Against that: 33 `SECURITY DEFINER` views
(`unified_work_items` is queried from 10 frontend files), 12 materialized views selectable by
`anon`/`authenticated`, 2 views may expose `auth.users` (`entity_comments_with_details` is
queried from the frontend), `intelligence_email_queue` and `events.idempotency_keys` have RLS
enabled with **no policies** (deny everything), leaked-password protection off, 548 functions
with mutable `search_path`.

## Smaller structural defects

`/positions` has two route files claiming one slot (`$id.tsx`, `$positionId.tsx`);
`legislation.tsx` renders no `<Outlet/>` so its detail page is unreachable;
`@assistant-ui/core@0.2.18` loads twice at runtime (`vite.config.ts` dedupes
`@radix-ui/react-direction` but not this).

## Verified as already fixed — do not re-open

The prior "dossier overview tabs read generic data" concern is **resolved**: all 8 types render
type-specific sections, several with real data. Demo routes are correctly gated —
`/responsive-demo` and `/modern-nav-standalone` sit behind `devModeGuard`;
`/dashboard/project-management` is an intentional redirect; `/admin/preview-layouts` and
`/compare` are real, wired features. Nothing there needs deleting.
