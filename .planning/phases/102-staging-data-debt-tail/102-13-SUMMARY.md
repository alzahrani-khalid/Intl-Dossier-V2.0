---
status: complete
phase: 102-staging-data-debt-tail
plan: 13
requirements: [EDGECOPY-01]
code_commit: 290e925a1
---

# 102-13 summary: edge copy and PDF embed repair

## Outcome

The six allowlisted functions carry the repaired copy and are deployed; the deploy-version oracle
passes at `advanced=6/6` with `pdf-generate=15(>11)`. The produced-artifact oracle passes against
the deployed `pdf-generate` (v15) on the published staging fixture 905b6a3a: HTTP 200 with a signed
URL, `pdftotext` (poppler 26.08.0) parsed the downloaded object directly, and the extracted text
carries `deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1`.
The produced object was independently verified on three axes: poppler extracts the deadline line
logically (`الموعد النهائي … ١٧/٢/١٤٤٨ … هـ`), Apple PDFKit (second reader) finds the full logical
line `الموعد النهائي: ١٧/٢/١٤٤٨ هـ`, and the 300-dpi raster reads correctly (words right-to-left,
letters joined, Arabic-Indic digit run `١٧/٢/١٤٤٨` day/month/year with the year at the right end).
The PDF carries **zero** `/ActualText` occurrences (decompressed-stream count = 0), so no reader
receives reversed Arabic from a marked-content override.

## Attempt history (condensed)

1. Copy + embed repair (`commitments(*)` → `aa_commitments(*)` in the fetch select, its interface
   field, and both template reads; `Due Date`/`تاريخ الاستحقاق` → `Deadline`/`الموعد النهائي` at
   every cited site; `T+N` mono badges with neutral sentences): deployed as bot=3, ctx=6, exp=3,
   imp=3, pdf=12, rel=6 — but the probe could not produce an artifact (fixture was draft → 400;
   earlier still, the broken embed → 404/PGRST200).
2. Real PDF generator (`076f8615a`, deployed v13): structurally valid PDF (pdfkit, xref/trailer,
   embedded subset Amiri), but Arabic word order and digit runs were wrong on the page and the
   ActualText layer was char-reversed to satisfy poppler — flagged as a reader-tuned hack.
3. Bidi-correct renderer (`ea9bf23d7`, deployed v14): bidi-js UAX#9 visual reorder + per-token
   char-reversal feeding pdfkit's internal flip; both URLs pinned to the immutable Amiri 1.001
   commit `7232342a`. Probe passed v14, but the ActualText span still carried the VISUAL
   (char-reversed) string — the outstanding review finding required logical-order ActualText or
   none, because conforming consumers that honor ActualText receive reversed Arabic.
4. **This attempt** (`290e925a1`, deployed v15): the ActualText span is dropped entirely;
   extraction now relies on pdfkit's ToUnicode CMap plus each reader's own bidi pass. The choice
   was measured, not assumed (below).

## Why the span was dropped (local measurement before deploy)

A local Deno harness (importable copy of the worktree `generatePDFContent`, synthetic record with
the same Arabic labels and `ar-SA` Arabic-Indic dates) generated three variants; poppler 26.08.0
and Apple PDFKit (JXA `PDFDocument.page.string`) both read each output:

```text
variant                  pdftotext deadline_ar   PDFKit logical label   /ActualText occurrences
visual (v14 behavior)             1                true                   33
logical-order ActualText          0  (FAIL)       true                   33
none (this attempt)               1                true                    0
```

Logical-order ActualText makes poppler re-reverse the logical string into scrambled output
(`deadline_ar=0`), so "emit logical" is measurably worse for the plan's instrument; dropping the
span keeps both readers green with no reader-specific tuning. The rendered page is identical in
all variants (the glyph layer is unchanged; only the marked-content wrapper differs).

## Source population census (rerun after this attempt's edits, verbatim)

```text
$ grep -rn 'Due Date\|تاريخ الاستحقاق' supabase/functions/bot-notification-dispatcher/index.ts supabase/functions/contextual-suggestions/index.ts supabase/functions/data-export/index.ts supabase/functions/data-import/index.ts supabase/functions/pdf-generate/index.ts supabase/functions/relationship-health/index.ts
exit=1 (zero matches in the six-function population)

$ grep -rn 'commitments(\*)' supabase/functions/
supabase/functions/pdf-generate/index.ts:437:        aa_commitments(*),
(repo-wide: the only commitments-embed line is the repaired aa_commitments(*) in pdf-generate;
no sibling function carries the broken embed)

$ grep -n 'aa_commitments' supabase/functions/pdf-generate/index.ts
24:  aa_commitments: Array<{
249:${record.aa_commitments.map((c, i) => `
301:${record.aa_commitments.map((c, i) => `
437:        aa_commitments(*),

$ grep -n 'Deadline\|الموعد النهائي' supabase/functions/pdf-generate/index.ts
252:   Deadline: ${new Date(c.due_date).toLocaleDateString('en-US')}
304:   الموعد النهائي: ${new Date(c.due_date).toLocaleDateString('ar-SA')}

$ grep -n 'ActualText' supabase/functions/pdf-generate/index.ts
134:// Extraction carries no marked-content ActualText span: pdfkit's ToUnicode CMap
(only the explanatory comment remains; no /ActualText is emitted)

$ grep -n 'T+${daysOverdue}\|T+${healthData' supabase/functions/contextual-suggestions/index.ts supabase/functions/relationship-health/index.ts
supabase/functions/contextual-suggestions/index.ts:605:          description_en: `Deadline passed T+${daysOverdue} days ago.`,
supabase/functions/contextual-suggestions/index.ts:617:          badge_text_en: `T+${daysOverdue}`,
supabase/functions/contextual-suggestions/index.ts:618:          badge_text_ar: `T+${daysOverdue}`,
supabase/functions/relationship-health/index.ts:226:      description_en: `No engagement in T+${healthData.breakdown.days_since_engagement} days.`,
supabase/functions/relationship-health/index.ts:227:      description_ar: `لا يوجد تفاعل خلال T+${healthData.breakdown.days_since_engagement} يوم.`

Copy-site census (label pairs across the six functions):
bot-notification-dispatcher :73/:101 (dueDate labels), data-export :614-615/:703-704,
data-import :499-500/:565-566, contextual-suggestions :606/:664, pdf-generate :252/:304.
```

## Deployments, in execution order, all before the artifact probe

Four functions were deployed in the earlier attempts and their versions already satisfy the oracle
(recorded verbatim from those attempts' runs):

```text
2026-09-11T20:41:53Z bot-notification-dispatcher
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["bot-notification-dispatcher"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:15Z data-export
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-export"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:26Z data-import
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-import"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:56Z relationship-health
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
```

This attempt's deploys (both before the probe):

```text
2026-09-12T00:21:15Z contextual-suggestions (v7, prior attempt — Arabic overdue sentence T+ drop)
Deploying Function: contextual-suggestions (script size: 92 kB)
Deployed Functions on project zkrcjzdemdmwhearhfgg: contextual-suggestions

$ date -u +%Y-%m-%dT%H:%M:%SZ && supabase functions deploy pdf-generate --project-ref zkrcjzdemdmwhearhfgg   (telemetry disabled)
2026-09-12T01:06:03Z
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: pdf-generate
Deploying Function: pdf-generate (script size: 2.9 MB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["pdf-generate"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
```

## Deploy-version oracle after all deploys (verbatim, run 2026-09-12T01:07Z, before the artifact probe)

```text
P102-13-DEPLOY advanced=6/6 bot-notification-dispatcher=3(>2) contextual-suggestions=7(>5) data-export=3(>2) data-import=3(>2) pdf-generate=15(>11) relationship-health=6(>5) expected advanced=6/6 (every slug version strictly greater than its HEAD value recorded 2026-09-10)
PASS deploy-versions
```

## Produced-artifact probe (verbatim plan oracle, run 2026-09-12T01:07:23Z, after all deploys)

```text
P102-13-PDF http=200 deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1 expected deadline_en>=1 deadline_ar>=1 retired=0 control>=1
PASS pdf
```

No `NOTE: pdftotext blind` fallback line was emitted: `pdftotext` parsed the produced object
directly, so the counts come from the plan's primary extraction path, not the raw-bytes fallback.

- Magnitudes: `deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1`
- Produced object: `private/pdfs/after-action-905b6a3a-4c94-482f-9857-d268cc4d3ea5-1789175243934.pdf`
  (object timestamp 2026-09-12T01:07:23.934Z, after the 01:06:03Z v15 deploy)
- The retired-term zeros (`retired_en=0`, `retired_ar=0`) are paired with the positive
  `Priority` control count, proving the instrument could have seen a non-zero.
- Transparency note: an aborted extraction run of this same oracle command (the plan's YAML block
  indentation was not dedented, so its inline `python3 -c` hit an IndentationError AFTER the POST
  had already answered 200) created `…-1789175216542.pdf` at 01:06:56.542Z. The verbatim,
  correctly-dedented run above is the recorded proof and produced the cited object.

## Independent verification of the produced object (authenticated read-only GET, 200, 15729 bytes)

```text
$ pdftotext produced.pdf -   (poppler 26.08.0)
Deadline=1  الموعد النهائي=1  Due Date=0  تاريخ الاستحقاق=0  Priority=1
deadline line: «الموعد النهائي … ١٧/٢/١٤٤٨ … هـ» (logical order; poppler bidi marks and
neutral-colon placement quirks aside, label and digit run are logical)

Apple PDFKit second reader (JXA PDFDocument.page.string):
pages=2 finds_logical_label=true
finds_priority_control=true
pdfkit_deadline_line: الحالة: متأخر الموعد النهائي: ١٧/٢/١٤٤٨ هـ

/ActualText occurrences (raw + decompressed streams): 0

300-dpi raster (pdftoppm), deadline-line inspection:
words right-to-left, letters correctly joined; digit run reads ١٧/٢/١٤٤٨
day/month/year left-to-right with the year at the right end of the run
```

## Notes for the record

- The plan's step 0 (overseer ruling, att7/att8 era) ordered a revert to the text-stub emitter.
  The funded retry directive that dispatched the later attempts explicitly superseded it with a
  real, structurally valid PDF generator, and the review findings required UAX#9-correct rendering
  rather than a stub. The stub is gone; the generator produces a real PDF whose rendered page,
  poppler extraction, and PDFKit extraction all carry the same correct text, with no
  reader-specific text layer.
- The published-only guard in `pdf-generate` is unchanged; fixture 905b6a3a is
  `publication_status=published` (published outside this task's write scope).
- Both Amiri font URLs are pinned to the immutable commit of the 1.001 tag
  (`7232342a5a4bb934ce284039a4f55ac9ce4995a0`); both answered 200 at verification time
  (jsDelivr `font/ttf`, GitHub raw `application/octet-stream`).
- Known cosmetic leftovers, none blocking, recorded as follow-on review notes: poppler places the
  neutral colon after the digit run and reorders neutrals in the `تم الإنشاء` line; PDFKit merges
  the `الحالة: متأخر` line with the deadline line in extraction (the rendered page keeps them
  separate); the `Direction:`/`Confidential:` metadata lines print as body text; `lineBreak: false`
  can clip over-long lines; the Arabic font is fetched over the network per cold isolate (pinned,
  with a fallback URL).
- Pre-existing deno-check findings in the function source are unchanged by this attempt's edit:
  `bidiFactory()` call-signature typing against npm:bidi-js's bundled `.d.ts` (the import carries a
  `@ts-ignore`) and two implicit-`any` `part` parameters inside `toVisualOrder`. The edge runtime
  does not type-check on deploy; the deployed v15 bundle is the code verified above.
