# Phase 100 — RESEARCH: the measurements, each with the command that reproduces it

Taken 2026-09-08 against staging `zkrcjzdemdmwhearhfgg` from repo HEAD `c9ef9bf4e`.
Every `psql` line below assumes the standard preamble, which is also every oracle's preamble:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test 2>/dev/null; set +a
```

`.env.test` is gitignored and is materialised into each task worktree by `.tickmarkr/config.yaml`'s
`setup` hook (`p99-worktree-test-env.sh`), which fails closed. Verified reachable:
`psql "$SUPABASE_DB_URL" -Atc "select current_user"` → `postgres`.

---

## §0 — Criterion → plan map

| # | Roadmap criterion | Plans |
| - | ----------------- | ----- |
| 1 | Every client-reachable `SECURITY DEFINER` view converted / restricted / justified; `unified_work_items` consumers still correct | 100-01, 100-02, 100-03, 100-04, 100-05 · re-proven 100-12 |
| 2 | No view exposes `auth.users` to `anon`/`authenticated` | 100-04 · re-proven 100-14 |
| 3 | No materialized view selectable by `anon`/`authenticated` | 100-06 · re-proven 100-12 |
| 4 | `intelligence_email_queue` + `events.idempotency_keys` policies match intent | 100-07 · re-proven 100-14 |
| 5 | Leaked-password protection on; 548 `search_path` functions pinned; advisors clean on these classes | 100-08 (functions) · re-proven 100-13 · 100-09 (Auth) |
| 6 | Sign-out clears client-side residue | 100-10 |
| 7 | Production builds do not ship verbatim sources without a written decision | 100-11 |
| — | Fresh post-landing re-proof of every per-object assertion | 100-12 (grants + invoker flags), 100-13 (function configuration + caller census), 100-14 (policy rows + criterion-2 state + the three behavioural reads) |
| — | Phase arithmetic, the register consuming all FOURTEEN predecessor summaries, and the operator sign-off | 100-15 |

**Fifteen plans, not twelve.** The CHECKER's 35 defects were 21 `absence-shaped` reshapes, and turning an
absence into an exact positive state adds acceptance items; two tasks crossed the six-item bound and
split rather than squeezed (`AMENDMENT-SET-MERGED.md` §How to apply, item 2). Round 3 kept the count at
fifteen: the additions it made (every-grantee ACL rendering, policy expressions, the identity digest,
the behavioural re-runs in P100-14) replaced weaker assertions in place rather than adding items.

## §1 — The class baselines (the numbers every oracle is calibrated against)

```bash
psql "$SUPABASE_DB_URL" -Atq <<'SQL'
select 'A views_total_public=' || count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v';
select 'B views_security_invoker_on=' || count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='v' and 'security_invoker=true' = any(coalesce(c.reloptions,'{}'));
select 'C views_client_selectable=' || count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='v' and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'));
select 'D mv_client_selectable=' || count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='m' and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'));
select 'E fn_mutable_searchpath=' || count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname in ('public','read_models','events') and p.prokind='f'
    and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search\_path=%')
    and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e');
select 'F client_views_touching_auth_users=' || count(distinct c.relname)
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  join pg_rewrite r on r.ev_class=c.oid
  join pg_depend d on d.objid=r.oid and d.classid='pg_rewrite'::regclass
  join pg_class t on t.oid=d.refobjid join pg_namespace tn on tn.oid=t.relnamespace
  where n.nspname='public' and c.relkind in ('v','m') and tn.nspname='auth' and t.relname='users'
    and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'));
select 'G rls_enabled_no_policy=' || count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where c.relkind='r' and c.relrowsecurity and n.nspname in ('public','events','read_models')
    and not exists (select 1 from pg_policy p where p.polrelid=c.oid);
SQL
```

**Verbatim output at HEAD, 2026-09-08:**

```
A views_total_public=33
B views_security_invoker_on=0
C views_client_selectable=33
D mv_client_selectable=12
E fn_mutable_searchpath=548
F client_views_touching_auth_users=2
G rls_enabled_no_policy=2
```

**End-state targets.** The per-object proofs are re-run fresh in wave 3 — **P100-12** (grants, invoker
flags), **P100-13** (function configuration, caller census), **P100-14** (policy rows, criterion-2
state, behavioural reads) — and only the arithmetic `A=33`, `B=12`, `C=12` is asserted globally, in
**P100-15** (D-30, D-37). `D`, `E`, `F` and `G` reaching zero is a consequence those per-object proofs
establish positively; the global zeros are printed as cross-check diagnostics and are not predicates.

## §2 — The advisor, and why the catalog may stand in for it

`mcp__supabase__get_advisors(zkrcjzdemdmwhearhfgg, security)` → 1272 lints:

| count | lint | level |
| ----- | ---- | ----- |
| 548 | `function_search_path_mutable` | WARN |
| 336 | `authenticated_security_definer_function_executable` | WARN |
| 334 | `anon_security_definer_function_executable` | WARN |
| 33 | `security_definer_view` | ERROR |
| 12 | `materialized_view_in_api` | WARN |
| 4 | `extension_in_public` | WARN |
| 2 | `auth_users_exposed` | ERROR |
| 2 | `rls_enabled_no_policy` | INFO |
| 1 | `auth_leaked_password_protection` | WARN |

The catalog queries in §1 return **548 / 33 / 12 / 2 / 2** for the five classes this phase owns — the
advisor's own numbers, to the unit. That agreement is the calibration; it is why a `psql` oracle inside a
worktree is a faithful stand-in for an advisor endpoint no worker can call (D-08). The 670
`*_security_definer_function_executable` warnings and the 4 `extension_in_public` warnings are named by
no criterion and are explicitly out of scope (`100-CONTEXT.md` §3).

## §3 — The 33 views, their disposition, and the census that proves it

Consumer census (`git grep`, tracked files only, instrument-controlled — the same probe returns 18 for
the known-present `from('dossiers')`, so a zero is a zero and not a broken sweep):

```bash
git grep -lI -e "from('<view>')" -e 'from("<view>")' -- 'frontend/src/**'
git grep -lI -e "from('<view>')" -e 'from("<view>")' -- 'backend/src/**' 'supabase/functions/**'
```

**CONVERT to `security_invoker=on` — 12 views with a caller that runs as `authenticated`:**

| view | caller | plan |
| ---- | ------ | ---- |
| `unified_work_items` | `frontend/src/hooks/{useDashboardTrends,useWidgetDashboard}.ts` (16 call sites) | 100-01 |
| `mous_frontend` | `frontend/src/pages/MoUs/MousPage.tsx` | 100-02 |
| `event_details` | `frontend/src/pages/events/EventsPage.tsx` (+ `backend/src/services/event.service.ts`) | 100-02 |
| `working_group_stats` | `frontend/src/hooks/useWorkingGroups.ts` | 100-02 |
| `theme_details` | `supabase/functions/themes/index.ts` | 100-03 |
| `relationship_health_summary` | `supabase/functions/relationship-health/index.ts` | 100-03 |
| `v_country_engagement_metrics` | `supabase/functions/geographic-visualization/index.ts` | 100-03 |
| `v_country_relationship_flows` | `supabase/functions/geographic-visualization/index.ts` | 100-03 |
| `v_regional_engagement_summary` | `supabase/functions/geographic-visualization/index.ts` | 100-03 |
| `engagement_recommendations_summary` | `supabase/functions/engagement-recommendations/index.ts` | 100-03 |
| `dossier_activity_timeline` | `supabase/functions/dossier-activity-timeline/index.ts` | 100-03 |
| `entity_comments_with_details` | `supabase/functions/entity-comments/index.ts` | 100-04 |

Each of those edge functions constructs its client from `SUPABASE_ANON_KEY` plus the request's
`Authorization` header — verified by grepping each file for `ANON_KEY` / `Authorization` — so it executes
as `authenticated`, and revoking `authenticated` would break it.

**RESTRICT (`REVOKE SELECT FROM anon, authenticated`) — 21 views with no application caller:**

`upcoming_milestones` (100-04, because it is also criterion 2) plus the 20 in 100-05:
`link_audit_logs_archival_eligible`, `citation_statistics`, `user_work_summary`, `ai_usage_summary`,
`user_ai_usage`, `audit_logs_active`, `ai_interaction_summary`, `intelligence_cache_status`,
`engagement_briefs`, `embedding_queue_stats`, `recent_field_changes`, `sla_compliance_by_assignee`,
`engagement_analytics`, `commitment_analytics`, `work_item_analytics`, `top_contributors`,
`user_digest_content_summary`, `v_dossier_extension_health`, `resolved_field_permissions`,
`stakeholder_timeline_unified`.

12 + 21 = 33. **P100-12** re-proves both grant populations and all twelve invoker flags fresh in wave 3;
**P100-15** asserts the arithmetic. The behavioural halves — every one of the twenty and twelve denied,
and the criterion-2/criterion-4 runtime paths — are re-run in **P100-05/06** and again in **P100-14**
(D-33).

## §4 — The criterion-1 census instrument (drilled at HEAD, RED, exit 1)

> **Converged in round 6 (P5-05).** The command below previously piped each `psql` into `tail` and
> validated `"$OWN$OTH"` and `"$NO$NT"` as single concatenated strings. Reproduced by the pass-5 seat:
> with **every** `psql` producer returning 2, it printed `P100-01-CENSUS owner=21 other=2` and `PASS`,
> **exit 0** — a green earned by nothing. The plans were swept of that class in round 5; this
> hand-authored section was not generator output and so was missed. It now uses the same two in-phase
> exemplars the plans use: **A1** (capture, take `$?` immediately, fail closed, then extract) for
> producer status, and **`100-11`'s per-field check** for multi-field validation.

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test 2>/dev/null; set +a
command -v psql >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: psql absent"; exit 3; }
[ -n "${SUPABASE_DB_URL:-}" ] || { echo "INSTRUMENT-CANNOT-RUN: SUPABASE_DB_URL unset — .env.test not materialised in this worktree"; exit 3; }

# A1: the producer is CAPTURED, its status taken IMMEDIATELY, and the value extracted only after.
resolve_uid() {
  RU_OUT=$(psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select id from auth.users where email = '$1'" 2>&1); RU_RC=$?
  RU=$(printf '%s' "$RU_OUT" | tail -1)
  [ "$RU_RC" = "0" ] || { echo "INSTRUMENT-CANNOT-RUN: the $2 identity lookup for $1 exited $RU_RC :: $RU_OUT"; exit 3; }
  case "$RU" in *[!0-9a-f-]*|"") echo "INSTRUMENT-CANNOT-RUN: the $2 identity ($1) did not resolve to a uuid (got [$RU])"; exit 3;; esac
}
census_count() {
  CC_OUT=$(printf 'begin;\nset local role authenticated;\nset local request.jwt.claims = %s;\nselect count(*) from %s;\ncommit;\n' \
    "'{\"sub\":\"$1\",\"role\":\"authenticated\"}'" "$2" | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 2>&1); CC_RC=$?
  CC=$(printf '%s' "$CC_OUT" | tail -1)
  if [ "$CC_RC" != "0" ]; then
    case "$CC_OUT" in
      *"permission denied for"*) echo "FAIL: the $3 caller is DENIED $2 — the read path this criterion depends on is gone"; exit 1;;
      *) echo "INSTRUMENT-CANNOT-RUN: the $3 census of $2 exited $CC_RC :: $CC_OUT"; exit 3;;
    esac
  fi
  case "$CC" in *[!0-9]*|"") echo "INSTRUMENT-CANNOT-RUN: the $3 census of $2 returned [$CC], not a count"; exit 3;; esac
}

# Per-field: each identity and each count is validated on its own, naming itself. The old
# case "$OWN$OTH" only caught BOTH empty — one empty and one valid passed.
resolve_uid kazahrani@stats.gov.sa owner;     OWN=$RU
resolve_uid test.user@gmail.com    non-owner; OTH=$RU
census_count "$OWN" unified_work_items owner;     NO=$CC
census_count "$OTH" unified_work_items non-owner; NT=$CC

echo "P100-01-CENSUS owner=$NO other=$NT expected owner=21 other=2"
[ "$NO" = "21" ] || { echo "FAIL: owner census $NO, expected 21 — the legitimate caller lost rows"; exit 1; }
[ "$NT" = "2" ]  || { echo "FAIL: non-owner census $NT, expected 2 — unified_work_items still bypasses RLS"; exit 1; }
echo "PASS"
```

**Drill 1 — armed instrument at HEAD (must be RED):**

```
P100-01-CENSUS owner=21 other=21 expected owner=21 other=2
FAIL: non-owner census 21, expected 2 — unified_work_items still bypasses RLS
exit=1
```

**Drill 2 — fail-closed branch, `.env.test` removed (must be exit 3, never 0):**

```
INSTRUMENT-CANNOT-RUN: SUPABASE_DB_URL unset — .env.test not materialised in this worktree
exit=3
```

**What makes it a check and not decoration.** `owner=21` is the positive control paired with the
`other=2` expectation: it proves in the same run that the session can see rows at all, so `other=2` is a
narrowed boundary rather than a dead connection. Both numbers are hardcoded literals, neither derived
from the call being graded. The identities are resolved from `auth.users` by **email at use time**, not
pinned as UUIDs at authoring time. The discriminating pair is explicit: the correct case is a non-owner
reading 2, and the neighbouring plausible-wrong case — a view whose definition changed but whose
`security_invoker` never took, or one converted and then re-granted — reads 21 and fails.

**The variable that would falsify it:** the number of `unified_work_items` rows visible to a caller who
owns none of them. **The value at which it breaks:** anything other than 2. **The false-clean case:**
an oracle asserting only `owner=21` would be green today, with the bypass fully intact.

**Post-conversion expectation, derived independently of the view:**

```bash
# the view's own UNION ALL body, run against the RLS-bearing base tables under each caller
begin; set local role authenticated;
set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}';
select count(*) from (
  select c.id from aa_commitments c where c.owner_user_id is not null
  union all select t.id from tasks t where t.is_deleted = false and t.assignee_id is not null
  union all select i.id from intake_tickets i where i.assigned_to is not null) x;
commit;
```
→ `kazahrani@stats.gov.sa` **21**, `test.user@gmail.com` **2**.

**Bound:** these are staging counts over 21 work items (10 commitments + 9 tasks + 3 intake, of which 21
pass the view's `WHERE`). Phase 102 purges fixture data and will move them; the re-deriving query above
travels with the number so the successor recomputes rather than guesses.

## §5 — Criterion 2: what the two views actually select

`pg_get_viewdef('public.entity_comments_with_details'::regclass, true)` — three `auth.users` joins,
selecting `u.email`, `u.raw_user_meta_data->>'full_name'`, `u.raw_user_meta_data->>'avatar_url'`, and a
`JOIN auth.users um` inside the `mentions` sub-select for `username` / `full_name`.
`pg_get_viewdef('public.upcoming_milestones'::regclass, true)` — one `JOIN auth.users u ON u.id =
pm.created_by`, selecting `u.email AS creator_email`.

`public.users` carries `id, email, username, full_name, avatar_url` — a column-for-column replacement:

**How readable is `public.users` itself?** (D-19 — the number an earlier draft carried with no query
behind it.) Run per identity:

```bash
printf 'begin;\nset local role authenticated;\nset local request.jwt.claims = %s;\nselect count(*) from public.users;\ncommit;\n' \
  "'{\"sub\":\"<uuid>\",\"role\":\"authenticated\"}'" | psql "$SUPABASE_DB_URL" -Atq | tail -1
```
→ `kazahrani@stats.gov.sa` **415**, `test.user@gmail.com` **415**. `public.users` carries RLS with 7
policies and both identities still read every row, so re-pointing a view at it removes an `auth.users`
exposure and narrows nothing about who can see a colleague's display name.


```bash
psql "$SUPABASE_DB_URL" -Atc "select column_name from information_schema.columns where table_schema='public' and table_name='users' order by ordinal_position" | head -8
```

## §6 — Criteria 3–7 baselines

**Criterion 3.** 12 materialized views, all client-selectable, zero frontend callers:

```bash
psql "$SUPABASE_DB_URL" -Atc "select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='m' order by 1"
# citation_network, aa_commitment_summary_by_dossier, sla_compliance_metrics, user_productivity_metrics,
# dossier_engagement_stats, dossier_commitment_stats, relationship_engagement_stats,
# relationship_commitment_stats, mv_tag_usage_analytics, team_entity_stats, dossier_list_mv,
# stakeholder_network_summary
```
`service_role` holds `SELECT` on all 12 (`has_table_privilege('service_role', …)` → true), so the four
with a backend caller are unaffected by the revocation.

**Criterion 4.**

```bash
psql "$SUPABASE_DB_URL" -Atc "select n.nspname||'.'||c.relname||' policies='||(select count(*) from pg_policy p where p.polrelid=c.oid)||' anon='||has_table_privilege('anon',c.oid,'SELECT')||' auth='||has_table_privilege('authenticated',c.oid,'SELECT')||' rows='||0 from pg_class c join pg_namespace n on n.oid=c.relnamespace where (n.nspname='public' and c.relname='intelligence_email_queue') or (n.nspname='events' and c.relname='idempotency_keys')"
```
→ `public.intelligence_email_queue policies=0 anon=t auth=t`, `events.idempotency_keys policies=0
anon=f auth=f`. Both hold 0 rows. Sole writer of the first:
`backend/src/adapters/intelligence/smtp-adapter.ts:16` via `supabaseAdmin`. The second has no tracked
application reader or writer outside `supabase/migrations/20260113400001_event_sourcing_infrastructure.sql`.

**Criterion 5 (functions).** `E=548` from §1; schema split `public 532 + read_models 9 + events 7`.

**Criterion 5 (Auth).** Drilled at HEAD:

```bash
set -a; . ./.env.test; set +a
EMAIL="p100-probe-$(date +%s)@example.com"
curl -s -w '\n%{http_code}' -X POST "$SUPABASE_URL/auth/v1/signup" -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"Pa55w0rd!\"}"
```
→ **HTTP 200 with an `access_token`**: the breached password was accepted and a user was created.
Cleanup, run and verified in the same session:
`DELETE $SUPABASE_URL/auth/v1/admin/users/<id>` → 200; re-GET → 404;
`select count(*) from auth.users where email like 'p100-probe-%@example.com'` → **0**.

**Criterion 6.**

```bash
git grep -nI "persist(" -- 'frontend/src/**'            # 5 sites, listed in 100-CONTEXT.md D-09
git grep -nI "localStorage.setItem(" -- 'frontend/src/**' | wc -l   # 48
git ls-files | grep -E 'services/auth\.(ts|tsx|js)$'    # empty — deleted in e6ac817f3 (Phase 97)
```

**Criterion 7.**

```bash
git grep -nI "sourcemap" -- frontend/vite.config.ts     # :141  sourcemap: true
find frontend/dist/assets -name '*.map' | wc -l         # 304
python3 -c "import json;d=json.load(open('frontend/dist/assets/engagements-BseIUqIr.js.map'));print(len(d['sourcesContent']))"   # 1 (populated)
```

## §7 — Roadmap numbers that did NOT reproduce

| roadmap claim | measured | command | verdict |
| ------------- | -------- | ------- | ------- |
| 12 materialized views | 12 | §1 `D` | **reproduced** |
| 548 mutable-`search_path` functions | 548 | §1 `E` | **reproduced** |
| 33 `SECURITY DEFINER` views (DBSEC-01) | 33 | §1 `A` | **reproduced** |
| 2 `auth.users`-exposing views | 2 | §1 `F` | **reproduced** |
| 6 persisted zustand stores | **5** | `git grep -nI "persist(" -- 'frontend/src/**'` | **NOT reproduced** — the sixth, `services/auth.ts`, was deleted in `e6ac817f3` (Phase 97). Criterion 6's named set is 5 stores + 2 raw writers = 7 keys. |
| `unified_work_items` queried from **10** frontend files | **2** files / 16 call sites | `git grep -nI "from('unified_work_items')" -- 'frontend/src/**'` | **NOT reproduced.** No population yields 10: files calling `.from()` = 2; files mentioning `unified_work` = 8; files importing any of the three hooks that query it = 9. The criterion is unaffected — it is satisfied by a caller-scoped row census, not a file count — but DBSEC-01's "10 frontend files" should be corrected to "2 frontend files, 16 call sites". |
| 305 `.map` files in `dist/assets` | **304** | `find frontend/dist/assets -name '*.map' \| wc -l` | **NOT reproduced at HEAD.** The roadmap dates its own measurement to `87b2d040e`; the on-disk tree is a stale build. Criterion 7 closes on a **fresh** build, so the count is evidence, not the claim. |
| ~415 `*@example.com` / `*@gastat.test` fixture accounts (Phase 102 criterion 1, quoted forward by an earlier draft of this phase) | **402** (338 + 64) | §9.9 | **NOT reproduced.** 415 is every row in `auth.users`, fixture and real alike — a different population. Recorded here so Phase 102 inherits the derived figure. |
| 207 frontend files rely on RLS as the only boundary (phase goal line) | **no derivation reproduces it** | `git grep -lI "from '@/lib/supabase'" -- 'frontend/src/**'` → 140; `git grep -lI "supabase.from(" -- 'frontend/src/**'` → 29; any `.from(` chain → 87 | **NOT reproduced.** The 2026-08-15 audit states 207 without a recorded query. It is a goal-line figure, not a criterion, so nothing in this phase depends on it — but it should not be quoted forward. |

## §8 — Not knowable from here

- Whether production's row counts match staging's. Every hardcoded count is a **staging** count.
- Whether any **untracked** consumer (a saved dashboard query, a BI tool, a Retool app) reads one of the
  21 revoked views. The census covers tracked repository sources only; that is its stated population.
- Whether pinning `search_path` on all 548 functions changes any function's behaviour. D-16 is the
  mitigation — pin in wave 2, re-run the criterion-1 census in wave 3 — not a proof of safety.
- Whether the operator has toggled leaked-password protection. The behavioural probe observes the
  **effect**; only the dashboard shows the setting, which is why 100-09 carries a human checkpoint.


## §9 — Derivations added for the AMENDMENT-SET-MERGED repair (2026-09-08)

Every constant the repaired oracles hardcode was produced by one of the commands below, run live.

### §9.1 — `psql` exit codes, so a read is CLASSIFIED rather than counted (D-18)

```bash
OUT=$(printf 'begin;\nset local role authenticated;\nset local request.jwt.claims = %s;\nselect count(*) from auth.users;\ncommit;\n' \
  "'{\"sub\":\"<non-owner-uuid>\",\"role\":\"authenticated\"}'" | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 2>&1); echo "rc=$?"
```
→ `rc=3` with `ERROR:  permission denied for table users`. The same shape against `unified_work_items`
→ `rc=0  out=21`. So **0 = answered, 3 = denied**, and anything else is an instrument fault that must
exit 3 rather than be reported as an application regression.

### §9.2 — SUPERSEDED BY §10.1 — the expected grant set after a revoke

> **⚠ SUPERSEDED. The current derivation is §10.1.** What follows filters grantees to `anon`,
> `authenticated` and `service_role`, which is exactly the defect checker pass 3 rejected as C2-01: a
> `GRANT … TO PUBLIC` is invisible to it. §10.1 renders **every** grantee and pairs it with
> `has_table_privilege`. Kept only so a reader arriving from an old reference lands on a redirection
> rather than on the superseded query. **Use §10.1.**

```bash
psql "$SUPABASE_DB_URL" -Atq -c "with a as (select c.relname, coalesce((select string_agg(pg_get_userbyid(x.grantee)||'='||x.privilege_type, ',' order by pg_get_userbyid(x.grantee), x.privilege_type) from aclexplode(c.relacl) x where pg_get_userbyid(x.grantee) in ('anon','authenticated','service_role')),'(none)') acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v') select count(*)||' views share shape: '||acl from a group by acl order by 1 desc"
```
→ **32 views** share one shape (anon + authenticated + service_role, eight privileges each, `MAINTAIN`
included); **1** (`event_details`) is authenticated-only. All **12** materialized views share the
32-view shape. The post-revoke target, hardcoded in P100-05, P100-06 and P100-12:

```
service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
```

Confirmed reachable: `events.idempotency_keys` renders exactly that string today.

**Why this is a positive observable and not a dressed-up zero:** the assertion is that `service_role`'s
eight privileges are PRESENT, per named relation, printed row by row. A probe returning nothing scores
0 of 20 and fails — it cannot pass by reading an empty result.

### §9.3 — The `dossier_list_mv` leak, which makes criterion 3 discriminating

Under a non-owner's claims, `select count(*) from dossier_list_mv` → **112**. Criterion 3's behavioural
arm therefore starts from a non-zero and must end denied — not a formality on an empty relation.

### §9.4 — SUPERSEDED BY §10.2 — the policy-row rendering and its counter control (D-21)

> **⚠ SUPERSEDED. The current derivation is §10.2.** The rendering below omits `polqual` and
> `polwithcheck`, so a policy of the right name with `USING (false)` passes it — checker pass 3's
> C2-02. §10.2 renders the whole seven-field row including both expressions. **Use §10.2.**

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select tablename||'|'||policyname||'|'||cmd||'|'||roles::text from pg_policies where schemaname='public' and tablename='tasks' order by policyname"
```
→ e.g. `tasks|Service role can manage all tasks|ALL|{service_role}`. The rows P100-07 must create,
matched whole on the pinned name:

```
public.intelligence_email_queue|p100_service_role_only|*|service_role
events.idempotency_keys|p100_service_role_only|*|service_role
```

Counter control: RLS-enabled tables in `public`/`events`/`read_models` carrying at least one policy →
**434** at HEAD. A run reading fewer exits 3.

### §9.5 — The per-schema `search_path` census (D-22)

```
schema=events      total=7    already_at_approved=0  pinned_other=0   unpinned=7
schema=public      total=575  already_at_approved=8  pinned_other=35  unpinned=532
schema=read_models total=9    already_at_approved=0  pinned_other=0   unpinned=9
```

548 unpinned + 43 pinned = 591 total. **End state: 556 approved, 35 elsewhere, 0 unpinned.** The 35 are
left alone deliberately; an oracle reading 591 approved would mean this phase re-pinned functions it was
told not to touch.

### §9.6 — The GoTrue rejection contract (D-23, D-24)

Two live calls, neither of which creates an account:

```bash
curl -s -w '\nHTTP=%{http_code}' -X POST "$SUPABASE_URL/auth/v1/signup" -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" -d '{"email":"<throwaway>","password":"ab"}'
```
→ `{"code":422,"error_code":"weak_password","msg":"Password should be at least 6 characters.","weak_password":{"reasons":["length"]}}` · `HTTP=422`

```bash
… -d '{"email":"<throwaway>","password":""}'
```
→ `{"code":400,"error_code":"validation_failed","msg":"Signup requires a valid password"}` · `HTTP=400`

A **password-policy** rejection is `422` / `weak_password` / `reasons[]`; a generic validation failure is
`400` / `validation_failed` — a different status. Matching `422` exactly excludes the 400, and a 429
rate-limit matches neither and exits 3.

The subject password `Pa55w0rd!` is 9 characters and passes the length policy — proven, because a
9-character strong password returns HTTP 200 today. A `422`/`weak_password` on it therefore cannot be a
length rejection, which is how the reasons check discriminates **without hardcoding a vendor constant
nobody has yet observed.**

**Three-arm drill at HEAD, cleanup verified on the failing path:**

```
P100-09-ARM1 detector_control     http=422 error_code=weak_password reasons_contain_length=YES   (green today)
P100-09-ARM2 availability_control http=200 created_uuid=df3dc9bc-…                               (green today)
P100-09-ARM3 subject              http=200                                                       (RED — accepted)
FAIL: the breached password Pa55w0rd! was ACCEPTED (http=200) - leaked-password protection is still off
exit=1 · residual p100 accounts: 0
```

### §9.7 — PARTLY SUPERSEDED BY §11.1 and §12.1 — the executed Vite config and the detector self-test

> **⚠ The config probe below is CURRENT** (D-26; it is what the shipped oracle runs). **The
> completeness half is SUPERSEDED**: its `index.html`-references-resolve check cannot tell a complete
> build from an internally consistent partial one, which is why §11.1 replaced it with the build's own
> manifest checked in both directions and §12.1 defined the exclusion population. That reference walk
> survives in the shipped oracle only as the round-6 **entry-document** check (P5-03), which is a
> different claim: that the application has an entry point at all. **Use §11.1 and §12.1 for
> completeness.**

```bash
cd frontend && node --input-type=module -e '
const { loadConfigFromFile } = await import("vite")
async function probe(sentry) {
  for (const k of ["SENTRY_ORG","SENTRY_PROJECT","SENTRY_AUTH_TOKEN"]) delete process.env[k]
  if (sentry) { process.env.SENTRY_ORG="o"; process.env.SENTRY_PROJECT="p"; process.env.SENTRY_AUTH_TOKEN="t" }
  const r = await loadConfigFromFile({ command: "build", mode: "production" }, "vite.config.ts", process.cwd())
  return JSON.stringify(r?.config?.build?.sourcemap) }
console.log("OFF=" + await probe(false)); console.log("ON=" + await probe(true))'
```
→ at HEAD `OFF=true`, `ON=true`. Required end state: `OFF=false`, `ON="hidden"`.

Detector self-test (a scratch dir holding one `.map` and one `.js` carrying a `sourceMappingURL`
comment) → `fixture_map_hits=1 fixture_ref_hits=1`; anything else exits 3.

Completeness invariant, replacing the unexplained `js>=100` floor:

```bash
node -e 'const fs=require("fs");const h=fs.readFileSync("frontend/dist/index.html","utf8");
const u=[...new Set([...h.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m=>m[1]))];
console.log(u.length+" "+u.filter(p=>fs.existsSync("frontend/dist"+p)).length)'
```
→ `17 17` at HEAD. A partial build makes `resolved < referenced` and exits 3.

### §9.8 — SUPERSEDED BY §10.6 — the browser-storage key census (D-10, D-25)

> **⚠ SUPERSEDED. The executable extractor is in §10.6, not here.** What follows is the round-2 census
> method note — `git grep` plus the words *"then, per file, extract"* — which returns FILES, not keys,
> and is exactly the `underived-number` defect checker pass 2 rejected. It is kept because a plan and a
> SUMMARY once pointed at it, so a reader arriving from an old reference must land on a redirection
> rather than on the broken tool. **Use §10.6.**

Definition: a *key* is a string literal passed to `localStorage.setItem/getItem/removeItem` or named in
a zustand `persist({name})`; a *key expression* is an identifier or template passed in that position.

```bash
git grep -lI 'localStorage' -- 'frontend/src/**'   # then, per file, extract literals and identifiers
```
→ **23 literal keys**, **22 identifier-bound key expressions**, at least one of which is a template
literal (`${STORAGE_KEY_PREFIX}${entityType}`). Static analysis therefore **cannot close** this
population: 23 is a lower bound, not a count. That is why criterion 6 is closed by an allowlist sweep
graded on exact equality, and why the phrase "roughly two dozen keys" appears in no acceptance item.

### §9.9 — The fixture-account population

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select 'example.com='||count(*) from auth.users where email like '%@example.com'"
psql "$SUPABASE_DB_URL" -Atq -c "select 'gastat.test='||count(*) from auth.users where email like '%@gastat.test'"
psql "$SUPABASE_DB_URL" -Atq -c "select 'total='||count(*) from auth.users"
```
→ `example.com=338`, `gastat.test=64`, **fixture accounts = 402**, `total=415`.

**`~415` was the wrong number for this population** — 415 is every row in `auth.users`, fixture and real
alike. Phase 102's criterion 1 quotes "~415 fixture accounts" and should read **402**; this phase
carries the residue with the derived figure and touches neither.


## §10 — Round-3 derivations (2026-09-08)

Every constant the round-3 repairs hardcode, with the command that produced it.

### §10.1 — The FULL grant set, every grantee rendered (D-32)

The round-2 reader filtered grantees to three roles, so a `GRANT … TO PUBLIC` was invisible. Unfiltered:

```bash
psql "$SUPABASE_DB_URL" -Atq -c "with a as (select c.relname, c.relkind, coalesce((select string_agg(case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end||'='||x.privilege_type, ',' order by case when x.grantee=0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end, x.privilege_type) from aclexplode(c.relacl) x),'(null-acl)') acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('v','m')) select relkind::text||' count='||count(*)||' :: '||acl from a group by relkind, acl order by count(*) desc"
```

→ 32 views and 12 materialized views share one shape (`anon` + `authenticated` + **`postgres`** +
`service_role`, eight privileges each); `event_details` is the authenticated-only outlier. **No PUBLIC
grant exists today** — which is exactly why the reader must render it: its absence is a fact to be
checked, not assumed. The post-revoke target now hardcoded:

```
postgres=DELETE,…,postgres=UPDATE,service_role=DELETE,…,service_role=UPDATE
```

paired with `has_table_privilege('anon'|'authenticated', …, 'SELECT') = false`, which additionally
catches a grant inherited through role membership that no ACL row would show.

### §10.2 — The seven-field policy row (D-34)

```bash
psql "$SUPABASE_DB_URL" -Atq -c "select n.nspname||'.'||c.relname||'|'||p.polname||'|'||(case when p.polpermissive then 'PERMISSIVE' else 'RESTRICTIVE' end)||'|'||p.polcmd::text||'|'||coalesce((select string_agg(pg_get_userbyid(r),',' order by pg_get_userbyid(r)) from unnest(p.polroles) r),'-')||'|'||coalesce(pg_get_expr(p.polqual,p.polrelid),'-')||'|'||coalesce(pg_get_expr(p.polwithcheck,p.polrelid),'-') from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='tasks' and p.polname='Service role can manage all tasks'"
```
→ `public.tasks|Service role can manage all tasks|PERMISSIVE|*|service_role|true|true`

The rows P100-07 must create, matched whole, with **exactly two** policies tolerated across the pair:

```
public.intelligence_email_queue|p100_service_role_only|PERMISSIVE|*|service_role|true|true
events.idempotency_keys|p100_service_role_only|PERMISSIVE|*|service_role|true|true
```

A policy of the right name with `USING (false)` renders `false` and fails — the mutation a
name-and-roles match let through.

### §10.3 — The 35-signature identity digest (D-36)

```bash
psql "$SUPABASE_DB_URL" -Atq -c "with f as (select p.oid::regprocedure::text sig, n.nspname, (select x from unnest(coalesce(p.proconfig,'{}')) x where x like 'search\_path=%') cfg from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','read_models','events') and p.prokind='f' and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')), o as (select sig, cfg from f where cfg is not null and cfg <> (case nspname when 'public' then 'search_path=public, pg_temp' else 'search_path='||nspname||', public, pg_temp' end)) select 'other_bucket_count='||count(*)||' digest='||md5(string_agg(sig||'=>'||cfg, chr(10) order by sig)) from o"
```
→ `other_bucket_count=35 digest=a10d3e1256979bf019d8a9b68c959cb8`

A balanced swap keeps 556/35/0/591 and changes this digest.

### §10.4 — The three Auth probe passwords, all run and recorded (D-31)

| arm | password | length | result at HEAD |
| --- | -------- | -----: | -------------- |
| ARM 1 discrimination control | `Qx7z!` | 5 | `{"code":422,"error_code":"weak_password","msg":"Password should be at least 6 characters.","weak_password":{"reasons":["length"]}}` · HTTP 422 |
| ARM 2 availability control | `Kv7#tRq2W` | **9** | HTTP 200, account created, uuid resolved |
| ARM 3 subject | `Pa55w0rd!` | **9** | HTTP 200 — accepted, so RED |
| (contrast, derived) | `""` | 0 | `{"code":400,"error_code":"validation_failed",…}` · HTTP 400 |

The control and the subject are now **the same length**, so the pair differs only in being breached; the
round-2 control was 27 characters. Every probe account was deleted and `auth.users` re-queried to 0.

**Three-arm drill at HEAD, with the finalizer on the FAILING path:**

```
P100-09-ARM1 discrimination_control len=5 http=422 error_code=weak_password reasons=[length] msg="Password should be at least 6 characters."
P100-09-ARM2 availability_control  len=9 http=200 created_uuid=7a5071f3-9649-410c-8e6b-1e9d7dd06944
P100-09-ARM3 subject               len=9 http=200 error_code= reasons=[] msg=""
FAIL: the breached password was ACCEPTED (http=200) - leaked-password protection is still off
P100-09-FINALIZE created=[ p100-ctl-…@example.com p100-pwned-…@example.com ]
  LIFECYCLE …ctl…   uuid=7a5071f3-… seen_before_delete=yes delete_http=200 refetch_http=404 catalog_after='<absent>'
  LIFECYCLE …pwned… uuid=7f54f8f6-… seen_before_delete=yes delete_http=200 refetch_http=404 catalog_after='<absent>'
exit=1 · residual p100 = 0
```

**The residual bound (D-31):** ARM 3 asserts 422 / `weak_password` / exactly one reason that is not
`length` / a message distinct from ARM 1's. It does **not** assert the leaked-password reason itself,
because that string is not observable while the setting is off. See D-31.

### §10.5 — Build completeness from the build's own manifest (D-35)

`vite build --manifest` on this app, then:

```bash
node -e 'const fs=require("fs");const m=JSON.parse(fs.readFileSync("frontend/dist/.vite/manifest.json","utf8"));
const named=new Set();for(const x of Object.values(m)){if(x.file)named.add(x.file);for(const c of x.css||[])named.add(c);for(const a of x.assets||[])named.add(a)}
const disk=fs.readdirSync("frontend/dist/assets").filter(f=>/\.(js|css)$/.test(f));
console.log(Object.keys(m).length+" "+named.size+" "+disk.length+" "+disk.filter(f=>!named.has("assets/"+f)).length+" "+[...named].filter(f=>!fs.existsSync("frontend/dist/"+f)).length)'
```
→ `473 478 312 0 0` — 473 entries naming 478 files, 312 js/css on disk, **0 orphans, 0 ghosts**.

Whole-tree freshness (every file, not one):

```bash
find frontend/dist -type f ! -newer frontend/vite.config.ts | wc -l     # must be 0
```
→ 0 after a build; **4584** with the config touched. The whole tree's mtimes span **2.1 s**, which is
what makes "one build invocation" a checkable property.

**Drilled failure paths:** config newer than the tree → exit 3 (4584 files predate it); one orphan file
injected into `assets/` → `on_disk_not_named=1`, exit 1; restored → exit 0.

### §10.6 — The executable browser-storage key extractor (D-10)

Round 2 recorded `git grep -lI 'localStorage'` followed by the prose *"then, per file, extract"*. That
returns files, not keys. The extractor, verbatim and runnable:

```js
// node --input-type=module, from the repository root
import { execSync } from 'node:child_process'; import { readFileSync } from 'node:fs'
const files = execSync("git grep -lI 'localStorage' -- 'frontend/src/**'", {encoding:'utf8'}).trim().split('\n')
const LIT = /localStorage\.(?:setItem|getItem|removeItem)\(\s*['"`]([^'"`]+)['"`]/g
const PERSIST = /name:\s*['"]([^'"]+)['"]/g
const EXPR = /localStorage\.(?:setItem|getItem|removeItem)\(\s*([A-Za-z_$][\w$]*|`[^`]*`)\s*[,)]/g
const lit = new Set(), expr = new Set()
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(LIT)) lit.add(m[1])
  if (/persist\(/.test(s)) for (const m of s.matchAll(PERSIST)) lit.add(m[1])
  for (const m of s.matchAll(EXPR)) expr.add(m[1])
}
console.log('files_scanned=' + files.length)
console.log('literal_keys=' + lit.size)
console.log('key_expressions=' + expr.size)
console.log('LITERALS: ' + [...lit].sort().join(' '))
console.log('EXPRESSIONS: ' + [...expr].sort().join(' '))
```

**Enumerated output, 2026-09-08:**

```
files_scanned=52
literal_keys=23
key_expressions=21
LITERALS: ${STORAGE_KEY_PREFIX}${entityType} access_token auth-storage calendar_oauth_provider
  calendar_oauth_state colorMode dossier-create-country dossier-create-draft dossier-create-organization
  dossier-store dossier-wizard:guidance:country:basic dossier-wizard:guidance:person:review i18nextLng
  id.classif id.locale pinned-entities-storage recent_dossiers_for_work_creation sidebar_state
  supabase.auth.token theme theme-preference ui-storage user-preferences
EXPRESSIONS: CMDK_USAGE_KEY FIRST_RUN_DISMISSED_KEY LOCAL_SETTINGS_KEY OLD_DRAFT_KEY
  ONBOARDING_COMPLETED_KEY ONBOARDING_SEEN_KEY PREVIEW_DISMISSED_KEY RECENT_ITEMS_KEY SEARCH_HISTORY_KEY
  SIDEBAR_STORAGE_KEY STORAGE_KEY TOUR_DISMISSED_KEY TOUR_ENABLED_KEY TOUR_STORAGE_KEY WIPE_GUARD_KEY
  `${STORAGE_KEY_PREFIX}${entityType}` draftKey fullStorageKey key newKey storageKey
```

**23 is a LOWER BOUND, demonstrably:** one "literal" is itself a template
(`${STORAGE_KEY_PREFIX}${entityType}`), and `STORAGE_KEY` alone binds to different values in
`useQueueFilters`, `useRolePreference`, `useRecentNavigation`, `useWidgetDashboard`, `DossierPicker` and
`preference-storage`. Static analysis cannot close this population — which is the whole argument for a
seam over a list.


## §11 — Round-4 derivations (2026-09-09)

### §11.1 — The complete emitted tree, and the derived population that replaces `>=400`

> **Exclusion rule superseded by §12.1 (corrected here in round 6, P5-05).** The snippet below
> originally exempted the whole `.vite/` subtree (`!f.startsWith(".vite/")`). §12.1 narrowed that to
> the single path `.vite/manifest.json`, and the shipped oracle enforces the narrow rule — a stray
> `.vite/p100-stray.json` is now an orphan, drilled. The line below is corrected to match what ships,
> so this section cannot be pasted as a runnable instrument that disagrees with the plan. **§12.1 is
> the authority for the exclusion population.**

Round 3 bounded build completeness with `entries >= 400` and a reverse walk over top-level
`assets/*.{js,css}`. Checker pass 3 rejected both: the floor admits *"a freshly built, internally
consistent subset of the recorded 473-entry graph"*, and the JS/CSS filter lets an orphan image or font
through. The replacement is an exact bidirectional set comparison over the **whole** tree.

**The rule for "build-emitted", derived rather than guessed by file type:** a file under `dist/` is
build-emitted unless it is a copy of `frontend/public/<same relative path>`, a `.map`, `index.html`, or
the manifest itself. Verified: `frontend/public/assets/flags/ac.svg` exists, which is why 3,722
`assets/flags/*.svg` files are static copies and not orphans — a file-type filter would have had to
special-case them, and a `public/` lookup does not.

```bash
node -e 'const fs=require("fs"),path=require("path");
const m=JSON.parse(fs.readFileSync("frontend/dist/.vite/manifest.json","utf8"));
const named=new Set();for(const x of Object.values(m)){if(x.file)named.add(x.file);for(const c of x.css||[])named.add(c);for(const a of x.assets||[])named.add(a)}
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);e.isDirectory()?walk(f,out):out.push(path.relative("frontend/dist",f))}return out}
const all=walk("frontend/dist");
const emitted=all.filter(f=>!f.endsWith(".map") && f!=="index.html" && f!==".vite/manifest.json" && !fs.existsSync("frontend/public/"+f));
console.log(Object.keys(m).length, named.size, emitted.length,
            emitted.filter(f=>!named.has(f)).length, [...named].filter(f=>!fs.existsSync("frontend/dist/"+f)).length)'
```

**Measured, 2026-09-09:** `473 478 478 0 0` — 473 manifest entries naming 478 files, 478 build-emitted
files on disk, **0 orphans, 0 ghosts**. Whole-tree totals: 4,280 files, of which 3,800 are `public/`
copies.

**The count is STABLE across the change this phase makes**, which is what licenses hardcoding it: built
with `--sourcemap false` the manifest still declares **473** entries naming **478** files while
`map_files` falls to **0**. Maps are emitted artifacts but not manifest entries, so disabling them moves
the diagnostics and not the population.

**Drilled failure paths:**

| mutation | result |
| -------- | ------ |
| one orphan `assets/p100-orphan.png` (a non-JS/CSS file, invisible to round 3) | `orphans=1`, exit 1 |
| manifest truncated to 420 entries (a self-consistent partial build, admitted by `>=400`) | `FAIL: the manifest declares 420 entries, not the 473 this app emits`, exit 1 |
| `frontend/vite.config.ts` touched so the tree predates it | `INSTRUMENT-CANNOT-RUN: 4584 file(s) … predate`, exit 3 |
| restored | exit 0 |

### §11.2 — Why `count_refs` was RESTRUCTURED, not given another status check

Checker pass 3's falsification: *"a substituted `find` emitted one readable filename and returned 2;
`count_refs` returned 0 and counted 1. Traversal failure is still discarded."*

The cause is structural. `count_refs` fed its loop from a **here-document whose body was a command
substitution**:

```sh
done <<EOF
$(find "$1" -name '*.js' -type f 2>/dev/null)
EOF
```

A command substitution expanded to build a here-document body **constructs a redirection**; it is not a
command in the shell's control flow, so **there is no `$?` to test**. Three rounds of "add a status
check" could not close the clause because the thing to check did not exist. `count_maps` in the same
oracle had always checked `CM_RC` — status was propagated at every site where it was *possible*.

The fix gives `count_refs` `count_maps`'s shape — capture, test, then iterate:

```sh
count_refs() { CR_OUT=$(find "$1" -name '*.js' -type f 2>/dev/null); CR_RC=$?
  [ "$CR_RC" = "0" ] || { echo "INSTRUMENT-CANNOT-RUN: find over $1 exited $CR_RC …"; exit 3; }
  … iterate over $CR_OUT with IFS set to newline, checking each grep status … }
```

**Re-drilled with the checker's own falsification** (`find()` shadowed to print one filename and return
2): `INSTRUMENT-CANNOT-RUN: find over frontend/dist/assets exited 2 …`, **exit 3**. Round 3 returned 0
and counted 1 on that input.

The fixture self-test also now asserts `fixture_js_visited=2`, so a traversal that silently yields fewer
files than the fixture holds is caught before any real count is interpreted.

### §11.3 — The retained service-role read (P100-C10, C12, C13)

A grant row says what the catalog permits; only a read says what the role gets. Derived:

```bash
printf 'begin;\nset local role service_role;\nselect count(*) from %s;\ncommit;\n' "<relation>" \
  | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1
```

→ `citation_statistics` **0** (rc 0), `dossier_list_mv` **112** (rc 0), `intelligence_email_queue` **0**
(rc 0). `dossier_list_mv` is the useful arm: **112** is the same non-zero count a non-owner could read
at HEAD, so after the revocation it proves the rows are still there for the role the backend uses, while
`authenticated` is denied. An over-reaching `REVOKE ALL … FROM anon, authenticated, service_role` fails
this arm at runtime instead of being inferred from a grant row.

### §11.4 — `events.idempotency_keys`' grant set (P100-C14)

Round 3 rendered only the queue's ACL. Both are now rendered and matched whole:

```
public.intelligence_email_queue :: postgres=…,service_role=… anon=false auth=false
events.idempotency_keys         :: postgres=…,service_role=… anon=false auth=false
```

Measured at HEAD, `events.idempotency_keys` **already** renders exactly that — this phase never revokes
it, so its row is a **no-regression arm**: it passes today and fails if a migration touches a table whose
intent is that nothing about its grants changes.


## §12 — Round-5 derivations (2026-09-09)

### §12.1 — The build-inventory exclusion population, defined and counted (P4-02)

Round 4 exempted the whole `.vite/` subtree without saying so. The exclusions are now **enumerated with
a named reason each**, counted, and printed by the oracle every run; a file excluded for no named reason
is an instrument fault (`exit 3`), so the population cannot quietly widen.

| exclusion | reason | count |
| --------- | ------ | ----: |
| `*.map` | sourcemaps are emitted artifacts but are never manifest entries | 0 (after the fix; 304 before) |
| `index.html` | the entry document is emitted but is not a manifest entry | 1 |
| `.vite/manifest.json` | the manifest cannot name itself | 1 |
| same-path copy of `frontend/public/` | static passthrough, not build output | 3800 |
| **unclassified** | — | **0** |

**The `.vite/` exemption is now exactly one path.** Drilled with the checker's own mutation — a stray
`.vite/p100-stray.json` — which round 4 exempted and which now reports
`orphans=1 … ORPHANS: .vite/p100-stray.json`, **exit 1**.

Totals unchanged and re-verified: `473 478 478 0 0`, 4,280 dist files, 3,802 excluded.

### §12.2 — The producer-status class sweep, measured

`python3 .tickmarkr/overseer/p100/producer-status-census.py`

| shape | before | after | note |
| ----- | -----: | ----: | ---- |
| A — producer piped into `tail`/`head`/`wc` | 15 occurrences / 11 plans | **2 / 1 plan** | both remaining are `100-11`'s config-oracle value extractions from an already-captured variable — the **benign exemplar**, explicitly not to be touched |
| B — two independently-failable fields concatenated | 21 / 13 plans | **0** | — |
| C — command substitution in a here-doc body | 0 | **0** | stayed 0, as required |

Repaired at the **template** level in shared helpers, not site by site: `SAFE_DB` (`DBQ`,
`resolve_uid`, `census_count`, `COUNT1`) replaced the three shape-A templates; `resolve_uid` and the
per-field validations replaced the three shape-B templates.

**Drills, four directions.** (1) The repaired helpers pass live: `OWN`/`OTH` resolve, censuses return
21/21, view count 33. (2) A bad **non-owner** email now exits 3 naming *which* identity failed —
`INSTRUMENT-CANNOT-RUN: the non-owner identity (…) did not resolve to a uuid` — where the concatenated
test passed with one field valid. (3) A dead database mid-run exits 3 with the producer's rc and text
instead of tailing an error message into a value. (4) The census still **fires** on synthetic shape-A
and shape-B sites injected into a scratch copy, so its zeros are trustworthy.

### §12.3 — The census's own discrimination control is now dead, and why that is expected

`producer-status-census.py` refuses to print unless it finds shape B in `100-01` and `100-12`, the two
sites pass-4 proved by drill. **Both are repaired, so the control now reports
`INSTRUMENT IS BLIND` and the script exits 1.** That is the control's calibration going stale on
success, not the census failing — and the script's own `CENSUS_DRILL=1` flag exists for exactly this,
which is how the after-numbers above were read.

**This is recorded as a bound, not repaired** (round-5 stopping condition: after pass 5 an
instrument-quality finding is recorded and carried). The precise bound:

> The producer-status census's discrimination control is calibrated against two sites that this round
> repaired. It can no longer distinguish "the phase is clean" from "the regex is broken", so its zero
> is trustworthy only alongside drill (4) above — the synthetic-bad-site run — which must be repeated
> whenever the census is re-run for a verdict. Re-calibrating it requires a site that is defective *by
> construction*, which no longer exists in this phase.

### §12.4 — Severity composition in the Auth writer (pass-4 out-of-scope 1)

`verdict()` tested the finalizer's severity before its own argument, so a primary-path instrument
failure (`verdict 3`) arriving with a dirty-but-measurable cleanup (`FIN_RC=1`) exited **1**. The two
severities are now combined so that **3 dominates 1 dominates 0**, compared **per operand** rather than
by concatenating them — concatenation being the shape this round removed everywhere else. Drilled:

```
requested=1 finalizer=3 -> 3      requested=3 finalizer=1 -> 3
requested=1 finalizer=0 -> 1      requested=0 finalizer=0 -> 0
requested=3 finalizer=3 -> 3      requested=0 finalizer=3 -> 3
```
