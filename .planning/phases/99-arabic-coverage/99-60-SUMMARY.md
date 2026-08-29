---
status: complete
task: P99-60
implementation_commits:
  - 66f121828
  - 778ab9870
task_base: 151ddae79b52e891906b65f072995e7d0ad3b40a
---

# P99-60 Summary — mask deletion lane 6, part 3 of 4

## Outcome and population

GREEN. All 53 fallback masks were deleted from the 12-file manifest after P99-50's bilingual
gatekeeper. No scope widening occurred. The re-derived TypeScript AST census over the task base and
final tree printed verbatim:

```text
before literal=0 object=53 masks=53 maskFiles=12 interpolationOptions=0
after literal=0 object=0 masks=0 maskFiles=0 interpolationOptions=1
```

The remaining option is interpolation, not fallback text: `MemberListCard` retains its `count`.
The final strict projection printed:

```json
{"scannedFiles":12,"twoArgTotal":0,"literalTwoArgTotal":0,"optionsDefaultTotal":0,"rawKeyTotal":67,"twoArgUnresolved":0,"rawKeyUnresolved":0,"twoArgUnresolvedEn":0,"twoArgUnresolvedAr":0,"rawKeyUnresolvedEn":0,"rawKeyUnresolvedAr":0}
```

## Deletion-only proof

`git diff --unified=2 151ddae79..HEAD` spot-checked `ConnectedAnchorsCard` and
`MemberListCard`. The representative hunks were:

```diff
-{t('overview.anchors.title', { defaultValue: 'Connected Anchors' })}
+{t('overview.anchors.title')}
 t('overview.members.more', {
-  defaultValue: '+{{count}} more members',
   count: members.length - MAX_MEMBERS,
 })
```

An AST comparison of each production file at the task base and HEAD compared every `t()` first
argument, `useTranslation(...)` call, and import declaration byte-for-byte. Output:

```text
files=12 t-calls=70 key-expressions=BYTE-EQUAL bindings=BYTE-EQUAL imports=BYTE-EQUAL
```

Thus no key, namespace, binding, hook, or import changed. No production fallback substitute was
added, and no i18n JSON changed.

## Acceptance oracles

The first plan oracle (strict zero, nonempty raw-key control, readable-file control, and the
multi-line fallback-option scanner) exited 0:

```text
scoped-files=12 defaultValue-hits=0
```

The second plan oracle (task-base JSON exclusion, bilingual unresolved zero, negative control)
exited 0:

```text
task-base=151ddae79b52e891906b65f072995e7d0ad3b40a i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

The direct negative-control rows remained:

```text
TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
t('priority.low') ns=assignments -> "Low"
```

## Companion repair and verification

The deletion made both owned tests' old fallback-aware mocks render bare keys, activating the
conditional repair. Both mocks now resolve from real statically imported en/ar bundles loaded
again with `await vi.importActual` inside the hoisted factory; a missing key throws. English and
Arabic values and absence of bare keys are asserted. Existing error, empty, cached-data, and
payload assertions remain and run.

The default Vitest loader could not write through the harness-owned `node_modules` symlink
(`EPERM ... node_modules/.vite-temp`); the runner loader first exposed the config's CommonJS
`__dirname` assumption. Supplying that global through `NODE_OPTIONS` without changing a file gave:

```text
Test Files  2 passed (2)
Tests       26 passed (26)
```

The plan-to-Vitest AST comparison printed:

```text
plan-criteria=6 exact-leaf-titles=6 missing=0
```

`pnpm --dir frontend type-check` exited 0:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Both implementation commits also passed the repository commit hooks (format, lint, build, and
dependency checks).

## Scope, budget, and later owners

Before this summary, `git diff --name-only 151ddae79..HEAD` printed exactly the 12 production files
and two owned companions; `i18n-name-count=0`. The measured `git diff --unified=0 ... | wc -c` was:

```text
logic-diff-bytes=39202
```

This stays below the 45,000-byte part ceiling before the execution record. P99-36, P99-59, and
P99-62 own the other file-disjoint lane-6 parts; P99-41 owns the consolidated rendered re-proof.
Phase 102 owns the D-21 dot-to-colon conversion. Nothing from those populations was changed here.
