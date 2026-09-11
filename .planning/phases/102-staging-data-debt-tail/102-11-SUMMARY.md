---
phase: 102-staging-data-debt-tail
plan: 11
status: complete
completed: 2026-09-12
---

# Phase 102 Plan 11 — Sentence-case lane 3 summary

## Outcome

Sentence-cased every census candidate outside the predeclared carve-out table in `user-management`, `working-groups`, `workflow-automation`, and `dashboard-widgets`. The change updates 343 English string values and no keys. All 343 corresponding Arabic values were read and still express the same meaning, so no Arabic value needed a matching copy change.

The 11 surviving Title Case candidates are exactly the 11 predeclared carve-outs: 1 mono label, 1 `Intake Ticket` proper noun, 6 `Working Group` proper-noun uses, and 3 working-group table-column headers.

## Population and census

Initial population command:

```text
node scripts/titlecase-census.mjs --controls --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md user-management working-groups workflow-automation dashboard-widgets
```

Initial output:

```text
CONTROL 'Add Elected Official'=true expected true
CONTROL 'Add elected official'=false expected false
CONTROL 'SLA Breach'=false expected false
CONTROL 'Sign in'=false expected false
NS user-management strings=263 candidates=99 ar_mirror=99 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS dashboard-widgets strings=258 candidates=90 ar_mirror=90 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS workflow-automation strings=241 candidates=88 ar_mirror=88 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS working-groups strings=283 candidates=77 ar_mirror=77 carved=9 ar_missing_keys=0 ar_extra_keys=0 carve_rows=9
EN_FILES=129 EN_STRINGS=1045 TITLECASE_CANDIDATES=354 PCT=33.9
```

Per-namespace before/after counts and Arabic mirror checks:

| Namespace | Before candidates | After candidates | Carve rows | English values changed | Arabic keys re-checked |
| --- | ---: | ---: | ---: | ---: | ---: |
| `user-management` | 99 | 1 | 1 | 98 | 98 |
| `working-groups` | 77 | 9 | 9 | 68 | 68 |
| `workflow-automation` | 88 | 1 | 1 | 87 | 87 |
| `dashboard-widgets` | 90 | 0 | 0 | 90 | 90 |
| **Total** | **354** | **11** | **11** | **343** | **343** |

The `dashboard-widgets` zero is bounded by the instrument controls above (`Add Elected Official=true`) and by the non-zero results in the other three namespaces, demonstrating that the census could report candidates.

## Structural verification

The comparison parsed each current JSON file and its `HEAD` version, flattened both key sets, counted changed leaf values, and checked each changed key in the Arabic mirror.

```text
VERIFY user-management changed_values=98 key_set_stable=true ar_rechecked=98 ar_missing_for_changed=0
VERIFY working-groups changed_values=68 key_set_stable=true ar_rechecked=68 ar_missing_for_changed=0
VERIFY workflow-automation changed_values=87 key_set_stable=true ar_rechecked=87 ar_missing_for_changed=0
VERIFY dashboard-widgets changed_values=90 key_set_stable=true ar_rechecked=90 ar_missing_for_changed=0
VERIFY total_ar_rechecked=343
```

`git diff --check` produced no output. The staged copy commit ran the repository pre-commit formatting and build hooks successfully; those hooks left the copy diff at exactly 343 insertions and 343 deletions across the four English locale files.

## Final command oracle

Command: the complete `oracle: command` shell block from `102-11-PLAN.md`.

Verbatim output:

```text
  NS working-groups strings=283 candidates=9 ar_mirror=9 carved=9 ar_missing_keys=0 ar_extra_keys=0 carve_rows=9
  NS user-management strings=263 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
  NS workflow-automation strings=241 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
  NS dashboard-widgets strings=258 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
P102-LANE namespaces=4 at_end_state=4 expected 4 4 (candidates==carved, carved==carve_rows, ar_mirror==candidates, ar_missing_keys=0)
PASS lane
```

## Scope

No key was renamed, no Arabic plural-suffix key was deleted, no test was changed, and no path outside the plan allowlist was edited.

## Known follow-up outside this lane

`tests/e2e/93-custom-dashboard-error.spec.ts:144` still asserts the old exact, case-sensitive literal `Custom Dashboard`, while `dashboard-widgets.customDashboard` now renders `Custom dashboard`. That test path is outside this plan's fixed allowlist, so the assertion was not edited here; it needs an orchestrator ruling or a later scoped task to re-case the superseded literal byte-for-byte under P102-09.

The census defines this lane's measured population, but its candidate predicate does not detect roughly 40 surviving Title Case strings containing lowercase joiners, `&`, or parenthesized text. Examples include `Greater Than or Equal`, `Filter by Source`, `Mark All as Read`, `Inactive Users ({{count}})`, `Permissions to Delegate`, `Actions to Execute`, `Assigned to Member`, `Work Items by Status`, and `End Date & Time`. These strings remain for a later copy task with a population definition that covers those forms.
