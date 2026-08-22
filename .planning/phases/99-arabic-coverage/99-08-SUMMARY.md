# Phase 99-08: Intake/triage authoring and colon form

## Outcome

Implementation committed as `7e94f15c3 feat(i18n): author intake triage translations` (rebased
by the repair harness as `1b246f07b`). The second-argument repair is committed as
`6c66e2a40 fix(i18n): preserve intake tab fallback`.

- Authored every starting strict-audit miss in English and Arabic and routed every repaired call through an explicit `intake:` or `work-creation:` key.
- Repaired the UI99-C6 header trio as `intake:description`, `intake:createNew`, and `intake:filters.pendingTriage`; their Arabic values use the ruled استقبال family.
- Kept all 121 literal second arguments byte-identical and restored the computed TicketDetail tab
  fallback byte-for-byte as `tab.charAt(0).toUpperCase() + tab.slice(1)`. D-24(1-2) is the
  authoring/verification step and does **not** authorize deleting that fallback; D-27 only assigns
  the dynamic prefix to the maskfinder. TriagePanel's dynamic request-type call had no default.
- Kept every `useTranslation` hook byte-untouched. No `common.json` or `common:*` routing was touched; the intake-bound `common.*` masks were authored under `intake:common.*` so `Back to Queue` and `Select...` retain their exact English copy.
- Corrected the stance-sense request-type value from `تطوير المنصب` to `تطوير الموقف` and used `مشاركة` for engagement.

## Re-derived populations

Starting strict audit, scoped to the five lane files:

```text
START {"scannedFiles":5,"twoArgTotal":148,"rawKeyTotal":5,"twoArgUnresolved":121,"rawKeyUnresolved":0,"twoArgUnresolvedEn":121,"rawKeyUnresolvedEn":0,"twoArgUnresolvedAr":121,"rawKeyUnresolvedAr":0,"twoArgDistinct":99,"rawKeyDistinct":0}
BY_FILE
20	frontend/src/components/duplicate-comparison/DuplicateComparison.tsx
45	frontend/src/components/triage-panel/TriagePanel.tsx
13	frontend/src/components/work-creation/forms/IntakeQuickForm.tsx
17	frontend/src/pages/IntakeQueue.tsx
26	frontend/src/pages/TicketDetail.tsx
```

The starting maskfinder control discriminated both polarities:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
```

Its starting population was 24 total / 19 masked / 5 raw-key and included exactly these lane members:

```text
UNRESOLVED dynamic t() key prefixes: 24 total  (19 mask a raw value -> criterion 1; 5 render a RAW KEY -> criterion 2)
MASKED-RAW-VALUE  frontend/src/pages/TicketDetail.tsx:189  prefix='ticketDetail.tabs' ns=intake
RAW-KEY           frontend/src/components/triage-panel/TriagePanel.tsx:321  prefix='intake.form.requestType.options' ns=intake
```

Runtime enum sets were derived from their source/type boundaries:

- `TicketDetail` tab tuple: `details`, `triage`, `duplicates`, `history`, `links`.
- Intake `RequestType`: `engagement`, `position`, `mou_action`, `foresight`.

## Verification evidence

Ending scoped audit (compact JSON projection):

```text
{
  "scannedFiles": 5,
  "twoArgTotal": 148,
  "rawKeyTotal": 5,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "twoArgDistinct": 0,
  "rawKeyDistinct": 0
}
```

The plan's exact strict-audit/parity oracle:

```text
INTAKE-LANE-OK
```

Two-namespace exact parity check:

```text
intake: en=279 ar=279 enOnly=0 arOnly=0
work-creation: en=55 ar=55 enOnly=0 arOnly=0
```

HEAD-to-worktree invariant check over the complete starting population:

```text
STARTING UNRESOLVED TWO-ARG SITES VERIFIED: 121
SECOND ARGUMENTS BYTE-UNCHANGED: YES
EXPLICIT COLON + EN EXACT + AR STRING: YES
USETRANSLATION HOOKS UNTOUCHED
```

The repair additionally compared the dynamic TicketDetail site directly with pre-task commit
`5349b40ac`; its second argument is byte-identical and only the key changed from
`ticketDetail.tabs.${tab}` to `intake:ticketDetail.tabs.${tab}`.

Ending maskfinder control and population:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 22 total  (18 mask a raw value -> criterion 1; 4 render a RAW KEY -> criterion 2)
```

Neither lane member appears in the ending 22-row list. The remaining rows are outside this task's five-file population.

Type-check:

```text
> intake-frontend@1.0.0 type-check .../frontend
> tsc --noEmit
```

Scoped ESLint and `git diff --check` both exited 0 with no output. The implementation commit hook also completed the repository build successfully.

The inherited Phase 99-01 spec is present at exactly one path, contains the one named rendered test,
and commits `INTAKE_CAPTURE_FLOOR = 34`. The task's hardcoded Playwright collection guard selected
exactly one test on the repair rerun:

```text
◇ injected env (7) from ../../../.env.test // tip: ⌘ custom filepath { path: '/custom/path/.env' }
◇ injected env (0) from ../../../.env.test // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:184:5 › UI99-C6 ar intake queue
Total: 1 test in 1 file
```

The first evaluator invocation of that exact command did execute the selected rendered test to a
successful Playwright exit. Its overall wrapper verdict was polluted only by a malformed orphan
lease left by the earlier sandboxed attempt:

```text
pw-run-reaped: playwright exited code=0 signal=null; group 56229 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict unclean; causes ["orphan sweep: faa8f52f3ebd8f452c1a15ac2574e253.lease:  lease schema incomplete — wrapper death unproven: pgid is not a positive integer: null"]; report WITHHELD (.unclean.json); child output .../test-results/pw-reaped-4b358af03296426666a1f63604caeaab.json.log
```

Thus the actual `UI99-C6 ar intake queue` test ran under asserted Arabic, enforced the committed
capture floor of 34, found Arabic script, and rejected the three former English header strings; it
was not replaced by source/prose evidence. For the repair rerun, the managed worker again denied the
`ps` census and produced one incomplete transient lease. Both recorded PIDs were verified `ESRCH`
before that exact ignored lease was removed. `.pw-leases` is empty at handoff, eliminating the
orphan-sweep cause that made the otherwise-passing evaluator invocation exit 90.

## Intentionally left outside this task

- The intake queue title value rename to `قائمة الاستقبال` remains with the D-16 glossary lane, as required by this plan's boundary.
- Static second-argument deletion remains behind the Phase 99 verification gatekeeper and deletion lanes. No static default was dropped here.
- The other 22 maskfinder members remain with their named feature lanes.
- No acceptance obligation from 99-08 was handed off to 99-09; 99-09 can consume this authored/dynamic state without redoing it.
