---
phase: 44-documentation-toolchain-anti-patterns
plan: 06
type: execute
wave: 2
depends_on: ['44-01']
files_modified:
  - .planning/decisions/ADR-006-storybook-deferral.md
  - .planning/milestones/v6.0-phases/33-token-engine/33-08-storybook-PLAN.md
autonomous: true
requirements: [STORY-01]
tags: [docs, adr, storybook]
must_haves:
  truths:
    - 'D-06: formalize Storybook deferral through ADR-006; do not ship Storybook in Phase 44'
    - 'D-07: replacement coverage is vitest snapshot/component tests plus Playwright visual specs'
    - 'D-08: revisit trigger is visual primitive count exceeds 15, with an explicit count source'
    - 'D-09: archived 33-08 Storybook plan remains historical but gains a SUPERSEDED-BY-ADR-006 banner'
  artifacts:
    - path: .planning/decisions/ADR-006-storybook-deferral.md
      provides: formal Storybook deferral decision and replacement coverage table
---

<objective>
Resolve STORY-01 by formally dropping the old Storybook plan through ADR-006,
without installing Storybook or creating new stories in Phase 44.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Create ADR-006 Storybook deferral</name>
  <files>.planning/decisions/ADR-006-storybook-deferral.md</files>
  <read_first>
    - .planning/phases/44-documentation-toolchain-anti-patterns/44-CONTEXT.md
    - frontend/src/components/signature-visuals/index.ts
    - frontend/src/components/signature-visuals/__tests__/
    - frontend/tests/e2e/dashboard-visual.spec.ts
    - frontend/tests/e2e/list-pages-visual.spec.ts
    - frontend/tests/e2e/dossier-drawer-visual.spec.ts
  </read_first>
  <action>
Create `.planning/decisions/ADR-006-storybook-deferral.md` with these sections:

- Title: `# ADR-006: Storybook Deferral for v6.0 Visual Primitives`
- Status: `Accepted`
- Date: `2026-05-07`
- Context: Plan 33-08 was deferred; Phase 44 resolves it through a formal ADR.
- Decision: Do not ship Storybook in Phase 44.
- Replacement coverage strategy: vitest component/snapshot tests plus existing
  Playwright visual specs.
- Coverage table with one row per STORY-01 target:
  - GlobeLoader
  - GlobeSpinner
  - FullscreenLoader
  - DossierGlyph
  - Sparkline
  - Donut
  - Skeleton
  - Spinner
- Revisit trigger: visual primitive count exceeds 15.
- Count source: `frontend/src/components/signature-visuals/index.ts`; count only
  named visual primitive exports and exclude helpers/types. State whether shared
  Skeleton/Spinner are counted outside that barrel.
- Consequences: no Storybook install, no `frontend/src/stories/`, no new visual
  baselines in Phase 44.

For the replacement table, cite existing test paths wherever present. For
Skeleton/Spinner, cite the closest existing component and test coverage if
present; if coverage is missing, name the replacement coverage expectation
instead of claiming it exists.
</action>
<verify>
<automated>test -f .planning/decisions/ADR-006-storybook-deferral.md && grep -q "visual primitive count exceeds 15" .planning/decisions/ADR-006-storybook-deferral.md</automated>
</verify>
<acceptance_criteria> - ADR exists at `.planning/decisions/ADR-006-storybook-deferral.md` - ADR contains `Status: Accepted` - ADR contains all 8 STORY-01 target names - ADR contains `visual primitive count exceeds 15` - ADR names `frontend/src/components/signature-visuals/index.ts` as count source
</acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Mark archived 33-08 Storybook plan as superseded</name>
  <files>.planning/milestones/v6.0-phases/33-token-engine/33-08-storybook-PLAN.md</files>
  <read_first>
    - .planning/milestones/v6.0-phases/33-token-engine/33-08-storybook-PLAN.md
    - .planning/decisions/ADR-006-storybook-deferral.md
  </read_first>
  <action>
At the top of the archived `33-08-storybook-PLAN.md`, after frontmatter if
frontmatter exists, add this banner:

```md
> SUPERSEDED-BY-ADR-006: Storybook was formally deferred by
> `.planning/decisions/ADR-006-storybook-deferral.md`. This plan remains as
> historical v6.0 context and must not be executed as part of Phase 44.
```

Do not delete the old plan and do not install Storybook.
</action>
<verify>
<automated>grep -q "SUPERSEDED-BY-ADR-006" .planning/milestones/v6.0-phases/33-token-engine/33-08-storybook-PLAN.md</automated>
</verify>
<acceptance_criteria> - Archived 33-08 plan contains `SUPERSEDED-BY-ADR-006` - Archived 33-08 plan still contains its historical objective text - No `.storybook` or `frontend/src/stories/` files are created by this plan
</acceptance_criteria>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Mitigation |
|-----------|----------|-----------|------------|
| T-44-12 | Repudiation | Storybook deferral | ADR explicitly states decision, replacement coverage, and revisit trigger |
| T-44-13 | Tampering | Historical plan | Add supersession banner without deleting archived history |
| T-44-14 | Denial of service | Toolchain scope creep | Do not install Storybook or add visual baselines in Phase 44 |
</threat_model>

<verification>
1. `test -f .planning/decisions/ADR-006-storybook-deferral.md`
2. `grep -q "SUPERSEDED-BY-ADR-006" .planning/milestones/v6.0-phases/33-token-engine/33-08-storybook-PLAN.md`
3. `test ! -d frontend/src/stories`
</verification>

<success_criteria>

- STORY-01 is resolved by ADR-006.
- Archived 33-08 is marked superseded.
- No Storybook implementation or visual-baseline work is added.
  </success_criteria>
