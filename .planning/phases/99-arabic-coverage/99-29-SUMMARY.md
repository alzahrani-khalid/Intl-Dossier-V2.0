# P99-29 Summary — dossier-object sense split, slice C

## Outcome

The pinned 18-file slice is green for the dossier row. Every dossier-object occurrence now uses
the ruled `دوسيه` family, while 12 sanctioned `ملف` occurrences survive in 11 leaf values because
they mean a computer file, attachment, or personal profile. The committed overlay contains one
exact classification row for every surviving leaf.

This was a sense judgment, not a substring sweep. The initial census reported 54 unclassified
occurrences, but reading all 68 occurrences against their English counterparts found two more
dossier occurrences that the base key-path exception had classified as files merely because their
paths contain `documents`:

- `progressive-disclosure:pages.dossiers.empty.intermediate.documents.content` mixed a real
  computer-file occurrence with a dossier occurrence. Only the dossier occurrence was rewritten.
- `progressive-disclosure:pages.documents.empty.basic.organize.content` says documents attach to
  dossiers. Its `ملف` occurrence was rewritten even though the broad document-path exception had
  consumed it.

Thus 56 dossier occurrences in 56 values were rewritten, rather than stopping at the census's 54
initially unclassified occurrences. The task lands D-04, D-05, D-17, D-18, D-19, and D-39; terms
remain translation leaf values, and no key or application source was changed.

Task base: `018b473f4f11a0bcc00c526666d6bff3f45dac76`.

Implementation commit: `4b67c44e6602be562f72402e41b1d7b2fb5e5c68` (`fix(i18n): complete
dossier sense sweep`). Its commit hook ran the repository build successfully.

## D-04: re-derived populations

### Planted control, run first

This was the first live census command, before the slice declaration or any bundle edit:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control
```

```text
{
  "control": "PASS",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true,
  "allowlistedPluralSeen": true,
  "plantedUnclassifiedPluralCaught": true,
  "allowlistedPluralCount": 1,
  "plantedUnclassifiedPluralCount": 1
}
```

Exit status: `0`. The planted competing dossier spelling was caught before the live population was
trusted.

### Before sweep

An empty `rows` array was used only to declare the exact 18-file slice; no Arabic value had changed
when this command ran:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row dossier --slice scripts/glossary-senses.d/dossier-c.json --census
```

```text
glossary census: 2225 Arabic leaf values across 18 file(s)
dossier	ruled=دوسيه	before=68	after=6	unclassified=54
  دوسيه	ruled-term	occurrences=6	lines=6	values=6	files=2	ruled=6	allowlisted=0	unclassified=0
  دوسييه	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
  ملف	competing-term	occurrences=68	lines=66	values=66	files=18	ruled=0	allowlisted=14	unclassified=54
classification totals: ruled=6 allowlisted=14 UNCLASSIFIED=54
UNCLASSIFIED glossary occurrences: 54
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.basic.create.title:إنشاء أول ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.basic.create.content:تساعدك الملفات على تنظيم المعلومات حول الدول والمنظمات والمنتديات والمزيد.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.basic.types.content:اختر من ملفات الدول أو المنظمات أو المنتديات أو مجموعات العمل أو الأشخاص بناءً على ما تتتبعه.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.intermediate.relationships.title:ربط ملفاتك	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.intermediate.relationships.content:اربط الملفات ذات الصلة لبناء شبكة من العلاقات ورؤية الصورة الأكبر.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.advanced.briefs.content:دع الذكاء الاصطناعي يلخص معلومات ملفك في ملخصات موجزة.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.advanced.shortcuts.content:اضغط Ctrl+K (Cmd+K على Mac) للبحث والانتقال السريع إلى أي ملف.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.engagements.empty.intermediate.link.title:الربط بالملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.engagements.empty.intermediate.link.content:ربط التفاعلات بالملفات ذات الصلة للحصول على سياق وتتبع أفضل.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.calendar.empty.intermediate.link.content:ربط أحداث التقويم بالتفاعلات والملفات للسياق.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/quickswitcher.json:placeholder:ابحث في الملفات، الاوامر...	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/quickswitcher.json:dossiers_section:الملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/quickswitcher.json:typeDossier:ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/relationships.json:wizard.currentDossier:الملف الحالي	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/relationships.json:form.targetDossier:الملف المرتبط	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/relationships.json:form.selectDossier:ابحث واختر ملفًا...	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/relationships.json:form.searchDossiers:اكتب للبحث عن الملفات...	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/relationships.json:form.noResults:لم يتم العثور على ملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/report-builder.json:entities.dossiers:الملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:emptyState.description:استكشف المنصة مع ملفات نموذجية واقعية وعلاقات وأحداث. اختر موضوعًا يناسب اهتماماتك.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:emptyState.orCreateOwn:أو أنشئ ملفك الخاص	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:dialog.populateDescription:سيتم إنشاء {{dossierCount}} ملفات و{{relationshipCount}} علاقات و{{eventCount}} أحداث بناءً على قالب "{{templateName}}".	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:dialog.removeDescription:سيتم إزالة جميع البيانات النموذجية بشكل دائم بما في ذلك {{dossierCount}} ملفات و{{relationshipCount}} علاقات و{{eventCount}} أحداث و{{contactCount}} جهات اتصال.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:notifications.populateSuccess:تم ملء البيانات النموذجية بنجاح. لديك الآن {{dossierCount}} ملفات نموذجية لاستكشافها.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:stats.dossiers:{{count}} ملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:firstRun.title:مرحبًا بك في منصة الملفات الدولية	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/sample-data.json:firstRun.successBody:تم إنشاء {{dossiers}} ملفات، و{{tasks}} مهام، و{{persons}} شخصيات.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/scenario-sandbox.json:variable.entityTypes.dossier:ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/tags.json:analytics.entityBreakdown.dossier:الملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/topic-wizard.json:wizard.steps.review.guidance:راجِع البيانات قبل إنشاء ملف الموضوع.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/topics.json:empty.description:ستظهر ملفات الموضوعات هنا.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/unified-kanban.json:bulkActions.linkToDossier:ربط بملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/unified-kanban.json:bulkActions.selectDossier:اختر ملفاً...	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/unified-kanban.json:context.dossier:أعمال الملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/user-management.json:userDeactivation.orphanedDossiers:سيتم وضع علامة يتيم على {{count}} ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/webhooks.json:eventCategories.dossier:الملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/webhooks.json:events.dossier.created:إنشاء ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/webhooks.json:events.dossier.updated:تحديث ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/webhooks.json:events.dossier.deleted:حذف ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:palette.commitmentDescription:تتبع الوعود والمخرجات المرتبطة بملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:palette.selectDossier:اختر الملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:palette.dossierRequired:يجب ربط الالتزامات بملف. يرجى اختيار واحد:	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:form.selectDossier:اختر ملفًا	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:form.changeDossier:تغيير الملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:form.searchDossiers:البحث في الملفات...	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:form.dossierResults:نتائج الملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:form.recentDossiers:الملفات الأخيرة	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/work-creation.json:form.noDossiersFound:لم يتم العثور على ملفات	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/workflow-automation.json:entities.dossier:ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/working-group-wizard.json:wizard.steps.review.guidance:راجِع البيانات قبل إنشاء ملف مجموعة العمل.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/workspace.json:actions.linkDossier:ربط ملف	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/workspace.json:empty.context.heading:لا توجد ملفات مرتبطة	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/workspace.json:empty.context.body:تظهر الملفات المرتبطة هنا عند إضافة الدولة المضيفة أو المنظمات أو المشاركين إلى المشاركة.	term=ملف
UNCLASSIFIED	frontend/src/i18n/ar/workspace.json:empty.context.action:+ ربط ملف	term=ملف
```

Exit status: `1`, the required red baseline. The population is 2,225 leaves across exactly 18
files, with 68 competing occurrences on 66 source lines / 66 values. The census initially saw 14
as allowlisted and 54 as unclassified; the subsequent leaf-by-leaf judgment found that two of those
14 were actually dossier senses masked by the broad base path rule.

### After sweep

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row dossier --slice scripts/glossary-senses.d/dossier-c.json --census
```

```text
glossary census: 2225 Arabic leaf values across 18 file(s)
dossier	ruled=دوسيه	before=12	after=62	unclassified=0
  دوسيه	ruled-term	occurrences=62	lines=62	values=62	files=16	ruled=62	allowlisted=0	unclassified=0
  دوسييه	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
  ملف	competing-term	occurrences=12	lines=11	values=11	files=3	ruled=0	allowlisted=12	unclassified=0
classification totals: ruled=62 allowlisted=12 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
```

Exit status: `0`. The after population has 62 ruled occurrences and 12 sanctioned survivors, with
zero unclassified occurrences.

## Classification overlay

`scripts/glossary-senses.d/dossier-c.json` declares the exact 18 task-owned files and contains 11
exact rows. The rows account for all 11 surviving leaf values and all 12 surviving occurrences:

- Three progressive-disclosure leaves preserve computer-file meanings; one contains two such
  occurrences. The mixed leaf's reason explicitly records that its dossier occurrence was changed.
- Seven settings leaves preserve five personal-profile meanings and two uploaded-image-file
  validation meanings.
- One stakeholder-influence leaf preserves the stakeholder-profile meaning.

Example committed reasons include “Both occurrences name searchable PDF, Word, or text computer
files, not dossier objects,” “The validation error names an uploaded image file type,” and “The
report type names a stakeholder profile, not a dossier object.”

The base `scripts/glossary-senses.json` was neither removed nor weakened. Loading the overlay only
adds exact classifications to that base.

## Required drilled oracle

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control && node "$R/scripts/glossary-census.mjs" "$R" --row dossier --slice scripts/glossary-senses.d/dossier-c.json && node -e "const o=JSON.parse(require(\"fs\").readFileSync(process.argv[1]+\"/scripts/glossary-senses.d/dossier-c.json\",\"utf8\"));if(!Array.isArray(o.slice)||o.slice.length!==18){console.error(\"the overlay declares \"+(o.slice||[]).length+\" slice files, not this lane 18\");process.exit(1)}" "$R"
```

```text
{
  "control": "PASS",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true,
  "allowlistedPluralSeen": true,
  "plantedUnclassifiedPluralCaught": true,
  "allowlistedPluralCount": 1,
  "plantedUnclassifiedPluralCount": 1
}
UNCLASSIFIED glossary occurrences: 0
```

Exit status: `0`. The chained command proves the control first, scoped zero second, and exact
18-file pin last.

## Structural and scope proof

The required repo-wide parity positive control ran as written in the plan:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node -e "const fs=require(\"fs\"),path=require(\"path\");const R=process.argv[1];const dir=R+\"/frontend/src/i18n\";const leaves=(o,p)=>Object.entries(o).flatMap(([k,v])=>(v&&typeof v===\"object\")?leaves(v,p+k+\".\"):[p+k]);let checked=0,bad=0;for(const f of fs.readdirSync(dir+\"/en\")){if(!f.endsWith(\".json\"))continue;const en=JSON.parse(fs.readFileSync(dir+\"/en/\"+f,\"utf8\"));const ar=JSON.parse(fs.readFileSync(dir+\"/ar/\"+f,\"utf8\"));const a=new Set(leaves(ar,\"\"));for(const k of leaves(en,\"\")){checked++;if(!a.has(k)){console.error(\"parity broken \"+f+\":\"+k);bad++}}}if(checked===0){console.error(\"POSITIVE CONTROL FAILED — no leaves walked\");process.exit(1)}if(bad)process.exit(1);const ov=JSON.parse(fs.readFileSync(R+\"/scripts/glossary-senses.d/dossier-c.json\",\"utf8\"));if(!Array.isArray(ov.rows)||ov.rows.length===0){console.error(\"this lane recorded no classification rows — either nothing was judged or the trail was not committed\");process.exit(1)}console.log(\"SWEEP-STRUCT-OK checked=\"+checked+\" rows=\"+ov.rows.length)" "$R"
```

```text
SWEEP-STRUCT-OK checked=16919 rows=11
```

Exit status: `0`. The positive control walked 16,919 English leaves and found no missing Arabic
counterpart.

A stronger task-base comparison walked every leaf and type in all 18 slice files, matched the live
survivors bijectively to the overlay, and byte-compared the base allowlist to the task base:

```sh
node --input-type=module -e 'import{readFileSync}from"node:fs";import{execFileSync}from"node:child_process";const base="018b473f4f11a0bcc00c526666d6bff3f45dac76",ov=JSON.parse(readFileSync("scripts/glossary-senses.d/dossier-c.json"));const walk=(v,p="",m=new Map)=>{if(v&&typeof v==="object"&&!Array.isArray(v)){for(const[k,x]of Object.entries(v))walk(x,p?`${p}.${k}`:k,m)}else m.set(p,{type:Array.isArray(v)?"array":typeof v,value:v});return m};let changedValues=0,occ=0;const survivors=new Set;for(const path of ov.slice){const before=walk(JSON.parse(execFileSync("git",["show",`${base}:${path}`],{encoding:"utf8"}))),after=walk(JSON.parse(readFileSync(path)));if(JSON.stringify([...before.keys()])!==JSON.stringify([...after.keys()]))throw Error(`key structure changed: ${path}`);for(const[k,a]of after){const b=before.get(k);if(a.type!==b.type)throw Error(`leaf type changed: ${path}:${k}`);if(a.value!==b.value)changedValues++;if(typeof a.value==="string"&&a.value.includes("ملف")){const file=path.split("/").at(-1);survivors.add(`${file}\0${k}`);occ+=(a.value.match(/ملف/gu)||[]).length}}}const rowKeys=new Set(ov.rows.map(r=>`${r.file}\0${r.keyPath}`));if(rowKeys.size!==ov.rows.length)throw Error("duplicate overlay row");if([...survivors].some(k=>!rowKeys.has(k))||[...rowKeys].some(k=>!survivors.has(k)))throw Error("overlay/live survivor mismatch");const baseSenses=readFileSync("scripts/glossary-senses.json","utf8"),originalSenses=execFileSync("git",["show",`${base}:scripts/glossary-senses.json`],{encoding:"utf8"});if(baseSenses!==originalSenses)throw Error("base allowlist changed");console.log(`SLICE-STRUCT-OK files=${ov.slice.length} changedValues=${changedValues} survivorValues=${survivors.size} survivorOccurrences=${occ} rows=${ov.rows.length} baseAllowlist=unchanged`)'
```

```text
SLICE-STRUCT-OK files=18 changedValues=56 survivorValues=11 survivorOccurrences=12 rows=11 baseAllowlist=unchanged
```

Exit status: `0`. This proves unchanged Arabic leaf keys and types, an unchanged base allowlist, and
an exact overlay/live-survivor correspondence. `git diff --check` and JSON parsing of all 18 slice
files plus the overlay also exited `0` with no output.

The implementation diff from the task base contains only 16 task-owned Arabic bundles and the
overlay. `settings.json` and `stakeholder-influence.json` are read-only survivor populations; their
classifications live in the overlay without changing their values. No English bundle, application
source, or out-of-scope path changed.

## D-05: exact population boundary and later work

This task's read population is the 2,225 Arabic leaf values in the overlay's exact 18-file slice.
Its write population is the 16 bundles containing dossier-object rewrites, the additive
`dossier-c.json` overlay, and this summary. The two remaining declared bundles contain only
sanctioned survivors and are structurally unchanged.

Outside this population are:

- the other 111 Arabic bundles;
- dossier slice A owned by P99-27 and dossier slice B owned by P99-28;
- all other glossary term families;
- every English value, every Arabic key name, and every source file;
- Arabic naturalness beyond the ruled D-17 term family; and
- the repo-wide glossary census and consolidated static battery, owned by P99-39.

P99-29 is part 1 of 1 for dossier slice C, so no slice-C occurrence is deferred. P99-39 will perform
the named repo-wide closing re-proof after the file-disjoint dossier lanes and later dependencies
have consolidated.
