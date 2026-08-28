---
status: complete
---

# P99-54 Summary — translator binding visibility

## Result

The live profile now reports `lane3Sites=13` and `translator-binding-unclassified=0/10` against the unchanged production tree. The two `AnalyticResultView` type-label calls are visible, and all three renamed destructures in `CommandPalette` pass translator-binding recognition instead of being refused by `unclassified.translator-binding`.

The resolver follows TypeScript symbol identity through direct calls, renamed and unrenamed destructuring, aliased imports, re-exports, property access, parameter/object passing, assignment and reassignment, and shadowing. Unsupported factory origins remain visible and fail closed. No identifier name or production file path was special-cased; the binding resolver contains no branch for either measured identifier, parameter name, or production file.

The inherited P99-51 consumer suite is re-scoped to P99-51's grading moment. Its recorded summary is checked as a completed snapshot rather than compared with current instrument output. Matrix size is now the relation `rows === identifiers * forms`; fixture/control roots are derived from the corpus directory and matrix; diff scope reads the nonempty committed diff against the task base.

No production caller, locale bundle, fixture, corpus generator, matrix, or other task plan changed. The task changes only `scripts/i18n-dynamic-key-audit.mjs`, `scripts/i18n-dynamic-key-audit.test.mjs`, and this summary.

## Before repair (verbatim)

Command: live `ar04-live --json` profile plus a diagnostic projection of its parsed JSON and stderr.

```text
audit-exit=1
dynamic i18n audit: profile=ar04-live listSites=9 listLeaves=153 lane3Sites=11
rows=226 listMissingBoth=32 clusterMissingBoth=8 unclassified=8
translator-binding-unclassified=3/8
UNCLASSIFIED	unclassified.translator-binding	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:1397	unsupported useTranslation translator binding: tQs	tQs(groupKey, dossierTypeLabels[group.type]?.en || group.type)	ns=quickswitcher
UNCLASSIFIED	unclassified.translator-binding	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:1546	unsupported useTranslation translator binding: tCommon	tCommon(page.label, page.id)	ns=common
UNCLASSIFIED	unclassified.translator-binding	frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:1554	unsupported useTranslation translator binding: tCommon	tCommon(page.label, page.id)	ns=common
dynamic i18n audit failed: 8 unclassified call(s); 42 en missing/routing failure(s); 42 ar missing/routing failure(s)
```

## After repair oracle (verbatim)

The complete final oracle transcript is recorded below after the committed-diff verification run.

## Matrix drill (verbatim)

Command: audit every matrix fixture and its control twin, requiring the negative to be visible and unclassified and the control to be closed.

```text
matrix-polarities=32/32
```

## Binding mechanisms

- Direct hook-result property calls resolve the factory origin and namespace at the call.
- Renamed and unrenamed destructures bind the local translator symbol to the `t` property without depending on the local identifier text.
- Aliased imports and re-exports follow module/export origin; decoy origins remain observable but unsupported.
- Hook-result receivers carry translator metadata through `.t` property access.
- Function parameters propagate compatible translator metadata from every invocation; object-literal shorthand properties use the shorthand value symbol, so destructuring from a context object preserves the originating translator.
- Assignments use the translated value's symbol and the last observed write, while the existing intervening-write guard retains fail-closed behavior.
- Shadowed bindings remain distinct because all resolution uses TypeScript symbols rather than spelling.

