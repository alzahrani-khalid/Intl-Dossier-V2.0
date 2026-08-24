# 99-12 — the tasks/queues/positions lane: AUTHORING ONLY (RULING-P99-163 part A)

**Task:** P99-12, wave 3. **Worktree HEAD at start:** `47cdc0e31`.
**Commits:** `36c817681` (assignments enum gaps + `work_item` relocation), `2a69ed0fe` (`waitingQueue`
slice), `1669a8b52` (`waiting` slice), `ba5ef18b1` (tasks-page slices), `558bb1a98` (commitments
slices), `294558757` (positions `readOnlyBanner`), `c3b1b20ea` (positions `stepUp`), this commit
(SUMMARY).

**Verdict: GREEN.** All five acceptance items satisfied. Oracle exits `0` (verbatim in §5). The
allowlist's eight bundle files are the **only** eight paths in the diff — zero source, test or setup
bytes moved, which is the whole point of the RULING-P99-163 split: the colon-form rewrite, the banner
extraction, every test edit and the `tests/setup.ts` cutover are 99-43's, and this plan hands 99-43 a
key set it can retarget onto without authoring anything (§6 is the retarget map).

---

## 0. Scope, proved by diff

```
$ git diff --name-only 47cdc0e31..HEAD
frontend/src/i18n/ar/assignments.json
frontend/src/i18n/ar/commitments.json
frontend/src/i18n/ar/positions.json
frontend/src/i18n/ar/tasks-page.json
frontend/src/i18n/en/assignments.json
frontend/src/i18n/en/commitments.json
frontend/src/i18n/en/positions.json
frontend/src/i18n/en/tasks-page.json
8 files changed, 464 insertions(+), 8 deletions(-)
```

The 8 deletions are the `work_item` scalar→object relocation (§2, 4 lines × 2 locales); no other
line was removed.

---

## 1. Populations, re-derived at start (D-04) — byte-identical to the committed ledger §1

### 1.1 The eleven `t()`-bearing lane files — scoped strict audit

```
$ node scripts/i18n-audit-strict.mjs "$PWD" --scope "<the eleven lane files>"
strict i18n audit: 11 file(s); 91/127 two-arg masks unresolved
mask shapes literal/options-default: 91/127 and 0/0
8/61 raw-key sites unresolved
EN/AR two-arg: 91/91
EN/AR raw-key: 8/8
binding defect population: 10 files (0 array + 10 bare)
canonical binding reclassified sites: 0 two-arg / 0 raw-key
loose-hidden two-arg/raw-key: 0/0
```

99 unresolved sites: 91 two-arg + 8 raw-key. Per-file: TaskDetail 19, ReminderButton 20,
WaitingQueue 21 (19 two-arg + 2 raw-key), AddContributorDialog 8, AssignmentDetailsModal 7,
EscalationDialog 5, TaskDetailPage 5, AgingIndicator 4, ContributorsList 2, TaskCard 2,
CommitmentEditor 6 (raw-key). The eleven files were located by re-derivation, not carried:
`WaitingQueue.tsx` and `TaskDetailPage.tsx` live under `frontend/src/pages/`, not
`components/waiting-queue/`.

**AFTER (unchanged, and that is the correct result):** `91/127` and `8/61` again. This plan authors
keys; it does not re-bind a single call site, so the dot-form sites stay bound to the default
namespace until 99-43 rewrites them. An authoring-only plan that moved this number would have
touched source.

### 1.2 StepUpMFA — the one surface that authoring alone repairs

```
$ node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/components/step-up-mfa/StepUpMFA.tsx"
BEFORE: 24/24 raw-key sites unresolved   EN/AR raw-key: 24/24
AFTER : 0/24 raw-key sites unresolved    EN/AR raw-key: 0/0
```

`StepUpMFA.tsx:78` is already `useTranslation('positions')`, so its 24 `stepUp.*` sites resolve the
moment the keys exist in `positions.json`. **`StepUpMFA.tsx` was not edited** — exactly as the plan's
`<interfaces>` directs. The path was re-derived: the component is at `components/step-up-mfa/`, not
`components/auth/`.

### 1.3 partA_maskfinder — the dynamic-prefix class (D-27), control first

```
$ python3 scripts/partA_maskfinder.py "$PWD" --control
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)

$ python3 scripts/partA_maskfinder.py "$PWD"
UNRESOLVED dynamic t() key prefixes: 13 total  (12 mask a raw value -> criterion 1; 1 render a RAW KEY -> criterion 2)
```

All 13 hits repo-wide sit in the **six** named carriers (AddContributorDialog, ContributorsList,
TaskCard, TaskDetail, AssignmentDetailsModal, CommitmentEditor). **AFTER: 13, unchanged** — same
reason as §1.1: the prefixes are still `ns=common` because no binding moved. The instrument measures
bindings; this plan supplies targets. 99-43's rewrite is what drives it to 0, and §6 gives it every
target it needs.

### 1.4 Leaf-count deltas on the four pairs

```
assignments  en 305 -> 392 (+ 87)   ar 309 -> 396 (+ 87)   EN-only:[] AR-extra=4
positions    en 341 -> 367 (+ 26)   ar 341 -> 367 (+ 26)   EN-only:[] AR-extra=0
tasks-page   en  68 -> 113 (+ 45)   ar  68 -> 113 (+ 45)   EN-only:[] AR-extra=0
commitments  en 116 -> 126 (+ 10)   ar 116 -> 126 (+ 10)   EN-only:[] AR-extra=0
```

168 distinct keys authored, **each twice** (336 leaves). Zero EN-only leaves — D-25 holds. The
+87/+87, +26/+26, +45/+45, +10/+10 symmetry is the mechanical statement of "every authored key is
authored twice".

---

## 2. The enum sets per dynamic carrier (D-27), derived from the consuming type

Each set came from the type the component consumes — `backend/src/types/database.types.ts`
`Constants.public.Enums`, or the component's own literal union — never from a bundle.

| Carrier                                               | Target prefix (99-43 binds here)           | Enum source               | Members                                                                                              | Authored                              |
| ----------------------------------------------------- | ------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------- |
| TaskCard.tsx:51                                       | `assignments:priority.`                    | `task_priority`           | urgent, high, medium, low                                                                            | **NOTHING — family already resolves** |
| TaskCard.tsx:54                                       | `tasks-page:status.`                       | `task_status`             | pending, in_progress, **review**, completed, cancelled                                               | already complete in `tasks-page`      |
| TaskCard.tsx:58, TaskDetail.tsx:124/414/487           | `assignments:work_item.`                   | `work_item_type`          | dossier, ticket, position, task                                                                      | all 4 + `label` (§2.1)                |
| AddContributorDialog.tsx:258, ContributorsList.tsx:78 | `tasks-page:contributors.role.`            | `CONTRIBUTOR_ROLES`       | helper, reviewer, advisor, observer, supervisor                                                      | all 5                                 |
| AddContributorDialog.tsx:264                          | `tasks-page:contributors.roleDescription.` | `CONTRIBUTOR_ROLES`       | same five                                                                                            | all 5                                 |
| AssignmentDetailsModal.tsx:213                        | `assignments:waitingQueue.status.`         | `assignment_status`       | pending, assigned, in_progress, completed, cancelled                                                 | all 5                                 |
| AssignmentDetailsModal.tsx:223                        | `assignments:waitingQueue.priority.`       | assignment priority union | low, medium, high, urgent                                                                            | all 4                                 |
| AssignmentDetailsModal.tsx:260                        | `assignments:waitingQueue.entityType.`     | the `entity.type` ternary | dossier, ticket, position                                                                            | all 3                                 |
| CommitmentEditor.tsx:120                              | `commitments:trackingMode.`                | `aa_tracking_mode`        | automatic, manual                                                                                    | both                                  |
| CommitmentEditor.tsx:297                              | `commitments:priority.`                    | `Commitment['priority']`  | low, medium, high, urgent                                                                            | **NOTHING — family already resolves** |
| CommitmentEditor.tsx:322                              | `commitments:status.`                      | `Commitment['status']`    | pending, in_progress, completed, cancelled, overdue — **five, no `review`** (the verified carve-out) | **NOTHING — family already resolves** |

**Probed before relying on any existing subtree, never duplicated** (the must-have's explicit rule):

```
probe en/commitments:priority   gaps=NONE   probe ar/commitments:priority   gaps=NONE
probe en/commitments:status     gaps=NONE   probe ar/commitments:status     gaps=NONE
probe en/assignments:priority   gaps=NONE   probe ar/assignments:priority   gaps=NONE
```

`assignments:priority` is the **`priority.low` family the must-have names**: it already holds
urgent/high/medium/low (plus a pre-existing `normal`), so `task_priority` is fully covered and **not
one leaf was added there**. `commitments:priority` (4) and `commitments:status` (5, including
`overdue`) were likewise already complete. The only probed gap in an existing enum family was:

- **`assignments:status` had no `review`.** `task_status` has five members; `review` was authored
  (`"Review"` / `"قيد المراجعة"`, matching the `tasks-page:status.review` register already shipped).

### 2.1 One type clash repaired — `assignments:work_item` (D-12's class)

`assignments:work_item` was a **scalar** `"Work Item"` / `"عنصر العمل"`, so a `work_item.<type>`
member could not physically be authored beneath it. Ruled repair applied: the scalar relocated to
`work_item.label` (target verified absent in both locales first) and the four `work_item_type`
members nest beside it, with values byte-identical to the sibling `assignments:work_type` subtree
that already ships this exact shape.

```
work_item.label en/ar = "Work Item" / "عنصر العمل"   (byte-preserved from the scalar)
```

**No repoint is owed.** `grep` for `t('work_item'` / `assignments:work_item` / `'work_item',` across
`frontend/src` returns exactly one hit — `components/empty-states/ListEmptyState.tsx:108`, which is a
`translationKey: 'work_item'` datum consumed as `empty-states:list.work_item.*` under
`useTranslation('empty-states')`. Different namespace, different path. Nothing consumed the scalar.

---

## 3. The three read-only banner sentences (D-32 / D-18)

Authored as **top-level `positions:readOnlyBanner.*`** — the key shape the plan's oracle asserts
(`pos.readOnlyBanner[s]`), not under `editor.`. Absent in **both** locales at HEAD, which is what
makes the oracle RED before this task (§5).

`position.status !== 'draft'` guards the banner in
`frontend/src/routes/_protected/positions/$id/index.tsx:52`, so the surface has **three** branches
and exactly three sentences; there is no draft branch in this `<p>` to extract.

| Key                                     | en (byte-identical to the route literal)                                                                                                                               | ar (موقف register, sentence case, no exclamation)                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `positions:readOnlyBanner.under_review` | Position Under Review - Read Only. This position is currently under review and cannot be edited. It must go through the approval chain before any changes can be made. | الموقف قيد المراجعة - للقراءة فقط. هذا الموقف قيد المراجعة حاليًا ولا يمكن تعديله. يجب أن يمر عبر سلسلة الاعتماد قبل إجراء أي تغييرات. |
| `positions:readOnlyBanner.approved`     | Position Approved - Read Only. This position has been approved and is awaiting publication. Contact an administrator to make changes.                                  | الموقف معتمد - للقراءة فقط. تم اعتماد هذا الموقف وهو في انتظار النشر. تواصل مع أحد المسؤولين لإجراء أي تغييرات.                        |
| `positions:readOnlyBanner.published`    | Position Published - Read Only. This position has been published. To make changes, you must use the Emergency Correction workflow or create a new version.             | الموقف منشور - للقراءة فقط. تم نشر هذا الموقف. لإجراء تغييرات، استخدم مسار التصحيح الطارئ أو أنشئ إصدارًا جديدًا.                      |

The en column was extracted from the route file by regex and asserted equal, not retyped:

```
en byte-identical to route literals: True
  ar under_review: موقف=True منصب=False '!'=False arabic-indic=False
  ar approved:     موقف=True منصب=False '!'=False arabic-indic=False
  ar published:    موقف=True منصب=False '!'=False arabic-indic=False
```

Arabic register decisions, all taken from terminology already shipped in `ar/positions.json` rather
than invented: `موقف` for the stance (D-18; **`منصب` appears zero times** in all four ar bundles),
`سلسلة الاعتماد` (the bundle's own `approval.title`), `معتمد`/`منشور` (its own `status.*`),
`التصحيح الطارئ` (its own `emergencyCorrection` family). Latin digits per D-31 — zero
`[٠-٩۰-۹]` codepoints in any of the four ar bundles.

**The route file was NOT touched.** `grep -c "Read Only"` on it still returns `3`; the extraction and
the rendered banner oracle are 99-43's, and the keys are now waiting for them.

---

## 4. What was authored, by slice

### `positions` (+26 each locale)

- `readOnlyBanner.{under_review,approved,published}` — §3.
- `stepUp.*` — 23 keys, the whole population `StepUpMFA.tsx` consumes: `title`, `description`,
  `initiating`, `codeLabel`, `resending`, `resendCode`, `cancel`, `verifying`, `verify`, `helpText`,
  `challengeTypes.{totp,sms,push}`, `placeholders.{totp,sms,push}`,
  `errors.{expired,networkError,noChallengeActive,invalidFormat,invalidCode,verificationFailed,resendFailed}`.
  These are **raw-key** sites — they shipped their own key strings to users, so there is no mask
  literal to be byte-identical to and the en copy is authored. `placeholders.*` are `"000000"` in
  both locales, matching the component's own `default: return '000000'` fallback and D-31.

### `assignments` (+87 each locale)

- `status.review`, `work_item.{label,dossier,ticket,position,task}` — §2.
- `waitingQueue.*` (67 keys): `aging.{ok,warning,danger}`, `days`, `relatedTo`,
  `assignmentDetails.*` (16), `escalation.*` (17), `reminder.*` (20 — seven toast
  `{title,description}` pairs plus `button.{label,sending,sent,send}`), `status.*` (5),
  `priority.*` (4), `entityType.*` (3).
- `waiting.*` (15 keys): the `WaitingQueue.tsx` page slice, including the two raw-key toast sites
  `assignmentUpdated` / `assignmentCompletedDesc`.

### `tasks-page` (+45 each locale)

- `card.{created,due}` — TaskCard. A **sub-object was mandatory**: `tasks-page` already owns
  `created` as the scalar `"Task created"` and `due` as an _object_, so a bare-prefix landing would
  have either collided with a live object or bound TaskCard's `"Created"` mask to different copy,
  breaking D-25's byte-identity.
- `detail.*` — TaskDetail, 19 leaves.
- `contributors.*` — AddContributorDialog + ContributorsList, 10 scalars + `role.*` (5) +
  `roleDescription.*` (5).
- `page.*` — TaskDetailPage, 4 leaves. Also mandatory as a sub-object: top-level `deleted` is
  `"Task deleted"` while the site's mask literal is `"Task Deleted"`.

### `commitments` (+10 each locale)

- `form.{contactEmail,emailPlaceholder,contactName,namePlaceholder,organization,orgPlaceholder}` —
  the six external-contact raw-key sites (absent from `common:afterActions.commitments.*`, hence
  raw).
- `trackingMode.{automatic,manual}` — the `aa_tracking_mode` carrier.
- `card.item` = `"Commitment {{number}}"`, `card.aiConfidence` = `"{{value}}% confidence"` — the two
  interpolation-dropper repairs (the resolving `common` copy is `"Commitment"` / `"Confidence"`,
  silently discarding the value its caller passes).

### 4.1 D-25, proved mechanically

For every authored key whose site carried a mask literal, the en value was asserted equal to that
literal extracted from source — not retyped:

```
sites checked for D-25 en byte-identity: 81
RESULT: ALL BYTE-IDENTICAL
```

Twenty further keys are **relocations, not new copy** — they already resolved through `common:` and
are being moved into the lane namespace, so preserving what the app renders today is the correct
target in _both_ locales:

```
relocated keys byte-preserved from common (en+ar): 20 keys -> ALL MATCH
```

Those 20 are `waitingQueue.assignmentDetails.{title,assignee,statusAndPriority,assignedAt,daysWaiting,lastReminder,noReminderSent,timeline,viewFullDetails,workItemNotAvailable}`
and `waitingQueue.escalation.{autoResolve,error,escalate,escalateAssignment,escalating,noEscalationPathMessage,reason,reasonPlaceholder,selectRecipient,success}`.
This is why, e.g., `escalation.noEscalationPathMessage` reads
`"Could not find a manager for {{user}} in the organizational hierarchy."` and **not** the
`"No manager configured for …"` mask literal at `EscalationDialog.tsx:231-234` — the mask never
renders, because the key resolves.
The ar side of these 20 is `common`'s own ar copy, which already uses
**تكليف** for _assignment_; the new `waitingQueue.*`/`waiting.*` copy follows it, keeping the slice
internally consistent and on the ruled glossary term.

### 4.2 Two pre-existing key collisions, split (the §3.1 class)

Both are one key bound to two different sentences in the same file. Both were invisible at HEAD
because each site rendered its own mask; resolving them naively would collapse two sentences onto
one string.

| File                         | Colliding key                                                                                                                       | Kept the base key                                                                             | New key                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `AssignmentDetailsModal.tsx` | `waitingQueue.assignmentDetails.description` — the `AdaptiveDialog` `description` prop (line 152) vs the section heading (line 232) | heading → `…assignmentDetails.description` = `"Description"`                                  | dialog → `…assignmentDetails.dialogDescription` = `"View complete details for assignment {{id}}, assigned to {{assignee}}"` |
| `EscalationDialog.tsx`       | `waitingQueue.escalation.reason` — the visible `<Label>` (line 303) vs the `<Textarea>` `aria-label` (line 316)                     | label → `…escalation.reason` = `"Reason (Optional)"` (the resolving `common` copy, preserved) | aria-label → `…escalation.reasonAriaLabel` = `"Reason"` (byte-identical to its mask literal)                                |

`dialogDescription`'s en is the one authored value that is _not_ byte-identical to its site's second
argument, and it cannot be: that argument is a JS **template literal** with two embedded
expressions (`${assignment.id.substring(0, 8)}`, `${assignment.assignee_name || 'Unknown'}`). The
authored value carries the same two values as i18next interpolations. 99-43 passes `{ id, assignee }`.

---

## 5. The oracle, verbatim

The plan's `must_haves.truths` oracle command, run unmodified.

**RED at HEAD (`47cdc0e31`) — on exactly the sentinel clause, as the plan predicts:**

```
missing en readOnlyBanner.under_review
missing en readOnlyBanner.approved
missing en readOnlyBanner.published
missing ar readOnlyBanner.under_review
missing ar readOnlyBanner.approved
missing ar readOnlyBanner.published
ORACLE_EXIT=1
```

The en→ar parity clause was already silent at HEAD (all four pairs had zero EN-only leaves), so the
RED is attributable to the absent `readOnlyBanner` subtree and nothing else — the failure the plan's
`text` field names.

**GREEN after authoring:**

```
ORACLE_EXIT=0
```

No output: the three banner sentinels are non-empty strings in both locales, and every en key across
all four pairs resolves in ar.

### 5.1 The retarget-resolution proof — the `done` criterion, measured

Every target 99-43 will bind to (§6), resolved against the real bundles in both locales:

```
retarget targets probed: 186
UNRESOLVED (either locale): NONE
```

### 5.2 The negative control is still undefused

```
$ node scripts/neg-taskcard.mjs "$PWD"
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

**3× `MISS=true`.** The control probes ns `translation` (= `common.json`) and stays discriminating
precisely because **nothing was authored into `common.json` or the translation alias** — the
must-have's explicit prohibition, and the thing that would have defused the phase's negative control.
`scripts/neg-taskcard.mjs` was not edited.

### 5.3 Type-check, lint, project checks

```
$ (cd frontend && pnpm exec tsc --noEmit -p tsconfig.json)     FRONTEND_TSC_EXIT=0
$ pnpm --filter intake-frontend lint                            LINT_EXIT=0
  eslint --max-warnings 0 clean, plus all four project checks:
  i18n namespace check OK: 1716 file(s) scanned, 801 static namespace literal(s) checked against 128 registered namespaces, 3 dynamic reference(s) skipped.
  duplicate-rtl check OK        bootstrap parity check OK        date-formatting check OK
```

`glossary-census.mjs` flags 16 UNCLASSIFIED rows inside the four ar bundles; **all 16 are
pre-existing key paths** (`assignments:queue.types.dossier`, `commitments:detail.dossier`,
`commitments:evidence.*`, `positions:create_dialog.*`/`dossier_tab.*`/`type.policy_brief`/`briefing.*`/`analytics.briefingPacks`).
Zero of them is a key this task authored. No new glossary violation was introduced.

---

## 6. Retarget map for 99-43 — every source key → the authored colon key

99-43 authors **nothing**; it rewrites bindings to these targets. All 186 were proved resolvable in
both locales in §5.1.

| Site (file / current key)                                                                                                     | Authored target                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TaskCard `created`, `due`                                                                                                     | `tasks-page:card.{created,due}`                                                                                                                                                                                                      |
| TaskCard `` `priority.${p}` ``                                                                                                | `assignments:priority.{urgent,high,medium,low}`                                                                                                                                                                                      |
| TaskCard `` `status.${s}` ``                                                                                                  | `tasks-page:status.{pending,in_progress,review,completed,cancelled}`                                                                                                                                                                 |
| TaskCard + TaskDetail `` `work_item.${t}` ``                                                                                  | `assignments:work_item.{dossier,ticket,position,task}`                                                                                                                                                                               |
| TaskDetail 19 bare keys                                                                                                       | `tasks-page:detail.<same leaf>`                                                                                                                                                                                                      |
| AddContributorDialog `tasks.<leaf>`                                                                                           | `tasks-page:contributors.<same leaf minus the `tasks.` prefix>`                                                                                                                                                                      |
| AddContributorDialog `tasks.contributorRole` (the **scalar**, line 246)                                                       | `tasks-page:contributors.roleLabel` — renamed because line 258 uses the same string as a dynamic **prefix** in the same file                                                                                                         |
| AddContributorDialog + ContributorsList `` `tasks.contributorRole.${r}` ``                                                    | `tasks-page:contributors.role.{helper,reviewer,advisor,observer,supervisor}`                                                                                                                                                         |
| AddContributorDialog `` `tasks.roleDescription.${r}` ``                                                                       | `tasks-page:contributors.roleDescription.{same five}`                                                                                                                                                                                |
| ContributorsList `tasks.noContributors`, `tasks.removeContributor`                                                            | `tasks-page:contributors.{noContributors,removeContributor}`                                                                                                                                                                         |
| TaskDetailPage `tasks.deleted`, `tasks.deletedRedirecting`, `failed_to_load_task`, `back_to_tasks`                            | `tasks-page:page.<same leaf>`                                                                                                                                                                                                        |
| AgingIndicator / EscalationDialog / AssignmentDetailsModal / WaitingQueue `waitingQueue.<leaf>`                               | `assignments:waitingQueue.<same leaf>`                                                                                                                                                                                               |
| the two `reason` senses in EscalationDialog                                                                                   | see §4.2 — `escalation.reason` / `escalation.reasonAriaLabel`                                                                                                                                                                        |
| the two `description` senses in AssignmentDetailsModal                                                                        | see §4.2 — `assignmentDetails.description` / `assignmentDetails.dialogDescription`                                                                                                                                                   |
| WaitingQueue `waiting.<leaf>`                                                                                                 | `assignments:waiting.<same leaf>`                                                                                                                                                                                                    |
| AgingIndicator:66 + AssignmentDetailsModal:315 `common.days`, **and** EscalationDialog:217 `waitingQueue.agingIndicator.days` | `assignments:waitingQueue.days` = `"days"` — one key for all three; `common:days` is an OBJECT of weekday names, and `common:waitingQueue.agingIndicator.days` is `"{{count}} day"`, which is why line 217 renders `"8 8 day"` today |
| CommitmentEditor 6 contact raw keys                                                                                           | `commitments:form.<same leaf>`                                                                                                                                                                                                       |
| CommitmentEditor:115 `afterActions.commitments.item`                                                                          | `commitments:card.item`                                                                                                                                                                                                              |
| CommitmentEditor:133 `afterActions.confidence`                                                                                | `commitments:card.aiConfidence`                                                                                                                                                                                                      |
| CommitmentEditor:120 `` `afterActions.commitments.tracking.${m}` ``                                                           | `commitments:trackingMode.{automatic,manual}`                                                                                                                                                                                        |
| CommitmentEditor:297/322 `…priorities.${p}` / `…statuses.${s}`                                                                | `commitments:priority.*` / `commitments:status.*` (already complete)                                                                                                                                                                 |
| positions route banner, 3 hardcoded literals                                                                                  | `positions:readOnlyBanner.{under_review,approved,published}`                                                                                                                                                                         |
| StepUpMFA 24 sites                                                                                                            | `positions:stepUp.*` — **already resolving; no rewrite needed at all**                                                                                                                                                               |

`AssignmentDetailsModal.tsx:180`'s `t('common.unknown', 'Unknown')` needs **no authoring**:
`common:unknown` is `"Unknown"` / `"غير معروف"`, byte-identical to the mask literal. It is a
colon-form fix only, and it is 99-43's.

---

## 7. Every key deliberately LEFT, with its named owner

### 7.1 The four pre-existing ar-only strays — OUTSIDE this population, left as-is

```
assignments AR-extra = queue.failedAttempts_few, queue.failedAttempts_many,
                       queue.failedAttempts_two, queue.failedAttempts_zero
```

These are the four leaves D-25 records for `assignments` (Arabic plural-category forms with no en
counterpart, beside the pre-existing `failedAttempts_one` / `failedAttempts_other`). The plan's
`<verification>` puts them outside the population, and the oracle checks en→ar only, so they are
correct as they stand. **Not touched, and not a defect** — English has no `_zero`/`_two`/`_few`/`_many`
category. Owner: nobody; they are shipped-correct ICU plural forms.

### 7.2 Left on `common:` by the RULING-P99-163(3) split — owner: **99-22 / the common-owner lane (99-06)**

Authoring any of these here would have violated the must-have's "no key lands in `common.json`"
clause and defused §5.2's negative control.

- `common:tasks.sla.approaching` — **absent in both locales**; `SLAIndicator.tsx` renders a raw key
  to users today. Its siblings `safe`, `warning` and `breached` all exist beside it. A genuine
  shipped defect.
- `common:afterActions.decisions.item` (`"Decision"`) and `common:afterActions.confidence`
  (`"Confidence"`) both **drop an interpolation their callers pass**. CommitmentEditor is repointed
  out of this defect by §4's `commitments:card.*`; **`DecisionList` / `DecisionEditor` still carry
  it** and are outside this allowlist.
- `common:afterActions.commitments.statuses` (3 members) and `.priorities` (3 members) are
  under-populated against `aa_commitment_status` (5) and `aa_priority` (4). They stay live for other
  consumers; CommitmentEditor moves to the complete `commitments:` enums.
- `common:waitingQueue.reminder.{noAssignee,success,error}` are **SCALARS** while
  `ReminderButton.tsx` addresses them as objects (`.title`/`.description`) — the type clash that
  made those 20 sites miss. The subtree now lives at `assignments:waitingQueue.reminder.*`; the
  `common` scalars were left untouched.
- `common:days` is an OBJECT of weekday names, so `t('common.days', 'days')` had no `common` target
  (§6).
- `WorkItemLinker.tsx`'s 8 raw-key sites target `common`.

### 7.3 Inside the lane's files but OUTSIDE the ledger §3 slice boundary — left resolving on `common:`

Named explicitly so 99-43 does not sweep them into the `assignments:` prefix and strand them. Each
**already resolves in both locales**, so none is a lane gap:

- `common:waitingQueue.bulkActions.*` (17 keys) and `common:waitingQueue.filters.*` (8 keys),
  addressed by `WaitingQueue.tsx` — the same subtrees `BulkActionToolbar` and `FilterPanel` assert
  against. §3's slice list is exactly
  `{aging, assignmentDetails, escalation, reminder, status, priority, entityType, relatedTo, days}`;
  these two are deliberately not in it.
- `common:waitingQueue.statuses.*` — `WaitingQueue.tsx:595`/`776`'s dynamic prefix (plural
  `statuses`, distinct from AssignmentDetailsModal's `status`). Resolves; the maskfinder control
  asserts exactly this (`resolves(common, "waitingQueue.statuses") = True`).
- `common:waitingQueue.entityStatus.*` (15 members, both locales) —
  `AssignmentDetailsModal.tsx:276`'s seventh dynamic prefix. It resolves, which is why the maskfinder
  flags six carriers and not seven.
- `common:{completed,delete,edit}` — three of TaskDetail's bare keys resolve in `common` with copy
  byte-identical to their mask literals, so `detail.*` is 19 leaves, not 22.
- `common:navigation.waitingQueue`, `common:all`, `common:cancel`, `common:optional`,
  `common:delete`, `common:selectDate`, `common:unknown` — already colon-form or already resolving.
- `commitments:` sites still on `common:afterActions.commitments.*` (`add`, `assignedTo`, `delete`,
  `deleteConfirm`, `description`, `descriptionPlaceholder`, `dueDate`, `empty`, `external`,
  `internal`, `ownerType`, `priority`, `selectUser`, `status`, `title`) — §3's commitments slice is
  the six contact keys, `trackingMode`, `priority`, `status` and the two `card` leaves. The rest
  resolve where they are.

### 7.4 Not edited, by constraint

`scripts/neg-taskcard.mjs`; `frontend/src/i18n/{en,ar}/common.json`; `StepUpMFA.tsx`;
`frontend/src/routes/_protected/positions/$id/index.tsx`; `frontend/tests/setup.ts`; every test file;
every path outside `files_modified`.

---

## 8. Ship / no-ship, recorded (AGENTS.md)

Every fix here landed in the **product** — the eight shipped i18n bundles. No local remedy, no
script-side workaround, no test-side accommodation, no per-file exemption. Three findings that a
user hits and that this allowlist could not carry are handed on by name in §7.2 rather than patched
where I happened to be standing: `common:tasks.sla.approaching` (a raw key shipped to users),
`common:afterActions.decisions.item` / `common:afterActions.confidence` (interpolation-droppers still
live in `DecisionList`), and the `common:waitingQueue.reminder.*` scalar/object type clash. Each is
recorded with its owner in the same place as its defect.

Two decisions worth the operator's eye, both taken toward the instrument of record rather than the
prior attempt's shape:

1. **`readOnlyBanner` is TOP-LEVEL, not under `editor.`.** The plan's own oracle reads
   `pos.readOnlyBanner[s]`, and the must-have says "authored as `positions: readOnlyBanner` keys". The
   preserved lineage's ledger §4 recorded `positions:editor.readOnlyBanner.*`, which the oracle would
   have failed. The oracle wins; a duplicate subtree under `editor.` was not authored, per the
   must-have's no-duplicate-subtrees rule. **99-43 binds the banner to
   `positions:readOnlyBanner.<status>`.**
2. **There is no fourth `draftBanner` key.** The route's `<p>` is guarded by
   `position.status !== 'draft'`, so a draft sentence does not exist on this surface to extract. The
   must-have asks for three; three were authored.

---

## 9. Every command this task ran

```
python3 scripts/partA_maskfinder.py "$PWD" --control            # control FIRST
python3 scripts/partA_maskfinder.py "$PWD"                      # before / after
node scripts/i18n-audit-strict.mjs "$PWD" --scope "<the eleven lane files>"          # before / after
node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/components/step-up-mfa/StepUpMFA.tsx"
node -e '<the plan oracle>' "$PWD"                              # RED at HEAD, GREEN after
node scripts/neg-taskcard.mjs "$PWD"                            # negative control, after
node scripts/glossary-census.mjs
(cd frontend && pnpm exec tsc --noEmit -p tsconfig.json)
pnpm --filter intake-frontend lint
git diff --name-only 47cdc0e31..HEAD                            # scope proof
```
