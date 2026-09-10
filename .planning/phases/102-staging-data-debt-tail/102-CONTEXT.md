# Phase 102 — Staging Data & Debt Tail — CONTEXT

**Branch** `milestone/v10.0-trust` · **Planned from HEAD** `3ec257adc` · **Planned** 2026-09-10 by the
planner seat `plan102` (w0:pH0) under `.tickmarkr/overseer/BRIEF-PLANNER-102.md`. No `/gsd:discuss-phase`
was run: the operator is not present tonight, so every decision below is the planning seat's ruling on the
research seat's proposals (`102-RESEARCH.md` §20, `PD-NN`), each marked **RULED** (default chosen, the
alternative named — the overseer may override before the run) or **SETTLED** (evidence leaves one reading).
**Staging** `zkrcjzdemdmwhearhfgg`. Every number here was re-derived live on 2026-09-10; the command is in
`102-RESEARCH.md` beside it, and a plan that depends on one re-runs the command.

Decision ids are plain `D-NN` only — `scripts/decision-coverage.mjs` cannot extract sub-lettered ids
(`GATESTD-03`), and this phase is the one that repairs it.

---

## 1. Scope — the roadmap names 6 rows; the register assigns 22

### D-01 — All 22 register rows are in scope, and each one gets a plan or a named deferral line

`DATA-01 DATA-02 SEED-DELEG-01 DELEG-02 WRITER-ROUTE-01 INSERT-SYNC-01 P52FIXTURE-01 CARRY-06 CARRY-07
CARRY-08 GUIDE-HOLLOW-01 EDGECOPY-01 COPY-09 GATESTD-01 GATESTD-02 GATESTD-03 GATESTD-04 GATESTD-05
ENGREAD-01 PREVIEW-HOLLOW-01 ROUTE-ORPHAN-01 PARALLEL-TRUTH-01` (research §0). The roadmap's five success
criteria map to `DATA-01`, `DATA-02`, `CARRY-06`, `CARRY-07`, `CARRY-08`. SETTLED.

### D-02 — Every acceptance criterion is a positive state with the value at which it breaks

Not "no fixture accounts" but "`auth.users` holds exactly the 13 enumerated emails"; not "no Title Case"
but "namespace X holds K carve-out candidates and its `ar` file holds the same keys". Absences, greps for
missing text and empty collections are not criteria (`tickmarkr.spec.md`). SETTLED.

### D-03 — Oracles that need a browser are `test:` oracles on specs the plan authors, and they are NOT drilled tonight

Brief rule 6 forbids Playwright while the P100 run is live. `ENGREAD-01`'s render probe and `CARRY-06`'s
two-date snapshot run are therefore `test:` oracles (spec title == criterion verbatim, spec path in
`files_modified`), each paired with a drillable `command:` positive control at the API/data layer. The
drilled-oracle table records them as `NOT DRILLED — playwright forbidden tonight (brief rule 6); drilled
by the engine's test gate`. Every `command:` oracle IS drilled. SETTLED.

**Amended 2026-09-10 22:20 local after the plan check (F-13a).** `.tickmarkr/config.yaml`'s test gate
dispatches `oracle: test` as vitest only, so a Playwright spec can never be selected by a `test:` oracle and
the gate would fail closed forever. RULED: browser legs are `command:` oracles that launch the spec through
`scripts/pw-run-reaped.mjs` and parse the published report's `stats` (expected/unexpected hardcoded), failing
closed (exit 3) when the spec or report is absent. The browser leg of those oracles is NOT exercised tonight;
the orchestrator records that in the seat report, and the overseer may run them once outside the P100 window.
`PARALLEL-TRUTH-01` keeps a real `test:` oracle (a frontend vitest test).

### D-04 — `DATA-01`'s purge runs AFTER Phase 101 closes; the precondition is checked, not assumed

Roadmap: "purge the fixtures after the suites are green, then re-run them". The purge plan's `<read_first>`
requires a `101-*-SUMMARY.md` set and the P101 acceptance note before executing; the engine wave order
puts the purge in the LAST repair wave. `autonomous: false` is NOT used for this — sequencing is the
overseer's, and the purge itself needs no human act. SETTLED.

---

## 2. Data decisions (criteria 1–2, the seeds)

### D-05 — `DATA-01` purge population = the two named suffixes PLUS `@example.test`; keep-list = the 13 named emails

Population: `email ILIKE '%@example.com' OR '%@gastat.test' OR '%@example.test'` (402 today + 0; the third
suffix is what `frontend/tests/e2e/user-management.spec.ts:30-31` creates — research §1.4). Keep-list, by
name, asserted PRESENT after the purge: `kazahrani@stats.gov.sa`, `test.user@gmail.com` (the P100 census
non-owner — must survive), `admin@gastat.gov.sa`, `test@gastat-intake.local`, `mfmuhanna@gstats.gov.sa`,
`jfafnan@stats.gov.sa`, `akhorayef@stats.gov.sa`, `hmghulaiga@stats.gov.sa`, `aabalobaid@stats.gov.sa`,
`ashaibani@stats.gov.sa`, `analyst@e2e.test`, `intake@e2e.test`, `admin@e2e.test` (research §1.2). The
oracle asserts `count(*) from auth.users` == 13 AND all 13 present (RED at HEAD: 415). RULED (PD-06 scope).

### D-06 — Purge mechanism = GoTrue admin `deleteUser` per row via the service-role key, preceded by a CSV export, with the blocking-FK census re-run first

Research §1.6 measured 0 rows behind the 193 blocking FKs today, and §1.7 names the two mechanisms. GoTrue's
admin API is what the tests themselves use and keeps `auth.identities/sessions/mfa_*` consistent; a raw SQL
`DELETE` bypasses GoTrue and is the rejected alternative. The script lives in `scripts/` (node, service
role from `.env.test`), exports every row it will delete (§17's `\copy` set) to a dated directory OUTSIDE
the worktree before the first delete, re-runs the FK census and aborts on any non-zero blocking count, and
prints magnitudes (deleted, kept, cascade rows) not verdicts. RULED (PD-06 mechanism).

### D-07 — `DATA-01` clause 2 ("the suite deletes what it creates") binds three named specs

`tests/e2e/97-elected-officials-reachable.spec.ts` (68 `e2e-97-01-*` persons, no teardown),
`frontend/tests/e2e/user-management.spec.ts` (`@example.test` accounts, no teardown),
`frontend/tests/e2e/mou-create.spec.ts` (E2E MoUs, no teardown). Each gains an `afterAll` that deletes
by the prefix/suffix it created, and its own leaf title is unchanged. Backend integration tests already
pair create/delete (§1.4) and are out of scope. RULED (PD-04).

### D-08 — `DATA-02` is TWO acts: DELETE unreferenced residue, RENAME id-pinned seeds; the sweep is over ALL text columns

Delete set (nothing tracked references them by id or name): the 68 `e2e-97-01-*` persons, the two
`Phase 63 …` dossiers (`f63d0900-…`), the `intelligence_digest` row `2e08895a-…` (+ its `rag_chunks`
copy), `UAT round-11 commitment` (`18ecff8e-…`), the two E2E tasks, `Audience Test Position`,
`Test WIP Unit`, the E2E MoU `a054c7c4-…` plus its `mou_notification_queue` rows. Rename set (a spec or
seed pins the ID): `00000000-0000-0052-…` (see D-09), the `a0000000-…-05NN` persons and `-04NN` working
groups, `b0000003-…` commitment, the three `SRTL-02 regression seed` calendar rows. **Before renaming, the
plan greps every spec for assertions on the current NAMES** (`Test Person`, `SRTL-02`, `Kanban Fixture`)
and updates those assertions in the same plan, which therefore owns those spec files. The class oracle
sweeps every `text`/`varchar` column in `public` (research §2.1 showed the title-only list misses the
first named string) for `Phase \d+|E2E|UAT|fixture|staging verification` and asserts the enumerated
count of SURVIVING deliberate matches (0 expected) beside a positive control row. `\ytest\y` and `\yseed\y`
are excluded from the deletion regex — they match legitimate seed vocabulary. RULED (PD-03: rename reading).

### D-09 — `P52FIXTURE-01`: keep the id, rename the row, seed BOTH missing `engagement_dossiers` rows

`00000000-0000-0052-0000-000000000001` is pinned by 5 specs + `.env.test.example`; its name is DATA-02's
second string. One act: `name_en/name_ar` → plausible diplomatic copy, and INSERT the extension row
(`engagement_type='bilateral_meeting'`, `engagement_category='diplomatic'`, dates inside 2026). The ONS
engagement `7c0d830b-…` (the only `after_action_records` parent, needed by D-13's PDF probe) gets its
extension row in the same migration-free SQL seed file under `supabase/seed/`. Oracle: both ids present in
`engagement_dossiers` with those literals, and `dossiers WHERE type='engagement'` count == `engagement_dossiers`
count (5 == 5; RED at HEAD 5/3). SETTLED (PD-02).

### D-10 — `DELEG-02` repoints to `permission_delegations`, in ALL FOUR functions that name the phantom relation

`my-delegations`, `delegate-permissions`, `revoke-delegation`, `deactivate-user` (research §3.5). Column
map (§3.4): `grantor_id/grantee_id` as-is; `is_active` derived `NOT revoked AND now() BETWEEN valid_from
AND valid_until`; `source` dropped from the select and made a constant `'permission'` in the response
envelope (the frontend type keeps the field); email embeds via `public.users` (not `auth.users`, which
`authenticated` cannot read — P100 D-04). `position_delegations` is rejected: no readers, no start date, no
resource, no revocation audit. All four functions are deployed to staging by the worker with the §11.5
command. RULED (PD-01).

### D-11 — `SEED-DELEG-01` seeds three `permission_delegations` rows for the test user, and the happy-path oracle reads them through the DEPLOYED function

Rows: test user (`kazahrani@stats.gov.sa`) as grantor to `analyst@e2e.test` on `resource_type='dossier'`
(a real country dossier id), as grantee from `admin@e2e.test` on `'all'`, and one REVOKED row (so the card's
revoked branch has data). Oracle: `curl` the deployed `my-delegations` with the test user's JWT → 200 with
`granted` ≥ 1 and `received` ≥ 1 and `total` == 3 (RED at HEAD: 500). The `anon` full-DML grant on the table
(§3.1) is a P100-class observation, recorded in the summary, NOT repaired here. SETTLED.

---

## 3. Lifecycle seam (`WRITER-ROUTE-01`, `INSERT-SYNC-01`)

### D-12 — One migration extends the sync trigger to INSERT; the writers route through `workflow_stage`

`trg_sync_task_status` becomes `BEFORE INSERT OR UPDATE`, and `sync_task_status_from_workflow_stage()` on
INSERT derives `status` from `NEW.workflow_stage` unconditionally (so a caller-supplied stage can never be
born divergent). `workflow-executor`'s `executeUpdateStatus` gains a table-conditional branch: for
`tasks` it writes `workflow_stage` from the P96 `STATUS_TO_STAGE` map (`pending→todo, in_progress,
review, completed→done, cancelled`) and lets the trigger set `status`; the 7 other entity types are
untouched. `tasks-create/index.ts:195` and `tasks.service.ts:140,650` stop hardcoding `status:'pending'`
and derive it from the stage map (belt and braces with the trigger). Migration name sorts after P100's:
`20260911000001_p102_task_insert_sync.sql`. The oracle CONSTRUCTS divergence (a `tasks-create` call with
`workflow_stage:'review'`, and a `workflow-executor`-shaped direct update) on a row it creates and deletes,
and asserts the pair agrees afterwards (RED at HEAD: `status=pending, stage=review`). Both functions are
deployed by the worker. The `engagement→engagements` / `commitment→commitments` map entries (research §6.1
side observation) are recorded in the summary and NOT changed. SETTLED.

---

## 4. Debt-tail decisions

### D-13 — `EDGECOPY-01` = repair the 5 + 2 functions, deploy them, and verify on a PRODUCED artifact

Replace `Due Date`/`تاريخ الاستحقاق` with `Deadline`/`الموعد النهائي` in `bot-notification-dispatcher`,
`contextual-suggestions`, `data-export`, `data-import`, `pdf-generate`; replace the NOW-relative copy in
`contextual-suggestions:605-618` and `relationship-health:226-227` with the shared-formatter vocabulary
(`T+N` mono form, both locales). Deploy all seven. Verification oracle: `POST
$SUPABASE_URL/functions/v1/pdf-generate/after-actions/905b6a3a-4c94-482f-9857-d268cc4d3ea5` with
`{language:'both'}` and the test user's JWT → 200; download the signed URL; `pdftotext` (or `strings`) the
PDF and assert `Deadline` present AND `الموعد النهائي` present (positive), with the retired term count
reported as a magnitude. RED at HEAD (retired term renders). Depends on D-09 (the ONS extension row) if
the generator reads it. `validation.json`'s `dueDateRequired` is repaired under D-17, not here. SETTLED.

### D-14 — `GUIDE-HOLLOW-01` = author 56 leaves and delegate `getTypeColors` to the canonical map

Seven types × `whenToUse, examples[≥2], commonLinks[≥2], notFor` × `en, ar` in `dossier.json`, mirroring
the EO body P98 authored. `getTypeColors` becomes `dossierTypeColors[type] ?? dossierTypeColors.country`.
Oracle: a node one-liner over both bundles asserting all 8 types carry 4 non-empty leaves with the array
lengths above (RED at HEAD: 1 of 8). The silent `t(key,'')` defaults stay (they are the render guard, and
P99's mask-removal did not touch them); the oracle proves content, not the guard. SETTLED.

### D-15 — `PARALLEL-TRUTH-01` = three re-points; the guide grid adopts the canonical order

`useDraftMigration.ts` → `[...DOSSIER_TYPES]`; `CommandPalette.tsx` → `[...DOSSIER_CARD_TYPES]`;
`DossierTypeGuide.tsx:403` → `DOSSIER_TYPES` (person moves from 3rd to 7th in the grid — accepted; a
local sort would be a fourth copy). One plan owns `DossierTypeGuide.tsx` for D-14 and D-15 together.
Oracle: `git grep -c` is a source grep and is NOT the criterion; the criterion is a vitest-free node
import check that each module's exported/used array is reference-equal or element-equal to the canonical
export (RED at HEAD: order differs). RULED.

### D-16 — `PREVIEW-HOLLOW-01` = delete the feature end to end

Route, hook, `preview-layouts` i18n namespace (both locales + `i18n/index.ts` registration), types, and a
drop migration `20260911000002_p102_drop_preview_layouts.sql` for the 3 tables, 3 enum types, 5 functions,
4 triggers and 8 policies from `20260115100001_entity_preview_layouts.sql` (+ the org-isolation policies
from `20260627000002`), in dependency order, applied to staging. "Finish" is rejected: no consumer, no
owner, a 12-row untouched seed. Oracle: catalog asserts the three relations and five functions are absent
AND a positive control relation (`dossiers`) present — an absence bounded by a named control, per D-02.
RULED (PD-10).

### D-17 — `COPY-09` = four namespace lanes over the top-15 namespaces, carve-outs enumerated BEFORE the pass

Lanes (en+ar pairs, ≤8 files each): (1) `dossier, common, assignments, dossiers`; (2) `committees,
empty-states, legislation, compliance`; (3) `user-management, working-groups, workflow-automation,
dashboard-widgets`; (4) `contacts, positions, advanced-search` + `validation.json` (`dueDateRequired` →
`Deadline is required` / `الموعد النهائي مطلوب`, lifting the P98 carve-out) + the two remaining hardcoded
literal sites (`HelpPage.tsx:166,168`, `useBriefingBooks.ts:156-165`) routed through `t()`. Carve-outs:
CLAUDE.md's three (UPPERCASE ribbons, mono labels, table-column headers) plus a proper-noun list the lane
writes FIRST into `102-COPY09-CARVEOUTS.md` (`Working Group`, `Intake Ticket`, `Elected Official`, country
and organisation names, …). Oracle per lane: research §12's instrument (reproduced as
`scripts/titlecase-census.mjs`, drilled with its four controls) reports per namespace `candidates ==
carve-out count` and `ar key set == en key set` (RED at HEAD: 268/231/…). The remaining ~2,341 candidates
outside the top 15 are a dated residue line in the closing register, not a silent drop. RULED (PD-09).

### D-18 — `ROUTE-ORPHAN-01` closes on a DISPOSITION RECORD, not on deletions

`102-ROUTE-DISPOSITIONS.md` records each of the 14 with research §15's class and the ruling: the 6
redirect shells KEEP (alias contract unknowable; deletion is a product act); the 7 data-rendering pages
KEEP with `EMPTY-ON-STAGING, reachable by URL` and the table each reads; `/geographic-visualization` KEEP
(has data); `/help/commitments` KEEP (static). No route file changes. Oracle: judge reads the record and
the 14 rows are each present with a class and a ruling. RULED (PD-05, conservative reading).

### D-19 — `ENGREAD-01` = render probe first; close NOT-REPRODUCED if the render matches the API

Research §5.2: both API paths return 200 with 5 rows. The plan authors a spec that visits `/engagements`
in both locales (settled render, locale asserted — P98's `98-copy04-voice` settle helper, never the
pre-law 95/96 ones) and asserts 5 list rows OR captures the error text. Per D-03 it is a `test:` oracle;
its command positive control is the API probe (both 200, `total==5`). If the render errors, the spec's
failure text names the cause and the row stays open with it — the plan does not pre-plan a repair for a
cause nobody can see. RULED (PD-11).

### D-20 — `CARRY-06` = today-relative seed re-anchoring + run-time `FROZEN_TIME`, with date labels masked

Option B (research §8.3). A `supabase/seed/` SQL (idempotent) re-anchors the `b0000002-*` engagement and
calendar fixture dates to `CURRENT_DATE`-relative offsets; the visual spec computes `FROZEN_TIME` as today
12:00Z and masks date-label regions (`mask:` option) so the snapshot is invariant to the calendar date.
Option A (a `p_now` parameter on two `SECURITY DEFINER` RPCs) is rejected: it puts a test-only path into
production RPCs that must then be proven inert. "Regenerate baselines" is not a fix (roadmap). Oracle:
`test:` per D-03; drillable control = the re-anchor SQL run twice, asserting all fixture dates fall in
`[CURRENT_DATE, CURRENT_DATE+14]` (RED at HEAD: 2026-07-03). RULED (PD-07).

### D-21 — `CARRY-07` = build once, then lower the budget to what the reduction actually achieved, never to `476` on faith

Research §7: the on-disk entry is 516.25 kB gzipped, OVER the 500 kB budget (the roadmap's 493.71 does
not reproduce). The plan: build at HEAD and record the number; move the growth out of the entry chunk
(lazy routes / manualChunks on app code, not vendor); rebuild; set `.size-limit.json` to the measured
value rounded UP to the next 4 kB. Oracle: `pnpm -C frontend size-limit` exit 0 AND the configured limit
< 500 kB (both literals rendered) — RED at HEAD (exit 1, over by 16.25 kB). If the reduction cannot get
below 500, the plan says so and the limit stays 500 with the measured number recorded. RULED (PD-12).

**Roadmap deviation, stated (F-13b):** criterion 4 says "back under the 476 KB budget". Measured reality is
516.25 kB, over the RAISED budget; this phase commits to `< 500 kB with the budget lowered to the measured
value`, and treats 476 as the target the plan reports distance from, not a pass condition. The overseer must
accept this in writing before the run, or the criterion stays open with the number recorded.

### D-22 — `CARRY-08` = three SUMMARY.md files citing research §9's per-task checks; `W4-E5` unified

22 DONE-UNSUMMARISED, 1 PARTIAL (`W4-E5`: IntakeForm and IntakeQuickForm use two submit keys — unify on
`actions.submitRequest`), 1 SUPERSEDED (`W2-B5` → PR #37). Oracle: the three files exist with the
`## Tasks` table carrying 8/10/7 rows and a verdict per row, plus the `W4-E5` unification proven by a
node check that both forms resolve the same key (RED at HEAD: two keys). SETTLED (PD-13).

---

## 5. Instrument repairs (`GATESTD-01..05`) — one plan, five fixes, each drilled on a fixture

### D-23 — The five gate-standard defects are repaired IN the shipped instruments, with fixtures that prove each direction

- `GATESTD-01`: `.planning/GATE-STANDARD.md:227` C9b escape line → the fail-closed `case` form
  (research §13). Oracle: the new line run on `QueryErrorState.test` prints `UNSAFE ID` and on `safe_id-1`
  prints `safe` (RED at HEAD: sed error, empty id).
- `GATESTD-02`: `scripts/config-step-artifacts.mjs` enumerates config-enabled artifact steps from
  `.planning/config.json` WITH polarity (`skip_*` inverted, non-booleans segregated) and reports per phase
  which expected artifacts exist; Phase 93's missing `93-VALIDATION.md` is answered by an explicit dated
  `93-VALIDATION-WAIVER.md` (no retroactive artifact — fabricating history is the class this milestone
  bans). Oracle: the script reports `enabled=8` and `P93 waiver=present` (RED at HEAD: no script).
- `GATESTD-03`: `scripts/decision-coverage.mjs` extraction AND coverage regexes accept `D-\d{2}[a-z]?`.
  Oracle: the §13 scratch fixture reports `total: 5` (RED at HEAD: 3).
- `GATESTD-04`: `GATE-STANDARD.md` C1 gains the third direction for PRESENCE-shaped criteria only, with
  the `WRONG-STATE NOT CONSTRUCTED: <why>` escape (PD-08). Oracle: judge, citing the diff hunk.
- `GATESTD-05`: `scripts/gate-drill.mjs` refuses to run when `GATE_DRILL_ACTIVE=1` is set (exit 4, named)
  and refuses a phase dir whose own `<automated>` blocks invoke `gate-drill.mjs` on that dir (exit 5).
  Oracle: a fixture dir with a self-referential gate exits 5 within 5 s (RED at HEAD: no guard — drilled
  with a 10 s timeout and a fixture whose "drill" is a stub echo, never the real recursion).
RULED (PD-08) / SETTLED for the rest.

---

## 6. Cross-cutting

### D-24 — Migrations sort after P100's highest and never assume P100 objects exist

`202609110000NN_p102_<slug>.sql`. Staging's `schema_migrations` max was `20260817005132` at research time;
P100's migrations are applied by the live run. Every P102 migration is idempotent, applied with `psql`
(P100 D-13), replayed once, and depends on nothing P100 creates. SETTLED.

### D-25 — Worker-executable vs human-gated acts

Executable by a worker: staging edge-function deploys (research §11.5 command, `DO_NOT_TRACK=1
SUPABASE_TELEMETRY_DISABLED=true`), staging migrations and seeds, the purge (D-04 sequencing), the PDF probe
(creates a storage object — accepted). Human-gated (`autonomous: false`): `git push`, PR/merge, GitHub-secret
or branch-protection changes, production droplet deploy. Tonight's plan set contains **no** obligation in
the second list — every row closes on staging + repo state — so no plan is human-gated unless the planner
finds one and says why. SETTLED.

### D-26 — Irreversible staging writes are exported first, and every oracle over live data emits magnitudes

The pre-purge export (research §17) runs before D-06/D-08; the DATA-02 delete set is exported by id list.
Oracles print counts (`kept=13 deleted=402 cascade=834`) and then judge them, so a wrong number is visible
in the log rather than only as an exit code. SETTLED.

### D-27 — One owner per contended file; the waves are a DAG, not intentions

`dossier.json` (en/ar) belongs to the COPY-09 lane-1 plan; D-14's 56 leaves are authored in THAT plan's
lane or in a plan that lane depends on — never two writers on one file in one wave. `DossierTypeGuide.tsx`
is owned by one plan (D-14+D-15). The four delegation functions are one plan (D-10+D-11). Ordering hazards
are `depends_on` edges: rename/seed pinned rows (D-08/D-09) BEFORE the purge; D-09 BEFORE D-13's PDF probe;
handler repoint BEFORE the seed oracle; instrument repairs (D-23) in wave 1 so later waves can use them.
SETTLED.

### D-28 — The phase directory is committed before the first engine wave, and no `102-NN-SUMMARY.md` exists before the run

Workers cannot read an untracked phase dir; a pre-existing summary marks its task `done` at compile. SETTLED.

### D-29 — Decision-coverage waiver for this context's heading form

`scripts/decision-coverage.mjs` requires a `<decisions>` block with `**D-NN:**` lines and reports
`skipped: true` on this file's `### D-NN —` headings (the same form Phases 100 and 101 use). Waived: the
manual census is 29 decisions, each cited by at least one plan's `Decisions covered - D-NN` truth, and the
plan check (§G) recorded exactly one such truth per plan. `102-01` (GATESTD-03) edits that script and may
teach it the heading form; it is not required to. SETTLED.
