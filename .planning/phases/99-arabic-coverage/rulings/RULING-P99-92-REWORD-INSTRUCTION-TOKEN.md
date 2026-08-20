# RULING-P99-92 — remove the remaining backticked option token in P99-31…38

**Decision:** R91 fixed P99-30 and reduced the same contract violation from nine tasks to eight. Reword the one identical remaining instruction in P99-31…P99-38; do not touch scope or P99-30's body prose.

Replace:

`Remove the second-argument literal and the \`defaultValue\` option at every mask site`

with:

`Remove the second-argument literal and the fallback-text option at every mask site`

in the eight plan instruction strings only. No command, count, file list, dependency, budget, product path, or other criterion changes.

Before commit, enumerate every remaining backticked `defaultValue` occurrence across the 41 plans and classify whether it is inside a compiler-scanned criterion string or non-criterion body prose. The only permitted survivor is P99-30's explanatory research/body text, which the R91 compile demonstrated is outside the scanned criterion population.

Commit this ruling and eight plans together. Advance the clean engine worktree and rerun pinned compile once. On success run plan and complete RULING-P99-90 §4; on any error stop without another edit.
