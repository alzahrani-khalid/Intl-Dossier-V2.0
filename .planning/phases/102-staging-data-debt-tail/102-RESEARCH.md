# Phase 102 — RESEARCH: the measurements, each with the command that reproduces it

Taken 2026-09-10 against staging `zkrcjzdemdmwhearhfgg` from repo HEAD `3ec257adc` (branch
`milestone/v10.0-trust`). Written by the research seat spawned by `plan102 w0:pH0`
(`.tickmarkr/overseer/BRIEF-102-RESEARCH.md`). No subagents; no source edits; no DB writes; no
`tickmarkr compile`/`run`; no vitest/playwright. Every `psql` line assumes the standard preamble:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.env.test; set +a
```

Verified reachable: `psql "$SUPABASE_DB_URL" -Atc "select current_user"` → `postgres`.
Every path below is absolute or repo-relative from
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0`; one relative `.env.test` source
failed mid-session on cwd drift (`(eval):.:1: no such file or directory: .env.test`) — the
recorded lesson holds, and every oracle this phase writes must carry the absolute path.

**Two psql habits that produced silent partial output during this session, recorded so the
planner does not inherit them:** (1) `psql -c` with several `;`-separated statements printed only
the LAST result — every multi-statement probe below is a heredoc (`psql -Atq <<'SQL'`), never
`-c`; (2) `polcmd`/`enumlabel` concatenations need explicit `::text` casts or they error.

---

## §0 — Register-row → section map

The roadmap names 6 requirements; the register assigns 22 to this phase. Research covers 22.

| register row | roadmap criterion | § |
| ------------ | ----------------- | - |
| DATA-01 | 1 | §1 |
| DATA-02 | 2 | §2 |
| SEED-DELEG-01, DELEG-02 | — (register only) | §3 |
| P52FIXTURE-01 | — | §4 |
| ENGREAD-01 | — | §5 |
| WRITER-ROUTE-01, INSERT-SYNC-01 | — | §6 |
| CARRY-07 | 4 | §7 |
| CARRY-06 | 3 | §8 |
| CARRY-08 | 5 | §9 |
| GUIDE-HOLLOW-01 | — | §10 |
| EDGECOPY-01 | — | §11 |
| COPY-09 | — | §12 |
| GATESTD-01..05 | — | §13 |
| PREVIEW-HOLLOW-01 | — | §14 |
| ROUTE-ORPHAN-01 | — | §15 |
| PARALLEL-TRUTH-01 | — | §16 |

Cross-cutting (deploy / migration / irreversible data) is §17; non-reproducing numbers §18;
unknowables §19; proposed decisions §20.

---

## §1 — DATA-01: the fixture-account population

### §1.1 Counts

```bash
psql "$SUPABASE_DB_URL" -Atq <<'SQL'
select 'A auth_users_total=' || count(*) from auth.users;
select 'B example_com=' || count(*) from auth.users where email ilike '%@example.com';
select 'C gastat_test=' || count(*) from auth.users where email ilike '%@gastat.test';
select 'D test_pat=' || count(*) from auth.users where email ilike '%test%' and email not ilike '%@example.com' and email not ilike '%@gastat.test';
select 'E e2e_pat=' || count(*) from auth.users where email ilike '%e2e%' and email not ilike '%@example.com' and email not ilike '%@gastat.test';
select 'F fixture_pat=' || count(*) from auth.users where email ilike '%fixture%' and email not ilike '%@example.com' and email not ilike '%@gastat.test';
select 'G playwright_pat=' || count(*) from auth.users where email ilike '%playwright%' and email not ilike '%@example.com' and email not ilike '%@gastat.test';
select 'H non_fixture=' || count(*) from auth.users where email not ilike '%@example.com' and email not ilike '%@gastat.test';
select 'L example_test=' || count(*) from auth.users where email ilike '%@example.test';
select 'I public_users_total=' || count(*) from public.users;
select 'J public_users_example=' || count(*) from public.users where email ilike '%@example.com' or email ilike '%@gastat.test';
select 'K profiles_total=' || count(*) from public.profiles;
select 'DOMAINS ' || d || ' = ' || c from (select split_part(email,'@',2) d, count(*) c from auth.users group by 1) s order by c desc;
SQL
```

```
A auth_users_total=415
B example_com=338
C gastat_test=64
D test_pat=5
E e2e_pat=3
F fixture_pat=0
G playwright_pat=0
H non_fixture=13
L example_test=0
I public_users_total=415
J public_users_example=402
K profiles_total=415
DOMAINS example.com = 338
DOMAINS gastat.test = 64
DOMAINS stats.gov.sa = 6
DOMAINS e2e.test = 3
DOMAINS gastat.gov.sa = 1
DOMAINS gmail.com = 1
DOMAINS gastat-intake.local = 1
DOMAINS gstats.gov.sa = 1
```

**Population:** `338 + 64 = 402` fixture accounts by the two named suffixes; **415** is every row.
The roadmap's "~415 fixture accounts" is the whole table (already recorded as NOT reproduced in
`100-RESEARCH.md` §7; re-confirmed here). `auth.users`, `public.users` and `public.profiles` are
1:1 (415 each). **Outside this population:** the 13 non-fixture rows — enumerated below, not
assumed real — and any account whose email does not carry one of the two suffixes but was still
created by a test (D/E find 5 such: the three `@e2e.test` seed logins, `test.user@gmail.com`,
`test@gastat-intake.local`).

### §1.2 The 13 non-fixture accounts, every one named

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select 'ROLE ' || u.email || ' | public.users.role=' || coalesce(pu.role::text,'<none>') || ' | created=' || u.created_at::date || ' | last_sign_in=' || coalesce(u.last_sign_in_at::date::text,'never') from auth.users u left join public.users pu on pu.id=u.id where u.email not ilike '%@example.com' and u.email not ilike '%@gastat.test' order by u.created_at"
```

```
test.user@gmail.com        | viewer | 2025-09-26 | last_sign_in=2025-09-27
kazahrani@stats.gov.sa     | admin  | 2025-09-26 | last_sign_in=2026-09-10
admin@gastat.gov.sa        | viewer | 2025-09-27 | never
test@gastat-intake.local   | viewer | 2025-09-30 | 2025-09-30
mfmuhanna@gstats.gov.sa    | viewer | 2026-01-15 | 2026-01-15
jfafnan@stats.gov.sa       | viewer | 2026-01-25 | 2026-02-04
akhorayef@stats.gov.sa     | viewer | 2026-01-26 | 2026-01-26
hmghulaiga@stats.gov.sa    | viewer | 2026-01-26 | 2026-01-26
aabalobaid@stats.gov.sa    | viewer | 2026-01-28 | 2026-02-05
ashaibani@stats.gov.sa     | viewer | 2026-02-05 | 2026-02-05
analyst@e2e.test           | viewer | 2026-04-08 | 2026-06-27
intake@e2e.test            | viewer | 2026-04-08 | 2026-08-14
admin@e2e.test             | viewer | 2026-04-08 | 2026-08-14
```

Both accounts the brief asked about are present: **`kazahrani@stats.gov.sa`** (the only `admin`;
it is `TEST_USER_EMAIL` in `.env.test` and signed in today) and **`test.user@gmail.com`** (viewer,
last sign-in 2025-09-27). Note `admin@e2e.test` carries `public.users.role=viewer`, not `admin` —
the v4.0 Phase-17 UAT claimed `admin@e2e.test→admin`; that claim does not hold on staging today.

All 402 fixture rows are `role=viewer`:

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select 'FIXROLE ' || r || ' = ' || c from (select coalesce(pu.role::text,'<none>') r, count(*) c from auth.users u left join public.users pu on pu.id=u.id where u.email ilike '%@example.com' or u.email ilike '%@gastat.test' group by 1) s"
```

```
FIXROLE viewer = 402
```

Creation dates cluster on test-run days (`2025-10-18`=120, `2026-03-07`=119, `2026-03-06`=53,
`2025-10-17`=42, `2026-08-12`=22, `2026-03-14`=22, `2026-01-13`=22); first six by creation:
`moutester@example.com`, `test@example.com`, `task-test-user-0-1760727916602@example.com`, … —
epoch-suffixed names, i.e. `auth.admin.createUser` from backend contract/integration tests.

### §1.3 Which of these the repo REFERENCES (must not be purged)

```bash
git grep -n "example.com\|gastat.test" -- tests frontend/tests .github .env.test.example 'playwright*.ts' 'frontend/playwright*.ts' | cut -d: -f1 | sort | uniq -c | sort -rn
grep -E "^(TEST_USER_EMAIL|E2E_ADMIN_EMAIL|E2E_ANALYST_EMAIL|E2E_INTAKE_EMAIL)=" /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.env.test
git grep -n "E2E_ADMIN_EMAIL\|E2E_ANALYST_EMAIL\|E2E_INTAKE_EMAIL" -- tests frontend/tests .github scripts
```

- 35 files mention `example.com`/`gastat.test`; **every one is a unit/contract/perf test that
  constructs the email inline** (e.g. `tests/unit/components/MFASetup.test.tsx` ×12,
  `tests/security/auth-edge-cases.test.ts` ×7) or `.env.test.example` placeholders
  (`your-test-email@example.com`, `e2e-admin@example.com`, …). **No tracked file logs in with a
  stored `@example.com`/`@gastat.test` account.**
- `.env.test` (gitignored) sets only `TEST_USER_EMAIL="kazahrani@stats.gov.sa"`; the
  `E2E_*_EMAIL` variables are NOT set locally. They are GitHub secrets consumed by
  `.github/workflows/ci.yml:244,300,340,387` and `e2e.yml:21-25,67,102`, and by
  `tests/e2e/01-login.spec.ts:6`. The values are not readable from here (§19); the v4.0 record
  (`.planning/milestones/v4.0-ROADMAP.md:179`) names them as `admin@e2e.test`, `analyst@e2e.test`,
  `intake@e2e.test`, and those three exist on staging with last sign-ins on 2026-08-14 (CI runs).
- **Exclusion list, derived:** `kazahrani@stats.gov.sa` (local `TEST_USER_EMAIL`, globalSetup
  login `frontend/tests/e2e/global-setup.ts:33-48`), `admin@e2e.test`, `analyst@e2e.test`,
  `intake@e2e.test` (CI logins). None of the four carries a purge suffix, so a suffix-scoped purge
  cannot touch them by construction — but the purge oracle must still assert their presence
  after the run (positive state, not absence).

### §1.4 Where the suite CREATES accounts, and whether it deletes them

```bash
git grep -n "auth.admin.createUser\|\.signUp(" -- tests frontend/tests backend/tests scripts supabase | cut -d: -f1 | sort | uniq -c | sort -rn
git grep -n "auth.admin.createUser\|\.signUp(" -- tests/e2e frontend/tests/e2e     # → (empty)
for f in backend/tests/integration/{leave-reassignment,priority-based-assignment,queue-processing,skill-based-assignment,sla-escalation,wip-limit-enforcement}.test.ts; do echo "$f: createUser=$(grep -c 'admin.createUser' $f) deleteUser=$(grep -c 'admin.deleteUser' $f) afterAll=$(grep -c 'afterAll' $f)"; done
grep -n "afterAll\|afterEach\|delete(\|Date.now\|@" frontend/tests/e2e/user-management.spec.ts
```

- 30 files call `createUser`/`signUp`; **zero are under `tests/e2e` or `frontend/tests/e2e`**.
  The creators are `backend/tests/{contract,integration}/*` (vitest, `@gastat.test` and
  `@example.com` epoch-suffixed) plus `tests/contract/*` and `tests/security/org-isolation.test.ts`.
- The six `@gastat.test` integration files each pair `createUser` with `deleteUser` in `afterAll`
  (counts match 3/3, 1/1, 1/1, 2/2, 2/2, 2/2) — **they do clean up when they reach `afterAll`**;
  the 402 residue is what a crashed/killed run leaves (the date clusters are single days).
- The one Playwright spec that creates an account, `frontend/tests/e2e/user-management.spec.ts:30-31`,
  creates `e2e-${Date.now()}@example.test` via the `create-user` edge function and has **no
  `afterAll`/`afterEach`/`delete`**. Staging holds **0** `@example.test` rows today (L above), so
  that spec has not run to that step against staging recently — but it is the E2E-suite creator
  criterion 1's second clause ("the E2E suite deletes the accounts it creates") must bind, and its
  suffix (`example.test`) is NOT one of the two the purge names. Add it to the purge suffix set or
  to the spec's teardown; the population must be stated either way.

### §1.5 How `/users` is populated

`frontend/src/routes/_protected/users/index.tsx` → `@/pages/users/UsersPage` →
`frontend/src/pages/users/UsersListPage.tsx:100-106`:

```ts
supabase.from('users')
  .select('id, email, username, full_name, name_en, name_ar, role, is_active, mfa_enabled, last_login_at, department, avatar_url', { count: 'exact' })
  .is('deleted_by', null)
  .order('created_at', { ascending: false })
```

Direct PostgREST read of **`public.users`** (not `auth.users`, no RPC, no edge function), gated
by `requireAdmin` at the parent route. RLS on `public.users` (`relrowsecurity=true`):

```
users_select_active_authenticated  SELECT  using=((auth.role() = 'authenticated') AND (is_active = true))
users_select_self                  SELECT  using=(auth.uid() = id)
users_select_service_role          SELECT  using=(auth.role() = 'service_role')
users_update_self / users_update_service_role / users_delete_service_role / users_insert_trigger_or_service_role
```

So every authenticated user sees every `is_active=true` row. Today `PU_DELETED_BY_NOTNULL=0`,
`PU_INACTIVE=0`, and **`PU_FIXTURE_VISIBLE_ON_LIST=402`** — all 402 fixtures render on `/users`.
`public.users` rows are created by `on_auth_user_created → handle_new_user()` (AFTER INSERT on
`auth.users`), profiles by `on_auth_user_created_profile`, and `trigger_create_mou_notification_preferences`
fans out one `mou_notification_preferences` row per user — which is why that table holds 402
fixture rows (§1.6).

### §1.6 FK fan-out — what a purge of `auth.users` would hit

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select 'FK_SUMMARY ' || d || ' = ' || c from (select case f.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE' when 'n' then 'SET NULL' end d, count(*) c from pg_constraint f join pg_class rc on rc.oid=f.confrelid join pg_namespace rn on rn.oid=rc.relnamespace where f.contype='f' and rn.nspname='auth' and rc.relname='users' group by 1) s order by c desc"
```

```
FK_SUMMARY NO ACTION = 183
FK_SUMMARY SET NULL = 90
FK_SUMMARY CASCADE = 83
FK_SUMMARY RESTRICT = 10
```

366 FKs reference `auth.users(id)`; **193 would BLOCK a delete** (NO ACTION + RESTRICT). The
question is whether any of those 193 columns holds a fixture id. Generated census (the SQL is
built from `pg_constraint` so the set is derived, not typed):

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select string_agg(format('select %L as fk, count(*) as n from %I.%I where %I in (select id from auth.users where email ilike ''%%@example.com'' or email ilike ''%%@gastat.test'')', n.nspname||'.'||c.relname||'.'||a.attname, n.nspname, c.relname, a.attname), ' union all ') from pg_constraint f join pg_class c on c.oid=f.conrelid join pg_namespace n on n.oid=c.relnamespace join pg_class rc on rc.oid=f.confrelid join pg_namespace rn on rn.oid=rc.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum = any(f.conkey) where f.contype='f' and rn.nspname='auth' and rc.relname='users' and f.confdeltype in ('a','r')" > "$S/fkcensus.sql"
psql "$SUPABASE_DB_URL" -Atq -c "select 'BLOCKING_FK_TOTAL_CONSTRAINTS=' || count(*) from ($(cat "$S/fkcensus.sql")) z"
psql "$SUPABASE_DB_URL" -Atq -c "select 'BLOCKING_FK_WITH_ROWS=' || count(*) from ($(cat "$S/fkcensus.sql")) z where n>0"
```

```
BLOCKING_FK_TOTAL_CONSTRAINTS=193
BLOCKING_FK_WITH_ROWS=0
```

**Control** (same generated census with the id set swapped to `kazahrani@stats.gov.sa`) returns
`dossiers.created_by = 92`, `dossiers.updated_by = 75`, `work_item_dossiers.created_by = 31`, … —
so the instrument sees rows when they exist; the zero for fixtures is a measurement. The only
tables that reference fixture ids at all are CASCADE children:

```
ALLFK_FIXTURE_ROWS public.profiles.user_id = 402
ALLFK_FIXTURE_ROWS public.users.id = 402
ALLFK_FIXTURE_ROWS public.mou_notification_preferences.user_id = 402
ALLFK_FIXTURE_ROWS public.user_notification_preferences.user_id = 22
ALLFK_FIXTURE_ROWS public.staff_profiles.user_id = 4
ALLFK_FIXTURE_ROWS public.user_roles.user_id = 2
```

**Consequence:** `DELETE FROM auth.users WHERE email ILIKE '%@example.com' OR email ILIKE
'%@gastat.test'` would succeed today with no FK error and cascade exactly those six tables
(402+402+402+22+4+2 child rows). **Outside this census:** `storage.objects.owner` (schema
`storage`, not in the `auth`-referencing FK set because it has no FK), and any column that holds
a user id without a declared FK — neither was swept. The purge oracle should re-run the blocking
census at execution time rather than trust this zero, because backend tests may run in between.

### §1.7 Mechanism options (evidence, not a choice — §20 PD-06)

- `auth.admin.deleteUser(id)` per row via the service-role key (what the tests themselves use;
  GoTrue removes `auth.identities/sessions/…` and the public-schema CASCADEs fire) — 402 calls.
- One SQL `DELETE` as `postgres` through `SUPABASE_DB_URL` — one statement, but bypasses GoTrue.
- A pre-purge export is mandatory either way (§17): the deleted rows are not recoverable.

---

## §2 — DATA-02: internal-artifact names on staging

### §2.1 The four named strings — table and row for each

Search space: EVERY `text`/`varchar` column of every base table in `public` (not only title-like
columns — see the blind spot below). Command shape, run once per string:

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select string_agg(format('select %L as t, %L as col, count(*) as n from public.%I where %I ilike %L', c.table_name, c.column_name, c.table_name, c.column_name, '%<STRING>%'), ' union all ') from information_schema.columns c join pg_class k on k.relname=c.table_name join pg_namespace n on n.oid=k.relnamespace and n.nspname=c.table_schema where c.table_schema='public' and k.relkind='r' and c.data_type in ('text','character varying')" > "$S/named.sql"
psql "$SUPABASE_DB_URL" -Atq -c "select t || '.' || col || ' = ' || n from ($(cat "$S/named.sql")) z where n>0"
```

| string | rows holding it |
| ------ | --------------- |
| `Phase 70 staging verification digest` | `intelligence_digest.summary` = 1 (id `2e08895a-626a-4ea1-bb89-6164e4852890`, generated 2026-06-15) |
| `Phase 52 Kanban Fixture Engagement` | `dossiers.name_en` = 1 (id `00000000-0000-0052-0000-000000000001`) **+ `rag_chunks.content` = 1** |
| `E2E MoU 1783364705954` | `mous.title` = 1 (id `a054c7c4-ea2d-4b2e-add6-f6044bc910f2`, created 2026-07-06) **+ `mou_notification_queue.title_en` = 1 + `.message_en` = 1** |
| `UAT round-11 commitment` | `aa_commitments.title` = 1 (id `18ecff8e-ee08-4b5e-9284-353c51373b86`, status `overdue`) |

**Blind spot demonstrated, not theorised:** the brief's suggested column list
(`title,name,title_en,name_en,subject,description,description_en`) misses the FIRST named string
outright — `intelligence_digest.summary` is not in it — and misses the two derived copies
(`rag_chunks.content`, `mou_notification_queue.*`). A repair that deletes the four "visible"
rows and leaves `rag_chunks`/`mou_notification_queue` leaves the names reachable through
retrieval and notification surfaces. The class instrument must sweep all text columns.

### §2.2 The CLASS sweep (title-like columns, 215 of them)

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select string_agg(format('select %L as t, %L as col, count(*) as n from public.%I where %I ~* %L', c.table_name, c.column_name, c.table_name, c.column_name, 'Phase \d+|E2E|UAT|fixture|staging verification|\yseed\y|\ytest\y'), ' union all ') from information_schema.columns c join pg_class k on k.relname=c.table_name join pg_namespace n on n.oid=k.relnamespace and n.nspname=c.table_schema where c.table_schema='public' and k.relkind='r' and c.column_name in ('title','name','title_en','name_en','subject','description','description_en') and c.data_type in ('text','character varying')" > "$S/sweep.sql"
psql "$SUPABASE_DB_URL" -Atq -c "select 'SWEEP ' || t || '.' || col || ' = ' || n from ($(cat "$S/sweep.sql")) z where n>0 order by n desc"
```

```
SWEEP dossiers.name_en = 88
SWEEP dossiers.description_en = 19
SWEEP calendar_entries.title_en = 3
SWEEP tasks.title = 2
SWEEP aa_commitments.title = 2
SWEEP aa_commitments.description = 2
SWEEP calendar_entries.description_en = 1
SWEEP mous.title = 1
SWEEP organizational_units.name_en = 1
SWEEP positions.title_en = 1
SWEEP mou_notification_queue.title_en = 1
SWEEP_TABLES_WITH_HITS=8 rows=121
```

Per pattern (same columns): `Phase \d+`=16, `E2E`=72, `UAT`=3, `fixture`=20,
`staging verification`=0, `\yseed\y`=5, `\ytest\y`=38 (overlapping; `\ytest\y` is the noisy
term — it also matches the deliberately seeded "Test Person A — Senior Diplomat" family).

### §2.3 Every dossier row the sweep hits (88), grouped

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select 'D ' || id || ' | ' || type || ' | ' || coalesce(status::text,'') || ' | ' || left(name_en,80) from dossiers where name_en ~* 'Phase \d+|E2E|UAT|fixture|staging verification|\yseed\y|\ytest\y' order by type, name_en"
```

| group | count | example | pinned by a shipped spec/seed? |
| ----- | ----- | ------- | ------------------------------ |
| `e2e-97-01-elected-official-<epoch>` persons | **68** (all created 2026-08-17; `persons` extension row exists for all 68) | `559459c5-…` | `tests/e2e/97-elected-officials-reachable.spec.ts` creates them by NAME PREFIX (no id pin); spec has `afterAll=0 afterEach=0 delete=0` — **it never cleans up** |
| `Test Person A–J — <role>` | 10 (`a0000000-0000-0000-0000-0000000005NN`) | seeded, `is_seed_data` | `frontend/tests/fixtures/dossier-fixtures.ts`, `scripts/probe-commitment-readback.mjs` — **id-pinned** |
| `Test Working Group A–F` | 6 (`a0000000-…-04NN`) | seeded | `frontend/tests/fixtures/dossier-fixtures.ts` — **id-pinned** |
| `Phase 63 graph verification topic` / `…second-degree verification forum` | 2 (`f63d0900-…-01/02`) | | **no tracked reference** (`git grep f63d0900` → none) |
| `Phase 52 Kanban Fixture Engagement` | 1 | `00000000-0000-0052-…` | 5 specs + `.env.test.example` — **id-pinned** (§4) |
| `Test ONS Contact — Intl Relations Director` | 1 | `87e23aad-…` | not searched by id; name suggests the ONS slice seed |

Totals by type on staging: person **84** (79 of them sweep hits → **5 real persons**),
working_group 6 (all 6 hits), engagement 5, country 5, organization 5, forum 5, topic 2.
`is_seed_data=true` on 19 dossiers; 69 of the 88 hits are NOT flagged (the 68 e2e-97 persons and
the ONS contact). Non-dossier hits: `tasks` ×2 (`API E2E task post-fix`, `E2E UAE task 133333`),
`aa_commitments` ×2 (`Test commitment for China partnership` = `b0000003-…` pinned by
`supabase/seed/060-dashboard-demo.sql`; `UAT round-11 commitment`), `calendar_entries` ×3
(`SRTL-02 regression seed A/B/C` — pinned by NAME in `frontend/tests/e2e/calendar-rtl.spec.ts`),
`positions` ×1 (`Audience Test Position`), `organizational_units` ×1 (`Test WIP Unit`),
`mous` ×1 (pinned by NAME prefix in `frontend/tests/e2e/mou-create.spec.ts`, which also has no
teardown).

**Two acts, not one:** deleting unreferenced residue (e2e-97 persons, Phase 63 rows, the digest,
the UAT commitment, the two E2E tasks) vs. deleting/renaming a row a spec pins by id or name
(P52, the `a0000000` seed family, the SRTL-02 calendar rows, `b0000003`). The second act changes
suites; criterion 2 says "removed OR replaced with plausible diplomatic data", and for pinned
rows RENAME is the act that keeps the pin. **Outside this sweep:** `_ar` columns (Arabic names of
the same rows), `metadata`/`jsonb` columns, `rag_chunks.content` and other derived-text tables —
§2.1 shows they carry copies.

---

## §3 — SEED-DELEG-01 + DELEG-02: which relation `my-delegations` should read

### §3.1 Rows, columns, constraints, RLS (re-derived)

```
PD_ROWS=0 POSD_ROWS=0
```

`permission_delegations` (14 cols): `id uuid NN gen_random_uuid() · grantor_id uuid NN ·
grantee_id uuid NN · resource_type varchar NN · resource_id uuid · permissions ARRAY NN ·
reason text NN · valid_from timestamptz NN · valid_until timestamptz NN · revoked bool def false ·
revoked_at timestamptz · revoked_by uuid · created_at/updated_at def now()`.
CHECKs: `check_not_self_delegation (grantor_id <> grantee_id)`,
`check_resource_consistency (resource_type='all' AND resource_id IS NULL) OR resource_type<>'all'`,
`check_revocation` (revoked ⇔ revoked_at+revoked_by set), `check_valid_period (valid_until > valid_from)`,
`resource_type IN ('dossier','mou','all')`. FKs: grantor/grantee → `auth.users` ON DELETE CASCADE;
`revoked_by` → `auth.users` NO ACTION. RLS on; policies (`roles=public`): SELECT
`auth.uid() IN (grantor_id, grantee_id)`, INSERT check `auth.uid()=grantor_id`, UPDATE
`auth.uid()=grantor_id`. Grants: `anon` AND `authenticated` hold full DML (INSERT/SELECT/UPDATE/
DELETE/TRUNCATE/REFERENCES/TRIGGER) — the `anon` grant is a P100-class observation, recorded not
owned.

`position_delegations` (8 cols): `id · position_id uuid NN → positions(id) CASCADE ·
delegator_id/delegate_id uuid NN → auth.users NO ACTION · reason text · expires_at timestamptz ·
status text NN def 'active' · created_at NN`. No CHECK on `status`. RLS on; policies
(`roles=authenticated`): SELECT `delegator_id=auth.uid() OR delegate_id=auth.uid()`, INSERT
check `delegator_id=auth.uid()`; **no UPDATE/DELETE policy**. `positions` holds 7 rows.

### §3.2 The handler's select, verbatim (`supabase/functions/my-delegations/index.ts:129-148`)

```ts
let grantedQuery = supabaseAdmin
  .from("delegations")
  .select(`
    id, grantor_id, grantee_id, source, resource_type, resource_id, reason, is_active,
    valid_from, valid_until, revoked_at, revoked_by, created_at,
    grantor:auth.users!grantor_id(email),
    grantee:auth.users!grantee_id(email)
  `)
  .eq("grantor_id", user.id);
// receivedQuery identical with .eq("grantee_id", user.id)   (:150-169)
if (activeOnly) { grantedQuery = grantedQuery.eq("is_active", true); … }   (:172-175)
// expiring filter .lte("valid_until", …) (:178-186); .order("valid_until") (:189-190)
```

Error path (`:196-215`, Phase 93's visibility fix): on PostgREST error → **500**
`{"error":{"code":"QUERY_FAILED","message_en":"Failed to load delegations","message_ar":"فشل في تحميل التفويضات"}}`.

### §3.3 Deployed state (live probe with the test user's JWT)

```bash
TOK=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).access_token))')
curl -s -w "HTTP=%{http_code}\n" "$SUPABASE_URL/functions/v1/my-delegations" -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TOK"
```

```
{"error":{"code":"QUERY_FAILED","message_en":"Failed to load delegations","message_ar":"فشل في تحميل التفويضات"}}HTTP=500
```

Same with `?active_only=false`. The deployed function is the Phase-93 body (visible error), as
the register predicts. **Outside this probe:** the function version number (`supabase functions
list` is unauthenticated here); the body match is inferred from the exact envelope.

### §3.4 What the UI needs per card

`frontend/src/pages/delegations/DelegationManagementPage.tsx` → `useMyDelegations` /
`useDelegationsExpiringSoon` (`@/hooks/useDelegation`) → `frontend/src/services/user-management-api.ts`
`interface Delegation` (`:220-237`): `id, grantor_id, grantor_email, grantee_id, grantee_email,
source, resource_type, resource_id, reason, is_active, valid_from, valid_until, revoked_at,
revoked_by, expires_in_days, created_at`.
`frontend/src/components/delegation/DelegationCard.tsx` reads: `grantee_email, grantor_email, id,
reason ×2, resource_id, resource_type ×3, revoked_at ×3, valid_from, valid_until`.

**Column fit (card fields → table):**

| card field | `permission_delegations` | `position_delegations` |
| ---------- | ------------------------ | ---------------------- |
| grantor/grantee (+email embed) | `grantor_id`/`grantee_id` | `delegator_id`/`delegate_id` (rename) |
| resource_type / resource_id | present (`dossier`/`mou`/`all`) | **absent** (only `position_id`) |
| reason | present (NN) | present |
| valid_from / valid_until | present (NN) | `expires_at` only, no start |
| revoked_at (+revoked_by) | present | **absent** (`status` text) |
| is_active | derive `NOT revoked AND now() BETWEEN valid_from AND valid_until` | derive `status='active'` |
| source | absent on both — drop or constant | absent |

### §3.5 Who else already reads/writes each table

```bash
git grep -n "permission_delegations\|position_delegations\|from(\"delegations\")\|from('delegations')" -- supabase/functions frontend/src backend/src
```

- `permission_delegations`: `backend/src/services/permission-delegation.service.ts` (10 call
  sites), `backend/src/models/permission-delegation.model.ts:41`, and
  **`supabase/functions/access-requests/index.ts:299` INSERTs into it**.
- `position_delegations`: **no reader or writer anywhere in the repo** (types only).
- The nonexistent `delegations`: `my-delegations` (2), **`delegate-permissions/index.ts:253,277`**,
  **`revoke-delegation/index.ts:129,187`**, **`deactivate-user/index.ts:164`** — four functions
  share the phantom relation; DELEG-02 as filed names only `my-delegations`.

**Proposal (PD-01, RECOMMEND):** repoint to `permission_delegations`. Evidence: 11 of 12 card/
type fields map by name or trivial derivation; `access-requests` already writes it; the frontend
`DelegatePermissionsRequest` (`user-management-api.ts:165-170`) carries `grantee_id, resource_type,
resource_id, valid_from, valid_until` — the permission-grant shape, not a position stand-in;
`position_delegations` has no readers, no start date, no resource, no revocation audit. The
repoint should cover all four functions on `delegations`, or state why three are left.

---

## §4 — P52FIXTURE-01: the fixture engagement without an extension row

```
P52_DOSSIER 00000000-0000-0052-0000-000000000001 type=engagement status=active is_active=true seed=true created=2026-05-16
P52_ED_ROW=0
```

(`engagement_dossiers` has no other column that could hold the id: `P52_ED_BY_DOSSIER_COL=0`
over the whole row as jsonb.) A **second** engagement dossier also has no extension row:

```
ENG_WITHOUT_EXT 7c0d830b-5dc7-4419-a0ad-ce550031712d | Bilateral engagement with ONS — census methodology exchange
ENG_WITHOUT_EXT 00000000-0000-0052-0000-000000000001 | Phase 52 Kanban Fixture Engagement
```

`dossiers WHERE type='engagement'` = **5**; `engagement_dossiers` = **3** (the ENGREAD-01 pair
reproduces). The ONS one is also the `engagement_id` of the ONLY `after_action_records` row
(§11.4) — a seed INSERT there would unblock the pdf-generate verification path as well.

### §4.1 What a seed INSERT must supply (`engagement_dossiers`)

NOT NULL without default: `id` (FK → `dossiers(id)` CASCADE), `engagement_type`,
`engagement_category`, `start_date`, `end_date`. Defaults: `timezone='Asia/Riyadh'`,
`is_virtual=false`, `engagement_status='planned'`, `lifecycle_stage='intake'`, `created_at/updated_at=now()`.
CHECKs: `engagement_type IN (bilateral_meeting, mission, delegation, summit, working_group,
roundtable, official_visit, consultation, forum_session, other)`; `engagement_category IN
(diplomatic, statistical, technical, economic, cultural, educational, research, other)`;
`engagement_status IN (planned, confirmed, in_progress, completed, postponed, cancelled)`;
`lifecycle_stage IN (intake, preparation, briefing, execution, follow_up, closed)`;
`delegation_level IN (head_of_state, ministerial, senior_official, director, expert, technical)`
(nullable). FKs: `host_country_id`, `host_organization_id`, `parent_forum_id` → `dossiers` SET NULL.

Minimal legal row (values are the planner's choice):

```sql
insert into public.engagement_dossiers (id, engagement_type, engagement_category, start_date, end_date)
values ('00000000-0000-0052-0000-000000000001', 'bilateral_meeting', 'diplomatic', <start>, <end>);
```

### §4.2 Who pins the id

```
PIN [0000-0052]: .env.test.example (PHASE_52_FIXTURE_ENGAGEMENT_ID) frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts tasks-tab-a11y.spec.ts tasks-tab-dnd.spec.ts tasks-tab-keyboard.spec.ts tasks-tab-visual.spec.ts
```

Five specs plus the env template. The row's **name** is DATA-02's second named string; the
**id** is load-bearing. Rename + seed extension row = both rows closed on one row (PD-02).

---

## §5 — ENGREAD-01: `/engagements` read path, reproduced

### §5.1 The two read paths (`frontend/src/hooks/useEngagementsInfinite.ts`)

- `type === undefined` (default list) → `engagementsRepo.getEngagements()` →
  `frontend/src/domains/engagements/repositories/engagements.repository.ts:56-71` →
  `apiGet('/engagement-dossiers?page=&limit=')` → edge function `engagement-dossiers`.
- `type` set → `supabase.rpc('search_engagements_advanced', {p_search_term, p_engagement_types,
  p_limit, p_offset})` (`:152-157`); the count uses the same RPC with `{count:'exact', head:true}`
  and OMITS null args (`:90-107`, with a comment explaining the `malformed array literal: "null"`
  400 that `head:true` GET serialisation used to cause).

### §5.2 Live probes (test-user JWT), both paths

```bash
curl -s -o eng.body -w "HTTP=%{http_code}\n" "$SUPABASE_URL/functions/v1/engagement-dossiers?page=1&limit=20" -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TOK"
curl -s -o rpc.body -w "HTTP=%{http_code}\n" -X POST "$SUPABASE_URL/rest/v1/rpc/search_engagements_advanced" -H "apikey: …" -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" -d '{"p_limit":20,"p_offset":0}'
curl -s -I "$SUPABASE_URL/rest/v1/rpc/search_engagements_advanced?p_limit=1000&p_offset=0" -H "apikey: …" -H "Authorization: Bearer $TOK" -H "Prefer: count=exact" | grep -i "^HTTP\|content-range"
curl -s -o rpc2.body -w "HTTP=%{http_code}\n" "$SUPABASE_URL/rest/v1/rpc/search_engagements_advanced?p_limit=20&p_offset=0&p_engagement_types=%7Bbilateral_meeting,consultation%7D" -H …
```

```
HTTP=200   ENG_BODY_ROWS=5 {"page":1,"limit":20,"total":5,"totalPages":1,"has_more":false}
HTTP=200   RPC_BODY_ROWS=5
HTTP/2 200  content-range: 0-4/5
HTTP=200   [{"id":"b0000002-0000-0000-0000-000000000001","name_en":"Bilateral consultation — ESCWA",…
```

**The error does NOT reproduce today from the API.** Both paths return 200 with all 5 engagement
dossiers (the RPC is dossier-first since migration `p96_extension_first_rpcs`, applied on staging
as version `20260817004714`; the two extension-less rows come back with `name_en` from
`dossiers`). Timeline: that migration commit `2ae3cfe18` is dated 2026-08-17 03:49 +0300; the
ENGREAD-01 row was committed to `REQUIREMENTS.md` on 2026-08-18 10:27 +0300 recording a
2026-08-17 observation. Either the observation predates the migration's application to staging,
or the failure is in the RENDER layer, not the request (e.g. `toListItem` on a row shape, or the
`useEngagementsInfinite` count path under a browser session). **Outside this probe:** a browser
render — not performed (the brief allows no Playwright, and no browser was driven). The planner
should make the FIRST task a render probe of `/engagements` (both locales) and close the row as
NOT-REPRODUCED-AT-API with a render verdict, rather than plan a repair for a cause nobody can
currently see. `search_engagements_advanced` is `secdef=false` (RLS applies as the caller).

---

## §6 — WRITER-ROUTE-01 + INSERT-SYNC-01: the task status↔stage seam

### §6.1 The three sites, verbatim at HEAD

`supabase/functions/workflow-executor/index.ts:99-109` (entity map) and `:540-557`:

```ts
function getTableName(entityType: WorkflowEntityType): string {
  const mapping: Record<WorkflowEntityType, string> = {
    intake_ticket: 'intake_tickets', engagement: 'engagements', commitment: 'commitments',
    task: 'tasks', dossier: 'dossiers', position: 'positions', document: 'documents',
    calendar_entry: 'calendar_entries',
  };
  return mapping[entityType];
}
async function executeUpdateStatus(context, config) {
  const { supabase, execution } = context;
  const newStatus = config.status as string;
  const tableName = getTableName(execution.entity_type);
  const { error } = await supabase
    .from(tableName)
    .update({ status: newStatus, updated_at: new Date().toISOString() })   // :550
    .eq('id', execution.entity_id);
```

Side observation (not this row's): the map sends `engagement` to the **legacy** `engagements`
table (5 rows, 6 columns, not the `engagement_dossiers` extension) and `commitment` to
`commitments`, not `aa_commitments` (the work-item commitments table per project memory).

`supabase/functions/tasks-create/index.ts:195-196`:

```ts
      workflow_stage: body.workflow_stage || 'todo',
      status: 'pending',
```

`backend/src/services/tasks.service.ts:140-141` (register says `:127` — drifted by 13 lines):

```ts
      workflow_stage: input.workflow_stage || 'todo',
      status: 'pending',
```

A **third** INSERT path in the same file, `tasks.service.ts:650-652` (commitment → task), writes
`status:'pending', workflow_stage:'todo'` — consistent by construction, but it is another site the
INSERT-time fix must not miss. The routed map the update path uses (`:87-93`):

```ts
const STATUS_TO_STAGE = { pending:'todo', in_progress:'in_progress', review:'review', completed:'done', cancelled:'cancelled' }
```

### §6.2 Triggers on `tasks`, and the sync function body

```
audit_tasks              AFTER INSERT OR DELETE OR UPDATE … audit_trigger_function()
set_task_sla_deadline    BEFORE INSERT … calculate_task_sla_deadline()      (touches neither status nor workflow_stage — checked on prosrc)
trg_sync_task_status     BEFORE UPDATE … sync_task_status_from_workflow_stage()
update_tasks_updated_at  BEFORE UPDATE … update_updated_at_column()
```

`sync_task_status_from_workflow_stage()`: `IF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage
THEN CASE NEW.workflow_stage WHEN 'todo' → 'pending' | 'in_progress' → 'in_progress' | 'review' →
'review' | 'done' → 'completed' (+ completed_at := NOW() if null) | 'cancelled' → 'cancelled' ELSE
no change END`. **UPDATE only; no INSERT trigger** — INSERT-SYNC-01 reproduces structurally.
`tasks.status` is enum `task_status (pending,in_progress,review,completed,cancelled)`;
`workflow_stage` is `text` with no CHECK.

### §6.3 Live divergence with that map

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select 'DIVERGENT_ROWS=' || count(*) from tasks where not ((status='pending' and workflow_stage='todo') or (status='in_progress' and workflow_stage='in_progress') or (status='review' and workflow_stage='review') or (status='completed' and workflow_stage='done') or (status='cancelled' and workflow_stage='cancelled'))"
```

```
DIVERGENT_ROWS=0      (TASKS_TOTAL=9: completed/done=3, in_progress/in_progress=6)
```

Zero today, as Phase 96 left it. An oracle for this pair cannot be "count = 0" (it is 0 before the
work); it must construct the divergence through the writer (a `workflow-executor` `update_status`
on a task, or a `tasks-create` with `workflow_stage:'review'`) and observe the pair agree
afterwards — RED on the unfixed tree, GREEN after. Both constructions WRITE to staging (§17).

---

## §7 — CARRY-07: the entry chunk

Budget file: `frontend/.size-limit.json` (`"Initial JS (entry point)"`, `path dist/assets/app-*.js`,
`limit "500 KB"`, `gzip: true`); last changed by `ef36568b2 2026-08-15 "raise entry-chunk budget
476 -> 500 KB"`. CI: `.github/workflows/ci.yml:454-479` job `Bundle Size Check (size-limit)` runs
`pnpm -C frontend build`, `node frontend/scripts/assert-size-limit-matches.mjs`, `pnpm -C frontend size-limit`.
`vite.config.ts:143` `chunkSizeWarningLimit: 500` is a warning threshold, not the gate.

`frontend/dist` exists (784 assets). Provenance is MIXED: `index.html`, `app-CKIzEmIz.js`,
`vendor-CO0QbQgk.js` are dated `Sep 10 14:23`, but `dist/.vite/manifest.json` is `Sep 9 02:06`;
HEAD's last frontend-source change is `2a79b80da 2026-09-02`. The dist is newer than HEAD's
frontend, so per brief rule 3 no build was run; but which tree produced it is not provable (§19).
Measured on that dist without building:

```bash
cd /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend && pnpm size-limit   # reads dist, no build; exit 1
```

```
Initial JS (entry point)   Package size limit has exceeded by 16.25 kB   Size limit: 500 kB   Size: 516.25 kB gzipped
React vendor 60.99 kB / 285 · TanStack vendor 58.26 / 63 · HeroUI 3.56 / 9 · Sentry 3.93 / 9 · DnD 16.56 / 22
Copilot vendor (lazy) 136.92 / 145 · Total JS 2.66 MB / 2.78 MB · d3-geospatial 54.29 / 55 · static-primitives 8.09 / 12
```

Raw gzip of the same file (`gzip -c dist/assets/app-CKIzEmIz.js | wc -c`) = 520,209 B. Largest
chunks by gzip: `vendor` 744,709 B (not budgeted individually), `app` 520,209, `charts-vendor`
142,320, `copilot-vendor` 137,308. **The roadmap's "actual 493.71 kB" does NOT reproduce — the
entry is 516.25 kB and OVER the raised 500 KB budget**, so the required CI check is red on this
dist (and, if this dist is HEAD's, on main). `git grep -n "493.71"` finds the figure only in
`REQUIREMENTS.md:631`, `ROADMAP.md:642`, `milestones/v9.0-ROADMAP.md:51` — no build log records
which chunks grew; the "growth is app code, not vendor" claim is consistent with `react-vendor`
sitting at 61 kB under a 285 kB limit, but was not re-derived per chunk. **Outside:** the
fresh-build number — a plan task must build once and record it before choosing a target.

---

## §8 — CARRY-06: frozen clock vs server `NOW()`

### §8.1 The mechanism, named in the spec itself

`frontend/tests/e2e/dashboard-widgets-visual.spec.ts:5-11,59,97-105`:

```ts
// the frozen clock MUST align with the today-anchored staging seed … The WeekAhead widget buckets
// events by the browser clock … get_upcoming_events filters server-side by real NOW(). Both only
// overlap when the frozen clock is "today", so this constant tracks the capture date
const FROZEN_TIME = new Date('2026-07-03T12:00:00Z')
await page.clock.install({ time: FROZEN_TIME })
// FIXTURE_BLOCKED['week-ahead']: … "Reseeding therefore does NOT fix this — re-pinning FROZEN_TIME to the
// capture date does, and it re-rots the next day. Tracked as VISUAL-DEBT-01."
```

Server side: `get_upcoming_events(p_user_id uuid, p_days_ahead int default 14)` is
`SECURITY DEFINER` and filters `ed.start_date >= NOW()`, `<= NOW() + p_days_ahead`,
`ce.event_date >= CURRENT_DATE`; `get_dashboard_stats(p_user_id)` (also definer) uses `NOW()`
five times (`external_deadline <= NOW()+48h`, `start_date >= NOW()`, `+7 days`, calendar
`>= NOW()::DATE`). Client caller: `frontend/src/domains/operations-hub/repositories/operations-hub.repository.ts:56-60`
`supabase.rpc('get_upcoming_events', { p_user_id, p_days_ahead })` — no reference-time parameter
exists to inject. Seed dates today: `engagement_dossiers.start_date` = 2026-07-03/04/05 (the
capture date, already 69 days stale); `calendar_entries` future rows = **0 of 9**.

### §8.2 Visual-snapshot specs and baselines

`toHaveScreenshot` appears in 14 files; committed baseline dirs:
`frontend/tests/e2e/{qa-sweep-focus-outline,dossier-drawer-visual,list-pages-visual,tasks-tab-visual}.spec.ts-snapshots`,
`tests/e2e/tailwind-remap-visual.spec.ts-snapshots`, and `frontend/tests/e2e/__snapshots__/dashboard-widgets/`
(8 PNGs: digest, kpi-strip, my-tasks, overdue-commitments, recent-dossiers, sla-health,
vip-visits, week-ahead). `dashboard-visual.spec.ts` uses `toHaveScreenshot` (`:80`) with **no
clock install and no committed baseline dir** — it generates on first run. Clock installs exist in
`calendar-rtl.spec.ts` (`addInitScript` Date override, 2026-08-01 rot noted in its comment),
ten `dossier-drawer-*.spec.ts` (`2026-04-26`), `list-pages-visual.spec.ts`.

### §8.3 The two fixes (stated, not chosen — PD-07)

- **A. Inject a server-side reference time.** Add `p_now timestamptz default now()` to
  `get_upcoming_events`/`get_dashboard_stats`, thread it from the client when a test flag is set.
  Pro: seeds stay fixed, baselines stop rotting. Con: two definer RPC signatures change (migration
  + type regen), and a production code path grows a test-only parameter that must be provably
  inert in production (a "conditions under which it runs" criterion, per `tickmarkr.spec.md`).
- **B. Seed relative to `now()`** (a `refresh` that moves `b0000002-*` dates to today-relative
  before the run, and pin `FROZEN_TIME` to the run date). Pro: no production change. Con: the
  browser clock still must be told "today", so the spec computes `FROZEN_TIME` at run time —
  which is what the comment says re-rots daily unless BOTH sides move together; visual diffs of
  date labels then change every day and the snapshot must mask them.

Criterion 3 forbids "regenerate baselines" as the fix; either option needs an oracle that runs the
spec on two different wall-clock days (or with two `TZ`/faketime settings) and passes both.

---

## §9 — CARRY-08: the three quick tasks, each task classified against HEAD

Directories: `.planning/quick/260530-w2-data-entry-shared-primitives-dedupe`,
`…-w3-data-entry-per-surface-ux`, `…-w4-data-entry-polish` — each holds `PLAN.md` only; **0 of 3
has a SUMMARY.md** (5 of 53 quick dirs have one). The sweep shipped as PR #35
`53fd881be 2026-05-30 "Merge pull request #35 … fix/data-entry-uiux-polish"`.

| task | check run at HEAD | class |
| ---- | ----------------- | ----- |
| W2-A1 delete `components/after-action/` | dir absent | DONE-UNSUMMARISED |
| W2-A2 RTL double-flip removal (5 files) | `git grep -c flex-row-reverse` over the trio+risk+follow-up → 0 | DONE-UNSUMMARISED |
| W2-A3 aria-required in live trio | AfterActionForm 1, CommitmentEditor 7, DecisionList 3 | DONE-UNSUMMARISED |
| W2-A4 `lib/format-date.ts` + `formatDayFirst` | file exists; 109 importers; `'PPP'` in named files → 0 | DONE-UNSUMMARISED |
| W2-B1 `rounded-field` removal | 0 occurrences | DONE-UNSUMMARISED |
| W2-B2 FormControl aria-required + DossierPicker aria-label | `ui/form.tsx` 1; DossierPicker 2 | DONE-UNSUMMARISED |
| W2-B3 CreateDossierHub `hover:shadow-lg` | 0 | DONE-UNSUMMARISED |
| W2-B4 `useUnsavedChangesGuard` | hook exists; imported by BriefingBookBuilder + after-action route | DONE-UNSUMMARISED |
| W2-B5 `engagements/EngagementBriefsSection.tsx` → formatDayFirst | **file no longer tracked** (`git ls-files` → 0); briefs live in `domains/engagements/hooks/useEngagementBriefs.ts` | SUPERSEDED-BY-PR#37 (engagement-briefs rewire, per memory) |
| W3-I1 IntakeForm aria-invalid/describedby | 6 / 6 | DONE-UNSUMMARISED |
| W3-I2 TriagePanel alert() → inline | `alert(` 0, `reasonError` 9, aria-required 2 | DONE-UNSUMMARISED |
| W3-I3 Fill-Mock behind `import.meta.env.DEV` | `:461 {import.meta.env.DEV && (` | DONE-UNSUMMARISED |
| W3-D1 EngagementDetailsStep HTML `required` → Zod | no `<Input required>`; `<FormControl required>` ×4 (aria threading from W2-B2); schema `start_date: z.string().min(1)` | DONE-UNSUMMARISED (shape differs from plan text: `required` moved to FormControl, not deleted) |
| W3-A1 AI-extraction dedupe + toast | dedupe 3, toast 3 | DONE-UNSUMMARISED |
| W3-A2 confirm dialogs on row remove | Dialog/confirm tokens 5 in each of the 4 lists | DONE-UNSUMMARISED |
| W3-A3 FollowUpList date constraint | `disabled=`/`min=` 5 | DONE-UNSUMMARISED |
| W3-B1 BriefGenerationPanel aria-live | 1 | DONE-UNSUMMARISED |
| W3-B2 BriefsPage fetch-error toast | toast 4 | DONE-UNSUMMARISED |
| W4-E1 emoji → lucide | IntakeQueue `<Bot` 1, robot emoji 0; TicketDetail `<Paperclip` 1, emoji 0 | DONE-UNSUMMARISED |
| W4-E2 intake i18n leaks | `Select action type` 0; `files allowed` 0 | DONE-UNSUMMARISED |
| W4-E3 DossierPicker literals | 12 `t('` calls; 0 JSX EN literals by the regex used | DONE-UNSUMMARISED (regex-bounded) |
| W4-E4 briefing-books literals | `Entities:` 0, `No matching entities` 0, `Deleting...` 0, `} pages` 0 | DONE-UNSUMMARISED |
| W4-E5 unified submit label | IntakeForm `t('actions.submitRequest')`; IntakeQuickForm submit renders `t('form.creating'…)` — **two different keys** | PARTIAL (the two forms do not share one key as the plan asked) |
| W4-E6 form-wizard aria-disabled | 1 | DONE-UNSUMMARISED |
| W4-E7 file two follow-up todos | both files exist (+2 more) | DONE-UNSUMMARISED |

Twenty-four tasks: 22 DONE-UNSUMMARISED, 1 PARTIAL (W4-E5), 1 SUPERSEDED (W2-B5). Criterion 5 is
satisfiable by writing three SUMMARY.md files that cite these checks (plus a decision on W4-E5).
**Outside:** each check is a presence grep at HEAD, not a behavioural verification; the memory's
"2 P0s honest-open (need backend)" from PR #35 are not in these three plans' task lists.

---

## §10 — GUIDE-HOLLOW-01: the type-guide body

`frontend/src/components/dossier/DossierTypeGuide.tsx:185-188`:

```ts
const whenToUse = t(`typeGuide.${type}.whenToUse`, '')
const examples = t(`typeGuide.${type}.examples`, { returnObjects: true }) as string[]
const commonLinks = t(`typeGuide.${type}.commonLinks`, { returnObjects: true }) as string[]
const notFor = t(`typeGuide.${type}.notFor`, '')
```

Guards at `:247` and `:264` (`Array.isArray(x) && x.length > 0`); `:459` repeats the
`whenToUse` lookup with `''` default for the grid. (Register line numbers `:162-165` have drifted
by ~23 lines since P98's EO work.)

`typeGuide` subtrees NOW, both locales (`node -e` over `frontend/src/i18n/{en,ar}/dossier.json`):

```
en {"whenToUse":"<label>","examples":"<label>","commonLinks":"<label>","notFor":"<label>","learnMore":"<label>","createDossier":"<label>","elected_official":"whenToUse+examples+commonLinks+notFor"}
ar {… identical shape … "elected_official":"whenToUse+examples+commonLinks+notFor"}
```

**Per type per locale:** `elected_official` — full body in en AND ar; `country, organization,
forum, engagement, topic, working_group, person` — **no subtree in either locale** (7 × 4 × 2 =
56 leaves to author). `typeDescription` has all 8 types plus a `theme` key in both locales.

`getTypeColors` (`:106-166`) vs canonical `dossierTypeColors` (`frontend/src/lib/semantic-colors.ts:37-73`):
the seven DB types are byte-identical; `elected_official` in the component returns the
country/primary triple (matching `getDossierTypeBadgeClass`'s `?? dossierTypeColors.country`
fallback); the component's `default:` returns `bg-muted/text-muted-foreground/border-muted`
**while the canonical fallback is country/primary** — that is the residual drift the register
names; align by delegating to `dossierTypeColors[type] ?? dossierTypeColors.country`.
The local `const types: DossierType[]` at `:403-411` (order country, organization, **person**,
engagement, forum, working_group, topic) is PARALLEL-TRUTH-01's first copy (§16).

---

## §11 — EDGECOPY-01: retired term and NOW-relative copy in edge functions

```bash
grep -rn "Due Date\|تاريخ الاستحقاق" supabase/functions | cut -d: -f1 | sort | uniq -c
```

```
2 supabase/functions/bot-notification-dispatcher/index.ts   (:73 dueDate: 'Due Date', :101 'تاريخ الاستحقاق')
1 supabase/functions/contextual-suggestions/index.ts        (:664 `تاريخ الاستحقاق ${…toLocaleDateString('ar-SA'…`)
2 supabase/functions/data-export/index.ts                   (:703 header: 'Due Date', :704 headerAr)
2 supabase/functions/data-import/index.ts                   (:565-566 same pair)
2 supabase/functions/pdf-generate/index.ts                  (:133 `Due Date: ${…('en-US')}`, :185 `تاريخ الاستحقاق: …('ar-SA')`)
```

**Five functions, reproduced** (`mou-notifications` no longer matches the grep at all).
NOW-relative amendment sites, verbatim: `contextual-suggestions/index.ts:605-606`
(`This commitment was due ${daysOverdue} day${…} ago.` / `هذا الالتزام متأخر منذ ${daysOverdue} يوم…`),
`:617-618` (`badge_text_en: \`${daysOverdue}d overdue\``, `badge_text_ar: \`متأخر ${daysOverdue} يوم\``),
`relationship-health/index.ts:226-227` (`No engagement with this relationship for ${…days_since_engagement} days.` /
`لا يوجد تفاعل مع هذه العلاقة منذ ${…} يومًا.`). Line numbers at HEAD differ from the register's
by 1–2.

### §11.2 The preserved P98 instruments

`.tickmarkr/overseer/INSTRUMENTS-P98/` holds 8 files. **None is an edge-function probe.** The
"offered probe" (`OFFERED-98-06-helppage-probe.spec.ts`) drives `/help/commitments` across tabs
and accordions in both locales and harvests body text for the retired term — a FRONTEND surface
probe, a Playwright spec (not runnable under this brief; not run). The others: `neg-taskcard.mjs`
and `resolve-check.mjs` (i18next resolution checks — runnable, unrelated to edge copy),
`p98-exec-08-*` (label capture, floor walker, long-tail proof), `partA_maskfinder.py`. **There is
no existing instrument for EDGECOPY-01; the phase must write one** (a `curl` of each function's
produced artifact/response, both locales, asserting the replacement term is PRESENT).

### §11.3 How `pdf-generate` is invoked

`supabase/functions/pdf-generate/index.ts:291-295`: the id comes from the **path**
(`pathParts[indexOf('after-actions')+1]`), body `{ language: 'en'|'ar'|'both', mfa_token? }`
(`:44-47`, `:308-310`). So the request is
`POST $SUPABASE_URL/functions/v1/pdf-generate/after-actions/<after_action_id>` with a JWT — the
"path-segment id unreachable via `functions.invoke`" class from project memory; `curl`/`fetch`
reach it. It **writes**: `supabase.storage … upload` (`:383`) and returns a signed URL (`:395`),
so every verification run creates a storage object (§17). Frontend has NO caller
(`git grep pdf-generate -- frontend/src` → none); the only caller is
`backend/tests/performance/pdf-generation.test.ts:17`.

### §11.4 A record to generate against

```
AAR 905b6a3a-4c94-482f-9857-d268cc4d3ea5 pub=draft conf=false commitments=1 engagement=7c0d830b-5dc7-4419-a0ad-ce550031712d
```

One `after_action_records` row (draft, not confidential, 1 commitment → the `Due Date:` line
WILL render). Its engagement is the ONS dossier with no extension row (§4).

### §11.5 What a worker can deploy

Phase 100's plan text (`100-16-PLAN.md:106`, `100-17-PLAN.md:136`), quoted exactly:

```
DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH" supabase functions deploy <name> --project-ref zkrcjzdemdmwhearhfgg
```

No `100-16-SUMMARY.md`/`100-17-SUMMARY.md` exists yet (the P100 run is live), so "a worker
deployed with this command" is the plan's claim, not yet a recorded outcome (§19). Access token
provenance for the CLI inside a worktree is likewise unrecorded.

---

## §12 — COPY-09: the Title-Case long tail, one instrument

Instrument (kept in this seat's scratchpad; reproduce inline — 40 lines):
candidate = string leaf with ≥2 whitespace words after stripping `{{…}}`, every judged word
matching `^[A-Z][a-z]`; ALL-CAPS tokens ≤4 chars are excluded from judgement (and a string
that leaves <2 judged words is NOT a candidate — so `SLA Breach` is invisible to it: a stated
blind spot, ~two-word acronym-led labels). Controls in the same run:
`'Add Elected Official'=true 'Add elected official'=false 'SLA Breach'=false 'Sign in'=false`.

```
EN_FILES=129 EN_STRINGS=16998 TITLECASE_CANDIDATES=4354 PCT=25.6
NS dossier = 268 (ar mirrors 268)      NS common = 231 (231)        NS assignments = 129 (129)
NS dossiers = 129 (129)                NS committees = 120 (120)    NS empty-states = 105 (105)
NS legislation = 105 (105)             NS compliance = 100 (100)    NS user-management = 99 (99)
NS working-groups = 95 (95)            NS workflow-automation = 92  NS dashboard-widgets = 90
NS contacts = 85                       NS positions = 84            NS advanced-search = 80
EN_NS_WITHOUT_AR_FILE=0   (129 en files, 129 ar files)
```

Register said 4,471/4,562 of 16,045 (2026-08-18). Today: **4,354 of 16,998** — the bundle grew
by 953 strings (P98/P99) while candidates fell by ~120 (P98's bounded repair). Every candidate's
key exists in the `ar` file (mirror = candidate count per namespace), so a rename in `en` must
be checked against `ar` for 4,354 keys (P99 interaction note).

Hardcoded-literal sites, pinned at HEAD `3ec257adc` (register pins `b5eb84314`):

| site | at `b5eb84314` | at HEAD |
| ---- | -------------- | ------- |
| `frontend/src/pages/help/HelpPage.tsx:166` | `title={isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}` | **same, still `:166`** (+ `:168` subtitle literal) |
| `frontend/src/hooks/useBriefingBooks.ts:164-165` | `message_en/message_ar` | **same lines**, plus `:156-157` (`'Starting briefing book generation...'`); `:164-165` carry `!` |
| `frontend/src/pages/dossiers/overview-cards/PositionTrackerCard.tsx:93` | `t('overview.positions.ourStance', { defaultValue: 'Our Position' })` | **GONE** — `:86` is `t('overview.positions.ourStance')`, no default (P99 mask removal); `'Our Position'` survives only in a comment `:6` |

`validation.json` retired-term member (both locales): `dueDateRequired` — en `"Due date is
required"`, ar `"تاريخ الاستحقاق مطلوب"` (`frontend/src/i18n/{en,ar}/validation.json:10`).

---

## §13 — GATESTD-01..05

### GATESTD-01 — C9b escape line (`.planning/GATE-STANDARD.md:227`)

Run on this machine (macOS 26.6.2, `/usr/bin/sed`; no `gsed` at `/opt/homebrew/bin`):

```bash
id='QueryErrorState.test'; out=$(printf '%s' "$id" | sed -E 's/[][.*+?^${}()|\\]/\\\\&/g' 2>err); echo "exit=$? id_after='${out}'"; cat err
```

```
exit=1 id_after='' stderr=sed: 1: "s/[][.*+?^${}()|\]/\\ ...": unbalanced brackets ([])
```

The register's variant (`\\&`) fails identically. The assignment succeeds with an EMPTY id
(fails open, as filed). The suggested fail-closed form works:

```bash
case "$id" in *[^A-Za-z0-9_-]*) echo "UNSAFE ID (triage by hand): '$id'";; *) echo "safe: '$id'";; esac
# 'QueryErrorState.test' → UNSAFE · 'safe_id-1' → safe · 'common.json' → UNSAFE
```

### GATESTD-02 — config-enabled artefact steps, with polarity

`.planning/config.json` `workflow`: `research=true, plan_check=true, verifier=true,
nyquist_validation=true, node_repair=true, ui_phase=true, ui_safety_gate=true` (positive, enabled);
`skip_discuss=false` (NEGATIVE polarity → enabled); `auto_advance=false, text_mode=false,
research_before_questions=false, _auto_chain_active=false` (disabled); non-boolean
`node_repair_budget=2`, `discuss_mode="discuss"` (agrees with `skip_discuss=false`).
**ENABLED_BOOLEAN_STEPS=8** — the register's corrected count reproduces.

VALIDATION census (precondition = `## Validation Architecture` heading in `NN-RESEARCH.md`):

```
P92 heading=1 92-VALIDATION.md ✓ · P93 heading=1 **NONE** · P94 ✓ · P95 ✓ · P96 ✓ · P97 ✓ · P98 ✓
P99 heading=0 (no artifact expected) · P100 heading=0 (no artifact expected)
```

Only Phase 93 has the precondition met and the artifact absent — the filed instance, still open.

### GATESTD-03 — decision extractor drops sub-lettered ids

`scripts/decision-coverage.mjs:43`: `const m = line.match(/\*\*(D-\d{2})[:*]/)`. Scratch run
(context with `D-01, D-02, D-03a, D-03b, D-04`; one plan citing all five):

```bash
node scripts/decision-coverage.mjs <scratch>/phase <scratch>/phase/X-CONTEXT.md
```

```
{"passed": true, "total": 3, "covered": 3, "coverage": {"D-01":…, "D-02":…, "D-04":…}, "uncovered": []}
```

`D-03a`/`D-03b` never enter the set; the gate passes green. Reproduced.

### GATESTD-04 — the third direction

`97-GATE-STANDARD-THIRD-DIRECTION.md` (430 lines): the result slot is **FILLED — "Result —
CONFIRMED, first outing. Three instances."** (`:54`), ruled `RULING-P97-06-GREEN-ON-WRONG.md`,
with an execution-leg addendum (four vacuous `pnpm --filter frontend` clauses masked by earlier
red clauses; the set-intersection detection rule). The register row's "filed with the slot still
PENDING" is stale by content — the file has the result. What P102 owns is the SCOPING decision
(PD-08): the candidate remedy (construct a plausible WRONG state; observe red; else record
`WRONG-STATE NOT CONSTRUCTED`) and where to apply it (the file argues presence-shaped criteria).

### GATESTD-05 — gate-drill re-entrancy

`scripts/gate-drill.mjs` (147 lines): extracts `<automated>` blocks (`:61-68`), `bash -n` parses
each (`:84`), then `spawnSync('bash', [path], { timeout, cwd: process.cwd(), maxBuffer })` (`:89-93`).
`grep -c 'GATE_DRILL' scripts/gate-drill.mjs` → **0**; no `process.env` read anywhere; no
phase-dir self-reference check. The guard is absent, as filed. Not triggered.

---

## §14 — PREVIEW-HOLLOW-01

- Importers of `frontend/src/hooks/usePreviewLayouts.ts`: **one** —
  `frontend/src/routes/_protected/admin/preview-layouts.tsx`. The hook reads
  `rpc('get_entity_layouts')` (`:44`), `from('entity_preview_layouts')` (`:61,134,177,211`),
  `rpc('set_default_layout')` (`:241`). No other repo reader of `entity_preview_layouts`,
  `get_preview_layout`, `get_entity_layouts`, `set_default_layout`, or `user_preview_preferences`
  (`git grep` over `frontend/src backend/src supabase/functions`, types excluded → only the hook
  and a JSDoc in `types/preview-layout.types.ts`). i18n namespace `preview-layouts` is registered
  (`i18n/index.ts:242-243,394`).
- DB: `entity_preview_layouts` = **12 rows** (one default `hover` layout per entity type, all
  created 2026-04-09, `created_by=null` — seed); `user_preview_preferences` = 0.
  `pg_depend`: no view references it; functions reading it: `enforce_single_default_layout`
  (trigger), `set_default_layout`, `get_entity_layouts`, `get_preview_layout`. Eight policies
  (four `*_org_isolation_*` from `20260627000002_sec_be_01_admin_rls_db_role.sql`, four
  `preview_layouts_*`).
- Creating migration `supabase/migrations/20260115100001_entity_preview_layouts.sql` defines:
  types `preview_entity_type, preview_context, preview_field_type`; tables
  `entity_preview_layouts, preview_layout_fields, user_preview_preferences`; 6 indexes; functions
  `update_preview_layout_timestamp, enforce_single_default_layout, get_preview_layout,
  get_entity_layouts, set_default_layout`; 4 triggers; 5 policies. Also touched by
  `20260627000001_sec_helper_is_platform_admin.sql`. A drop migration must drop all of these (and
  the org-isolation policies) in dependency order. Route git log: last touched by
  `807730d71` (demo-route gating), `f58f4ae73`, `f802ea5dd` — no feature work since.

---

## §15 — ROUTE-ORPHAN-01: the 14, classified on evidence

```bash
node scripts/inbound-link-classify.mjs      # unrestricted, exit 0
```

```
ROUTE population: 203 full paths … (186 distinct after trailing-slash normalisation)
ZERO_INBOUND=95 of 186 table rows
```

**95 reproduces exactly.** All 14 named routes show `0  (none)`.

| route | file | renders | data it reads | staging rows | class |
| ----- | ---- | ------- | ------------- | ------------ | ----- |
| `/contacts` | `routes/_protected/contacts.tsx` (7 lines) | `beforeLoad: throw redirect({ to: '/dossiers/persons' })` | — | — | duplicate-of `/dossiers/persons` (redirect shell; `309deb843` "convert 5 duplicate entity routes") |
| `/countries` | `countries.tsx` (7) | redirect → `/dossiers/countries` | — | — | duplicate-of |
| `/organizations` | `organizations.tsx` (7) | redirect → `/dossiers/organizations` | — | — | duplicate-of |
| `/persons` | `persons.tsx` (15) | redirect → `/dossiers/persons` | — | — | duplicate-of (`a011bcd59` consolidate persons) |
| `/working-groups` | `working-groups.tsx` (7) | redirect → `/dossiers/working_groups` | — | — | duplicate-of |
| `/intake/queue` | `intake/queue.tsx` (27) | redirect → `/my-work/intake`; `component: () => null` | — | — | duplicate-of `/my-work/intake` |
| `/data-library` | `data-library.tsx` → `pages/DataLibrary.tsx` → `pages/data-library/DataLibraryPage.tsx` | data-library list | `from('data_library_items')` ×2 | **0** | renders-data, empty on staging |
| `/geographic-visualization` | → `pages/geographic-visualization/GeographicVisualizationPage.tsx` | map + metrics | `functions.invoke('geographic-visualization')` (reads `v_country_engagement_metrics`, `v_country_relationship_flows`, `v_regional_engagement_summary`), `rpc('get_geographic_visualization_data')` | views: 5 / 3 | renders-data (has data) |
| `/stakeholder-influence` | `stakeholder-influence.tsx` (654 lines, page inline) | tiers/reports tabs | `apiGet('/stakeholder-influence/…')` → fn reads `influence_reports, stakeholder_influence_history, network_clusters, dossier_relationships, dossiers` | 0 / 0 / 0 | renders-data, empty on staging |
| `/workflow-automation` | → `pages/workflow-automation/WorkflowAutomationPage.tsx` | rules list, builder, executions | `apiGet('/workflow-rules…')` → fn reads `workflow_rules, workflow_executions, workflow_notification_templates` | 0 / 0 | renders-data, empty on staging |
| `/tasks/escalations` | → `pages/Escalations.tsx` → `components/assignments/EscalationDashboard.tsx` | escalation stats | `fetch(…/functions/v1/escalations-report?…)` → `escalation_events, staff_profiles, organizational_units, users` | `escalation_events` 0 (`escalation_records` 0) | renders-data, empty on staging |
| `/my-work/waiting` | → `pages/WaitingQueue.tsx` | filtered assignments + bulk reminders | `apiGet('/waiting-queue-filters/assignments?…')` → fn reads `assignments, dossiers, intake_tickets, positions, tasks, user_preferences, users` | `assignments` 14 (assigned 6, in_progress 5, completed 2, cancelled 1 — **no `waiting` status exists**) | renders-data; the "waiting" semantics need the fn's own filter, not read here |
| `/reports/scheduled` | → `components/scheduled-reports/ScheduledReportsManager.tsx` → `hooks/useScheduledReports.ts` | schedules manager | `from('report_schedules')` ×5, `report_schedule_recipients`, `report_delivery_conditions`, `report_executions`, `custom_reports`, `invoke('scheduled-report-processor')` | 0 / 0 | renders-data, empty on staging |
| `/help/commitments` | → `pages/help/CommitmentsHelpPage.tsx` | static help (tabs + accordions) | none (static copy; P98's retired-term repair site) | — | empty-shell? no — static-content page, renders without data |

Six of 14 are redirect shells (no product decision needed beyond "keep the alias or delete the
file"); seven render real data sources that are EMPTY on staging (a render probe would show an
empty state, not a defect); one has data (`/geographic-visualization`); one is static help.
**Outside this classification:** whether any of the seven empty pages is reachable through
forms the classifier cannot see (its own FLOOR/CEILING caveat, quoted in its header); no browser
render was performed.

---

## §16 — PARALLEL-TRUTH-01: the three copies at HEAD

Canonical (`frontend/src/lib/dossier-type-guards.ts:45-53,72`):

```ts
export const DOSSIER_TYPES = ['country','organization','forum','engagement','topic','working_group','person'] as const
export const DOSSIER_CARD_TYPES = [...DOSSIER_TYPES, 'elected_official'] as const
// :93-94  type AssertNever<T extends never> = T; export type _EoIsNotADbType = AssertNever<Extract<DossierType,'elected_official'>>
```

| copy | verbatim | consumed as | order matters? | importers of the file |
| ---- | -------- | ----------- | -------------- | --------------------- |
| `components/dossier/DossierTypeGuide.tsx:403-411` `const types: DossierType[]` | `country, organization, person, engagement, forum, working_group, topic` (DB-7, the "fourth order") | `types.map(...)` into the selection grid (`:420`) | **YES — rendering order** | `DossierTypeSelector.tsx`, `DossierTypeStatsCard.tsx`, `components/dossier/index.ts` |
| `components/dossier/wizard/hooks/useDraftMigration.ts:14-22` `VALID_TYPES: readonly string[]` | canonical order, DB-7 | `VALID_TYPES.includes(type)` (`:44`) | NO — membership | `useCreateDossierWizard.ts`, its test |
| `components/keyboard-shortcuts/CommandPalette.tsx:306-315` `DOSSIER_TYPE_ORDER: string[]` | canonical order + `elected_official` (CARD-8) | `DOSSIER_TYPE_ORDER.map(type => ({type, items: grouped[type] ?? []}))` (`:616`) | **YES — group order** | palette only |

Re-pointing: copies 2 and 3 can spread the canonical arrays verbatim (`[...DOSSIER_TYPES]`,
`[...DOSSIER_CARD_TYPES]`) with no visible change; copy 1 CHANGES the guide grid's order
(person moves from 3rd to 7th) — a visible reorder that a snapshot spec would catch and that
needs a decision (keep the guide's order as a local sort over the canonical set, or accept the
canonical order).

---

## §17 — Cross-cutting: deploys, migrations, irreversible data

**Deploy (executable by a worker — edge function → staging via the §11.5 command):**
`my-delegations` (+ `delegate-permissions`, `revoke-delegation`, `deactivate-user` if PD-01
covers them), the five EDGECOPY functions + `contextual-suggestions`/`relationship-health`
NOW-relative copy, `workflow-executor` (WRITER-ROUTE-01), `tasks-create` (INSERT-SYNC-01).
**Human gates (NOT executable by a worker):** production droplet deploy, `git push`, PR/merge,
GitHub-secret changes (the `E2E_*` credentials), any CI workflow edit that needs a run to prove.

**Migrations.** Repo naming at HEAD: last dated files `20260817500004/5/6_p96_*.sql`; Phase 100's
plans name `2026090800000N_p100_*.sql` … `20260910000002_p100_matview_invoker_consumers_definer.sql`
(not yet on `main`; P100 run live). Staging's `supabase_migrations.schema_migrations` max is
`20260817005132` (P96) — **P100's migrations are not applied to staging as of this reading**, so
P102 migrations must sort AFTER P100's highest: `202609110000NN_p102_<slug>.sql` or later, and
must not assume P100's objects exist unless P100 has landed by then (§19). Migration-needing rows:
INSERT-SYNC-01 (an INSERT trigger or a BEFORE INSERT extension of the sync function),
PREVIEW-HOLLOW-01 if "delete" (drop of 3 tables/3 types/5 functions/policies), CARRY-06 option A
(RPC signature), P52FIXTURE-01 if seeded by migration rather than by SQL seed.

**Irreversible staging DATA writes** (recommend a pre-run export, one command, kept outside the
worktree):

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.env.test; set +a
OUT=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer/p102-prepurge-$(date -u +%Y%m%dT%H%M%SZ); mkdir -p "$OUT"
psql "$SUPABASE_DB_URL" -c "\copy (select * from auth.users where email ilike '%@example.com' or email ilike '%@gastat.test') to '$OUT/auth_users_fixtures.csv' csv header"
for t in public.users public.profiles public.mou_notification_preferences public.user_notification_preferences public.staff_profiles public.user_roles; do psql "$SUPABASE_DB_URL" -c "\copy (select * from $t where $( [ "$t" = public.users ] && echo id || echo user_id ) in (select id from auth.users where email ilike '%@example.com' or email ilike '%@gastat.test')) to '$OUT/$(echo $t | tr . _).csv' csv header"; done
psql "$SUPABASE_DB_URL" -c "\copy (select * from dossiers where name_en ~* 'Phase \d+|E2E|UAT|fixture|staging verification|\yseed\y|\ytest\y') to '$OUT/dossiers_residue.csv' csv header"
```

DATA-01 purge (402 auth rows + 834 cascade rows), DATA-02 deletes/renames (§2.3), SEED-DELEG-01
seed rows, P52FIXTURE-01 seed row, the §6 divergence constructions, every `pdf-generate` run
(storage object), any e2e re-run that creates `e2e-97-01-*` persons again.

---

## §18 — Roadmap/register numbers that did NOT reproduce

| claim | measured | command | verdict |
| ----- | -------- | ------- | ------- |
| ~415 fixture accounts (criterion 1, DATA-01) | **402** (338+64); 415 = whole table | §1.1 | NOT reproduced (already flagged by 100-RESEARCH §7; re-confirmed) |
| 13 non-fixture accounts include real staff only | 13 = 6 `stats.gov.sa` + 3 `e2e.test` seeds + `admin@gastat.gov.sa` (never signed in) + `test.user@gmail.com` + `test@gastat-intake.local` + `mfmuhanna@gstats.gov.sa` | §1.2 | count reproduces; **composition is 8 staff-shaped + 5 test-shaped** |
| the four DATA-02 strings live in title-like columns | one lives in `intelligence_digest.summary`; two have derived copies in `rag_chunks`/`mou_notification_queue` | §2.1 | NOT reproduced as a column class |
| `/engagements` renders the error state (ENGREAD-01) | both API paths 200 with 5 rows | §5.2 | NOT reproduced at the API; render untested |
| `dossiers WHERE type='engagement'` = 5 "none deleted" | 5 rows, but `is_active=false` on 2 (`b0000002-…-02/-03`) | §4 | count reproduces; "none deleted" true, "all active" false |
| `tasks.service.ts:127` (INSERT-SYNC-01) | `:140-141`; a third INSERT at `:650` | §6.1 | line drift + one unlisted site |
| entry chunk 493.71 kB gzipped, under 500 | **516.25 kB, OVER by 16.25 kB** on the on-disk dist | §7 | NOT reproduced; direction reversed |
| COPY-09: 4,471/4,562 of 16,045 strings | 4,354 of 16,998 | §12 | NOT reproduced (bundle grew, tail shrank) |
| `PositionTrackerCard.tsx:93` defaultValue literal | gone at HEAD (`:86` no default) | §12 | NOT reproduced — already repaired by P99 |
| GATESTD-04 "result slot still PENDING" | slot filled: CONFIRMED, three instances | §13 | NOT reproduced (file updated after filing) |
| `DossierTypeGuide.tsx:162-165, :213,224,241,259, :380` | `:185-188`, `:247,264`, `:403` | §10, §16 | line drift only |
| `my-delegations` is the (only) reader of `delegations` | four functions read/write it | §3.5 | population wider than filed |
| `admin@e2e.test` role=admin (v4.0 Phase 17 UAT) | `public.users.role=viewer` | §1.2 | NOT reproduced |
| 95 zero-inbound routes; 14 unowned | 95 / 14 | §15 | reproduced |
| 5 EDGECOPY functions | 5 | §11 | reproduced |
| 0 rows in both delegation tables | 0 / 0 | §3.1 | reproduced |
| 8 config-enabled steps | 8 | §13 | reproduced |

---

## §19 — Not knowable from here

- The GitHub-secret values of `E2E_ADMIN/ANALYST/INTAKE_EMAIL` — inferred as the three
  `@e2e.test` accounts from the v4.0 record and their CI-dated sign-ins, not read.
- Whether the on-disk `frontend/dist` was built from HEAD (mixed mtimes; no build run).
- Whether `/engagements` errors in a BROWSER today (no render performed).
- The deployed VERSION numbers of `my-delegations`, `engagement-dossiers`, `pdf-generate`
  (unauthenticated `functions list`); only response shapes were observed.
- Whether Phase 100's migrations/deploys will have landed on staging before P102 executes —
  the live run's outcome; P102 migration numbering and any dependence on P100 objects must be
  re-checked at plan-compile time.
- Production's row counts (every number here is staging).
- Whether the 402 fixture ids appear in columns WITHOUT a declared FK (`storage.objects.owner`,
  free-text audit payloads) — the census is FK-derived by construction.

---

## §20 — Proposed decisions

- **PD-01 `RECOMMEND` — delegations table = `permission_delegations`**, and the repoint covers
  all FOUR functions that name the phantom `delegations` relation (`my-delegations`,
  `delegate-permissions`, `revoke-delegation`, `deactivate-user`), or states why three stay.
  Evidence §3.4 (11/12 field fit), §3.5 (`access-requests` already writes it;
  `position_delegations` has zero readers/writers).
- **PD-02 `RECOMMEND` — P52 fixture: RENAME `name_en/name_ar` to plausible diplomatic copy AND seed
  the `engagement_dossiers` row; keep the id** (5 specs + env template pin it). Seed the ONS
  engagement's extension row in the same act (§4, §11.4). Evidence §4.
- **PD-03 `UNSETTLED` — DATA-02 residue in two acts:** (a) DELETE unreferenced rows (68 `e2e-97-01`
  persons, Phase 63 ×2, the digest, `UAT round-11`, 2 E2E tasks, `Audience Test Position`,
  `Test WIP Unit`, derived `rag_chunks`/`mou_notification_queue` copies); (b) RENAME pinned seed
  rows (`a0000000` persons/working groups, SRTL-02 calendar rows, `b0000003` commitment, the
  `E2E MoU`). Two readings: rename the `Test Person A–J` family (the fixtures file pins ids, not
  names) vs keep them because "Test Person" is the fixture vocabulary specs assert on — needs a
  grep of what each spec asserts by NAME. Evidence §2.3.
- **PD-04 `RECOMMEND` — E2E cleanup targets:** `tests/e2e/97-elected-officials-reachable.spec.ts`
  (creates persons, no teardown), `frontend/tests/e2e/user-management.spec.ts` (creates
  `@example.test` accounts, no teardown), `frontend/tests/e2e/mou-create.spec.ts` (creates MoUs).
  Backend integration tests already pair create/delete. Evidence §1.4, §2.3.
- **PD-05 `RECOMMEND` — ROUTE-ORPHAN dispositions by class, not by route:** delete the 6 redirect
  shells only if no external link/bookmark contract exists (unknowable here → keep as aliases is
  the conservative reading); for the 7 data-rendering pages decide EMPTY-ON-STAGING ≠ dead
  (seed or leave), with `/geographic-visualization` (has data) and `/help/commitments` (static)
  as keep. Evidence §15. Marked RECOMMEND for the class split, `UNSETTLED` per route.
- **PD-06 `UNSETTLED` — DATA-01 purge mechanism:** GoTrue `auth.admin.deleteUser` ×402 (what the
  tests use; keeps GoTrue's own bookkeeping) vs one SQL `DELETE` (one statement, bypasses GoTrue).
  Exclusion list is settled (§1.3): the four login accounts; suffix set must be decided to include
  `@example.test` or not (§1.4). Pre-purge export is mandatory either way (§17).
- **PD-07 `UNSETTLED` — CARRY-06 direction:** server-side reference time (touches two definer RPC
  signatures) vs today-relative seed + run-time `FROZEN_TIME` (touches specs only, needs date-label
  masking). Evidence §8.3. Either way the oracle must pass on two distinct dates.
- **PD-08 `RECOMMEND` — GATESTD-04 scoping:** adopt the third direction for PRESENCE-shaped
  criteria only ("X appears/exists/contains"), recorded as `WRONG-STATE NOT CONSTRUCTED: <why>`
  when no plausible wrong state exists; leave exact-value and behavioural criteria at two
  directions. Evidence §13 (the file's own argument; its three instances were all presence/text).
- **PD-09 `RECOMMEND` — COPY-09 method:** namespace-by-namespace, top-15 first (2,013 of 4,354
  candidates), each rename paired with its `ar` key check; carve-outs = CLAUDE.md's three
  (UPPERCASE ribbons, mono labels, table-column headers) + proper-noun compounds enumerated
  BEFORE the pass (the register's "Working Group", "Intake Ticket" class). `validation.json`
  `dueDateRequired` is repaired in this pass (lifts the P98 carve-out). Evidence §12.
- **PD-10 `RECOMMEND` — PREVIEW-HOLLOW-01: delete** (route + hook + i18n ns + drop migration for the
  3 tables/3 types/5 functions), because no consumer exists and the 12 rows are an untouched
  2026-04-09 seed; "finish" would be net-new feature work with no owner. Evidence §14.
- **PD-11 `RECOMMEND` — ENGREAD-01: first task is a render probe, not a repair;** close as
  NOT-REPRODUCED if the render matches the API. Evidence §5.2.
- **PD-12 `RECOMMEND` — CARRY-07 target:** build once at HEAD, record the number, then set the
  budget to the measured value minus the reduction the plan actually achieves; do not write
  `476` into `.size-limit.json` before a build shows it. Evidence §7 (516.25 today).
- **PD-13 `RECOMMEND` — CARRY-08:** three SUMMARY.md files citing §9's checks; W4-E5 either
  unified (one key) or formally retired in the W4 summary. Evidence §9.

RESEARCH-102-END
