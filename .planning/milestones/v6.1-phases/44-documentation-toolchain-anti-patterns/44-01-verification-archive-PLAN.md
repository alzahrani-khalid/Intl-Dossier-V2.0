---
phase: 44-documentation-toolchain-anti-patterns
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/milestones/v6.0-phases/33-token-engine/VERIFICATION.md
  - .planning/milestones/v6.0-phases/34-tweaks-drawer/VERIFICATION.md
  - .planning/milestones/v6.0-phases/36-shell-chrome/VERIFICATION.md
  - .planning/milestones/v6.0-phases/37-signature-visuals/VERIFICATION.md
  - .planning/milestones/v6.0-phases/39-kanban-calendar/VERIFICATION.md
  - .planning/milestones/v6.0-phases/40-list-pages/VERIFICATION.md
autonomous: true
requirements: [DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06]
tags: [docs, archive, verification]
must_haves:
  truths:
    - 'D-01: v6.0 backfilled verification files live under .planning/milestones/v6.0-phases, not active .planning/phases'
    - 'D-03: each VERIFICATION.md is lightweight and lists REQ-ID, verdict, and artifact reference'
    - 'D-04: STATE.md phase summaries and per-plan SUMMARY.md files are the authority for retroactive verdicts'
  artifacts:
    - path: .planning/milestones/v6.0-phases/33-token-engine/VERIFICATION.md
      provides: TOKEN-01..TOKEN-06 verification evidence
    - path: .planning/milestones/v6.0-phases/40-list-pages/VERIFICATION.md
      provides: LIST-01..LIST-04 verification evidence
---

<objective>
Create the six missing v6.0 archived VERIFICATION.md files and intentionally
carry the active phase archive move into `.planning/milestones/v6.0-phases/`.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Recover historical phase artifacts into the v6.0 archive path</name>
  <files>.planning/milestones/v6.0-phases/</files>
  <read_first>
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-CONTEXT.md
    - .planning/milestones/v6.0-MILESTONE-AUDIT.md
    - .planning/STATE.md
  </read_first>
  <action>
Create `.planning/milestones/v6.0-phases/` if it does not exist. For phases
33, 34, 36, 37, 39, and 40, copy historical planning artifacts from `HEAD` into
that archive root, preserving each phase slug. Use `git show HEAD:<old-path>`
or an equivalent non-destructive export into the new archive path. Do not
restore files into `.planning/phases/33-*` through `.planning/phases/43-*`.

Concrete mapping:

- `.planning/phases/33-token-engine/*` to `.planning/milestones/v6.0-phases/33-token-engine/*`
- `.planning/phases/34-tweaks-drawer/*` to `.planning/milestones/v6.0-phases/34-tweaks-drawer/*`
- `.planning/phases/36-shell-chrome/*` to `.planning/milestones/v6.0-phases/36-shell-chrome/*`
- `.planning/phases/37-signature-visuals/*` to `.planning/milestones/v6.0-phases/37-signature-visuals/*`
- `.planning/phases/39-kanban-calendar/*` to `.planning/milestones/v6.0-phases/39-kanban-calendar/*`
- `.planning/phases/40-list-pages/*` to `.planning/milestones/v6.0-phases/40-list-pages/*`
  </action>
  <verify>
  <automated>test -d .planning/milestones/v6.0-phases/33-token-engine && test -f .planning/milestones/v6.0-phases/33-token-engine/33-09-e2e-verification-SUMMARY.md</automated>
  </verify>
  <acceptance_criteria> - `test -d .planning/milestones/v6.0-phases/33-token-engine` exits 0 - `test -f .planning/milestones/v6.0-phases/40-list-pages/40-23-SUMMARY.md` exits 0 - `test ! -d .planning/phases/33-token-engine` remains true unless a later workflow explicitly rehydrates active phases - No old active phase path is recreated for 33, 34, 36, 37, 39, or 40
  </acceptance_criteria>
  </task>

<task type="auto">
  <name>Task 2: Write the six lightweight VERIFICATION.md files</name>
  <files>.planning/milestones/v6.0-phases/*/VERIFICATION.md</files>
  <read_first>
    - .planning/milestones/v3.0-phases/12-enriched-dossier-pages/VERIFICATION.md
    - .planning/milestones/v3.0-phases/13-feature-absorption/VERIFICATION.md
    - .planning/milestones/v6.0-MILESTONE-AUDIT.md
    - .planning/STATE.md
  </read_first>
  <action>
Create one `VERIFICATION.md` file in each target phase archive directory. Use
the v3.0 verification shape: title, date, status, requirements verification
table, summary, methodology. Each row must include REQ-ID, a PASS or FAIL
verdict, and a one-line evidence artifact reference.

Required rows:

- Phase 33: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, TOKEN-05, TOKEN-06
- Phase 34: THEME-01, THEME-02, THEME-03, THEME-04
- Phase 36: SHELL-01, SHELL-02, SHELL-03, SHELL-04, SHELL-05
- Phase 37: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05
- Phase 39: BOARD-01, BOARD-02, BOARD-03
- Phase 40: LIST-01, LIST-02, LIST-03, LIST-04

Evidence must cite archived SUMMARY files, `.planning/STATE.md` rollups, and
the Phase 43 cross-phase QA sweep where applicable. Do not rerun historical
tests just to create these docs.
</action>
<verify>
<automated>for f in .planning/milestones/v6.0-phases/{33-token-engine,34-tweaks-drawer,36-shell-chrome,37-signature-visuals,39-kanban-calendar,40-list-pages}/VERIFICATION.md; do test -f "$f" || exit 1; grep -Eq "PASS|FAIL" "$f" || exit 1; done</automated>
</verify>
<acceptance_criteria> - `grep -q TOKEN-06 .planning/milestones/v6.0-phases/33-token-engine/VERIFICATION.md` - `grep -q THEME-04 .planning/milestones/v6.0-phases/34-tweaks-drawer/VERIFICATION.md` - `grep -q SHELL-05 .planning/milestones/v6.0-phases/36-shell-chrome/VERIFICATION.md` - `grep -q VIZ-05 .planning/milestones/v6.0-phases/37-signature-visuals/VERIFICATION.md` - `grep -q BOARD-03 .planning/milestones/v6.0-phases/39-kanban-calendar/VERIFICATION.md` - `grep -q LIST-04 .planning/milestones/v6.0-phases/40-list-pages/VERIFICATION.md` - Every verification row includes an evidence path or audit pointer
</acceptance_criteria>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Mitigation |
|-----------|----------|-----------|------------|
| T-44-01 | Repudiation | Retroactive verification docs | Require each row to cite SUMMARY, STATE, audit, or Phase 43 evidence |
| T-44-02 | Tampering | Archive move | Export from HEAD into milestone archive; do not recreate active phase directories |
</threat_model>

<verification>
1. `test -f` all six archive `VERIFICATION.md` files.
2. `grep` every TOKEN/THEME/SHELL/VIZ/BOARD/LIST REQ-ID in the corresponding file.
3. Confirm `.planning/phases/33-token-engine` was not recreated.
</verification>

<success_criteria>

- Six missing v6.0 verification files exist under `.planning/milestones/v6.0-phases/`.
- Each owned REQ-ID has PASS/FAIL and evidence.
- The archive move is intentional and does not restore old active phase dirs.
  </success_criteria>
