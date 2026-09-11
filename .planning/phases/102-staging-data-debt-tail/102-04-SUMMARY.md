---
status: complete
phase: 102-staging-data-debt-tail
plan: 04
requirements: [WRITER-ROUTE-01, INSERT-SYNC-01]
completed: 2026-09-11
---

# P102-04 — Task status/stage lifecycle seam

## Outcome

`trg_sync_task_status` now fires `BEFORE INSERT OR UPDATE`. Its INSERT branch derives the deprecated
`status` compatibility column unconditionally from `workflow_stage`; its UPDATE branch retains the
existing `IS DISTINCT FROM` guard. The workflow executor routes task status actions through
`workflow_stage`, while its other seven entity types retain their direct `status` update. The edge and
backend task-create paths derive `status` from the same stage value through `STAGE_TO_STATUS` maps.

Staging received the migration twice without error. `workflow-executor` was deployed as version 5 and
`tasks-create` as version 7, both strictly above the 2026-09-10 HEAD baselines (4 and 6). The constructed
INSERT was rolled back and therefore persisted no row.

## Changed population and boundaries

- Database population: `public.tasks` trigger/function behavior. Existing task rows were not rewritten.
- Writer population: task `executeUpdateStatus`; `tasks-create`; `TasksService.createTask`; and
  `TaskCreationService.createTaskFromCommitment`.
- Outside the executor task branch: all seven other `WorkflowEntityType` values keep the existing
  `{ status, updated_at }` write.
- Side observation, recorded and unchanged: `getTableName` still maps `engagement` to `engagements` and
  `commitment` to `commitments`. This is the legacy/canonical-population seam identified in
  `102-RESEARCH.md` §6.1; the P96 project-memory citation is
  `.planning/phases/96-real-numbers/96-CONTEXT.md` D-06 (`:88-105`)
  (`engagement_dossiers` and `aa_commitments` are the canonical populations).

## Commands and verbatim outputs

### Migration apply 1

Command (2026-09-11T18:32:26Z):

```sh
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a; psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260911000001_p102_task_insert_sync.sql
```

Output:

```text
CREATE FUNCTION
DROP TRIGGER
CREATE TRIGGER
```

### Migration apply 2 (idempotence replay)

Command (2026-09-11T18:32:28Z):

```sh
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a; psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260911000001_p102_task_insert_sync.sql
```

Output:

```text
CREATE FUNCTION
DROP TRIGGER
CREATE TRIGGER
```

### Deploy `workflow-executor`

Command (2026-09-11T18:32:57Z):

```sh
DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH" supabase functions deploy workflow-executor --project-ref zkrcjzdemdmwhearhfgg
```

Output:

```text
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: workflow-executor
Deploying Function: workflow-executor (script size: 94 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["workflow-executor"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

### Deploy `tasks-create`

Command (2026-09-11T18:33:07Z):

```sh
DO_NOT_TRACK=1 SUPABASE_TELEMETRY_DISABLED=true PATH="/opt/homebrew/bin:$PATH" supabase functions deploy tasks-create --project-ref zkrcjzdemdmwhearhfgg
```

Output:

```text
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: tasks-create
Deploying Function: tasks-create (script size: 708 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["tasks-create"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
A new version of Supabase CLI is available: v2.117.0 (currently installed v2.115.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
```

### Catalog-shape oracle

Command: the first command oracle from `102-04-PLAN.md` (the `pg_get_triggerdef` probe).

Output:

```text
P102-04-TRG CREATE TRIGGER trg_sync_task_status BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION sync_task_status_from_workflow_stage()
PASS trigger-insert
```

### Rolled-back birth-divergence oracle

Command: the second command oracle from `102-04-PLAN.md` (the transaction-wrapped task INSERT).

Output:

```text
P102-04-BORN status_and_stage=[review review] expected [review review]
PASS born-consistent
```

The transaction ends in `ROLLBACK`; the construct writes nothing.

### Deploy-version oracle

Command: the third command oracle from `102-04-PLAN.md` (`supabase functions list -o json` with telemetry disabled).

Output:

```text
P102-04-DEPLOY advanced=2/2 workflow-executor=5(>4) tasks-create=7(>6) expected advanced=2/2 (every slug version strictly greater than its HEAD value recorded 2026-09-10)
PASS deploy-versions
```

### Divergent-row population and positive control

Command:

```sh
psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select 'DIVERGENT_ROWS=' || count(*) from tasks where not ((status='pending' and workflow_stage='todo') or (status='in_progress' and workflow_stage='in_progress') or (status='review' and workflow_stage='review') or (status='completed' and workflow_stage='done') or (status='cancelled' and workflow_stage='cancelled'))"
psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select 'CONTROL_MATCHED_ROWS=' || count(*) from tasks where ((status='pending' and workflow_stage='todo') or (status='in_progress' and workflow_stage='in_progress') or (status='review' and workflow_stage='review') or (status='completed' and workflow_stage='done') or (status='cancelled' and workflow_stage='cancelled'))"
```

Output:

```text
DIVERGENT_ROWS=0
CONTROL_MATCHED_ROWS=9
```

The `9` control proves the pair-classifier observed the live task population and could return a non-zero
count; the divergent population remained zero after the rolled-back construct.

### Targeted formatting

The first combined formatting command included SQL without an explicit parser, so Prettier stopped before
the chained TypeScript build. That instrument-only failure was corrected by restricting Prettier to the
TypeScript files; no source edit resulted from it.

Command:

```sh
pnpm exec prettier --check backend/src/services/tasks.service.ts supabase/functions/tasks-create/index.ts supabase/functions/workflow-executor/index.ts supabase/migrations/20260911000001_p102_task_insert_sync.sql
```

Output:

```text
Checking formatting...
[warn] supabase/functions/workflow-executor/index.ts
[error] No parser could be inferred for file "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-04/supabase/migrations/20260911000001_p102_task_insert_sync.sql".
Error occurred when checking code style in the above file.
```

Successful command:

```sh
pnpm exec prettier --check backend/src/services/tasks.service.ts supabase/functions/tasks-create/index.ts
```

Output:

```text
Checking formatting...
All matched files use Prettier code style!
```

### Backend TypeScript build

Command:

```sh
pnpm --dir backend run build:tsc
```

Output:

```text
> intake-backend@1.0.0 build:tsc /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-04/backend
> tsc --project tsconfig.build.json
```

## Commits

- `c458313b1 fix(db): sync task status on insert`
- `3c5c17010 fix(tasks): route lifecycle writes through stages`

## Later work

No work from this plan remains. The unchanged legacy executor entity-map observation stays outside P102-04.
