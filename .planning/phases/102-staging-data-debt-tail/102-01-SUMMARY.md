---
phase: 102-staging-data-debt-tail
plan: 1
status: complete
completed: 2026-09-11
requirements: [GATESTD-01, GATESTD-02, GATESTD-03, GATESTD-04, GATESTD-05]
---

# 102-01 SUMMARY: the five gate-standard instrument repairs

## Result

- **GATESTD-01:** C9b no longer assigns an empty identifier through the macOS-incompatible
  `id=$(printf '%s' "$id" | sed -E 's/[][.*+?^${}()|\\]/\\\\&/g')` line. The replacement is a
  fail-closed `case` that prints `UNSAFE ID` for `some.file.test` and `safe` for `safe_id-1`.
- **GATESTD-02:** `config-step-artifacts.mjs` derives the workflow population with polarity. It
  reports **enabled=8**, disabled=4, and non-Boolean=2; `skip_discuss=false` is enabled while
  `node_repair_budget=2` and `discuss_mode="discuss"` are segregated. The Validation Architecture
  population is P86, P87, P88, P92, P93, P94, P95, P96, P97, and P98. Nine have validation files;
  Phase 93 is explicitly answered by its dated waiver.
- **GATESTD-03:** both the context extractor and plan citation extractor accept the optional
  sub-letter. Exact identifier-set membership reports **total=5 covered=5** for D-01, D-02, D-03a,
  D-03b, and D-04.
- **GATESTD-04:** C1 now carries the third direction only for presence-shaped criteria (`appears`,
  `exists`, `contains`, `renders`): construct a plausible wrong done-state and observe RED, or record
  `WRONG-STATE NOT CONSTRUCTED: <what and why>`. Exact-value and behavioural criteria remain at two
  directions. This direction was **not applied retroactively to earlier phases**.
- **GATESTD-05:** `gate-drill.mjs` refuses a nested invocation before reading or running gates and
  refuses a gate that names the directory being drilled before creating or executing a gate script.
  Every spawned gate receives `GATE_DRILL_ACTIVE=1`.

The result slot in `97-GATE-STANDARD-THIRD-DIRECTION.md` is **CONFIRMED — three instances**. This is
the result of record; the register row's older status is stale.

No `93-VALIDATION.md` was fabricated. The new `93-VALIDATION-WAIVER.md` records that the Validation
Architecture precondition was met, the artifact was never created, and fabricated history is barred.

## Exit-code contracts

- `config-step-artifacts.mjs`: **0** for a completed report, **1** for an unreadable/invalid input,
  **2** for usage.
- `decision-coverage.mjs`: **0** for covered/skipped, **1** for uncovered, **2** for usage. The repaired
  sub-lettered fixture exits **0** with a non-zero population of five, so zero is not an empty-input
  success.
- `gate-drill.mjs`: **0** for a parse-valid drill report, **1** for parse/usage/IO failure, newly **4**
  for a nested drill, and newly **5** for a self-referential gate. The self-reference fixture's stub
  would exit 0 if executed; exit 5 proves it was refused instead.

## Post-change execution record, in order

All commands below ran from the repository root unless the command itself changes directory. Outputs
are verbatim.

### 1. C9b extracted-line oracle

Command: the complete GATESTD-01 command oracle from `102-01-PLAN.md`, beginning
`PATH="/opt/homebrew/bin:$PATH"` and extracting the first fail-closed `case "$id"` line.

```text
P102-01-C9B unsafe_probe=[UNSAFE ID (triage by hand):  -> 'some.file.test'
(eval):continue:1: not in while, until, select, or repeat loop] safe_probe=[safe: 'safe_id-1'] expected UNSAFE ID ... and safe
PASS c9b
```

The `continue` diagnostic is expected only because the plan deliberately evaluates the extracted
one-line loop clause outside its loop. Both asserted branches reached their subject and passed.

### 2. Configuration/artifact oracle

Command: the complete GATESTD-02 command oracle from `102-01-PLAN.md`, invoking
`node scripts/config-step-artifacts.mjs .planning/config.json .planning/phases` and checking the
derived `enabled` and P93 verdict fields.

```text
  CSA P95 validation=present
  CSA P96 validation=present
  CSA P97 validation=present
  CSA P98 validation=present
  CSA P93 waiver=present
P102-01-CSA enabled=8 P93 waiver=present expected enabled=8 P93 waiver=present
PASS csa
```

### 3. Sub-lettered decision fixture oracle

Command: the complete GATESTD-03 scratch-fixture oracle from `102-01-PLAN.md`; its temporary-directory
cleanup was left to the managed temporary-directory lifecycle.

```text
P102-01-DCOV rc=0 total=5 covered=5 expected total=5 covered=5
PASS dcov
```

The `rc=0` sits beside `total=5 covered=5`, the positive control proving the instrument saw the full
non-zero population rather than passing on an empty decision set.

### 4. Nested and self-referential drill fixture oracle

Command: the complete GATESTD-05 scratch-fixture oracle from `102-01-PLAN.md`, including its 10-second
`spawnSync` timeout; its temporary-directory cleanup was left to the managed temporary-directory
lifecycle.

```text
P102-01-GDRILL nested=4 selfref=5 expected nested=4 selfref=5
PASS gdrill
```

Neither leg reported `TIMEOUT`. The plain fixture is the control for exit 4, and the self-referential
fixture contains an executable `echo` stub that would produce exit 0 if the exit-5 pre-run guard were
absent.

### 5. Full real-tree configuration/artifact report

Command:

```bash
node scripts/config-step-artifacts.mjs .planning/config.json .planning/phases
```

```text
enabled=8
enabled_steps=research=true,plan_check=true,verifier=true,nyquist_validation=true,node_repair=true,ui_phase=true,ui_safety_gate=true,skip_discuss=false
disabled=auto_advance=false,text_mode=false,research_before_questions=false,_auto_chain_active=false
non_boolean=node_repair_budget=2,discuss_mode="discuss"
P86 validation=present
P87 validation=present
P88 validation=present
P92 validation=present
P94 validation=present
P95 validation=present
P96 validation=present
P97 validation=present
P98 validation=present
P93 waiver=present
```

This re-derives the eight-step population from `workflow.*`; none of the counts were transcribed from
the research note. The disabled and non-Boolean populations are printed beside the enabled set so a
polarity or type-classification error is visible.

### 6. Platform and outside-repository fail-closed control

Command:

```bash
printf 'sed=%s\n' "$(command -v sed)"
if command -v gsed >/dev/null 2>&1; then printf 'gsed=%s\n' "$(command -v gsed)"; else echo 'gsed=absent'; fi
(cd /tmp && [ -f .planning/GATE-STANDARD.md ] || { echo "INSTRUMENT-CANNOT-RUN: .planning/GATE-STANDARD.md absent - not at the repo root"; exit 3; })
printf 'outside_repo_exit=%s\n' "$?"
```

```text
sed=/usr/bin/sed
gsed=absent
INSTRUMENT-CANNOT-RUN: .planning/GATE-STANDARD.md absent - not at the repo root
outside_repo_exit=3
```

Thus the C9b repair was verified on macOS with `/usr/bin/sed` and no `gsed`; the removed sed escape
line is no longer part of the shipped derivation. The outside-repository control reaches the explicit
instrument-cannot-run verdict and exit 3.

## Scope and follow-up

Only the five allowlisted deliverable paths/classes changed. No work is deferred to a later task, and
the scoped third direction does not rewrite or re-grade earlier phase evidence.
