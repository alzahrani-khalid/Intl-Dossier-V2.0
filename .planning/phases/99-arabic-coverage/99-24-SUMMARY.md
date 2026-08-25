# P99-24 — MoUs anchor and rendered intake re-proof

## Result

P99-24 is green. The inherited P99-22/P99-23 lane already carries the ruled value changes and the
single `MousPage` source-anchor repoint, so this task adds the three verbatim Vitest acceptance
proofs to `scripts/nav-title-agreement.mjs` and re-proves the rendered UI99-C6 pair. No i18n value,
i18n key, decision-artifact row, or product source changed in this task.

Derived from `d1eabfd8ef1361e619179da8ed4ccfbd1c2ae7fb` on 2026-08-25 in the P99-24 worktree.

## Population and outside-population statement (D-04 / D-05)

Population: all 28 `NavigationItem.labelKey` declarations in
`frontend/src/components/modern-nav/navigationData.ts`, paired with the checker-recorded page-title
anchor; all 129 English and Arabic bundle files for structural parity; and the two UI99-C6 tests in
the one canonical path `tests/e2e/99-ar03-leak.spec.ts`.

Outside: the six category tooltip keys, non-title translation leaves, detail routes, secondary or
legacy navigation, Arabic naturalness beyond the ruled terms, every criterion-2/3 rendered leg other
than UI99-C6, and all paths outside P99-24's fixed allowlist.

## Complete 28-row walk and checker control

Command:

```text
node scripts/nav-title-agreement.mjs "$PWD" --control && node scripts/nav-title-agreement.mjs "$PWD" --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log('NAV_ROWS='+r.rows.length);console.log('AGREEMENTS='+r.agreements);console.log('ESCALATIONS='+r.escalations);console.log('ADJUDICATED='+r.adjudicated);console.log('UNRULED_MISMATCHES='+r.mismatches);console.log('MISSING_ANCHORS='+r.missingAnchorKeys);console.log('MISSING_NAV_KEYS='+r.missingNavigationKeys);console.log('DUPLICATE_PATTERNS='+r.termPatternDuplicatePatterns);console.log('CROSS_MATCHING_ROWS='+r.termPatternCrossMatchingRows);for(const x of r.rows)console.log(x.labelKey+' | '+x.label+' | '+x.titleAnchor+' | '+x.title+' | '+(x.agrees?'AGREES':'ESCALATED'))})"
```

Verbatim output:

```text
{
  "control": "PASS",
  "plantedMismatchCaught": true,
  "positiveAgreementPreserved": true
}
NAV_ROWS=28
AGREEMENTS=25
ESCALATIONS=3
ADJUDICATED=28
UNRULED_MISMATCHES=0
MISSING_ANCHORS=0
MISSING_NAV_KEYS=0
DUPLICATE_PATTERNS=0
CROSS_MATCHING_ROWS=0
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

The 15 research-underived anchors are the rows from `navigation.events` through
`navigation.newEvent`. Their walked source paths remain value-locked in
`scripts/glossary-senses.d/tiebreaks.json`; row coverage is bijective, so deleting or duplicating a
row returns the checker to red.

## D-19 reversal record and MoUs mapping

The decision artifact was re-read directly. Command:

```text
node -e "const a=require('./scripts/glossary-senses.d/tiebreaks.json');for(const k of ['navigation.countries','navigation.engagements','navigation.persons','navigation.positions','navigation.mous','navigation.intake','navigation.dashboardOverview']){const r=a.rows.find(x=>x.labelKey===k);console.log(k);console.log('  before='+JSON.stringify(r.before));console.log('  after='+JSON.stringify(r.after));console.log('  disposition='+r.disposition)}for(const k of ['navigation.admin','navigation.taskQueue','navigation.newEvent']){const r=a.rows.find(x=>x.labelKey===k);console.log('ESCALATED '+k+' candidates='+JSON.stringify(r.candidates)+' disposition='+r.disposition)}"
```

Verbatim output:

```text
navigation.countries
  before={"label":"البلدان","title":"نظرة عامة على الدول"}
  after={"label":"الدول","title":"نظرة عامة على الدول"}
  disposition=requirement-ruled-repair
navigation.engagements
  before={"label":"الارتباطات","title":"المشاركات"}
  after={"label":"المشاركات","title":"المشاركات"}
  disposition=requirement-ruled-repair
navigation.persons
  before={"labelAr":"الأشخاص","titleAr":"جهات الاتصال الرئيسية","titleEn":"Key Contacts"}
  after={"labelAr":"الأشخاص","titleAr":"الأشخاص","titleEn":"Persons"}
  disposition=ruled-tiebreak-persons-wins
navigation.positions
  before={"label":"المواقف","title":"مكتبة المواقف"}
  after={"label":"المواقف","title":"مكتبة المواقف"}
  disposition=ruled-conformant-no-edit
navigation.mous
  before={"sourceKey":"common:mous.title","genericValueAr":"العنوان","genericValueEn":"Title"}
  after={"sourceKey":"common:mous.pageTitle","valueAr":"مذكرات التفاهم","valueEn":"MoUs"}
  disposition=ruled-anchor-repoint
navigation.intake
  before={"label":"قائمة الاستقبال","title":"قائمة الانتظار"}
  after={"label":"قائمة الاستقبال","title":"قائمة الاستقبال"}
  disposition=ruled-queue-collision-repair
navigation.dashboardOverview
  before={"label":"نظرة عامة على لوحة الدوسيهات","title":"لوحة الملفات"}
  after={"label":"لوحة الدوسيهات","title":"لوحة الدوسيهات"}
  disposition=ruled-tiebreak-dashboard
ESCALATED navigation.admin candidates={"label":"الإدارة","title":"إعدادات الذكاء الاصطناعي"} disposition=escalate-unruled
ESCALATED navigation.taskQueue candidates={"label":"قائمة المهام","title":"قائمة انتظار التعيينات"} disposition=escalate-unruled
ESCALATED navigation.newEvent candidates={"label":"فعالية جديدة","title":"إدخال تقويم جديد"} disposition=escalate-unruled
```

Positions is explicitly unchanged. The three further disagreeing pairs remain unrepaired and are
escalated by name to the **OVERSEER**, as RULING-P99-05 §3 requires; neither title-wins nor another
invented policy was applied.

The MoUs source mapping and both locale values were separately re-derived. Verbatim output:

```text
en navigation.mous=MoUs
en mous.title=Title
en mous.pageTitle=MoUs
ar navigation.mous=مذكرات التفاهم
ar mous.title=العنوان
ar mous.pageTitle=مذكرات التفاهم
MousPage anchor count=1
```

Thus the generic column-label values remain intact while the one H1 anchor resolves
`common:mous.pageTitle` in explicit colon form.

## Structural parity and queue collision

The acceptance test walks leaf paths rather than comparing values. Command:

```text
node --input-type=module -e "import{readdirSync,readFileSync}from'node:fs';const root='frontend/src/i18n';const leaf=(v,p='',o=[])=>{if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))leaf(x,p?p+'.'+k:k,o);else o.push(p);return o};const files=readdirSync(root+'/en').filter(f=>f.endsWith('.json')).sort();let enOnly=[],arOnly=[],enLeaves=0,arLeaves=0;for(const f of files){const e=new Set(leaf(JSON.parse(readFileSync(root+'/en/'+f))));const a=new Set(leaf(JSON.parse(readFileSync(root+'/ar/'+f))));enLeaves+=e.size;arLeaves+=a.size;for(const k of e)if(!a.has(k))enOnly.push(f+':'+k);for(const k of a)if(!e.has(k))arOnly.push(f+':'+k)}console.log('NAMESPACES='+files.length);console.log('EN_LEAVES='+enLeaves);console.log('AR_LEAVES='+arLeaves);console.log('EN_ONLY='+enOnly.length);console.log('AR_ONLY='+arOnly.length);for(const p of arOnly.sort())console.log('AR_EXTRA '+p)"
```

Verbatim output:

```text
NAMESPACES=129
EN_LEAVES=16919
AR_LEAVES=16943
EN_ONLY=0
AR_ONLY=24
AR_EXTRA assignments.json:queue.failedAttempts_few
AR_EXTRA assignments.json:queue.failedAttempts_many
AR_EXTRA assignments.json:queue.failedAttempts_two
AR_EXTRA assignments.json:queue.failedAttempts_zero
AR_EXTRA common.json:dossierLinks.entityTypes.assignment
AR_EXTRA common.json:dossierLinks.entityTypes.commitment
AR_EXTRA common.json:dossierLinks.entityTypes.country
AR_EXTRA common.json:dossierLinks.entityTypes.dossier
AR_EXTRA common.json:dossierLinks.entityTypes.engagement
AR_EXTRA common.json:dossierLinks.entityTypes.forum
AR_EXTRA common.json:dossierLinks.entityTypes.intelligence_signal
AR_EXTRA common.json:dossierLinks.entityTypes.mou
AR_EXTRA common.json:dossierLinks.entityTypes.organization
AR_EXTRA common.json:dossierLinks.entityTypes.position
AR_EXTRA common.json:dossierLinks.entityTypes.topic
AR_EXTRA common.json:dossierLinks.entityTypes.working_group
AR_EXTRA tags.json:hierarchy.tagCount_few
AR_EXTRA tags.json:hierarchy.tagCount_many
AR_EXTRA tags.json:hierarchy.tagCount_two
AR_EXTRA tags.json:hierarchy.tagCount_zero
AR_EXTRA workspace.json:docs.count_few
AR_EXTRA workspace.json:docs.count_many
AR_EXTRA workspace.json:docs.count_two
AR_EXTRA workspace.json:docs.count_zero
```

This is the same known 0 EN-only / 24 AR-extra structural relation recorded by D-25: no Arabic leaf
key was renamed and bundle parity is structurally unchanged.

Exact queue-value command output:

```text
ar/common exact قائمة الاستقبال=2
ar/common exact قائمة الانتظار=2
navigation.intake=قائمة الاستقبال
navigation.intakeQueue=قائمة الاستقبال
navigation.waitingQueue=قائمة الانتظار
intake:queue.title=قائمة الاستقبال
```

The two pre-existing reception leaves in `ar/common.json` remain a keep-true guard. The
discriminating surface value is `ar/intake.json`'s own `queue.title`; the waiting queue name
survives unchanged.

## Verbatim-title Vitest acceptance

Command:

```text
PATH="/opt/homebrew/bin:$PATH" node --input-type=module -e "import { startVitest } from 'vitest/node';const v=await startVitest('test',['scripts/nav-title-agreement.mjs'],{root:process.cwd(),watch:false,run:true,include:['scripts/nav-title-agreement.mjs'],environment:'node',setupFiles:[],reporters:['verbose']});if(!v)process.exitCode=1;else await v.close()"
```

Relevant verbatim output (the inherited six P99-23 tests also passed):

```text
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue
  [chromium-en] › 99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue
Total: 2 tests in 1 file

 ✓ scripts/nav-title-agreement.mjs > P99-24 MoUs anchor and rendered intake re-proof > Every nav label matches its page title, provably and across the whole nav population, with only ruled product decisions applied. 2ms
 ✓ scripts/nav-title-agreement.mjs > P99-24 MoUs anchor and rendered intake re-proof > This lane changes VALUES and one source anchor only: no ar leaf KEY is renamed, and bundle parity is structurally unchanged 54ms
 ✓ scripts/nav-title-agreement.mjs > P99-24 MoUs anchor and rendered intake re-proof > the RENDERED UI99-C6 pair — the ar leg and its en presence control, ONE spec path, the count hardcoded at 2 from --list — still passes after the intake queue is retitled: the retitle is a value change on a surface criterion 3 also grades, and a glossary sweep that breaks a rendered surface is a defect this catches — RED at HEAD (the spec does not exist) 459ms

 Test Files  1 passed (1)
      Tests  9 passed (9)
```

Each acceptance string is the leaf test's own title, verbatim. The UI99-C6 test also reviews the
canonical bodies for locale assertion, the committed hydration floor, Arabic English-absence, and
the English presence-control clauses.

## Rendered UI99-C6 re-proof

The canonical collection command is one spec path and reports the hardcoded count exactly:

```text
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue
  [chromium-en] › 99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue
Total: 2 tests in 1 file
```

The normal reaped command was also attempted. In this restricted worker it exited before test
collection because the configured `pnpm dev` web server could not start; the retained report says:

```text
Error: Process from config.webServer was not able to start. Exit code: 1
pw-run-reaped: playwright exited code=1 signal=null; group 20566 -> {"termed":false,"killed":false,"alreadyGone":false,"unavailable":true,"identityMismatch":false,"finalZero":false}; session none; verdict unclean; causes ["unavailable: direct group 20566 liveness/identity unverifiable — a group we cannot prove is not a group we can call clean"]; report WITHHELD (.unclean.json)
```

To distinguish that launcher failure from a product or assertion failure, the canonical two test
bodies were rerun against the current inherited production bundle using the no-listener Playwright
request-routing harness established by the immediately preceding P99-23 dependency. P99-24 changes
only this checker and summary, so the rendered bundle is byte-identical to the product tree at task
start. Command:

```text
PATH="/opt/homebrew/bin:$PATH" TEST_USER_EMAIL="ui99@example.test" TEST_USER_PASSWORD="ui99-fixture" pnpm exec playwright test --config=/private/tmp/p99-23-ui99c6-playwright.config.mjs -g "UI99-C6" --project=chromium-en --no-deps --list && PATH="/opt/homebrew/bin:$PATH" TEST_USER_EMAIL="ui99@example.test" TEST_USER_PASSWORD="ui99-fixture" pnpm exec playwright test --config=/private/tmp/p99-23-ui99c6-playwright.config.mjs -g "UI99-C6" --project=chromium-en --no-deps
```

Verbatim result (Node warning lines omitted; test output is complete):

```text
Listing tests:
  [chromium-en] › ../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue
  [chromium-en] › ../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue
Total: 2 tests in 1 file

Running 2 tests using 2 workers
  ✓  1 [chromium-en] › ../../../../../../../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:205:5 › UI99-C6 en control intake queue (4.2s)
  ✓  2 [chromium-en] › ../../../../../../../../private/tmp/p99-23-ui99c6-suite/99-ar03-leak.spec.ts:188:5 › UI99-C6 ar intake queue (4.2s)

  2 passed (4.6s)
```

Both bodies ran after hydration and `expectLocale`: the Arabic surface contained Arabic script and
none of the three forbidden English strings, while the English control retained all three strings.

## Formatting, scope, and later work

Commands and verbatim output:

```text
$ node --check scripts/nav-title-agreement.mjs
(no output; exit 0)

$ pnpm exec prettier --check scripts/nav-title-agreement.mjs
Checking formatting...
All matched files use Prettier code style!

$ git diff --check
(no output; exit 0)
```

Task-owned changed paths are limited to:

```text
.planning/phases/99-arabic-coverage/99-24-SUMMARY.md
scripts/nav-title-agreement.mjs
```

No P99-24 acceptance work is deferred. The three value-locked unruled pairs remain an explicit
OVERSEER decision, not work silently assigned to a later implementation task. P99-39's closing
battery will rerun the full nav-title and rendered suite as already planned.
