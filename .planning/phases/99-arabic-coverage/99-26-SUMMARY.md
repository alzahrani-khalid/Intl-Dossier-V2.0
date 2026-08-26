# P99-26 Summary — brief-artifact and stance sense-aware sweep

## Outcome

The repo-wide brief-artifact and stance rows are green. Arabic brief artifacts now use the
ملخص family and stance objects use the موقف family. Genuine different senses survive only through
exact, live classifications: 22 موجز occurrences (calendar feed, digest publication, or concise
adjective), 56 إحاطة occurrences (briefing session, book, pack, document type, or preparation
material), 44 singular منصب occurrences (office/post/job title), and nine plural مناصب occurrences
(office/post/job title).

The two onboarding artifact values identified by RULING-P99-98 were rewritten to ملخص, not
allowlisted. The stance instrument now enumerates منصب and مناصب as distinct competing-term
identities, so all nine plural overlay rows are consumed. Its expanded control retains the original
planted dossier failure and independently proves an allowlisted plural plus a planted unclassified
plural.

This lands D-04, D-05, D-17, D-18, D-19, and D-39. Terms remain in i18n leaves, making a future
operator term swap a leaf-value change plus parity re-run.

## D-04: re-derived populations

The untouched task base was b7cd542e8fafc46708b54d451616f55f28bd1f99. The initial control was run
before applying the candidate sweep and caught its original planted dossier occurrence. After the
ruled plural repair, the final chained proof again runs the expanded control before either live row.

The final instrument's term identities were applied to the untouched base with:

```sh
node -e 'const c=require("child_process"),r="b7cd542e8fafc46708b54d451616f55f28bd1f99",items=[["ملخص","ملخص"],["موجز","موجز"],["إحاطة","إحاطة"],["موقف","موقف|مواقف"],["منصب","منصب"],["مناصب","مناصب"]],n=Object.fromEntries(items.map(([t])=>[t,0]));let files=0,leaves=0;const walk=o=>{for(const v of Object.values(o))if(typeof v==="string"){leaves++;for(const [t,p]of items)n[t]+=(v.match(new RegExp(p,"gu"))||[]).length}else if(v&&typeof v==="object")walk(v)};for(const p of c.execFileSync("git",["ls-tree","-r","--name-only",r,"--","frontend/src/i18n/ar"],{encoding:"utf8"}).trim().split("\n").filter(p=>p.endsWith(".json"))){files++;walk(JSON.parse(c.execFileSync("git",["show",r+":"+p],{encoding:"utf8"})))}console.log("BASE-POP ref="+r+" files="+files+" leaves="+leaves+" "+items.map(([t])=>t+"="+n[t]).join(" "));console.log("brief-artifact before="+(n["موجز"]+n["إحاطة"])+" after="+n["ملخص"]);console.log("stance before="+(n["منصب"]+n["مناصب"])+" after="+n["موقف"])'
```

```text
BASE-POP ref=b7cd542e8fafc46708b54d451616f55f28bd1f99 files=129 leaves=16943 ملخص=160 موجز=128 إحاطة=67 موقف=211 منصب=50 مناصب=14
brief-artifact before=195 after=160
stance before=64 after=211
```

The final repo-wide populations were re-derived with:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --row brief-artifact --census && node "$R/scripts/glossary-census.mjs" "$R" --row stance --census
```

```text
glossary census: 16943 Arabic leaf values across 129 file(s)
brief-artifact	ruled=ملخص / الملخصات	before=78	after=278	unclassified=0
  ملخص	ruled-term	occurrences=278	lines=271	values=271	files=54	ruled=278	allowlisted=0	unclassified=0
  موجز	competing-term	occurrences=22	lines=22	values=22	files=9	ruled=0	allowlisted=22	unclassified=0
  إحاطة	competing-term	occurrences=56	lines=55	values=56	files=13	ruled=0	allowlisted=56	unclassified=0
classification totals: ruled=278 allowlisted=78 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
glossary census: 16943 Arabic leaf values across 129 file(s)
stance	ruled=موقف / المواقف	before=53	after=222	unclassified=0
  موقف	ruled-term	occurrences=222	lines=216	values=216	files=39	ruled=222	allowlisted=0	unclassified=0
  منصب	competing-term	occurrences=44	lines=44	values=44	files=11	ruled=0	allowlisted=44	unclassified=0
  مناصب	competing-term	occurrences=9	lines=9	values=9	files=6	ruled=0	allowlisted=9	unclassified=0
classification totals: ruled=222 allowlisted=53 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
```

The changes therefore move the ruled families as follows:

- Brief competing occurrences: 195 → 78; ruled ملخص occurrences: 160 → 278.
- Stance competing occurrences, including the irregular plural: 64 → 53; ruled موقف/مواقف
  occurrences: 211 → 222.
- Every surviving competing occurrence is allowlisted by exact term identity and key path; both
  rows have zero unclassified occurrences.

## Classification artifact

scripts/glossary-senses.d/brief-stance.json contains 84 exact rows across 43 owned slice bundles:
22 موجز, 53 إحاطة, and nine مناصب rows. The unchanged base allowlist classifies the 44 singular
منصب survivors and three of the إحاطة survivors. The overlay only adds classifications; it does
not remove, duplicate, override, broaden, or weaken any base row.

Representative reasons include:

- موجز at calendar-sync:ical.feedUrl — an iCal feed, not a brief artifact.
- إحاطة at briefing-books:builder.title — a briefing book/session-preparation artifact, not the
  governed brief object.
- مناصب at dossier:sections.person.positionsHeld — offices or jobs held by a person, not policy
  stances.

The live-row revalidation and append-only check ran as:

```sh
node -e 'const fs=require("fs"),o=require("./scripts/glossary-senses.d/brief-stance.json");let matched=0;const ids=new Set;for(const r of o.rows){for(const k of ["term","file","keyPath","sense","reason"])if(typeof r[k]!=="string"||!r[k])throw Error("missing "+k);const id=r.term+"\\0"+r.file+"\\0"+r.keyPath;if(ids.has(id))throw Error("duplicate "+id);ids.add(id);const doc=JSON.parse(fs.readFileSync("frontend/src/i18n/ar/"+r.file,"utf8"));const value=r.keyPath.split(".").reduce((v,k)=>v?.[k],doc);if(typeof value!=="string"||!value.includes(r.term))throw Error("stale row "+id);matched++}console.log("OVERLAY-REVALIDATED slice="+o.slice.length+" rows="+o.rows.length+" matchedValues="+matched+" senses="+new Set(o.rows.map(r=>r.sense)).size+" pluralRows="+o.rows.filter(r=>r.term==="مناصب").length)'
node -e 'const fs=require("fs"),cp=require("child_process");const ref="b7cd542e8fafc46708b54d451616f55f28bd1f99",file="scripts/glossary-senses.json";const before=cp.execFileSync("git",["show",ref+":"+file],{encoding:"utf8"}),after=fs.readFileSync(file,"utf8"),base=JSON.parse(after),overlay=JSON.parse(fs.readFileSync("scripts/glossary-senses.d/brief-stance.json","utf8"));if(before!==after)throw Error("base allowlist changed");const identity=r=>r.term+"\\0"+(r.keyPathPattern??(r.file+":"+r.keyPath));const baseIds=new Set(base.entries.map(identity));const overlaps=overlay.rows.filter(r=>baseIds.has(identity(r)));if(overlaps.length)throw Error("overlay duplicates base row");console.log("ALLOWLIST-APPEND-ONLY baseRows="+base.entries.length+" overlayRows="+overlay.rows.length+" duplicateOverrides="+overlaps.length)'
```

```text
OVERLAY-REVALIDATED slice=43 rows=84 matchedValues=84 senses=11 pluralRows=9
ALLOWLIST-APPEND-ONLY baseRows=6 overlayRows=84 duplicateOverrides=0
```

## Required census and structural oracles

The plan's verbatim chained oracle ran against the real worker root:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control && node "$R/scripts/glossary-census.mjs" "$R" --row brief-artifact && node "$R/scripts/glossary-census.mjs" "$R" --row stance
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
UNCLASSIFIED glossary occurrences: 0
```

The plan's repo-wide parity walker and non-empty-overlay positive control then printed:

```text
SWEEP-STRUCT-OK checked=16919 rows=84
```

The committed-base leaf-map audit walked all 129 Arabic bundles, compared ordered key paths and
leaf types, counted value edits, rejected English/application-source diffs, and checked U+FFFD.
The scope audit compared every changed path with the 43-file overlay slice plus the three authorized
instrument/artifact/summary paths:

```text
VALUE-ONLY-OK files=129 changedValues=125 structuralDiffs=0 nonStringDiffs=0 enDiffs=0 applicationSourceDiffs=0 replacementChars=0
SCOPE-OK changedPaths=32 authorizedPaths=46 outOfScope=0
```

Thus no Arabic leaf key or type changed, no English value changed, no application source changed,
and scripts/glossary-census.mjs is the only source instrument changed.

## Verbatim acceptance tests

scripts/glossary-census.mjs contains six Vitest tests whose leaf titles are the six acceptance
criteria verbatim. They exercise live repo-wide rows, overlay liveness, append-only base behavior,
plural controls, value-only structural equality against the task base, scope, and bundle parity.

```sh
VITEST=true node --input-type=module -e 'import { startVitest } from "vitest/node"; const ctx = await startVitest("test", ["scripts/glossary-census.mjs"], { root: process.cwd(), include: ["scripts/glossary-census.mjs"], environment: "node", setupFiles: [], watch: false }); if (!ctx) process.exitCode = 1'
```

```text
Test Files  1 passed (1)
Tests  6 passed (6)
ACCEPTANCE-TITLES-OK expected=6 actual=6 missing=0 extra=0
```

The commit hooks also completed the repository build and test workflow while creating the two final
atomic commits.

## D-05: population boundary

Population: all 129 Arabic bundles for the two repo-wide drilled rows; the owned write population is
the ordered 43-file Arabic slice in brief-stance.json, the additive classification overlay,
scripts/glossary-census.mjs, and this summary.

Outside this lane: every other glossary family, the other Arabic bundle slices, every English value,
every Arabic key name, every application source file, Arabic naturalness beyond D-18's ruled rows,
and instrument behavior outside the distinct stance terms and expanded control. Those remain owned
by their named Phase 99 lanes and the phase-close battery; P99-26 is part 1 of 1 and leaves no
brief-artifact or stance occurrence for a later task.
