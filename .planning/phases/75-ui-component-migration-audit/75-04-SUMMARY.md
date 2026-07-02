---
phase: 75-ui-component-migration-audit
plan: 04
subsystem: ui-component-audit
tags: [audit, classification, ui, forms, aceternity, heroui, rtl, docs-only]
requirements: [AUDIT-01]
dependency_graph:
  requires:
    - '75-01: header rulebook + evidence baseline + per-directory tier (the artifact this plan appends to)'
  provides:
    - 'AUDIT-01 per-file classification tier for components/ui/ (73) + components/forms/ (22)'
    - 'Aceternity-derived liveness evidence appendix (dated 2026-07-02)'
    - 'Enforcement sweep + coverage reconciliation + consumer hand-off summary'
  affects:
    - 'Phase 76 (RTL bridge surface): direction-owner + RTL-infrastructure rows'
    - 'Phase 77 (TOKEN-06 re-skin scope): 28 primitive-replace verdicts + 1 block + carve-out rows'
    - 'Phase 79 (dead-primitive / forms rebuild): 8 delete-candidate ui/ primitives + forms cross-reference'
tech_stack:
  added: []
  patterns:
    - 'Two-tier classification: per-file for ui/+forms/, per-directory elsewhere'
    - 'Narrow direction-owner RTL reading (dir= setters = keep-custom)'
    - 'Classify by imports/rendered output, never filename/docstring'
    - 'Advisory labels (dead — delete candidate) live in Notes; taxonomy fixed at 3 labels'
key_files:
  created:
    - '.planning/phases/75-ui-component-migration-audit/75-04-SUMMARY.md'
  modified:
    - '.planning/phases/75-ui-component-migration-audit/75-AUDIT-classification.md'
decisions:
  - 'form-wizard.tsx classified keep-custom on a genuine domain signal (sensitivity_level field branching), not merely RTL-consumer'
  - 'Non-Aceternity 0-importer ui/forms files record "0 importers" in Evidence but NOT the "dead — delete candidate" advisory (reserved for the 9 Aceternity-derived ui/ primitives per plan) to keep Phase 79 grep scoped'
  - 'Re-export shims classified to follow their underlying implementation (button/card/skeleton → HeroUI keep; badge/switch → lookalike primitive; tabs → Radix direction-owner keep)'
  - 'ui/sidebar.tsx classified replace-with-shadcn-block (shadcn sidebar block); ui/table.tsx primitive (atomic table elements; DataTable block lives in table/)'
metrics:
  tasks_completed: 3
  files_changed: 1
  commits: 3
  duration_minutes: 55
  completed: 2026-07-02
---

# Phase 75 Plan 04: Per-file Component Classification Tier Summary

Completed the AUDIT-01 classification artifact with per-file rows for every non-test file in `components/ui/` (73) and `components/forms/` (22), a mechanical enforcement sweep, and an arithmetic coverage reconciliation that ties 95 per-file + 605 per-directory-covered rows to the live 700-file tree.

## What Was Built

Three tasks, each a single commit against the shared Wave-1 artifact `75-AUDIT-classification.md`:

1. **Task 1 — first 37 ui/ files** (`accordion.tsx` → `heroui-switch.tsx`): added the Aceternity-derived liveness evidence appendix (run verbatim from RESEARCH, dated 2026-07-02: 8 of 9 primitives at 0 importers, `world-map` at 1), then one classification row per file. The 5 real HeroUI v3 wrappers (`heroui-button/card/forms/modal/skeleton`) are marked "Phase 78 surface, not a shadcn target"; the `heroui-chip`/`heroui-switch` lookalikes are classified on their actual CVA/plain implementation with the stale-docstring/no-HeroUI-import facts in Evidence.

2. **Task 2 — remaining 36 ui/ files + all 22 forms/ files**: `heroui-tabs.tsx` classified as the third Radix lookalike (direction-owner keep-custom); `world-map.tsx` keep-custom with its 1 named importer; `sidebar.tsx` the one per-file block. Forms tier: the 8 Aceternity-styled components cross-reference `75-AUDIT-aceternity-contracts.md` (7 of 8 dead; `SearchableSelect` live via `UserPicker`); `UserPicker` and `ContextualHelp` cite named consumers; `FormInput`/`FormSelect` are the only two primitive-replace forms rows; the dead `forms/index.ts` barrel (0 importers) is recorded.

3. **Task 3 — enforcement + reconciliation + hand-off**: downgrade awk gate (0 primitive rows with empty behaviors), domain-signal cross-check (clearance 10/10, flags/glyphs 13/13, ui/ direction-owners 12/12 — all keep-custom PASS), dated coverage arithmetic (700 = 95 per-file + 605 per-directory-covered), a label-tally table, and a Section-0 consumer hand-off summary addressed to Phases 76/77/79.

**Final label tallies.** Per-file tier (95 rows): 66 keep-custom, 28 replace-with-shadcn-primitive, 1 replace-with-shadcn-block. Whole artifact (209 rows): 175 keep-custom, 28 primitive, 6 block.

## Key Decisions

- **`form-wizard.tsx` → keep-custom on a domain signal.** Grep surfaced `sensitivity_level` field branching (lines 469/564), a genuine dossier domain signal, so it is keep-custom for domain field handling rather than a bare RTL-consumer.
- **Delete-candidate advisory stays scoped.** Several non-Aceternity ui/forms files also have 0 importers (`chart`, `sidebar-collapsible`, `timeline`, `related-entity-carousel`, `enhanced-progress`, `file-upload`, `thumb-zone-safe-area`, `touch-target`, `pull-to-refresh-container`, and 18 of 22 forms files). Their 0-importer status is recorded in Evidence, but the `dead — delete candidate` Notes advisory is applied ONLY to the 9 Aceternity-derived ui/ primitives (per plan), keeping Phase 79's advisory grep precise.
- **Re-export shims follow their target.** `button/card/skeleton` shims → HeroUI wrappers (keep, Phase 78); `badge` → CVA `heroui-chip` lookalike (primitive); `switch` → plain `heroui-switch` lookalike (primitive); `tabs` → Radix `heroui-tabs` (direction-owner keep).
- **Direction-owner narrow reading applied literally.** All 12 ui/ files that set `dir=` (11 Radix/infra setters + the `tabs` shim) are keep-custom, per rulebook (d).

## Deviations from Plan

None — plan executed as written.

Tooling notes (not deviations): commits used the repo-sanctioned `HUSKY=0` path for `.planning/*.md` (per the plan's commit note and established lint-staged-churn pattern); the pre-commit hook self-detected `.planning`-only changes and skipped `pnpm build`. The prettier pass inserted a blank line after the Task-1 table, so the Task-2 edit was re-anchored to include that blank line — content unaffected. All row counts were verified on the COMMITTED file (`git show HEAD:...`), not the pre-commit working copy.

## Known Stubs

None — documentation-only plan, no production code changed.

## Self-Check: PASSED

- Artifact modified and committed: `git show HEAD:.planning/phases/75-ui-component-migration-audit/75-AUDIT-classification.md` → ui rows = 73, forms rows = 22 (equal to live non-test file counts).
- All three FILLED-BY / TASK markers replaced (0 remaining in committed file).
- Downgrade awk gate PASS; ltr-isolate keep-custom PASS; `10/10` and `Coverage reconciliation` present on committed file.
- Commits present: `7e534415` (Task 1), `ff67c056` (Task 2), `366a2ed0` (Task 3) — all on `worktree-agent-*` branch.
