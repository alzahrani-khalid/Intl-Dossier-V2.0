---
phase: 75
slug: ui-component-migration-audit
status: planned
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-02
---

# Phase 75 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Docs-only audit phase: the "tests" are reproducible evidence commands (ripgrep/find/awk/tsc) plus doc-structure gates on the three audit artifacts. No unit tests are written (per 75-RESEARCH.md Validation Architecture).

---

## Test Infrastructure

| Property               | Value                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **Framework**          | Evidence commands — bash/ripgrep/find/awk + `tsc --noEmit`; no new test files                            |
| **Config file**        | none — all commands embedded verbatim in plan `<verify><automated>` blocks (sourced from 75-RESEARCH.md) |
| **Quick run command**  | the touched plan's `<verify><automated>` command (each < 10s)                                            |
| **Full suite command** | all four plans' automated gates + `pnpm --dir frontend type-check`                                       |
| **Estimated runtime**  | ~5s per doc gate; type-check ~120–180s (run once per wave, not per commit)                               |

---

## Sampling Rate

- **After every task commit:** Run the task's `<verify><automated>` gate (doc-structure + live-grep consistency)
- **After every plan wave:** Re-run all completed plans' gates; Wave 1 additionally runs `pnpm --dir frontend type-check` (75-02 Task 1)
- **Before `/gsd:verify-work`:** All gates green; all three artifacts exist with dated evidence outputs
- **Max feedback latency:** 180 seconds (type-check bound; all other gates < 10s)

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref        | Secure Behavior                                                                        | Test Type            | Automated Command                                                                       | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ----------------- | -------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------- | ----------- | ---------- |
| 75-01-01 | 01   | 1    | AUDIT-01    | T-75-01           | artifact carries paths/commands/counts only — no runtime data or gated-RPC samples     | doc-structure grep   | 75-01 Task 1 `<automated>` (header/taxonomy/downgrade/RTL-reading greps)                | ✅          | ⬜ pending |
| 75-01-02 | 01   | 1    | AUDIT-01    | T-75-02           | clearance/flags/dossier directories never classify primitive-replace                   | count + awk gate     | 75-01 Task 2 `<automated>` (dir-row count vs live `ls -d`; domain-signal awk gate)      | ✅          | ⬜ pending |
| 75-02-01 | 02   | 1    | AUDIT-02    | T-75-03 / T-75-01 | verdicts pair command + raw output + date; live import count matches doc claim         | live grep + doc gate | 75-02 Task 1 `<automated>` (live `@heroui/react` count == doc `Import-site count`)      | ✅          | ⬜ pending |
| 75-02-02 | 02   | 1    | AUDIT-03    | T-75-03           | removed-names grep re-run live at verify time (exit 1) — doc cannot contradict tree    | live grep + doc gate | 75-02 Task 2 `<automated>` (removed-names grep exit 1 + nuance/protocol greps)          | ✅          | ⬜ pending |
| 75-03-01 | 03   | 1    | AUDIT-04    | T-75-04 / T-75-05 | contracts led by liveness evidence; validation/ARIA paths are explicit contract fields | doc-structure grep   | 75-03 Task 1 `<automated>` (5 sections + liveness `: 0` lines + non-contractual marker) | ✅          | ⬜ pending |
| 75-03-02 | 03   | 1    | AUDIT-04    | T-75-04           | aria-invalid/aria-describedby/role=alert coverage recorded for validation wrappers     | doc-structure grep   | 75-03 Task 2 `<automated>` (2 sections + ARIA attribute greps)                          | ✅          | ⬜ pending |
| 75-03-03 | 03   | 1    | AUDIT-04    | T-75-05           | rescope input recorded without rescoping Phase 79; facade contract with 4 consumers    | doc-structure grep   | 75-03 Task 3 `<automated>` (8-section count + consumers + "Phase 79 rescope input")     | ✅          | ⬜ pending |
| 75-04-01 | 04   | 2    | AUDIT-01    | T-75-06           | classification by imports, never filename/docstring; dead-primitive evidence pasted    | count + content grep | 75-04 Task 1 `<automated>` (>=37 ui rows + delete-candidate + lookalike greps)          | ✅          | ⬜ pending |
| 75-04-02 | 04   | 2    | AUDIT-01    | T-75-06           | per-file coverage self-calibrates against live find counts (no silent omissions)       | count gate           | 75-04 Task 2 `<automated>` (ui/forms row counts == live non-test find counts)           | ✅          | ⬜ pending |
| 75-04-03 | 04   | 2    | AUDIT-01    | T-75-02           | downgrade rule + domain cross-check mechanically enforced over the whole artifact      | awk gates            | 75-04 Task 3 `<automated>` (empty-behaviors awk + 10/10 PASS + ltr-isolate keep-custom) | ✅          | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — ripgrep, find, awk, and `pnpm --dir frontend type-check` are all present and verified (75-RESEARCH.md Environment Availability). No test files, fixtures, or framework installs needed.

---

## Manual-Only Verifications

| Behavior                                                          | Requirement | Why Manual                                                                            | Test Instructions                                                                                                                                     |
| ----------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classification judgment quality (right label for ambiguous files) | AUDIT-01    | label choice is analyst judgment; gates enforce coverage/defaults, not correctness    | spot-read 5 random ui/ rows against their source files at `/gsd:verify-work`; check Behaviors cells are real behaviors from the file, not boilerplate |
| Contract completeness vs component source                         | AUDIT-04    | ARIA/keyboard fields are prose read out of source; greps prove presence, not fidelity | diff SearchableSelect contract's keyboard-nav list against the actual handlers in SearchableSelect.tsx                                                |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task has one)
- [x] Wave 0 covers all MISSING references (none — no MISSING markers)
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-02 (planner)
