---
phase: 102-staging-data-debt-tail
plan: 12
status: complete
completed: 2026-09-11
requirements: [COPY-09]
---

# Phase 102 Plan 12: sentence-case lane 4 summary

Sentence-cased every census candidate in `contacts`, `positions`, and `advanced-search`. The `validation` namespace had no census candidates; its separately required terminology repair changed `dueDateRequired` to `Deadline is required` and the Arabic mirror to `الموعد النهائي مطلوب`. No carve-out gap was found, no key was renamed, and no Arabic plural-suffix key was deleted.

## Population and before/after counts

The population was re-derived from the four named English/Arabic namespace pairs using the shipped census and the pre-edit carve-out table. The Arabic value for every edited English key was read and its key presence checked. Arabic has no case distinction, so the 242 sentence-casing edits did not require Arabic wording changes; the validation terminology edit did.

| namespace | before candidates | after candidates | after carved | carve rows | Arabic keys re-checked | Arabic values changed |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| contacts | 85 | 0 | 0 | 0 | 85 | 0 |
| positions | 78 | 0 | 0 | 0 | 78 | 0 |
| advanced-search | 79 | 0 | 0 | 0 | 79 | 0 |
| validation | 0 | 0 | 0 | 0 | 1 | 1 |
| **Total** | **242** | **0** | **0** | **0** | **243** | **1** |

The zero candidate results are bounded by the instrument controls below, including the positive `Add Elected Official=true` control. The zero carve counts are bounded by `carve_rows=0` for each namespace: these namespaces have no allowlisted survivor, so `candidates==carved==carve_rows` is the intended end state.

## Execution record

### 1. Baseline census

Command:

```sh
node scripts/titlecase-census.mjs --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md contacts positions advanced-search validation
```

Verbatim output:

```text
NS contacts strings=278 candidates=85 ar_mirror=85 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS advanced-search strings=188 candidates=79 ar_mirror=79 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS positions strings=371 candidates=78 ar_mirror=78 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS validation strings=84 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
EN_FILES=129 EN_STRINGS=921 TITLECASE_CANDIDATES=242 PCT=26.3
```

### 2. Sentence-case rewrite

The rewrite enumerated candidate leaves using the shipped instrument's predicate, changed only their JSON string values, and preserved formatting and keys.

Verbatim output:

```text
SENTENCE_CASE namespace=contacts candidate_keys=85 value_occurrences_changed=85
SENTENCE_CASE namespace=positions candidate_keys=78 value_occurrences_changed=78
SENTENCE_CASE namespace=advanced-search candidate_keys=79 value_occurrences_changed=79
SENTENCE_CASE total_candidate_keys=242
```

### 3. Controlled post-edit census

Command:

```sh
node scripts/titlecase-census.mjs --controls --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md contacts positions advanced-search validation
```

Verbatim output:

```text
CONTROL 'Add Elected Official'=true expected true
CONTROL 'Add elected official'=false expected false
CONTROL 'SLA Breach'=false expected false
CONTROL 'Sign in'=false expected false
NS advanced-search strings=188 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS contacts strings=278 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS positions strings=371 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS validation strings=84 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
EN_FILES=129 EN_STRINGS=921 TITLECASE_CANDIDATES=0 PCT=0.0
```

### 4. Structural and Arabic-mirror audit against HEAD

The audit flattened the HEAD and working-tree JSON objects, compared complete key sets, counted changed English and Arabic leaves, checked every changed English key in Arabic, and required each changed Arabic key to correspond to a changed English key.

Verbatim output:

```text
MIRROR namespace=contacts en_changed=85 ar_changed=0 ar_keys_rechecked=85 keys_stable=true ar_changes_match_en=true
MIRROR namespace=positions en_changed=78 ar_changed=0 ar_keys_rechecked=78 keys_stable=true ar_changes_match_en=true
MIRROR namespace=advanced-search en_changed=79 ar_changed=0 ar_keys_rechecked=79 keys_stable=true ar_changes_match_en=true
MIRROR namespace=validation en_changed=1 ar_changed=1 ar_keys_rechecked=1 keys_stable=true ar_changes_match_en=true
MIRROR total_ar_keys_rechecked=243
```

### 5. Required command oracle after the work

Command: the command oracle embedded verbatim in `102-12-PLAN.md`.

Verbatim output:

```text
  NS advanced-search strings=188 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
  NS contacts strings=278 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
  NS positions strings=371 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
  NS validation strings=84 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
P102-LANE namespaces=4 at_end_state=4 expected 4 4 (candidates==carved, carved==carve_rows, ar_mirror==candidates, ar_missing_keys=0)
PASS lane
```

## Handoff

Nothing remains for a later task in this lane.
