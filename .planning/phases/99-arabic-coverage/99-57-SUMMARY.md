---
status: complete
task: P99-57
implementation_commits:
  - 848942071
  - 9096eb675
task_base: 706eccd404b769841293701637490d2718444d3b
---

# P99-57 Summary — mask deletion lane 1, part 2 of 3

## Outcome and re-derived population

GREEN. The 13 production files moved from 97 strict masks to zero. Keys, bindings, hooks, imports,
i18n JSON, and every English/Arabic unresolved counter stayed unchanged.

The scoped audit before deletion printed verbatim:

```json
{
  "scannedFiles": 13,
  "twoArgTotal": 97,
  "literalTwoArgTotal": 78,
  "optionsDefaultTotal": 19,
  "rawKeyTotal": 143,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedEn": 0,
  "rawKeyUnresolvedAr": 0
}
```

A TypeScript AST census over the task-base and final versions also included fallback options on
dynamic first arguments. Its verbatim output was:

```text
before literal=78 object=21 object-literal-key=19 object-dynamic-key=2
after literal=0 object=0 object-literal-key=0 object-dynamic-key=0
```

The two dynamic-key object masks were `sections.${key}` and `type.${dossierType}` in
`ExportDossierDialog.tsx`; the fallback-option scan owns them outside the strict audit's 97
literal-first-key sites. No mask was found outside the 13-file manifest.

## Deletion-only and byte-preservation proof

Sample from `git diff --unified=2 706eccd40..HEAD`, showing a literal fallback deletion and an
object-form deletion that preserves interpolation:

```diff
-{t('widget.show_more', 'Show {{count}} more', {
+{t('widget.show_more', {
   count: links.length - maxVisible,
 })}
 t('warning.failedSections', {
-  defaultValue: 'Some sections could not be generated: {{sections}}',
   sections: failedSectionNames(failedSections),
 })
```

An AST comparison read every production file at the task base and at HEAD, comparing every `t()`
first-argument expression, `useTranslation(...)` call, and import byte-for-byte. Verbatim output:

```text
files=13 t-calls=273 key-expressions=BYTE-EQUAL bindings=BYTE-EQUAL imports=BYTE-EQUAL
```

## Closing register

The final scoped projection from `node scripts/i18n-audit-strict.mjs "$PWD" --scope "$SCOPE"
--json` printed:

```json
{"scannedFiles":13,"twoArgTotal":0,"literalTwoArgTotal":0,"optionsDefaultTotal":0,"rawKeyTotal":240,"twoArgUnresolved":0,"rawKeyUnresolved":0,"twoArgUnresolvedEn":0,"twoArgUnresolvedAr":0,"rawKeyUnresolvedEn":0,"rawKeyUnresolvedAr":0}
```

The first acceptance oracle, including readable-file and multi-line fallback-option controls,
exited 0:

```text
scoped-files=13 defaultValue-hits=0
```

The second acceptance oracle exited 0:

```text
task-base=706eccd404b769841293701637490d2718444d3b i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

The direct negative control remained discriminating:

```text
TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
t('priority.low') ns=assignments -> "Low"
```

`git diff --name-only 706eccd40..HEAD` printed exactly the 13 production paths and the owned
companion test before this summary. Its i18n-filtered form printed `i18n-name-count=0`.
`git diff --unified=0 706eccd40..HEAD | wc -c` printed `39881` before this summary, below the
45,000-byte lane ceiling.

## Companion repair and verification

Deleting the dynamic `sections.${key}` fallback makes the old private mock return bare section
keys, breaking the owned D-08 literal assertion; that activated the conditional repair. The repaired
mock loads real en/ar `dossier-export` and `common` JSON with `await vi.importActual`, has no private
copy, default fallback, or key fallback, and throws on a miss. Static JSON imports supply expectations.
Both locales and the absence of bare keys are asserted, while all five original tests remain.

The direct CLI hit the harness's read-only Vite cache (`EPERM ... node_modules/.vite-temp`). The
equivalent API run used `config:false` and `/private/tmp/p99-57-vite-cache`:

```text
Test Files  1 passed (1)
Tests       11 passed (11)
```

The six acceptance leaf titles were mechanically collected:

```text
acceptance-titles=6 chars=166,734,2668,1370,572,264
```

`pnpm type-check` in `frontend/` exited 0:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

## Explicitly deferred

- P99-31 and P99-58 own the other file-disjoint lane-1 deletion parts.
- P99-41 owns the consolidated rendered re-proof and operator checkpoint.
- Phase 102 owns D-21's working dot-form-to-colon conversion; this task made no conversion.
