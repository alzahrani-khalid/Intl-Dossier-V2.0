---
status: complete
---

# P99-35 Summary — mask deletion lane 5

## Outcome

**GREEN.** Every positional fallback and object-form `defaultValue` mask present at task base was
deleted from the fixed 27-file production lane. The scoped strict audit now reports
`twoArgTotal=0`, with `rawKeyTotal=390` as its nonempty positive control. English and Arabic
unresolved totals remain zero, and no fallback-text option survives.

This is the D-06/D-20/D-23/D-24/D-28/D-39 deletion path: the gatekeeper proved bilingual
resolution first; no key or namespace was converted; the literal and object-form populations were
closed separately; every zero has a positive control; and no sibling production file was touched.
A missing key will now be visible as missing in either locale rather than hidden by English copy.

## Re-derived population

The committed strict cross-line population at task base
`c63d97f5b0cc225aba9fd35d5cf23b46c4592b51` was the plan's 233 sites: 211 single-quoted
positional literals and 22 literal-key object defaults. A syntax-level pass deliberately checked
beyond that strict population and found seven additional masks already in the same fixed files:
four double-quoted/template positional strings, two dynamic-key object defaults, and one dynamic
positional value. Thus the complete task-base syntax population was 240 (215 string positional,
24 object defaults, one dynamic positional), and HEAD is zero in all three classes. No outside mask
was adopted and scope was not widened.

Non-mask option objects were retained. The syntax pass reports 29 `t()` option objects at HEAD;
these carry interpolation or namespace options, not fallback text.

## Strict closing controls

Verbatim scoped audit and fallback-option result:

```text
scannedFiles=27
twoArgTotal=0
literalTwoArgTotal=0
optionsDefaultTotal=0
rawKeyTotal=390
twoArgUnresolved=0
rawKeyUnresolved=0
twoArgUnresolvedEn=0
rawKeyUnresolvedEn=0
twoArgUnresolvedAr=0
rawKeyUnresolvedAr=0
nonKeyTotal=0
scoped-files=27 defaultValue-hits=0
```

The committed-range locale and phase negative controls printed:

```text
task-base=c63d97f5b0cc225aba9fd35d5cf23b46c4592b51 i18n-files-changed-by-this-lane=0
TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
negative-control MISS rows=3
```

## Byte identity and spot diff

The syntax comparison checked every production lookup's first-argument source slice, every
`useTranslation()` call, and every import declaration against task base:

```text
files=27 tKeyExpressionsByteIdentical=415 useTranslationCallsByteIdentical=43 importDeclarationsByteIdentical=299
afterIsCharacterSubsequenceOfBaseAfterRequiredUnusedParameterNormalization=true deletedBytes=9399 requiredUnusedParameterRenames=1
source-changed-content-bytes=42105
```

The one normalized identifier is `useIntelligence.ts`'s `data` -> `_data`: deleting the mandated
dynamic success fallback made that callback value unused, and the exact frontend type-check reports
TS6133 unless it is underscore-prefixed. It has no runtime effect. Apart from that type-check-required
identifier, every production file at HEAD is a character subsequence of its task-base bytes.

Representative deletions show byte-identical keys and retained interpolation:

```diff
-      title={t('assignments:waitingQueue.assignmentDetails.title', 'Assignment Details')}
+      title={t('assignments:waitingQueue.assignmentDetails.title')}

-                          {t('form.createNew', 'Create "{{name}}"', { name: searchQuery })}
+                          {t('form.createNew', { name: searchQuery })}

 t('chip.remove', {
   name: chipName,
-  defaultValue: `Remove ${chipName}`,
 })
```

No key string, namespace prefix, translation hook, or import moved. No i18n JSON changed.

## Companion fixture and checks

`DossierPicker.test.tsx` was trigger-positive after `chip.remove` lost its object fallback. Its mock
now resolves the real English and Arabic `work-creation.json` bundles loaded inside the hoisted
factory with `vi.importActual`; expected values come from static top-level JSON imports. The repair
asserts both locale-specific accessible names and asserts that rendered output contains no bare
`chip.remove` key. The other owned companion, `EngagementStageGroup.test.tsx`, remained
byte-unchanged.

Focused test output:

```text
Test Files  2 passed (2)
Tests  13 passed (13)
```

Frontend type-check output:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Process exit: `0`. `git diff --check` produced no output. No lane work is deferred.
