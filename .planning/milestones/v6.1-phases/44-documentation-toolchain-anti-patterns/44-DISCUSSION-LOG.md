# Phase 44: Documentation, Toolchain & Anti-patterns - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 44-documentation-toolchain-anti-patterns
**Areas discussed:** VERIFICATION.md path & shape, STORY-01 path, Anti-pattern sweep scope, size-limit fix strategy

---

## VERIFICATION.md Path & Shape

| Option                      | Description                                                                               | Selected |
| --------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Restore `.planning/phases/` | Put the six backfilled files back in active phase directories.                            |          |
| Archive path                | Move to `.planning/milestones/v6.0-phases/{n}-*/` and patch active requirements to match. | yes      |
| Hybrid                      | Keep active stubs plus archived canonical files.                                          |          |

**User's choice:** Archive path.
**Notes:** Treat the working-tree deletions of old phase dirs as an in-progress archive move. Phase 44 must commit the move and patch DOC-01..DOC-06 path strings.

| Option               | Description                                       | Selected |
| -------------------- | ------------------------------------------------- | -------- |
| Lightweight          | REQ-ID, verdict, and one-line artifact reference. | yes      |
| Detailed retroactive | Reconstruct fuller validation narratives.         |          |
| Hybrid               | Detailed where gaps exist, lightweight elsewhere. |          |

**User's choice:** Lightweight.
**Notes:** Mirror v3.0 Phase 12/13 VERIFICATION.md shape at roughly 30-50 lines per file.

| Option           | Description                                                   | Selected |
| ---------------- | ------------------------------------------------------------- | -------- |
| Per-VERIFICATION | Flip checkboxes as each backfilled phase verification lands.  | yes      |
| Batch            | Write all verification files first, then flip all checkboxes. |          |
| Single capstone  | One final docs sync at the end.                               |          |

**User's choice:** Per-VERIFICATION.
**Notes:** Pair checkbox flips with that phase's owned REQ-IDs in v6.0 REQUIREMENTS and ROADMAP archive.

| Option                | Description                                                       | Selected |
| --------------------- | ----------------------------------------------------------------- | -------- |
| STATE.md + SUMMARY.md | Use existing phase summaries and per-plan summaries as authority. | yes      |
| Re-run tests          | Re-run old validation suites for retroactive verdicts.            |          |
| Audit only            | Use only the milestone audit gap table.                           |          |

**User's choice:** STATE.md + SUMMARY.md.
**Notes:** Cross-check v6.0-MILESTONE-AUDIT.md. Do not re-run tests solely for doc backfill.

---

## STORY-01 Path

| Option             | Description                                  | Selected |
| ------------------ | -------------------------------------------- | -------- |
| ADR-006 deferral   | Formalize deferral and replacement coverage. | yes      |
| Ship Storybook now | Implement stories in Phase 44.               |          |
| Hybrid             | Write ADR and a small subset of stories.     |          |

**User's choice:** ADR-006 deferral.
**Notes:** New target path is `.planning/decisions/ADR-006-storybook-deferral.md`.

| Option                | Description                                                            | Selected |
| --------------------- | ---------------------------------------------------------------------- | -------- |
| Primitive count >15   | Revisit once signature-visuals exports more than 15 visual primitives. | yes      |
| Second designer joins | Revisit based on team composition.                                     |          |
| Token engine v2       | Revisit during a future token rewrite.                                 |          |
| v7.0 kickoff          | Revisit at next milestone start.                                       |          |

**User's choice:** Primitive count >15.
**Notes:** ADR-006 should define the count source explicitly because STORY-01's eight coverage targets and the current `signature-visuals` barrel do not map 1:1.

| Option            | Description                                                     | Selected |
| ----------------- | --------------------------------------------------------------- | -------- |
| Per-primitive map | Map each primitive to vitest and Playwright coverage artifacts. | yes      |
| General prose     | Describe replacement coverage generally.                        |          |
| Map + gap notes   | Include a coverage map and explicit gaps.                       |          |

**User's choice:** Per-primitive map.
**Notes:** Reviewer should be able to verify coverage directly from a table.

| Option                  | Description                                              | Selected |
| ----------------------- | -------------------------------------------------------- | -------- |
| SUPERSEDED banner       | Keep 33-08 as history and mark it superseded by ADR-006. | yes      |
| Delete file             | Remove the old plan.                                     |          |
| Convert to SUMMARY only | Replace plan detail with a summary artifact.             |          |

**User's choice:** SUPERSEDED banner.
**Notes:** v6.0 ROADMAP progress should still read 121/121.

---

## Anti-pattern Sweep Scope

| Option                  | Description                                                 | Selected |
| ----------------------- | ----------------------------------------------------------- | -------- |
| Audit-listed only       | Close WR-02..WR-06 in the files named by the v6.0 audit.    | yes      |
| Repo-wide pattern sweep | Search and fix every similar aria/i18n/CSS/nullish pattern. |          |
| New lint rules          | Add custom rules to prevent these exact patterns.           |          |

**User's choice:** Agent discretion - audit-listed only.
**Notes:** The user said "you decide." The selected default keeps Phase 44 surgical and avoids turning it into a broad cleanup phase.

| Option                     | Description                                                                   | Selected |
| -------------------------- | ----------------------------------------------------------------------------- | -------- |
| Current-code verification  | Treat stale audit lines as anchors and inspect current files before patching. | yes      |
| Patch exact line numbers   | Follow the audit line numbers literally.                                      |          |
| Ignore already-fixed items | Skip anything that appears changed without recording closure.                 |          |

**User's choice:** Agent discretion - current-code verification.
**Notes:** Some audit targets have already drifted, so planners should verify current source before editing.

| Option               | Description                                                               | Selected |
| -------------------- | ------------------------------------------------------------------------- | -------- |
| Existing checks      | Use targeted source checks, frontend lint, and scoped axe/browser checks. | yes      |
| Add custom lint gate | Write new static-analysis rules for WR-02..WR-06.                         |          |
| Browser-only         | Rely on axe/browser routes only.                                          |          |

**User's choice:** Agent discretion - existing checks.
**Notes:** Add custom lint only if existing tooling cannot verify closure.

---

## size-limit Fix Strategy

| Option                 | Description                                                                             | Selected |
| ---------------------- | --------------------------------------------------------------------------------------- | -------- |
| Strict budget recovery | Keep 815 KB as the merge gate and refactor bundles until it passes.                     |          |
| Truthful rebaseline    | Replace the 815 KB target entirely with current measured output.                        |          |
| Hybrid                 | Enforce current truthful budgets now while preserving 815 KB as an optimization target. | yes      |

**User's choice:** Agent discretion - hybrid.
**Notes:** `pnpm -C frontend size-limit` currently reports about 2.42 MB gzip total JS against an 815 KB limit, plus missing `d3-geo` and `signature-visuals` globs. Strict recovery would likely become a larger performance phase.

| Option                 | Description                                                              | Selected |
| ---------------------- | ------------------------------------------------------------------------ | -------- |
| Stable chunk names     | Align Vite manual chunks and size-limit globs around stable chunk names. | yes      |
| Chase current hashes   | Update globs to today's emitted route/file names.                        |          |
| Delete missing entries | Remove entries that do not match current output.                         |          |

**User's choice:** Agent discretion - stable chunk names.
**Notes:** Prefer stable Vite chunk names for signature visuals/world assets over brittle hashed route output.

| Option                   | Description                                                        | Selected |
| ------------------------ | ------------------------------------------------------------------ | -------- |
| Correct command spelling | Use `pnpm -C frontend ...` or the actual package selector.         | yes      |
| Leave roadmap command    | Keep `pnpm --filter frontend ...` despite local mismatch.          |          |
| CI-only verification     | Ignore local command mismatch because CI uses `working-directory`. |          |

**User's choice:** Agent discretion - correct command spelling.
**Notes:** `pnpm --filter frontend build` matched no project locally. `pnpm -C frontend build` succeeded.

---

## Agent Discretion

- Anti-pattern sweep scope: audit-listed WR-02..WR-06 only.
- Size-limit strategy: hybrid truthful enforcement now, historical 815 KB target preserved as an optimization goal.

## Deferred Ideas

- Major bundle optimization to return total JS to 815 KB.
- Visual-regression baseline regeneration for Phase 46.
