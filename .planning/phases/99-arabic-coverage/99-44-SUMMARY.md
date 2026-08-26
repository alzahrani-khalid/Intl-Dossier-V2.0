# P99-44 Summary — dossier-A sense sweep and brief-artifact closure

## Outcome

P99-44 consumed the repaired production classifier at dependency tip
`e11ba20064ba1fa874b84c544153e0b5ef7b6cf1`. It re-derived and judged the declared 37-file Arabic
slice, rewrote 194 dossier-object occurrences in 193 values from the `ملف` family to the ruled
`دوسيه` family, preserved 74 sanctioned `ملف` occurrences, and recorded an exact live judgment for
every one of the 71 surviving values. The five exact brief-artifact handoff values now use `ملخص` /
`ملخصات`.

The harness-replayed value/ledger work is committed in this lineage as:

- `26a883693` — `fix(i18n): classify dossier senses in slice a`
- `3ea6ed768` — `fix(i18n): close dossier classifier exceptions`

The review repair adds the 39 exact rows that were absent at repair base `442f6250a`; it does not
repeat or alter the accepted Arabic-value work.

This covers D-04, D-05, D-17, D-18, D-19, and D-39. The production classifier and base sense
document were consumed without modification.

## Fresh populations and before/after counts

All starting counts below were measured from the real worker lineage at
`e11ba20064ba1fa874b84c544153e0b5ef7b6cf1`; no candidate summary or verdict supplied a count.

Command: a read-only Node walker loaded the live 37-member `slice` from `dossier-a.json`, read each
starting bundle with `git show e11ba20064ba1fa874b84c544153e0b5ef7b6cf1:<path>`, walked string
leaves, and counted the production dossier terms.

Verbatim output:

```text
BASE-POPULATION sha=e11ba20064ba1fa874b84c544153e0b5ef7b6cf1 sliceFiles=37 leafValues=7361
dossier	ruled=دوسيه	before=270	after=202
دوسيه	occurrences=202	values=201	files=8
دوسييه	occurrences=2	values=2	files=1
ملف	occurrences=268	values=263	files=36
```

Command:

```sh
node scripts/glossary-census.mjs "$PWD" --row dossier --slice scripts/glossary-senses.d/dossier-a.json --census
```

Verbatim output:

```text
glossary census: 7361 Arabic leaf values across 37 file(s)
dossier	ruled=دوسيه	before=76	after=396	unclassified=0
  دوسيه	ruled-term	occurrences=396	lines=394	values=394	files=35	ruled=396	allowlisted=0	unclassified=0
  دوسييه	competing-term	occurrences=2	lines=2	values=2	files=1	ruled=0	allowlisted=2	unclassified=0
  ملف	competing-term	occurrences=74	lines=71	values=71	files=12	ruled=0	allowlisted=74	unclassified=0
classification totals: ruled=396 allowlisted=76 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
EXIT_STATUS=0
```

The final row's `before=76` is the census name for competing spellings, not unresolved residue:
all 76 are sanctioned and allowlisted. Relative to the starting population, `ملف` fell from 268 to
74 occurrences and `دوسيه` rose from 202 to 396 occurrences. One rewritten mixed value,
`dossier:addToDossier.actions.document.description`, retains its separate computer-file occurrence,
which is why 193 changed dossier values remove 194 dossier-sense occurrences while the final
`ملف` value count is 71.

The repo-wide brief population was also re-derived at the same starting SHA with the production
singular/plural word boundaries.

Verbatim output:

```text
BASE-BRIEF-POPULATION sha=e11ba20064ba1fa874b84c544153e0b5ef7b6cf1 files=129 leafValues=16943
brief-artifact	ruled=ملخص / الملخصات	before=82	after=278
ملخص	occurrences=278
موجز	occurrences=22
إحاطة	occurrences=56
إحاطات	occurrences=4
```

Command:

```sh
node scripts/glossary-census.mjs "$PWD" --row brief-artifact --census
```

Verbatim output:

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
brief-artifact	ruled=ملخص / الملخصات	before=77	after=283	unclassified=0
  ملخص	ruled-term	occurrences=283	lines=276	values=276	files=56	ruled=283	allowlisted=0	unclassified=0
  موجز	competing-term	occurrences=22	lines=22	values=22	files=9	ruled=0	allowlisted=22	unclassified=0
  إحاطة	competing-term	occurrences=55	lines=54	values=55	files=12	ruled=0	allowlisted=55	unclassified=0
  إحاطات	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
classification totals: ruled=283 allowlisted=77 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
EXIT_STATUS=0
```

## Exact judgment ledger

`scripts/glossary-senses.d/dossier-a.json` declares exactly 37 files and contains 71 nonempty exact
rows: one row for every surviving `ملف`-bearing live value in the slice. The 32 prior rows were
retained byte-for-byte, and the review repair adds the other 39 values that production could classify
through a broader base rule but that this lane had not independently judged. The 71 values contain 74
occurrences because three values contain the token twice; a single exact key-path judgment covers all
occurrences in that one value.

Command:

```sh
node -e 'const o=JSON.parse(require("fs").readFileSync("scripts/glossary-senses.d/dossier-a.json","utf8"));const c={};for(const r of o.rows)c[r.sense]=(c[r.sense]||0)+1;console.log(JSON.stringify({sliceFiles:o.slice.length,exactRows:o.rows.length,senses:c},null,2))'
```

Verbatim output:

```json
{
  "sliceFiles": 37,
  "exactRows": 71,
  "senses": {
    "computer-file-upload": 3,
    "computer-file-size": 7,
    "computer-file-type": 3,
    "personal-profile": 4,
    "data-library-file": 1,
    "profile-page-or-summary": 3,
    "computer-file-processing": 3,
    "pdf-file": 6,
    "computer-file-dropzone": 5,
    "contact-import-file": 3,
    "exported-computer-file": 3,
    "downloaded-html-file": 1,
    "attached-computer-file": 1,
    "data-library-file-upload": 1,
    "data-library-file-browse": 1,
    "data-library-file-count": 1,
    "attachment-file-upload": 3,
    "attachment-file-metadata": 2,
    "attachment-file-size": 1,
    "computer-file-browse": 1,
    "computer-file-constraints": 1,
    "computer-file-selection": 1,
    "computer-file-removal": 1,
    "ocr-image-file-type": 1,
    "ocr-image-file-size": 1,
    "contact-import-file-type": 1,
    "contact-import-file-size": 1,
    "interaction-attachment-upload": 1,
    "interaction-attachment-size": 1,
    "document-file-or-attachment": 1,
    "document-file-metadata": 4,
    "document-file-size": 2,
    "document-file-security": 2
  }
}
```

A separate liveness and completeness audit loaded the 37 live bundles, rejected duplicate or dead
rows, compared the ledger with repair base `442f6250a`, and required every surviving value to have
an exact file/key-path identity. It also proves the narrow repair did not remove or modify an existing
judgment.

Verbatim output:

```text
EXACT-COVERAGE repairBase=442f6250a sliceFiles=37 priorRows=32 addedRows=39 removedRows=0 modifiedRows=0 liveRows=71 survivingValues=71 survivingOccurrences=74 missingExactValues=0
```

The 39 newly recorded identities and judgments are:

```text
NEW-EXACT advanced-search.json:fields.file_type sense=computer-file-type
NEW-EXACT advanced-search.json:fields.file_size sense=computer-file-size
NEW-EXACT agenda.json:dropFileHere sense=computer-file-dropzone
NEW-EXACT agenda.json:maxFileSize sense=computer-file-size
NEW-EXACT commitments.json:evidence.dropzone sense=computer-file-dropzone
NEW-EXACT committees.json:actions.viewProfile sense=personal-profile
NEW-EXACT common.json:navigation.profile sense=personal-profile
NEW-EXACT common.json:dataLibrary.dragDropFiles sense=data-library-file-upload
NEW-EXACT common.json:dataLibrary.browseFiles sense=data-library-file-browse
NEW-EXACT common.json:dataLibrary.maxFileSize sense=computer-file-size
NEW-EXACT common.json:dataLibrary.totalFiles sense=data-library-file-count
NEW-EXACT common.json:afterActions.ai.uploadFile sense=computer-file-upload
NEW-EXACT common.json:afterActions.ai.invalidFileType sense=computer-file-type
NEW-EXACT common.json:afterActions.attachments.upload sense=attachment-file-upload
NEW-EXACT common.json:afterActions.attachments.fileName sense=attachment-file-metadata
NEW-EXACT common.json:afterActions.attachments.fileSize sense=attachment-file-metadata
NEW-EXACT common.json:afterActions.attachments.uploadSuccess sense=attachment-file-upload
NEW-EXACT common.json:afterActions.attachments.uploadFailed sense=attachment-file-upload
NEW-EXACT common.json:afterActions.attachments.maxSize sense=attachment-file-size
NEW-EXACT common.json:forms.browse_files sense=computer-file-browse
NEW-EXACT common.json:forms.file_constraints sense=computer-file-constraints
NEW-EXACT common.json:forms.files_selected sense=computer-file-selection
NEW-EXACT common.json:forms.remove_file sense=computer-file-removal
NEW-EXACT contacts.json:contactDirectory.ocr.invalid_file_type sense=ocr-image-file-type
NEW-EXACT contacts.json:contactDirectory.ocr.file_too_large sense=ocr-image-file-size
NEW-EXACT contacts.json:contactDirectory.documentExtraction.invalid_file_type sense=contact-import-file-type
NEW-EXACT contacts.json:contactDirectory.documentExtraction.file_too_large sense=contact-import-file-size
NEW-EXACT contacts.json:contactDirectory.interactions.form.upload_files sense=interaction-attachment-upload
NEW-EXACT contacts.json:contactDirectory.interactions.form.attachments_description sense=interaction-attachment-size
NEW-EXACT dossier.json:sections.shared.documentsDescription sense=document-file-or-attachment
NEW-EXACT dossier.json:overview.person.title sense=personal-profile
NEW-EXACT dossiers-feature017.json:documents.fields.fileName sense=document-file-metadata
NEW-EXACT dossiers-feature017.json:documents.fields.fileSize sense=document-file-metadata
NEW-EXACT dossiers-feature017.json:documents.errors.fileTooLarge sense=document-file-size
NEW-EXACT dossiers-feature017.json:documents.errors.infected sense=document-file-security
NEW-EXACT dossiers.json:documents.fields.fileName sense=document-file-metadata
NEW-EXACT dossiers.json:documents.fields.fileSize sense=document-file-metadata
NEW-EXACT dossiers.json:documents.errors.fileTooLarge sense=document-file-size
NEW-EXACT dossiers.json:documents.errors.infected sense=document-file-security
```

Representative exact reasons, copied from the live ledger:

- `advanced-search.json:fields.file_type` — `computer-file-type`: the field filters computer-file
  types, not dossier types.
- `common.json:navigation.profile` — `personal-profile`: the navigation label opens the user's
  personal profile, which D-17 explicitly preserves.
- `common.json:reports.templates.organizationProfile` — `profile-page-or-summary`: the report
  template is an organization profile, not a dossier object or computer file.
- `common.json:profile` — `personal-profile`: D-17 explicitly preserves the user's personal
  profile.
- `commitments.json:evidence.fileTooLarge` — `computer-file-size`: validation concerns an uploaded
  computer file exceeding its limit, not a dossier.
- `dossier.json:addToDossier.actions.document.description` — `attached-computer-file`: the first
  occurrence is the attached file while the second, dossier-object occurrence was rewritten.
- `dossiers-feature017.json:documents.errors.infected` — `document-file-security`: validation
  rejects a malicious uploaded computer file, not a dossier object.

### Live profile first-match proof

A read-only reproduction of the production entry ordering (base entries, then sorted overlays)
looked up each live value and selected the first matching `ملف` entry.

Verbatim output:

```text
PROFILE-PROOF common.json:reports.templates.organizationProfile value="ملف المنظمة" classification=allowlisted-sense sense=profile-page-or-summary source=glossary-senses.d/dossier-a.json
PROFILE-PROOF dossier.json:sections.organization.institutionalProfile value="الملف المؤسسي" classification=allowlisted-sense sense=profile-page-or-summary source=glossary-senses.d/dossier-a.json
PROFILE-PROOF dossier.json:sections.person.professionalProfile value="الملف المهني" classification=allowlisted-sense sense=profile-page-or-summary source=glossary-senses.d/dossier-a.json
```

This proves the three rows are active classifications selected after the repaired base boundary, not
inert ledger prose.

## Five exact brief-artifact rewrites

A read-only Node check loaded each starting value from the dependency SHA, loaded its live value,
required the live value to contain `ملخص`, and rejected any surviving `إحاط` artifact spelling.

Verbatim output:

```text
BRIEF-REWRITE contextual-suggestions.json:suggestions.upcomingEngagement.description "المشاركة مجدولة في {{date}}{{location}}. راجع الإحاطات وحضّر المواد." -> "المشاركة مجدولة في {{date}}{{location}}. راجع الملخصات وحضّر المواد."
BRIEF-REWRITE dossier-overview.json:documentType.brief "إحاطة" -> "ملخص"
BRIEF-REWRITE dossier-overview.json:documents.empty.brief "لم يتم العثور على إحاطات" -> "لم يتم العثور على ملخصات"
BRIEF-REWRITE dossier-overview.json:documents.tabs.briefs "الإحاطات" -> "الملخصات"
BRIEF-REWRITE dossier.json:templates.category.thematic "الإحاطات الموضوعية" -> "الملخصات الموضوعية"
BRIEF-REWRITES-OK count=5
```

Every non-term portion, placeholder, punctuation mark, and surrounding word is preserved.

## Required production sequence — verbatim

The final required order was run as one `&&` chain: repaired controls first, repo-wide brief row
second, pinned dossier row third, and the 37-member assertion last.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control && node "$R/scripts/glossary-census.mjs" "$R" --row brief-artifact && node "$R/scripts/glossary-census.mjs" "$R" --row dossier --slice scripts/glossary-senses.d/dossier-a.json && node -e "const o=JSON.parse(require(\"fs\").readFileSync(process.argv[1]+\"/scripts/glossary-senses.d/dossier-a.json\",\"utf8\"));if(!Array.isArray(o.slice)||o.slice.length!==37){console.error(\"the overlay declares \"+(o.slice||[]).length+\" slice files, not this lane 37\");process.exit(1)}" "$R"
```

Verbatim output and status:

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
UNCLASSIFIED glossary occurrences: 0
UNCLASSIFIED glossary occurrences: 0
EXIT_STATUS=0
```

## Structural and values-only proof

The plan's exact repo-wide parity oracle ran after the final census chain.

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node -e "const fs=require(\"fs\"),path=require(\"path\");const R=process.argv[1];const dir=R+\"/frontend/src/i18n\";const leaves=(o,p)=>Object.entries(o).flatMap(([k,v])=>(v&&typeof v===\"object\")?leaves(v,p+k+\".\"):[p+k]);let checked=0,bad=0;for(const f of fs.readdirSync(dir+\"/en\")){if(!f.endsWith(\".json\"))continue;const en=JSON.parse(fs.readFileSync(dir+\"/en/\"+f,\"utf8\"));const ar=JSON.parse(fs.readFileSync(dir+\"/ar/\"+f,\"utf8\"));const a=new Set(leaves(ar,\"\"));for(const k of leaves(en,\"\")){checked++;if(!a.has(k)){console.error(\"parity broken \"+f+\":\"+k);bad++}}}if(checked===0){console.error(\"POSITIVE CONTROL FAILED — no leaves walked\");process.exit(1)}if(bad)process.exit(1);const ov=JSON.parse(fs.readFileSync(R+\"/scripts/glossary-senses.d/dossier-a.json\",\"utf8\"));if(!Array.isArray(ov.rows)||ov.rows.length===0){console.error(\"this lane recorded no classification rows — either nothing was judged or the trail was not committed\");process.exit(1)}console.log(\"SWEEP-STRUCT-OK checked=\"+checked+\" rows=\"+ov.rows.length)" "$R"
```

Verbatim output and status:

```text
SWEEP-STRUCT-OK checked=16919 rows=71
EXIT_STATUS=0
```

A second read-only audit compared every node type and key path in the 37 Arabic bundles against the
dependency SHA, compared all 37 English bundles byte-for-byte, counted changed Arabic string leaves,
and counted U+FFFD before and after.

Verbatim output:

```text
VALUES-ONLY-OK sliceFiles=37 changedArabicValues=198 changedArabicBundles=33 structuralChanges=0 englishBundlesChanged=0 replacementCharactersBefore=0 replacementCharactersAfter=0
```

The 198 changes are exactly 193 dossier values plus five brief-artifact values. No Arabic key,
non-string leaf, English value, bundle structure, source instrument, or application source changed.

## Changed paths and scope

Thirty-three Arabic bundles changed:

```text
frontend/src/i18n/ar/advanced-search.json
frontend/src/i18n/ar/after-actions-page.json
frontend/src/i18n/ar/agenda.json
frontend/src/i18n/ar/ai-brief.json
frontend/src/i18n/ar/ai-chat.json
frontend/src/i18n/ar/analytics.json
frontend/src/i18n/ar/assignments.json
frontend/src/i18n/ar/availability-polling.json
frontend/src/i18n/ar/briefing-books.json
frontend/src/i18n/ar/bulk-actions.json
frontend/src/i18n/ar/calendar.json
frontend/src/i18n/ar/citations.json
frontend/src/i18n/ar/collaboration.json
frontend/src/i18n/ar/commitments.json
frontend/src/i18n/ar/common.json
frontend/src/i18n/ar/contextual-help.json
frontend/src/i18n/ar/contextual-suggestions.json
frontend/src/i18n/ar/copilot.json
frontend/src/i18n/ar/countries.json
frontend/src/i18n/ar/country-wizard.json
frontend/src/i18n/ar/dashboard-widgets.json
frontend/src/i18n/ar/dashboard.json
frontend/src/i18n/ar/delegation.json
frontend/src/i18n/ar/dossier-context.json
frontend/src/i18n/ar/dossier-drawer.json
frontend/src/i18n/ar/dossier-export.json
frontend/src/i18n/ar/dossier-overview.json
frontend/src/i18n/ar/dossier-recommendations.json
frontend/src/i18n/ar/dossier-shell.json
frontend/src/i18n/ar/dossier.json
frontend/src/i18n/ar/dossiers.json
frontend/src/i18n/ar/elected-official-wizard.json
frontend/src/i18n/ar/email-digest.json
```

The only other changed production artifact is
`scripts/glossary-senses.d/dossier-a.json`; this summary is the only planning artifact. The four
declared slice bundles `committees.json`, `contacts.json`, `dossier-search.json`, and
`dossiers-feature017.json` were scanned and judged but required no value change. No path outside the
P99-44 allowlist changed.

## Named populations outside this lane

The dossier oracle is deliberately pinned to this lane's 37 bundles. Outside it are 92 other Arabic
bundles, the engagement/briefing-session/stance/country/intake glossary families, English bundles,
application source, and the dependency-owned production instrument/base/brief-stance files. The
repo-wide brief row is not outside: it scanned all 129 Arabic bundles and is green.

A read-only repo-wide dossier census confirmed the slice contributes no unresolved occurrence and
measured the tail owned by later slices.

Verbatim output:

```text
OUTSIDE-SLICE repoFiles=129 sliceFiles=37 outsideFiles=92 repoStatus=1
OUTSIDE-DOSSIER-TAIL unclassifiedOccurrences=8 unclassifiedFiles=5
OUTSIDE-DOSSIER-FILES form-wizard.json,intake.json,lifecycle.json,operations-hub.json,validation.json
SLICE-LEAK unclassifiedInsideSlice=0
```

Exact outside identities, reported without changing them:

```text
OUTSIDE-UNCLASSIFIED form-wizard.json:organization.engagement_profile:ملف:ملف المشاركة
OUTSIDE-UNCLASSIFIED intake.json:validation.fileTooLarge:ملف:الملف يتجاوز الحد الأقصى للحجم
OUTSIDE-UNCLASSIFIED lifecycle.json:promotion.linkedDossiers:ملف:الملفات المرتبطة
OUTSIDE-UNCLASSIFIED operations-hub.json:kpi.totalDossiers:ملف:اجمالي الملفات
OUTSIDE-UNCLASSIFIED operations-hub.json:analytics.empty:ملف:لا تتوفر بيانات تحليلية بعد. ابدا بانشاء ملفات ومشاركات.
OUTSIDE-UNCLASSIFIED validation.json:file_invalid_type:ملف:نوع الملف هذا غير مدعوم
OUTSIDE-UNCLASSIFIED validation.json:file_too_large:ملف:حجم الملف كبير جداً
OUTSIDE-UNCLASSIFIED validation.json:total_size_exceeded:ملف:يتجاوز الحجم الإجمالي للملفات الحد المسموح
```

These eight are explicitly outside the overlay-declared slice; they are not exceptions hidden by a
repo-wide claim.
