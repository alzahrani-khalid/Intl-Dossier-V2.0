---
status: complete
---

# P99-53 Summary — language-derived translator-binding corpus

## Result

The translator-binding axis is re-derived from JavaScript/TypeScript binding mechanisms, not extended from the former seven-form list. The matrix is the complete cross-product of four proof identifiers and eight forms: 32 cells, each realized as a negative/control pair by the generator. The eight forms cover all ten enumerated variants by keeping the inseparable variants in two composite forms: destructuring drills both without and with an alias, and assignment drills both initial assignment and reassignment.

- Matrix identifiers: 4
- Language-derived forms: 8
- Matrix cells: 32
- Corpus files: 125
- Corpus content bytes: 86504
- Generated files: 122
- Generated content bytes: 45027
- Corpus add-diff bytes: 130539
- Add-diff overhead per file: 352
- Task diff bytes: 145847
- gates.diffCap: 155000
- Headroom: 9153
- Reproduction drift lines: 0

No instrument, consumer test, production caller, locale bundle outside this corpus, or other task plan changed.

## Production provenance

- `frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:431-432` at `2e3f26bad` binds `const { t: tQs } = useTranslation('quickswitcher')`. Form `destructuring-command-palette-tsx-431-432` drills that exact translator binding and also drills the unaliased destructuring variant; it never substitutes an alias of `useTranslation` for the translator alias.
- `frontend/src/components/relationships/AnalyticResultView.tsx:196-205,261,300` at `2e3f26bad` passes a `ctx` object containing `t`, destructures `t` inside the callee, and calls it there. Form `parameter-analytic-result-view-tsx-196-205-261-300` drills that exact parameter-object dataflow, not only the already-classified direct `t` parameter.

The form names identify the measured sources by file and line and contain no spelling of the word forbidden by the criterion. The two production files themselves remain unchanged.

## Derived form set

| Form | Language mechanism | Production drilled in both callers of every cell |
| --- | --- | --- |
| `direct-call` | direct property call | `useTranslation(ns).t(key, fallback)` |
| `destructuring-command-palette-tsx-431-432` | destructuring without and with a property alias | `const { t } = useTranslation(ns); t(...)` and `const { t: tQs } = useTranslation(ns); tQs(...)` |
| `aliased-import` | aliased ES import | `import { useTranslation as useI18n } ...; const { t } = useI18n(ns); t(...)` |
| `re-export` | ES re-export followed by import | support module `export { useTranslation } from ...`; caller imports that module and calls its translator |
| `property-access` | translator object property access | `const translator = useTranslation(ns); translator.t(...)` |
| `parameter-analytic-result-view-tsx-196-205-261-300` | translator carried through a parameter object | `renderType(ctx: { t: TFn; ... }); const { t, ... } = ctx; t(...)` |
| `assignment-and-reassignment` | initial assignment and later reassignment | declare `translate`, assign `useTranslation(ns).t`, reassign it, then call it |
| `shadowing` | nested lexical binding shadows the outer translator | outer and inner `const { t: translate }` bindings; the inner binding reaches the call |

## Cell-by-cell drill inventory

Every row covers the named root and its `-control` twin. `ns=m/g` means the namespace-negative caller uses `missing` and its control uses `graph`; all other cells use the same namespace in both polarities. Identifier polarity changes independently of the translator-binding syntax.

| Identifier | Form | Fixture root | Shape present in both generated callers |
| --- | --- | --- | --- |
| receiver | `direct-call` | `receiver-direct` | direct `useTranslation(ns).t(...)`; ns=g/g |
| receiver | `destructuring-command-palette-tsx-431-432` | `receiver-destructured` | unaliased `t` plus aliased `tQs` destructures and calls; ns=g/g |
| receiver | `aliased-import` | `receiver-aliased-import` | aliased `useI18n` import, `t` destructure, call; ns=g/g |
| receiver | `re-export` | `receiver-re-export` | imported local re-export, `t` destructure, call; ns=g/g |
| receiver | `property-access` | `receiver-property-access` | bound translator object and `translator.t(...)`; ns=g/g |
| receiver | `parameter-analytic-result-view-tsx-196-205-261-300` | `receiver-arv` | `ctx: { t }`, body destructure, parameter-bound call; ns=g/g |
| receiver | `assignment-and-reassignment` | `reassigned-receiver` | declaration, assignment, reassignment, `translate(...)`; ns=g/g |
| receiver | `shadowing` | `shadow-receiver` | nested `translate` shadows outer binding and is called; ns=g/g |
| key | `direct-call` | `key-direct` | direct `useTranslation(ns).t(...)`; ns=g/g |
| key | `destructuring-command-palette-tsx-431-432` | `key-destructured` | unaliased `t` plus aliased `tQs` destructures and calls; ns=g/g |
| key | `aliased-import` | `key-aliased-import` | aliased `useI18n` import, `t` destructure, call; ns=g/g |
| key | `re-export` | `key-re-export` | imported local re-export, `t` destructure, call; ns=g/g |
| key | `property-access` | `key-property-access` | bound translator object and `translator.t(...)`; ns=g/g |
| key | `parameter-analytic-result-view-tsx-196-205-261-300` | `key-arv` | `ctx: { t }`, body destructure, parameter-bound call; ns=g/g |
| key | `assignment-and-reassignment` | `key-assign` | declaration, assignment, reassignment, `translate(...)`; ns=g/g |
| key | `shadowing` | `shadow-key` | nested `translate` shadows outer binding and is called; ns=g/g |
| namespace | `direct-call` | `namespace-direct` | direct `useTranslation(ns).t(...)`; ns=m/g |
| namespace | `destructuring-command-palette-tsx-431-432` | `namespace-destructured` | unaliased `t` plus aliased `tQs` destructures and calls; ns=m/g |
| namespace | `aliased-import` | `namespace-aliased-import` | aliased `useI18n` import, `t` destructure, call; ns=m/g |
| namespace | `re-export` | `namespace-re-export` | imported local re-export, `t` destructure, call; ns=m/g |
| namespace | `property-access` | `namespace-property-access` | bound translator object and `translator.t(...)`; ns=m/g |
| namespace | `parameter-analytic-result-view-tsx-196-205-261-300` | `namespace-arv` | `ctx: { t }`, body destructure, parameter-bound call; ns=m/g |
| namespace | `assignment-and-reassignment` | `reassigned-namespace` | declaration, assignment, reassignment, `translate(...)`; ns=m/g |
| namespace | `shadowing` | `shadow-namespace` | nested `translate` shadows outer binding and is called; ns=m/g |
| translator | `direct-call` | `translator-direct-call` | direct selected factory call; negative imports decoy; ns=g/g |
| translator | `destructuring-command-palette-tsx-431-432` | `translator-destructured` | exact `const { t: tQs } = useTranslation('quickswitcher')` plus unaliased variant and both calls |
| translator | `aliased-import` | `translator-aliased-import` | aliased `useI18n` import and `t` call; negative imports decoy |
| translator | `re-export` | `translator-re-export` | local re-export chain; negative re-exports decoy and control re-exports real factory |
| translator | `property-access` | `translator-property-access` | selected translator object and `translator.t(...)`; negative uses decoy |
| translator | `parameter-analytic-result-view-tsx-196-205-261-300` | `translator-arv` | exact `ctx: { t }` parameter-object binding and call; negative uses decoy |
| translator | `assignment-and-reassignment` | `reassigned-translator` | selected translator assignment, reassignment, call; negative uses decoy |
| translator | `shadowing` | `shadow-translator` | selected nested translator shadows canonical outer binding and is called |

## Full matrix

```tsv
receiver	direct-call	receiver-direct
receiver	destructuring-command-palette-tsx-431-432	receiver-destructured
receiver	aliased-import	receiver-aliased-import
receiver	re-export	receiver-re-export
receiver	property-access	receiver-property-access
receiver	parameter-analytic-result-view-tsx-196-205-261-300	receiver-arv
receiver	assignment-and-reassignment	reassigned-receiver
receiver	shadowing	shadow-receiver
key	direct-call	key-direct
key	destructuring-command-palette-tsx-431-432	key-destructured
key	aliased-import	key-aliased-import
key	re-export	key-re-export
key	property-access	key-property-access
key	parameter-analytic-result-view-tsx-196-205-261-300	key-arv
key	assignment-and-reassignment	key-assign
key	shadowing	shadow-key
namespace	direct-call	namespace-direct
namespace	destructuring-command-palette-tsx-431-432	namespace-destructured
namespace	aliased-import	namespace-aliased-import
namespace	re-export	namespace-re-export
namespace	property-access	namespace-property-access
namespace	parameter-analytic-result-view-tsx-196-205-261-300	namespace-arv
namespace	assignment-and-reassignment	reassigned-namespace
namespace	shadowing	shadow-namespace
translator	direct-call	translator-direct-call
translator	destructuring-command-palette-tsx-431-432	translator-destructured
translator	aliased-import	translator-aliased-import
translator	re-export	translator-re-export
translator	property-access	translator-property-access
translator	parameter-analytic-result-view-tsx-196-205-261-300	translator-arv
translator	assignment-and-reassignment	reassigned-translator
translator	shadowing	shadow-translator
```

## Plan oracle

The command is the sole command oracle committed in `99-53-PLAN.md`. Complete stdout and stderr, verbatim:

```text
identifiers=4 forms=8 rows=32
fixtures drilling a RENAMED TRANSLATOR destructure=11
scanned=66 parameter-bound=8 ctx-object-bound=8
generator-check-exit=0 reproduction-drift-lines=0
corpus-content=86504 corpus-files=125 corpus-add-diff=130539 overhead-per-file=352 task-diff=145847 cap=155000 headroom=9153
```

Exit status: 0.

## Verification and handoff

`npx vitest run scripts/fixtures/dynamic-key-audit/generate-fixtures.test.mjs --reporter=verbose` passes one file and all six acceptance-criterion leaf tests. The reproduction test runs `--check` only inside a copied corpus and compares the entire byte snapshot before and after. It also proves `generality-membership` retains the membership guard while `generality-noproof` uses the guard-free interpolated key. A separate copy test changes a matrix root and proves a rebuild follows the matrix-selected name while removing the old root.

The committed consumer `scripts/i18n-dynamic-key-audit.test.mjs` is expected to remain red because it pins the former 28-row/seven-form matrix and pre-rederivation fixture roots. RULING-P99-345 assigns that rescoping to P99-54; this task did not edit the consumer or shrink the matrix to accommodate it.
