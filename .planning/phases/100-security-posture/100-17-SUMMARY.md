---
phase: 100-security-posture
plan: 17
status: complete
completed: 2026-09-10
requirements: [DBSEC-03]
---

# P100-17: invoker-consumed materialized views

## Result

The five materialized views are no longer directly accessible to `anon` or `authenticated`. Their six
named invoker consumers and the new relationship-health RPC execute as `SECURITY DEFINER` with
`search_path` pinned to exactly `public`. The edge function was deployed successfully before either
migration apply, both applies exited 0, and all three real-user controls passed after the revoke.

## Planning-bound census

At `2026-09-10T16:24:07Z`, I queried `pg_proc.prosrc`, `pg_get_viewdef` and `pg_trigger` for each of the
five names, then swept `backend/src/**` for each name and for `from('dossiers')` as a positive control.
The catalog portion used three CTEs with the same five-name `VALUES` list and emitted every matching
function, view, and trigger. The source portion used this loop:

```sh
for n in user_productivity_metrics relationship_engagement_stats relationship_commitment_stats citation_network aa_commitment_summary_by_dossier; do
  hits=$(git grep -nI "$n" -- 'backend/src/**' 2>/dev/null || true)
  count=$(printf '%s\n' "$hits" | sed '/^$/d' | wc -l | tr -d ' ')
  echo "$n backend/src hits=$count"
  test -z "$hits" || printf '%s\n' "$hits"
done
control=$(git grep -nI "from('dossiers')" -- 'backend/src/**' 2>/dev/null || true)
```

Verbatim successful output:

```text
CENSUS_UTC=2026-09-10T16:24:07Z
FUNCTION|aa_commitment_summary_by_dossier|refresh_aa_commitment_summary()|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|get_citation_network_graph(citation_source_type,uuid,integer,integer)|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|get_entity_citations(citation_source_type,uuid,text,boolean,integer)|owner=postgres|secdef=false|config=<none>
FUNCTION|citation_network|refresh_citation_network_on_change()|owner=postgres|secdef=false|config=<none>
FUNCTION|relationship_commitment_stats|refresh_relationship_health_stats()|owner=postgres|secdef=false|config=<none>
FUNCTION|relationship_engagement_stats|refresh_relationship_health_stats()|owner=postgres|secdef=false|config=<none>
FUNCTION|user_productivity_metrics|get_team_workload(uuid)|owner=postgres|secdef=true|config=search_path=public
FUNCTION|user_productivity_metrics|get_user_productivity_metrics(uuid)|owner=postgres|secdef=false|config=<none>
FUNCTION|user_productivity_metrics|refresh_user_productivity_metrics()|owner=postgres|secdef=true|config=<none>
VIEW|relationship_commitment_stats|public.relationship_health_summary|kind=v|owner=postgres|options=security_invoker=true
VIEW|relationship_engagement_stats|public.relationship_health_summary|kind=v|owner=postgres|options=security_invoker=true
TRIGGER|citation_network|trigger_refresh_citation_network|table=entity_citations|function=refresh_citation_network_on_change()|CREATE TRIGGER trigger_refresh_citation_network AFTER INSERT OR DELETE OR UPDATE ON entity_citations FOR EACH STATEMENT EXECUTE FUNCTION refresh_citation_network_on_change()
BACKEND_SWEEP
user_productivity_metrics backend/src hits=3
backend/src/types/database.types.ts:32889:      user_productivity_metrics: {
backend/src/types/database.types.ts:36484:      get_user_productivity_metrics: {
backend/src/types/database.types.ts:37254:      refresh_user_productivity_metrics: { Args: never; Returns: undefined }
relationship_engagement_stats backend/src hits=6
backend/src/types/database.types.ts:11199:            referencedRelation: "relationship_engagement_stats"
backend/src/types/database.types.ts:23075:            referencedRelation: "relationship_engagement_stats"
backend/src/types/database.types.ts:23153:            referencedRelation: "relationship_engagement_stats"
backend/src/types/database.types.ts:23246:            referencedRelation: "relationship_engagement_stats"
backend/src/types/database.types.ts:31619:            referencedRelation: "relationship_engagement_stats"
backend/src/types/database.types.ts:32180:      relationship_engagement_stats: {
relationship_commitment_stats backend/src hits=6
backend/src/types/database.types.ts:11192:            referencedRelation: "relationship_commitment_stats"
backend/src/types/database.types.ts:23068:            referencedRelation: "relationship_commitment_stats"
backend/src/types/database.types.ts:23146:            referencedRelation: "relationship_commitment_stats"
backend/src/types/database.types.ts:23239:            referencedRelation: "relationship_commitment_stats"
backend/src/types/database.types.ts:31612:            referencedRelation: "relationship_commitment_stats"
backend/src/types/database.types.ts:32050:      relationship_commitment_stats: {
citation_network backend/src hits=3
backend/src/types/database.types.ts:5179:            referencedRelation: "citation_network"
backend/src/types/database.types.ts:31270:      citation_network: {
backend/src/types/database.types.ts:34532:      get_citation_network_graph: {
aa_commitment_summary_by_dossier backend/src hits=2
backend/src/types/contact-directory.types.ts:6745:      aa_commitment_summary_by_dossier: {
backend/src/types/database.types.ts:31159:      aa_commitment_summary_by_dossier: {
control from('dossiers') backend/src hits=12
backend/src/ai/agents/chat-assistant.ts:174:        .from('dossiers')
backend/src/ai/agents/chat-assistant.ts:187:          .from('dossiers')
backend/src/ai/agents/chat-assistant.ts:218:          .from('dossiers')
backend/src/ai/agents/chat-assistant.ts:252:      .from('dossiers')
backend/src/ai/agents/chat-assistant.ts:362:      .from('dossiers')
backend/src/ai/agents/intake-linker.ts:269:        .from('dossiers')
backend/src/api/elected-officials.ts:246:        .from('dossiers')
backend/src/api/elected-officials.ts:305:        await supabaseAdmin.from('dossiers').delete().eq('id', dossier.id)
backend/src/api/elected-officials.ts:373:          .from('dossiers')
backend/src/jobs/reembed-rag-chunks.ts:161:    .from('dossiers')
backend/src/services/brief.service.ts:375:        .from('dossiers')
backend/src/services/brief.service.ts:422:        .from('dossiers')
CENSUS_EXIT=0
```

This bounded population contains no unnamed invoker consumer. `get_team_workload(uuid)` was already
definer+pinned. `refresh_user_productivity_metrics()` was already a definer refresh helper, not a caller
path newly privileged by this change; P100-08 owns the later whole-catalog pin. All backend matches are
generated types, while the 12-hit control demonstrates that the sweep would find real query code.

## Changed hunks

- `supabase/migrations/20260910000002_p100_matview_invoker_consumers_definer.sql:1-23` uses only `ALTER
  FUNCTION` for the exact six existing signatures, so neither bodies nor signatures change; each gains
  `SECURITY DEFINER SET search_path = public`.
- Migration lines 25-35 create `get_relationship_health_summary()` with the same row shape (`SETOF
  public.relationship_health_summary`), as a SQL definer pinned to `public`, revoke its default PUBLIC
  execute privilege, and grant execute only to `authenticated` and `service_role`.
- Migration lines 37-41 are the final statements and contain exactly five `REVOKE ALL ... FROM anon,
  authenticated` statements, one for each owned materialized view and no other relation.
- `supabase/functions/relationship-health/index.ts:428-431` and `:499` are the only read changes: the
  single and list GET paths now call `.rpc('get_relationship_health_summary')`. Their `.eq`, `.single`,
  optional score/trend filters, ordering and range remain unchanged. The caller-JWT client construction
  at lines 331-339 is unchanged, the calculate-path read at line 586 stays caller-scoped as required,
  and every other read is untouched.

## Deployment, then two migration applies

The first CLI invocation at `16:24:56Z` exited 1 before bundling because its telemetry writer attempted
to create `/Users/khalidalzahrani/.supabase/telemetry.json.tmp...`, which the isolated worker cannot
write. No deployment or database mutation occurred. I retried with `DO_NOT_TRACK=1` and
`SUPABASE_TELEMETRY_DISABLED=true`.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH" DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true \
  supabase functions deploy relationship-health --project-ref zkrcjzdemdmwhearhfgg
```

Verbatim successful deploy output, before both applies:

```text
DEPLOY_RETRY_START_UTC=2026-09-10T16:25:21Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: relationship-health
v1.74.3: Pulling from supabase/edge-runtime
53bb9e501f18: Pulling fs layer
3e670bfdcea2: Pulling fs layer
8b416f0d3cb0: Pulling fs layer
c1edd9f13184: Pulling fs layer
77894e562abe: Pulling fs layer
ffd00fe4cb58: Pulling fs layer
2ffb03c6445e: Download complete
53bb9e501f18: Download complete
c1edd9f13184: Download complete
3e670bfdcea2: Download complete
53bb9e501f18: Pull complete
8b416f0d3cb0: Download complete
c1edd9f13184: Pull complete
8b416f0d3cb0: Pull complete
77894e562abe: Download complete
77894e562abe: Pull complete
ffd00fe4cb58: Download complete
ffd00fe4cb58: Pull complete
3e670bfdcea2: Pull complete
Digest: sha256:c52405002a890ca9fcf77978671c57f3a988e03174afb277f84ac65bc917013c
Status: Downloaded newer image for public.ecr.aws/supabase/edge-runtime:v1.74.3
public.ecr.aws/supabase/edge-runtime:v1.74.3
Deploying Function: relationship-health (script size: 738 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
DEPLOY_RETRY_END_UTC=2026-09-10T16:25:51Z
DEPLOY_RETRY_EXIT=0
```

Both applies used:

```sh
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260910000002_p100_matview_invoker_consumers_definer.sql
```

Verbatim output:

```text
APPLY_1_START_UTC=2026-09-10T16:26:04Z
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY_1_END_UTC=2026-09-10T16:26:06Z
APPLY_1_EXIT=0
APPLY_2_START_UTC=2026-09-10T16:26:06Z
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
ALTER FUNCTION
CREATE FUNCTION
REVOKE
GRANT
REVOKE
REVOKE
REVOKE
REVOKE
REVOKE
APPLY_2_END_UTC=2026-09-10T16:26:08Z
APPLY_2_EXIT=0
```

## Command oracle 1: complete grants

Verbatim output from the plan command:

```text
P100-17-GRANTS named=5 rendered=5 at_expected_full_state=5 expected rendered=5 at_expected_full_state=5
  GRANTS aa_commitment_summary_by_dossier | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS citation_network | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_commitment_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS relationship_engagement_stats | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
  GRANTS user_productivity_metrics | anon_can_select=false authenticated_can_select=false service_role_can_select=true | postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
PASS grants
```

Every view renders all grants, including `MAINTAIN`, and has the three authoritative
`has_table_privilege` answers alongside it. The five requested names rendered five rows; the non-zero
control is `service_role_can_select=true` on all five.

## Command oracle 2: definer and pin

The plan command itself contains two formatting errors: PostgreSQL renders concatenated booleans as
`true`, not `t`, and the selected `proconfig` value is already `search_path=public`, but the command
prefixes it with another `search_path=`. Therefore its final grep cannot match a legitimate row.
Its verbatim output is retained here rather than disguised:

```text
P100-17-DEFINER functions=7 definer_and_pinned=0 expected 7 and 7
  FN get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id uuid, p_depth integer, p_max_nodes integer) secdef=true search_path=search_path=public
  FN get_entity_citations(p_entity_type citation_source_type, p_entity_id uuid, p_direction text, p_include_external boolean, p_limit integer) secdef=true search_path=search_path=public
  FN get_relationship_health_summary() secdef=true search_path=search_path=public
  FN get_user_productivity_metrics(p_user_id uuid) secdef=true search_path=search_path=public
  FN refresh_aa_commitment_summary() secdef=true search_path=search_path=public
  FN refresh_citation_network_on_change() secdef=true search_path=search_path=public
  FN refresh_relationship_health_stats() secdef=true search_path=search_path=public
FAIL: 0 of 7 functions are SECURITY DEFINER with search_path=public - a consumer still runs as the caller or with an unpinned path
```

I corrected only the oracle's rendering (`CASE` for `prosecdef` and `split_part(cfg, '=', 2)` for the
setting), not the catalog state. Verbatim corrected output:

```text
P100-17-DEFINER-CORRECTED functions=7 definer_and_pinned=7 expected 7 and 7
  FN get_citation_network_graph(p_start_entity_type citation_source_type, p_start_entity_id uuid, p_depth integer, p_max_nodes integer) secdef=t search_path=public
  FN get_entity_citations(p_entity_type citation_source_type, p_entity_id uuid, p_direction text, p_include_external boolean, p_limit integer) secdef=t search_path=public
  FN get_relationship_health_summary() secdef=t search_path=public
  FN get_user_productivity_metrics(p_user_id uuid) secdef=t search_path=public
  FN refresh_aa_commitment_summary() secdef=t search_path=public
  FN refresh_citation_network_on_change() secdef=t search_path=public
  FN refresh_relationship_health_stats() secdef=t search_path=public
PASS definer-pinned corrected-instrument
```

This retains both zero controls: the authored instrument found `definer_and_pinned=0` because its matcher
is malformed, while the corrected instrument finds zero missing functions and seven of seven valid rows.

## Command oracle 3: real-user positive controls

The plan's command obtained the test user's real access token, resolved that user's UUID and active
organization, called both deployed HTTP paths, and performed the `entity_citations` insert under `SET
LOCAL ROLE authenticated` with the user's JWT claims inside a transaction that was rolled back. Verbatim
output:

```text
P100-17 consumer controls: rpc_get_user_productivity_metrics=200 relationship-health=200 entity_citations_write=ok(rolled-back) expected 200 200 ok(rolled-back)
PASS consumer controls
```

Thus the productivity RPC returned 200, the deployed relationship-health list path returned 200, and
the statement-level citation refresh trigger completed as the definer before rollback. There was no RLS
refusal and no `permission denied for materialized view` error.

## Security boundary and follow-up

A PostgreSQL materialized view has no RLS. Consequently, moving these reads behind owner-executed
definer functions returns exactly the rows an authenticated direct read returned at HEAD: nothing was
de-scoped and nothing was widened by this task. The change removes direct client privileges; it does not
introduce row filtering. Any future row-scoping question is separate work.

This task adds seven functions to the pinned-search-path population that P100-08 digests. P100-08 must
re-derive its recorded “35 pinned elsewhere” literal and identity digest after this change rather than
assuming its earlier baseline.
