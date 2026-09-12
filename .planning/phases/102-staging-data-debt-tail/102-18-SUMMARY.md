---
phase: 102-staging-data-debt-tail
plan: 18
status: done
completed: 2026-09-12
---

# Phase 102 Plan 18 — Fixture-account purge

## Result

The purge ran to completion from an unsandboxed worker on the planning machine. The script
(that run used commit `5d83531b1`; see the post-run hardening note below) read `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and
`SUPABASE_DB_URL` from `.env.test`, verified the 13-address keep-list boundary, derived the
blocking-FK census from `pg_constraint` (194 constraints, 0 fixture blockers, 27 non-zero control
FKs), then exported all seven CSVs to the mandatory directory outside the worktree before deleting
each exported id one at a time through GoTrue `auth.admin.deleteUser`. All 402 fixture accounts were
deleted with zero failures. Staging now holds exactly the 13 enumerated real accounts in
`auth.users`, `public.users`, and `public.profiles`; both command oracles pass (verbatim below).

### Post-run hardening (commit `43c2b31e0`)

After the recorded run, review found a TOCTOU defect in the script: `fixtureUsers` was selected
once, but every CSV re-queried the live suffix population and only the auth-row count was compared
afterward, so concurrent churn could in principle have made the script delete an id that was never
exported. The script at HEAD now binds selection, all seven CSV exports, and every `deleteUser`
call to one immutable id set (`= any('{...}'::uuid[])` built from the initially selected,
uuid-validated ids; the blocking-FK fixture census is driven by the same id set), and aborts
before the first delete unless the ids parsed back out of `auth_users_fixtures.csv` equal the
selected id set exactly — identity, not just cardinality. The recorded run's outputs below are
unaffected: its counts, magnitudes, and oracles were re-verified against staging after the repair
(auth.users=13, public.users=13, profiles=13, zero fixture-suffix accounts left), and the repaired
script was exercised end-to-end on the planning machine: it connects, finds the (now correctly)
empty fixture delete set, and refuses to create a newer empty export, exit 1.

export_path=`/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer/p102-prepurge-20260912T024507Z`

## P101 precondition (before the purge)

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

## Purge run

Command:

```bash
PATH="/opt/homebrew/bin:$PATH" node scripts/p102-purge-fixture-accounts.mjs
```

Verbatim output (exit 0; the 402 per-delete progress lines are elided — every one reported
`running_failed=0`):

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
export_path=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer/p102-prepurge-20260912T024507Z
exported auth_users_fixtures.csv rows=402
exported public_users.csv rows=402
exported public_profiles.csv rows=402
exported public_mou_notification_preferences.csv rows=402
exported public_user_notification_preferences.csv rows=22
exported public_staff_profiles.csv rows=0
exported public_user_roles.csv rows=2
[1/402] deleted ... running_deleted=1 running_failed=0
... (402 deleteUser calls, one id at a time, zero failures) ...
[402/402] deleted id=ffb53642-dc08-410a-a598-1d409b38befe email=test-1772841765912@example.com running_deleted=402 running_failed=0
kept=13 deleted=402 cascade=1230 failed=0
```

## Export CSV row counts (wc -l minus header)

| CSV | data rows |
| --- | --- |
| auth_users_fixtures.csv | 402 |
| public_users.csv | 402 |
| public_profiles.csv | 402 |
| public_mou_notification_preferences.csv | 402 |
| public_user_notification_preferences.csv | 22 |
| public_staff_profiles.csv | 0 |
| public_user_roles.csv | 2 |

## magnitudes.txt (verbatim)

```text
kept=13
deleted=402
cascade=1230
failed=0
first_delete_epoch=1789181118
export_completed_epoch=1789181118
```

## Required command oracles after the completed run

Positive end-state oracle, run under `bash` (exit 0), verbatim:

```text
P102-18-PURGE auth_users=13 keep_list_present=13 public_users=13 profiles=13 expected 13 13 13 13
PASS purge
```

Export-before-delete oracle (exit 0), verbatim:

```text
P102-18-EXPORT dir=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/overseer/p102-prepurge-20260912T024507Z csv_rows=402 deleted=402 csv_mtime=1789181108 first_delete_epoch=1789181118
P102-18-EXPORT fixtures_left_in_auth_users=0
PASS export-before-delete
```

The export CSV's mtime (1789181108) precedes `first_delete_epoch` (1789181118), the CSV data-row
count (402) equals the `deleted=` magnitude, and zero fixture-suffix accounts remain in `auth.users`.

## History of prior attempts

Four earlier attempts repaired the generated-census quoting defect and moved the census ahead of
export-directory creation, but each stopped at `mkdirSync` of the outside-worktree export directory
with `EPERM` under the Codex sandbox (`writable_roots` replaces config-file roots, so the mandatory
D-26 path was unreachable by construction). This run executed the unchanged script from the pinned
unsandboxed worker, exactly as the anchored review prescribed. The census numbers recorded in the
earlier blocked SUMMARY revisions came from script runs that stopped at the `EPERM`; the successful
end-to-end run above supersedes them.

## Handoff

DATA-01 is satisfied: the 402 fixture accounts are purged from staging, their rows survive as CSVs
under the export path above, and the staging auth surface holds exactly the 13 enumerated real
accounts. No follow-up task should re-run this script — its pre-delete check now refuses an empty
fixture delete set.
