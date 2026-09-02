---
phase: 99-arabic-coverage
plan: 39
status: blocked
attempt: 3
head: 7101b876bfbfb444dab5ab71b0d95007c10568ce
recorded_at_local: 2026-09-02T05:15:15+03:00
recorded_at_utc: 2026-09-02T02:15:15Z
---

# P99-39 Summary — static battery green, rendered gate blocked

## Outcome

Attempt 3 of this task re-ran every evidence command in this record; the blocker is unchanged.
The static battery is green. This task is **not complete** and the front-matter intentionally
does not say `status: complete`: the plan-owned rendered oracle exited 3 before Playwright
execution because PID 95414 holds port 5173 from the main checkout's `frontend` directory,
outside this worktree. RULING-P99-537 requires exactly that refusal. I did not terminate the
process, reuse it, disguise its cwd, or substitute an alternate-port run.

The holder's provenance is established in section 14. It was spawned at 04:37:35 local by this
tickmarkr run's own baseline pass, which executed this task's rendered oracle in the main checkout
before any worker was dispatched (section 15). The oracle invokes Playwright ad hoc, so the
config's `pw-run-reaped.mjs --lease-exec` wrapper ran unleased and detached, and the dev server
outlived the baseline. Attempts 0, 1, 2, and this one have all refused the same holder.
Terminating a process in the main checkout is outside this task's authority; release rests with
the harness operator, and the structural fix is a plan-text change named under the unblock
condition.

The typed gate's collection controls reached the required 8 and 10 populations before the port
guard. Because execution never began, there is no `18 passed` result, no fresh 8/8 or 10/10 result,
and no fresh three-banner-state result. Criteria 2 and 3 remain red by missing execution. D-38 is
also not answered by this worker; P99-41 remains the human-checkpoint owner.

This record applies **RULING-P99-538**. Every command whose output is evidence for a criterion,
control, instrument, population, or blocker appears below with verbatim output. Commands used only
to navigate or read are listed by command and purpose without embedding their read output. No
prior SUMMARY output is presented as a fresh green. The outputs in sections 1 to 11 were produced
in attempt 1 and re-produced byte-identically in attempt 3 by the comparator in section 13; the
comparator's own two DIFF rows (provenance and scope) are its discriminating control.

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
| attempt-3 comparator over all 20 recorded pairs | 18 SAME (every instrument, control, gate) / 2 DIFF (provenance, scope) as expected |
| holder provenance census (attempt 3) | ESTABLISHED: baseline-spawned under the harness session environment, main checkout, zero established connections |

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

Attempt 3 re-ran this exact command from 05:13:40 to 05:13:41 local (02:13:40Z); the output and
exit status were identical (section 13, row 15).

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

Verbatim output at the attempt-3 evidence timestamp:

```text
7101b876bfbfb444dab5ab71b0d95007c10568ce
LOCAL=2026-09-02T05:15:15+0300 +03
UTC=2026-09-02T02:15:15Z
```

The UTC conversion is three hours behind Asia/Riyadh and remains on 2026-09-02. `head` is the
tree the evidence was taken against; this record's own commit is that sha's child, so
`git show <head>:<path>` shows the previous record, not this one. Attempt 1 took its evidence at
`e2a21dc853b8c66b6769b7de7838427201ccf6b0` on 2026-09-02T01:46:11Z.

### 13. Attempt-3 freshness comparator over every recorded evidence pair

Command (the comparator source is embedded so the run is reproducible; it pairs every
`Command:` + ```sh block in this file with the ```text block that follows it, re-runs the command
with `bash -c` in the worktree, and reports SAME only when stdout+stderr equals the recorded
block byte for byte; the launcher is fenced as text so the comparator does not re-pair itself):

```text
S=<scratchpad>; W="$PWD"; S="$S" W="$W" python3 "$S/rerun.py"
```

```python
import re,subprocess,os
S=os.environ['S']; W=os.environ['W']
doc=open(f'{W}/.planning/phases/99-arabic-coverage/99-39-SUMMARY.md',encoding='utf-8').read()
heads=sorted([(m.start(),m.group(1)) for m in re.finditer(r'^#{2,3} (.+)$',doc,re.M)])
def head_for(pos):
    h=None
    for p,t in heads:
        if p<=pos: h=t
    return h
n=0; report=[]
for m in re.finditer(r'^Command[^\n]*:\n\n```sh\n(.*?)\n```\n\n(?:Verbatim output[^\n]*)\n\n```text\n(.*?)\n```',doc,re.M|re.S):
    n+=1
    cmd,rec=m.group(1),m.group(2)
    r=subprocess.run(['bash','-c',cmd],cwd=W,capture_output=True,text=True)
    got=(r.stdout+r.stderr).rstrip('\n')
    report.append((n,head_for(m.start()),r.returncode,'SAME' if got==rec.rstrip('\n') else 'DIFF',len(got.splitlines())))
for n,h,rc,st,ln in report:
    print(f'{n:02d} rc={rc} {st:4s} lines={ln:4d}  {h}')
print('pairs=',n)
```

Verbatim output (run at 05:14 local against the record as it stood before this attempt's edits):

```text
01 rc=0 SAME lines=   6  1. Nav-title control, then live 28-row population
02 rc=0 SAME lines=   5  1. Nav-title control, then live 28-row population
03 rc=0 SAME lines=  23  2. Glossary control, live verdict, then every-row census
04 rc=0 SAME lines=   2  2. Glossary control, live verdict, then every-row census
05 rc=0 SAME lines=  28  2. Glossary control, live verdict, then every-row census
06 rc=0 SAME lines=  67  3. Strict audit self-check, then live bilingual population
07 rc=0 SAME lines=  58  3. Strict audit self-check, then live bilingual population
08 rc=0 SAME lines=   5  4. Dynamic-prefix mask control, then live zero
09 rc=0 SAME lines=   2  4. Dynamic-prefix mask control, then live zero
10 rc=0 SAME lines=   7  5. Resolution negative/positive control first, then live routings
11 rc=0 SAME lines=  33  5. Resolution negative/positive control first, then live routings
12 rc=0 SAME lines=   2  6. Date-format exemption control, then live scan
13 rc=0 SAME lines=   2  6. Date-format exemption control, then live scan
14 rc=0 SAME lines=   4  7. Completion-contract negative control
15 rc=3 SAME lines=   1  8. Plan-owned typed rendered gate
16 rc=0 SAME lines= 102  9. Exact plan-owned static gate
17 rc=0 SAME lines=   3  10. Live completion-contract result after the blocked SUMMARY existed
18 rc=0 SAME lines=   1  11. Final non-mutating port recheck
19 rc=0 DIFF lines=   3  12. Provenance
20 rc=1 DIFF lines=   2  Scope and whitespace gate
pairs= 20
```

Rows 1 to 18 are every instrument, control, gate, and port recheck in this record: each re-ran in
this attempt and matched its recorded output exactly, with the recorded exit status (row 15 is
the rendered gate at exit 3; row 16 is the static gate at exit 0). Rows 19 and 20 differ because
HEAD and the clock moved and because no file had changed yet when the comparator ran; those two
expected DIFF rows show the comparator is capable of reporting a difference.

### 14. Holder provenance census (attempt 3)

Command:

```sh
( echo "# ps"; ps -o pid,ppid,tty,lstart,command -p 95315,95414 | sed -E 's#/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/node_modules/[^ ]*vite/bin/vite.js#<main>/frontend/node_modules/.../vite/bin/vite.js#'; echo "# lsof cwd"; for p in 95315 95414; do printf '%s cwd=' "$p"; lsof -a -p "$p" -d cwd -Fn 2>/dev/null | grep '^n' | cut -c2-; done; echo "# env subset of 95315 (tokens and bridge ids deliberately omitted)"; ps -E -o command -p 95315 | tr ' ' '\n' | grep -E '^(CLAUDECODE|CLAUDE_CODE_SESSION_ID|CLAUDE_CODE_CHILD_SESSION|CLAUDE_CODE_ENTRYPOINT|INIT_CWD|NODE_ENV|npm_lifecycle_event|npm_command|TERM_PROGRAM|SHLVL)=' | sort; echo "# tickmarkr daemon 7125 env subset"; ps -E -o command -p 7125 | tr ' ' '\n' | grep -E '^(CLAUDE_CODE_SESSION_ID|TERM_PROGRAM|PWD)=' | sort; echo "# this worker"; env | grep -E '^(CLAUDE_CODE_SESSION_ID|TICKMARKR_PANE_IDENTITY)=' | sort; echo "# established connections to 95414"; lsof -a -p 95414 -iTCP -sTCP:ESTABLISHED 2>/dev/null | grep -c . )
```

Verbatim output:

```text
# ps
  PID  PPID TTY      STARTED                      COMMAND
95315     1 ??       Wed Sep  2 04:37:35 2026     node /opt/homebrew/bin/pnpm run dev
95414 95315 ??       Wed Sep  2 04:37:35 2026     node <main>/frontend/node_modules/.../vite/bin/vite.js
# lsof cwd
95315 cwd=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
95414 cwd=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend
# env subset of 95315 (tokens and bridge ids deliberately omitted)
CLAUDECODE=1
CLAUDE_CODE_CHILD_SESSION=1
CLAUDE_CODE_ENTRYPOINT=cli
CLAUDE_CODE_SESSION_ID=7612e2e5-873e-4698-be3e-e02b08bac89a
INIT_CWD=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0
NODE_ENV=development
SHLVL=6
TERM_PROGRAM=WarpTerminal
npm_command=run-script
npm_lifecycle_event=dev
# tickmarkr daemon 7125 env subset
CLAUDE_CODE_SESSION_ID=7612e2e5-873e-4698-be3e-e02b08bac89a
PWD=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0
TERM_PROGRAM=WarpTerminal
# this worker
CLAUDE_CODE_SESSION_ID=6b33b6e5-11e6-4a41-b596-6d52166ede0a
TICKMARKR_PANE_IDENTITY=worker · P99-39 · attempt 3 · run-20260902-012826-0000000000000070
# established connections to 95414
0
```

The holder's full environment also carries a Claude Code messaging token and a bridge session id.
Both keys are filtered out of the grep above because printing a live token into a tracked file is
the hazard; nothing else is omitted. What the census establishes: both processes were born at
04:37:35 local, are orphaned (ppid 1, no TTY), sit in the main checkout's `frontend`, and carry
the same `CLAUDE_CODE_SESSION_ID` as the tickmarkr daemon (PID 7125), not this worker's. They were
started by a `pnpm` invoked from the main checkout root (`INIT_CWD`) with `NODE_ENV=development`,
which is the Playwright `webServer` command in `playwright.config.ts`. No client is connected.

### 15. Harness journal projection for this run

Command (a field projection of this run's `journal.jsonl` in the main checkout, read only; raw lines embed full oracle text and are not reproduced; every printed line is right-stripped so no trailing whitespace enters this file):

```sh
RUN=/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/runs/run-20260902-012826-0000000000000070; python3 - "$RUN/journal.jsonl" <<'EOF'
import json,sys
for line in open(sys.argv[1]):
    e=json.loads(line); ev=e["event"]; t=e.get("taskId"); d=e.get("data",{})
    if ev=="run-start": s=" ".join(map(str,[e["ts"],ev,"pid=",d.get("pid"),"baseRef=",d.get("baseRef")]))
    elif ev=="baseline-warning" and t=="P99-39": s=" ".join(map(str,[e["ts"],ev,t,"kind=",d.get("kind"),"oracles=",len(d.get("oracles",[])),"reason=",d.get("reason","")[:110]+"..."]))
    elif ev in("task-dispatch","worker-result","gate-result","escalation","review-retry") and t=="P99-39":
        extra=d.get("summary") or d.get("details") or d.get("step") or ""
        s=" ".join(map(str,[e["ts"],ev,t,"attempt=",d.get("attempt"),d.get("gate",""),str(extra)[:150]]))
    else: continue
    print("\n".join(l.rstrip() for l in s.rstrip().split("\n")))
EOF
```

Verbatim output (timestamps are UTC; add three hours for Asia/Riyadh):

```text
2026-09-02T01:30:35.994Z run-start pid= 7125 baseRef= e2a21dc853b8c66b6769b7de7838427201ccf6b0
2026-09-02T01:39:15.264Z baseline-warning P99-39 kind= vacuous-oracle oracles= 2 reason= vacuous acceptance oracle on P99-39: already passes before any work exists — $ PATH="/opt/homebrew/bin:$PATH";...
2026-09-02T01:39:17.330Z task-dispatch P99-39 attempt= 0
2026-09-02T01:41:15.192Z worker-result P99-39 attempt= None  The mandated rendered gate cannot run against a foreign port holder, and the required D-38 human sign-off remains absent.
2026-09-02T01:41:15.333Z gate-result P99-39 attempt= 0 evidence no commits — worker claimed work but committed nothing
2026-09-02T01:41:15.348Z escalation P99-39 attempt= 1  retry
2026-09-02T01:41:15.367Z task-dispatch P99-39 attempt= 1
2026-09-02T01:54:32.329Z worker-result P99-39 attempt= None  Static proof is green, but the required rendered 18-testgate could not run because port 5173 is held by a foreign checkout.
2026-09-02T01:55:00.600Z gate-result P99-39 attempt= 1 build exit 0
2026-09-02T01:55:11.190Z gate-result P99-39 attempt= 1 lint exit 0
2026-09-02T01:55:11.220Z gate-result P99-39 attempt= 1 evidence 1 commit(s):
.../phases/99-arabic-coverage/99-39-SUMMARY.md     | 738 +++++++++++++++++++++
 .../phases/99-arabic-coverage/99-VERIFICATION.md   | 140
2026-09-02T01:55:11.239Z gate-result P99-39 attempt= 1 scope all 2 changed files in scope
2026-09-02T01:55:43.147Z gate-result P99-39 attempt= 1 test exit 1 but only pre-existing failures (forgiven)
2026-09-02T01:55:45.778Z gate-result P99-39 attempt= 1 acceptance oracle failed: $ PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" || exit 3; for spec in tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.
2026-09-02T02:00:17.792Z gate-result P99-39 attempt= 1 review review re-route: kimi:kimi-code/k3 produced no parseable verdict; replaced by claude-code:fable
reviewer claude-code:fable (anthropic): requested chan
2026-09-02T02:00:17.792Z review-retry P99-39 attempt= None review
2026-09-02T02:00:17.811Z escalation P99-39 attempt= 2  retry
2026-09-02T02:00:17.824Z task-dispatch P99-39 attempt= 2
2026-09-02T02:01:58.522Z worker-result P99-39 attempt= None  Rendered proof cannot execute until the foreign main-checkout process releases TCP 5173.
2026-09-02T02:02:24.987Z gate-result P99-39 attempt= 2 build exit 0
2026-09-02T02:02:34.755Z gate-result P99-39 attempt= 2 lint exit 0
2026-09-02T02:02:34.786Z gate-result P99-39 attempt= 2 evidence 2 commit(s):
.../phases/99-arabic-coverage/99-39-SUMMARY.md     | 738 +++++++++++++++++++++
 .../phases/99-arabic-coverage/99-VERIFICATION.md   | 140
2026-09-02T02:02:34.804Z gate-result P99-39 attempt= 2 scope all 2 changed files in scope
2026-09-02T02:03:05.842Z gate-result P99-39 attempt= 2 test exit 1 but only pre-existing failures (forgiven)
2026-09-02T02:03:08.397Z gate-result P99-39 attempt= 2 acceptance oracle failed: $ PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R" || exit 3; for spec in tests/e2e/99-ar02-dates.spec.ts tests/e2e/99-ar03-leak.spec.
2026-09-02T02:07:13.462Z gate-result P99-39 attempt= 2 review reviewer claude-code:fable (anthropic): requested changes (2 material)
- [material] Acceptance criteria 2 and 3 (99-ar02 8/8 and 99-ar03 10/10 execute
2026-09-02T02:07:13.489Z escalation P99-39 attempt= 3  escalate
2026-09-02T02:07:14.017Z task-dispatch P99-39 attempt= 3
```

The run started its baseline pass at 01:30:35Z with the daemon at PID 7125 and base ref
`e2a21dc85`. The holder was born at 01:37:35Z (04:37:35 local), inside that pass. At 01:39:15Z the
baseline recorded P99-39's rendered oracle as "already passes before any work exists", which is
only possible if the baseline executed that oracle to a green 18/18 in the main checkout; the
port guard found 5173 free at that moment, Playwright started the `webServer`, and the server
survived Playwright's exit. Two seconds later attempt 0 was dispatched, and every attempt since
has refused that same holder. That baseline green is the harness's measurement in the main
checkout at the base ref; it is recorded here as provenance only and is not claimed as this
task's own gate result. This projection grows as the journal grows, so a later comparator run is
expected to report it DIFF by exactly the events appended after this attempt.

### 16. Rendered population re-derivation (attempt 3)

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; cd "$R"; C2=$(pnpm exec playwright test tests/e2e/99-ar02-dates.spec.ts --project=chromium-en --no-deps --list 2>/dev/null | command grep -c "99-ar02-dates.spec.ts:"); C3=$(pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>/dev/null | command grep -c "99-ar03-leak.spec.ts:"); echo "C2=$C2 C3=$C3"; pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts --project=chromium-en --no-deps --list 2>/dev/null | command grep -E "banner|Total"
```

Verbatim output:

```text
C2=8 C3=10
  [chromium-en] › 99-ar03-leak.spec.ts:228:5 › UI99-C7 ar banner under_review
  [chromium-en] › 99-ar03-leak.spec.ts:232:5 › UI99-C7 ar banner approved
  [chromium-en] › 99-ar03-leak.spec.ts:236:5 › UI99-C7 ar banner published
Total: 10 tests in 1 file
```

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
  had already refused it. In attempt 1 `ps` returned `operation not permitted`; in attempt 3 `ps`
  worked and its evidence is in section 14. No process state changed in either attempt.
- Attempt 3: `ps -o ppid= -p <pid>` walked from the daemon's shell (7119) up through
  `claude --resume 7612e2e5-…` (3145), `-zsh`, and `herdr server` — establishes that the daemon and
  the holder share the overseer session's environment.
- Attempt 3: `grep -nE 'detached|setsid|unref\(|lease-exec|PW_LEASE' scripts/pw-run-reaped.mjs` —
  locates the `detached: true` spawn (line 1925) and the "PW_LEASE_* env absent — running
  UNLEASED (ad-hoc invocation)" branch (line 1711) that explain why the baseline's server
  outlived Playwright.
- Attempt 3: `grep -nE '"dev"' <main>/package.json` — confirms the root `dev` script starts the
  frontend through turbo, which is why a root-invoked `pnpm run dev` holds `frontend` as its cwd.
- Attempt 3: `python3` over the run's `baseline.json` and `journal.jsonl` — read event types and
  the P99-08 and P99-39 baseline warnings; the projection that is evidence is section 15.
- Attempt 3: `grep -c 'pnpm run dev'` over the overseer session transcript — zero hits, so the
  spawn was not a typed command; it came from an oracle the harness ran.

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

Immediate release: the harness operator terminates PID 95315 (`pnpm run dev`, ppid 1) and its
child PID 95414 (vite), both rooted in the main checkout's `frontend`, with zero established
connections at the census. Then the unchanged typed gate must collect 8 and 10, execute all 18,
match `(^|[^0-9])18 passed` (not anchored at line start and not matching 118), and observe
Playwright exit 0. After that, rerun the static plan oracle and the completion-contract
negative/live pair, change this front-matter to `status: complete`, and record the new outputs.

Structural: the same leak recurs from the first green run of this oracle in any tree, because the
oracle invokes Playwright ad hoc and the config's lease writer then runs unleased and detached.
Once P99-39's own gate runs green in its worktree, the leaked server would be rooted in this
worktree and therefore foreign to the P99-40 and P99-41 gates that run the same specs. The
in-repo fix is to route the oracle through `scripts/pw-run-reaped.mjs --` (RUN mode, which mints
a lease and reaps its own server) as P99-08's oracle already does, or to reap after the baseline
pass. Either is a plan-text or engine change outside this task's write scope and needs a ruling.
