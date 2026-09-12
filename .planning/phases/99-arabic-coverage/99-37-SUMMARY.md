---
status: complete
---

# P99-37 Summary — mask deletion lane 7

## Outcome

**GREEN.** All 192 fallback masks present at this task's base were deleted from the fixed 14-file
lane. The scoped strict parser now reports `twoArgTotal=0` with `rawKeyTotal=351` as its positive
control, every English and Arabic unresolved counter remains zero, and no object-form fallback-text
option survives.

This is the deletion-only D-06/D-20/D-23/D-24/D-28/D-39 path: P99-50 proved bilingual resolution
before this lane ran; no key conversion was performed; literal and object-form populations remained
separate; every zero has a nonempty control; and no sibling-lane file was touched. Missing keys will
therefore render as missing in either locale, while the gatekeeper's proven missing-key population is
empty today.

## Re-derived population and manifest reconciliation

The plan recorded 197 sites at snapshot `9ffa2b80c`: 187 positional literal defaults and 10
literal-key object-form `defaultValue` options. The cross-line/AST census was re-run rather than
re-quoting that floor. At task base `ee702715d87e8721b00b401f35810a6999a81a03`, the same fixed paths
contained 182 positional literals in 11 files and 10 object defaults in 3 files, for 192 sites in 13
files. The five-site difference is entirely the allowed `routes/__root.tsx`, whose prerequisite 404
binding repair had already changed `5 -> 0`; no mask moved to or appeared in an outside file.

The object-form fallback class remains a separate population from the literal class: the committed
repo-wide planning census found 314 sites across 103 files, including 88 files with no literal-class
site. This lane consumes only its fixed slice of both populations; it does not repeat the original
161-file literal-only scope error.

Command (the inline Node command parsed every `t()` call in each ref with
`@typescript-eslint/typescript-estree` and printed the separate classes):

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; S="<the 14 comma-separated plan paths>"; node --input-type=module - "$R" "$S" <<'NODE'
// scan 9ffa2b80c, task base, and HEAD; count literal second arguments,
// object expressions with defaultValue, interpolation-only objects, files, and t() calls
NODE
```

Verbatim output:

```text
plan-snapshot=9ffa2b80c literal=187/12files optionsDefault=10/3files union=197/14files
task-base=ee702715d87e8721b00b401f35810a6999a81a03 literal=182/11files optionsDefault=10/3files union=192/13files interpolationOptions=5/2files tCalls=364
reconciled-prerequisite-change frontend/src/routes/__root.tsx: 5->0
HEAD literal=0/0files optionsDefault=0/0files union=0/0files interpolationOptions=6/3files tCalls=364
```

The final interpolation count rises from five to six because the sole three-argument mask became
`t('approvals.stageOf', { current, total })`. Those six objects are interpolation/count options, not
masks, and were deliberately retained.

## Closing register and controls

Command (full strict register over the exact plan scope):

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; S="<the 14 comma-separated plan paths>"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --scope "$S" --json | node -e '<print closing fields>'
```

Verbatim output:

```text
scannedFiles=14
twoArgTotal=0
literalTwoArgTotal=0
optionsDefaultTotal=0
rawKeyTotal=351
twoArgUnresolved=0
literalTwoArgUnresolved=0
optionsDefaultUnresolved=0
rawKeyUnresolved=0
twoArgUnresolvedEn=0
twoArgUnresolvedAr=0
rawKeyUnresolvedEn=0
rawKeyUnresolvedAr=0
nonKeyTotal=0
```

The first exact plan oracle asserted strict zero plus the nonempty raw-key control, verified all 14
files were readable, and searched the scoped files for fallback text:

```text
scoped-files=14 defaultValue-hits=0
```

The second exact plan oracle derived the run base, checked the committed locale range, asserted the
unresolved register, and counted the independent negative control:

```text
task-base=ee702715d87e8721b00b401f35810a6999a81a03 i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

The underlying negative-control command and verbatim output were:

```sh
PATH="/opt/homebrew/bin:$PATH"; node scripts/neg-taskcard.mjs "$PWD"
```

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

## Byte identity, spot diff, and scope

An AST comparison against task base checked every first-argument source slice, complete
`useTranslation()` call, and import declaration. A separate character-subsequence check proves the
source range contains deletions only, not replacement text:

```text
files=14 tKeyExpressionsByteIdentical=364 useTranslationCallsByteIdentical=19 importDeclarationsByteIdentical=206
afterIsCharacterSubsequenceOfBase=true deletedBytes=4791
```

Representative positional, object-form, and interpolation-preserving deletions:

```diff
-{t('trackingType.delivery', 'Delivery')}
+{t('trackingType.delivery')}

-{t('common:actions.refresh', { defaultValue: 'Refresh' })}
+{t('common:actions.refresh')}

-{t('approvals.stageOf', 'Stage {{current}} of {{total}}', {
+{t('approvals.stageOf', {
   current: position.current_stage,
   total: position.approval_chain_config?.stages?.length || 0,
 })}
```

The sample and the full 364-call comparison show that key bytes and namespace prefixes were
untouched. Hooks and imports are byte-identical; the `current` and `total` interpolation options
remain.

Committed-range scope command results:

```text
source-logic-diff-bytes=37598
source-paths-changed=13
i18n-json-paths-changed=0
out-of-scope-paths=0
```

The actual `git diff -U0` source measurement is below both the lane's approximately 45,000-byte
budget and the engine's 60,000-byte cap. The plan's approximately 31,362-byte multi-line estimate was
explicitly a floor; the committed source range measures 37,598 bytes and remains safely within both
limits. `git diff --check` produced no output. Thirteen paths changed because the fourteenth,
`routes/__root.tsx`, had no remaining task-base mask after reconciliation.

Frontend type-check command and verbatim output:

```sh
npm --prefix frontend run type-check
```

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

Process exit: `0`.

No lane work is left for a later part. Test files and every sibling deletion lane remain outside this
fixed allowlist. The wholesale dot-to-colon conversion remains D-21's no-ship and belongs to Phase
102, not this lane.
