# Phase 99-08: Intake/triage authoring and colon form

## Outcome

Committed as `7e94f15c3 feat(i18n): author intake triage translations`.

- Authored every starting strict-audit miss in English and Arabic and routed every repaired call through an explicit `intake:` or `work-creation:` key.
- Repaired the UI99-C6 header trio as `intake:description`, `intake:createNew`, and `intake:filters.pendingTriage`; their Arabic values use the ruled استقبال family.
- Kept all 121 literal second arguments byte-identical. The only removed default was the ruled variable TicketDetail tab default; TriagePanel's dynamic request-type call had no default to remove.
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

The hardcoded Playwright collection guard selected exactly one test:

```text
◇ injected env (7) from ../../../.env.test // tip: ⌘ override existing { override: true }
◇ injected env (0) from ../../../.env.test // tip: ⌘ suppress logs { quiet: true }
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:184:5 › UI99-C6 ar intake queue
Total: 1 test in 1 file
```

The exact rendered command was invoked, but this managed worker sandbox denies the `ps` census required by `pw-run-reaped` and also denies binding a local Vite listener. Playwright therefore withheld the run before executing a test:

```text
pw-run-reaped: playwright exited code=1 signal=null; group 78502 -> {"termed":false,"killed":false,"alreadyGone":false,"unavailable":true,"identityMismatch":false,"finalZero":false}; session unavailable; verdict unclean; causes ["unavailable: direct group 78502 liveness/identity unverifiable — a group we cannot prove is not a group we can call clean","unavailable: lease schema incomplete — wrapper identity/authority unproven: pgid is not a positive integer: null"]; report WITHHELD (.unclean.json); child output .../test-results/pw-reaped-faa8f52f3ebd8f452c1a15ac2574e253.json.log
```

The harness's unsandboxed rendered gate remains the execution authority for UI99-C6. The committed spec retains `INTAKE_CAPTURE_FLOOR = 34`, asserted Arabic locale, Arabic-script presence, and absence checks for all three former English header strings.

## Intentionally left outside this task

- The intake queue title value rename to `قائمة الاستقبال` remains with the D-16 glossary lane, as required by this plan's boundary.
- Static second-argument deletion remains behind the Phase 99 verification gatekeeper and deletion lanes. No static default was dropped here.
- The other 22 maskfinder members remain with their named feature lanes.
- No acceptance obligation from 99-08 was handed off to 99-09; 99-09 can consume this authored/dynamic state without redoing it.
