# P99-28 Summary — dossier-object sense split, slice B

## Outcome

The declared 32-file Arabic slice now uses `دوسيه` for the dossier object while preserving `ملف`
for its sanctioned computer-file, attachment, and profile senses. The sweep changed 185 Arabic leaf
values and no key structure. The drilled row moved from 243 competing `ملف` occurrences and 11
ruled `دوسيه` occurrences to 49 allowlisted `ملف` occurrences and 205 ruled `دوسيه` occurrences,
with zero unclassified occurrences.

The 49 survivors are positive evidence that this was a sense split rather than a blanket rewrite.
Twenty exact overlay rows classify 21 occurrences (the parse-error leaf contains the term twice),
while the unchanged base allowlist classifies the other 28 occurrences. Two dossier references that
the base file-key pattern happened to match were still rewritten after their English counterparts
confirmed the dossier-object sense. A mixed document-tour leaf now says to attach `الملفات` to
`دوسيهاتك`, preserving one file occurrence while correcting the dossier occurrence in the same
value.

This lands D-04, D-05, D-17, D-18, D-19, and D-39. All terminology remains in i18n leaf values, so
an operator-directed term reversal remains a leaf-value change followed by the same parity proof.

## D-04: re-derived populations

The untouched task base was `018b473f4f11a0bcc00c526666d6bff3f45dac76`. Before any live census or
sweep, the planted control was run with:

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

The before population was re-derived from the task-base bundles and task-base allowlists. The live
overlay supplied only the pinned slice declaration; it was not loaded as an allowlist into the
temporary base census:

```sh
P99_BASE_TMP=$(mktemp -d)
git archive HEAD^ -- frontend/src/i18n/ar scripts/glossary-census.mjs scripts/glossary-senses.json scripts/glossary-senses.d/brief-stance.json scripts/glossary-senses.d/engagement.json | tar -x -C "$P99_BASE_TMP"
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$P99_BASE_TMP/scripts/glossary-census.mjs" "$P99_BASE_TMP" --census --row dossier --slice "$R/scripts/glossary-senses.d/dossier-b.json" | sed -n '1,7p'
```

```text
glossary census: 3924 Arabic leaf values across 32 file(s)
dossier	ruled=دوسيه	before=243	after=11	unclassified=213
  دوسيه	ruled-term	occurrences=11	lines=11	values=11	files=1	ruled=11	allowlisted=0	unclassified=0
  دوسييه	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
  ملف	competing-term	occurrences=243	lines=231	values=231	files=32	ruled=0	allowlisted=30	unclassified=213
classification totals: ruled=11 allowlisted=30 UNCLASSIFIED=213
UNCLASSIFIED glossary occurrences: 213
```

After classifying every rejected value by key path and sense, the same drilled slice reported:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --census --row dossier --slice scripts/glossary-senses.d/dossier-b.json
```

```text
glossary census: 3924 Arabic leaf values across 32 file(s)
dossier	ruled=دوسيه	before=49	after=205	unclassified=0
  دوسيه	ruled-term	occurrences=205	lines=196	values=196	files=30	ruled=205	allowlisted=0	unclassified=0
  دوسييه	competing-term	occurrences=0	lines=0	values=0	files=0	ruled=0	allowlisted=0	unclassified=0
  ملف	competing-term	occurrences=49	lines=47	values=47	files=9	ruled=0	allowlisted=49	unclassified=0
classification totals: ruled=205 allowlisted=49 UNCLASSIFIED=0
UNCLASSIFIED glossary occurrences: 0
```

Thus 194 dossier-sense occurrences were rewritten across 185 leaf values. All 49 surviving
competing occurrences are classified, and none was accepted merely because the key happened to
contain an English file-like substring.

## Classification artifact

`scripts/glossary-senses.d/dossier-b.json` pins exactly 32 owned bundle paths and adds 20 exact,
live classifications. It does not remove, modify, broaden, weaken, duplicate, or override any base
allowlist row. Representative reasons are:

- `export-import:import.error.parseError` — both mentions refer to the uploaded computer file and
  its format.
- `guided-tours:tours.document.steps.intro.content` — after correcting the dossier reference, the
  survivor names files attached to that dossier.
- `persons:create.subtitle` — the English counterpart explicitly says contact profile, a D-17
  sanctioned profile sense.

The append-only, liveness, value-only, and scope audit printed:

```text
VALUE-ONLY-OK files=32 changedValues=185 structuralDiffs=0 enDiffs=0 applicationSourceDiffs=0 replacementChars=0
SCOPE-OK changedPaths=31 authorizedPaths=34 outOfScope=0
ALLOWLIST-APPEND-ONLY baseRows=6 overlayRows=20 matchedValues=20 duplicateOverrides=0 slice=32
```

The `changedPaths=31` figure is for the atomic sweep commit: 30 Arabic bundles plus the overlay.
`loading.json` and `persons.json` are declared slice members whose sanctioned values survived
unchanged and are now classified exactly. This summary is the only additional changed path.

## Required census and structural oracles

The plan's chained planted-control, zero-unclassified, and 32-file scope-pin oracle ran verbatim:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/glossary-census.mjs" "$R" --control && node "$R/scripts/glossary-census.mjs" "$R" --row dossier --slice scripts/glossary-senses.d/dossier-b.json && node -e "const o=JSON.parse(require(\"fs\").readFileSync(process.argv[1]+\"/scripts/glossary-senses.d/dossier-b.json\",\"utf8\"));if(!Array.isArray(o.slice)||o.slice.length!==32){console.error(\"the overlay declares \"+(o.slice||[]).length+\" slice files, not this lane 32\");process.exit(1)}" "$R"
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

The plan's repo-wide parity walker and non-empty-overlay positive control printed:

```text
SWEEP-STRUCT-OK checked=16919 rows=20
```

The value-only comparison against the task base walked all 32 declared Arabic files, compared
ordered leaf paths and types, rejected English and application-source changes, checked for U+FFFD,
and counted 185 changed values. `git diff --check` was clean. The atomic sweep commit is
`8fcac539a8ebfa684f6898fcf4b89ed0c26b2582` (`fix(i18n): classify dossier senses in slice b`). Its
commit hooks completed formatting and the configured repository build/static workflow.

## D-05: population boundary

Population: the exact 32 Arabic bundle paths declared in `dossier-b.json`, the additive
classification overlay, and this summary. The census population is 3,924 Arabic leaf values in
those 32 files; the changed-value population is the 185 leaves carrying the corrected dossier
sense.

Outside this lane: the dossier A and C bundle slices owned by P99-27 and P99-29, every other glossary
family, every English value, every Arabic key name, every application source file, Arabic
naturalness beyond the ruled glossary rows, and the repo-wide closing battery. Those remain with
their named Phase 99 lanes. P99-28 is part 1 of 1 and leaves no unclassified dossier-row occurrence
inside its declared slice.
