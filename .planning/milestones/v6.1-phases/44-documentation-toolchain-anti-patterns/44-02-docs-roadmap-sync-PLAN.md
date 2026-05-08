---
phase: 44-documentation-toolchain-anti-patterns
plan: 02
type: execute
wave: 3
depends_on: ['44-01', '44-03', '44-05', '44-06']
files_modified:
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/milestones/v6.0-REQUIREMENTS.md
  - .planning/milestones/v6.0-ROADMAP.md
  - .planning/MILESTONES.md
autonomous: true
requirements: [DOC-07, DOC-08, TOOL-01, TOOL-02, TOOL-03, STORY-01]
tags: [docs, roadmap, audit]
must_haves:
  truths:
    - 'D-02: active DOC-01..DOC-06 paths point to .planning/milestones/v6.0-phases'
    - 'D-05: flip DOC-07 checkbox state per backfilled verification, one phase at a time'
    - 'D-15: 815 KB remains aspirational, not the enforced Phase 44 merge gate'
    - 'D-17: active docs use pnpm -C frontend commands unless workspace selector is corrected'
    - 'D-19: folded todo scope is Phase 44 source, not Phase 45 or Phase 46'
    - 'D-20: done means backfilled verification, size-limit green, WR closure, ADR, and synced checkboxes'
  artifacts:
    - path: .planning/milestones/v6.0-REQUIREMENTS.md
      provides: all 52 v6.0 REQ-IDs checked after evidence exists
    - path: .planning/milestones/v6.0-ROADMAP.md
      provides: 121/121 complete archive progress
---

<objective>
Perform the final documentation sync after all Phase 44 evidence artifacts
exist: active requirements/roadmap text, v6.0 archive checkboxes, v6.0 roadmap
progress, and audit confirmation.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Patch active v6.1 REQUIREMENTS and ROADMAP stale paths/commands</name>
  <files>.planning/REQUIREMENTS.md, .planning/ROADMAP.md</files>
  <read_first>
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-CONTEXT.md
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-size-limit-regression-proof.md
  </read_first>
  <action>
Update active Phase 44 text so it matches locked decisions and real commands:

1. Change DOC-01..DOC-06 verification paths from
   `.planning/phases/{n}-*/VERIFICATION.md` to
   `.planning/milestones/v6.0-phases/{n}-*/VERIFICATION.md`.
2. Change TOOL command text from `pnpm --filter frontend size-limit` to
   `pnpm -C frontend size-limit`.
3. Clarify that the historical `815 KB` total is aspirational and the enforced
   Phase 44 gate is the measured current-output budget in `frontend/.size-limit.json`.
4. Update Phase 44 ROADMAP success criteria to refer to the archive path and
   `pnpm -C frontend` command spelling.

Do not rewrite the schema/seed or visual-baseline requirement groups; they
belong to Phases 45 and 46.
</action>
<verify>
<automated>grep -q ".planning/milestones/v6.0-phases/33-" .planning/REQUIREMENTS.md && grep -q "pnpm -C frontend size-limit" .planning/REQUIREMENTS.md .planning/ROADMAP.md</automated>
</verify>
<acceptance_criteria> - `.planning/REQUIREMENTS.md` contains `.planning/milestones/v6.0-phases/33-` - `.planning/REQUIREMENTS.md` contains `pnpm -C frontend size-limit` - `.planning/ROADMAP.md` contains `pnpm -C frontend size-limit` - Schema/seed and visual-baseline requirement text remains mapped to Phases 45 and 46
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Sync v6.0 requirements archive checkboxes</name>
  <files>.planning/milestones/v6.0-REQUIREMENTS.md</files>
  <read_first>
    - .planning/milestones/v6.0-REQUIREMENTS.md
    - .planning/milestones/v6.0-MILESTONE-AUDIT.md
    - .planning/milestones/v6.0-phases/*/VERIFICATION.md
    - .planning/STATE.md
  </read_first>
  <action>
Update `.planning/milestones/v6.0-REQUIREMENTS.md` so all 52 v6.0 REQ-ID
checkboxes are `[x]` after their evidence exists. Preserve requirement text
except where checkbox markup is malformed, such as the THEME-01 truncated
checkbox called out by the audit.

The result must match the audit's "all requirements satisfied at code/plan
level" determination, now backed by explicit verification files for the six
previously missing phases.
</action>
<verify>
<automated>! grep -q "^[[:space:]]\*- \\[ \\]" .planning/milestones/v6.0-REQUIREMENTS.md</automated>
</verify>
<acceptance_criteria> - No requirement line in `.planning/milestones/v6.0-REQUIREMENTS.md` starts with `- [ ]` - THEME-01 checkbox markup is valid markdown - File still contains all 52 v6.0 REQ-ID strings
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 3: Sync v6.0 roadmap archive and milestone status</name>
  <files>.planning/milestones/v6.0-ROADMAP.md, .planning/MILESTONES.md</files>
  <read_first>
    - .planning/milestones/v6.0-ROADMAP.md
    - .planning/MILESTONES.md
    - .planning/STATE.md
    - .planning/milestones/v6.0-MILESTONE-AUDIT.md
  </read_first>
  <action>
Update `.planning/milestones/v6.0-ROADMAP.md` so the archive progress table
reports 121/121 plans complete and has no `Not started` cells for v6.0 phases.
If `.planning/MILESTONES.md` contains v6.0 status/progress drift, update it to
match the archived roadmap and audit summary.

Do not mark v6.1 phases complete.
</action>
<verify>
<automated>grep -q "121/121" .planning/milestones/v6.0-ROADMAP.md && ! grep -q "Not started" .planning/milestones/v6.0-ROADMAP.md</automated>
</verify>
<acceptance_criteria> - `.planning/milestones/v6.0-ROADMAP.md` contains `121/121` - `.planning/milestones/v6.0-ROADMAP.md` contains no `Not started` - v6.1 Phase 44 remains the current active roadmap phase
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 4: Re-run audit and record final Phase 44 closure evidence</name>
  <files>.planning/phases/44-documentation-toolchain-anti-patterns/44-final-audit.md</files>
  <read_first>
    - .planning/milestones/v6.0-MILESTONE-AUDIT.md
    - .planning/milestones/v6.0-REQUIREMENTS.md
    - .planning/milestones/v6.0-ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
  </read_first>
  <action>
Run the final evidence checks:

```bash
gsd-audit-milestone v6.0
pnpm -C frontend lint
pnpm -C frontend build
node frontend/scripts/assert-size-limit-matches.mjs
pnpm -C frontend size-limit
pnpm -C frontend exec playwright test phase-44-antipatterns.spec.ts --list
```

Write `.planning/phases/44-documentation-toolchain-anti-patterns/44-final-audit.md`
with a compact table:

- Backfilled verification files: PASS/FAIL
- v6.0 requirements archive all checked: PASS/FAIL
- v6.0 roadmap 121/121 and no Not started: PASS/FAIL
- size-limit match + pass: PASS/FAIL
- WR-02..WR-06 lint/source closure: PASS/FAIL
- Storybook ADR-006: PASS/FAIL

If `gsd-audit-milestone v6.0` writes an updated audit artifact, keep it and cite
the lines showing `phases_missing_verification: []` and
`requirements_partial_verification_gap: 0`.
</action>
<verify>
<automated>test -f .planning/phases/44-documentation-toolchain-anti-patterns/44-final-audit.md && grep -q "phases_missing_verification" .planning/phases/44-documentation-toolchain-anti-patterns/44-final-audit.md</automated>
</verify>
<acceptance_criteria> - `44-final-audit.md` exists - `44-final-audit.md` contains `phases_missing_verification: []` - `44-final-audit.md` contains `requirements_partial_verification_gap: 0` - `44-final-audit.md` records size-limit, lint, Storybook ADR, and browser verification status
</acceptance_criteria>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Mitigation |
|-----------|----------|-----------|------------|
| T-44-15 | Repudiation | Requirements checkbox sync | Flip only after verification artifacts exist and final audit records evidence |
| T-44-16 | Tampering | Active roadmap scope | Do not alter Phase 45 DATA or Phase 46 VIS requirements |
| T-44-17 | Spoofing | Command text | Use real `pnpm -C frontend` commands verified by Phase 44 context |
</threat_model>

<verification>
1. `grep -q ".planning/milestones/v6.0-phases/33-" .planning/REQUIREMENTS.md`
2. No unchecked v6.0 requirements remain.
3. `grep -q "121/121" .planning/milestones/v6.0-ROADMAP.md`
4. Final audit markdown records `phases_missing_verification: []` and `requirements_partial_verification_gap: 0`.
</verification>

<success_criteria>

- Active docs describe Phase 44's actual archive paths and frontend commands.
- v6.0 requirement and roadmap archives are synchronized with evidence.
- Final audit report shows no missing verification and no partial verification gap.
  </success_criteria>
