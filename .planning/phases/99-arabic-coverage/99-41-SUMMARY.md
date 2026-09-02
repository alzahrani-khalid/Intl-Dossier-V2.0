---
phase: 99-arabic-coverage
plan: 41
status: blocked
head: c975d61f8e859aaa885a2fb78ccf73ce1e2f29ef
recorded_at_local: 2026-09-02T22:44:24+03:00
recorded_at_utc: 2026-09-02T19:44:24Z
---

# P99-41 Summary — residue register and operator checkpoint

## Outcome

P99-41 is **blocked**, not complete. No qualifying operator/overseer answer and no subsequent
`tickmarkr approve` exist. Commit `2a79b80da` is an agent-session repair commit: its
`Co-Authored-By: Claude Opus 5` and `Claude-Session` trailers prevent its Git author field from
establishing that the operator saw and answered this checkpoint. It is repair lineage only.

The static battery was rerun fresh at the recorded HEAD. In particular,
`glossary-census.mjs --census` was rerun and its complete 17,022 / 1,657 / 292 output is reproduced
below; those counts are not copied from P99-39. Every claimed static zero has a control.

The harness-reported task-level AR-02 gate exited 0 and owns criterion 2. Locally, both rendered
specs passed their file and hardcoded collection checks (8 and 10), then the wrapper refused before
Playwright started because process birth identity for the port-5001 holder was unavailable in this
sandbox. Consequently the post-repair AR-03 run and the full rendered checkpoint pack are parked
red. There are no authorized bounds.

## Acceptance items

| Acceptance item | Record |
| --- | --- |
| The operator has seen the Arabic session read as Arabic and said so in writing — or named what must change while the reversal window is still open. | **OPEN / BLOCKING.** No qualifying operator answer exists. |
| The operator has seen the Arabic session read as Arabic and said so in writing — or named what must change while the reversal window is still open. | **OPEN / BLOCKING.** Duplicated because the compiled acceptance list carries this criterion twice. |
| The register carries the honored-evidence table for the five decisions the overseer waived as citation-truths on machine evidence (D-01, D-03, D-36, D-37, D-39) VERBATIM — that verbatim carry is the waiver's stated condition | The five-row table is preserved byte-for-byte in `99-VERIFICATION.md`. |
| The human checkpoint presents: the 404, the intake queue, the search chips, a dated surface, the /activity relative-time surface and the position banner rendered under ar, plus the D-19 tie-break list from the nav-title lane — and the phase does not close until the operator answers | **NOT PRODUCED / BLOCKING.** The D-19 list is present, but the post-repair AR-03 invocation did not execute, so the register does not substitute bundle text for the rendered pack. |
| criterion 2 closes on the RENDERED spec run by THIS gate — ONE spec path (D-09: two paths with one match silently drop the rest and exit 0), file existence asserted, the count hardcoded at 8 — RED at HEAD | **GATE GREEN.** The harness-reported task gate exited 0; the local exit-90 retry is recorded separately and is not the green. |
| The evidence register is honest: every green names its instrument run fresh in this task, every zero shows its control, every bound is quoted with the overseer ruling that authorised it, no criterion leans on a green produced before the repairs it grades, and no leg is recorded NOT CONSTRUCTED. | Fresh static greens and the task gate are named; authorized bounds are zero; AR-03 and D-38 are explicitly red/open; the pre-repair P99-40 AR-03 green is not used. |

## Fresh battery results

| Instrument | Control | P99-41 live result | Exit |
| --- | --- | --- | --- |
| strict audit | self-check PASS; fixture `twoArgTotal=10`, `rawKeyTotal=2`, all 18 predicates true | 1,532 production files; `twoArgTotal=0`; `rawKeyTotal=8518`; every EN/AR unresolved counter 0 | 0 |
| maskfinder | four true/false polarities agree with their expectations | unresolved dynamic prefixes 0 | 0 |
| resolver | TaskCard prints exactly 3 `MISS=true`; live checker also prints positive and negative controls | 214 bilingual lookups over 11 routings; misses 0 | 0 |
| nav/title | planted mismatch caught; positive agreement preserved | 28 adjudicated; 25 agreements; 3 value-locked escalations; defect counters 0 | 0 |
| glossary census | planted illegal senses caught and legal senses retained | Fresh `--census`: 17,022 Arabic leaves in 129 files; ruled 1,657; allowlisted 292; unclassified 0 | 0 |
| date-format checker | dead exemption importers 0 beside 29 live-control importers | 1,533 files; unexcused sites 0; named debt 0 | 0 |
| completion contract | nonempty phase population | **Expected RED after this record is marked blocked:** P99-41 intentionally lacks `status: complete` | 1 |

## Fresh evidence commands and verbatim output

This record applies `RULING-P99-538`: every command used as criterion evidence is
included with unedited output. Read/navigation commands are named in the ledger, because embedding
the files they read was the unbounded form that ruling superseded.

### Strict audit self-check

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/i18n-audit-strict.mjs "$PWD" --self-check; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
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
EXIT=0
~~~
### Strict audit live JSON

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/i18n-audit-strict.mjs "$PWD" --json; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
{
  "root": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-182826-0000000000000073--P99-41",
  "scannedRoot": "/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260902-182826-0000000000000073--P99-41/frontend/src",
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
EXIT=0
~~~
### Dynamic-prefix maskfinder control

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" python3 scripts/partA_maskfinder.py "$PWD" --control; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
EXIT=0
~~~
### Dynamic-prefix maskfinder live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" python3 scripts/partA_maskfinder.py "$PWD"; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
EXIT=0
~~~
### TaskCard negative control

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/neg-taskcard.mjs "$PWD"; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
EXIT=0
~~~
### Resolution check live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/resolve-check.mjs "$PWD"; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
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
EXIT=0
~~~
### Nav/title planted control

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/nav-title-agreement.mjs "$PWD" --control; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
EXIT=0
~~~
### Nav/title live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/nav-title-agreement.mjs "$PWD"; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
nav/title walk: 28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 duplicate term pattern; 0 cross-matching term row; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
EXIT=0
~~~
### Glossary census planted control

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/glossary-census.mjs "$PWD" --control; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
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
EXIT=0
~~~
### Glossary census live, with the full fresh census

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/glossary-census.mjs "$PWD" --census; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
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
EXIT=0
~~~
### Date-format exemption/importer controls

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; DEADIMP=$(command grep -rn "EnhancedActivityFeed" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "activity-feed/EnhancedActivityFeed.tsx:" | command grep -c . || true); LIVEIMP=$(command grep -rn "SharedRecentActivityCard" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "SharedRecentActivityCard.tsx:" | command grep -c . || true); echo "date-format controls: exempt-file importers=$DEADIMP (expect 0) live-control importers=$LIVEIMP (expect >0)"; test "$LIVEIMP" -gt 0 && test "$DEADIMP" -eq 0; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
date-format controls: exempt-file importers=0 (expect 0) live-control importers=29 (expect >0)
EXIT=0
~~~
### Date-format checker live

Command:

~~~sh
PATH="/opt/homebrew/bin:$PATH" node scripts/check-date-formatting.mjs; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.
EXIT=0
~~~

### Completion contract after marking the human gate blocked

Command:

~~~sh
node scripts/completion-contract-check.mjs --summaries .planning/phases/99-arabic-coverage; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
  99-41-SUMMARY.md  BREACH — no 'status: complete' front-matter; the next compile reads this task PENDING
completion-contract: 61/62 SUMMARY files carry the marker
EXIT=1
~~~

This red is deliberate evidence that the human gate has not been closed; it is not relabelled as a
green. The plan requires `status: complete` **when done**, and D-38 says the task is not done before
the operator answers.

## Criterion-2 gate command: local refusal controls

The exact command from `99-41-PLAN.md` was run unchanged. It asserts one file, one spec
path and the hardcoded expected count 8 before execution.

### Prior-attempt retry 1

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar02-dates.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar02-dates\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=8; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar02-dates.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar02-dates.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
~~~

Verbatim stdout/stderr:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
~~~

Process exit: `90`.

### Prior-attempt retry 2, after attribution showed the same live port-5001 holder

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar02-dates.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar02-dates\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=8; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar02-dates.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar02-dates.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps
~~~

Verbatim stdout/stderr:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
~~~

Process exit: `90`.

Both prior-attempt retries and the current local retry established
`collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8`; none established a local
rendered result. The wrapper's refusal is the positive safety behavior for an unproven holder. It
is not a bound and not a pass. The task-level command gate is the authoritative AR-02 rendered run;
the harness reported that gate exited 0.

## Current post-repair rendered attempts

The AR-02 command above was rerun unchanged. AR-03 used the same D-09 structure with its own single
existing path and hardcoded `EXP=10`:

~~~sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" && test -f tests/e2e/99-ar03-leak.spec.ts && { PL=$(pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>/dev/null); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: playwright --list exited $ST; the printed total is not a collection verdict"; exit 3; }; NT=$(printf "%s\n" "$PL" | command grep -cE "› 99-ar03-leak\.spec\.ts:[0-9]+:[0-9]+ ›"); EXP=10; test "$NT" -eq "$EXP" || { echo "FAIL: collected $NT tests from 99-ar03-leak.spec.ts, expected $EXP"; printf "%s\n" "$PL" | tail -3; exit 1; }; echo "collected-from-target-spec=99-ar03-leak.spec.ts count=$NT expected=$EXP"; } && { command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; } && node "$R/scripts/pw-run-reaped.mjs" -- tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps
~~~

Verbatim current outputs:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
EXIT=90

collected-from-target-spec=99-ar03-leak.spec.ts count=10 expected=10
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
EXIT=90
~~~

AR-03 is therefore parked red by the exact spec name. Its P99-40 rendered green is not reused:
that run predates the position-H1 repair and did not grade the repaired H1.

## Human checkpoint evidence audit

Command:

~~~sh
git show -s --format='COMMIT=%H%nAUTHOR=%an <%ae>%nAUTHORED=%aI%n%n%B' 2a79b80da; TKR_ST=$?; printf 'EXIT=%s\n' "$TKR_ST"; exit "$TKR_ST"
~~~

Verbatim stdout/stderr:

~~~text
COMMIT=2a79b80daf1baa1e3d980736b1d144c702d3c04b
AUTHOR=Khalid Alzahrani <alzahrani.khalid@gmail.com>
AUTHORED=2026-09-02T13:52:57+03:00

fix(i18n): show the Arabic position title as the heading in Arabic mode

The position detail page rendered title_en as its h1 unconditionally and
demoted title_ar to muted secondary text, so an Arabic session opened a
position under an English heading. Found while capturing the D-38 checkpoint
surfaces, where surface 6 read "GASTAT stance on open data licensing" above the
Arabic title.

UI99-C7 did not catch it because it asserts on the read-only banner element
rather than the heading, so the page could lead in English while the test
passed.

PositionCard and PositionList already select by locale; this applies the same
pattern, with the English title kept as the secondary line in Arabic mode and
the arrangement reversed in English. The DB constraint check_title_ar_not_empty
guarantees the Arabic title is non-empty, so the heading cannot render blank.

Verified in both locales: ar leads with موقف الهيئة من ترخيص البيانات المفتوحة,
en still leads with the English title. 99-ar02 and 99-ar03 remain 18/18.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01MM1w7sCDLDpu8tzNfdGCRZ

EXIT=0
~~~

This commit is **not** accepted as the checkpoint answer. The transcript itself carries an agent
co-author and agent-session trailer and says the defect was found while that agent session captured
surfaces. Git author metadata cannot replace the ruled two-column process. There is no overseer
ruling that adopts this text as the human decision and no subsequent `tickmarkr approve`.

**Checkpoint state: OPEN / BLOCKING.** The full post-repair rendered pack was not produced in this
task, and no operator answer is recorded.

## Residues and later owners

- Authorized bounds: none.
- Blocking rendered leg: `tests/e2e/99-ar03-leak.spec.ts` collected 10 but exited 90 before
  Playwright started; the 404, intake, search-chip, and three position-banner legs therefore lack
  fresh post-repair output.
- Blocking checkpoint pack: the rendered presentation is NOT PRODUCED; bundle strings are not
  offered as a substitute.
- Blocking D-38 answer: no qualifying operator/overseer writing and no orchestrator approval.
- Phase 102: D-21's working approximately 7,086-site dot-to-colon tail, COPY-09's three literals,
  EDGECOPY-01's two edge functions, and GUIDE-HOLLOW-01's seven guide bodies.
- Phase 103: the 39 criterion-1 members triaged by reading in Phase 98.
- Nav/title escalations: `navigation.admin`, `navigation.taskQueue`, and
  `navigation.newEvent`, still value-locked.
- Closed historical population, retained by name: the 37 `common:common.*` keys listed
  in the register; the live population is zero.
- Named handoffs: `common:optional`; `common:tasks.sla.approaching`;
  `common:afterActions.decisions.item`; `common:afterActions.confidence`;
  `common:afterActions.commitments.{tracking,statuses,priorities}.*`;
  `common:contributors`; `common:days`;
  `common:waitingQueue.reminder.{noAssignee,success,error}`;
  `WorkItemLinker.tsx`'s eight raw common keys; and
  `positions:draftBanner`.
- Open engine debt: `playwright.config.ts`'s unleased
  `pw-run-reaped.mjs --lease-exec` configuration still needs an overseer ruling.
- Arabic naturalness beyond the seven ruled glossary rows remains operator review.

## Read and diagnostic ledger

Read/navigation commands: `sed`, `rg`, `find`,
`wc`, `git log/show/status/rev-parse`, and read-only Node queries over the
plans, context, research, 62 existing lineage summaries, rendered specs, i18n bundles, test helpers,
and ruling references. They established scope, task ownership, the exact waiver table, D-19 values,
residues, and why commit authorship does not satisfy the human gate.

Diagnostics not used as greens: `lsof`/`ps` attribution of ports 5001 and
5173; the safety-wrapper retries; and Vite bundle/runner/native startup probes. Bundle mode was
denied writing through the provisioned `frontend/node_modules` symlink; runner/native mode loaded
without that write but the sandbox denied binding alternate port 5174 with `EPERM`. No tracked path
was changed by those probes.

No tracked path outside the two-path P99-41 allowlist changed.
