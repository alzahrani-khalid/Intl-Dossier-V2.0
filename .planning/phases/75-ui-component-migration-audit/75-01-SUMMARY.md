---
phase: 75-ui-component-migration-audit
plan: 01
subsystem: ui
tags: [audit, classification, shadcn, heroui, rtl, clearance, dossier-type, docs-only]

# Dependency graph
requires:
  - phase: 75-ui-component-migration-audit (RESEARCH)
    provides: verified tree ground truth (799/99/10/13/62/94/116) + domain-signal file lists + narrow RTL reading recommendation
provides:
  - AUDIT-01 classification artifact (header rulebook + evidence baseline + domain-signal lists)
  - Per-directory classification tier — 114 rows (every top-level component dir except ui/ and forms/)
  - Fixed 3-label taxonomy, downgrade rule, criterion-5 default, narrow direction-owner RTL reading
  - Tier-1 summary handoff addressed to Phase 76 (RTL bridge) and Phase 77 (TOKEN-06 re-skin)
affects: [76-rtl-bridge, 77-token-06-reskin, 75-04-per-file-tier]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Two-tier classification granularity: per-directory for feature dirs, per-file for ui/+forms/ (plan 75-04)'
    - 'prettier-ignore fence on markdown tables whose cells contain __double_underscore__ paths'
    - 'Evidence-backed classification: every row cites a grep hit, a named file, or dir listing + STRUCTURE.md'

key-files:
  created:
    - .planning/phases/75-ui-component-migration-audit/75-AUDIT-classification.md
  modified: []

key-decisions:
  - 'Narrow direction-owner RTL reading (resolves RESEARCH Open Question 2): only dir=-owners / direction-conditional logic / RTL infra default keep-custom; consumed-isRTL routes to the Behaviors cell'
  - 'Advisory labels (dead — delete candidate) live in Notes only; taxonomy stays fixed at 3 labels (resolves RESEARCH Open Question 3)'
  - 'Zero bare replace-with-shadcn-primitive at directory granularity — primitives are a per-file (ui/+forms/) concern for plan 75-04'
  - '5 block rows: table/ bare; layout/, modern-nav/, dashboard-widgets/, empty-states/ carry + domain-wrapper'

patterns-established:
  - '6-column row schema shared by both classification tiers'
  - 'Criterion-5 gate: domain-signal directories can never classify bare primitive (enforced by awk in plan verify)'

requirements-completed: [] # AUDIT-01 only PARTIALLY advanced (directory tier); closed by plan 75-04 (per-file tier + coverage reconciliation)

# Metrics
duration: 15min
completed: 2026-07-02
---

# Phase 75 Plan 01: AUDIT-01 Component Classification (directory tier) Summary

**AUDIT-01 classification artifact with the fixed 3-label taxonomy, dated evidence baseline (799/99/10/13/62/94/116), pre-computed clearance/flags/dossier-type lists, and one classification row for each of the 114 top-level component directories outside `ui/` and `forms/` — every clearance/flags/dossier-type/direction-owner surface locked to keep-custom or block+domain-wrapper.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-02T10:39:05Z
- **Completed:** 2026-07-02T10:54:44Z
- **Tasks:** 2
- **Files modified:** 1 (created)

## Accomplishments

- Created `75-AUDIT-classification.md` with the rulebook header stating all three fixed taxonomy labels, the empty-Behaviors downgrade rule, the criterion-5 domain-signal default, the classify-by-imports rule, and the **narrow direction-owner** RTL operationalization (explicitly noted as resolving RESEARCH Open Question 2).
- Pasted a dated evidence baseline — all seven figures match RESEARCH exactly with **no drift** as of 2026-07-02 (799 total, 99 tests, 10 clearance, 13 flags/glyphs, 62 dossier-type, 94 dir-owner, 116 top-level dirs).
- Embedded the verbatim clearance (10) and flags/glyphs (13) file lists and recorded the 62-file dossier-type list via its evidence command output.
- Classified every one of the 114 non-`ui/`/`forms/` top-level directories (live `ls -d` count 116 minus 2): 109 keep-custom, 4 replace-with-shadcn-block + domain-wrapper, 1 bare replace-with-shadcn-block, 0 bare primitive.
- All 8 awk-gated domain-signal directories (`calendar`, `copilot`, `intelligence`, `dossier`, `signals`, `entity-links`, `signature-visuals`, `list-page`) classify keep-custom; the criterion-5 gate exits 0.
- Wrote the "Tier-1 summary for Phase 76/77" naming the direction-owner set Phase 76 must bridge and handing the `ui/` TOKEN-06 scope detail to plan 75-04.

## Task Commits

Each task was committed atomically:

1. **Task 1: Classification artifact skeleton (rulebook header + dated evidence baseline)** - `a94af853` (docs)
2. **Task 2: Classify every top-level directory outside ui/ and forms/** - `4d27c7b9` (docs; amended once to add the prettier-ignore fix, see Deviations)

## Files Created/Modified

- `.planning/phases/75-ui-component-migration-audit/75-AUDIT-classification.md` (390 lines) - AUDIT-01 classification: header rulebook, 6-column row schema, dated evidence baseline, clearance/flags/dossier-type domain-signal lists, 114-row per-directory table, Tier-1 Phase 76/77 summary, and empty placeholders for the per-file tier + coverage reconciliation (plan 75-04).

## Decisions Made

- **Narrow direction-owner RTL reading** adopted and stated in the artifact header (resolves RESEARCH Open Question 2). A literal reading would default 397/799 files to keep-custom and erase the audit's signal; the narrow reading keeps direction-owners protected while routing consumed-`isRTL` behavior into the Behaviors cell.
- **Advisory labels in Notes only** (resolves RESEARCH Open Question 3): `dead — delete candidate` (used for `editor/`, which holds only `CollaborativeEditor.tsx.disabled`) and `test-only` (used for `__tests__/`) live in Notes; the taxonomy is never extended past three labels.
- **Zero bare primitive rows at directory granularity** — the expected outcome of two-tier granularity; primitive-replaceable surfaces are the `ui/`+`forms/` per-file tier's job (plan 75-04). This also sidesteps the empty-Behaviors downgrade trap.
- **Block set kept small and defensible** — only genuine shell/nav/dashboard/data-table/empty-state compositions: `table/` (bare, no domain signal) plus `layout/`, `modern-nav/`, `dashboard-widgets/`, `empty-states/` (each `+ domain-wrapper` with a named Behaviors cell).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wrapped the per-directory table in `<!-- prettier-ignore -->`**

- **Found during:** Task 2 (post-commit gate re-verification)
- **Issue:** The repo pre-commit hook runs `prettier --write` on staged `.planning/*.md` (npx resolves prettier from the parent repo's `node_modules` up the tree; `HUSKY=0` does not disable it because `.husky/pre-commit` is a plain script that never sources husky's helper). Prettier interprets `__tests__` as markdown bold and rewrote table cells to `**tests**`, corrupting the `components/__tests__/` surface and the `positions/__tests__/…` + `relationships/__tests__/…` evidence citations, and dropping the strict row-count gate from 114 to 113.
- **Fix:** Regenerated the table with a `<!-- prettier-ignore -->` fence immediately preceding it so prettier leaves the table verbatim; amended the Task 2 commit. Code-fenced lists in Section 4 were never affected (prettier does not format fenced blocks).
- **Files modified:** `.planning/phases/75-ui-component-migration-audit/75-AUDIT-classification.md`
- **Verification:** Post-commit, `grep -c '\*\*tests\*\*'` = 0; strict row count = 114; awk criterion-5 gate exits 0; `__tests__/` and `editor/` rows present with correct paths.
- **Committed in:** `4d27c7b9` (amended Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking tooling issue)
**Impact on plan:** Necessary for artifact correctness (the paths would otherwise be wrong) and to pass the plan's own row-count gate. No scope creep — content is identical, only the table is fenced from prettier.

## Issues Encountered

- **`HUSKY=0` is a no-op in this repo** — the pre-commit hook is a plain script, so hooks run regardless. Docs commits therefore rely on the hook's own `.planning/`-only build/knip skip (which fired correctly) plus prettier-idempotent / prettier-ignored content rather than on skipping hooks.

## Known Stubs

None — this is a docs-only audit artifact; no runtime code, no data wiring, no placeholders that gate a runtime goal. The Section 6/7 placeholders are intentional handoffs to plan 75-04, documented as such in the artifact.

## Threat Surface Scan

No new security-relevant surface introduced. Threat T-75-01 (information disclosure) mitigated: the artifact carries only file paths, component names, counts, and commands — no runtime data, no gated-RPC payload samples, no secrets (`clearance`/`sensitivity_level`/`getDossierRouteSegment` appear only as grep terms and code identifiers). Threat T-75-02 (downstream EoP) mitigated: all clearance/flags/dossier-type directories classify keep-custom and the awk gate in the plan's verify blocks any bare primitive on those surfaces.

## Self-Check: PASSED

- FOUND: `.planning/phases/75-ui-component-migration-audit/75-AUDIT-classification.md`
- FOUND commit: `a94af853` (Task 1)
- FOUND commit: `4d27c7b9` (Task 2)
- Task 1 verify gate: PASS · Task 2 verify gate: PASS (114 rows, criterion-5 gate exits 0)

## Next Phase Readiness

- **Plan 75-04** consumes this artifact: fills Section 6 (per-file `ui/` + `forms/` rows) and Section 7 (coverage reconciliation), and closes AUDIT-01. The 6-column row schema and rulebook are already fixed for it to reuse.
- **Phase 76 (RTL bridge)** can read the Tier-1 summary + direction-owner set to scope `migrate rtl` and portal work.
- **Phase 77 (TOKEN-06 re-skin)** gets the keep-custom vs block map now; the `ui/` primitive-level TOKEN-06 detail arrives with plan 75-04.
- **AUDIT-01 is NOT yet complete** — only the directory tier is done; do not mark the requirement complete until 75-04 lands.

---

_Phase: 75-ui-component-migration-audit_
_Completed: 2026-07-02_
