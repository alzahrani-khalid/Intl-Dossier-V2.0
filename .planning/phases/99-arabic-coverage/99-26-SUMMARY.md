# P99-26 Summary — brief and stance sense sweep complete

## Result

The D-18 sweep is complete. The brief-artifact family now uses `ملخص`: 106 `موجز`
occurrences and ten artifact-sense `إحاطة` occurrences were repaired. Six stance-entity
`منصب` occurrences became `موقف`. The 22 surviving `موجز` occurrences are calendar-feed,
digest-publication, or concise-adjective senses. The 57 surviving `إحاطة` occurrences are
briefing-session/preparation senses (54 exact overlay rows plus three base exceptions), and the
44 surviving `منصب` occurrences are office/post/job-title senses covered by the unchanged base
allowlist.

This implements D-04, D-05, D-17, D-18, D-19, and D-39. Only Arabic string values changed;
the ruled terms remain in i18n leaves. The implementation commit hook completed the repository
build successfully.

## D-04: re-derived populations

The untouched worker start was `f0e0542b46e4f98cb8507529be355706f8dfa772`. The planted
control ran first, before any real census or value edit:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control
```

```text
{
  "control": "PASS",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true
}
```

The untouched repo-wide before populations were re-derived with these commands (the `sed`
kept the count block and one planted-red detail from each otherwise long listing):

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --census --row brief-artifact 2>&1 | sed -n '1,5p;$p'
```

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
brief-artifact	ruled=ملخص / الملخصات	before=195	after=160	unclassified=192
  ملخص	ruled-term	occurrences=160	lines=159	values=159	files=44	ruled=160	allowlisted=0	unclassified=0
  موجز	competing-term	occurrences=128	lines=124	values=124	files=28	ruled=0	allowlisted=0	unclassified=128
  إحاطة	competing-term	occurrences=67	lines=66	values=67	files=18	ruled=0	allowlisted=3	unclassified=64
UNCLASSIFIED	frontend/src/i18n/ar/progressive-disclosure.json:pages.dossiers.empty.advanced.briefs.content:دع الذكاء الاصطناعي يلخص معلومات ملفك في مستندات إحاطة موجزة.	term=إحاطة
```

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --census --row stance 2>&1 | sed -n '1,4p;$p'
```

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
stance	ruled=موقف / المواقف	before=50	after=211	unclassified=6
  موقف	ruled-term	occurrences=211	lines=205	values=205	files=34	ruled=211	allowlisted=0	unclassified=0
  منصب	competing-term	occurrences=50	lines=50	values=50	files=16	ruled=0	allowlisted=44	unclassified=6
UNCLASSIFIED	frontend/src/i18n/ar/workflow-automation.json:entities.position:منصب	term=منصب
```

The after populations were re-derived from the committed repository root:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row brief-artifact --census && node "$R/scripts/glossary-census.mjs" "$R" --row stance --census
```

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
brief-artifact	ruled=ملخص / الملخصات	before=79	after=278	unclassified=0
  ملخص	ruled-term	occurrences=278	lines=270	values=270	files=54	ruled=278	allowlisted=0	unclassified=0
  موجز	competing-term	occurrences=22	lines=22	values=22	files=9	ruled=0	allowlisted=22	unclassified=0
  إحاطة	competing-term	occurrences=57	lines=56	values=57	files=14	ruled=0	allowlisted=57	unclassified=0
classification totals: ruled=278 allowlisted=79 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
glossary census: 16943 Arabic leaf values across 129 file(s)
stance	ruled=موقف / المواقف	before=44	after=217	unclassified=0
  موقف	ruled-term	occurrences=217	lines=211	values=211	files=38	ruled=217	allowlisted=0	unclassified=0
  منصب	competing-term	occurrences=44	lines=44	values=44	files=11	ruled=0	allowlisted=44	unclassified=0
classification totals: ruled=217 allowlisted=44 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
```

The owned 42-bundle slice independently reads green:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row brief-artifact --slice scripts/glossary-senses.d/brief-stance.json --census && node "$R/scripts/glossary-census.mjs" "$R" --row stance --slice scripts/glossary-senses.d/brief-stance.json --census
```

```text
glossary census: 8192 Arabic leaf values across 42 file(s)
brief-artifact	ruled=ملخص / الملخصات	before=36	after=183	unclassified=0
  ملخص	ruled-term	occurrences=183	lines=176	values=176	files=30	ruled=183	allowlisted=0	unclassified=0
  موجز	competing-term	occurrences=22	lines=22	values=22	files=9	ruled=0	allowlisted=22	unclassified=0
  إحاطة	competing-term	occurrences=14	lines=14	values=14	files=5	ruled=0	allowlisted=14	unclassified=0
classification totals: ruled=183 allowlisted=36 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
glossary census: 8192 Arabic leaf values across 42 file(s)
stance	ruled=موقف / المواقف	before=44	after=152	unclassified=0
  موقف	ruled-term	occurrences=152	lines=146	values=146	files=19	ruled=152	allowlisted=0	unclassified=0
  منصب	competing-term	occurrences=44	lines=44	values=44	files=11	ruled=0	allowlisted=44	unclassified=0
classification totals: ruled=152 allowlisted=44 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
```

## Classification and structural proof

The overlay contains 76 exact judgments across 11 senses: 22 for `موجز` and 54 for `إحاطة`.
Representative reasons distinguish an iCal feed, a digest publication, the adjective “concise,”
a briefing book/material, and an exported briefing pack. Exact rows were checked for required
fields, duplicates, and a matching live Arabic value:

```text
OVERLAY-REVALIDATED slice=42 rows=76 matchedValues=76 senses=11
```

The base allowlist was not removed from or weakened:

```sh
git diff --quiet f0e0542b46e4f98cb8507529be355706f8dfa772 -- scripts/glossary-senses.json && echo BASE-ALLOWLIST-UNCHANGED
```

```text
BASE-ALLOWLIST-UNCHANGED
```

A baseline-to-current JSON walk compared all 129 Arabic bundles, every leaf path and type,
restricted changed values to the judged brief/stance families, and rejected U+FFFD:

```text
VALUE-ONLY-OK files=129 changedValues=119 structuralDiffs=0 unexpectedValueDiffs=0 replacementChars=0
```

## Required repository oracles

The drilled census oracle ran verbatim:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control && node "$R/scripts/glossary-census.mjs" "$R" --row brief-artifact && node "$R/scripts/glossary-census.mjs" "$R" --row stance
```

```text
{
  "control": "PASS",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true
}
UNCLASSIFIED glossary occurrences: 0
UNCLASSIFIED glossary occurrences: 0
```

The plan's walked-leaf parity and non-empty-overlay oracle ran verbatim and exited zero:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node -e "const fs=require(\"fs\"),path=require(\"path\");const R=process.argv[1];const dir=R+\"/frontend/src/i18n\";const leaves=(o,p)=>Object.entries(o).flatMap(([k,v])=>(v&&typeof v===\"object\")?leaves(v,p+k+\".\"):[p+k]);let checked=0,bad=0;for(const f of fs.readdirSync(dir+\"/en\")){if(!f.endsWith(\".json\"))continue;const en=JSON.parse(fs.readFileSync(dir+\"/en/\"+f,\"utf8\"));const ar=JSON.parse(fs.readFileSync(dir+\"/ar/\"+f,\"utf8\"));const a=new Set(leaves(ar,\"\"));for(const k of leaves(en,\"\")){checked++;if(!a.has(k)){console.error(\"parity broken \"+f+\":\"+k);bad++}}}if(checked===0){console.error(\"POSITIVE CONTROL FAILED — no leaves walked\");process.exit(1)}if(bad)process.exit(1);const ov=JSON.parse(fs.readFileSync(R+\"/scripts/glossary-senses.d/brief-stance.json\",\"utf8\"));if(!Array.isArray(ov.rows)||ov.rows.length===0){console.error(\"this lane recorded no classification rows — either nothing was judged or the trail was not committed\");process.exit(1)}console.log(\"SWEEP-STRUCT-OK checked=\"+checked+\" rows=\"+ov.rows.length)" "$R"
```

```text
SWEEP-STRUCT-OK checked=16919 rows=76
```

`git diff --check` also returned no output.

## D-05: population boundary

The write population is 28 changed Arabic bundles within the authorized 42-bundle slice, the
brief/stance overlay, and this summary. The census read population is all 129 Arabic bundles;
the overlay therefore records session/preparation senses wherever the repo-wide instrument finds
them, without editing bundles outside the slice.

Outside the write population are the other 87 Arabic bundles, every English value, every Arabic
key name, every source file, all other glossary families, and Arabic naturalness beyond the ruled
D-18 rows. This is part 1 of 1: no brief-artifact or stance census cleanup is deferred to a later
task, while unrelated glossary families and later Phase 99 work remain outside this lane.
