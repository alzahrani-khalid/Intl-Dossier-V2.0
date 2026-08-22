# Phase 99-09: Intake/triage dynamic carriers and rendered surface

## Outcome

Implementation committed as `854841067 fix(i18n): remove resolved intake tab fallback`.

- Removed the variable English fallback from the resolved `intake:ticketDetail.tabs.${tab}` dynamic site.
- The predecessor's atomic authoring commit `1b246f07bc6100ed6bf31fecbb273a97415bc4e2` authored both locale files and colon-prefixed both dynamic sites in the same commit. Its enum sets are:
  - `ticketDetail.tabs`: `details`, `triage`, `duplicates`, `history`, `links`.
  - `form.requestType.options`: `engagement`, `position`, `mou_action`, `foresight`.
- `TriagePanel`'s request-type dynamic site had no second argument to remove. No other second argument changed.
- No `common.*` binding or common locale key was touched. No JSON changed in this task. The authored Arabic values remain sentence case, contain no exclamation or first-person plural, and use the ruled `مشاركة` / `موقف` / `استقبال` terms. Operator naturalness review remains recorded debt, not a blocker.

## Re-derived populations

The strict audit was run at task start and after the one-line repair:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --scope "frontend/src/components/triage-panel/TriagePanel.tsx,frontend/src/pages/TicketDetail.tsx,frontend/src/pages/IntakeQueue.tsx,frontend/src/components/duplicate-comparison/DuplicateComparison.tsx,frontend/src/components/work-creation/forms/IntakeQuickForm.tsx" --json
```

Both runs reported the same scoped population because the strict audit's literal-key population intentionally does not count template-literal dynamic keys:

```text
scannedFiles: 5
twoArgTotal: 148
rawKeyTotal: 5
twoArgUnresolved: 0
rawKeyUnresolved: 0
twoArgUnresolvedEn: 0
rawKeyUnresolvedEn: 0
twoArgUnresolvedAr: 0
rawKeyUnresolvedAr: 0
twoArgDistinct: 0
rawKeyDistinct: 0
```

Namespace leaf parity was re-derived:

```text
intake: en=279 ar=279 enOnly=0 arOnly=0
work-creation: en=55 ar=55 enOnly=0 arOnly=0
```

Every dynamic enum leaf was then resolved directly in both locale files:

```text
ticketDetail.tabs.details: en="Details" ar="التفاصيل"
ticketDetail.tabs.triage: en="Triage" ar="الفرز"
ticketDetail.tabs.duplicates: en="Duplicates" ar="التكرارات"
ticketDetail.tabs.history: en="History" ar="السجل"
ticketDetail.tabs.links: en="Links" ar="الروابط"
form.requestType.options.engagement: en="Engagement Support" ar="دعم المشاركة"
form.requestType.options.position: en="Position Development" ar="تطوير الموقف"
form.requestType.options.mou_action: en="MoU/Action Items" ar="بنود المذكرة/الإجراءات"
form.requestType.options.foresight: en="Foresight Request" ar="طلب الاستشراف"
```

The dynamic enum bounds were re-derived from the tab tuple and the intake request-type enum:

```text
frontend/src/pages/TicketDetail.tsx:187:              {(['details', 'triage', 'duplicates', 'history', 'links'] as const).map((tab) => (
frontend/src/components/work-creation/forms/IntakeQuickForm.tsx:47:  requestType: z.enum(['engagement', 'position', 'mou_action', 'foresight'] as const),
```

## Instrument and rendered evidence

The instrument control ran first:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
```

The subsequent instrument run reported:

```text
UNRESOLVED dynamic t() key prefixes: 22 total  (18 mask a raw value -> criterion 1; 4 render a RAW KEY -> criterion 2)
```

Neither `TriagePanel.tsx` nor `TicketDetail.tsx` appeared in its 22 rows. The task oracle printed:

```text
dynamic-members-absent=yes
IntakeQueue-explicit-intake-colon-sites=16
```

The rendered oracle first proved that the filter collected exactly one test:

```text
◇ injected env (7) from ../../../.env.test // tip: ⌁ auth for agents [www.vestauth.com]
◇ injected env (0) from ../../../.env.test // tip: ⌘ suppress logs { quiet: true }
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:184:5 › UI99-C6 ar intake queue
Total: 1 test in 1 file
```

The managed rendered run then passed cleanly:

```text
pw-run-reaped: playwright exited code=0 signal=null; group 64337 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published; child output .../test-results/pw-reaped-2ba21d14e34f2dd8a0905240b9e7e048.json.log
```

Its JSON report recorded `UI99-C6 ar intake queue` as `ok: true`, `status: passed`, with one expected test, zero skipped, zero unexpected, and zero flaky.

## Focused checks

```text
$ pnpm --filter intake-frontend type-check
> intake-frontend@1.0.0 type-check .../frontend
> tsc --noEmit

$ pnpm exec eslint frontend/src/pages/TicketDetail.tsx
(no output; exit 0)

$ git diff --check
(no output; exit 0)
```

`graphify update .` completed its AST refresh; its generated `graphify-out/` remains ignored and uncommitted. The remaining 22 maskfinder rows, the intake queue title glossary rename, common-owner work, static fallback deletion, and Arabic naturalness review remain with their named owner lanes.
