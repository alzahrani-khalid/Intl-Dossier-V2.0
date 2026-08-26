# P99-25 Summary — engagement sense sweep complete

## Result

The sense-aware engagement sweep is complete. Across the real repository census, 150
engagement-object occurrences were rewritten from the `ارتباط` family to the ruled `مشاركة`
family in 30 Arabic bundles. The remaining 17 `ارتباط` occurrences are genuine link, graph,
relationship, association, or affiliation senses; every one is recorded at its exact file and key
path in `scripts/glossary-senses.d/engagement.json`.

The ruled family grew from 183 to 333 occurrences, the competing family fell from 167 to 17, and
unclassified occurrences fell from 167 to zero. No engagement-object occurrence is allowlisted.
Only Arabic leaf values changed: all Arabic key paths and bundle shapes are unchanged, English
bundles and source files are unchanged, and all changed Arabic bundles are free of U+FFFD.

This implements D-04, D-05, D-17, D-18, D-19, and D-39: populations were re-derived at the
untouched start and after the sweep; the write/read boundaries are explicit; every occurrence was
judged by sense; the ruled term remains in i18n leaves; and the owned bundle slice is file-disjoint.

## D-04: re-derived populations

The untouched worker start was
`d64a831d8b3d98f1f7a908ca7b1d0854c62b9e42`. The planted control ran before the first real
census and before any value changed:

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

The before population was then re-derived from the unmodified repository root:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row engagement --census
```

The command printed one detail line for each of the 167 unclassified occurrences. Its count block
was:

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
engagement	ruled=مشاركة / المشاركات	before=167	after=183	unclassified=167
  مشاركة	ruled-term	occurrences=183	lines=172	values=183	files=54	ruled=183	allowlisted=0	unclassified=0
  ارتباط	competing-term	occurrences=167	lines=167	values=167	files=32	ruled=0	allowlisted=0	unclassified=167
classification totals: ruled=183 allowlisted=0 UNCLASSIFIED=167
UNCLASSIFIED glossary occurrences: 167
```

Exit status: `1`, proving the untouched tree was red.

The after population, re-derived from the real repository root after all bundle changes, is:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row engagement --census
```

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
engagement	ruled=مشاركة / المشاركات	before=17	after=333	unclassified=0
  مشاركة	ruled-term	occurrences=333	lines=319	values=330	files=71	ruled=333	allowlisted=0	unclassified=0
  ارتباط	competing-term	occurrences=17	lines=17	values=17	files=7	ruled=0	allowlisted=17	unclassified=0
classification totals: ruled=333 allowlisted=17 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
```

Exit status: `0`.

The owned 34-bundle slice independently reads green:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row engagement --slice scripts/glossary-senses.d/engagement.json --census
```

```text
glossary census: 6928 Arabic leaf values across 34 file(s)
engagement	ruled=مشاركة / المشاركات	before=17	after=232	unclassified=0
  مشاركة	ruled-term	occurrences=232	lines=229	values=229	files=34	ruled=232	allowlisted=0	unclassified=0
  ارتباط	competing-term	occurrences=17	lines=17	values=17	files=7	ruled=0	allowlisted=17	unclassified=0
classification totals: ruled=232 allowlisted=17 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
```

Exit status: `0`.

## Classification artifact

Every overlay row was revalidated against the current Arabic value at its exact file and key path;
duplicate identities, empty fields, stale values, and any `engagement-object` sense are failures:

```sh
node -e 'const fs=require("fs"),o=require("./scripts/glossary-senses.d/engagement.json");let matched=0;const ids=new Set;for(const r of o.rows){for(const k of ["term","file","keyPath","sense","reason"])if(typeof r[k]!=="string"||!r[k])throw Error("missing "+k);const id=r.term+"\\0"+r.file+"\\0"+r.keyPath;if(ids.has(id))throw Error("duplicate "+id);ids.add(id);if(r.sense.includes("engagement-object"))throw Error("laundered engagement object "+id);const doc=JSON.parse(fs.readFileSync("frontend/src/i18n/ar/"+r.file,"utf8"));const value=r.keyPath.split(".").reduce((v,k)=>v?.[k],doc);if(typeof value!=="string"||!value.includes(r.term))throw Error("stale row "+id);matched++}console.log("OVERLAY-REVALIDATED slice="+o.slice.length+" rows="+o.rows.length+" matchedValues="+matched+" senses="+new Set(o.rows.map(r=>r.sense)).size)'
```

```text
OVERLAY-REVALIDATED slice=34 rows=17 matchedValues=17 senses=5
```

Examples of the recorded judgments are:

- `dossier-context.json:widget.remove_link` — a dossier link.
- `graph.json:analyze.empty.path` — a graph connection.
- `relationships.json:guidance.categories.association.label` — an association category.
- `relationships.json:guidance.types.affiliate_of.tip` — a loose affiliation.

The base allowlist was not removed from, weakened, or otherwise edited:

```sh
git diff --quiet d64a831d8b3d98f1f7a908ca7b1d0854c62b9e42 -- scripts/glossary-senses.json && echo 'BASE-ALLOWLIST-UNCHANGED'
```

```text
BASE-ALLOWLIST-UNCHANGED
```

## Required repository oracles

The drilled census oracle ran verbatim against the real worker root:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control && node "$R/scripts/glossary-census.mjs" "$R" --row engagement
```

```text
{
  "control": "PASS",
  "plantedDousiyehCaught": true,
  "ruledTermPreserved": true,
  "allowlistedSensePreserved": true
}
UNCLASSIFIED glossary occurrences: 0
```

Exit status: `0`.

The plan's repo-wide walked-leaf parity and non-empty-classification positive control also ran
verbatim:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node -e "const fs=require(\"fs\"),path=require(\"path\");const R=process.argv[1];const dir=R+\"/frontend/src/i18n\";const leaves=(o,p)=>Object.entries(o).flatMap(([k,v])=>(v&&typeof v===\"object\")?leaves(v,p+k+\".\"):[p+k]);let checked=0,bad=0;for(const f of fs.readdirSync(dir+\"/en\")){if(!f.endsWith(\".json\"))continue;const en=JSON.parse(fs.readFileSync(dir+\"/en/\"+f,\"utf8\"));const ar=JSON.parse(fs.readFileSync(dir+\"/ar/\"+f,\"utf8\"));const a=new Set(leaves(ar,\"\"));for(const k of leaves(en,\"\")){checked++;if(!a.has(k)){console.error(\"parity broken \"+f+\":\"+k);bad++}}}if(checked===0){console.error(\"POSITIVE CONTROL FAILED — no leaves walked\");process.exit(1)}if(bad)process.exit(1);const ov=JSON.parse(fs.readFileSync(R+\"/scripts/glossary-senses.d/engagement.json\",\"utf8\"));if(!Array.isArray(ov.rows)||ov.rows.length===0){console.error(\"this lane recorded no classification rows — either nothing was judged or the trail was not committed\");process.exit(1)}console.log(\"SWEEP-STRUCT-OK checked=\"+checked+\" rows=\"+ov.rows.length)" "$R"
```

```text
SWEEP-STRUCT-OK checked=16919 rows=17
```

Exit status: `0`.

## Stronger value-only, structure, and encoding proof

A baseline-to-current JSON walk inspected all 129 Arabic bundles, compared every leaf path and
type, constrained every changed value to an `ارتباط` to `مشارك(?:ة|ات)` rewrite, and rejected
U+FFFD:

```sh
node -e 'const fs=require("fs"),cp=require("child_process"),path=require("path");const base="d64a831d8b3d98f1f7a908ca7b1d0854c62b9e42",dir="frontend/src/i18n/ar";const leaves=(o,p="",m=new Map)=>{for(const [k,v] of Object.entries(o)){const q=p?p+"."+k:k;if(v&&typeof v==="object"&&!Array.isArray(v))leaves(v,q,m);else m.set(q,{type:Array.isArray(v)?"array":typeof v,value:v})}return m};let files=0,changedValues=0,structuralDiffs=0,unexpectedValueDiffs=0,replacementChars=0;for(const name of fs.readdirSync(dir).filter(f=>f.endsWith(".json")).sort()){const file=path.join(dir,name),before=JSON.parse(cp.execFileSync("git",["show",base+":"+file],{encoding:"utf8"})),after=JSON.parse(fs.readFileSync(file,"utf8")),a=leaves(before),b=leaves(after);files++;if(JSON.stringify([...a.keys()])!==JSON.stringify([...b.keys()])||[...a].some(([k,v])=>!b.has(k)||b.get(k).type!==v.type)){console.error("STRUCTURAL-DIFF "+file);structuralDiffs++}for(const [k,v] of a){const next=b.get(k);if(!next||JSON.stringify(v.value)===JSON.stringify(next.value))continue;changedValues++;if(typeof v.value!=="string"||typeof next.value!=="string"||!v.value.includes("ارتباط")||next.value.includes("ارتباط")||!/مشارك(?:ة|ات)/u.test(next.value)){console.error("UNEXPECTED-VALUE-DIFF "+file+":"+k);unexpectedValueDiffs++}}if(fs.readFileSync(file,"utf8").includes("�")){console.error("U+FFFD "+file);replacementChars++}}console.log("VALUE-ONLY-OK files="+files+" changedValues="+changedValues+" structuralDiffs="+structuralDiffs+" unexpectedValueDiffs="+unexpectedValueDiffs+" replacementChars="+replacementChars);process.exit(structuralDiffs||unexpectedValueDiffs||replacementChars?1:0)'
```

```text
VALUE-ONLY-OK files=129 changedValues=150 structuralDiffs=0 unexpectedValueDiffs=0 replacementChars=0
```

Exit status: `0`. This proves no Arabic leaf key was renamed and no Arabic bundle structure
changed, including in files with mixed engagement and non-engagement senses. The implementation
commit hook also ran the repository build successfully. `git diff --check` returned:

```text
DIFF-CHECK-OK
```

## D-05: exact population boundary

The write population is the 34 Arabic bundles named by the task, plus the engagement overlay and
this summary. The census read population is all 129 `frontend/src/i18n/ar/*.json` bundles, which is
why the zero-unclassified statement is repository-wide. The overlay's `slice` array names all 34
owned bundles, including the newly authorized `dossier-recommendations.json` and
`operations-hub.json`.

Outside this lane's write population are the other 95 Arabic bundles; all English bundle values;
every Arabic key name; every source file; the other glossary term families; and Arabic naturalness
beyond the ruled D-18 engagement row. Those are not changed or claimed by this task. This is part
1 of 1 for the engagement family: no engagement-row occurrence is deferred to a later task, and
the repository-wide census leaves no engagement cleanup outstanding.
