# Dossier Workflows — Round 11 UAT Results — 2026-06-10

Live browser acceptance test of every bucket-A fix landed in rounds 6–10
(commits 2eef7c75, 87d61b52, f48dfc60, 048fb2b9, d30789f1), driven against the
running dev app at `localhost:5173` → staging `zkrcjzdemdmwhearhfgg`, in both
EN and AR. Test matrix drafted by codex (gpt-5.5 xhigh):
`reports/dossier-uat-matrix-round11-2026-06-10.md`. Executed by Claude via
browser automation + Supabase MCP.

## Verdict

**22 of 26 items PASS** (12 fully, 10 pass on the observable path with the rest
data-blocked). **0 regressions.** 2 of the 26 were blocked entirely by missing
staging data until seeds were added, then passed. The UAT surfaced **4 new
findings**; 3 fixed this round (F1, F2, F4 — plus F5's same-class sweep), 1
left as B-bucket observation (F3 is by-design, documented).

## Seeded test data (left in place as plausible staging seeds)

- `calendar_entries` row `3f465d9e-…` "Indonesia delegation follow-up"
  (dossier b0000001-…-0001, event_date 2026-06-08) — proves R6-04.
- `aa_commitments` "UAT round-11 commitment" on UAE via the UI itself — proves R6-09.
- `dossier_relationships` WG-D → Indonesia `cooperates_with` via the UI itself — proves R10/R6-07.
- Person dossier `19a22b0d-…` "Sen. Maria Vergara" with
  `person_subtype='elected_official'`, office + term_number=2 — proves R7-08/R9-06
  (staging had ZERO elected officials before this).

## Per-item results

| ID              | Check                                        | Result                                                                                                                                                              |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R6-01           | Key Contacts honest overflow                 | PASS-empty (key_contacts has 0 rows on staging; empty state clean, no dead link)                                                                                    |
| R10/R6-02       | key_contacts narrowed select                 | PASS — no 400 on country overview (old signature gone)                                                                                                              |
| R6-05           | Engagement brief cards                       | PASS-empty (briefs table empty; no inert View, clean empty state, no 400)                                                                                           |
| R6-09           | CommitmentDialog invalidation + single toast | **PASS** — 1 toast, list 3→4 live, timeline updated, no reload                                                                                                      |
| R6-11           | Inheritance badge localized                  | **PASS** EN "Direct" / AR "مباشر"                                                                                                                                   |
| R7-02           | Priority normalization                       | PASS — Medium/High/متوسطة/عالي badges, no raw enums (no critical-priority rows on staging to exercise the map directly)                                             |
| R7-03           | Audit tab removed                            | **PASS** — verified absent on country, topic, forum, working_group (removal is central). Engagement _workspace_ Audit tab is a real lifecycle audit, correctly kept |
| R7-05           | Dead `call` pill removed                     | **PASS** — All/Meeting/Travel + الكل/اجتماع/سفر, no Call/مكالمة                                                                                                     |
| R7-07           | Engagements tab badges localized             | **PASS after F2 fix** — `internal_meeting` was raw (map gap), now اجتماع داخلي                                                                                      |
| R7-08           | EO export label                              | **PASS** — "Elected Official" / dialog fully localized (needed EO seed)                                                                                             |
| R8-01           | Drawer documents KPI                         | PASS-mechanism — drawer now fetches position_dossier_links/mous (before: section never requested); counts 0 = real data                                             |
| R8-02           | Overview cache key isolation                 | PASS — drawer-first then overview shows populated Recent Activity (no cross-pollination)                                                                            |
| R8-03           | Inert doc icons removed                      | PASS-empty (no doc rows exist anywhere on staging to render)                                                                                                        |
| R8-05/06        | Sidebar tier/type i18n                       | **PASS** — Strategic(1)/استراتيجي + "Cooperates with"/يتعاون مع after creating the first relationship row on staging                                                |
| R8-07           | Mobile relationship trigger a11y             | **PASS** — accessible name "Relationships" at 390px                                                                                                                 |
| R8-08           | Timeline statuses                            | PASS-partial — pending/overdue localized (قيد الانتظار/متأخر); draft/submitted/triaged rows don't exist on staging                                                  |
| R9-01           | BilateralSummary locale numbers              | PASS-empty + **F5 fix applied** (see findings)                                                                                                                      |
| R9-03           | Workspace metrics locale                     | **PASS after F5 fix** — أيام في المرحلة + ٠٪ Arabic-Indic                                                                                                           |
| R9-04           | Member overflow honest text                  | PASS-empty (no WG with >5 members)                                                                                                                                  |
| R9-05           | Person summary stats locale                  | PASS-empty + F5 fix applied                                                                                                                                         |
| R9-06           | EO office card                               | **PASS after F5 fix** — معلومات المنصب, رقم الولاية renders ٢ (was Latin 2)                                                                                         |
| R10/R6-03-part  | positions-dossiers-create created_by         | NOT-BROWSER (edge deploy verified in round 10; skipped write)                                                                                                       |
| R10/R6-04       | Calendar re-point                            | **PASS** — seeded entry shows in Upcoming-Events KPI (future-dated) AND Engagements tab (past-dated); drawer fetches calendar_entries                               |
| R10/R6-06       | Upload Document removed                      | **PASS** — absent from menu in EN and AR                                                                                                                            |
| R10/R6-07       | Relationship dialog canonical                | **PASS incl. write** — 5 canonical type options, POST `{source_dossier_id, target_dossier_id, relationship_type}` → 201 + auto-refetch                              |
| R6-11-inherited | Non-direct inheritance badges                | PARTIAL (no inherited-context entry point exercised)                                                                                                                |

## New findings (F-series)

### F1 — briefs select was a dead contract, 400 on EVERY dossier (FIXED)

`fetchDocuments` selected `id, content_en, content_ar, generated_by,
generated_at, is_template` from `briefs` filtered by `dossier_id`. Live briefs
has NONE of those columns (content is one jsonb `content`; no `dossier_id` at
all — links via `country_id`/`organization_id`/`engagement_dossier_id`); table
is empty (0 rows). The 42703 fired on every overview/docs/drawer fetch and was
swallowed into an empty briefs group (exactly the R9-02 error-swallow contract,
still escalated). **Fix:** sub-fetch removed with schema-fact comment; shape
kept (`briefs: []`); `BRIEFS_COLUMNS.LIST` corrected to live columns + warning.

### F2 — eventType i18n map missing 5 of 8 live entry_type values (FIXED)

The R10 calendar re-point feeds `calendar_entries.entry_type` into the
`dossier-overview:eventType.*` map, which only had the legacy 6 keys. Live
CHECK allows `internal_meeting, deadline, reminder, holiday, training, review,
forum, other` → `internal_meeting` etc. rendered raw (R7-07's fallback).
**Fix:** 5 keys added EN+AR (mirroring calendar.json translations).

### F3 — elected_official is NOT a dossier type on staging (BY DESIGN, note)

`dossiers_type_check` allows only 7 types. Migration 20260202000001
deliberately merged EO into `person` + `persons.person_subtype='elected_official'`.
Staging had **zero** EO-subtype persons, so every EO surface (list, detail,
export, office card) was data-dead until this round seeded one. If EO flows
matter for demos, keep at least one EO seed person (now present).

### F4 — backend auth middleware 401'd EVERY authenticated /api route (FIXED)

`fetchUserContext` selected `permissions` from `users` and `role` from
`profiles` — neither column exists live. Both selects 42703'd → user lookup
"failed" → fail-closed 401 ("Authentication required" after sanitization) for
every valid token on every Express-backed endpoint (EO detail, etc.).
**Fix:** dead columns dropped from both selects; role comes from `users.role`
(consistent with 260610-fkn auth unification); `permissions: []`.
Verified: `/api/elected-officials/:id` returns data; EO office card renders.
**Deploy note: the droplet backend needs this commit to serve EO detail.**
(Separate pre-existing issue: `/api/countries` 500s — legacy endpoint, UI
doesn't call it, not touched.)

### F5 — Intl.NumberFormat('ar') renders LATIN digits in Chrome (FIXED, same-class sweep)

All round-9 digit-localization fixes used `Intl.NumberFormat(i18n.language)`;
bare `'ar'` resolves to the `latn` numbering system in Chrome 148
(`resolvedOptions().numberingSystem === 'latn'`), so the Arabic UI still showed
Latin digits — the exact symptom R9 set out to fix. `'ar-SA'` resolves to
`arab` (١٢٣). **Fix:** new `lib/format-locale.ts` `toFormatLocale()` helper
(ar→ar-SA) applied to BilateralSummaryCard, SharedSummaryStatsCard,
ElectedOfficialOfficeCard, workspace OverviewTab, and the round-5 my-work
sites (TeamWorkloadPanel, WorkItemTabs). FieldHistoryTimeline and
EntityComparisonTable already used 'ar-SA' (the correct precedent).
Verified live: رقم الولاية ٢, task progress ٠٪.

## Residual observations (not fixed, for backlog)

- Work-items tab counters/pills and most list-page dates still use Latin digits
  and EN month names in AR — pre-existing, outside rounds 6–10 scope.
- Relationship map graph panel showed "No relationships found" while the tier
  strip showed the new row (graph reads a different RPC — already escalated as
  the outgoing-only traversal B-item).
- R9-02 error-swallow contract (sections render failures as empty states)
  remains the enabling condition for F1-class silent breakage — still the top
  B-bucket candidate.
- Local dev gotcha: a backend started without Supabase env silently 401s
  everything; backend/.env has only VAPID keys. Start it with `.env.test`
  sourced (this round restarted it correctly on :5001).
