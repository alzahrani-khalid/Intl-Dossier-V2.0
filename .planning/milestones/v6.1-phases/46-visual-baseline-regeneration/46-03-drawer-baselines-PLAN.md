---
phase: 46-visual-baseline-regeneration
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/*.png
  - .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
autonomous: false
requirements: [VIS-03, VIS-04]
must_haves:
  truths:
    - 'VIS-03 owns only the two Phase 41 dossier-drawer visual baselines.'
    - 'Drawer baselines must be regenerated after token darkening and Phase 45 seed closure.'
    - 'Use pnpm -C frontend or --filter intake-frontend; --filter frontend is not a valid package selector in this repo.'
    - 'VIS-04 evidence must record both drawer baseline paths and human review result.'
  artifacts:
    - path: 'frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/'
      provides: 'two committed dossier-drawer baseline PNGs'
    - path: '.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md'
      provides: 'human review rows for drawer baselines'
  key_links:
    - from: 'frontend/tests/e2e/dossier-drawer-visual.spec.ts'
      to: 'frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/'
      via: 'Playwright toHaveScreenshot baselines'
---

# Plan 46-03: Drawer Baselines

**Phase:** 46 (visual-baseline-regeneration)
**Wave:** 1
**Depends on:** none
**Type:** visual baseline capture
**TDD:** false
**Estimated effort:** S-M (1-3 h with staging credentials)

## Goal

Regenerate the two Phase 41 dossier-drawer baselines after the post-v6.0 token
darkening and Phase 45 seed closure, verify the drawer visual spec without
`--update-snapshots`, and record the human-review rows in `46-VALIDATION.md`.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/46-visual-baseline-regeneration/46-RESEARCH.md
@.planning/phases/46-visual-baseline-regeneration/46-UI-SPEC.md
@.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
@frontend/tests/e2e/dossier-drawer-visual.spec.ts
@frontend/tests/e2e/support/list-pages-auth.ts
@frontend/tests/e2e/support/dossier-drawer-fixture.ts
@frontend/design-system/inteldossier_handoff_design/src/pages.jsx
@frontend/design-system/inteldossier_handoff_design/src/app.css
</context>

<threat_model>
T-46-09 stale drawer seed: mitigated by relying on the Phase 45 seeded fixture
and `openDrawerForFixtureDossier`.
T-46-10 token-darkening regression missed by DOM-only checks: mitigated by
capturing both LTR and AR drawer screenshots.
T-46-11 broad visual churn: mitigated by running only
`dossier-drawer-visual.spec.ts`, never a broad update command.
Block on high severity: if the no-update replay fails or the drawer body stays
empty/loading, stop and preserve Playwright diff artifacts.
</threat_model>

## Files to create / modify

| Path                                                                | Action        | Notes                                                         |
| ------------------------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| `frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/*.png`  | modify/create | LTR and AR drawer baselines                                   |
| `.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md` | modify        | Mark VIS-03 rows with exact generated files and review status |

<tasks>
<task id="46-03-01" type="execute">
<name>Regenerate two dossier-drawer baselines</name>
<read_first>
- frontend/tests/e2e/dossier-drawer-visual.spec.ts
- frontend/tests/e2e/support/list-pages-auth.ts
- frontend/tests/e2e/support/dossier-drawer-fixture.ts
- .planning/phases/45-schema-seed-closure/45-VERIFICATION.md
- .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</read_first>
<files>
- create: frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/dossier-drawer-ltr-1280-chromium-darwin.png
- create: frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/dossier-drawer-ar-1280-chromium-darwin.png
- modify: .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</files>
<action>
Run the drawer update command from the repository root:

```bash
doppler run -- pnpm -C frontend exec playwright test dossier-drawer-visual.spec.ts --project=chromium --update-snapshots
```

Then run the same target without snapshot updates:

```bash
doppler run -- pnpm -C frontend exec playwright test dossier-drawer-visual.spec.ts --project=chromium
```

Verify the snapshot folder contains exactly two logical baselines:

```text
dossier-drawer-ltr-1280
dossier-drawer-ar-1280
```

Use the actual platform suffix produced by Playwright if it differs from
`chromium-darwin`.

Update the VIS-03 rows in `46-VALIDATION.md` with the exact generated file
paths. Mark `Result` as `PASS` only after human review confirms the LTR and AR
drawers match the handoff drawer contract and reflect the token-darkened
contrast state.
</action>
<verify>
doppler run -- pnpm -C frontend exec playwright test dossier-drawer-visual.spec.ts --project=chromium
find frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots -maxdepth 1 -type f -name '\*.png' | wc -l
rg "dossier-drawer-ltr-1280|dossier-drawer-ar-1280" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</verify>
<acceptance_criteria>

- `find frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots -maxdepth 1 -type f -name '*.png' | wc -l` prints `2`.
- The no-update drawer visual command exits 0.
- `46-VALIDATION.md` names both drawer baseline paths.
- No dashboard, list-page, Phase 42, or Phase 43 snapshot files are changed by this plan.
  </acceptance_criteria>
  </task>
  </tasks>

<verification>
Run:

```bash
doppler run -- pnpm -C frontend exec playwright test dossier-drawer-visual.spec.ts --project=chromium
find frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots -maxdepth 1 -type f -name '*.png' | wc -l
rg "VIS-03" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
```

</verification>

<success_criteria>

- VIS-03 has two regenerated drawer PNGs.
- The no-update drawer visual replay exits 0.
- `46-VALIDATION.md` carries review rows for both drawer baselines.
  </success_criteria>
