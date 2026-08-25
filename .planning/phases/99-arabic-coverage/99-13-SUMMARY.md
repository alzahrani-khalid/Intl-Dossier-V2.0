# Phase 99 Plan 13 — tasks/queues/positions banner closure

**Status:** complete at implementation tip `5d3e7dd16`.

P99-12 had already authored the four locale pairs and P99-43 had already landed the call-site
cutover before this task was dispatched, as required by `depends_on`. This task made no second copy
of those bundle trees. It repaired the two residual TaskDetail enum prefixes and extracted the
three route branches into a typed `PositionReadOnlyBanner` component, then rendered that component
against the real Arabic bundle. No locale JSON needed another edit.

## 1. Starting and ending populations

The task started after P99-43 with the eleven-file scoped population already at zero. This is the
actual dispatch population, not the pre-cutover `91/127` masks plus `8/61` raw keys recorded by
P99-43. The command was:

```sh
node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/components/tasks/TaskDetail.tsx,frontend/src/components/tasks/TaskCard.tsx,frontend/src/components/tasks/AddContributorDialog.tsx,frontend/src/components/tasks/ContributorsList.tsx,frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx,frontend/src/components/waiting-queue/ReminderButton.tsx,frontend/src/components/waiting-queue/AgingIndicator.tsx,frontend/src/components/waiting-queue/EscalationDialog.tsx,frontend/src/pages/WaitingQueue.tsx,frontend/src/pages/TaskDetailPage.tsx,frontend/src/components/commitment-editor/CommitmentEditor.tsx"
```

Verbatim output at start (exit 0):

```text
strict i18n audit: 11 file(s); 0/125 two-arg masks unresolved
mask shapes literal/options-default: 0/125 and 0/0
0/63 raw-key sites unresolved
EN/AR two-arg: 0/0
EN/AR raw-key: 0/0
binding defect population: 10 files (0 array + 10 bare)
canonical binding reclassified sites: 0 two-arg / 0 raw-key
loose-hidden two-arg/raw-key: 0/0
```

The ending audit output is byte-identical after the TaskDetail routing repair. Both the starting
and ending strict populations are therefore `0/125` unresolved two-arg sites and `0/63`
unresolved raw-key sites; the four bundle pairs are unchanged from the measured start.

## 2. Dynamic carriers and enum resolution in both locales

The enum sets were re-read from their consuming types/components and probed as atomic families:

| Carrier                                 | Colon-form target                           | Members                                                                 |
| --------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| TaskCard + TaskDetail                   | `assignments:priority.*`                    | `urgent, high, medium, low`                                             |
| TaskCard + TaskDetail                   | `assignments:status.*`                      | `pending, in_progress, review, completed, cancelled`                    |
| TaskCard + TaskDetail                   | `assignments:work_item.*`                   | `dossier, ticket, position, task`                                       |
| AddContributorDialog + ContributorsList | `tasks-page:contributors.role.*`            | `helper, reviewer, advisor, observer, supervisor`                       |
| AddContributorDialog                    | `tasks-page:contributors.roleDescription.*` | the same five contributor roles                                         |
| AssignmentDetailsModal                  | `assignments:waitingQueue.status.*`         | `pending, assigned, in_progress, completed, cancelled`                  |
| AssignmentDetailsModal                  | `assignments:waitingQueue.priority.*`       | `low, medium, high, urgent`                                             |
| AssignmentDetailsModal                  | `assignments:waitingQueue.entityType.*`     | `dossier, ticket, position`                                             |
| CommitmentEditor                        | `commitments:trackingMode.*`                | `automatic, manual`                                                     |
| CommitmentEditor                        | `commitments:priority.*`                    | `low, medium, high, urgent`                                             |
| CommitmentEditor                        | `commitments:status.*`                      | `pending, in_progress, completed, cancelled, overdue` — five, no review |

The resolution/parity probe printed the following verbatim (exit 0):

```text
en assignments:priority members=urgent,high,medium,low gaps=NONE
en assignments:status members=pending,in_progress,review,completed,cancelled gaps=NONE
en assignments:work_item members=dossier,ticket,position,task gaps=NONE
en assignments:waitingQueue.status members=pending,assigned,in_progress,completed,cancelled gaps=NONE
en assignments:waitingQueue.priority members=low,medium,high,urgent gaps=NONE
en assignments:waitingQueue.entityType members=dossier,ticket,position gaps=NONE
en tasks-page:contributors.role members=helper,reviewer,advisor,observer,supervisor gaps=NONE
en tasks-page:contributors.roleDescription members=helper,reviewer,advisor,observer,supervisor gaps=NONE
en commitments:trackingMode members=automatic,manual gaps=NONE
en commitments:priority members=low,medium,high,urgent gaps=NONE
en commitments:status members=pending,in_progress,completed,cancelled,overdue gaps=NONE
en positions:readOnlyBanner members=under_review,approved,published gaps=NONE
ar assignments:priority members=urgent,high,medium,low gaps=NONE
ar assignments:status members=pending,in_progress,review,completed,cancelled gaps=NONE
ar assignments:work_item members=dossier,ticket,position,task gaps=NONE
ar assignments:waitingQueue.status members=pending,assigned,in_progress,completed,cancelled gaps=NONE
ar assignments:waitingQueue.priority members=low,medium,high,urgent gaps=NONE
ar assignments:waitingQueue.entityType members=dossier,ticket,position gaps=NONE
ar tasks-page:contributors.role members=helper,reviewer,advisor,observer,supervisor gaps=NONE
ar tasks-page:contributors.roleDescription members=helper,reviewer,advisor,observer,supervisor gaps=NONE
ar commitments:trackingMode members=automatic,manual gaps=NONE
ar commitments:priority members=low,medium,high,urgent gaps=NONE
ar commitments:status members=pending,in_progress,completed,cancelled,overdue gaps=NONE
ar positions:readOnlyBanner members=under_review,approved,published gaps=NONE
parity assignments en=392 ar=396 EN-only=[] AR-only=["queue.failedAttempts_zero","queue.failedAttempts_two","queue.failedAttempts_few","queue.failedAttempts_many"]
parity positions en=367 ar=367 EN-only=[] AR-only=[]
parity tasks-page en=113 ar=113 EN-only=[] AR-only=[]
parity commitments en=126 ar=126 EN-only=[] AR-only=[]
en translation-alias roots priority=undefined status=undefined work_item=undefined
ar translation-alias roots priority=undefined status=undefined work_item=undefined
```

The four `assignments` Arabic-only plural-category leaves are the pre-existing valid ICU variants
named by D-25. There are zero EN-only leaves. The already-complete `assignments:priority` family
was reused; no duplicate subtree was authored. The only task-status gap P99-12 had found was
`assignments:status.review`, and it was added once in each locale before P99-43 bound TaskCard.

Current source routing (verbatim):

```text
TaskCard assignments prefixes:
51:              {t(`assignments:priority.${task.priority}`)}
54:              {t(`assignments:status.${task.status}`)}
57:              <Badge variant="outline">{t(`assignments:work_item.${task.work_item_type}`)}</Badge>
TaskDetail enum prefixes:
111:            {t(`assignments:priority.${task.priority}`, { defaultValue: task.priority })}
114:            {t(`assignments:status.${task.status}`, { defaultValue: task.status })}
124:              {t(`assignments:work_item.${task.work_item_type}`)}
428:                    `${t(`assignments:work_item.${item.type}`)} (${t('tasks-page:detail.deleted', 'Deleted')})`,
504:                          `${t(`assignments:work_item.${item.type}`)} (${t('tasks-page:detail.deleted', 'Deleted')})`,
```

TaskCard and TaskDetail now route all three required dynamic families through `assignments:`.
The existing priority/status/work-item subtrees were probed first in both locales and reused;
this task authored no duplicate subtree.

## 3. Instrument of record and negative control

The plan's exact command oracle exited 0:

```text
PLAN_ORACLE_EXIT=0
```

The required control-first expanded run printed:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
```

Thus all six named carriers are absent from the instrument output. `scripts/neg-taskcard.mjs` is
byte-unchanged from the task base (`git diff --exit-code 04311a07d -- scripts/neg-taskcard.mjs`
exited 0), and its post-change output remains:

```text
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

No `priority`, `status`, or `work_item` root exists in either `common.json`; because the production
`translation` namespace aliases `common`, the three fixed MISS probes remain live.

## 4. Banner extraction and the three rendered states

The route now owns one typed status-to-key map and one reusable rendered component. The
absence/presence pair was run directly against that route:

```text
Read Only matches: 0
31:  under_review: 'positions:readOnlyBanner.under_review',
32:  approved: 'positions:readOnlyBanner.approved',
33:  published: 'positions:readOnlyBanner.published',
41:export function PositionReadOnlyBanner({ status }: { status: ReadOnlyPositionStatus }) {
49:          <p className="text-xs font-bold text-foreground">{t(READ_ONLY_BANNER_KEYS[status])}</p>
79:        <PositionReadOnlyBanner status={position.status} />
```

The authored values, probed from both real bundles, are:

| Key                                     | English                                                                                                                                                                | Arabic                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `positions:readOnlyBanner.under_review` | Position Under Review - Read Only. This position is currently under review and cannot be edited. It must go through the approval chain before any changes can be made. | الموقف قيد المراجعة - للقراءة فقط. هذا الموقف قيد المراجعة حاليًا ولا يمكن تعديله. يجب أن يمر عبر سلسلة الاعتماد قبل إجراء أي تغييرات. |
| `positions:readOnlyBanner.approved`     | Position Approved - Read Only. This position has been approved and is awaiting publication. Contact an administrator to make changes.                                  | الموقف معتمد - للقراءة فقط. تم اعتماد هذا الموقف وهو في انتظار النشر. تواصل مع أحد المسؤولين لإجراء أي تغييرات.                        |
| `positions:readOnlyBanner.published`    | Position Published - Read Only. This position has been published. To make changes, you must use the Emergency Correction workflow or create a new version.             | الموقف منشور - للقراءة فقط. تم نشر هذا الموقف. لإجراء تغييرات، استخدم مسار التصحيح الطارئ أو أنشئ إصدارًا جديدًا.                      |

All three Arabic values use the ruled موقف stance register, contain no `منصب`, and end without an
exclamation mark.

The task-owned render oracle loaded the actual route module through Vite middleware-mode SSR,
provided the real `ar/positions.json` to `I18nextProvider`, and rendered
`PositionReadOnlyBanner` through React DOM for each ruled status. It asserted all four live
properties per render: the banner paragraph exists, its exact bundle value is present, Arabic
script is present, and the old `Read Only` literal is absent. The command exited 0 with this
verbatim output:

```text
RENDER status=under_review visible=true arabic=true exact=true READ_ONLY_LITERAL_ABSENT=true
RENDER status=approved visible=true arabic=true exact=true READ_ONLY_LITERAL_ABSENT=true
RENDER status=published visible=true arabic=true exact=true READ_ONLY_LITERAL_ABSENT=true
```

This is the rendered verdict for all three states; it does not infer rendering from source grep or
from Playwright collection. As a separate instrument-population check, the existing browser oracle
still selects exactly three fixture-driven tests:

```sh
CI= pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts -g 'UI99-C7 ar banner' --project=chromium-en --no-deps --list
```

Verbatim collection output (exit 0):

```text
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner under_review
  [chromium-en] › 99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner approved
  [chromium-en] › 99-ar03-leak.spec.ts:229:5 › UI99-C7 ar banner published
Total: 3 tests in 1 file
```

The full browser command was also invoked, but this worker cannot bind a local TCP or Unix socket.
The direct minimal Vite launch proved the infrastructure restriction before any browser assertion
ran:

```text
Error: listen EPERM: operation not permitted 127.0.0.1:5173
```

The browser attempt is recorded as infrastructure evidence only and is not counted as a verdict.
The three green React render rows above are this task's own executable verdict; the harness gate
independently runs the three collected UI99-C7 browser tests outside this worker's socket policy.

## 5. Dot-form `common.X` resolution and named handoffs

The scoped absence check was paired with a live colon-form positive control:

```text
dot-form common.X sites=0
colon-form common: positive control:
frontend/src/components/commitment-editor/CommitmentEditor.tsx:143:                    confirmLabel={t('common:delete')}
frontend/src/components/commitment-editor/CommitmentEditor.tsx:144:                    cancelLabel={t('common:cancel')}
frontend/src/components/commitment-editor/CommitmentEditor.tsx:347:                        : t('common:selectDate')}
frontend/src/pages/WaitingQueue.tsx:449:              {t('common:all', 'All')} ({items?.length || 0})
frontend/src/components/waiting-queue/EscalationDialog.tsx:358:            aria-label={t('common:cancel', 'Cancel')}
frontend/src/components/waiting-queue/EscalationDialog.tsx:360:            {t('common:cancel', 'Cancel')}
frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:180:                {assignment.assignee_name || t('common:unknown', 'Unknown')}
frontend/src/components/tasks/AddContributorDialog.tsx:278:              <span className="text-muted-foreground">({t('common:optional', 'Optional')})</span>
frontend/src/components/tasks/AddContributorDialog.tsx:300:            {t('common:cancel', 'Cancel')}
```

The pre-recut parenthetical saying AgingIndicator's `common.days` resolves is stale after the
flatten/type-clash rulings. Re-probing the real roots shows why P99-12/43 correctly moved both
scalar consumers to the lane bundle:

```text
frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:315:                  {daysWaiting} {t('assignments:waitingQueue.days')}
frontend/src/components/waiting-queue/AgingIndicator.tsx:66:        {days} {t('assignments:waitingQueue.days')}
en common:days type=object; assignments:waitingQueue.days="days"
ar common:days type=object; assignments:waitingQueue.days="أيام"
```

Changing either site to `common:days` would render the weekday-name object. The following common
items remain deliberately un-authored by this lane and retain the common-owner handoff name from
the plan (99-06 / its later repair descendants):

- `common:optional` contains parentheses, so AddContributorDialog currently supplies a second pair.
- `common:afterActions.commitments.tracking.*` is absent, while its priority/status families are
  under-populated; CommitmentEditor now uses the complete `commitments:` families.
- `common:afterActions.decisions.item` and `common:afterActions.confidence` have consumers outside
  this allowlist.
- `common:contributors` and `common:days` are objects, not the scalar labels the old sites sought.
- `common:waitingQueue.reminder.{noAssignee,success,error}` are scalars addressed elsewhere as
  objects; this lane uses `assignments:waitingQueue.reminder.*`.
- WorkItemLinker's eight common-targeted raw-key sites are outside this task's population.

The only further banner-copy handoff is `positions:draftBanner`: the editable draft sentence is
not one of UI99-C7's three ruled read-only states and has no key in either locale.

## 6. Type and scope verification

```sh
pnpm --dir frontend exec tsc --noEmit
```

Exit 0, with no output.

Both source commits also passed the repository's staged lint/format hooks, Turbo build, and static
analysis before Git accepted them:

```text
94d1030e3 fix(i18n): route task detail enums through assignments
5d3e7dd16 refactor(i18n): extract position read-only banner
```

No tracked path outside this plan's allowlist changed. `node_modules` remained the harness-owned
symlink and was never deleted, replaced, or committed.
