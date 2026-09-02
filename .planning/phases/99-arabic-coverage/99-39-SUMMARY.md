---
phase: 99-arabic-coverage
plan: 39
status: complete
attempt: 5
head: 7bbfd55bddd56ae78b92420386f97c1dddb94b67
recorded_at_local: 2026-09-02T05:45:42+03:00
recorded_at_utc: 2026-09-02T02:45:42Z
---

# P99-39 Summary — static battery green, rendered gate EXECUTED 18/18

## Outcome

Every criterion this task owns now has a fresh, controlled, named proof, produced in this task in
one session. The blocker that failed attempts 0 through 4 — a dev server from the **main
checkout** holding TCP 5173 — was released before this attempt began, so the unchanged plan-owned
rendered gate ran instead of taking its `INSTRUMENT-CANNOT-RUN` branch.

| Gate / battery member | Control first | Live result | Exit |
| --- | --- | --- | --- |
| `nav-title-agreement.mjs` | planted mismatch caught, true agreement preserved | 28/28 adjudicated; 25 agree; 3 escalated; all defect counters 0 | 0 |
| `glossary-census.mjs` | 4 planted illegal senses caught, legal senses preserved | 17,022 leaves / 129 files; `ruled=1657 allowlisted=292 UNCLASSIFIED=0` | 0 |
| `i18n-audit-strict.mjs` | `--self-check` 18/18 predicates, fixture `rawKeyTotal: 2` | `scannedFiles: 1532`, `twoArgTotal: 0`, `rawKeyTotal: 8518`, all 6 unresolved counters 0 | 0 |
| `partA_maskfinder.py` | 4/4 polarities asserted (2 true, 2 false) | `UNRESOLVED dynamic t() key prefixes: 0 total` | 0 |
| `neg-taskcard.mjs` -> `resolve-check.mjs` | 3 × `MISS=true` printed **before** the live run | `214 lookups across 11 routings x 2 locales — routings with a miss: 0` | 0 |
| `check-date-formatting.mjs` | dead-exemption importers 0 while live comparison has 29 | 1,533 files, 0 unexcused sites, 0 debt rows | 0 |
| `completion-contract-check.mjs` | drilled `1/2` exit 1; empty dir exit 3 | live phase directory `60/60` | 0 |
| **Plan-owned STATIC gate (verbatim)** | every control inline | all clauses green | **0** |
| **Plan-owned RENDERED gate (verbatim)** | collection 8 and 10 hardcoded, port guard resolved | `rendered battery executed by THIS gate: 18/18 (ar02 8 + ar03 10)` | **0** |
| `99-ar02-dates.spec.ts` alone | collection control 8 | `8 passed (16.2s)`, all 8 `✓` | 0 |
| `99-ar03-leak.spec.ts` alone | collection control 10 | `10 passed (50.2s)`, all 10 `✓`, incl. 3 banner states | 0 |

## Which output rule this record applies

This record applies **RULING-P99-538**. Every command whose output is EVIDENCE for a criterion —
each instrument, each control, each typed gate, each spec run, and each population re-derivation —
is reproduced below with its command and its **verbatim, unedited** output. Commands that only
navigated or read the tree are listed by name and purpose in the ledger at the end, without their
output, exactly as that ruling permits.

Nothing below is paraphrased, grouped, elided, or quoted from an earlier summary. No evidence
command's output is replaced by a note. The one run that is *summarised rather than reproduced* is
a discarded diagnostic that is not evidence for any criterion; it is disclosed in section 8 with
its cause, and no criterion rests on it.

The plan's own oracle strings were extracted from `99-39-PLAN.md` programmatically and verified to
re-encode byte-for-byte back to the plan's YAML lines (`oracle1: ROUND-TRIP EXACT`,
`oracle2: ROUND-TRIP EXACT`, `oracle3: ROUND-TRIP EXACT`) before being run, so what ran below is
the compiled gate text and not a retyped approximation.

## 1. Static instrument battery — one session, each control before its live run

The whole battery ran as one script, in this order, so no live zero appears before the control
that proves the instrument can be non-zero. `neg-taskcard` deliberately precedes `resolve-check`,
which the previous revision of this record got the wrong way round.

```text
##### 1. nav-title-agreement --control (CONTROL FIRST)
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/nav-title-agreement.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39 --control
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
=====EXIT===== 0
##### 2. nav-title-agreement live
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/nav-title-agreement.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39
nav/title walk: 28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 duplicate term pattern; 0 cross-matching term row; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
=====EXIT===== 0
##### 3. glossary-census --control (CONTROL FIRST)
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/glossary-census.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39 --control
{
  "control": "PASS",
  "realFilePreserved": true,
  "unlistedProfileRejected": true,
  "exactProfileSelected": true,
  "briefPluralSeen": true,
  "plantedUnclassifiedBriefPluralCaught": true,
  "realFileClassification": "computer-file-or-attachment",
  "unlistedProfileClassification": "UNCLASSIFIED",
  "exactProfileClassification": "profile-page-or-summary",
  "briefPluralClassification": "briefing-session-or-stage",
  "plantedBriefPluralClassification": "UNCLASSIFIED",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true,
  "allowlistedPluralSeen": true,
  "plantedUnclassifiedPluralCaught": true,
  "allowlistedPluralCount": 1,
  "plantedUnclassifiedPluralCount": 1,
  "allowlistedBriefPluralCount": 1,
  "plantedUnclassifiedBriefPluralCount": 1
}
=====EXIT===== 0
##### 4. glossary-census live
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/glossary-census.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39
UNCLASSIFIED glossary occurrences: 0
=====EXIT===== 0
##### 5. i18n-audit-strict --self-check (CONTROL FIRST)
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/i18n-audit-strict.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39 --self-check
{
  "selfCheck": "PASS",
  "passed": true,
  "fixture": {
    "twoArgTotal": 10,
    "rawKeyTotal": 2,
    "sourcePolicy": {
      "production": {
        "path": "self-check/FeaturePanel.tsx",
        "included": true
      },
      "colocatedTest": {
        "path": "self-check/FeaturePanel.test.tsx",
        "included": false
      },
      "testsDirectory": {
        "path": "self-check/__tests__/FeaturePanel.tsx",
        "included": false
      }
    },
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
    "productionSourceIncluded": true,
    "testFileExcluded": true,
    "testsDirectoryExcluded": true,
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
    "pluralDefaultMaskCounted": true,
    "defaultValuesIsNotAMask": true,
    "defectiveModelVisiblyReclassified": true
  }
}
=====EXIT===== 0
##### 6. i18n-audit-strict --json live
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/i18n-audit-strict.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39 --json
{
  "root": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39",
  "scannedRoot": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/frontend/src",
  "scannedFiles": 1532,
  "scope": [],
  "locales": [
    "en",
    "ar"
  ],
  "candidateModel": {
    "resolver": "scripts/lib/i18n-binding.mjs",
    "unprefixed": "declared namespaces only; built-in translation for a bare or undeclared binding",
    "aliases": {
      "translation": "common"
    },
    "fallbackNS": null,
    "defaultNS": null
  },
  "bindingModel": {
    "measuredSyntaxFiles": 665,
    "arrayFirstOnlyFiles": 47,
    "bareUnmatchedFiles": 110,
    "defectiveShapeFiles": 157,
    "canonicalParsedFiles": 664,
    "canonicalStringFiles": 515,
    "canonicalArrayFiles": 46,
    "canonicalBareFiles": 110
  },
  "twoArgTotal": 0,
  "literalTwoArgTotal": 0,
  "optionsDefaultTotal": 0,
  "rawKeyTotal": 8518,
  "nonKeyTotal": 0,
  "twoArgUnresolved": 0,
  "literalTwoArgUnresolved": 0,
  "optionsDefaultUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "twoArgDistinct": 0,
  "rawKeyDistinct": 0,
  "looseModelDelta": {
    "twoArgHiddenSites": 0,
    "literalTwoArgHiddenSites": 0,
    "rawKeyHiddenSites": 0,
    "twoArgRescuedByAlias": 0,
    "rawKeyRescuedByAlias": 2
  },
  "defectiveBindingDelta": {
    "twoArgSitesReclassified": 0,
    "rawKeySitesReclassified": 36
  },
  "sites": [],
  "nonKeys": []
}
=====EXIT===== 0
##### 7. partA_maskfinder --control (CONTROL FIRST)
=====CMD===== python3 /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/partA_maskfinder.py /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39 --control
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
=====EXIT===== 0
##### 8. partA_maskfinder live
=====CMD===== python3 /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/partA_maskfinder.py /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
=====EXIT===== 0
##### 9. neg-taskcard (NEGATIVE CONTROL for resolve-check, RUN BEFORE IT)
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/neg-taskcard.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
=====EXIT===== 0
##### 10. resolve-check live
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/resolve-check.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙

===== locale en (fallbackLng disabled, so an en miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

===== locale ar (fallbackLng disabled, so an ar miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

CONTROL negative: t('sourceType.__not_a_real_member__') -> "sourceType.__not_a_real_member__" ; detected-as-miss=true
CONTROL positive: t('sourceType.human_entered') -> "Human entered" ; detected-as-miss=false

214 lookups across 11 routings x 2 locales — routings with a miss: 0
=====EXIT===== 0
##### 11. date-format importer census (LIVE control + exempt-file census)
=====CMD===== grep -rn EnhancedActivityFeed / SharedRecentActivityCard importer census
date-format controls: exempt-file importers=0 (expect 0) live-control importers=29 (expect >0)
=====EXIT===== 0
##### 12. check-date-formatting live
=====CMD===== node /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/scripts/check-date-formatting.mjs
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.
=====EXIT===== 0
```

## 2. Glossary census over every ruled row, repo-wide

The live verdict above is a single zero; this is the drilled per-row census behind it, which is
what criterion 1 requires. Every one of the seven ruled rows reports `unclassified=0` on its own.

```text
=====CMD===== node scripts/glossary-census.mjs $R --census
glossary census: 17022 Arabic leaf values across 129 file(s)
dossier	ruled=دوسيه	before=143	after=685	unclassified=0
  دوسيه	ruled-term	occurrences=685	lines=673	values=674	files=86	ruled=685	allowlisted=0	unclassified=0
  دوسييه	competing-term	occurrences=2	lines=2	values=2	files=1	ruled=0	allowlisted=2	unclassified=0
  ملف	competing-term	occurrences=141	lines=135	values=135	files=25	ruled=0	allowlisted=141	unclassified=0
engagement	ruled=مشاركة / المشاركات	before=17	after=333	unclassified=0
  مشاركة	ruled-term	occurrences=333	lines=319	values=330	files=71	ruled=333	allowlisted=0	unclassified=0
  ارتباط	competing-term	occurrences=17	lines=17	values=17	files=7	ruled=0	allowlisted=17	unclassified=0
brief-artifact	ruled=ملخص / الملخصات	before=77	after=284	unclassified=0
  ملخص	ruled-term	occurrences=284	lines=277	values=277	files=56	ruled=284	allowlisted=0	unclassified=0
  موجز	competing-term	occurrences=22	lines=22	values=22	files=9	ruled=0	allowlisted=22	unclassified=0
  إحاطة	competing-term	occurrences=55	lines=54	values=55	files=12	ruled=0	allowlisted=55	unclassified=0
  إحاطات	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
briefing-session	ruled=إحاطة	before=0	after=55	unclassified=0
  إحاطة	ruled-term	occurrences=55	lines=54	values=55	files=12	ruled=55	allowlisted=0	unclassified=0
stance	ruled=موقف / المواقف	before=55	after=223	unclassified=0
  موقف	ruled-term	occurrences=223	lines=217	values=217	files=39	ruled=223	allowlisted=0	unclassified=0
  منصب	competing-term	occurrences=46	lines=46	values=46	files=11	ruled=0	allowlisted=46	unclassified=0
  مناصب	competing-term	occurrences=9	lines=9	values=9	files=6	ruled=0	allowlisted=9	unclassified=0
country	ruled=الدول	before=0	after=59	unclassified=0
  الدول	ruled-term	occurrences=59	lines=59	values=59	files=25	ruled=59	allowlisted=0	unclassified=0
  البلدان	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
intake-vs-waiting-queue	ruled=قائمة الاستقبال / قائمة الانتظار	before=0	after=18	unclassified=0
  قائمة الاستقبال	ruled-term	occurrences=4	lines=4	values=4	files=2	ruled=4	allowlisted=0	unclassified=0
  قائمة الانتظار	ruled-term	occurrences=14	lines=14	values=14	files=2	ruled=14	allowlisted=0	unclassified=0
classification totals: ruled=1657 allowlisted=292 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
=====EXIT===== 0
```

## 3. Completion-contract negative controls

The previous revision of this record described the required markerless-SUMMARY drill without
running it. It is run here. A drilled directory holding one marked and one markerless SUMMARY must
report `1/2` and exit 1, and an empty directory must be refused with exit 3 rather than passed.

```text
=====CMD===== node "$R/scripts/completion-contract-check.mjs" --summaries "$D/markerless"   # 99-01 carries the marker, 99-02 does not
  99-02-SUMMARY.md  BREACH — no 'status: complete' front-matter; the next compile reads this task PENDING
completion-contract: 1/2 SUMMARY files carry the marker
=====EXIT===== 1
=====CMD===== node "$R/scripts/completion-contract-check.mjs" --summaries "$D/empty"        # empty population
INSTRUMENT-CANNOT-RUN: no SUMMARY files under /private/tmp/claude-501/-Users-khalidalzahrani-Desktop-CodingSpace-Intl-Dossier-V2-0--tickmarkr-worktrees-noindex-tickmarkr-run-20260902-012826-0000000000000070--P99-39/830e64ec-8789-4c49-b83e-eb262d7592d2/scratchpad/cc-drill/empty; an empty population proves nothing
=====EXIT===== 3
```

## 4. Plan-owned STATIC gate, run verbatim as compiled

```text
$ bash <oracle 1, extracted byte-exact from 99-39-PLAN.md must_haves>
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
nav/title walk: 28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 duplicate term pattern; 0 cross-matching term row; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
{
  "control": "PASS",
  "realFilePreserved": true,
  "unlistedProfileRejected": true,
  "exactProfileSelected": true,
  "briefPluralSeen": true,
  "plantedUnclassifiedBriefPluralCaught": true,
  "realFileClassification": "computer-file-or-attachment",
  "unlistedProfileClassification": "UNCLASSIFIED",
  "exactProfileClassification": "profile-page-or-summary",
  "briefPluralClassification": "briefing-session-or-stage",
  "plantedBriefPluralClassification": "UNCLASSIFIED",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true,
  "allowlistedPluralSeen": true,
  "plantedUnclassifiedPluralCaught": true,
  "allowlistedPluralCount": 1,
  "plantedUnclassifiedPluralCount": 1,
  "allowlistedBriefPluralCount": 1,
  "plantedUnclassifiedBriefPluralCount": 1
}
UNCLASSIFIED glossary occurrences: 0
{
  "selfCheck": "PASS",
  "passed": true,
  "fixture": {
    "twoArgTotal": 10,
    "rawKeyTotal": 2,
    "sourcePolicy": {
      "production": {
        "path": "self-check/FeaturePanel.tsx",
        "included": true
      },
      "colocatedTest": {
        "path": "self-check/FeaturePanel.test.tsx",
        "included": false
      },
      "testsDirectory": {
        "path": "self-check/__tests__/FeaturePanel.tsx",
        "included": false
      }
    },
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
    "productionSourceIncluded": true,
    "testFileExcluded": true,
    "testsDirectoryExcluded": true,
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
    "pluralDefaultMaskCounted": true,
    "defaultValuesIsNotAMask": true,
    "defectiveModelVisiblyReclassified": true
  }
}
mask-finder control polarities asserted: 4/4
date-format controls: exempt-file importers=0 (expect 0) live-control importers=29 (expect >0)
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.
EXIT=0
```

## 5. Plan-owned RENDERED gate, run verbatim as compiled

This is the gate that exited 3 in attempts 0 through 4. It was run unchanged. The port guard found
TCP 5173 unheld, so it neither reused a foreign server nor refused; Playwright started and
supervised its own dev server rooted in this worktree.

```text
$ bash <oracle 2, extracted byte-exact from 99-39-PLAN.md must_haves>; echo "EXIT=$?"
rendered battery executed by THIS gate: 18/18 (ar02 8 + ar03 10)
EXIT=0
```

The gate captures Playwright's own output into a shell variable and prints it only on failure, so
its verdict line is the whole of its output on success. Sections 6 and 7 therefore re-run each
spec separately to record the per-test evidence criteria 2 and 3 require.

## 6. `99-ar02-dates.spec.ts` alone — collection control, then execution

```text
##### --list COLLECTION CONTROL: 99-ar02-dates
=====CMD===== pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list
  [chromium-en] › 99-ar02-dates.spec.ts:186:5 › UI99-C1C2C4 ar /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:190:5 › UI99-C1C2C4 ar /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:194:5 › UI99-C1C2C4 ar /events
  [chromium-en] › 99-ar02-dates.spec.ts:198:5 › UI99-C1 en control /calendar
  [chromium-en] › 99-ar02-dates.spec.ts:202:5 › UI99-C1 en control /dossiers
  [chromium-en] › 99-ar02-dates.spec.ts:206:5 › UI99-C1 en control /events
  [chromium-en] › 99-ar02-dates.spec.ts:210:5 › UI99-C3 ar /activity relative time
  [chromium-en] › 99-ar02-dates.spec.ts:232:5 › UI99-C3 en control /activity relative time
=====COUNT===== 8
##### EXECUTION (own server, no reuse): 99-ar02-dates
=====CMD===== pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --reporter=list
[WebServer] pw-run-reaped --lease-exec: PW_LEASE_* env absent — running UNLEASED (ad-hoc invocation)
[WebServer] • turbo 2.9.14

Running 8 tests using 8 workers

  ✓  8 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:210:5 › UI99-C3 ar /activity relative time (11.6s)
  ✓  7 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:194:5 › UI99-C1C2C4 ar /events (12.1s)
  ✓  3 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:206:5 › UI99-C1 en control /events (12.3s)
  ✓  4 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:232:5 › UI99-C3 en control /activity relative time (12.6s)
  ✓  5 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:202:5 › UI99-C1 en control /dossiers (12.8s)
  ✓  6 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:198:5 › UI99-C1 en control /calendar (13.0s)
  ✓  1 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:186:5 › UI99-C1C2C4 ar /calendar (13.6s)
  ✓  2 [chromium-en] › tests/e2e/99-ar02-dates.spec.ts:190:5 › UI99-C1C2C4 ar /dossiers (13.7s)

  8 passed (16.2s)
=====PIPESTATUS0===== 0
##### port after 99-ar02-dates:
3965
```

## 7. `99-ar03-leak.spec.ts` alone — collection control, then execution

The collection control, listing all ten tests including the three banner fixtures:

```text
##### --list COLLECTION CONTROL: 99-ar03-leak
=====CMD===== pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list
  [chromium-en] › 99-ar03-leak.spec.ts:164:5 › UI99-C5 ar 404
  [chromium-en] › 99-ar03-leak.spec.ts:181:5 › UI99-C5 en control 404
  [chromium-en] › 99-ar03-leak.spec.ts:195:5 › UI99-C6 ar intake queue
  [chromium-en] › 99-ar03-leak.spec.ts:212:5 › UI99-C6 en control intake queue
  [chromium-en] › 99-ar03-leak.spec.ts:228:5 › UI99-C7 ar banner under_review
  [chromium-en] › 99-ar03-leak.spec.ts:232:5 › UI99-C7 ar banner approved
  [chromium-en] › 99-ar03-leak.spec.ts:236:5 › UI99-C7 ar banner published
  [chromium-en] › 99-ar03-leak.spec.ts:240:5 › UI99-C8 ar search chips
  [chromium-en] › 99-ar03-leak.spec.ts:261:5 › UI99-C9 ar latin run scan
  [chromium-en] › 99-ar03-leak.spec.ts:332:5 › UI99-C10 ar tajawal
=====COUNT===== 10
```

Execution. The first attempt at this run failed with
`http://localhost:5173 is already used` because the `99-ar02-dates` run in section 6 had leaked
its dev server — the engine residue named in the register. The holder's working directory was
resolved before anything was touched, proving it was rooted in **this** worktree and spawned by
this task's own previous run; only then was it reaped. A holder rooted anywhere else takes the
refusal branch and is never touched.

```text
reaping OWN leaked holder pid 3965 (parent 3872) rooted at /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39/frontend
port after reap: []
##### EXECUTION (own server, no reuse): 99-ar03-leak
=====CMD===== pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --reporter=list
[WebServer] pw-run-reaped --lease-exec: PW_LEASE_* env absent — running UNLEASED (ad-hoc invocation)
[WebServer] • turbo 2.9.14

Running 10 tests using 5 workers

[P99-C7] verified positions CHECK constraints before INSERT:
check_correction_fields: CHECK ((((emergency_correction = false) AND (corrected_at IS NULL) AND (corrected_by IS NULL) AND (correction_reason IS NULL)) OR ((emergency_correction = true) AND (corrected_at IS NOT NULL) AND (corrected_by IS NOT NULL) AND (correction_reason IS NOT NULL))))
check_title_ar_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_ar)) > 0))
check_title_en_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_en)) > 0))
positions_consistency_score_check: CHECK (((consistency_score >= 0) AND (consistency_score <= 100)))
positions_current_stage_check: CHECK (((current_stage >= 0) AND (current_stage <= 10)))
positions_status_check: CHECK ((status = ANY (ARRAY['draft'::text, 'under_review'::text, 'approved'::text, 'published'::text])))
[P99-C7] verified positions CHECK constraints before INSERT:
check_correction_fields: CHECK ((((emergency_correction = false) AND (corrected_at IS NULL) AND (corrected_by IS NULL) AND (correction_reason IS NULL)) OR ((emergency_correction = true) AND (corrected_at IS NOT NULL) AND (corrected_by IS NOT NULL) AND (correction_reason IS NOT NULL))))
check_title_ar_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_ar)) > 0))
check_title_en_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_en)) > 0))
positions_consistency_score_check: CHECK (((consistency_score >= 0) AND (consistency_score <= 100)))
positions_current_stage_check: CHECK (((current_stage >= 0) AND (current_stage <= 10)))
positions_status_check: CHECK ((status = ANY (ARRAY['draft'::text, 'under_review'::text, 'approved'::text, 'published'::text])))
[P99-C7] verified positions CHECK constraints before INSERT:
check_correction_fields: CHECK ((((emergency_correction = false) AND (corrected_at IS NULL) AND (corrected_by IS NULL) AND (correction_reason IS NULL)) OR ((emergency_correction = true) AND (corrected_at IS NOT NULL) AND (corrected_by IS NOT NULL) AND (correction_reason IS NOT NULL))))
check_title_ar_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_ar)) > 0))
check_title_en_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_en)) > 0))
positions_consistency_score_check: CHECK (((consistency_score >= 0) AND (consistency_score <= 100)))
positions_current_stage_check: CHECK (((current_stage >= 0) AND (current_stage <= 10)))
positions_status_check: CHECK ((status = ANY (ARRAY['draft'::text, 'under_review'::text, 'approved'::text, 'published'::text])))
[P99-C7] verified positions CHECK constraints before INSERT:
check_correction_fields: CHECK ((((emergency_correction = false) AND (corrected_at IS NULL) AND (corrected_by IS NULL) AND (correction_reason IS NULL)) OR ((emergency_correction = true) AND (corrected_at IS NOT NULL) AND (corrected_by IS NOT NULL) AND (correction_reason IS NOT NULL))))
check_title_ar_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_ar)) > 0))
check_title_en_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_en)) > 0))
positions_consistency_score_check: CHECK (((consistency_score >= 0) AND (consistency_score <= 100)))
positions_current_stage_check: CHECK (((current_stage >= 0) AND (current_stage <= 10)))
positions_status_check: CHECK ((status = ANY (ARRAY['draft'::text, 'under_review'::text, 'approved'::text, 'published'::text])))
[P99-C7] verified positions CHECK constraints before INSERT:
check_correction_fields: CHECK ((((emergency_correction = false) AND (corrected_at IS NULL) AND (corrected_by IS NULL) AND (correction_reason IS NULL)) OR ((emergency_correction = true) AND (corrected_at IS NOT NULL) AND (corrected_by IS NOT NULL) AND (correction_reason IS NOT NULL))))
check_title_ar_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_ar)) > 0))
check_title_en_not_empty: CHECK ((char_length(TRIM(BOTH FROM title_en)) > 0))
positions_consistency_score_check: CHECK (((consistency_score >= 0) AND (consistency_score <= 100)))
positions_current_stage_check: CHECK (((current_stage >= 0) AND (current_stage <= 10)))
positions_status_check: CHECK ((status = ANY (ARRAY['draft'::text, 'under_review'::text, 'approved'::text, 'published'::text])))
[P99-C7] seeded position ids: {"under_review":"43ce32b5-8568-4a29-8f7a-af30357dd954","approved":"c26f18af-c16c-4af4-95df-a13d3b15d250","published":"68dd933c-dfcf-40af-9b46-866946f18cb6"}
[P99-C7] seeded position ids: {"under_review":"d2c0c0f0-08fb-4a98-8681-21790832fc82","approved":"a76ec85d-9fa2-4c75-9802-722e8b1fa1ef","published":"96ff41f5-b59f-4a00-8c56-2701879946d8"}
[P99-C7] seeded position ids: {"under_review":"abc0f528-5119-467a-b5c2-6305bed29484","approved":"cfac3c7b-aa8f-4727-bea6-6c1987ff855c","published":"63e3b3aa-c69f-411c-82be-1fbffd9ad885"}
[P99-C7] seeded position ids: {"under_review":"772e1cb6-5c2f-4006-99b0-7b6623d8a439","approved":"a5037ea2-229b-4736-baf9-4d5261f168fa","published":"9952e121-93ba-4adc-92bb-f273a7c2777b"}
[P99-C7] seeded position ids: {"under_review":"de95529d-a0ce-40d5-bc94-ec9949e1d359","approved":"23b9b00f-1933-457b-8714-7b8c25886a4f","published":"36b56f45-9288-4e18-b73e-a92ab44ba557"}
  ✓   5 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:195:5 › UI99-C6 ar intake queue (8.4s)
  ✓   4 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:164:5 › UI99-C5 ar 404 (8.4s)
  ✓   3 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:228:5 › UI99-C7 ar banner under_review (11.0s)
  ✓   1 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:236:5 › UI99-C7 ar banner published (11.1s)
  ✓   6 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:212:5 › UI99-C6 en control intake queue (6.5s)
  ✓   7 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:181:5 › UI99-C5 en control 404 (6.5s)
  ✓   9 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:240:5 › UI99-C8 ar search chips (6.5s)
  ✓   8 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:232:5 › UI99-C7 ar banner approved (8.2s)
  ✓   2 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:261:5 › UI99-C9 ar latin run scan (39.0s)
  ✓  10 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:332:5 › UI99-C10 ar tajawal (7.2s)

  10 passed (50.2s)
=====PIPESTATUS0===== 0
```

## 8. Disclosed discarded diagnostic — not evidence for any criterion

Between the gate and section 6 I ran both specs once with `PW_REUSE=1` against the server the
plan gate had leaked, intending to reuse it. Tests reported failures. The cause was environmental,
not a product result: that server's owning shell had exited and the server was reaped mid-run, so
`PW_REUSE=1` pointed Playwright at a port with nothing behind it — a later check found TCP 5173
free. That run is **discarded and no criterion rests on it**; sections 6 and 7 re-ran both specs
with their own supervised servers. It is recorded here because it happened, not because it proves
anything. This is the one run summarised rather than reproduced, and it is a discarded diagnostic
rather than evidence — the distinction RULING-P99-538 draws.

The lesson it carries forward, and the reason the register names the leak as an open engine
residue: reusing a leaked server is only safe while its supervising process is alive, and a leaked
server has by definition outlived its supervisor.

## 9. Live completion contract, after this SUMMARY carried `status: complete`

```text
=====CMD===== bash <oracle 3, extracted byte-exact from 99-39-PLAN.md must_haves>
completion-contract: 60/60 SUMMARY files carry the marker
=====EXIT===== 0
```

## 10. Provenance

Timestamps were read from the machine clock rather than converted by hand; the previous revision
of this record mis-converted an Asia/Riyadh time to UTC by a full day.

```text
$ git rev-parse HEAD; date +%Y-%m-%dT%H:%M:%S%z; date -u +%Y-%m-%dT%H:%M:%SZ; node -v; pnpm -v; pnpm exec playwright --version
HEAD=7bbfd55bddd56ae78b92420386f97c1dddb94b67
LOCAL=2026-09-02T05:45:42+0300
UTC=2026-09-02T02:45:42Z
node=v26.7.0 pnpm=10.29.1 playwright=Version 1.60.0
worktree=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-012826-0000000000000070--P99-39
```

`head` in the front matter is the tree this evidence was taken against. This record's own commit is
that commit's **child**, so `git show 7bbfd55bd:.planning/phases/99-arabic-coverage/99-39-SUMMARY.md`
returns the previous, blocked revision rather than this one.

## 11. D-19 table and the human gate

The D-19 reversal table, the three value-locked escalations, the swept-term census, and the D-38
checkpoint package are carried in `99-VERIFICATION.md` rather than duplicated here, so there is one
copy to reverse against.

**The D-38 checkpoint answer is NOT ANSWERED.** This task owns the checkpoint and presents its
package; the answer is the overseer's, in writing, and no worker, orchestrator or engine may supply
it. The `status: complete` marker in this file's front matter is the engine's
presence-implies-marker bookkeeping for this task's deliverable — the static battery, the rendered
execution and the register — and is explicitly **not** the sign-off. The register states that
scoping in full.

## 12. Left for named later tasks

- **P99-40 and P99-41:** the remaining two parts of this lane. They share these two specs, so they
  will meet a dev server on TCP 5173 — theirs to reuse if it is rooted in their own worktree, and
  to refuse if it is not.
- **P99-41:** presentation of the Arabic surfaces to the overseer alongside this package.
- **Open engine residue, needs a ruling:** the rendered oracle invokes Playwright ad hoc, so the
  config's `pw-run-reaped.mjs --lease-exec` wrapper runs unleased and leaks its dev server after a
  green run. Reproduced twice in this task. The in-repo fix is plan text, outside this task's write
  scope.
- **Phase 102 / Phase 103 / operator naturalness review:** carried unchanged in the register's
  residue section.

## 13. Read and navigation command ledger (RULING-P99-538)

Recorded by name and purpose, without output, because none is evidence for a criterion:

- `git log --oneline` / `git rev-parse HEAD` / `git status --short` — locate the base commit and confirm a clean tree.
- `cat 99-39-PLAN.md` — read the plan.
- `sed -n` over `99-CONTEXT.md`, `99-VERIFICATION.md`, `99-39-SUMMARY.md`, `playwright.config.ts` — read D-38's text, the previous register, and the `reuseExistingServer` seam.
- `ls` / `grep -rln` over the phase directory and `rulings/` — enumerate summaries and search for a recorded D-38 answer; none exists.
- `grep -n "census\|argv" scripts/glossary-census.mjs` — confirm the `--census` flag before using it.
- `ls -ld node_modules frontend/node_modules` — confirm the harness's symlinks are intact.
- `lsof -tnP -iTCP:5173 -sTCP:LISTEN` and `lsof -a -p <pid> -d cwd -Fn`, `ps -o pid,ppid,lstart` — establish port-holder provenance before any reuse or reap decision. Anchored to this worktree's path.
- `grep -c '[ \t]$'` over every captured output file — confirm no trailing whitespace enters the fenced blocks, which `git diff --check` flagged on a previous attempt.
- `wc -l`, `awk` slicing of the captured output files — assemble this record from the raw captures rather than retyping them, so the blocks above are verbatim by construction.
