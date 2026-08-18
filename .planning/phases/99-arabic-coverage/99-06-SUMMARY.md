# Phase 99 Plan 06 — drilled glossary census

Status: complete. Evidence was re-derived against unfixed tree `061fdec51`; no source or i18n
bundle was repaired. The legacy `99-02-SUMMARY` wording carried by the pre-recut lane maps to this
task-scoped `99-06-SUMMARY.md`.

## Result

Criterion 1 now has drilled static coverage rather than three spot values. The navigation checker
holds all 13 derived nav/title rows as semantic data and can fail. The glossary census walks every
Arabic JSON leaf and reports all seven ruled rows: dossier, engagement, brief artifact, briefing
session, stance, country, and the distinct intake/waiting queue names. It classifies every
occurrence as `ruled-term`, `allowlisted-sense`, or `UNCLASSIFIED` and never rewrites a bundle.

The base allowlist retains only the ruled senses: file/profile uses of `ملف`, session/stage uses of
`إحاطة`, office/post uses of `منصب`, and the two `دوسييه` brand marks. The
`scripts/glossary-senses.d/` overlay directory exists and accepts additive JSON entries only.

## Strict audit control and live RED

`node scripts/i18n-audit-strict.mjs "$PWD" --self-check` exited 0. Verbatim output:

```text
{
  "selfCheck": "PASS",
  "passed": true,
  "fixture": {
    "twoArgTotal": 9,
    "rawKeyTotal": 1,
    "bindingShapes": {
      "self-check/string-binding.tsx": {
        "string": 1,
        "array": 0,
        "bare": 0,
        "dynamic": 0
      },
      "self-check/array-binding.tsx": {
        "string": 0,
        "array": 1,
        "bare": 0,
        "dynamic": 0
      },
      "self-check/bare-binding.tsx": {
        "string": 1,
        "array": 0,
        "bare": 1,
        "dynamic": 0
      }
    },
    "defectiveBindingDelta": {
      "twoArgSitesReclassified": 2,
      "rawKeySitesReclassified": 0
    }
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

The live comparison was produced by running
`node scripts/i18n-audit-strict.mjs "$PWD" --json`,
`node scripts/i18n-mask-audit.mjs`, and the strict audit scoped to Topbar,
IntelligencePage, and PositionDossierLinker, then extracting the named fields. All three commands
exited 0; the strict audit is observably RED through its nonzero unresolved populations. Verbatim
extraction output:

```text
strict files=1714 masks=543/2082 literal=481/1768 options=62/314 raw=293/6497
strict EN/AR masks=543/543 raw=293/293
strict loose-hidden masks=11 literal=9 raw=3 alias-rescues=1/4
loose literal masks=473/1768 raw=294/6497
frontend/src/components/layout/Topbar.tsx raw=0
frontend/src/components/intelligence/IntelligencePage.tsx raw=0
frontend/src/components/positions/PositionDossierLinker.tsx raw=0
exit strict=0 loose=0 binding-scope=0
```

Thus the corrected model re-derives nine literal two-argument sites hidden by the loose model (and
one alias rescue, explaining the net `481` vs `473`). The corrected raw-key model re-derives three
loose-hidden sites and four alias rescues, explaining the net `293` vs `294`. No historical
raw-key floor is reused. Both locales are checked, and each of the three concrete binding-bug
files contributes zero unresolved raw-key sites.

The committed loose audit remained byte-identical throughout this task:

```text
$ shasum -a 256 scripts/i18n-mask-audit.mjs
70a8aa1dbd92b7c942721f76433acacc170900e65565751709e25b422bb80929  scripts/i18n-mask-audit.mjs
$ git ls-tree HEAD scripts/i18n-mask-audit.mjs
100644 blob 617b02129c22de8344e87783e95548c2c8236edd scripts/i18n-mask-audit.mjs
$ git hash-object scripts/i18n-mask-audit.mjs
617b02129c22de8344e87783e95548c2c8236edd
```

## Navigation control and live RED

`node scripts/nav-title-agreement.mjs "$PWD" --control` exited 0. Verbatim output:

```text
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
```

`node scripts/nav-title-agreement.mjs "$PWD"` exited 1. Verbatim output, including every mismatch
and missing-key row:

```text
nav/title agreement: 7/13 agree; 5 mismatch; 1 missing anchor key; 8 missing navigation locale key
OBJECT-TERM MISMATCH common:navigation.countries="البلدان" countries:title="الدول" ruled=دولة / الدول
OBJECT-TERM MISMATCH common:navigation.engagements="الارتباطات" engagements:title="المشاركات" ruled=مشاركة / المشاركات
OBJECT-TERM MISMATCH common:navigation.persons="الأشخاص" persons:title="جهات الاتصال الرئيسية" ruled=الأشخاص
OBJECT-TERM MISMATCH common:navigation.mous="مذكرات التفاهم" common:mous.title="العنوان" ruled=مذكرات التفاهم
OBJECT-TERM MISMATCH common:navigation.intake="قائمة الاستقبال" intake:queue.title="قائمة الانتظار" ruled=قائمة الاستقبال
MISSING common:navigation.dashboardOverview common:navigation.dashboardOverview=undefined dashboard:title="لوحة الملفات" ruled=دوسيه / الدوسيهات
MISSING-NAV locale=en labelKey common:navigation.dashboardOverview
MISSING-NAV locale=ar labelKey common:navigation.dashboardOverview
MISSING-NAV locale=en tooltipKey common:navigation.workflow
MISSING-NAV locale=ar tooltipKey common:navigation.workflow
MISSING-NAV locale=en labelKey common:navigation.taskQueue
MISSING-NAV locale=ar labelKey common:navigation.taskQueue
MISSING-NAV locale=en labelKey common:navigation.taskEscalations
MISSING-NAV locale=ar labelKey common:navigation.taskEscalations
```

## Glossary control, census, and live RED

`node scripts/glossary-census.mjs "$PWD" --control` exited 0. Verbatim output:

```text
{
  "control": "PASS",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true
}
```

`node scripts/glossary-census.mjs "$PWD" --census` exited 1 and emitted 890 lines, including every
unclassified `file:keypath:value`. Its verbatim census header, every ruled row, and totals were:

```text
glossary census: 16227 Arabic leaf values across 129 file(s)
dossier ruled=دوسيه before=583 after=199 unclassified=490
  دوسيه ruled-term occurrences=199 lines=199 values=199 files=8 ruled=199 allowlisted=0 unclassified=0
  دوسييه competing-term occurrences=2 lines=2 values=2 files=1 ruled=0 allowlisted=2 unclassified=0
  ملف competing-term occurrences=581 lines=558 values=561 files=89 ruled=0 allowlisted=91 unclassified=490
engagement ruled=مشاركة / المشاركات before=173 after=170 unclassified=173
  مشاركة ruled-term occurrences=170 lines=154 values=170 files=50 ruled=170 allowlisted=0 unclassified=0
  ارتباط competing-term occurrences=173 lines=171 values=173 files=33 ruled=0 allowlisted=0 unclassified=173
brief-artifact ruled=ملخص / الملخصات before=194 after=155 unclassified=191
  ملخص ruled-term occurrences=155 lines=154 values=154 files=44 ruled=155 allowlisted=0 unclassified=0
  موجز competing-term occurrences=128 lines=124 values=124 files=28 ruled=0 allowlisted=0 unclassified=128
  إحاطة competing-term occurrences=66 lines=65 values=66 files=17 ruled=0 allowlisted=3 unclassified=63
briefing-session ruled=إحاطة before=0 after=66 unclassified=0
  إحاطة ruled-term occurrences=66 lines=65 values=66 files=17 ruled=66 allowlisted=0 unclassified=0
stance ruled=موقف / المواقف before=53 after=195 unclassified=9
  موقف ruled-term occurrences=195 lines=192 values=192 files=31 ruled=195 allowlisted=0 unclassified=0
  منصب competing-term occurrences=53 lines=53 values=53 files=18 ruled=0 allowlisted=44 unclassified=9
country ruled=الدول before=2 after=57 unclassified=2
  الدول ruled-term occurrences=57 lines=57 values=57 files=24 ruled=57 allowlisted=0 unclassified=0
  البلدان competing-term occurrences=2 lines=2 values=2 files=2 ruled=0 allowlisted=0 unclassified=2
intake-vs-waiting-queue ruled=قائمة الاستقبال / قائمة الانتظار before=0 after=15 unclassified=0
  قائمة الاستقبال ruled-term occurrences=2 lines=2 values=2 files=1 ruled=2 allowlisted=0 unclassified=0
  قائمة الانتظار ruled-term occurrences=13 lines=13 values=13 files=3 ruled=13 allowlisted=0 unclassified=0
classification totals: ruled=857 allowlisted=140 UNCLASSIFIED=865
UNCLASSIFIED glossary occurrences: 865
```

The `ارتباط` line is the required positive control that the walk reaches Arabic values. The first
survivor proves the required diagnostic shape:

```text
UNCLASSIFIED frontend/src/i18n/ar/advanced-search.json:description:البحث في الملفات والمشاركات والمواقف والمستندات مع مرشحات متقدمة term=ملف
```

## Verification and bounded scope

The three `node --check` commands exited 0. The control/live exit summary was:

```text
syntax strict=0 nav=0 glossary=0
exit strict-self=0 nav-control=0 nav-live=1 glossary-control=0 glossary-live=1
```

The full-suite budget was used once with `pnpm test`. It exited 1 before Vitest collection because
Vite tried to create config bundles under the harness-managed, read-only `node_modules` symlink.
The symlink was not modified, deleted, or replaced. The relevant verbatim output was:

```text
agent-runtime:test: failed to load config from .../agent-runtime/vitest.config.ts
intake-backend:test: failed to load config from .../backend/vitest.config.ts
agent-runtime:test: Error: EPERM: operation not permitted, open '.../node_modules/.vite-temp/vitest.config.ts.timestamp-1787091810353-4581c54103377.mjs'
intake-backend:test: Error: EPERM: operation not permitted, open '.../node_modules/.vite-temp/vitest.config.ts.timestamp-1787091810353-861b4341c7a0d.mjs'
Tasks:    3 successful, 5 total
Cached:    3 cached, 5 total
Failed:    agent-runtime#test, intake-backend#test
ELIFECYCLE Test failed. See above for more details.
```

Only the five allowed script artifacts and this summary were in the task population. Relative to
the task start, only this summary required a new edit because the dependency commits had already
landed the instruments. `scripts/i18n-mask-audit.mjs`, all source files, all i18n JSON bundles,
and every other repository path remained unchanged. Later tasks P99-22–24 own nav/title repairs,
P99-25–29 own glossary repairs and additive sense overlays, and P99-39 owns the final green
battery.
