# Phase 44: Documentation, Toolchain & Anti-patterns - Research

**Date:** 2026-05-07
**Phase:** 44 - Documentation, Toolchain & Anti-patterns
**Status:** Complete

## Research Question

What does the executor need to know to plan Phase 44 well?

Phase 44 is a debt-reconciliation phase. It should not add product features,
schemas, or visual baselines. It must produce verifiable documentation fixes,
restore the bundle-size CI signal, close the specific WR-02..WR-06 audit items,
and formalize the Storybook deferral.

## Sources Read

- `.planning/ROADMAP.md` - Phase 44 scope, goal, success criteria, and requirement IDs.
- `.planning/REQUIREMENTS.md` - DOC, TOOL, LINT, and STORY requirement text.
- `.planning/STATE.md` - authority for v6.0 phase rollups and historical verdicts.
- `.planning/phases/44-documentation-toolchain-anti-patterns/44-CONTEXT.md` - locked decisions D-01..D-20.
- `.planning/milestones/v6.0-MILESTONE-AUDIT.md` - missing verification list, checkbox drift, size-limit drift, WR findings.
- `.planning/milestones/v6.0-REQUIREMENTS.md` and `.planning/milestones/v6.0-ROADMAP.md` - archive sync targets.
- `frontend/.size-limit.json`, `frontend/vite.config.ts`, `frontend/package.json`, `.github/workflows/ci.yml` - bundle-size gate.
- Target source files named by WR-02..WR-06.
- `frontend/tests/e2e/helpers/qa-sweep.ts`, `frontend/tests/e2e/helpers/v6-routes.ts`, and drawer/dashboard a11y specs.

## Key Findings

### Documentation Backfill

The active `.planning/phases/33-*` through `.planning/phases/43-*` directories
are deleted in the current worktree, but the historical artifacts remain in
`HEAD`. Phase 44 should treat this as an archive move, not restore the old
active paths. The target archive root is:

```text
.planning/milestones/v6.0-phases/
```

The six new verification files should live at:

```text
.planning/milestones/v6.0-phases/33-token-engine/VERIFICATION.md
.planning/milestones/v6.0-phases/34-tweaks-drawer/VERIFICATION.md
.planning/milestones/v6.0-phases/36-shell-chrome/VERIFICATION.md
.planning/milestones/v6.0-phases/37-signature-visuals/VERIFICATION.md
.planning/milestones/v6.0-phases/39-kanban-calendar/VERIFICATION.md
.planning/milestones/v6.0-phases/40-list-pages/VERIFICATION.md
```

Reference shape exists in `.planning/milestones/v3.0-phases/12-enriched-dossier-pages/VERIFICATION.md`
and `13-feature-absorption/VERIFICATION.md`: a short header, a requirements
table, summary, and methodology. Keep each new file lightweight, roughly 30-50
lines, and avoid rerunning historical tests just to backfill records.

### Requirements and Roadmap Sync

Active `.planning/REQUIREMENTS.md` still points DOC-01..DOC-06 at
`.planning/phases/{n}-*/VERIFICATION.md`; D-02 supersedes that path with
`.planning/milestones/v6.0-phases/{n}-*/VERIFICATION.md`.

The TOOL requirement text also contains stale command spelling:

```text
pnpm --filter frontend ...
```

The actual package name is `intake-frontend`, and current local patterns run
frontend scripts as:

```text
pnpm -C frontend build
pnpm -C frontend size-limit
```

Update docs to use the working command form unless the workspace selector is
separately fixed.

### Size-limit Repair

Current size-limit config is stale:

- `dist/assets/*d3-geo*.js` matches no current built files.
- `dist/assets/*signature-visuals*.js` matches no current built files.
- `Total JS` still enforces the historical `815 KB` target even though current
  measured output is about 2.42 MB gzip.

The locked strategy is hybrid:

- Keep `815 KB` as an aspirational optimization target in docs.
- Make Phase 44 enforce current real output with small explicit headroom.
- Ensure every size-limit entry matches at least one built file.
- Prove an intentional >= 1 KB measured-chunk increase fails locally and in CI.

Vite already names vendor chunks through `manualChunks`. It should be extended
so d3/world-atlas/topojson and local signature-visual modules produce stable
chunk base names that `.size-limit.json` can target.

## Validation Architecture

Validation should sample three independent feedback channels:

1. Documentation/audit channel:
   - `test -f` for each archive `VERIFICATION.md`.
   - `grep` every owned REQ-ID in each file.
   - `gsd-audit-milestone v6.0` reports `phases_missing_verification: []` and
     `requirements_partial_verification_gap: 0`.

2. Toolchain channel:
   - `pnpm -C frontend build`.
   - A glob-match assertion for every `frontend/.size-limit.json` entry.
   - `pnpm -C frontend size-limit`.
   - Temporary >= 1 KB perturbation of a measured chunk fails `size-limit`, then
     is reverted.

3. Anti-pattern channel:
   - Targeted `rg` checks for WR-02..WR-06 source patterns.
   - `pnpm -C frontend lint`.
   - Playwright axe label-in-name coverage for dashboard, drawer, and tasks
     routes in EN and AR.

## UI-SPEC Gate Assessment

The phase mentions frontend files, dashboard, drawer, visual primitives, and
Storybook, but it does not create a new UI surface or visual baseline. The
locked context explicitly says "no new visual baselines" and directs any visual
snapshot drift to Phase 46. A UI design contract is therefore not required for
Phase 44 planning; visual changes should be avoided except where needed to
remove the named accessibility anti-patterns.

## Security Considerations

Phase 44 does not add auth, data access, schemas, or externally exposed routes.
Security risk is primarily false assurance:

- Documentation may claim requirements are verified without evidence.
- CI budget checks may pass while measuring zero files.
- A11y checks may filter out the exact rule this phase is closing.

Plans should include threat models that mitigate these assurance risks with
artifact checks, exact command output, and route-scoped browser verification.

## Recommended Plan Shape

Use six plans:

1. Backfill the v6.0 verification archive.
2. Repair size-limit measurement and CI enforcement.
3. Close WR-02..WR-06 in source.
4. Add/run the anti-pattern browser verification gate.
5. Formalize Storybook deferral through ADR-006.
6. Sync requirements, roadmap, audit outputs, and final status after the prior
   artifacts exist.

This keeps the independent code/doc/config work parallel in wave 1 and reserves
the final docs/audit update for the end, when every requirement has evidence.

## Open Risks for Execution

- The archive move touches many planning files that are already deleted from
  active `.planning/phases`. Executors must not blindly restore them to the old
  active path.
- Size-limit budgets depend on current build output. Executors must measure
  after `pnpm -C frontend build`, then write concrete limits. Do not hard-code
  the historical 815 KB as the enforced gate.
- Some WR findings are already partially fixed in current code. Executors should
  inspect first, then record verified closure instead of adding churn.

## RESEARCH COMPLETE
