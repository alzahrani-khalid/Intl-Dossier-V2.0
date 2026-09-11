---
status: complete
phase: 102-staging-data-debt-tail
plan: 10
requirement: COPY-09
---

# 102-10 Summary

Sentence-cased every non-carved Title Case candidate in `committees`, `empty-states`, `legislation`,
and `compliance`. The English pass changed 402 string values. All 402 corresponding Arabic keys were
re-checked and were present and non-empty; no Arabic value needed a matching edit because the English
changes altered capitalization only, not meaning. No keys were renamed or removed.

## Population and result

| Namespace | Before candidates | After candidates | Carve rows | English values changed | Arabic keys re-checked |
| --- | ---: | ---: | ---: | ---: | ---: |
| committees | 120 | 1 | 1 | 119 | 119 |
| empty-states | 105 | 0 | 0 | 105 | 105 |
| legislation | 94 | 1 | 1 | 93 | 93 |
| compliance | 86 | 1 | 1 | 85 | 85 |
| **Total** | **405** | **3** | **3** | **402** | **402** |

The three survivors are exactly the pre-edit carve-outs: `committees:types.working`,
`legislation:form.fields.officialTextUrl`, and `compliance:ruleForm.ruleCode`. There was no carve-out
gap and nothing is left for a later task.

## Execution log

### Baseline census

Command:

```sh
node scripts/titlecase-census.mjs --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md committees empty-states legislation compliance
```

Verbatim output:

```text
NS committees strings=255 candidates=120 ar_mirror=120 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS empty-states strings=370 candidates=105 ar_mirror=105 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
NS legislation strings=285 candidates=94 ar_mirror=94 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS compliance strings=226 candidates=86 ar_mirror=86 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
EN_FILES=129 EN_STRINGS=1136 TITLECASE_CANDIDATES=405 PCT=35.7
```

The non-zero baseline candidate counts are the positive control for the after-state zero in
`empty-states`; the census's explicit detector controls are recorded below.

### Mechanical value-only edit

The edit applied the shipped detector's candidate predicate to JSON string values, skipped the three
predeclared carve-out values, and lowercased non-initial non-acronym words. It preserved the original
JSON layout and emitted:

```text
EDIT committees changed_values=119
EDIT empty-states changed_values=105
EDIT legislation changed_values=93
EDIT compliance changed_values=85
```

### Detector controls and post-edit census

Command:

```sh
node scripts/titlecase-census.mjs --controls --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md committees empty-states legislation compliance
```

Verbatim output:

```text
CONTROL 'Add Elected Official'=true expected true
CONTROL 'Add elected official'=false expected false
CONTROL 'SLA Breach'=false expected false
CONTROL 'Sign in'=false expected false
NS committees strings=255 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS compliance strings=226 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS legislation strings=285 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
NS empty-states strings=370 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
EN_FILES=129 EN_STRINGS=1136 TITLECASE_CANDIDATES=3 PCT=0.3
```

### Changed-leaf and Arabic mirror audit

This audit compared every current English leaf with `HEAD`, asserted unchanged key sets, and looked up
each changed key in the corresponding Arabic namespace.

Verbatim output:

```text
AR_AUDIT committees changed=119 old_candidates=119 en_keys_unchanged=true ar_checked=119 ar_missing=0 ar_nonempty=119
AR_AUDIT empty-states changed=105 old_candidates=105 en_keys_unchanged=true ar_checked=105 ar_missing=0 ar_nonempty=105
AR_AUDIT legislation changed=93 old_candidates=93 en_keys_unchanged=true ar_checked=93 ar_missing=0 ar_nonempty=93
AR_AUDIT compliance changed=85 old_candidates=85 en_keys_unchanged=true ar_checked=85 ar_missing=0 ar_nonempty=85
AR_AUDIT_TOTAL changed=402 ar_checked=402 ar_missing=0
```

The `old_candidates` counts are the positive controls for each zero `ar_missing` result: the audit
proved it traversed all 402 changed leaves rather than an empty population.

### Carve-out render-site check

Command:

```sh
rg -n "types\\.working|officialTextUrl|ruleForm\\.ruleCode" frontend/src --glob '!i18n/**' --glob '!**/i18n/**'
```

Verbatim output:

```text
frontend/src/components/search/DossierSearchFilters.tsx:176:                <span>{t('types.working_group')}</span>
frontend/src/components/compliance/ComplianceRulesManager.tsx:335:                        <TableHead>{t('ruleForm.ruleCode')}</TableHead>
frontend/src/components/legislation/LegislationForm.tsx:691:                      {t('form.fields.officialTextUrl')}
```

`ruleCode` is confirmed as a table header, `officialTextUrl` is a field label, and the committees
`Working Group` survivor remains protected by its proper-noun carve-out.

### Required command oracle

Verbatim output:

```text
  NS committees strings=255 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
  NS compliance strings=226 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
  NS legislation strings=285 candidates=1 ar_mirror=1 carved=1 ar_missing_keys=0 ar_extra_keys=0 carve_rows=1
  NS empty-states strings=370 candidates=0 ar_mirror=0 carved=0 ar_missing_keys=0 ar_extra_keys=0 carve_rows=0
P102-LANE namespaces=4 at_end_state=4 expected 4 4 (candidates==carved, carved==carve_rows, ar_mirror==candidates, ar_missing_keys=0)
PASS lane
```

### Diff hygiene

Command `git diff --check` produced no output and exited successfully. The changed-leaf audit above
proves the four locale-file hunks preserve the English key sets; the Arabic files are unchanged, so no
Arabic plural-suffix key was deleted. No test hunk was required or made.
