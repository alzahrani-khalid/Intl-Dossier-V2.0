# RULING-P99-91 — reword nine fallback-option criteria; do not widen scope

**Decision:** Accept the compiler's fail-closed finding. Reword the criterion illustrations in P99-30…P99-38 so the i18next fallback option is described as prose rather than a backticked program identifier. Do not add `frontend/tests/setup.ts` to any task scope.

The compiler resolved the illustrative token `defaultValue` to an unrelated test declaration and trapped nine tasks between criterion and scope. The option key is not a dependency those workers edit. Scope widening would make an unrelated test file legally editable and is rejected.

## Exact edit

- P99-30: replace the backticked `t(key, { defaultValue })` population label with "object-form fallback-text-options class".
- P99-31…P99-38: replace the backticked object-call transformation with prose: remove the object-form fallback-text option while preserving every remaining option. Rename the following natural-language "defaultValue class" label to "object-form fallback class".

Do not change commands, file lists, counts, lane budgets, task dependencies, product paths, or other criteria. These nine plans are outside the 16-blob reviewed candidate pair, so this documentation-only compiler repair does not invalidate the runtime review.

Commit the ruling and nine plan files together. Advance the clean engine worktree to that real tip, preserving ignored dependencies/config/doctor state, then rerun the private-pinned compile. If compile exposes another contract error, stop; do not chain source repairs.

On compile success, run `tickmarkr plan`, perform every mechanical check from RULING-P99-90 §4, update `P99R-ENGINE-PLAN-R90.md` with a successor section ending `ORCH-P99R-ENGINEPLAN-R91-END`, and stop before run.
