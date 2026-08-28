---
status: complete
---

# P99-07 summary — common.json flatten state and census repair

## Outcome

The locale flatten and route rewrite landed in ancestor `be5a02c4604507637c0ac19fa2936f2e602c86cd`; this recut does not claim to deliver or re-prove that historical atomicity. `git merge-base --is-ancestor be5a02c46 HEAD` exited 0 at dispatch. Both current locale trees were already flat, so their state oracles are keep-true regression guards, not changed-hunk evidence.

This pass supplies the discriminating changed hunk in `scripts/i18n-binding-census.mjs`:

- ordinary `--json` operation no longer requires a caller-provided base and discovers the frozen pre-flatten universe through committed `common.json` history; the selected immutable commit remains explicit as `universeSourceRef`;
- legacy `--base <ref>` remains supported for already-landed historical gates, while the P99-07 acceptance oracle uses no base and never derives `HEAD^`;
- historical sources resolve with `historicalConfig`, while working-tree sources resolve with `currentConfig`;
- `commonNamespaceCalls` is the resolution-gated current-tree call population and `commonCandidateCalls` is the separate resolution-independent current-tree candidate population;
- `blind.propertyAccessNonLiteralKey` completes the real inclusion-exclusion identity. The existing misleading `blind.*.sites` field name is retained for compatibility even though `pair()` stores call counts there; renaming it remains out of scope and unqueued;
- the historical red control first proves it can detect a planted scalar-over-object collision, then requires exactly `error:string/object` and `search:string/object` in each locale, including the real localized nested scalar values and object-typed roots. It does not use the tautological fact that `preFlattenUniverse` selected a ref containing `common`.

No locale bundle, production caller, or fixture changed in this pass.

## Plan oracles

The three `must_haves` commands were loaded from `99-07-PLAN.md` and executed verbatim. Their terminal results were:

```text
ORACLE 1
FLATTEN-TYPE-OK
ORACLE 1 PASS

ORACLE 2
{
  "ok": true,
  "positives": 9,
  "controls": [
    {
      "name": "later-common",
      "passed": true
    },
    {
      "name": "scalar-shadow",
      "passed": true
    },
    {
      "name": "object-shadow",
      "passed": true
    },
    {
      "name": "locale-divergent",
      "passed": true
    },
    {
      "name": "dynamic-array",
      "passed": true
    },
    {
      "name": "property-access",
      "passed": true
    },
    {
      "name": "non-literal",
      "passed": true
    }
  ],
  "universeSourceRef": "750ef16c3a001a0f542982ba879d8f8f18a1cb63",
  "localeDivergent": [
    {
      "file": "scripts/fixtures/i18n-binding-census-controls.tsx",
      "line": 97,
      "key": "common.close",
      "resolutions": {
        "en": {
          "namespace": "census-locale",
          "defined": true,
          "objectReturn": false
        },
        "ar": {
          "namespace": "translation",
          "defined": true,
          "objectReturn": false
        }
      }
    }
  ]
}
blind populations: dynamicNamespace=274/27 nonLiteralKey=729/297 propertyAccess=0/0 union=963/305
census identities OK: literal=8596 nonLiteral=729 dynamic=234 blindUnion=963 (DIAGNOSTICS; asserted as IDENTITIES, not floors)
CENSUS-RELATION-OK gated=1112 calls candidates=1130 calls blindUnion=963 sites lower=473 sites
ORACLE 2 PASS

ORACLE 3
ORACLE 3 PASS
```

The self-check's complete named result was:

```text
ok=true positives=9
later-common=true
scalar-shadow=true
object-shadow=true
locale-divergent=true
dynamic-array=true
property-access=true
non-literal=true
universeSourceRef=750ef16c3a001a0f542982ba879d8f8f18a1cb63
```

That covers first-defined namespace lookup, scalar and object shadows, static-prefix precedence, locale divergence, and exclusion of dynamic namespaces, property-access translators, and non-literal keys from resolved partitions.

## Census evidence

Command:

```sh
node scripts/i18n-binding-census.mjs "$PWD" --json
```

Exit status was 0. Selected JSON fields, transcribed verbatim:

```json
{
  "scannedFiles": 1716,
  "parsedFiles": 746,
  "literalKeyCalls": 8596,
  "nonLiteralKeyCalls": 729,
  "commonNamespaceCalls": 1112,
  "commonCandidateCalls": 1130,
  "universeSourceRef": "750ef16c3a001a0f542982ba879d8f8f18a1cb63",
  "governed": { "sites": 213, "files": 102 },
  "blind": {
    "dynamicNamespace": { "sites": 274, "files": 27 },
    "dynamicNamespaceLiteralKey": { "sites": 234, "files": 25 },
    "dynamicNamespaceNonLiteralKey": { "sites": 40, "files": 16 },
    "nonLiteralKey": { "sites": 729, "files": 297 },
    "propertyAccess": { "sites": 0, "files": 0 },
    "propertyAccessNonLiteralKey": { "sites": 0, "files": 0 },
    "union": { "sites": 963, "files": 305 }
  },
  "unrepointed": [],
  "doublePrefixed": 0,
  "checks": {
    "blindInclusionExclusion": true,
    "flattenGuardTypeClashesAtUniverseRef": true
  }
}
```

The complete surviving blind identity is `729 + 274 + 0 - 40 - 0 = 963`. The two former field-to-partition checks were not restored because each compared the same array expression with itself and could never fail. The research-derived `473` value is a site-count floor only; it is not equated with or combined arithmetically with a call count. `1112 <= 1130` is only the explicitly non-discriminating naming sanity check.

The instrument's historical collision report was:

```text
positiveControl=x:string/object
en clashes=error:string/object,search:string/object nestedError="Error" nestedSearch="Search" rootErrorType=object rootSearchType=object passed=true
ar clashes=error:string/object,search:string/object nestedError="خطأ" nestedSearch="بحث" rootErrorType=object rootSearchType=object passed=true
```

## Locale and resolution state — keep-true guards

The type-aware current-tree oracle printed:

```text
FLATTEN-TYPE-OK
```

The six-key real-i18next probe, with fallback disabled, printed:

```text
en {"common:all":"All","common:notFound.title":"Page Not Found","common:error.label":"Error","common:search.label":"Search","common:error.failedToLoadData":"Failed to load data","common:search.placeholder":"Search dossiers, documents, people..."}
ar {"common:all":"الكل","common:notFound.title":"الصفحة غير موجودة","common:error.label":"خطأ","common:search.label":"بحث","common:error.failedToLoadData":"فشل تحميل البيانات","common:search.placeholder":"البحث في الدوسيهات والمستندات والأشخاص..."}
```

`node scripts/resolve-check.mjs "$PWD"` retained both polarities and ended with:

```text
CONTROL negative: t('sourceType.__not_a_real_member__') -> "sourceType.__not_a_real_member__" ; detected-as-miss=true
CONTROL positive: t('sourceType.human_entered') -> "Human entered" ; detected-as-miss=false
214 lookups across 11 routings x 2 locales — routings with a miss: 0
```

`node scripts/neg-taskcard.mjs "$PWD"` retained exactly three negative-control rows:

```text
TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
```

These tree and resolution probes were green at the task base. They remain falsifiable keep-true guards, but are not evidence that this pass delivered the census repair.

## Static verification and residual

```text
node --check scripts/i18n-binding-census.mjs
exit 0

pnpm --dir frontend type-check
> tsc --noEmit
exit 0

git diff --check
exit 0
```

The exact accounting checks do not detect a uniform proportional under-walk in which all populations shrink together while their relationships still balance. This is the named residual; no frozen moving-population floors were restored.
