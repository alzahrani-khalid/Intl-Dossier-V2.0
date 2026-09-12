---
status: complete
phase: 102-staging-data-debt-tail
plan: 13
requirements: [EDGECOPY-01]
code_commit: ecbf50cb4
---

# 102-13 summary: edge copy and PDF embed repair (stub emitter, per plan step 0)

## Outcome

The six allowlisted functions carry the repaired copy and are deployed; the deploy-version oracle
passes at `advanced=6/6` with `pdf-generate=16(>11)`. The produced-artifact oracle passes against
the deployed `pdf-generate` (v16) on the published staging fixture 905b6a3a: HTTP 200 with a signed
URL, `pdftotext` is blind on the stub (no xref — pre-existing debt, plan step 0 / OBS-P102-13), the
oracle counts the raw bytes and reports
`deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1` → `PASS pdf`.

Per plan step 0 (overseer ruling, run 0083 att7/att8) and the last review's two material findings,
this attempt **reverted the out-of-scope pdfkit/bidi renderer** (`ecbf50cb4`, 17 insertions /
136 deletions vs the prior attempt) back to the HEAD text-stub emitter, keeping ONLY the embed
repair and the copy edits. `deno check --no-config --node-modules-dir=auto
supabase/functions/pdf-generate/index.ts` now exits 0 (the prior renderer failed it with TS2349 at
`bidiFactory()` and TS7006 on both `part` parameters behind `@ts-ignore` imports).

## Attempt history (condensed)

1. Copy + embed repair (`e2a20e664`; `commitments(*)` → `aa_commitments(*)` in the fetch select,
   interface field, and both template reads; `Due Date`/`تاريخ الاستحقاق` → `Deadline`/
   `الموعد النهائي` at every cited site; `T+N` badges with neutral sentences). Deployed
   bot=3, ctx=6→7, exp=3, imp=3, rel=6 — but no artifact: fixture was draft (400); before that,
   the broken embed 404/PGRST200.
2. Real PDF generator (`9c2df8ce9`, v13): structurally valid but scrambled RTL word order and
   digit runs; ActualText layer char-reversed for poppler — flagged.
3. Bidi-correct renderer (`032892eec`/`7bb9ae1f4`, v14): UAX#9 reorder + per-token reversal;
   visual-order ActualText still wrong for conforming readers.
4. ActualText drop (`ee7419b58`, v15): both readers green locally — but review ruled the whole
   renderer **scope-padding** (violates plan step 0; `lineBreak:false` clips long lines) and
   **check-bypass** (deno check failures suppressed with `@ts-ignore`).
5. **This attempt** (`ecbf50cb4`, deployed v16): `pdf-generate/index.ts` = HEAD stub emitter +
   embed repair + copy edits only. `git diff d208159d9 -- supabase/functions/pdf-generate/index.ts`
   is exactly four hunks: interface `aa_commitments` (:21), en template `record.aa_commitments` +
   `Deadline:` (:130/:133), ar template (:182/:185), select `aa_commitments(*)` (:318, inside the
   cited :313-321 fetch hunk).

## Commands run by this attempt, verbatim, in execution order

```text
$ git show d208159d9:supabase/functions/pdf-generate/index.ts > /tmp/p102-base-pdf.ts
  (base = task-start HEAD; edit-site counts verified: 'commitments: Array' 1x,
   'record.commitments.map' 2x, '   Due Date:' 1x, 'تاريخ الاستحقاق:' 1x, 'commitments(*)' 1x)

$ sed -e 's/  commitments: Array<{/  aa_commitments: Array<{/' \
      -e 's/record\.commitments\.map/record.aa_commitments.map/g' \
      -e 's/   Due Date:/   Deadline:/' \
      -e 's/تاريخ الاستحقاق:/الموعد النهائي:/' \
      -e 's/commitments(\*)/aa_commitments(*)/' /tmp/p102-base-pdf.ts
  diff vs base: exactly 6 changed lines at :21 :130 :133 :182 :185 :318 (nothing else)

$ cp /tmp/p102-repaired-pdf.ts supabase/functions/pdf-generate/index.ts
$ deno check --no-config --node-modules-dir=auto supabase/functions/pdf-generate/index.ts
Check supabase/functions/pdf-generate/index.ts
exit=0            (prior attempt's same command: TS2349 bidiFactory(), TS7006 part x2 — gone)

$ git commit   ->  ecbf50cb4 "fix(edge): revert pdf-generate to the stub emitter plus the
                        embed and copy repair" (1 file, +17 -136)
```

## Deployments — six outputs, every timestamp BEFORE the probe

Five were deployed by this task's earlier attempts (outputs recorded verbatim from those runs);
their versions still stand, re-verified by the deploy oracle below. The sixth is this attempt's.

```text
2026-09-11T20:41:53Z bot-notification-dispatcher (prior attempt of this task)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["bot-notification-dispatcher"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:15Z data-export (prior attempt of this task)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-export"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:26Z data-import (prior attempt of this task)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["data-import"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-11T20:42:56Z relationship-health (prior attempt of this task)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["relationship-health"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}

2026-09-12T00:21:15Z contextual-suggestions (prior attempt of this task, v7)
Deploying Function: contextual-suggestions (script size: 92 kB)
Deployed Functions on project zkrcjzdemdmwhearhfgg: contextual-suggestions

2026-09-12T01:28:36Z pdf-generate (THIS attempt — the reverted stub + repair, v16)
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Bundling Function: pdf-generate
Deploying Function: pdf-generate (script size: 87 kB)
{"project_ref":"zkrcjzdemdmwhearhfgg","functions":["pdf-generate"],"dashboard_url":"https://supabase.com/dashboard/project/zkrcjzdemdmwhearhfgg/functions","message":"Deployed Functions."}
```

## Deploy-version oracle (verbatim, run 2026-09-12T01:29Z, after all deploys, before the probe)

```text
P102-13-DEPLOY advanced=6/6 bot-notification-dispatcher=3(>2) contextual-suggestions=7(>5) data-export=3(>2) data-import=3(>2) pdf-generate=16(>11) relationship-health=6(>5) expected advanced=6/6 (every slug version strictly greater than its HEAD value recorded 2026-09-10)
PASS deploy-versions
```

## Produced-artifact probe (verbatim plan oracle, run 2026-09-12T01:29:22Z, after all deploys)

```text
NOTE: pdftotext blind (pdf-generate emits a text stub behind a %PDF header, OBS-P102-13); counting raw bytes
P102-13-PDF http=200 deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0 control_priority_lines=1 expected deadline_en>=1 deadline_ar>=1 retired=0 control>=1
PASS pdf
```

- Magnitudes verbatim: `deadline_en=1 deadline_ar=1 retired_en=0 retired_ar=0
  control_priority_lines=1`. The zeros (`retired_en=0`, `retired_ar=0`) sit beside the positive
  `Priority` control (`control_priority_lines=1`), proving the instrument could have seen a
  non-zero.
- Extraction path: `pdftotext` finds no xref in the stub (pre-existing debt, outside this task per
  plan step 0 and the task criterion), so the oracle counted the raw bytes — the exact fallback the
  plan ships (`NOTE: pdftotext blind …` line above).
- Storage path of the produced object:
  `private/pdfs/after-action-905b6a3a-4c94-482f-9857-d268cc4d3ea5-1789176564702.pdf`
  (1243 bytes; created 2026-09-12T01:29:2xZ, after the 01:28:36Z v16 deploy — this attempt's only
  storage write).
- Raw-byte spot check of the downloaded object: `Deadline: 7/31/2026` (en) and
  `الموعد النهائي: ١٧/٢/١٤٤٨ هـ` + `الأولوية: عالي` (ar) present; `تاريخ الاستحقاق` absent.
- Probe fidelity notes: run via `/tmp/p102-13-probe.sh`, the plan's command oracle with (a) the
  embedded `python3 -c` body dedented — the plan YAML's 8-space indentation was the prior
  IndentationError cause — and (b) two non-semantic capture additions for the record: the signed
  URL is teed to a file and the produced bytes copied before the oracle's cleanup, so the storage
  path above and the byte counts come from the same run. Assertion logic, counting greps, and
  output lines are the plan's verbatim.

## Source population census (re-run after this attempt's edits, verbatim)

```text
$ grep -rn 'Due Date\|تاريخ الاستحقاق' supabase/functions/bot-notification-dispatcher/index.ts supabase/functions/contextual-suggestions/index.ts supabase/functions/data-export/index.ts supabase/functions/data-import/index.ts supabase/functions/pdf-generate/index.ts supabase/functions/relationship-health/index.ts
exit=1 (zero matches in the six-function population)

$ grep -rn 'commitments(\*)' supabase/functions/
supabase/functions/pdf-generate/index.ts:318:        aa_commitments(*),
(repo-wide: the only commitments-embed line is the repaired aa_commitments(*) in pdf-generate)

$ grep -n 'aa_commitments\|Deadline\|الموعد النهائي' supabase/functions/pdf-generate/index.ts
21:  aa_commitments: Array<{
130:${record.aa_commitments.map((c, i) => `
133:   Deadline: ${new Date(c.due_date).toLocaleDateString('en-US')}
182:${record.aa_commitments.map((c, i) => `
185:   الموعد النهائي: ${new Date(c.due_date).toLocaleDateString('ar-SA')}
318:        aa_commitments(*),

$ grep -n 'T+${daysOverdue}\|T+${healthData' supabase/functions/contextual-suggestions/index.ts supabase/functions/relationship-health/index.ts
supabase/functions/contextual-suggestions/index.ts:605:          description_en: `Deadline passed T+${daysOverdue} days ago.`,
supabase/functions/contextual-suggestions/index.ts:617:          badge_text_en: `T+${daysOverdue}`,
supabase/functions/contextual-suggestions/index.ts:618:          badge_text_ar: `T+${daysOverdue}`,
supabase/functions/relationship-health/index.ts:226:      description_en: `No engagement in T+${healthData.breakdown.days_since_engagement} days.`,
supabase/functions/relationship-health/index.ts:227:      description_ar: `لا يوجد تفاعل خلال T+${healthData.breakdown.days_since_engagement} يوم.`

Copy sites (HEAD line numbers): bot-notification-dispatcher :73/:101 (dueDate labels),
data-export :703-704, data-import :565-566 (header pairs), pdf-generate :133/:185 (template
lines), contextual-suggestions :664 (+ NOW-relative :605-606/:617-618 as T+ badge text with
neutral sentences), relationship-health :226-227. No JSDoc/console/internal-payload string
(the mou-notifications class) touched.
```

## Notes for the record

- **Follow-on debt (named):** a real bilingual PDF renderer for `pdf-generate` (Arabic shaping,
  UAX#9 visual order, measured wrapping, xref-valid output so `pdftotext` parses it) is explicitly
  OUT OF SCOPE per plan step 0 and filed as follow-on phase debt; this task ships the HEAD stub
  emitter plus the embed/copy repair. The oracle's raw-bytes fallback is the sanctioned instrument
  for the stub (OBS-P102-13). The renderer attempts' lessons (v13–v15: word-order, digit runs,
  ActualText semantics) are preserved above for whoever picks up that debt.
- The published-only guard in `pdf-generate` is unchanged; fixture 905b6a3a is
  `publication_status=published` (published outside this task's write scope).
- Storage hygiene: this attempt created exactly one object (`…-1789176564702.pdf`, cited above).
  Objects from earlier attempts/reviewer probes (`…-1789162938796`, `…-1789162958930`,
  `…-1789169590750`, `…-1789175216542`, `…-1789175243934`) remain under `private/pdfs/` as
  historical evidence of those runs.
- `code_commit: ecbf50cb4` is this attempt's real, branch-present commit (supersedes the prior
  SUMMARY's dangling `290e925a1` citation note).
