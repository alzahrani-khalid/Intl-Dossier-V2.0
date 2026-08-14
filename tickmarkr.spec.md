<!-- tickmarkr:spec -->

# Phase 89 — T1 oracle repair (RUL111)

Authored per RUL96/RUL97, repaired per RUL108, replanned per RUL109, oracle-repaired per RUL111,
on `milestone/v9.0-drover` @ `46a88500`.

**T4 is DONE and is not in this spec.** Completed in `run-20260812-220158-0000000000000004`, all seven
gates green, reviewer `kimi:kimi-code/k3` approved. Work is `e7f6226e` on
`tickmarkr/run-20260812-220158-0000000000000004`, awaiting a landing decision.

**The worker succeeded in `run-…0005`.** Commit `045d99a0` removes both targeted mixed imports;
build, test, lint, evidence, scope and review all passed; only `acceptance` failed. That implementation
survives on `tickmarkr/run-20260812-224504-0000000000000005--T1` for reference.

## The oracle defect, corrected — and one correction to the diagnosis

The previous oracle asserted an absence over the **entire** build log, which is what the spec-authoring
law warns against. It is replaced by an assertion scoped to this task's own subject.

**Correction, measured rather than reasoned.** The consult diagnosed the blocker as a pre-existing
`i18n` mixed-import warning. **No such warning is emitted.** Three consecutive builds of the unfixed
tree produced an identical, deterministic set of exactly two warnings:

```
(!) frontend/src/lib/sentry.ts is dynamically imported by …
(!) frontend/src/components/empty-states/ListEmptyState.tsx is dynamically imported by …
total=2  subject=2  i18n=0   (×3 builds, no variance)
```

The `import('@/i18n')` in `DesignProvider.tsx:304` is real as source, but `frontend/vite.config.ts:236`
routes `i18next` / `react-i18next` into an explicit `i18n-vendor` manual chunk, so Rollup does not warn
about it. **Known baseline debt is therefore recorded as what it is: a deliberate dynamic import
(commented at `DesignProvider.tsx:302` as avoiding a circular dependency with the i18n bootstrap), which
produces no build warning and is not this task's concern.** Recording the fiction would have misled the
next reader.

**Why the earlier failure was unreadable, which was my defect.** RUL108's repair merged the original two
oracles into one conjunctive `… vite build … && ! grep …`. That removed the vacuous half, but the
original split existed so a build failure could not masquerade as warning-absence — and merging it made
_build failed_ and _warning found_ both render as `oracle failed … (exit 1)`.

**Restoring the split is what made the next failure diagnosable (RUL114).** In `run-…0006` the oracle
reported `(exit 2)` — unambiguously the `|| exit 2` branch, i.e. **the build itself failed**, not a
warning hit. Conflated behind one `&&` that would have read as a grep failure for a third time, and the
criterion would have been "repaired" against a cause that was never there.

**That failure was environmental, not merit.** Six of seven gates passed at the same tip, `build`
among them — so the same tree built successfully through one command and failed through another.
Rather than model the difference, the oracle now **invokes the build exactly as the `build` gate does**,
which makes its build half sound by construction: if the `build` gate passes at a tip, the oracle's
build cannot fail at that tip, whatever the underlying cause.

`--force` is added deliberately, as the one intentional deviation from the gate's own invocation. Turbo
replays cached logs, and a replayed log observed during this repair carried paths from a **different
directory** — so without cache-bypass the oracle can grep a log it did not produce. `--force` changes
only cache reuse, never the pass/fail semantics.

## VACUITY PRE-CHECK — run in BOTH directions, on the final oracle

A one-directional check catches a vacuous oracle but not an unsatisfiable one, and the second is what
parked T1 twice. Pinned interpreter, both directions, plus failure-mode discrimination:

| tree                                   | required                                   | measured   |
| -------------------------------------- | ------------------------------------------ | ---------- |
| UNFIXED `46a88500`                     | must FAIL                                  | **exit 1** |
| in-scope fix (`045d99a0` → `2f98ec68`) | must PASS                                  | **exit 0** |
| build broken                           | must be distinguishable from a warning hit | **exit 2** |

## SHARED-SYMBOL CHECK — `git grep` over tracked files

Files referencing `EngagementsListPage`: the page; `__tests__/EngagementsListPage.test.tsx` (in
`files[]`); `routes/_protected/engagements/index.tsx`; `routes/_protected/dossiers/engagements/index.tsx`.
Only the test file must change — both routes already import the page statically and only render it.
The Sentry half has no asserting test (`git grep -ln "vi.mock.*sentry"` → nothing; `main.tsx` untested).
`frontend/tests/fixtures/dossier-fixtures.ts` is in NO task's `files[]`.

## T1: End both mixed static/dynamic imports that produce volatile build warnings

- goal: neither the Sentry module nor the empty-state module is both statically and dynamically imported, so the build emits no mixed-import warning naming either of them
- shape: implement
- deps: none
- files: frontend/src/main.tsx, frontend/src/pages/engagements/EngagementsListPage.tsx, frontend/src/pages/engagements/**tests**/EngagementsListPage.test.tsx
- context: frontend/src/lib/sentry.ts, frontend/src/components/app-error-boundary/ErrorBoundary.tsx, frontend/src/store/authStore.ts, frontend/src/components/empty-states/index.ts, frontend/src/routes/\_protected/engagements/index.tsx
- complexity: 4
- gates:
  - build
  - test
  - lint
  - evidence
  - scope
  - acceptance
  - review
- acceptance:
  - command: L=$(mktemp); npm run -s build -- --continue --force > "$L" 2>&1 || exit 2; ! grep -E "dynamically imported by" "$L" | grep -qE "lib/sentry|empty-states"
  - judge: both the Sentry module and the empty-state module are brought into their importing files as ordinary top-level imports
  - judge: the two Sentry initialization calls still run inside the idle callback, and the Sentry setup call keeps a rejection handler so a failure there cannot stop the web-vitals reporting call from running
  - judge: the comment claiming the deferral keeps the Sentry package off the critical rendering path is corrected to describe what the code now does, rather than deleted
  - judge: the engagements list page renders the same empty state under the same conditions as before, and its test file gains mock coverage for the now-static import while every assertion it already made remains intact
  - judge: every test in the engagements list page test file asserts rendered behaviour rather than source text such as a module imported with `?raw`
