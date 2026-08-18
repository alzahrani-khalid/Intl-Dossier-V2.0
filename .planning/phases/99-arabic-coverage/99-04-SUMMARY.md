# Phase 99 Plan 04 — strict static instruments

**Status:** complete

**Tree measured:** `654215443` (functional instrument tip before this summary)

**Implementation commits:**

- `fed70fd3a feat(i18n): add canonical strict binding audit`
- `257b950e7 feat(i18n): add semantic static instruments`
- `42bd796ee fix(i18n): count options defaults as masks`
- `654215443 fix(i18n): preserve complete instrument output`

## What landed

- `scripts/lib/i18n-binding.mjs` is the single namespace-binding implementation. It parses named,
  full array, and bare `useTranslation` calls while ignoring comments and string literals.
  `scripts/i18n-audit-strict.mjs` and the committed `scripts/i18n-mask-audit.mjs` both import it;
  neither carries a second namespace resolver.
- The strict audit models the shipped resources: no `fallbackNS`, no configured `defaultNS`, and
  the built-in `translation` namespace aliased to `common`. It checks `en` and `ar`, accepts
  comma-separated `--scope` prefixes, rejects a scope matching zero source files, and emits the
  complete unresolved-site population as JSON.
- `twoArgTotal` is the full silent-mask denominator. It includes the held literal-string detector
  population (`1768`) and 314 options-object `defaultValue` masks. Separate
  `literalTwoArgTotal`/`optionsDefaultTotal` fields preserve those detection populations.
- The embedded fixture contains the required one-line and wrapped literal controls. Its three
  binding fixtures prove a string binding resolves only through its named namespace, an array
  consults its second namespace, and a bare binding resolves through `translation`. It also drills
  both locales, loose/strict polarity, the alias, raw-key polarity, and an options-object mask.
- `scripts/nav-title-agreement.mjs` contains exactly the 13 derived research rows and applies the
  ruled object-term semantics instead of byte equality. `scripts/glossary-census.mjs` classifies
  every decoded Arabic occurrence in the dossier, engagement, brief, and position families as
  `ruled-term`, `allowlisted-sense`, or `UNCLASSIFIED`. The base sense file seeds only the ruled
  profile/file, briefing-session, office/post, and two brand-mark exceptions; overlays can add but
  cannot replace entries.
- Both live RED reporters assign `process.exitCode` only after writing their reports, preserving
  complete JSON and site populations through pipes.

This covers D-04 (runtime derivations below), D-06 (three planted/positive controls), D-08 (all
three live instruments observed RED on the unfixed tree), D-10 (shipped candidate model), D-17
and D-18 (sense-aware classification), and D-22 (strict/loose discrimination under the corrected
binding model).

## Verification record

### Syntax, formatting, and controls

Command:

```sh
node --check scripts/lib/i18n-binding.mjs && node --check scripts/i18n-audit-strict.mjs && node --check scripts/i18n-mask-audit.mjs && node --check scripts/nav-title-agreement.mjs && node --check scripts/glossary-census.mjs
```

Output:

```text
exit 0
```

Command: `pnpm exec prettier --check scripts/i18n-audit-strict.mjs scripts/i18n-mask-audit.mjs scripts/lib/i18n-binding.mjs scripts/nav-title-agreement.mjs scripts/glossary-census.mjs scripts/glossary-senses.json`

```text
Checking formatting...
All matched files use Prettier code style!
```

Command: `node scripts/i18n-audit-strict.mjs "$PWD" --self-check`

```json
{
  "selfCheck": "PASS",
  "passed": true,
  "fixture": {
    "twoArgTotal": 9,
    "rawKeyTotal": 1,
    "bindingShapes": {
      "self-check/string-binding.tsx": { "string": 1, "array": 0, "bare": 0, "dynamic": 0 },
      "self-check/array-binding.tsx": { "string": 0, "array": 1, "bare": 0, "dynamic": 0 },
      "self-check/bare-binding.tsx": { "string": 1, "array": 0, "bare": 1, "dynamic": 0 }
    },
    "defectiveBindingDelta": { "twoArgSitesReclassified": 2, "rawKeySitesReclassified": 0 }
  },
  "checks": {
    "oneLinePositiveControl": true,
    "wrappedPositiveControl": true,
    "stringBindingShape": true,
    "arrayBindingConsultsEveryNamespace": true,
    "bareBindingUsesTranslation": true,
    "strictFlagsLooseTwoArg": true,
    "strictFlagsLooseRawKey": true,
    "translationCommonAlias": true,
    "englishLocaleChecked": true,
    "arabicLocaleChecked": true,
    "everyMaskSiteCounted": true,
    "optionsDefaultMaskCounted": true,
    "defectiveModelVisiblyReclassified": true
  }
}
```

Commands and verbatim outputs for the other controls:

```text
$ node scripts/nav-title-agreement.mjs "$PWD" --control
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
$ node scripts/glossary-census.mjs "$PWD" --control
{
  "control": "PASS",
  "plantedBannedOccurrenceCaught": true,
  "ruledTermPreserved": true
}
```

The live JSON transport checks consume the reporters through pipes, proving the nonzero RED exit
status does not truncate their machine-readable populations:

```text
nav-live-red: PASS 7 5 1
glossary-live-red: PASS 4 863
```

The repository ESLint project service does not include root `scripts/*.mjs`; a targeted lint
invocation therefore reported the same configuration-level error for all five JavaScript files:

```text
Parsing error: ... was not found by the project service. Consider either including it in the
tsconfig.json or including it in allowDefaultProject
```

No lint configuration was changed because every such path is outside this task's allowlist.
Syntax checks, Prettier, embedded controls, and the executable acceptance oracle all pass.

### Strict live RED population and binding correction

Command: `node scripts/i18n-audit-strict.mjs "$PWD" --json`, reduced only to population fields;
the command's JSON retains the complete site list.

```json
{
  "scannedFiles": 1714,
  "twoArgTotal": 2082,
  "literalTwoArgTotal": 1768,
  "optionsDefaultTotal": 314,
  "rawKeyTotal": 6497,
  "twoArgUnresolved": 543,
  "literalTwoArgUnresolved": 481,
  "optionsDefaultUnresolved": 62,
  "rawKeyUnresolved": 293,
  "twoArgUnresolvedEn": 543,
  "twoArgUnresolvedAr": 543,
  "rawKeyUnresolvedEn": 293,
  "rawKeyUnresolvedAr": 293,
  "looseModelDelta": {
    "twoArgHiddenSites": 11,
    "literalTwoArgHiddenSites": 9,
    "rawKeyHiddenSites": 3,
    "twoArgRescuedByAlias": 1,
    "rawKeyRescuedByAlias": 4
  },
  "defectiveBindingDelta": {
    "twoArgSitesReclassified": 1,
    "rawKeySitesReclassified": 42
  },
  "bindingModel": {
    "measuredSyntaxFiles": 666,
    "arrayFirstOnlyFiles": 47,
    "bareUnmatchedFiles": 111,
    "defectiveShapeFiles": 158,
    "canonicalParsedFiles": 663,
    "canonicalStringFiles": 513,
    "canonicalArrayFiles": 46,
    "canonicalBareFiles": 111
  }
}
```

The freshly re-derived `42` above is the number of raw-key sites whose classification changes
between the defective and canonical binding models; it is not the retracted loose/strict target.
The corrected D-22 raw loose/strict discriminator is 3 hidden sites with 4 alias rescues.

The historical `666`/`47` syntax populations visibly remain in the report, but the canonical
parser correctly identifies 663 real call files and 46 real array-binding files. The three
syntax-only matches are two test comments/mock property declarations and the
`frontend/src/i18n/index.ts` comment containing `useTranslation([...])`. This states what falls
outside each population instead of treating comments as bindings.

Command: `node scripts/i18n-mask-audit.mjs`, reduced to corresponding loose fields.

```json
{
  "total_two_arg_sites": 1768,
  "total_one_arg_sites": 6497,
  "binding_model": {
    "resolver": "scripts/lib/i18n-binding.mjs",
    "files_with_bindings": 663,
    "array_binding_files": 46,
    "bare_binding_files": 111,
    "array_namespaces_recovered": 44,
    "bare_calls_recovered": 128
  },
  "namespace_aware": { "sites": 473, "distinct_keys": 410, "pct": "26.8" },
  "one_arg_raw_key": {
    "sites": 294,
    "distinct_keys": 267,
    "pct": "4.5",
    "by_shape": { "one-arg": 242, "options-no-default": 52 }
  }
}
```

For the shared literal population, strict is 481 versus loose 473: 9 misses are hidden by the
loose `common` candidate and 1 is rescued by the shipped alias. For raw keys, strict is 293 versus
loose 294: 3 are hidden by loose resolution and 4 are rescued by the alias. These are runtime
derivations under the canonical binding parser, not carried targets.

### Acceptance scope and empty-scope controls

The exact plan oracle completed with:

```text
acceptance oracle exit 0
```

The named scope returned:

```json
{
  "scannedFiles": 3,
  "twoArgTotal": 1,
  "literalTwoArgTotal": 0,
  "optionsDefaultTotal": 1,
  "rawKeyTotal": 58,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "defectiveBindingDelta": {
    "twoArgSitesReclassified": 1,
    "rawKeySitesReclassified": 39
  }
}
```

The zero-match scope returned nonzero with:

```json
{
  "error": "scope matched zero source files",
  "scope": ["frontend/src/__scope_matches_nothing__/"],
  "scannedFiles": 0
}
```

```text
empty-scope exit 1
```

### Navigation live RED

Command: `node scripts/nav-title-agreement.mjs "$PWD"` (expected exit 1).

```text
nav/title agreement: 7/13 agree; 5 mismatch; 1 missing key
OBJECT-TERM MISMATCH common:navigation.countries="البلدان" countries:title="الدول" ruled=دولة / الدول
OBJECT-TERM MISMATCH common:navigation.engagements="الارتباطات" engagements:title="المشاركات" ruled=مشاركة / المشاركات
OBJECT-TERM MISMATCH common:navigation.persons="الأشخاص" persons:title="جهات الاتصال الرئيسية" ruled=الأشخاص
OBJECT-TERM MISMATCH common:navigation.mous="مذكرات التفاهم" common:mous.title="العنوان" ruled=مذكرات التفاهم
OBJECT-TERM MISMATCH common:navigation.intake="قائمة الاستقبال" intake:queue.title="قائمة الانتظار" ruled=قائمة الاستقبال
MISSING common:navigation.dashboardOverview common:navigation.dashboardOverview=undefined dashboard:title="لوحة الملفات" ruled=دوسيه / الدوسيهات
nav exit 1
```

Positions is conformant under the ruled object-term semantics; the semantic RED set is five
mismatches and one missing anchor.

### Glossary live RED census

Command: `node scripts/glossary-census.mjs "$PWD" --census` (expected exit 1). The command printed
all 863 `namespace:keyPath:value` records; its complete per-row census output is:

```text
glossary census: 16227 Arabic leaf values scanned
dossier ruled=دوسيه
  دوسيه ruled-term occurrences=199 lines=199 values=199 files=8 ruled=199 allowlisted=0 unclassified=0
  دوسييه competing-term occurrences=2 lines=2 values=2 files=1 ruled=0 allowlisted=2 unclassified=0
  ملف competing-term occurrences=581 lines=558 values=561 files=89 ruled=0 allowlisted=91 unclassified=490
engagement ruled=مشاركة / المشاركات
  مشارك ruled-term occurrences=255 lines=235 values=251 files=60 ruled=255 allowlisted=0 unclassified=0
  ارتباط competing-term occurrences=173 lines=171 values=173 files=33 ruled=0 allowlisted=0 unclassified=173
brief-artifact ruled=ملخص / الملخصات
  ملخص ruled-term occurrences=155 lines=154 values=154 files=44 ruled=155 allowlisted=0 unclassified=0
  موجز competing-term occurrences=128 lines=124 values=124 files=28 ruled=0 allowlisted=0 unclassified=128
  إحاطة competing-term occurrences=66 lines=65 values=66 files=17 ruled=0 allowlisted=3 unclassified=63
position-as-stance ruled=موقف / المواقف
  موقف ruled-term occurrences=108 lines=108 values=108 files=22 ruled=108 allowlisted=0 unclassified=0
  مواقف ruled-term occurrences=87 lines=85 values=85 files=20 ruled=87 allowlisted=0 unclassified=0
  منصب competing-term occurrences=53 lines=53 values=53 files=18 ruled=0 allowlisted=44 unclassified=9
classification totals: ruled=804 allowlisted=140 UNCLASSIFIED=863
glossary exit 1
```

The decoded-leaf population is deliberately larger than raw source grep where JSON escapes occur.
The raw source occurrence/line/file populations were independently re-derived with
`/usr/bin/grep -rho`, `/usr/bin/grep -rh`, and `/usr/bin/grep -rl` over `ar/*.json`:

```text
ارتباط 171/171/32
موجز 128/124/28
إحاطة 65/65/16
منصب 53/53/18
مشارك 239/235/58
ملف 578/558/87
دوسيه 199/199/8
دوسييه 2/2/1
الملف الشخصي 11/11/6
تطوير المنصب 1/1/1
قائمة الانتظار 13/13/3
قائمة الاستقبال 2/2/1
```

### Repository suite

Command: `pnpm test` (the single full-suite attempt required by the harness).

```text
• Packages in scope: agent-runtime, intake-backend, intake-frontend
• Running test in 3 packages
agent-runtime:test: failed to load config from .../agent-runtime/vitest.config.ts
agent-runtime:test: Error: EPERM: operation not permitted, open '.../node_modules/.vite-temp/vitest.config.ts.timestamp-1787089191425-611c6a43d7132.mjs'
Tasks:    3 successful, 5 total
Cached:   3 cached, 5 total
Time:     565ms
Failed:   agent-runtime#test
ELIFECYCLE Test failed.
```

The failure occurs before any test collection because Vite tries to write a transient config
through the harness-provisioned `node_modules` symlink into the main repository, which is
read-only from this isolated worktree. The worktree contract explicitly forbids modifying,
deleting, or replacing that link, so no workaround was attempted. The cached build tasks passed;
the task-specific syntax, formatting, controls, live RED reporters, JSON transport checks, and
exact acceptance oracle all completed independently.

## Scope and later owners

The final diff contains only the seven allowlisted instrument/config paths plus this summary. No
source file, locale bundle, test file, or `node_modules` path changed.

- P99-08 through P99-19 repair and verify the strict unresolved populations.
- P99-22 through P99-24 extend the nav walk and repair the ruled anchor pairs.
- P99-25 through P99-29 classify/rewrite glossary occurrences or add reasoned lane overlays.
- P99-30 through P99-38 own deletion of every literal and `defaultValue` mask after resolution is
  proven; the strict `twoArgTotal` closing predicate remains RED until both shapes reach zero.
- P99-39 owns the fresh repo-wide closing battery.
