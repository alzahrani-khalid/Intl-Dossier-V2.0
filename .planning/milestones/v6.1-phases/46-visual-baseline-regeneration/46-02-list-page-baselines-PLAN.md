---
phase: 46-visual-baseline-regeneration
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/*.png
  - .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
autonomous: false
requirements: [VIS-02, VIS-04]
must_haves:
  truths:
    - 'VIS-02 owns only the 14 Phase 40 list-page visual baselines.'
    - 'Use the existing list-pages-visual.spec.ts determinism stack; do not rewrite the list-page UI.'
    - 'Use pnpm -C frontend or --filter intake-frontend; --filter frontend is not a valid package selector in this repo.'
    - 'VIS-04 evidence must record each generated list-page baseline path and human review result.'
  artifacts:
    - path: 'frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/'
      provides: '14 committed list-page baseline PNGs'
    - path: '.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md'
      provides: 'human review rows for list-page baselines'
  key_links:
    - from: 'frontend/tests/e2e/list-pages-visual.spec.ts'
      to: 'frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/'
      via: 'Playwright toHaveScreenshot baselines'
---

# Plan 46-02: List-Page Baselines

**Phase:** 46 (visual-baseline-regeneration)
**Wave:** 1
**Depends on:** none
**Type:** visual baseline capture
**TDD:** false
**Estimated effort:** S-M (1-3 h with staging credentials)

## Goal

Regenerate the 14 Phase 40 list-page visual baselines against the seeded
staging database, verify `list-pages-visual.spec.ts` without
`--update-snapshots`, and record the human-review rows in `46-VALIDATION.md`.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/46-visual-baseline-regeneration/46-RESEARCH.md
@.planning/phases/46-visual-baseline-regeneration/46-UI-SPEC.md
@.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
@frontend/tests/e2e/list-pages-visual.spec.ts
@frontend/tests/e2e/support/list-pages-auth.ts
@frontend/design-system/inteldossier_handoff_design/reference/countries.png
@frontend/design-system/inteldossier_handoff_design/reference/organizations.png
@frontend/design-system/inteldossier_handoff_design/reference/forums.png
@frontend/design-system/inteldossier_handoff_design/reference/engagements.png
</context>

<threat_model>
T-46-06 broad snapshot churn: mitigated by running only
`list-pages-visual.spec.ts`, never broad `--update-snapshots`.
T-46-07 unstable visual state: mitigated by the existing Phase 40 deterministic
stack in the spec.
T-46-08 false human approval: mitigated by requiring every list-page baseline
path to be named in `46-VALIDATION.md`.
Block on high severity: if the no-update replay fails after regeneration, stop
and preserve the Playwright diff output for review.
</threat_model>

## Files to create / modify

| Path                                                                | Action        | Notes                                                         |
| ------------------------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| `frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/*.png`      | modify/create | 14 list-page baselines                                        |
| `.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md` | modify        | Mark VIS-02 rows with exact generated files and review status |

<tasks>
<task id="46-02-01" type="execute">
<name>Regenerate fourteen list-page baselines</name>
<read_first>
- frontend/tests/e2e/list-pages-visual.spec.ts
- frontend/tests/e2e/support/list-pages-auth.ts
- .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
- .planning/milestones/v6.0-phases/40-list-pages/40-17-SUMMARY.md
</read_first>
<files>
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/countries-en-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/countries-ar-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/organizations-en-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/organizations-ar-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/persons-en-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/persons-ar-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/forums-en-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/forums-ar-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/topics-en-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/topics-ar-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/working-groups-en-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/working-groups-ar-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/engagements-en-chromium-darwin.png
- modify: frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/engagements-ar-chromium-darwin.png
- modify: .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</files>
<action>
Run the list-page update command from the repository root:

```bash
doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium --update-snapshots
```

Then run the same target without snapshot updates:

```bash
doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium
```

Verify the snapshot folder contains exactly these 14 logical baselines, using
the actual platform suffix produced by Playwright if it differs:

```text
countries-en
countries-ar
organizations-en
organizations-ar
persons-en
persons-ar
forums-en
forums-ar
topics-en
topics-ar
working-groups-en
working-groups-ar
engagements-en
engagements-ar
```

Update the VIS-02 rows in `46-VALIDATION.md` with the exact generated file
paths. Mark `Result` as `PASS` only after human review against the handoff
references listed in the validation table.
</action>
<verify>
doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium
find frontend/tests/e2e/list-pages-visual.spec.ts-snapshots -maxdepth 1 -type f -name '\*.png' | wc -l
rg "countries-en|countries-ar|organizations-en|organizations-ar|persons-en|persons-ar|forums-en|forums-ar|topics-en|topics-ar|working-groups-en|working-groups-ar|engagements-en|engagements-ar" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</verify>
<acceptance_criteria>

- `find frontend/tests/e2e/list-pages-visual.spec.ts-snapshots -maxdepth 1 -type f -name '*.png' | wc -l` prints `14`.
- The no-update list-page visual command exits 0.
- `46-VALIDATION.md` names all 14 list-page baseline paths.
- No dashboard, drawer, Phase 42, or Phase 43 snapshot files are changed by this plan.
  </acceptance_criteria>
  </task>
  </tasks>

<verification>
Run:

```bash
doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts --project=chromium
find frontend/tests/e2e/list-pages-visual.spec.ts-snapshots -maxdepth 1 -type f -name '*.png' | wc -l
rg "VIS-02" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
```

</verification>

<success_criteria>

- VIS-02 has 14 regenerated list-page PNGs.
- The no-update list-page visual replay exits 0.
- `46-VALIDATION.md` carries review rows for all 14 list-page baselines.
  </success_criteria>
