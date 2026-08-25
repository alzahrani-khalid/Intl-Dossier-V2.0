# P99-22 — 28-row nav-title walk

## Outcome

**GREEN static contract: 28/28 rows adjudicated.** Twenty-five pairs carry the same
sense-consistent object term. The 15-row extension also exposed three disagreements for which no
ruling exists; as required by RULING-P99-05 §3, those rows are exact-value-locked escalations rather
than invented repairs. The checker keeps each row `agrees: false`, prints it, and exits 0 only while
its two live candidate values match the committed escalation record. An unrecorded mismatch or any
candidate drift returns the checker to RED. The three `common.json` repairs and the separate MoUs
page-title/table-header contract are enforced in the same exit predicate.

The blocked pairs are:

| Nav row    | Nav anchor/value                               | Rendered title anchor/value                                                  | Required ruling                                  |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| Admin      | `common:navigation.admin` = `الإدارة`          | `/admin` redirects to `ai-admin:settings.title` = `إعدادات الذكاء الاصطناعي` | Administration vs AI Settings                    |
| Task Queue | `common:navigation.taskQueue` = `قائمة المهام` | `assignments:queue.title` = `قائمة انتظار التعيينات`                         | task vs assignment (product-distinct under D-18) |
| New Event  | `common:navigation.newEvent` = `فعالية جديدة`  | `calendar:new_event.title` = `إدخال تقويم جديد`                              | event vs calendar entry                          |

These rows carry `disposition: "escalate-unruled"` in
`scripts/glossary-senses.d/tiebreaks.json`; the overseer still owns their eventual product ruling.

## Population (D-04 / D-05)

Command:

```text
node - <<'NODE'
const fs=require('fs');const src=fs.readFileSync('frontend/src/components/modern-nav/navigationData.ts','utf8');const labels=[...src.matchAll(/\blabelKey:\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);console.log(`NAVIGATION_ITEMS=${labels.length}`);console.log(`UNIQUE_LABEL_KEYS=${new Set(labels).size}`);console.log(labels.join('\n'));
NODE
```

Verbatim output:

```text
NAVIGATION_ITEMS=28
UNIQUE_LABEL_KEYS=28
navigation.dashboardOverview
navigation.countries
navigation.organizations
navigation.forums
navigation.persons
navigation.engagements
navigation.workingGroups
navigation.positions
navigation.mous
navigation.briefs
navigation.tasks
navigation.taskQueue
navigation.intake
navigation.taskEscalations
navigation.calendar
navigation.events
navigation.newEvent
navigation.reports
navigation.scheduledReports
navigation.analytics
navigation.intelligence
navigation.monitoring
navigation.dataLibrary
navigation.wordAssistant
navigation.users
navigation.settings
navigation.help
navigation.admin
```

Population: the 28 `NavigationItem.labelKey` declarations in
`frontend/src/components/modern-nav/navigationData.ts`, each paired to the heading actually
rendered by its route. Outside: the six category `tooltipKey` declarations, secondary/legacy nav
systems, detail routes, dossier-hub-only entries, and every non-title translation.

Changed-path population before this summary:

```text
frontend/src/i18n/ar/common.json
frontend/src/i18n/ar/dashboard.json
frontend/src/i18n/ar/intake.json
frontend/src/i18n/ar/persons.json
frontend/src/i18n/en/common.json
frontend/src/i18n/en/persons.json
frontend/src/pages/MoUs/MousPage.tsx
scripts/glossary-senses.d/tiebreaks.json
scripts/nav-title-agreement.mjs
```

Outside: every path not permitted by P99-22's fixed allowlist. No out-of-scope tracked path changed.

## The 15 walked anchors

| Nav key                       | Route title source                                         | Title anchor/value at execution                                                  |
| ----------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `navigation.events`           | `pages/events/EventsPage.tsx`                              | `common:navigation.events` = `الفعاليات`                                         |
| `navigation.reports`          | `pages/reports/ReportsPage.tsx`                            | `common:navigation.reports` = `التقارير`                                         |
| `navigation.scheduledReports` | `components/scheduled-reports/ScheduledReportsManager.tsx` | `scheduled-reports:title` = `التقارير المجدولة`                                  |
| `navigation.analytics`        | `pages/analytics/AnalyticsDashboardPage.tsx`               | `analytics:title` = `لوحة التحليلات`                                             |
| `navigation.intelligence`     | `pages/intelligence/IntelligencePage.tsx`                  | `common:navigation.intelligence` = `الاستخبارات`                                 |
| `navigation.monitoring`       | `pages/monitoring/Dashboard.tsx`                           | source literal `Monitoring Dashboard` (same object, separate AR-03 leakage lane) |
| `navigation.dataLibrary`      | `pages/data-library/DataLibraryPage.tsx`                   | `common:navigation.dataLibrary` = `مكتبة البيانات`                               |
| `navigation.wordAssistant`    | `pages/word-assistant/WordAssistantPage.tsx`               | `common:navigation.wordAssistant` = `مساعد الوثائق`                              |
| `navigation.users`            | `pages/users/UsersListPage.tsx`                            | `user-management:usersList.title` = `قائمة المستخدمين`                           |
| `navigation.settings`         | `components/settings/SettingsLayout.tsx`                   | `settings:pageTitle` = `الإعدادات`                                               |
| `navigation.help`             | `pages/help/HelpPage.tsx`                                  | source literal `كيف يمكننا مساعدتك؟`                                             |
| `navigation.admin`            | redirect target `routes/_protected/admin/ai-settings.tsx`  | `ai-admin:settings.title` = `إعدادات الذكاء الاصطناعي` — **ESCALATED**           |
| `navigation.taskQueue`        | `pages/AssignmentQueue.tsx`                                | `assignments:queue.title` = `قائمة انتظار التعيينات` — **ESCALATED**             |
| `navigation.taskEscalations`  | `pages/Escalations.tsx`                                    | `assignments:escalations.title` = `التصعيدات`                                    |
| `navigation.newEvent`         | `routes/_protected/calendar/new.tsx`                       | `calendar:new_event.title` = `إدخال تقويم جديد` — **ESCALATED**                  |

The checker also verifies the 28 row keys are a bijection with the live 28-item population; deleting
a mismatch or replacing it with a duplicate cannot earn green.

## D-19 reversal record and applied rulings

| Decision                      | Before                                                                            | After                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Countries requirement arrow   | nav `البلدان`; title `نظرة عامة على الدول`                                        | nav `الدول`; title unchanged                                                                          |
| Engagements requirement arrow | nav `الارتباطات`; title `المشاركات`                                               | nav `المشاركات`; title unchanged                                                                      |
| PERSONS tie-break             | AR nav `الأشخاص`; AR title `جهات الاتصال الرئيسية`; EN title `Key Contacts`       | AR nav/title `الأشخاص`; EN title `Persons`                                                            |
| POSITIONS tie-break           | nav `المواقف`; title `مكتبة المواقف`                                              | **NO EDIT** to either anchor                                                                          |
| DASHBOARD tie-break           | nav `نظرة عامة على لوحة الدوسيهات`; title `لوحة الملفات`                          | nav/title `لوحة الدوسيهات`                                                                            |
| Intake collision              | nav `قائمة الاستقبال`; title `قائمة الانتظار`                                     | nav/title `قائمة الاستقبال`; waiting-queue vocabulary retained                                        |
| MoUs mis-anchor               | page used `navigation.mous`; `common:mous.title` is the generic table-header copy | H1 uses `common:mous.pageTitle` = `MoUs` / `مذكرات التفاهم`; `mous.title` remains `Title` / `العنوان` |

Queue census command and verbatim output:

```text
for rev in 52b8a6fb4 HEAD; do for term in قائمة_الانتظار قائمة_الاستقبال; do value=${term//_/ }; count=$(git grep -o "$value" "$rev" -- frontend/src/i18n/ar 2>/dev/null | wc -l | tr -d ' '); files=$(git grep -l "$value" "$rev" -- frontend/src/i18n/ar 2>/dev/null | wc -l | tr -d ' '); echo "$rev $term occurrences=$count files=$files"; done; done

52b8a6fb4 قائمة_الانتظار occurrences=15 files=3
52b8a6fb4 قائمة_الاستقبال occurrences=3 files=2
HEAD قائمة_الانتظار occurrences=14 files=2
HEAD قائمة_الاستقبال occurrences=4 files=2
```

Population: exact string occurrences in tracked `frontend/src/i18n/ar/**` bundle files. Outside:
source code, tests, untracked/ignored files, other spellings, and semantic uses not byte-equal to
either string. The one intake-title replacement accounts for the delta; waiting terminology remains.

Tie-break oracle:

```text
TIEBREAK-OK
```

## Conjunctive `common.json` repair

Only key-level edits landed in the locale pair. No consumer was changed for these three repairs;
99-43 can retarget its tests onto these exact existing keys.

```text
en tasks.sla.approaching="Approaching"
en afterActions.decisions.item="Decision {{number}}"
en afterActions.confidence="{{value}}% confidence"
ar tasks.sla.approaching="يقترب الموعد النهائي"
ar afterActions.decisions.item="القرار {{number}}"
ar afterActions.confidence="{{value}}٪ درجة ثقة"
COMMON-CONJUNCTION-OK
```

The live nav checker validates all six locale/key clauses in the same exit predicate as nav/title
agreement, so neither half can pass independently.

The MoUs regression repair is also fail-closed in that predicate:

```text
en mous.title="Title"
en mous.pageTitle="MoUs"
ar mous.title="العنوان"
ar mous.pageTitle="مذكرات التفاهم"
H1=t('common:mous.pageTitle')
MOU-TITLE-SPLIT-OK
```

## Checker evidence

Control command:

```text
node scripts/nav-title-agreement.mjs "$PWD" --control
```

Verbatim output:

```json
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
```

Row-count/live JSON projection:

```text
NAV-ROWS=28
AGREEMENTS=25
ESCALATIONS=3
ADJUDICATED=28
UNRULED-MISMATCHES=0
navigation.admin | الإدارة | إعدادات الذكاء الاصطناعي
navigation.taskQueue | قائمة المهام | قائمة انتظار التعيينات
navigation.newEvent | فعالية جديدة | إدخال تقويم جديد
```

Live human output:

```text
nav/title walk: 28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue
ESCALATED-UNRULED OBJECT-TERM MISMATCH common:navigation.admin="الإدارة" ai-admin:settings.title="إعدادات الذكاء الاصطناعي" ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH common:navigation.taskQueue="قائمة المهام" assignments:queue.title="قائمة انتظار التعيينات" ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH common:navigation.newEvent="فعالية جديدة" calendar:new_event.title="إدخال تقويم جديد" ruled=فعالية جديدة
NAV-28-OK
```

The planted control and live command both exit 0. Escalation is not reported as agreement; it is a
separate adjudicated state whose exact candidates are validated against the decision artifact.

## Rendered UI99-C6 re-proof

The browser proof now executes and is green. The worktree sandbox still denies a localhost
listener, so the run used a production build of the current frontend in `/tmp`, Playwright request
routing to serve that build without a socket, deterministic auth/profile/empty-intake responses,
and Chromium's `--single-process --no-zygote` mode. Those are harness-only accommodations: no
repository test, consumer, or generated file was edited. The otherwise-unrelated UI99-C7
`beforeAll` position seed was replaced in the temporary copy because Playwright runs file hooks
even when `--grep UI99-C6` excludes every C7 test.

The temporary spec was copied mechanically from the committed
`tests/e2e/99-ar03-leak.spec.ts`; only its four harness import paths changed. The complete test
body from line 10 onward is byte-identical, proven before the run:

```text
c3a0827d83b68b63a497eb3709c527b36fb2db4d  /dev/fd/11
c3a0827d83b68b63a497eb3709c527b36fb2db4d  /dev/fd/12
```

List/count command selected the canonical pair:

```text
Listing tests:
  [chromium-en] › ../../private/tmp/p99-22-ui99c6-suite/99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue
  [chromium-en] › ../../private/tmp/p99-22-ui99c6-suite/99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue
Total: 2 tests in 1 file
```

Rendered run result:

```text
Running 2 tests using 2 workers
  ✓  1 [chromium-en] › ../../../../../../../../private/tmp/p99-22-ui99c6-suite/99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue (4.2s)
  ✓  2 [chromium-en] › ../../../../../../../../private/tmp/p99-22-ui99c6-suite/99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue (4.2s)

  2 passed (4.5s)
```

The rendered Arabic probe used the same built artifact and deterministic responses. It proves the
retitled surface itself, not just collection: the root locale/direction are Arabic/RTL, the first
main heading is `قائمة الاستقبال`, and the label population is 38 against UI99-C6's committed
floor of 34. Verbatim probe output:

```text
INTAKE_URL http://p99.local/my-work/intake?lng=ar
ROOT ar rtl
MAIN_COUNT 1
MAIN_TEXT قائمة الاستقبال |  | مراجعة طلبات الاستقبال الواردة وتصنيفها |  | طلب استقبال جديد | طلبات الاستقبال بانتظار الفرز | 0 عناصر | لم تتم المزامنة | مراجع | لا توجد مراجعات معلقة
CAPTURE 38
```

This closes D-29 for the intake retitle: both language legs actually rendered and passed, and the
Arabic surface independently exposed the repaired title in its hydrated DOM.

## Commits and validation

```text
095256f75 fix(i18n): align ruled navigation title terms
0185d484f feat(i18n): extend nav title walk to 28 rows
6df654ded docs(phase-99): record nav title walk escalation
this commit: fix(i18n): close nav title repair findings
```

Both commit hooks completed staged ESLint/Prettier and the repository build successfully. Additional
checks completed: JSON parse for every edited bundle and the decision artifact, `node --check` for
the checker, `prettier --write` for the checker/artifact, and `git diff --check`.

## Handoff

- **OVERSEER:** rule the three enumerated disagreements above. Until then the correct state under
  RULING-P99-05 is 25 semantic agreements plus three explicitly non-agreeing, value-locked
  escalations; none has been silently repaired.
- **99-43:** retarget DecisionList/SLAIndicator collateral tests onto the repaired
  `common:afterActions.*` and `common:tasks.sla.approaching` copy authored here; author nothing.
- **Rendered closing lane:** the complete ten-test AR-03 battery remains 99-40's owner; this lane's
  two-test UI99-C6 obligation is executed and green above.
