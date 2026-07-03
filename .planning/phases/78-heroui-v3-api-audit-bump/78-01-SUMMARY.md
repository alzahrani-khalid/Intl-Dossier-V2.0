---
phase: 78-heroui-v3-api-audit-bump
plan: 01
subsystem: ui
tags: [heroui, react-aria, dependency-bump, pnpm-lockfile, drawer, tailwind-v4]

# Dependency graph
requires:
  - phase: 75-ui-component-migration-audit
    provides: 'HeroUI v3 confirmation + Phase 78 re-run protocol (8 import sites, exit-0 baseline)'
  - phase: 77-linear-token-system
    provides: 'Linear token engine (heroui wrappers re-skin via tokens, untouched by this bump)'
provides:
  - '@heroui/react + @heroui/styles resolved to 3.2.1 in lockstep (zero 3.0.5 remnants)'
  - 'react-aria externalized (new react-aria@3.49.0 direct dep, RAC 1.17.0→1.18.0) via 3.2.1 packaging fix (PR #6653)'
  - '@heroui-pro/react@1.0.0-beta.6 peer-range (>=3.2.0) now satisfied (was violated at 3.0.5)'
  - 'Atomic, independently-revertible bump commit 10de0c95 (rollback reference for later plans)'
affects:
  [
    78-02-toggles-content-migration,
    78-03-protocol-rerun,
    78-04-regression-sweep,
    80-full-route-verification,
  ]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Version-coupled lockstep bump: @heroui/react + @heroui/styles pinned to the exact same version in one atomic commit'
    - 'exit-0 type-check is necessary-not-sufficient — Drawer runtime oracle (ConcurrentDrawers vitest) exercises the react-aria externalization path'

key-files:
  created:
    - .planning/phases/78-heroui-v3-api-audit-bump/78-01-SUMMARY.md
  modified:
    - frontend/package.json
    - pnpm-lock.yaml

key-decisions:
  - 'Bumped to exactly 3.2.1 (the Phase-75-audited target) even though npm latest also reads 3.2.1 — no bump past the audit.'
  - 'Bump committed alone (2 files); the heroui-forms.tsx toggles *.Content migration is deferred to plan 78-02 so each is independently revertible.'

patterns-established:
  - 'Lockstep verification gate: grep zero @3.0.5 + grep >=2 @3.2.1 + pnpm list single-version-each before committing a coupled bump.'

requirements-completed: [HEROUI-01]

# Metrics
duration: ~15 min
completed: 2026-07-03
---

# Phase 78 Plan 01: HeroUI v3 Lockstep Bump (3.0.5 → 3.2.1) Summary

**`@heroui/react` + `@heroui/styles` bumped in lockstep to 3.2.1 as one atomic revertible commit; tree type-checks and two real Drawers mount on the externalized react-aria runtime.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-03T00:46:54Z (bump commit landed 2026-07-03T00:46:04Z UTC)
- **Tasks:** 2 (both auto)
- **Files modified:** 2 (`frontend/package.json`, `pnpm-lock.yaml`)

## Accomplishments

- Both HeroUI packages pinned to exact `3.2.1` in `frontend/package.json:44-45`; `@heroui-pro/react` (line 43) untouched.
- Root `pnpm-lock.yaml` regenerated: **zero** `@heroui/(react|styles)@3.0.5` remnants, `@heroui/react@3.2.1` resolves `@heroui/styles: 3.2.1` as an exact coupled dep.
- `pnpm --dir frontend type-check` exit 0 against the 3.2.1 typings (no source edits — the byte-identical import surface held; the unconsumed Checkbox/Switch markup still compiles, as RESEARCH predicted).
- `ConcurrentDrawers` vitest passes (3/3) — Drawers mount, Tab focus containment holds, ≥2 dialog FocusScopes — proving the react-aria externalization path (the only runtime-relevant packaging change in 3.2.1).
- Peer-range de-risk confirmed: after the bump, **no** `@heroui-pro/react` peer warning appears (the >=3.2.0 range, violated at 3.0.5, is now satisfied).

## Output Data (per plan `<output>`)

### `npm view @heroui/react version`

```
3.2.1
```

Matches the Phase-75-audited target exactly; no newer release has published since RESEARCH (2026-07-03), so no follow-up bump note is required.

### Lockfile grep results (before / after)

| Check                                                       | Before bump   | After bump                              |
| ----------------------------------------------------------- | ------------- | --------------------------------------- |
| `grep -cE "@heroui/(react\|styles)@3\.0\.5" pnpm-lock.yaml` | **5**         | **0** (grep exits 1)                    |
| `grep -cE "@heroui/(react\|styles)@3\.2\.1" pnpm-lock.yaml` | **0**         | **5**                                   |
| `pnpm --dir frontend list @heroui/react @heroui/styles`     | 3.0.5 / 3.0.5 | **3.2.1 / 3.2.1** (single version each) |

The 5 post-bump `@3.2.1` lines are: 2 resolution keys (`@heroui/react@3.2.1`, `@heroui/styles@3.2.1`) + 1 resolved `@heroui/react` instance + 2 resolved `@heroui/styles` instances keyed by different `tailwind-merge` peers (`3.4.0` and `3.6.0`). **Both styles instances are 3.2.1** — this is a peer-suffix split, NOT the dual-version desync failure mode (which would require a 3.0.5 remnant). The frontend workspace resolves a single 3.2.1 for each package.

### pnpm peer warnings (verbatim)

All warnings emitted by `pnpm install` are **pre-existing and unrelated to HeroUI** (documented skews). No new peer warning was introduced by the bump; the `@heroui-pro/react` peer warning that existed at 3.0.5 is **gone**.

```
 WARN  Issues with peer dependencies found
agent-runtime
├─┬ @mastra/client-js 1.25.0
│ └─┬ @ai-sdk/ui-utils 1.2.11
│   ├── ✕ unmet peer zod@^3.23.8: found 4.4.3
│   └─┬ @ai-sdk/provider-utils 2.2.8
│     └── ✕ unmet peer zod@^3.23.8: found 4.4.3
└─┬ @ag-ui/mastra 1.0.3
  └── ✕ unmet peer @copilotkit/runtime@0.0.0-mme-ag-ui-0-0-46-20260227141603: found 1.60.2

backend
└─┬ @mastra/core 1.36.0
  └─┬ @ai-sdk/ui-utils 1.2.11
    ├── ✕ unmet peer zod@^3.23.8: found 4.3.6
    └─┬ @ai-sdk/provider-utils 2.2.8
      └── ✕ unmet peer zod@^3.23.8: found 4.3.6

frontend
└─┬ @tiptap/suggestion 3.27.1
  ├── ✕ unmet peer @tiptap/core@3.27.1: found 3.23.6
  └── ✕ unmet peer @tiptap/pm@3.27.1: found 3.23.6
```

(Also emitted: `WARN 10 deprecated subdependencies found` — pre-existing, not bump-related.)

### Transitive delta observed vs. expected

| Change                                  | Expected (RESEARCH)                              | Observed                                                                                | Verdict       |
| --------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------- |
| `@heroui/react` dep on `@heroui/styles` | exact `3.2.1` (coupled)                          | `@heroui/styles: 3.2.1` in the 3.2.1 dep block                                          | ✅ match      |
| `react-aria-components` under heroui    | 1.17.0 → 1.18.0                                  | heroui@3.2.1 resolves `react-aria-components: 1.18.0`                                   | ✅ match      |
| `react-aria` direct dep                 | NEW `react-aria@3.49.0` (externalized, PR #6653) | heroui@3.2.1 resolves `react-aria: 3.49.0`                                              | ✅ match      |
| `@react-aria/*`                         | patch bumps                                      | `@react-aria/i18n 3.13.1`, `@react-aria/ssr 3.10.1`, `@react-aria/utils 3.34.1` present | ✅ consistent |
| Other package.json changes              | none needed (peers already satisfied)            | only the 2 pin lines changed                                                            | ✅ match      |

No unexpected transitive change surfaced; nothing required investigation before commit. (RAC 1.17.0 / 1.19.0 and react-aria 3.48.0 / 3.50.0 also remain in the lockfile for OTHER consumers — pre-existing, not introduced by this bump.)

### Bump commit SHA

```
10de0c9589e9d7d3f55c19b0b1afb6825d823355
```

**Later plans (78-02/03/04) reference this SHA for the rollback:** `git revert 10de0c95 && pnpm install && pnpm --dir frontend type-check` restores the 3.0.5 baseline.

## Task Commits

1. **Task 1 + Task 2: lockstep bump 3.0.5 → 3.2.1 (single atomic commit)** — `10de0c95` (chore)
   - Both tasks touch the same two files; per the plan the commit lands once in Task 2 after both oracles pass. `git show --stat 10de0c95` lists exactly `frontend/package.json` (4 ±) and `pnpm-lock.yaml` (178 ±).

**Plan metadata (SUMMARY):** this docs commit.

## Verification Results

| Oracle                    | Command                                                     | Result                   |
| ------------------------- | ----------------------------------------------------------- | ------------------------ |
| Zero 3.0.5 remnants       | `grep -E "@heroui/(react\|styles)@3\.0\.5" pnpm-lock.yaml`  | no output, **exit 1** ✅ |
| ≥2 3.2.1 matches          | `grep -cE "@heroui/(react\|styles)@3\.2\.1" pnpm-lock.yaml` | **5** ✅                 |
| Single-version resolution | `pnpm --dir frontend list @heroui/react @heroui/styles`     | both **3.2.1** ✅        |
| Type-check                | `pnpm --dir frontend type-check`                            | **exit 0** ✅            |
| Drawer runtime            | `pnpm --dir frontend test run ConcurrentDrawers`            | **3/3 pass, exit 0** ✅  |
| Atomic commit             | `git show --stat 10de0c95`                                  | exactly 2 files ✅       |
| Pre-commit hook build     | (ran on `git commit`, not bypassed)                         | commit succeeded ✅      |

## Decisions Made

- Bumped to exactly `3.2.1` (audited target) rather than chasing npm `latest` — `latest` also reads 3.2.1, so no divergence, but the rule was honored regardless.
- Deferred the `heroui-forms.tsx` toggles `*.Content` migration and its render oracle to **plan 78-02**, keeping the bump independently revertible (RESEARCH §Rollback).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The bump was clean: type-check exit 0 with no source edits, ConcurrentDrawers green on first run, no unexpected transitive changes, no new peer warnings. No rollback was needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for plan 78-02** (toggles `*.Content` migration in `heroui-forms.tsx` + render oracle) and 78-03 (Phase 75 protocol re-run).
- Bump commit `10de0c95` is the documented rollback anchor for the rest of Phase 78.
- Not yet exercised in this plan (later plans own them): the migrated-toggles render oracle, the protocol re-run diff, the EN/AR drawer smoke, and `pnpm --dir frontend build && pnpm --dir frontend size` (bundle gate — the pre-commit hook build passed, but the size-limit gate is Phase 80 / the sweep's job per VALIDATION).

## Self-Check: PASSED

- Task 1 acceptance criteria: all PASS (pins set, zero 3.0.5, 5×3.2.1, single-version list, only 2 files modified).
- Task 2 acceptance criteria: all PASS (type-check exit 0, ConcurrentDrawers exit 0, commit stat = 2 files, message references lockstep bump).
- Plan `<verification>` block: all four checks green (see table above).

---

_Phase: 78-heroui-v3-api-audit-bump_
_Completed: 2026-07-03_
