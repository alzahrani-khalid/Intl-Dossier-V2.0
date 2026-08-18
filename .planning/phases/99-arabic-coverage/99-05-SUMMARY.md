# Phase 99 Plan 05 — nav-title and glossary instruments

Status: complete. Instrument commit: `5da42e5e3`.

## Result

The nav-title checker now keeps the 13 derived semantic rows as data, resolves their Arabic
anchors, and re-derives every `labelKey`/`tooltipKey` declaration from `navigationData.ts` against
both locale copies of `common.json`. Its control catches one planted disagreement while the live
unfixed tree remains RED and lists every disagreement and missing locale key.

The read-only glossary census now enumerates all seven ruled rows: dossier, engagement,
brief-artifact, briefing-session, stance, country, and the distinct intake/waiting queue names. It
walks all Arabic JSON leaves, merges the base sense rulings with file-disjoint overlays, accepts
exact overlay rows as `{term,file,keyPath,sense,reason}`, supports `--row` and overlay-declared
`--slice`, prints per-row before/after populations, and emits each survivor as
`file:keypath:value`. Its control specifically plants an unallowlisted `دوسييه` occurrence.

The base allowlist and empty overlay directory inherited from P99-04 were re-verified: profile and
file/attachment senses for `ملف`, session/stage senses for `إحاطة`, office/post senses for `منصب`,
and the two ruled `دوسييه` brand marks remain present. No translation file was rewritten.

## Recorded verification

`node --check scripts/nav-title-agreement.mjs`,
`node --check scripts/glossary-census.mjs`, and
`pnpm exec prettier --check scripts/nav-title-agreement.mjs scripts/glossary-census.mjs scripts/glossary-senses.json`
all exited 0. Prettier printed:

```text
Checking formatting...
All matched files use Prettier code style!
```

The inherited strict instrument stayed drilled. `node scripts/i18n-audit-strict.mjs "$PWD"
--self-check` exited 0 with `PASS` across 13 checks. The final strict/loose extraction printed:

```text
strict masks=543/2082 literal=481/1768 options=62/314 raw=293/6497
loose-hidden masks=11 literal=9 raw=3; alias-rescues=1/4
frontend/src/components/layout/Topbar.tsx raw=0
frontend/src/components/intelligence/IntelligencePage.tsx raw=0
frontend/src/components/positions/PositionDossierLinker.tsx raw=0
loose literal masks=473/1768; raw=294/6497
```

The nine literal two-argument misses hidden by the loose model were re-derived, not hardcoded. The
raw-key loose delta re-derived as 3 under the canonical binding resolver; no retracted historical
target was used.

### Nav control and live RED

`node scripts/nav-title-agreement.mjs "$PWD" --control` exited 0:

```text
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
```

`node scripts/nav-title-agreement.mjs "$PWD"` exited 1, as required on the unfixed tree:

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

### Glossary control, census, and slice

`node scripts/glossary-census.mjs "$PWD" --control` exited 0:

```text
{
  "control": "PASS",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true
}
```

`node scripts/glossary-census.mjs "$PWD" --census` exited 1 and printed the complete 865-survivor
population. Its verbatim per-row census was:

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
```

The first survivor demonstrates the required output shape:

```text
UNCLASSIFIED frontend/src/i18n/ar/advanced-search.json:description:البحث في الملفات والمشاركات والمواقف والمستندات term=ملف
```

`node scripts/glossary-census.mjs "$PWD" --row country --slice
/tmp/p99-05-glossary-slice.json --census` used an overlay declaring only `common.json`; it exited 1
and proved the scoped population rather than making a repository-wide claim:

```text
glossary census: 1221 Arabic leaf values across 1 file(s)
country ruled=الدول before=1 after=0 unclassified=1
classification totals: ruled=0 allowlisted=0 UNCLASSIFIED=1
UNCLASSIFIED frontend/src/i18n/ar/common.json:navigation.countries:البلدان term=البلدان
```

The dossier JSON check found zero unclassified values containing either explicitly sanctioned
`الملف الشخصي` or `مرفق ملف`.

## Full-suite evidence and scope

`pnpm test` was budgeted once. It exited 1 before Vitest collection because the harness-managed
`node_modules` symlink points at a read-only target:

```text
agent-runtime:test: Startup Error
agent-runtime:test: Error: EPERM: operation not permitted, open '.../node_modules/.vite-temp/vitest.config.ts.timestamp-....mjs'
Tasks: 3 successful, 5 total
Failed: agent-runtime#test
```

The symlink was not modified, deleted, or replaced. The repository commit hook independently built
agent-runtime and backend; its frontend config bundling hit the same read-only `.vite-temp` EPERM.

Final scope relative to the P99-04 merge is exactly:

```text
scripts/nav-title-agreement.mjs
scripts/glossary-census.mjs
.planning/phases/99-arabic-coverage/99-05-SUMMARY.md
```

No file outside P99-05's allowlist changed. Later repair owners remain P99-22–24 for nav/title and
P99-25–29 for sense-aware glossary sweeps; P99-39 owns the final all-green battery.
