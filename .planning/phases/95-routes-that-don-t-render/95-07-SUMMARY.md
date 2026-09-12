---
phase: 95-routes-that-don-t-render
plan: 07
subsystem: infra
tags: [eslint, flat-config, tanstack-router, lint-rule, not-found]

requires:
  - phase: 93-trust-the-render
    provides: the traced NOTFOUND-COMPONENT-01 finding (component-thrown bare notFound() reaches defaultErrorComponent, not the 404 page) and the two compliant `notFound({ routeId: rootRouteId })` call sites it produced
provides:
  - 'scripts/eslint-rules/no-bare-component-notfound.mjs — local flat-config rule: routeId-compliance check, loader/beforeLoad ancestry exemption, `{ global: true }` treated non-compliant'
  - 'eslint.config.mjs registration at `error` over frontend/src/** (inside the CI-blocking `pnpm lint` chain) plus a fixture block'
  - 'tools/eslint-fixtures/bad-bare-component-notfound.tsx — a standing positive control that future config edits cannot silently defeat'
affects: [95-09, any phase adding a notFound() throw in frontend/src]

tech-stack:
  added: []
  patterns:
    - 'First local ESLint rule module in the repo (scripts/eslint-rules/) — prior custom enforcement was all no-restricted-syntax selectors or npm plugins'

key-files:
  created:
    - scripts/eslint-rules/no-bare-component-notfound.mjs
    - tools/eslint-fixtures/bad-bare-component-notfound.tsx
  modified:
    - eslint.config.mjs

key-decisions:
  - 'Custom walker, not a no-restricted-syntax selector — esquery has no ancestor-negation combinator, so a selector cannot distinguish the correct bare LOADER throw from a bare COMPONENT throw (they are byte-identical at the call site) and would false-positive on reports/$reportId.tsx:54'
  - 'The rule module default-exports the rule; the config wraps it inline as `plugins: { local: { rules: {...} } }` — keeps the module a pure rule and matches the plan key_link shape'
  - 'The pre-existing prettier drift in eslint.config.mjs:284 (the test-mocks block) was left untouched — it predates this plan (verified against HEAD) and reformatting it would collide with parallel lanes'

patterns-established:
  - 'Local ESLint rule modules live in scripts/eslint-rules/ and register via an inline `plugins: { local: { rules: {...} } }` block'
  - 'Every local rule ships a committed positive-control fixture under tools/eslint-fixtures/ with its own registration block, so the rule cannot be silently disabled'

requirements-completed: [NOTFOUND-COMPONENT-01]

duration: 25min
completed: 2026-08-16
---

# Phase 95 Plan 07: NOTFOUND-COMPONENT-01 Enforcement Summary

**A ~60-line local ESLint rule now errors on any component-thrown bare `notFound()` across `frontend/src`, exempting the correct route-loader form by ancestry walk — fires attributed on the committed fixture, silent on all three existing sites, green inside the CI-blocking `pnpm lint` chain.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-16T19:33Z (approx.)
- **Completed:** 2026-08-16T19:58Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `local/no-bare-component-notfound` implements the RESEARCH §NOTFOUND walker exactly: compliant = first argument is an `ObjectExpression` carrying a `routeId` property; otherwise walk `node.parent` and exempt any ancestor `Property` keyed `loader` / `beforeLoad`; otherwise report. `notFound({ global: true })` (the deprecated spelling) is non-compliant.
- Registered at `'error'` over `frontend/src/**/*.{ts,tsx}` — the exact glob the CI-blocking frontend `lint` script runs — so this is enforcement, not advice.
- A committed positive-control fixture carries BOTH non-compliant shapes (bare, and `{ global: true }`); both fire.
- D-09's default branch (ADD) holds, and the pure-selector alternative stayed unattempted as the plan required.

## Task Commits

1. **Task 1: The rule module + registration + fixture** — `1178a668e` (feat)
2. **Task 2: Observe BOTH controls** — no code change (observation-only task; evidence recorded below)

Commit contents verified in-commit, not just on disk:

```
$ git show --stat --oneline 1178a668e
1178a668e feat(95-07): enforce component-thrown notFound({ routeId }) via local eslint rule
 eslint.config.mjs                                  | 35 ++++++++++++
 .../eslint-rules/no-bare-component-notfound.mjs    | 63 ++++++++++++++++++++++
 .../bad-bare-component-notfound.tsx                | 31 +++++++++++
 3 files changed, 129 insertions(+)

$ git show HEAD:eslint.config.mjs | command grep -c 'no-bare-component-notfound'
5
```

## Files Created/Modified

- `scripts/eslint-rules/no-bare-component-notfound.mjs` (NEW) — the rule; header documents WHY a selector cannot express it
- `eslint.config.mjs` — import + two blocks: the `frontend/src/**` enforcement block (cloning the `rtl-friendly` shape at :226-232) and the fixture block (cloning the dnd-kit fixture shape at :331-348)
- `tools/eslint-fixtures/bad-bare-component-notfound.tsx` (NEW) — positive control, imported by nothing

## Gate observations — BOTH DIRECTIONS (GATE-STANDARD C1/C2)

### Task 1 gate (existence/wiring)

```
$ test -f scripts/eslint-rules/no-bare-component-notfound.mjs && test -f tools/eslint-fixtures/bad-bare-component-notfound.tsx && command grep -q 'no-bare-component-notfound' eslint.config.mjs && command grep -q 'routeId' scripts/eslint-rules/no-bare-component-notfound.mjs
TASK1_GATE_EXIT=0
```

### Task 2 gate — RED, observed BEFORE the rule landed

The fixture was written FIRST so the red would be attributable to the gate's subject. A run against a
non-existent fixture path would have been `UNABLE TO MEASURE` (C2), not a red. With the fixture on disk
and the rule/registration absent, ESLint ran to completion and simply had nothing to say:

```
$ POS=$(pnpm exec eslint -c eslint.config.mjs -f json tools/eslint-fixtures/bad-bare-component-notfound.tsx)
RED_EXIT=0            # eslint completed; stderr empty
$ printf '%s' "$POS" | command grep -c 'no-bare-component-notfound'
0                     # GREP_EXIT=1 -> the gate's attribution assertion FAILS
$ printf '%s' "$POS"
[{"filePath":".../tools/eslint-fixtures/bad-bare-component-notfound.tsx","messages":[],
  "suppressedMessages":[],"errorCount":0,"fatalErrorCount":0,"warningCount":0,...}]
```

`fatalErrorCount: 0` and an empty stderr prove the red reached the assertion of record rather than dying
at a tooling step (C2).

### Task 2 gate — GREEN, observed AFTER

**(1) POSITIVE control — attributed by `ruleId`, both non-compliant shapes:**

```
$ pnpm exec eslint -c eslint.config.mjs -f json tools/eslint-fixtures/bad-bare-component-notfound.tsx
POS_EXIT=1
ruleId hits for "local/no-bare-component-notfound": 2
errorCount 2  fatalErrorCount 0        # not a config crash — a crash emits no ruleId
```

```json
[
  {
    "ruleId": "local/no-bare-component-notfound",
    "severity": 2,
    "message": "Component-thrown notFound() must pass { routeId } — a bare throw reaches the defaultErrorComponent, not the 404 page (NOTFOUND-COMPONENT-01).",
    "line": 25,
    "column": 9,
    "nodeType": "CallExpression",
    "messageId": "bareComponentNotFound"
  },
  {
    "ruleId": "local/no-bare-component-notfound",
    "severity": 2,
    "message": "Component-thrown notFound() must pass { routeId } — a bare throw reaches the defaultErrorComponent, not the 404 page (NOTFOUND-COMPONENT-01).",
    "line": 30,
    "column": 9,
    "nodeType": "CallExpression",
    "messageId": "bareComponentNotFound"
  }
]
```

Line 25 is the bare `throw notFound()`; line 30 is `throw notFound({ global: true })` — the deprecated
spelling is proven non-compliant, as `must_haves` requires.

**(2) NEGATIVE controls — the three existing sites, exit 0:**

```
$ pnpm exec eslint -c eslint.config.mjs frontend/src/components/dossier/DossierShell.tsx frontend/src/components/workspace/WorkspaceShell.tsx 'frontend/src/routes/_protected/reports/$reportId.tsx'
NEG_EXIT=0            # no output at all
```

That zero was instrument-tested two ways before it was believed — a silent rule and an unscoped rule
produce the same exit 0:

```
$ pnpm exec eslint -c eslint.config.mjs --print-config <each file> | (rules['local/no-bare-component-notfound'])
frontend/src/components/dossier/DossierShell.tsx           local/no-bare-component-notfound = [2]
frontend/src/components/workspace/WorkspaceShell.tsx       local/no-bare-component-notfound = [2]
frontend/src/routes/_protected/reports/$reportId.tsx       local/no-bare-component-notfound = [2]
```

and, decisively, one single ESLint process over the fixture AND the three sites together — same run,
same config, rule demonstrably live:

```
frontend/src/components/dossier/DossierShell.tsx        -> rule-hits: 0 | all-msgs: 0 | fatal: 0
frontend/src/components/workspace/WorkspaceShell.tsx    -> rule-hits: 0 | all-msgs: 0 | fatal: 0
frontend/src/routes/_protected/reports/$reportId.tsx    -> rule-hits: 0 | all-msgs: 0 | fatal: 0
tools/eslint-fixtures/bad-bare-component-notfound.tsx   -> rule-hits: 2 | all-msgs: 2 | fatal: 0
```

The loader exemption is therefore exercised, not merely unscoped: `reports/$reportId.tsx` carries a bare
`throw notFound()` at :54, the rule is at severity 2 on that file, and it reports nothing.

**(3) WHOLE CHAIN:**

```
$ pnpm lint
PNPM_LINT_EXIT=0
intake-frontend:lint: cache miss, executing df74a1acd20beec9     # fresh run, not a replayed cache hit
intake-frontend:lint: i18n namespace check OK: 1716 file(s) scanned ...
intake-frontend:lint: duplicate-rtl check OK: 1717 file(s) scanned under frontend/src ...
intake-frontend:lint: bootstrap parity check OK ...
intake-frontend:lint: date-formatting check OK: 1535 non-test file(s) scanned ...
 Tasks:    3 successful, 3 total
```

The frontend workspace was a cache MISS, so the eslint pass over `frontend/src/**` genuinely re-ran with
the new rule registered; the four post-eslint checkers only run because eslint exited 0.

**(4) Verbatim Task 2 `<automated>` gate:**

```
$ POS=$(pnpm exec eslint -c eslint.config.mjs -f json tools/eslint-fixtures/bad-bare-component-notfound.tsx || true) && printf '%s' "$POS" | command grep -q 'no-bare-component-notfound' && pnpm exec eslint -c eslint.config.mjs frontend/src/components/dossier/DossierShell.tsx frontend/src/components/workspace/WorkspaceShell.tsx 'frontend/src/routes/_protected/reports/$reportId.tsx'
TASK2_GATE_EXIT=0
```

## Additional real findings surfaced by the rule

**None.** The rule found no bare component throws beyond the research-known three sites — nothing was
fixed, and nothing was silenced. The population was derived independently rather than inferred from the
green:

```
$ find frontend/src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name 'routeTree.gen.ts' -print0 | xargs -0 command grep -n 'notFound('
```

13 hits, of which **exactly 3 are call sites** — `DossierShell.tsx:144`, `WorkspaceShell.tsx:136`
(both compliant), `reports/$reportId.tsx:54` (the correct bare loader throw). The other 10 are prose
inside comments in `app-error-boundary/ErrorBoundary.tsx`, `error-boundary/ErrorBoundary.tsx`, and the
three site files. Instrument test on the sweep: the same machinery finds the token `notFound` in 14
files, so the narrow result is a real count, not a false-clean from `grep`'s ugrep/.gitignore behavior.

## Decisions Made

- **Custom walker over `no-restricted-syntax`** — as D-09 and RESEARCH §NOTFOUND require. Confirmed at
  execution rather than assumed: the bare loader throw and a bare component throw are identical at the
  call site, and the negative-control run proves only ancestry separates them.
- **Rule module exports the rule; the config wraps it** as `plugins: { local: { rules: {...} } }`. Both
  the plan's `key_links` shape and the conventional ESLint module contract are satisfied.
- **Two registration blocks, not one widened glob.** The fixture gets its own block (dnd-kit shape) so
  `pnpm lint`'s `frontend/src/**` glob still cannot reach the intentionally-bad file — the fixture can
  never red CI, and it still stands as a control (T-95-17).

## Known ceiling (not a defect; recorded so a later reader does not mistake silence for coverage)

The rule matches `CallExpression` with `callee.name === 'notFound'`, exactly as the research pseudocode
specifies. It therefore does **not** see an aliased import (`import { notFound as nf }`) or a member call
(`router.notFound()`). No such spelling exists anywhere in `frontend/src` today (the 13-hit sweep above is
the whole population), and closing it would need scope analysis beyond the specified walker. If an alias
ever appears, the upgrade path is `context.sourceCode.getScope()` resolution of the callee binding.

## Deviations from Plan

None — plan executed exactly as written. The rule module came in at 63 lines against the plan's "~40
lines"; the excess is the header comment explaining the esquery limitation and the inline rationale, not
logic.

## Issues Encountered

**One UNABLE TO MEASURE, then resolved on retry — a parallel-lane race, not a finding.** The first
`pnpm lint` run exited 2 on:

```
Error: ENOENT: no such file or directory, open '.../frontend/src/routes/_protected/positions/$positionId.tsx'
    at readAndVerifyFile (eslint-helpers.js:1306)
```

ESLint globbed the file list and the file was deleted underneath it mid-run by a concurrent Phase 95
executor (`git status` showed `D  frontend/src/routes/_protected/positions/$positionId.tsx` staged, with
a new `positions/$id/index.tsx` untracked). This is an environment/tooling death, not a red attributable
to this plan's subject (GATE-STANDARD C2), so it was recorded as UNABLE TO MEASURE and re-run. The re-run
was a frontend cache MISS and exited 0. No plan file, no gate, and no other lane's file was touched.

## Next Phase Readiness

- `NOTFOUND-COMPONENT-01` is ENFORCED. The register-row flip to Complete is **95-09's write**, not this
  plan's — `REQUIREMENTS.md` was not opened or edited here (single-writer discipline).
- Any future phase adding a component-level `notFound()` in `frontend/src` will be blocked by CI until it
  passes `{ routeId }`.
- The fixture is a standing control: if a later config edit drops the rule, the fixture stops reporting
  and the drill in this SUMMARY reproduces the failure in one command.

## BLOCKED

None. Every gate in this plan ran and its exit was observed; both directions of the Task 2 gate were
constructed and recorded above.

---

_Phase: 95-routes-that-don-t-render_
_Plan: 07_
_Completed: 2026-08-16_

SUMMARY-END
