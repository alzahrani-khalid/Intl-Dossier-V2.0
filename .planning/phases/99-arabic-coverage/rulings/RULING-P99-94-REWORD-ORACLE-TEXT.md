# RULING-P99-94 — edit the actual compiler-scanned oracle text

**Decision:** The prior three edits targeted unscanned plan fields. The compiler renderer is now read directly: for a command oracle with `text`, it scans only `item.text`, not the command, truths, action, or body prose.

Across all 41 plans, the rendered acceptance-item population contains exactly eight offending hits, one per P99-31…P99-38, matching the eight errors 1:1. Replace only:

`AND no defaultValue option survives in them.`

with:

`AND no fallback-text option survives in them.`

in those eight oracle `text` fields. Do not change the command or any other field.

Commit this ruling and eight plans, advance the clean engine worktree, and run pinned compile once. On success run plan and RULING-P99-90 §4; on any error stop. No further speculative token edit is authorized.
