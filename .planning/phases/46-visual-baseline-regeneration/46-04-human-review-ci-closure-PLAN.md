---
phase: 46-visual-baseline-regeneration
plan: 04
type: execute
wave: 2
depends_on: [46-01, 46-02, 46-03]
files_modified:
  - .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
  - .github/workflows/e2e.yml
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md
  - .planning/MILESTONES.md
  - .planning/milestones/v6.0-MILESTONE-AUDIT.md
autonomous: false
requirements: [VIS-01, VIS-02, VIS-03, VIS-04]
must_haves:
  truths:
    - 'VIS-04 is satisfied only when all 24 baseline rows in 46-VALIDATION.md have human review results.'
    - 'Final verification must run visual specs without --update-snapshots.'
    - 'The focused CI visual job must run the same no-update visual targets, not just playwright --list.'
    - 'Planning docs may mark VIS-01..04 complete only after dashboard, list-page, and drawer no-update replays pass.'
  artifacts:
    - path: '.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md'
      provides: 'human-eyeball approval log for 24 baselines'
    - path: '.github/workflows/e2e.yml'
      provides: 'focused Phase 46 visual-regression CI job'
    - path: '.planning/REQUIREMENTS.md'
      provides: 'VIS-01..04 checkbox closure and verification pointer'
  key_links:
    - from: 'frontend/tests/e2e/__snapshots__/dashboard-widgets/'
      to: 'VIS-01'
      via: '46-VALIDATION.md and no-update replay'
    - from: 'frontend/tests/e2e/list-pages-visual.spec.ts-snapshots/'
      to: 'VIS-02'
      via: '46-VALIDATION.md and no-update replay'
    - from: 'frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/'
      to: 'VIS-03'
      via: '46-VALIDATION.md and no-update replay'
---

# Plan 46-04: Human Review And CI Closure

**Phase:** 46 (visual-baseline-regeneration)
**Wave:** 2
**Depends on:** 46-01, 46-02, 46-03
**Type:** documentation + CI verification
**TDD:** false
**Estimated effort:** M (2-4 h plus CI runtime)

## Goal

Complete the VIS-04 human-eyeball evidence, add a focused CI visual-regression
job, run final no-update replays for all Phase 46 visual targets, and update
planning docs so the v6.1 visual-baseline debt is closed.

<execution_context>
@$HOME/.codex/get-shit-done/workflows/execute-plan.md
@$HOME/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/46-visual-baseline-regeneration/46-RESEARCH.md
@.planning/phases/46-visual-baseline-regeneration/46-UI-SPEC.md
@.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
@.github/workflows/e2e.yml
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/MILESTONES.md
@.planning/milestones/v6.0-MILESTONE-AUDIT.md
</context>

<threat_model>
T-46-12 rubber-stamped visual approval: mitigated by requiring one validation
row per committed baseline, with exact file path and reviewer note.
T-46-13 CI blind spot: mitigated by adding a focused no-update visual replay
job to `.github/workflows/e2e.yml`.
T-46-14 premature requirements closure: mitigated by updating VIS checkboxes
only after dashboard, list-page, and drawer no-update commands pass.
Block on high severity: if any validation row is pending, any no-update replay
fails, or the CI job cannot be represented in workflow YAML, do not mark
VIS-01..04 complete.
</threat_model>

## Files to create / modify

| Path                                                                | Action | Notes                                                                             |
| ------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `.planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md` | modify | Replace all 24 pending review rows with PASS/DEVIATION/REJECTED                   |
| `.github/workflows/e2e.yml`                                         | modify | Add focused visual-regression job                                                 |
| `.planning/REQUIREMENTS.md`                                         | modify | Mark VIS-01..04 complete and set verification pointer                             |
| `.planning/ROADMAP.md`                                              | modify | Replace Phase 46 Plans TBD with final plan list if not already annotated          |
| `.planning/MILESTONES.md`                                           | modify | Mark v6.1 visual-baseline tech debt closed                                        |
| `.planning/milestones/v6.0-MILESTONE-AUDIT.md`                      | modify | Mark DASH-VISUAL-BLOCKED/REVIEW and Phase 40/41 visual debt as closed by Phase 46 |

<tasks>
<task id="46-04-01" type="execute">
<name>Complete human-eyeball validation log</name>
<read_first>
- .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
- frontend/design-system/inteldossier_handoff_design/reference/dashboard.png
- frontend/design-system/inteldossier_handoff_design/reference/countries.png
- frontend/design-system/inteldossier_handoff_design/reference/organizations.png
- frontend/design-system/inteldossier_handoff_design/reference/forums.png
- frontend/design-system/inteldossier_handoff_design/reference/engagements.png
</read_first>
<files>
- modify: .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</files>
<action>
For every row in `## Baseline Inventory And Human Review Log`, replace
`pending` in `Result` with one of:

- `PASS`
- `DEVIATION`
- `REJECTED`

Add a concrete reviewer note naming what was checked. Minimum accepted notes:

- Dashboard rows: `Matches reference/dashboard.png; seeded Digest publication and VipVisits flag are visible.`
- List countries/organizations/forums/engagements rows: `Matches named handoff reference; locale and direction checked.`
- List persons rows: `Matches dashboard card aesthetic; locale and direction checked.`
- List topics/working-groups rows: `Matches forums row parity; locale and direction checked.`
- Drawer rows: `Matches drawer handoff contract after token darkening; direction checked.`

If any row is `DEVIATION` or `REJECTED`, record the visual issue in the note and
do not mark the related VIS requirement complete until the user accepts that
deviation.
</action>
<verify>
! rg "\\| pending \\|" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
rg "\\| PASS \\||\\| DEVIATION \\||\\| REJECTED \\|" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
rg "seeded Digest publication|locale and direction checked|token darkening" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
</verify>
<acceptance_criteria>

- `rg "\\| pending \\|" 46-VALIDATION.md` returns no matches.
- `46-VALIDATION.md` contains at least 24 rows with `PASS`, `DEVIATION`, or `REJECTED`.
- Every row has a non-empty reviewer note.
- Any `DEVIATION` or `REJECTED` row is explicitly accepted by the user before requirement closure.
  </acceptance_criteria>
  </task>

<task id="46-04-02" type="execute">
<name>Add focused CI visual-regression job</name>
<read_first>
- .github/workflows/e2e.yml
- frontend/playwright.config.ts
- frontend/package.json
</read_first>
<files>
- modify: .github/workflows/e2e.yml
</files>
<action>
Add a new job to `.github/workflows/e2e.yml` named
`visual-regression-phase-46` with:

```yaml
visual-regression-phase-46:
  name: Visual Regression (Phase 46)
  runs-on: macos-latest
  timeout-minutes: 30
  env:
    CI: true
    E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
    TEST_USER_EMAIL: ${{ secrets.E2E_ANALYST_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.E2E_ANALYST_PASSWORD }}
    SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
    VITE_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm -C frontend exec playwright install chromium
    - name: Run dashboard widget visual baselines
      run: pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets
    - name: Run list and drawer visual baselines
      run: pnpm -C frontend exec playwright test list-pages-visual.spec.ts dossier-drawer-visual.spec.ts --project=chromium
```

Keep existing `e2e`, `qa-sweep`, and `merge-reports` jobs intact.
</action>
<verify>
rg "visual-regression-phase-46|Visual Regression \\(Phase 46\\)|dashboard-widgets --project=chromium-dashboard-widgets|list-pages-visual\\.spec\\.ts dossier-drawer-visual\\.spec\\.ts" .github/workflows/e2e.yml
</verify>
<acceptance_criteria>

- `.github/workflows/e2e.yml` contains `visual-regression-phase-46`.
- The job runs on `macos-latest`.
- The job has one dashboard command using `--project=chromium-dashboard-widgets`.
- The job has one list/drawer command using `--project=chromium`.
- Existing `qa-sweep` and `e2e` jobs remain present.
  </acceptance_criteria>
  </task>

<task id="46-04-03" type="execute">
<name>Run final no-update replay and close planning docs</name>
<read_first>
- .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/MILESTONES.md
- .planning/milestones/v6.0-MILESTONE-AUDIT.md
</read_first>
<files>
- modify: .planning/REQUIREMENTS.md
- modify: .planning/ROADMAP.md
- modify: .planning/MILESTONES.md
- modify: .planning/milestones/v6.0-MILESTONE-AUDIT.md
</files>
<action>
Run the final no-update commands from the repository root:

```bash
CI=true doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets
CI=true doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts dossier-drawer-visual.spec.ts --project=chromium
```

If both commands pass and `46-VALIDATION.md` has no pending rows:

1. In `.planning/REQUIREMENTS.md`, change VIS-01..VIS-04 checkboxes from
   `[ ]` to `[x]`.
2. In the traceability table, set VIS-01..VIS-04 `VERIFICATION` to
   `46-VALIDATION.md`.
3. In `.planning/ROADMAP.md`, replace Phase 46 `**Plans**: TBD` with:

```markdown
**Plans**:

- **Wave 1**
  - `46-01-dashboard-widget-baselines-PLAN.md` - add dashboard widget visual target and regenerate 8 widget baselines
  - `46-02-list-page-baselines-PLAN.md` - regenerate 14 list-page baselines
  - `46-03-drawer-baselines-PLAN.md` - regenerate 2 drawer baselines
- **Wave 2** _(blocked on Wave 1 completion)_
  - `46-04-human-review-ci-closure-PLAN.md` - document human review, add CI visual replay, and close VIS docs
```

4. In `.planning/MILESTONES.md`, replace the v6.0 tech-debt bullet
   `Visual-regression baselines pending operator action for Phases 38, 40, 41`
   with a closed note naming Phase 46 and `46-VALIDATION.md`.
5. In `.planning/milestones/v6.0-MILESTONE-AUDIT.md`, update the tech-debt
   entries for DASH-VISUAL-BLOCKED, DASH-VISUAL-REVIEW, Phase 40 visual
   baselines, and Phase 41 visual baselines to state `CLOSED by Phase 46` and
   reference `46-VALIDATION.md`.
   </action>
   <verify>
   CI=true doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets
   CI=true doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts dossier-drawer-visual.spec.ts --project=chromium
   rg "\\[x\\] \\*\\*VIS-01\\_\\_|\\[x\\] \\*\\*VIS-02\\_\\_|\\[x\\] \\*\\*VIS-03\\_\\_|\\[x\\] \\*\\*VIS-04\\_\\_" .planning/REQUIREMENTS.md
   rg "VIS-01\\s+\\| Phase 46 \\| 46-VALIDATION.md|VIS-04\\s+\\| Phase 46 \\| 46-VALIDATION.md" .planning/REQUIREMENTS.md
   rg "46-01-dashboard-widget-baselines-PLAN.md|46-04-human-review-ci-closure-PLAN.md" .planning/ROADMAP.md
   rg "CLOSED by Phase 46|46-VALIDATION.md" .planning/MILESTONES.md .planning/milestones/v6.0-MILESTONE-AUDIT.md
   </verify>
   <acceptance_criteria>

- Both final no-update commands exit 0.
- `46-VALIDATION.md` contains no pending baseline review rows.
- `.planning/REQUIREMENTS.md` shows `[x]` for VIS-01, VIS-02, VIS-03, and VIS-04.
- The requirements traceability table points VIS-01..04 to `46-VALIDATION.md`.
- `.planning/ROADMAP.md` lists all four Phase 46 plans in Wave 1/Wave 2 groups.
- `.planning/MILESTONES.md` and `.planning/milestones/v6.0-MILESTONE-AUDIT.md` reference Phase 46 closure for visual-regression baseline debt.
  </acceptance_criteria>
  </task>
  </tasks>

<verification>
Run:

```bash
! rg "\\| pending \\|" .planning/phases/46-visual-baseline-regeneration/46-VALIDATION.md
CI=true doppler run -- pnpm -C frontend exec playwright test dashboard-widgets --project=chromium-dashboard-widgets
CI=true doppler run -- pnpm -C frontend exec playwright test list-pages-visual.spec.ts dossier-drawer-visual.spec.ts --project=chromium
rg "visual-regression-phase-46" .github/workflows/e2e.yml
rg "\\[x\\] \\*\\*VIS-0[1-4]\\*\\*" .planning/REQUIREMENTS.md
```

</verification>

<success_criteria>

- VIS-04 human-eyeball evidence is complete for all 24 baselines.
- Focused CI visual replay exists and runs no-update checks.
- VIS-01..04 are closed in planning docs only after no-update replay passes.
- Phase 46 is ready for verification.
  </success_criteria>
