---
phase: 102-staging-data-debt-tail
plan: 18
status: blocked
completed: 2026-09-12
---

# Phase 102 Plan 18 — Fixture-account purge

## Result

The purge did not run. The repair worker fixed the generated-census quoting defect, moved that census
ahead of export-directory creation, and re-ran the mandatory command. The script itself successfully
generated and executed the catalog census, measuring 194 blocking constraints, zero fixture blockers,
and 27 non-zero control FKs. Its filesystem sandbox then rejected creation of the mandatory export
directory outside the worktree with `EPERM`. It stopped before its first export and before any
`auth.admin.deleteUser` call. Staging remains at the deliberately red pre-purge state: 415 auth users,
all 13 keep-list users present, 415 public users, and 415 profiles.

The repaired script is committed as `9da0044d1`. It reads all three credentials from `.env.test`,
requires the exact 13-address keep-list boundary, escapes the dynamic predicate for both the SQL
literal and PostgreSQL `format()`, derives the blocking-FK census from `pg_constraint` before creating
an export directory, and requires a live non-zero census control. If those checks pass and the required
directory is writable, its remaining unconditional path exports and fsyncs all seven CSVs before it
deletes exported ids through GoTrue and writes the requested magnitudes. This run proved the census
path but could not exercise the export or delete path.

## P101 precondition (before the attempted purge)

Command:

```bash
summary_files=$(find .planning/phases/101-ci-gates-green -maxdepth 1 -name '101-*-SUMMARY.md' -print | sort)
printf 'P101_SUMMARY_COUNT=%s\n' "$(printf '%s\n' "$summary_files" | sed '/^$/d' | wc -l | tr -d ' ')"
printf '%s\n' "$summary_files"
printf '%s\n' "$summary_files" | while IFS= read -r file; do
  [ -n "$file" ] || continue
  printf '%s ' "$file"
  sed -n '/^status:/p' "$file"
done
if [ -f .planning/phases/101-ci-gates-green/101-ACCEPTANCE.md ]; then
  echo P101_ACCEPTANCE=present
else
  echo P101_ACCEPTANCE=absent
fi
tail -1 .planning/phases/101-ci-gates-green/101-ACCEPTANCE.md
```

Verbatim output:

```text
P101_SUMMARY_COUNT=10
.planning/phases/101-ci-gates-green/101-01-SUMMARY.md
.planning/phases/101-ci-gates-green/101-02-SUMMARY.md
.planning/phases/101-ci-gates-green/101-03-SUMMARY.md
.planning/phases/101-ci-gates-green/101-04-SUMMARY.md
.planning/phases/101-ci-gates-green/101-05-SUMMARY.md
.planning/phases/101-ci-gates-green/101-08-SUMMARY.md
.planning/phases/101-ci-gates-green/101-09-SUMMARY.md
.planning/phases/101-ci-gates-green/101-10-SUMMARY.md
.planning/phases/101-ci-gates-green/101-12-SUMMARY.md
.planning/phases/101-ci-gates-green/101-13-SUMMARY.md
.planning/phases/101-ci-gates-green/101-01-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-02-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-03-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-04-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-05-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-08-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-09-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-10-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-12-SUMMARY.md status: complete
.planning/phases/101-ci-gates-green/101-13-SUMMARY.md status: complete
P101_ACCEPTANCE=present
ACCEPTANCE-END
```

## Purge attempt

Command:

```bash
PATH="/opt/homebrew/bin:$PATH" node scripts/p102-purge-fixture-accounts.mjs
```

Verbatim output (exit 1):

```text
keep-list pre-delete outside_delete=13 keep_list_outside_delete=13
BLOCKING_FK_TOTAL_CONSTRAINTS=194
BLOCKING_FK_WITH_ROWS=0
BLOCKING_FK_CONTROL_WITH_ROWS=27
BLOCKING_FK_CONTROL public.work_item_dossiers.created_by	31
BLOCKING_FK_CONTROL public.work_item_dossiers.updated_by	25
BLOCKING_FK_CONTROL public.dossiers.created_by	24
BLOCKING_FK_CONTROL public.assignments.assignee_id	14
BLOCKING_FK_CONTROL public.aa_commitments.owner_user_id	9
BLOCKING_FK_CONTROL public.assignments.assigned_by	8
BLOCKING_FK_CONTROL public.calendar_entries.organizer_id	8
BLOCKING_FK_CONTROL public.dossiers.updated_by	7
BLOCKING_FK_CONTROL public.tasks.assignee_id	7
BLOCKING_FK_CONTROL public.positions.author_id	6
BLOCKING_FK_CONTROL public.aa_commitments.updated_by	4
BLOCKING_FK_CONTROL public.commitment_status_history.changed_by	4
BLOCKING_FK_CONTROL public.tasks.updated_by	4
BLOCKING_FK_CONTROL public.calendar_entries.created_by	3
BLOCKING_FK_CONTROL public.intake_tickets.created_by	3
BLOCKING_FK_CONTROL public.intake_tickets.updated_by	3
BLOCKING_FK_CONTROL public.lifecycle_transitions.user_id	3
BLOCKING_FK_CONTROL public.tasks.completed_by	3
BLOCKING_FK_CONTROL public.dossier_relationships.created_by	2
BLOCKING_FK_CONTROL public.position_audience_groups.granted_by	2
BLOCKING_FK_CONTROL public.position_dossier_links.created_by	2
BLOCKING_FK_CONTROL public.position_versions_2026.author_id	2
BLOCKING_FK_CONTROL public.position_versions.author_id	2
BLOCKING_FK_CONTROL public.after_action_records.created_by	1
BLOCKING_FK_CONTROL public.after_action_records.published_by	1
BLOCKING_FK_CONTROL public.after_action_records.updated_by	1
BLOCKING_FK_CONTROL public.permission_delegations.revoked_by	1
node:fs:1651
  const result = binding.mkdir(
                         ^

Error: EPERM: operation not permitted, mkdir '/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer/p102-prepurge-20260912T022503Z'
    at mkdirSync (node:fs:1651:26)
    at file:///Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260911-181854-0000000000000083--P102-18/scripts/p102-purge-fixture-accounts.mjs:230:1
    at ModuleJob.run (node:internal/modules/esm/module_job:569:25)
    at async node:internal/modules/esm/loader:650:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {
  errno: -1,
  code: 'EPERM',
  syscall: 'mkdir',
  path: '/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer/p102-prepurge-20260912T022503Z'
}

Node.js v26.7.0
```

No export directory was created, so there is no export path, no export row count, no first-delete
epoch, and no final magnitudes line to record. The successful census output above comes from this
script run, before its `mkdirSync` call; it is not copied from an ad-hoc query. The `EPERM` is the
remaining blocking condition, not an omitted run.

The repair gate's frontend test findings name only paths outside this task's fixed file scope. Neither
reviewed commit changes frontend code or configuration, and this worker made no out-of-scope edits.

## Population re-derived after the stopped attempt

Command: the research §1.1 count block, with `.env.test` sourced and `psql
"$SUPABASE_DB_URL" -Atq`.

Verbatim output:

```text
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

## Earlier ad-hoc blocking-FK census

Before the quoting repair, an earlier repair worker ran the research §1.6 query independently of the
script. It was regenerated from `pg_constraint` for all three suffixes, with a control regenerated
from the same catalog query using `kazahrani@stats.gov.sa`. This historical output did not prove the
old script path; the current script-run proof is recorded under **Purge attempt** above.

Verbatim output:

```text
BLOCKING_FK_TOTAL_CONSTRAINTS=194
BLOCKING_FK_WITH_ROWS=0
BLOCKING_FK_CONTROL_WITH_ROWS=27
BLOCKING_FK_CONTROL public.work_item_dossiers.created_by = 31
BLOCKING_FK_CONTROL public.work_item_dossiers.updated_by = 25
BLOCKING_FK_CONTROL public.dossiers.created_by = 24
BLOCKING_FK_CONTROL public.assignments.assignee_id = 14
BLOCKING_FK_CONTROL public.aa_commitments.owner_user_id = 9
BLOCKING_FK_CONTROL public.assignments.assigned_by = 8
BLOCKING_FK_CONTROL public.calendar_entries.organizer_id = 8
BLOCKING_FK_CONTROL public.dossiers.updated_by = 7
BLOCKING_FK_CONTROL public.tasks.assignee_id = 7
BLOCKING_FK_CONTROL public.positions.author_id = 6
BLOCKING_FK_CONTROL public.aa_commitments.updated_by = 4
BLOCKING_FK_CONTROL public.commitment_status_history.changed_by = 4
BLOCKING_FK_CONTROL public.tasks.updated_by = 4
BLOCKING_FK_CONTROL public.calendar_entries.created_by = 3
BLOCKING_FK_CONTROL public.intake_tickets.created_by = 3
BLOCKING_FK_CONTROL public.intake_tickets.updated_by = 3
BLOCKING_FK_CONTROL public.lifecycle_transitions.user_id = 3
BLOCKING_FK_CONTROL public.tasks.completed_by = 3
BLOCKING_FK_CONTROL public.dossier_relationships.created_by = 2
BLOCKING_FK_CONTROL public.position_audience_groups.granted_by = 2
BLOCKING_FK_CONTROL public.position_dossier_links.created_by = 2
BLOCKING_FK_CONTROL public.position_versions_2026.author_id = 2
BLOCKING_FK_CONTROL public.position_versions.author_id = 2
BLOCKING_FK_CONTROL public.after_action_records.created_by = 1
BLOCKING_FK_CONTROL public.after_action_records.published_by = 1
BLOCKING_FK_CONTROL public.after_action_records.updated_by = 1
BLOCKING_FK_CONTROL public.permission_delegations.revoked_by = 1
```

Thus the earlier ad-hoc measurement also saw the fixture zero beside a control that detects 27
non-zero blocking FKs. It agrees with the repaired script's own run.

## Required command oracles after the stopped attempt

Positive end-state oracle, run under `bash` (exit 1), verbatim:

```text
P102-18-PURGE auth_users=415 keep_list_present=13 public_users=415 profiles=415 expected 13 13 13 13
FAIL: auth.users=415 public.users=415 profiles=415 - fixture accounts (or their mirror rows) remain beyond the 13 real accounts
```

Export-before-delete oracle (exit 1), verbatim:

```text
P102-18-EXPORT export_dir=absent
FAIL: no p102-prepurge-* export directory exists under /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer - the purge script never exported before deleting (or never ran)
```

## Handoff

No later task should treat DATA-01 as complete. The generated-census defect is repaired and its exact
script path now parses and executes. Re-run this plan from a worker whose writable roots include
`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer`; do not redirect the
mandatory export into this worktree.
