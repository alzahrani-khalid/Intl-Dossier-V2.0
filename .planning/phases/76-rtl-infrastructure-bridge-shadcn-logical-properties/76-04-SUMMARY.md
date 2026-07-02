---

phase: 76-rtl-infrastructure-bridge-shadcn-logical-properties
plan: 04
subsystem: ui
tags: [rtl, shadcn, migrate, codemod, components-json, srtl-01]

# Dependency graph

requires:

- phase: 76-01
  provides: single direction owner (ui/direction.tsx) — the runtime half of the RTL bridge
- phase: 76-02
  provides: scripts/check-duplicate-rtl.mjs recurrence guard (trips if migrate rtl is ever re-run)
- phase: 76-03
  provides: Radix wrappers inherit direction from context (no getDocDir defaults)
  provides:
- components.json "rtl": true — future `shadcn add` installs transform at install time (never re-run bulk migrate)
- Recorded one-shot `migrate rtl` run + reviewed-and-rejected evidence (SRTL-01 "applied exactly once" satisfied)
  affects: [77-shadcn-logical-properties, 79-registry-work-aceternity-pro]

# Tech tracking

tech-stack:
added: []
patterns: - 'shadcn `migrate rtl` on this new-york + heavily-customized tree is best-effort, NOT trusted: its output was reviewed hunk-by-hunk and rejected in full' - 'SRTL-01 one-shot is satisfied by (recorded run + components.json rtl:true + Plan-02 duplicate-rtl guard), not necessarily by a non-empty migrate commit'

key-files:
created: []
modified: - frontend/components.json

# Metrics

tasks-completed: 2
commits: 1
migrate-files-transformed-by-cli: 37
migrate-hunks-accepted: 0
migrate-hunks-rejected: all

# Phase 76 Plan 04: shadcn migrate rtl one-shot (SRTL-01) Summary

The one-shot `migrate rtl` protocol was executed and its output subjected to a full human-standard
hunk-by-hunk review. The reviewed diff was **rejected in its entirety** — the transform's net effect on
this repo was destructive (JSDoc/comment stripping across 25 files) plus risky centering-idiom corruption,
with negligible genuine logical-utility yield (as CONTEXT.md predicted: app + ui code is already
logical-properties-first by design). SRTL-01's "run exactly once, reviewed not trusted" contract is
satisfied by the recorded run + `components.json "rtl": true` + the Plan-02 recurrence guard.

## Performance

- CLI verified non-destructively first (`migrate --help` + `migrate --list` confirmed the `rtl` migration and the optional path/glob argument + `-y`), so the run was scoped to `src/components/ui/**` in one shot.

## Accomplishments

- Verified CLI syntax before running (A1 assumption resolved: `shadcn migrate [migration] [path]` accepts a glob; `-y` skips the prompt).
- Ran `pnpm dlx shadcn@latest migrate rtl "src/components/ui/**" -y` exactly once (37 files transformed by the CLI).
- Reviewed every hunk against the three named checkpoints + the universal rejection rule; rejected the whole diff and reverted all 37 `ui/*.tsx` via `git checkout --` (reproducible codemod output).
- Set `components.json "rtl": true` (kept), preserving the `@aceternity-pro` registry (Phase 79's surface).
- Confirmed the never-re-run guard: `check-duplicate-rtl` passes; a second migrate run would trip it.

## Task Commits

- Task 1 (migrate one-shot): **no commit** — reviewed diff empty after rejection; run recorded here as evidence (plan-sanctioned empty-reviewed-diff path).
- Task 2: `52f069e9 chore(76-04): enable components.json rtl transform flag (SRTL-01)`

## Files Created/Modified

- Modified: `frontend/components.json` (added top-level `"rtl": true`; registries/style/tailwind blocks unchanged).

## Decisions Made

- **Rejected the entire migrate-rtl output** (user-approved checkpoint decision). The CLI produced 37 changed files / 424 deletions vs 26 insertions; of these:
  - ~25 files = pure JSDoc/comment-header stripping (zero RTL value, destructive — e.g. `context-aware-fab.tsx` lost its 30-line usage doc).
  - `alert-dialog.tsx` + `dialog.tsx` = centering-idiom corruption (`left-[50%]→start-[50%]` + injected `rtl:-translate-x-[-50%]`; the plan's checkpoint #1 says reject if in doubt — a centered modal must stay direction-neutral).
  - `command.tsx` = meaningless `rtl:-translate-x-0` (negating zero).
  - `background-boxes/animated-tooltip/select/content-skeletons/enhanced-progress/sidebar` = speculative `rtl:` translate flips on decorative or already-hand-patched elements.
  - Only ~3 genuinely-safe logical conversions existed (navigation-menu `rounded-ss`, expandable-card `rounded-se/ss`, placeholders `origin-top-start`) — not worth committing alongside the damage; app code is already logical-first.
- Kept `components.json rtl:true` so install-time transforms cover future components (A2 caveat: on new-york style, treat future `shadcn add` output as best-effort-review too — noted for Phase 77/79).

## Deviations from Plan

- Plan Task 1 anticipated a "small handful of files" reviewed migrate commit. Actual CLI yield was 37 files dominated by destructive comment-stripping, so the reviewed diff was rejected in full and **no migrate commit was created** — the plan's documented empty-reviewed-diff branch. This is a stricter (safer) outcome than the plan's baseline, not a scope expansion.

## Issues Encountered

- shadcn `migrate rtl` strips leading JSDoc/comment blocks when it rewrites files on this tree — a codemod side effect unrelated to RTL. This is the primary reason the output could not be accepted wholesale.

## User Setup Required

- None.

## Next Phase Readiness

- Phase 77 (shadcn logical properties): the `rtl:true` flag is set; any future `shadcn add` on new-york is best-effort and must be reviewed. The bulk `migrate rtl` must NEVER be re-run (idempotency bug #9891); the Plan-02 guard enforces recurrence detection.

## Verification

- `node scripts/check-duplicate-rtl.mjs frontend/src` → exit 0 (post-revert tree is duplicate-free)
- Hand-patches intact: `pagination.tsx rtl:rotate-180` = 2, `sidebar.tsx rtl:-scale-x-100` = 1, `calendar.tsx rotate-180` = 2
- `sheet.tsx` paired `ltr:`/`rtl:` slide variants untouched
- `frontend/components.json` parses; `"rtl": true` present; `@aceternity-pro` registry preserved
- Pre-commit build hook (turbo) ran green on the components.json commit

## Self-Check: PASSED
