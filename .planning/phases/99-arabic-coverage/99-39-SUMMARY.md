---
phase: 99-arabic-coverage
plan: 39
status: blocked
head: e2a21dc853b8c66b6769b7de7838427201ccf6b0
recorded_at_local: 2026-09-02T04:46:11+03:00
recorded_at_utc: 2026-09-02T01:46:11Z
---

# P99-39 Summary — static battery green, rendered gate blocked

## Outcome

The static battery was re-derived fresh and is green. This task is **not complete** and the
front-matter intentionally does not say `status: complete`: the plan-owned rendered oracle exited
3 before Playwright execution because PID 95414 holds port 5173 from the main checkout's
`frontend` directory, outside this worktree. RULING-P99-537 requires exactly that refusal. I did
not terminate the process, reuse it, disguise its cwd, or substitute an alternate-port run.

The typed gate's collection controls reached the required 8 and 10 populations before the port
guard. Because execution never began, there is no `18 passed` result, no fresh 8/8 or 10/10 result,
and no fresh three-banner-state result. Criteria 2 and 3 remain red by missing execution. D-38 is
also not answered by this worker; P99-41 remains the human-checkpoint owner.

This record applies **RULING-P99-538**. Every command whose output is evidence for a criterion,
control, instrument, population, or blocker appears below with verbatim output. Commands used only
to navigate or read are listed by command and purpose without embedding their read output. No
prior SUMMARY output is presented as a fresh green.

## Battery result table

| Battery member | Result in this task |
| --- | --- |
| nav-title control / 28-row live walk | PASS / PASS: 28 adjudicated, 25 agree, 3 escalated, zero unruled defects |
| glossary control / repo-wide live / drilled census | PASS / PASS / PASS: 129 files, 17,022 leaves, zero unclassified |
| strict self-check / live bilingual audit | PASS / PASS: 1,532 files, `twoArgTotal=0`, `rawKeyTotal=8518`, every unresolved counter zero |
| maskfinder control / live | PASS / PASS: four polarities agree, zero prefixes |
| neg-taskcard / resolve-check | PASS / PASS: 3 × `MISS=true`, 214 lookups, zero routing misses |
| date exemption/import control / live scan | PASS / PASS: live importer control 29, zero unexcused sites, zero debt |
| completion marker negative control | PASS: markerless fixture drilled 1/2 and instrument exited 1 |
| exact P99-39 static command oracle | PASS: exit 0 after this register existed |
| rendered own typed gate | **INSTRUMENT-CANNOT-RUN (exit 3)**: foreign holder on TCP 5173; no test executed |

## Evidence commands and verbatim outputs

### 1. Nav-title control, then live 28-row population

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/nav-title-agreement.mjs" "$R" --control; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/nav-title-agreement.mjs" "$R"; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
nav/title walk: 28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 duplicate term pattern; 0 cross-matching term row; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
EXIT_CODE=0
```

### 2. Glossary control, live verdict, then every-row census

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
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
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R"; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
UNCLASSIFIED glossary occurrences: 0
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --census; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
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
EXIT_CODE=0
```

### 3. Strict audit self-check, then live bilingual population

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --self-check; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
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
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --json; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
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
EXIT_CODE=0
```

The live `rawKeyTotal=8518` is the positive control against a walked-nothing zero. The plan's
JSON assertion explicitly fails when `rawKeyTotal===0`; the self-check ran first and proves both
test exclusion and nonempty positive fixtures.

### 4. Dynamic-prefix mask control, then live zero

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R" --control; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R"; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
EXIT_CODE=0
```

### 5. Resolution negative/positive control first, then live routings

`neg-taskcard.mjs` is the instrument's required external negative control and includes a resolving
contrast. It was run before `resolve-check.mjs`, so the live routing rows are not the first evidence
from the resolution harness.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/neg-taskcard.mjs" "$R"; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/resolve-check.mjs" "$R"; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
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
EXIT_CODE=0
```

### 6. Date-format exemption control, then live scan

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; DEADIMP=$(command grep -rn "EnhancedActivityFeed" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "activity-feed/EnhancedActivityFeed.tsx:" | command grep -c . || true); LIVEIMP=$(command grep -rn "SharedRecentActivityCard" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "SharedRecentActivityCard.tsx:" | command grep -c . || true); echo "date-format controls: exempt-file importers=$DEADIMP (expect 0) live-control importers=$LIVEIMP (expect >0)"; test "$LIVEIMP" -gt 0 || exit 3; test "$DEADIMP" -eq 0; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
date-format controls: exempt-file importers=0 (expect 0) live-control importers=29 (expect >0)
EXIT_CODE=0
```

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/check-date-formatting.mjs"; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
date-formatting check OK: 1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites (raw toLocaleDateString/toLocaleTimeString, month-first date-fns literals, Indic locale literals, relative time, localized skeletons, 12-hour literals, date-receiver toLocaleString, Intl.RelativeTimeFormat, local relative-time declarations, hand-assembled short relative forms) outside the 2-file allowlist (lib/format-date.ts, components/ui/calendar.tsx) and the 6 named permanent exemption(s) (see EXEMPT — each states its reason, and the dead-code one states its VOID CONDITION). Named debt: 0 row(s) excusing 0 site(s), all owned by plan 98-07.
EXIT_CODE=0
```

### 7. Completion-contract negative control

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; TMP=$(mktemp -d /tmp/p99-39-completion.XXXXXX); printf '%s\n' '---' 'status: complete' '---' '# controlled complete summary' > "$TMP/99-01-SUMMARY.md"; printf '%s\n' '# controlled markerless summary' > "$TMP/99-02-SUMMARY.md"; node "$R/scripts/completion-contract-check.mjs" --summaries "$TMP"; ST=$?; echo "CONTROL_EXPECTED_EXIT_CODE=$ST"; test "$ST" -eq 1; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
  99-02-SUMMARY.md  BREACH — no 'status: complete' front-matter; the next compile reads this task PENDING
completion-contract: 1/2 SUMMARY files carry the marker
CONTROL_EXPECTED_EXIT_CODE=1
EXIT_CODE=0
```

The pre-task phase directory contained 59 SUMMARY files and all 59 carried the marker. This task's
SUMMARY now exists with `status: blocked`, deliberately making the live completion contract red
until the rendered blocker is resolved; claiming 60/60 would be the exact completion bypass the
guard exists to prevent.

### 8. Plan-owned typed rendered gate

Command (verbatim from the P99-39 command oracle):

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" || exit 3; for spec in tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.ts; do test -f "$spec" || { echo "INSTRUMENT-CANNOT-RUN: missing $spec"; exit 3; }; done; C2=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null | command grep -c "99-ar02-dates.spec.ts:"); C3=$(pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>/dev/null | command grep -c "99-ar03-leak.spec.ts:"); test "$C2" -eq 8 || { echo "INSTRUMENT-CANNOT-RUN: ar02 collected $C2, expected 8 — a playwright path is a FILTER and a missing spec collects silently"; exit 3; }; test "$C3" -eq 10 || { echo "INSTRUMENT-CANNOT-RUN: ar03 collected $C3, expected 10"; exit 3; }; command -v lsof >/dev/null 2>&1 || { echo "INSTRUMENT-CANNOT-RUN: lsof absent, cannot establish who holds the dev-server port"; exit 3; }; HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -n "$HOLDER"; then HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep "^n" | head -1 | cut -c2-); case "$HCWD" in "$R"|"$R"/*) PW_REUSE=1; export PW_REUSE; echo "reusing dev server pid $HOLDER rooted in THIS worktree";; *) echo "INSTRUMENT-CANNOT-RUN: port 5173 held by pid $HOLDER rooted at ${HCWD:-unknown}, which is NOT this worktree; refusing to measure a foreign tree"; exit 3;; esac; fi; OUT=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --reporter=line 2>&1); ST=$?; printf "%s\n" "$OUT" | command grep -qE "(^|[^0-9])18 passed" || { echo "FAIL: rendered battery is not 18/18"; printf "%s\n" "$OUT" | tail -25; exit 1; }; test "$ST" -eq 0 || { echo "FAIL: playwright exited $ST despite an 18-passed line"; exit 1; }; echo "rendered battery executed by THIS gate: 18/18 (ar02 8 + ar03 10)"
```

Verbatim output:

```text
INSTRUMENT-CANNOT-RUN: port 5173 held by pid 95414 rooted at /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend, which is NOT this worktree; refusing to measure a foreign tree
```

Process exit status: `3`.

This output proves the existence and hardcoded collection checks did not fail before the port
branch, but it does **not** prove either spec executed. No 18-line reporter output exists.

### 9. Exact plan-owned static gate

Command (verbatim from the P99-39 command oracle, with exit reporting appended):

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; test -f "$R/.planning/phases/99-arabic-coverage/99-VERIFICATION.md" && command grep -q "criterion" "$R/.planning/phases/99-arabic-coverage/99-VERIFICATION.md" && node "$R/scripts/nav-title-agreement.mjs" "$R" --control && node "$R/scripts/nav-title-agreement.mjs" "$R" && node "$R/scripts/glossary-census.mjs" "$R" --control && node "$R/scripts/glossary-census.mjs" "$R" && node "$R/scripts/i18n-audit-strict.mjs" "$R" --self-check && node "$R/scripts/i18n-audit-strict.mjs" "$R" --json | node -e "let s=[];process.stdin.on(\"data\",d=>s.push(d)).on(\"end\",()=>{const j=JSON.parse(s.join(\"\"));if(j.rawKeyTotal===0){console.error(\"POSITIVE CONTROL FAILED — the instrument walked no t() sites\");process.exit(1)}if(j.twoArgTotal!==0||j.twoArgUnresolved!==0||j.rawKeyUnresolved!==0||j.twoArgUnresolvedAr!==0||j.rawKeyUnresolvedAr!==0){console.error(\"AR-04 not closed\",JSON.stringify(j).slice(0,300));process.exit(1)}})" && { MC=$(python3 "$R/scripts/partA_maskfinder.py" "$R" --control 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: maskfinder --control exited $ST"; exit 3; }; NC=$(printf "%s\n" "$MC" | command grep -c "^CONTROL " || true); test "$NC" -ge 4 || { echo "INSTRUMENT-CANNOT-RUN: control printed $NC CONTROL lines, fewer than the four documented polarities, so they cannot be asserted"; exit 3; }; OKC=$(printf "%s\n" "$MC" | command grep -cE "= True \(expect True\)|= False \(expect False\)" || true); test "$OKC" -eq "$NC" || { echo "FAIL: the mask-finder control is NOT discriminating - $((NC-OKC)) of $NC polarities disagree with their stated expectation:"; printf "%s\n" "$MC"; exit 1; }; echo "mask-finder control polarities asserted: $OKC/$NC"; } && { MF=$(python3 "$R/scripts/partA_maskfinder.py" "$R" 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: mask finder did not report the expected summary exited $ST; its printed summary is not a verdict"; printf "%s\n" "$MF" | tail -3; exit 3; }; printf "%s\n" "$MF" | command grep -q "prefixes: 0" || { echo "FAIL: mask finder did not report the expected summary"; exit 1; }; } && { NT=$(node "$R/scripts/neg-taskcard.mjs" "$R" 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: neg-taskcard.mjs exited $ST; its MISS rows are not a content verdict"; exit 3; }; NM=$(printf "%s\n" "$NT" | command grep -c "MISS=true" || true); test "$NM" -eq 3 || { echo "FAIL: negative control printed $NM MISS=true rows, expected 3"; exit 1; }; } && { RC=$(node "$R/scripts/resolve-check.mjs" "$R" 2>&1); ST=$?; test "$ST" -eq 0 || { echo "INSTRUMENT-CANNOT-RUN: resolve-check did not report the expected summary exited $ST; its printed summary is not a verdict"; printf "%s\n" "$RC" | tail -3; exit 3; }; printf "%s\n" "$RC" | command grep -q "routings with a miss: 0" || { echo "FAIL: resolve-check did not report the expected summary"; exit 1; }; } && { DEADIMP=$(command grep -rn "EnhancedActivityFeed" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "activity-feed/EnhancedActivityFeed.tsx:" | command grep -c . || true); LIVEIMP=$(command grep -rn "SharedRecentActivityCard" "$R/frontend/src" --include="*.ts" --include="*.tsx" | command grep -v "SharedRecentActivityCard.tsx:" | command grep -c . || true); echo "date-format controls: exempt-file importers=$DEADIMP (expect 0) live-control importers=$LIVEIMP (expect >0)"; test "$LIVEIMP" -gt 0 || { echo "INSTRUMENT-CANNOT-RUN: the LIVE control found zero importers for a component known to have them, so the importer census cannot discriminate and a zero for the exempt file would prove nothing"; exit 3; }; test "$DEADIMP" -eq 0 || { echo "FAIL: the dead-code exemption is VOID - EnhancedActivityFeed gained $DEADIMP importer(s), so its two offending rows return to the burn-down"; exit 1; }; } && node "$R/scripts/check-date-formatting.mjs"; ST=$?; echo "EXIT_CODE=$ST"; exit "$ST"
```

Verbatim output:

```text
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
EXIT_CODE=0
```

The strict JSON, live maskfinder, `neg-taskcard`, and `resolve-check` outputs are intentionally
captured and asserted inside the typed command, so the gate prints only their asserted summaries;
their complete fresh raw outputs appear in §§3–5 above.

### 10. Live completion-contract result after the blocked SUMMARY existed

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/completion-contract-check.mjs" --summaries "$R/.planning/phases/99-arabic-coverage"; ST=$?; echo "EXIT_CODE=$ST"; exit 0
```

Verbatim output:

```text
  99-39-SUMMARY.md  BREACH — no 'status: complete' front-matter; the next compile reads this task PENDING
completion-contract: 59/60 SUMMARY files carry the marker
EXIT_CODE=1
```

This is an honest failure, not an acceptance result. The marker must not turn green until the
rendered own-gate result exists.

### 11. Final non-mutating port recheck

Command:

```sh
HOLDER=$(lsof -tnP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | head -1); if test -z "$HOLDER"; then echo PORT_5173_FREE; else HCWD=$(lsof -a -p "$HOLDER" -d cwd -Fn 2>/dev/null | command grep '^n' | head -1 | cut -c2-); echo "PORT_5173_HOLDER=$HOLDER CWD=$HCWD"; fi
```

Verbatim output:

```text
PORT_5173_HOLDER=95414 CWD=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
```

### 12. Provenance

Command:

```sh
git rev-parse HEAD; date '+LOCAL=%Y-%m-%dT%H:%M:%S%z %Z'; TZ=UTC date '+UTC=%Y-%m-%dT%H:%M:%SZ'; git status --short
```

Verbatim output at the evidence timestamp:

```text
e2a21dc853b8c66b6769b7de7838427201ccf6b0
LOCAL=2026-09-02T04:46:11+0300 +03
UTC=2026-09-02T01:46:11Z
```

The UTC conversion is three hours behind Asia/Riyadh and remains on 2026-09-02.

## Read/navigation command ledger (RULING-P99-538)

These commands only read or located context; their output is not criterion evidence and is not
embedded:

- `sed -n '1,240p' .agents/skills/tickmarkr-loop/SKILL.md` — read the selected skill contract.
- `git status --short --branch` plus `sed` over `99-39-PLAN.md`, `99-CONTEXT.md`, and
  `99-RESEARCH.md` — establish branch cleanliness and read task law.
- `sed` over the two target docs, both rendered specs, and both static instruments — confirm the
  target docs were absent and read the named context files.
- `tail` over `resolve-check.mjs`, `i18n-audit-strict.mjs`, `partA_maskfinder.py`,
  `neg-taskcard.mjs`, and `check-date-formatting.mjs`; `find`/`rg` over SUMMARY files — inspect
  control order and locate lineage bounds.
- `rg`/`sed` over the phase rulings, PLAN-INDEX, REVISION, RECUT, P99-22/23, and P99-30 handoff —
  locate the waiver, tie-break, and control contracts.
- `for f in .../99-*-SUMMARY.md; do sed -n '1,40p' "$f" >/dev/null; done` — read the opening and
  bound statement of every existing SUMMARY; 59 files were present.
- `sed -n '1,260p' scripts/completion-contract-check.mjs` — inspect the presence-implies-marker
  implementation and exit semantics before drilling it.
- `rg`/`tail` over context/research and P99-13/15/16/22/40/43 records — assemble deferred residue,
  D-19, double-prefix, and named-handoff bounds without importing their greens.
- `lsof -a -p 95414 -d cwd -Fn` — independently read the foreign holder cwd after the typed gate
  had already refused it. `ps` was attempted read-only but the sandbox returned `operation not
  permitted`; no process state changed.

## D-19 table presented for later human gate

| Decision | Before | After |
| --- | --- | --- |
| Countries requirement arrow | nav `البلدان`; title `نظرة عامة على الدول` | nav `الدول`; title unchanged |
| Engagements requirement arrow | nav `الارتباطات`; title `المشاركات` | nav/title `المشاركات` |
| PERSONS | AR nav `الأشخاص`; AR title `جهات الاتصال الرئيسية`; EN `Key Contacts` | AR nav/title `الأشخاص`; EN `Persons` |
| POSITIONS | nav `المواقف`; title `مكتبة المواقف` | **NO EDIT** |
| DASHBOARD | nav `نظرة عامة على لوحة الدوسيهات`; title `لوحة الملفات` | nav/title `لوحة الدوسيهات` |
| Intake collision | intake title `قائمة الانتظار` | intake nav/title `قائمة الاستقبال`; waiting queue retains `قائمة الانتظار` |
| MoUs | H1 used generic `common:mous.title` | H1 uses `common:mous.pageTitle` / `مذكرات التفاهم` |

The three value-locked escalations are admin, task queue, and new event. They remain visible for
the overseer and are not counted among the 25 agreements.

## Bounds and later ownership

The two planning artifacts are this task's entire write population. Every source, locale, test,
script, ROADMAP/REQUIREMENTS row flip, and overseer close-out act is outside it.

- P99-40 remains the rendered-battery owner after P99-39 can land; P99-41 remains the D-38 human
  sign-off owner. No checkpoint answer exists in this worker's record.
- Phase 102 retains D-21's wholesale working dot-to-colon tail, COPY-09's three named literals,
  EDGECOPY-01, and GUIDE-HOLLOW-01.
- Phase 103 retains the 39 criterion-1 members triaged by reading.
- Arabic naturalness beyond the ruled glossary remains the operator's review.
- The nav-title checker retains the three overseer escalations.
- `positions:draftBanner` and the other P99-13/P99-43 named `common` handoffs remain explicitly
  outside this static close. The later source lanes closed the double-prefixed authoring queue;
  this task's fresh strict, dynamic, and resolution zeros show no AR-04 residue from it.

## Scope and whitespace gate

Command:

```sh
git diff --check; ST=$?; PATHS=$(git status --short | sed 's/^...//' | sort); EXPECTED=$(printf '%s\n' '.planning/phases/99-arabic-coverage/99-39-SUMMARY.md' '.planning/phases/99-arabic-coverage/99-VERIFICATION.md' | sort); test "$PATHS" = "$EXPECTED"; SC=$?; printf 'DIFF_CHECK_EXIT=%s\nSCOPE_EXIT=%s\n%s\n' "$ST" "$SC" "$PATHS"; test "$ST" -eq 0 -a "$SC" -eq 0
```

Verbatim output:

```text
DIFF_CHECK_EXIT=0
SCOPE_EXIT=0
.planning/phases/99-arabic-coverage/99-39-SUMMARY.md
.planning/phases/99-arabic-coverage/99-VERIFICATION.md
```

## Exact unblock condition

The owner of PID 95414 must release TCP 5173. Then the unchanged typed gate must collect 8 and 10,
execute all 18, match `(^|[^0-9])18 passed` (not anchored at line start and not matching 118), and
observe Playwright exit 0. After that, rerun the static plan oracle and the completion-contract
negative/live pair, change this front-matter to `status: complete`, and record the new outputs.
