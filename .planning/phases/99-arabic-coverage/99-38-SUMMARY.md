---
status: complete
---

# P99-38 Summary — mask deletion lane 8

## Outcome

GREEN. The fixed 25-file lane contained the planned 271 strict masks (251 positional literals and
20 literal-key `defaultValue` options), all bilingual-resolved. Those masks were deleted. The
independent fallback diagnostic also exposed three resolved dynamic-key `defaultValue` options in
the same owned files; they were deleted without widening scope. The strict close is
`twoArgTotal=0`, its positive control is `rawKeyTotal=376`, and no fallback-text option survives.

This is D-06/D-20/D-23/D-24/D-28/D-39: P99-50 gated the deletion on bilingual resolution; no
binding conversion was performed; the literal and object populations stayed distinct; every zero
has a control; and no sibling file changed. Missing keys now render missing in either locale, while
the gatekeeper proved that missing population empty.

## Population and reconciliation

The cross-line AST census was run over the exact plan scope at snapshot `9ffa2b80c` and task base:

```text
plan-snapshot=9ffa2b80c sites=271 files=25
task-base=122f9e2f488e52416723c2531526bc3af8de74d6 sites=271 files=25
```

Task-base strict register (command: `node scripts/i18n-audit-strict.mjs "$PWD" --scope "$S" --json`):

```text
scannedFiles=25
twoArgTotal=271
literalTwoArgTotal=251
optionsDefaultTotal=20
rawKeyTotal=131
twoArgUnresolved=0
rawKeyUnresolved=0
twoArgUnresolvedEn=0
twoArgUnresolvedAr=0
rawKeyUnresolvedEn=0
rawKeyUnresolvedAr=0
nonKeyTotal=0
```

Eight prerequisite repairs changed dot-form keys to their resolved colon forms before P99-50, but
kept all 271 sites inside the same files. No site appeared outside this lane. The exact plan
fallback diagnostic initially printed the following additional, inside-lane population:

```text
FAIL: defaultValue fallback survives in the scoped set:
.../dossiers/forums/index.tsx:176:        statusLabel: t(`forums:status.${status}`, { defaultValue: status }),
.../dossiers/topics/-TopicsListPage.tsx:134:          statusLabel: t(`topics:status.${status}`, { defaultValue: status }),
.../dossiers/working_groups/index.tsx:149:        statusLabel: t(`working-groups:status.${statusKey}`, { defaultValue: statusKey }),
```

The deletion command then reported:

```text
rebuilt-from-task-base positional=251 optionsDefault=23 total=274 deletedBytes=7492
```

## Closing evidence

Full scoped strict register:

```text
scannedFiles=25
twoArgTotal=0
literalTwoArgTotal=0
optionsDefaultTotal=0
rawKeyTotal=376
nonKeyTotal=0
twoArgUnresolved=0
literalTwoArgUnresolved=0
optionsDefaultUnresolved=0
rawKeyUnresolved=0
twoArgUnresolvedEn=0
twoArgUnresolvedAr=0
rawKeyUnresolvedEn=0
rawKeyUnresolvedAr=0
```

The strict instrument self-check printed `"selfCheck": "PASS"` with every listed check `true`.
The first exact plan oracle then printed:

```text
scoped-files=25 defaultValue-hits=0
```

The second exact plan oracle printed:

```text
task-base=122f9e2f488e52416723c2531526bc3af8de74d6 i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

Its underlying negative control printed `MISS=true` for `priority.low`, `status.in_progress`, and
`work_item.task`, then resolved the positive contrast `assignments:priority.low` to `"Low"`.

Byte-invariant AST comparison against task base:

```text
files=25 tKeyExpressionsByteIdentical=415 useTranslationCallsByteIdentical=30 importDeclarationsByteIdentical=346 remainingOptionPropertiesByteIdentical=7
afterIsCharacterSubsequenceOfBase=true deletedBytes=7492 survivingAstMasks=0
```

Representative spot diff (positional, interpolation-preserving, object, and dynamic object):

```diff
-t('period.permanent', 'Permanent')
+t('period.permanent')
-t('ai.errors.retryAfter', 'Try again in {{seconds}} seconds', {
+t('ai.errors.retryAfter', {
-t('edit.title', { name: displayName, defaultValue: 'Edit dossier' })
+t('edit.title', { name: displayName })
-t(`forums:status.${status}`, { defaultValue: status })
+t(`forums:status.${status}`)
```

Keys, namespace prefixes, hooks, imports, and every remaining option are byte-untouched; the whole
source result is a character-subsequence of task base, so the diff adds no source byte. Scope and
budget commands printed `source-patch-bytes=54693`, `source-paths-changed=25`,
`i18n-json-paths-changed=0`, `out-of-scope-paths=0`; `git diff --check` printed nothing. The actual
source patch is 54,693 bytes and the combined task patch is 59,783, below the 60,000-byte cap; the
plan's ~44,736 estimate was explicitly a floor.

Frontend type-check:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

No lane work remains. The wholesale dot-to-colon conversion remains D-21's Phase 102 no-ship.
