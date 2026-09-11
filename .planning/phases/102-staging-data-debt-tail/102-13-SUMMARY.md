---
status: complete
phase: 102-staging-data-debt-tail
plan: 13
requirements: [EDGECOPY-01]
code_commit: 3a0ebd750
---

# 102-13 summary: edge copy and PDF embed repair

## Outcome

The six allowlisted functions were repaired and deployed; the deploy-version oracle passes at
`advanced=6/6`. The produced-artifact oracle passes against the deployed `pdf-generate` (v13): the
staging fixture 905b6a3a is now `publication_status=published`, the endpoint answered HTTP 200 with a
signed URL, `pdftotext` parsed the downloaded object (a structurally valid PDF with xref/trailer — the
former placeholder text-stub generator was replaced in this attempt), and the extracted text carries
`deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1`.

## Source population and repair

The source census was run over exactly the six scoped functions. After the repair:

```text
retired/display census
embed census
supabase/functions/pdf-generate/index.ts:318:        aa_commitments(*),
pdf consumers
130:${record.aa_commitments.map((c, i) => `
182:${record.aa_commitments.map((c, i) => `
318:        aa_commitments(*),
```

Thus `Due Date` / `تاريخ الاستحقاق` have zero matches in the six-function population. The positive embed
control finds three `aa_commitments` consumers. The repository-wide `commitments(*)` census finds only the
same corrected `aa_commitments(*)` line in `pdf-generate`; no sibling function carried the broken embed.

The diff changes:

- `pdf-generate/index.ts:313-321`: `commitments(*)` to `aa_commitments(*)`, its interface field, and both
  later template reads.
- `Deadline` / `الموعد النهائي` at both bot labels, both export/import header pairs, both PDF template
  lines, and contextual-suggestions' Arabic deadline line.
- Contextual overdue copy and both badges to the shared `T+${daysOverdue}` token with neutral locale copy.
- Relationship engagement-gap copy to the same `T+N` vocabulary in both locales.
- `pdf-generate/index.ts` `generatePDFContent`: the pre-existing placeholder (TextEncoder of a plain-text
  body behind a fake `%PDF-1.4` first line, no xref/trailer, `pdftotext`: "Couldn't find trailer
  dictionary") replaced with real generation via `npm:pdfkit@0.15.2`: the Amiri 1.001 TTF (fetched at
  request time from jsDelivr with a GitHub-raw fallback, cached per isolate) is embedded and subset for
  Arabic lines, Helvetica renders Latin lines, and every Arabic line is wrapped in an
  `/Span <</ActualText <...>>> BDC ... EMC` marked-content span carrying the char-reversed line, because
  poppler 26 reverses RTL ActualText spans — extraction therefore yields the logical-order standard-form
  Arabic (`الموعد النهائي`) while fontkit shapes the visible glyphs.

No JSDoc, console string, or `mou-notifications` internal payload string changed.

## Deployments, in execution order and before the artifact probe

```text
2026-09-11T20:41:53Z
Bundling Function: bot-notification-dispatcher
Deploying Function: bot-notification-dispatcher (script size: 714 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["bot-notification-dispatcher"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:11Z contextual-suggestions
Bundling Function: contextual-suggestions
Deploying Function: contextual-suggestions (script size: 92 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["contextual-suggestions"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:15Z data-export
Bundling Function: data-export
Deploying Function: data-export (script size: 736 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-export"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:26Z data-import
Bundling Function: data-import
Deploying Function: data-import (script size: 741 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-import"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:35Z pdf-generate
Bundling Function: pdf-generate
Deploying Function: pdf-generate (script size: 87 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["pdf-generate"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:40Z relationship-health
Bundling Function: relationship-health

2026-09-11T20:42:56Z relationship-health
Bundling Function: relationship-health
No change found in Function: relationship-health
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
```

The first `relationship-health` invocation completed while its combined command output yielded; the
immediate second invocation reported `No change found`, emitted the successful deployment envelope above,
and the version oracle confirms version 6.

Redeploy of `pdf-generate` carrying the real PDF generator (this attempt, commit 3a0ebd750):

```text
2026-09-11T23:25:28Z
Bundling Function: pdf-generate
Deploying Function: pdf-generate (script size: 2.8 MB)
Deployed Functions on project zkrcjzdemdmwhearhfgg: pdf-generate
```

## Deploy-version oracle after all deploys (rerun after the v13 redeploy, before the artifact probe)

```text
P102-13-DEPLOY advanced=6/6 bot-notification-dispatcher=3(>2) contextual-suggestions=6(>5) data-export=3(>2) data-import=3(>2) pdf-generate=13(>11) relationship-health=6(>5) expected advanced=6/6 (every slug version strictly greater than its HEAD value recorded 2026-09-10)
PASS deploy-versions
exit=0
```

## Produced-artifact probe after deployment (verbatim plan oracle, run 2026-09-11T23:33Z)

```text
P102-13-PDF http=200 deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1 expected deadline_en>=1 deadline_ar>=1 retired=0 control>=1
PASS pdf
exit=0
```

No `NOTE: pdftotext blind` fallback line was emitted: `pdftotext` parsed the produced object directly, so
the counts above come from the plan's primary extraction path, not the raw-bytes fallback.

- Magnitudes: `deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1`
- Produced object: `private/pdfs/after-action-905b6a3a-4c94-482f-9857-d268cc4d3ea5-1789169590750.pdf`
  (envelope `generated_at`: 2026-09-11T23:33:11.694Z, after the 23:25:28Z v13 deploy)
- The retired-term zeros are paired with the positive `Priority: HIGH` control line from the rendered
  commitments block, proving the instrument could have seen a non-zero.

The published-only guard in `pdf-generate` is unchanged; the fixture was published through the normal
product surface outside this task's write scope, and this attempt only replaced the PDF byte generator,
redeployed, and reran the oracle.
