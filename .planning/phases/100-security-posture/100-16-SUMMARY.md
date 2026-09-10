---
status: blocked
task: P100-16
blocked_on: staging function deploy could not write Supabase CLI telemetry in the managed worker filesystem
repair_commit: 1dfbacd7e
---

# P100-16 — Consumed materialized-view repair stopped before revoke

## Outcome

The three edge-function repairs are committed at `1dfbacd7e`, but this task did not deploy or revoke.
The first required staging deploy exited 1 before deployment because the Supabase CLI tried to write
`/Users/khalidalzahrani/.supabase/telemetry.json.tmp...`, outside this worker's writable roots. The plan's
safety stop-rule therefore fired: neither of the other functions was deployed, the migration file was not
kept, and neither migration apply was run. Staging ACLs were not changed by this task.

`INSTRUMENT-CANNOT-RUN: deploy` — the orchestrator must deploy the committed repair from a checkout where
the Supabase CLI can write its telemetry/config state, then resume the prescribed deploy → pre-revoke
control → two applies → post-revoke oracle order.

## Repair and changed hunks

The existing caller JWT check remains before every data read, unchanged:

- `supabase/functions/dossier-stats/index.ts`: the anon-key `supabaseClient` remains at lines 37–45 and
  `supabaseClient.auth.getUser(token)` remains at line 51. Only the four reads of
  `dossier_engagement_stats` and `dossier_commitment_stats` moved to the new `serviceClient`: the single
  path at lines 123–135 and bulk path at lines 409–420. `document_relations`, `health_scores`, dashboard
  aggregation, and every other read remain caller-scoped.
- `supabase/functions/tag-hierarchy/index.ts`: the anon-key `supabase` remains at lines 84–88 and
  `supabase.auth.getUser()` remains at line 94. Only the `analytics` case constructs a service-role client
  and uses it for `mv_tag_usage_analytics` at lines 241–248. Every other `handleGet` branch and all write
  handlers retain the caller-scoped parameter.
- `supabase/functions/stakeholder-influence/index.ts`: the anon-key `supabase` construction remains at
  lines 215–223 and the existing `getAuthUser(req, supabase)` call remains at line 226. Only the default
  list path constructs a local service-role client and reads `stakeholder_network_summary` at lines
  641–645. All other GET reads retain `supabase`; the pre-existing POST calculation service client remains
  independently scoped.

In all three files, the service-role client is constructed only after the existing JWT verification has
succeeded. Commit command and output:

```text
git add supabase/functions/dossier-stats/index.ts supabase/functions/tag-hierarchy/index.ts supabase/functions/stakeholder-influence/index.ts && git commit -m "fix(security): isolate consumed matview reads"
[tickmarkr/run-20260910-112306-0000000000000075--P100-16 1dfbacd7e] fix(security): isolate consumed matview reads
 3 files changed, 19 insertions(+), 6 deletions(-)
COMMIT_EXIT=0
```

The commit hook also ran the repository build successfully; its output was very large and included only
pre-existing warnings.

## Re-derived source census — planning bound

Command:

```bash
for view in dossier_engagement_stats dossier_commitment_stats mv_tag_usage_analytics stakeholder_network_summary; do for area in backend/src supabase/functions; do n=$(git grep -lIF -e "$view" -- "$area/**" 2>/dev/null | wc -l | tr -d ' '); printf '%s %s files_naming=%s\n' "$view" "$area" "$n"; done; done; for area in backend/src supabase/functions; do n=$(git grep -lIF -e "from('dossiers')" -- "$area/**" 2>/dev/null | wc -l | tr -d ' '); printf "control from('dossiers') %s files=%s\n" "$area" "$n"; done
```

Verbatim output:

```text
dossier_engagement_stats backend/src files_naming=2
dossier_engagement_stats supabase/functions files_naming=2
dossier_commitment_stats backend/src files_naming=2
dossier_commitment_stats supabase/functions files_naming=3
mv_tag_usage_analytics backend/src files_naming=1
mv_tag_usage_analytics supabase/functions files_naming=1
stakeholder_network_summary backend/src files_naming=1
stakeholder_network_summary supabase/functions files_naming=1
control from('dossiers') backend/src files=5
control from('dossiers') supabase/functions files=53
CENSUS_EXIT=0
```

The non-zero controls prove the search traversed both source areas. The backend hits are generated type
declarations rather than queries. Besides the three repaired functions, the function hits are
`calculate-health-score` for both dossier stats views and `refresh-commitment-stats` for the commitment
view. Both clients already use `SUPABASE_SERVICE_ROLE_KEY`, so the census found no additional
caller-scoped consumer. The refresh RPC reference in `stakeholder-influence` likewise uses its existing
service-role client.

## Required deploy sequence — stopped on the first deploy

Command:

```bash
PATH="/opt/homebrew/bin:$PATH" supabase functions deploy dossier-stats --project-ref zkrcjzdemdmwhearhfgg
```

Verbatim output (the CLI repeated the platform error twice):

```text
error: Unknown: FileSystem.writeFile (/Users/khalidalzahrani/.supabase/telemetry.json.tmp.ecdcee45-12be-484a-b385-95aac5db7f85)
       _tag: "PlatformError",
 ~effect/platform/PlatformError: "~effect/platform/PlatformError",

error: Unknown: FileSystem.writeFile (/Users/khalidalzahrani/.supabase/telemetry.json.tmp.ecdcee45-12be-484a-b385-95aac5db7f85)
       _tag: "Unknown",
     module: "FileSystem",
     method: "writeFile",
 pathOrDescriptor: "/Users/khalidalzahrani/.supabase/telemetry.json.tmp.ecdcee45-12be-484a-b385-95aac5db7f85",
    syscall: "open",

EPERM: operation not permitted, open '/Users/khalidalzahrani/.supabase/telemetry.json.tmp.ecdcee45-12be-484a-b385-95aac5db7f85'
    path: "/Users/khalidalzahrani/.supabase/telemetry.json.tmp.ecdcee45-12be-484a-b385-95aac5db7f85",
 syscall: "open",
   errno: -1,
    code: "EPERM"

EPERM: operation not permitted, open '/Users/khalidalzahrani/.supabase/telemetry.json.tmp.ecdcee45-12be-484a-b385-95aac5db7f85'
    path: "/Users/khalidalzahrani/.supabase/telemetry.json.tmp.ecdcee45-12be-484a-b385-95aac5db7f85",
 syscall: "open",
   errno: -1,
    code: "EPERM"

Bun v1.3.13 (macOS arm64)
DEPLOY_DOSSIER_STATS_EXIT=1
```

The raw CLI output also printed minified internal stack-source excerpts around those errors; the
actionable diagnostic and every filesystem/error field are preserved above.

No output exists for `tag-hierarchy` or `stakeholder-influence`: the plan says to stop after any non-zero
deploy rather than continuing. Consequently there is no pre-revoke HTTP control, no migration apply or
replay, and no post-revoke grants or deployed-read oracle output to claim.

## Security boundary retained by the repair

A PostgreSQL materialized view has no RLS. At HEAD, an authenticated client that could select any of
these four views already received the whole materialized result. Moving only these reads to
`service_role` therefore de-scopes nothing: it preserves the same full-view visibility behind the
already-required, already-verified caller JWT. Designing row-scoped replacements for the materialized
views is a separate phase question.

## Resume point

The orchestrator should begin with all three deploys from commit `1dfbacd7e`, recording exit 0 for each.
Only after all deployments and the pre-revoke JWT control are green should it restore the exact
four-statement migration, apply it twice, and run both plan command oracles. This summary must change to
`status: complete` only after that sequence succeeds.
