---
status: blocked
phase: 102-staging-data-debt-tail
plan: 13
requirements: [EDGECOPY-01]
code_commit: aff077036
---

# 102-13 summary: edge copy and PDF embed repair

## Outcome

The six allowlisted functions were repaired, committed, and deployed. The deploy-version oracle passed at
`advanced=6/6`. The required produced-artifact probe did not produce a PDF because the named staging row is
still `publication_status=draft`; after the embed repair the deployed function correctly advances past the
former relation 404 and returns its existing `400 Only published records can generate PDFs` guard.

No database state was changed and no storage object was written. Publishing the fixture or weakening the
published-only function guard was not authorized by this plan. Therefore the produced-PDF criterion is not
claimed complete and this summary intentionally does not carry `status: complete`.

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

No JSDoc, console string, or `mou-notifications` internal payload string changed.

`git diff --check` emitted no output. `deno fmt --check` could not run independently because the repository
workspace references a missing `shared/package.json`; the commit hook subsequently ran the repository build
successfully and created commit `aff077036 fix(edge): repair deadline copy and PDF embed`.

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

The first `relationship-health` invocation completed while its combined command output yielded; the immediate
second invocation reported `No change found`, emitted the successful deployment envelope above, and the version
oracle confirms version 6.

## Deploy-version oracle after all deploys

```text
P102-13-DEPLOY advanced=6/6 bot-notification-dispatcher=3(>2) contextual-suggestions=6(>5) data-export=3(>2) data-import=3(>2) pdf-generate=12(>11) relationship-health=6(>5) expected advanced=6/6 (every slug version strictly greater than its HEAD value recorded 2026-09-10)
PASS deploy-versions
exit=0
```

## Produced-artifact probe after deployment

The plan oracle's cleanup-bearing shell form was rejected before execution by the managed command policy
because it contains `rm -f`. The same probe was then run without cleanup and with the storage path print added.
Its verbatim output was:

```text
  BODY {"error":"invalid_status","message":"Only published records can generate PDFs"}
  EMBED-CAUSE {"code":"PGRST200","details":"Searched for a foreign key relationship between 'after_action_records' and 'commitments' in the schema 'public', but no matches were found.","hint":"Perhaps you meant 'aa
FAIL: pdf-generate answered 400 for after-action 905b6a3a-4c94-482f-9857-d268cc4d3ea5 - no artifact was produced to verify (embed probe above names the PostgREST cause when the fetch is the reason)
exit=1
```

The required magnitudes are unavailable because the response had no signed URL and therefore no PDF could be
downloaded or passed to `pdftotext`:

```text
deadline_en=not-produced deadline_ar=not-produced retired_en=not-produced retired_ar=not-produced control_priority_lines=not-produced
storage_path=not-produced
```

The zero storage-object count is paired with the positive function response above: HTTP 400 and its JSON body
prove the deployed endpoint was reached, while absence of a signed URL prevents accidental false success.

## Read-only cause pin

The corrected select used by the deployed function was run directly with the same test-user JWT:

```text
P102-13-CORRECTED-EMBED rows=1 id=905b6a3a-4c94-482f-9857-d268cc4d3ea5 publication_status=draft confidential=false engagement=7c0d830b-5dc7-4419-a0ad-ce550031712d decisions=1 aa_commitments=1 risks=0 follow_up_actions=0
exit=0
```

This distinguishes the current blocker from RLS and from the repaired embed: the row and commitment are both
visible, but the fixture is draft exactly as research §11.4 recorded. The old-embed `EMBED-CAUSE` line remains
in the non-200 oracle by design and demonstrates why the HEAD function returned 404; the corrected select above
demonstrates that deployed revision 12 resolved that cause.

## Remaining action

The phase owner must either publish the named staging fixture through its normal workflow and rerun the exact
artifact oracle, or explicitly authorize a product change defining which privileged callers may generate draft
after-action PDFs. After that decision, rerun the probe and record the signed object's `private/pdfs/...` path
and the five numeric magnitudes before changing this summary to `status: complete`.
