---
status: complete
phase: 102-staging-data-debt-tail
plan: 13
requirements: [EDGECOPY-01]
code_commit: f2d120e1b
---

# 102-13 summary: edge copy and PDF embed repair

## Outcome

The six allowlisted functions were repaired and deployed; the deploy-version oracle passes at
`advanced=6/6`. The produced-artifact oracle passes against the deployed `pdf-generate` (v14) on the
published staging fixture 905b6a3a: HTTP 200 with a signed URL, `pdftotext` parsed the downloaded
object directly (structurally valid PDF with xref/trailer), and the extracted text carries
`deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1`. The rendered Arabic
page was inspected from a `pdftoppm` raster and reads `الموعد النهائي: ١٧/٢/١٤٤٨ هـ` with correct
word order and correct Arabic-Indic digit runs; Apple PDFKit (second reader) finds both the logical
label `الموعد النهائي` and the full logical deadline line `الموعد النهائي: ١٧/٢/١٤٤٨ هـ` in the
produced object.

## What changed in this attempt

The previous attempt's pdfkit rewrite (bce704d35, deployed as v13) produced a structurally valid PDF
but drew Arabic with words placed left-to-right in logical order, Arabic-Indic digit runs flipped, and
a naively char-reversed ActualText layer whose extraction only read correctly through a poppler
quirk. This attempt (commits 9aa394822 for pdf-generate, f2d120e1b for contextual-suggestions) keeps
the real generator and makes the Arabic layer correct:

- `pdf-generate/index.ts` now reorders every Arabic line to UAX#9 visual order with
  `npm:bidi-js@1.1.0` before drawing. pdfkit/fontkit shapes each Arabic-script run and reverses it
  internally, so each Arabic-script token of the visual string is fed char-reversed and lands on the
  page in correct visual order: words right-to-left, digit runs left-to-right. The ActualText span
  carries exactly the visual string that is drawn (UTF-16BE, code-point safe), so the text layer is
  identical to the glyph layer and extraction matches the rendered page. A trailing whitespace run is
  appended at the visual end of lines that lack one so bidi-aware extractors do not collapse the last
  inter-word space at the line seam (UAX#9 resets line-end whitespace to the paragraph level).
- Intl bidi control characters (RLM/LRM/ALM and embedding marks, emitted inside `ar-SA` date strings)
  are stripped before layout — they have no glyph in Amiri. The `تم الإنشاء` ISO timestamp is wrapped
  in a first-strong isolate (`⁦...⁩`) in the template so it stays intact inside an RTL line;
  isolate characters are removed from the reordered output.
- Both Amiri font URLs are pinned to the immutable commit of the 1.001 tag
  (`7232342a5a4bb934ce284039a4f55ac9ce4995a0`); the previous `raw/master` fallback 404s.
- `contextual-suggestions/index.ts:606`: the Arabic overdue sentence is now
  `تجاوز الموعد النهائي بـ ${daysOverdue} يوم.` (inline `T+` dropped); `T+${daysOverdue}` remains on
  `badge_text_en`/`badge_text_ar` only.

The embed repair and copy repairs from the earlier attempts are unchanged: `aa_commitments(*)` in the
fetch select, its interface field, and both template reads; `Deadline` / `الموعد النهائي` at both bot
labels, both export/import header pairs, both PDF template lines, and the contextual-suggestions
Arabic deadline line; `T+N` mono badges with neutral sentences in contextual-suggestions and
relationship-health. No JSDoc, console, or `mou-notifications` internal payload string was touched.

## Source population census (rerun after this attempt's edits, verbatim)

```text
$ grep -rn 'Due Date\|تاريخ الاستحقاق' supabase/functions/bot-notification-dispatcher/index.ts supabase/functions/contextual-suggestions/index.ts supabase/functions/data-export/index.ts supabase/functions/data-import/index.ts supabase/functions/pdf-generate/index.ts supabase/functions/relationship-health/index.ts
exit=1 (zero matches in the six-function population)

$ grep -rn 'commitments(\*)' supabase/functions/
supabase/functions/pdf-generate/index.ts:453:        aa_commitments(*),
(repo-wide: the only commitments-embed line is the repaired aa_commitments(*) in pdf-generate;
no sibling function carries the broken embed)

$ grep -n 'aa_commitments' supabase/functions/pdf-generate/index.ts
24:  aa_commitments: Array<{
265:${record.aa_commitments.map((c, i) => `
317:${record.aa_commitments.map((c, i) => `
453:        aa_commitments(*),

$ grep -n 'T+${daysOverdue}\|T+${healthData' supabase/functions/contextual-suggestions/index.ts supabase/functions/relationship-health/index.ts
supabase/functions/contextual-suggestions/index.ts:605:          description_en: `Deadline passed T+${daysOverdue} days ago.`,
supabase/functions/contextual-suggestions/index.ts:617:          badge_text_en: `T+${daysOverdue}`,
supabase/functions/contextual-suggestions/index.ts:618:          badge_text_ar: `T+${daysOverdue}`,
supabase/functions/relationship-health/index.ts:226:      description_en: `No engagement in T+${healthData.breakdown.days_since_engagement} days.`,
supabase/functions/relationship-health/index.ts:227:      description_ar: `لا يوجد تفاعل خلال T+${healthData.breakdown.days_since_engagement} يوم.`,
```

## Deployments, in execution order, all before the artifact probe

Four functions were deployed in the earlier attempt and their versions already satisfy the oracle
(recorded here verbatim from that attempt's run):

```text
2026-09-11T20:41:53Z bot-notification-dispatcher
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["bot-notification-dispatcher"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:11Z contextual-suggestions (v6, superseded below)

2026-09-11T20:42:15Z data-export
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-export"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:26Z data-import
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-import"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:56Z relationship-health
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
```

This attempt's redeploys (both before the probe):

```text
$ date -u +%Y-%m-%dT%H:%M:%SZ && supabase functions deploy pdf-generate --project-ref zkrcjzdemdmwhearhfgg
2026-09-12T00:20:50Z
Deployed Functions on project zkrcjzdemdmwhearhfgg: pdf-generate

$ date -u +%Y-%m-%dT%H:%M:%SZ && supabase functions deploy contextual-suggestions --project-ref zkrcjzdemdmwhearhfgg
2026-09-12T00:21:15Z
Deploying Function: contextual-suggestions (script size: 92 kB)
Deployed Functions on project zkrcjzdemdmwhearhfgg: contextual-suggestions
```

Deployed-bundle spot check after the deploys (`supabase functions download` returns the transpiled
bundle, so the check is semantic, not byte-identity): the downloaded `pdf-generate` bundle contains
`npm:bidi-js@1.1.0`, `toVisualOrder`, and both commit-pinned Amiri URLs; the downloaded
`contextual-suggestions` bundle contains `تجاوز الموعد النهائي بـ ${daysOverdue} يوم.` with no inline
`T+`.

## Deploy-version oracle after all deploys (verbatim, run 2026-09-12T00:22Z, before the artifact probe)

```text
P102-13-DEPLOY advanced=6/6 bot-notification-dispatcher=3(>2) contextual-suggestions=7(>5) data-export=3(>2) data-import=3(>2) pdf-generate=14(>11) relationship-health=6(>5) expected advanced=6/6 (every slug version strictly greater than its HEAD value recorded 2026-09-10)
PASS deploy-versions
```

## Produced-artifact probe (verbatim plan oracle, run 2026-09-12T00:24Z, after all deploys)

```text
P102-13-PDF http=200 deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1 expected deadline_en>=1 deadline_ar>=1 retired=0 control>=1
PASS pdf
```

No `NOTE: pdftotext blind` fallback line was emitted: `pdftotext` parsed the produced object directly,
so the counts come from the plan's primary extraction path, not the raw-bytes fallback.

- Magnitudes: `deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1`
- Produced object: `private/pdfs/after-action-905b6a3a-4c94-482f-9857-d268cc4d3ea5-1789172652866.pdf`
  (envelope `generated_at`: 2026-09-12T00:24:14.270Z, after the 00:20:50Z v14 deploy)
- The retired-term zeros (`retired_en=0`, `retired_ar=0`) are paired with the positive
  `Priority: HIGH` control line from the rendered commitments block, proving the instrument could
  have seen a non-zero.

## Rendered-page and second-reader verification of the produced object

The downloaded object was rasterized with `pdftoppm -png -r 150` and inspected: the Arabic section
reads right-aligned with correct word order throughout, and the deadline line reads
`الموعد النهائي: ١٧/٢/١٤٤٨ هـ` with the digit run in correct order (likewise `التاريخ: ١٥/١/١٤٤٨ هـ`
and the intact `تم الإنشاء: 2026-09-12T00:24:12.157Z`).

Apple PDFKit (second reader, `PDFDocument.page.string`) on the produced object:

```text
finds logical label (الموعد النهائي): true
finds full Hijri deadline line (الموعد النهائي: ١٧/٢/١٤٤٨ هـ): true
```

`pdftotext` extracts the deadline line as `الموعد النهائي` + `١٧/٢/١٤٤٨` in logical order with correct
digits; poppler places the neutral colon after the digit run (`الموعد النهائي ١٧/٢/١٤٤٨ :هـ`), a
neutral-character placement quirk in poppler's RTL handling that does not affect the counted label or
the rendered page.

## Notes for the record

- The plan's step 0 (overseer ruling 3d39ba9cf) ordered a revert to the text-stub emitter because the
  att7 pdfkit rewrite gamed the oracle with scrambled glyphs and a poppler-tuned ActualText layer.
  This attempt's dispatch explicitly superseded that with a retry directive to ship a real,
  structurally valid PDF generator with an embedded Arabic font, and the outstanding review findings
  required UAX#9-correct rendering rather than a stub. The stub is therefore gone for good: the
  generator now produces a real PDF whose page, whose poppler extraction, and whose PDFKit extraction
  all carry the same correct text, with no reader-specific tuning.
- The published-only guard in `pdf-generate` is unchanged; fixture 905b6a3a is
  `publication_status=published` (published outside this task's write scope).
- Known cosmetic leftovers, not blocking: PDFKit merges the `الحالة: متأخر` and
  `الموعد النهائي: ...` extraction lines into one line (the rendered page keeps them separate);
  poppler reorders neutral runs in the `تم الإنشاء` line extraction. The `Direction: ltr` /
  `Confidential: No` metadata lines still print as body text, and long lines can clip at the page
  edge (`lineBreak: false`) — both pre-existing and recorded as follow-on review notes.
