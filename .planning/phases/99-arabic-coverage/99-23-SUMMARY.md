# P99-23 — ruled nav-title tie-breaks and queue collision

## Outcome

The ruled nav-title state is landed and is now proven by this task's six exact-title Vitest
oracles. The drilled checker reads all 28 navigation rows, re-reads the committed expected Arabic
label/title values in `scripts/glossary-senses.d/tiebreaks.json`, catches its planted mismatch, and
reports 25 sense-consistent agreements plus three value-locked, unrepaired overseer escalations.

The inherited lane already contained the ruled Arabic changes. This task closed its remaining
proof gap by value-locking every row, adding the acceptance tests to the checker itself, and aligning
the English MoUs nav label with its real page-title value (`MoUs`). No later lane task is needed for
these oracles.

## Population (D-04 / D-05)

Population: the 28 `NavigationItem.labelKey` declarations in
`frontend/src/components/modern-nav/navigationData.ts`, paired with the rendered heading source
recorded by the checker and decision artifact. Outside: six category tooltip keys, detail routes,
legacy/secondary navigation, every non-title translation, and Arabic naturalness beyond the ruled
rows.

Command:

```text
node scripts/nav-title-agreement.mjs "$PWD" --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log('NAV_ROWS='+r.rows.length);console.log('AGREEMENTS='+r.agreements);console.log('ESCALATIONS='+r.escalations);console.log('ADJUDICATED='+r.adjudicated);console.log('UNRULED_MISMATCHES='+r.mismatches);for(const x of r.rows)console.log(x.labelKey+' | '+x.label+' | '+x.titleAnchor+' | '+x.title+' | '+(x.agrees?'AGREES':'ESCALATED'))})"
```

Verbatim output:

```text
NAV_ROWS=28
AGREEMENTS=25
ESCALATIONS=3
ADJUDICATED=28
UNRULED_MISMATCHES=0
navigation.countries | الدول | countries:title | نظرة عامة على الدول | AGREES
navigation.engagements | المشاركات | engagements:title | المشاركات | AGREES
navigation.persons | الأشخاص | persons:title | الأشخاص | AGREES
navigation.positions | المواقف | positions:library.title | مكتبة المواقف | AGREES
navigation.mous | مذكرات التفاهم | common:mous.pageTitle | مذكرات التفاهم | AGREES
navigation.intake | قائمة الاستقبال | intake:queue.title | قائمة الاستقبال | AGREES
navigation.dashboardOverview | لوحة الدوسيهات | dashboard:title | لوحة الدوسيهات | AGREES
navigation.organizations | المنظمات | organizations:title | المنظمات والتفويضات | AGREES
navigation.forums | المنتديات | forums:pageTitle | المنتديات | AGREES
navigation.workingGroups | مجموعات العمل | working-groups:title | مجموعات العمل | AGREES
navigation.tasks | مكتبي | tasks-page:title | مكتبي | AGREES
navigation.calendar | التقويم | calendar:page.title | التقويم | AGREES
navigation.briefs | الملخصات | briefs-page:title | الملخصات | AGREES
navigation.events | الفعاليات | common:navigation.events | الفعاليات | AGREES
navigation.reports | التقارير | common:navigation.reports | التقارير | AGREES
navigation.scheduledReports | التقارير المجدولة | scheduled-reports:title | التقارير المجدولة | AGREES
navigation.analytics | التحليلات | analytics:title | لوحة التحليلات | AGREES
navigation.intelligence | الاستخبارات | common:navigation.intelligence | الاستخبارات | AGREES
navigation.monitoring | المراقبة | source:frontend/src/pages/monitoring/Dashboard.tsx | Monitoring Dashboard | AGREES
navigation.dataLibrary | مكتبة البيانات | common:navigation.dataLibrary | مكتبة البيانات | AGREES
navigation.wordAssistant | مساعد الوثائق | common:navigation.wordAssistant | مساعد الوثائق | AGREES
navigation.users | إدارة المستخدمين | user-management:usersList.title | قائمة المستخدمين | AGREES
navigation.settings | الإعدادات | settings:pageTitle | الإعدادات | AGREES
navigation.help | المساعدة | source:frontend/src/pages/help/HelpPage.tsx | كيف يمكننا مساعدتك؟ | AGREES
navigation.admin | الإدارة | ai-admin:settings.title | إعدادات الذكاء الاصطناعي | ESCALATED
navigation.taskQueue | قائمة المهام | assignments:queue.title | قائمة انتظار التعيينات | ESCALATED
navigation.taskEscalations | تصعيدات المهام | assignments:escalations.title | التصعيدات | AGREES
navigation.newEvent | فعالية جديدة | calendar:new_event.title | إدخال تقويم جديد | ESCALATED
```

The final 15 lines beginning at `navigation.events` are the 15 route-walked anchors that research
could not derive. Their source paths are also committed on the corresponding artifact rows. The
checker asserts a bijection between these 28 rows and the live navigation items, so deleting a row
or duplicating another cannot pass.

## OVERSEER escalations — deliberately unrepaired

RULING-P99-05 §3 forbids an invented title-wins policy. The walk found these three unruled pairs;
all remain `agrees: false`, their exact candidate values are locked in the artifact, and each is
escalated by name to the **OVERSEER**:

| Pair       | Navigation anchor/value                        | Rendered title anchor/value                            |
| ---------- | ---------------------------------------------- | ------------------------------------------------------ |
| Admin      | `common:navigation.admin` = `الإدارة`          | `ai-admin:settings.title` = `إعدادات الذكاء الاصطناعي` |
| Task Queue | `common:navigation.taskQueue` = `قائمة المهام` | `assignments:queue.title` = `قائمة انتظار التعيينات`   |
| New Event  | `common:navigation.newEvent` = `فعالية جديدة`  | `calendar:new_event.title` = `إدخال تقويم جديد`        |

No title, nav label, or source binding for these three pairs was repaired. A candidate-value drift
or any further unrecorded mismatch is not adjudicated and returns the checker to RED.

## D-19 reversal record

| Decision                      | Before                                                                      | After                                                               |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Countries requirement arrow   | nav `البلدان`; title `نظرة عامة على الدول`                                  | nav `الدول`; title unchanged                                        |
| Engagements requirement arrow | nav `الارتباطات`; title `المشاركات`                                         | nav/title `المشاركات`                                               |
| PERSONS tie-break             | AR nav `الأشخاص`; AR title `جهات الاتصال الرئيسية`; EN title `Key Contacts` | AR nav/title `الأشخاص`; EN title `Persons`                          |
| POSITIONS tie-break           | nav `المواقف`; title `مكتبة المواقف`                                        | **NO EDIT**                                                         |
| DASHBOARD tie-break           | nav `نظرة عامة على لوحة الدوسيهات`; title `لوحة الملفات`                    | nav/title `لوحة الدوسيهات`                                          |
| Intake collision              | nav `قائمة الاستقبال`; title `قائمة الانتظار`                               | nav/title `قائمة الاستقبال`; waiting queue remains `قائمة الانتظار` |
| MoUs title anchor             | H1 `common:mous.title`; generic copy `Title` / `العنوان`                    | H1 `common:mous.pageTitle`; page copy/nav `MoUs` / `مذكرات التفاهم` |

Every row now has a machine-checked `expected.labelAr` and `expected.titleAr`. The changed rows also
retain their `before`/`after` objects, positions retains the identical no-edit pair, and the three
unruled rows retain exact `candidates`.

## Queue collision — before and after

Population: exact leaf values in `ar/common.json` plus the discriminating `ar/intake.json`
`queue.title`. Outside: substring matches, other Arabic bundles, source code, and semantically
similar non-exact strings.

Command:

```text
node -e "const cp=require('child_process');const leaf=(v,t)=>v&&typeof v==='object'?Object.values(v).reduce((n,x)=>n+leaf(x,t),0):+(v===t);const read=(rev,p)=>JSON.parse(cp.execFileSync('git',['show',rev+':'+p],{encoding:'utf8'}));for(const [name,rev] of [['BEFORE','fe3658994^'],['AFTER','HEAD']]){const c=read(rev,'frontend/src/i18n/ar/common.json'),i=read(rev,'frontend/src/i18n/ar/intake.json');console.log(name+' sha='+cp.execFileSync('git',['rev-parse',rev],{encoding:'utf8'}).trim());console.log('common reception='+leaf(c,'قائمة الاستقبال')+' waiting='+leaf(c,'قائمة الانتظار'));console.log('navigation.intake='+c.navigation.intake);console.log('navigation.intakeQueue='+c.navigation.intakeQueue);console.log('navigation.waitingQueue='+c.navigation.waitingQueue);console.log('intake:queue.title='+i.queue.title)}"
```

Verbatim output:

```text
BEFORE sha=52b8a6fb4984c2827cc4a94eba149f26d166a8fa
common reception=2 waiting=2
navigation.intake=قائمة الاستقبال
navigation.intakeQueue=قائمة الاستقبال
navigation.waitingQueue=قائمة الانتظار
intake:queue.title=قائمة الانتظار
AFTER sha=9f0d682294e69f17b8738b1217b5b332861d2c74
common reception=2 waiting=2
navigation.intake=قائمة الاستقبال
navigation.intakeQueue=قائمة الاستقبال
navigation.waitingQueue=قائمة الانتظار
intake:queue.title=قائمة الاستقبال
```

The two pre-existing `قائمة الاستقبال` leaves in `ar/common.json` are unchanged, proving that mere
presence was never discriminating. The changed predicate is the intake namespace's own title.

## MoUs title split

Command:

```text
node -e "const fs=require('fs');for(const locale of ['en','ar']){const c=JSON.parse(fs.readFileSync('frontend/src/i18n/'+locale+'/common.json','utf8'));console.log(locale+' navigation.mous='+c.navigation.mous);console.log(locale+' mous.title='+c.mous.title);console.log(locale+' mous.pageTitle='+c.mous.pageTitle);if(c.navigation.mous!==c.mous.pageTitle)process.exitCode=1}const source=fs.readFileSync('frontend/src/pages/MoUs/MousPage.tsx','utf8');const anchor=source.match(/<h1[^>]*>\\{(t\\('[^']+'\\))\\}<\\/h1>/)?.[1];console.log('MousPage H1='+anchor);if(anchor!==\"t('common:mous.pageTitle')\")process.exitCode=1;if(!process.exitCode)console.log('MOU-TITLE-ANCHOR-OK')"
```

Verbatim output:

```text
en navigation.mous=MoUs
en mous.title=Title
en mous.pageTitle=MoUs
ar navigation.mous=مذكرات التفاهم
ar mous.title=العنوان
ar mous.pageTitle=مذكرات التفاهم
MousPage H1=t('common:mous.pageTitle')
MOU-TITLE-ANCHOR-OK
```

## Conjunctive ruled-value oracle

The oracle names both demanded and forbidden values so a partial sweep cannot pass. Verbatim
output:

```text
dashboard.nav=لوحة الدوسيهات | demand=لوحة الدوسيهات | forbid=نظرة عامة على لوحة الدوسيهات
dashboard.title=لوحة الدوسيهات | demand=لوحة الدوسيهات | forbid=لوحة الملفات
persons.ar.title=الأشخاص | demand=الأشخاص | forbid=جهات الاتصال الرئيسية
persons.en.title=Persons | demand=Persons | forbid=Key Contacts
countries.nav=الدول | demand=الدول | forbid=البلدان
positions.nav=المواقف | demand=المواقف | forbid=منصب
positions.title=مكتبة المواقف | demand=مكتبة المواقف | forbid=مكتبة المناصب
intake.title=قائمة الاستقبال | demand=قائمة الاستقبال | forbid=قائمة الانتظار
waiting.nav=قائمة الانتظار | demand=قائمة الانتظار | forbid=قائمة الاستقبال
TIEBREAK-CONJUNCTION-OK
```

## Checker control

Command: `node scripts/nav-title-agreement.mjs "$PWD" --control`

Verbatim output:

```json
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
```

## Completed `termPattern` collision sweep

Population: the 27 inherited real-row patterns after P99-22's Scheduled Reports specificity fix,
measured against the other rows' declared object terms; planted control fixtures are excluded.
Outside: English text, source-reference sentinels, and the three value-locked escalation
dispositions (which remain independently red as agreements).

P99-22 baseline: **1 duplicate pattern and 6 cross-matching rows** across five named collision
classes (`فعالي`, `مساعد`, `مهام`, `دول`, and the Reports half-fix `تقارير`).
**MEASURED: 1 duplicate pattern and 6 cross-matching rows → 0 and 0** after full-object discrimination. The
measurement's baseline control names all six source rows, so changing the algorithm to overlook one
of the five classes makes the conjunctive acceptance test fail.

Command:

```text
node scripts/nav-title-agreement.mjs "$PWD" --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log('TERM_PATTERN_DUPLICATE_PATTERNS='+r.termPatternDuplicatePatterns);console.log('TERM_PATTERN_CROSS_MATCHING_ROWS='+r.termPatternCrossMatchingRows);console.log(JSON.stringify(r.termPatternCollisions))})"
```

Verbatim output:

```text
TERM_PATTERN_DUPLICATE_PATTERNS=0
TERM_PATTERN_CROSS_MATCHING_ROWS=0
{"duplicatePatterns":[],"crossMatchingRows":[]}
```

## Exact-title Vitest acceptance battery

Command:

```text
node --input-type=module -e "import { startVitest } from 'vitest/node';const v=await startVitest('test',['scripts/nav-title-agreement.mjs'],{root:process.cwd(),watch:false,run:true,include:['scripts/nav-title-agreement.mjs'],environment:'node',setupFiles:[],reporters:['verbose']});if(!v)process.exitCode=1;else await v.close()"
```

Verbatim output:

```text
RUN  v4.1.7 /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260825-135647-0000000000000038--P99-23

 ✓ scripts/nav-title-agreement.mjs > P99-23 nav-title agreement lane > the ruled tie-breaks and the queue collision is landed for the nav-title agreement lane, proven by this task's own oracles rather than by the lane's later tasks. 5ms
 ✓ scripts/nav-title-agreement.mjs > P99-23 nav-title agreement lane > FURTHER disagreeing pair found during the 28-row walk that no ruled row decides is ESCALATED to the overseer by name in the SUMMARY and left unrepaired — a worker never applies title-wins or any other invented policy. Escalating leaves this task RED on that row, which is the correct outcome: over-gating is recoverable, an invented Arabic information architecture is not. — AND, enforced together with the above as ONE conjunctive item, no half passing while the other fails (RULING-P99-199): the UNFINISHED termPattern SWEEP inherited from P99-22 is completed here. P99-22 fixed essentially one row; MEASURED on its landed branch with control fixtures excluded, 27 real rows still carry 1 duplicate pattern and 6 cross-matching instances, down from 3 and 10 — a moved number, NOT a closed class. Five distinct collisions remain and each is named so the shortfall is visible if it recurs: (a) فعالي matches BOTH فعالية / الفعاليات and فعالية جديدة; (b) مساعد matches BOTH المساعدة and مساعد الوثائق; (c) مهام matches BOTH قائمة المهام and تصعيدات المهام; (d) دول matches التقارير المجدولة as a bare substring of المجدولة, a CROSS-DOMAIN false match; (e) THE HALF-FIX — Scheduled Reports was made distinctive but تقارير for Reports STILL matches التقارير المجدولة, so the same-name-surface defect survives in the very row the reviewer anchored. The remedy is word-boundary or full-object-term discrimination applied to ALL of them, never a per-row widening that reproduces the defect one row later. Re-run the collision measurement and state the result as MEASURED beside this baseline; a fix that moves the number without reaching zero cross-matching rows does NOT satisfy this item. 3ms
 ✓ scripts/nav-title-agreement.mjs > P99-23 nav-title agreement lane > The memoranda page title mis-anchor is repaired: MousPage stops titling itself through the generic mous.title value ("Title"/"العنوان" in both locales today) and resolves a real page-title key whose values match the nav label pair in both locales (مذكرات التفاهم on the ar side), in explicit colon form against the post-flatten shape 1ms
 ✓ scripts/nav-title-agreement.mjs > P99-23 nav-title agreement lane > The queue collision is retired: ar/intake.json's TITLE value becomes قائمة الاستقبال while قائمة الانتظار survives for the waiting queue. Re-derive both before and after — at plan time قائمة الاستقبال already occurs twice in ar/common.json (the nav labels navigation.intake and navigation.intakeQueue), so a clause keyed on mere PRESENCE of that string is a keep-true guard and not a discriminator; the discriminating clause is that ar/intake.json's own title carries it. 1ms
 ✓ scripts/nav-title-agreement.mjs > P99-23 nav-title agreement lane > Every tie-break and every walked anchor is recorded in scripts/glossary-senses.d/tiebreaks.json as a machine-checkable row, so the decision trail is a committed artifact the closing battery re-reads rather than SUMMARY prose 3ms
 ✓ scripts/nav-title-agreement.mjs > P99-23 nav-title agreement lane > the three ruled tie-breaks are applied exactly as ruled and the queue collision is retired, each clause naming the value it demands and the value it forbids so a partial sweep cannot pass — RED at HEAD (dashboard reads لوحة الملفات, persons reads جهات الاتصال الرئيسية, countries nav reads البلدان, intake.json carries no استقبال title) 1ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  21:27:43
   Duration  89ms (transform 14ms, setup 0ms, import 19ms, tests 12ms, environment 0ms)
```

## Rendered UI99-C6 pair — green

The current worktree frontend was built into `/tmp` with Vite's programmatic API and the same React,
Tailwind, and TanStack Router plugins. This avoids both a localhost listener and writes through the
harness-owned `node_modules` links. A temporary copy of the committed spec changed only its harness
imports; Playwright request routing served the current production bundle and deterministic
auth/profile/empty-intake responses. No repository test or product file was altered for the run.

The one-path, hardcoded-count collection guard selected exactly the canonical pair:

```text
Listing tests:
  [chromium-en] › ../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue
  [chromium-en] › ../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue
Total: 2 tests in 1 file
```

Rendered execution completed successfully:

```text
Running 2 tests using 2 workers
  ✓  1 [chromium-en] › ../../../../../../../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue (4.0s)
  ✓  2 [chromium-en] › ../../../../../../../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue (4.0s)

  2 passed (4.4s)
```

Both committed UI99-C6 leaf bodies therefore ran after hydration and locale assertion: Arabic
presence plus all three English-absence checks passed, and the English presence-control leg passed.
This successful rendered rerun is the task's binding UI99-C6 evidence; nothing is deferred to
P99-24.

## Scope and later work

Task-owned changed paths are limited to:

```text
.planning/phases/99-arabic-coverage/99-23-SUMMARY.md
frontend/src/i18n/ar/persons.json
frontend/src/i18n/en/common.json
scripts/glossary-senses.d/tiebreaks.json
scripts/nav-title-agreement.mjs
```

The Arabic persons subtitle was aligned with the ruled `الأشخاص` terminology so it no longer
retains the forbidden `جهات الاتصال الرئيسية` wording. Every other allowlisted locale/source file
already carried its ruled value in the inherited tree and was verified without rewriting. Every path
outside P99-23's fixed allowlist remains untouched.
The three named product decisions above remain for the OVERSEER; this worker applied no invented
Arabic information architecture.
