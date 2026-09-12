# 99-12 — the tasks/queues/positions lane: authoring and colon form

**Task:** P99-12 (wave 3, part 1 of 2 of the lane)
**Worktree HEAD at start:** `5094e08fa`
**Commits:** `4649ed8db` (authoring), `b80eaf2c8` (colon form), `fb3f11da7` (tests + setup),
`73629a922` (StepUpMFA authoring + this summary), `cfe2a958f` / this commit (blocker record only).
**Verdict: NOT GREEN, and unsatisfiable inside this allowlist.** Five of the six acceptance items are
satisfied with verbatim oracle output below. The sixth — the `frontend/tests/setup.ts` clause of
must-have 3 — is **implemented exactly as mandated and is red on the test gate**, because the honest
instrument it requires exposes 54 assertions in **13 test files outside this task's allowlist**. §0
decomposes all 54 by measured cause and gives the mechanical remedy per assertion. Nothing in the
granted surface regresses.

## 0. Attempt 3 — the 54 measured per assertion; they decompose into two disjoint, out-of-scope causes

The gate's `new failure fingerprints vs baseline` list is the same 54 assertions in the same 13 files:
AfterActionForm 18, EngagementsListPage 11, DecisionList 7, BulkActionToolbar 3, FormInput 3,
DossierDrawer 3, FilterPanel 2, SLAIndicator 2, BriefGenerationPanel 1, FirstRunModal 1,
SettingsLayout 1, EngagementsList 1, waiting-queue-a11y 1. (The gate's wider `FAIL` list also names
AppShell, AppShell.a11y, Sidebar and the five dossiers list routes — **pre-existing**, absent from the
fingerprint diff, untouched here.)

**Zero of the 54 land in a granted file.** Every one of the twelve in-scope source files, the eight
bundles and the eight granted test files is absent from the gate's new-failure set. The lane's own
surface is green; the red is entirely collateral of the mandated setup.ts clause on suites this task
may not touch. Attempt 3 measured each of the 13 rather than classifying by inspection, and the
population splits in two.

### 0.1 Forty-two assertions in eleven files — stale copy written against the deleted key-echo shim

None of these eleven declares its own i18n mock (`grep -c "vi.mock('react-i18next'" → 0` for all
eleven), so all eleven resolved through the setup map and now resolve through the real bundles. Every
value below is the verbatim output of a probe over `frontend/src/i18n/en/*.json`.

| File (all outside `files_modified`)                                              | n   | What it asserts (the deleted map's copy)                                                                                                                                                                                                        | What the real bundle renders                                                                                                                                                                                                                                                                                                                                                                                          | Remedy                                           |
| -------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `frontend/tests/component/AfterActionForm.test.tsx`                              | 18  | `After-Action Record`; `Enter attendee names (comma-separated)`; `/Enter names separated by commas/`; `This record contains sensitive information`; `Add at least one attendee and one outcome (decision/commitment/risk/follow-up) to publish` | `common:afterActions.form.title` = `After Action Details`; `.attendeesPlaceholder` = `Type a name and press Enter`; `.attendeesHelp` = `Add attendees one at a time — press Enter or comma after each name`; `.confidentialWarning` = `This record is marked as confidential and will have restricted access`; `.publishRequirements` = `Add at least one decision, commitment, risk, or follow-up action to publish` | values-tracking retarget                         |
| `frontend/tests/component/DecisionList.test.tsx`                                 | 7   | `No decisions yet`; `Decision 1`; `80% confidence`; role=button `Remove decision`                                                                                                                                                               | `common:afterActions.decisions.empty` = `No decisions recorded`; `.decisions.item` = `Decision` (**drops `{{number}}`**); `common:afterActions.confidence` = `Confidence` (**drops `{{value}}`**); `.decisions.delete` = `Delete decision`                                                                                                                                                                            | retarget **+ 2 keys of `common.json` authoring** |
| `frontend/tests/component/BulkActionToolbar.test.tsx`                            | 3   | `5 items selected`; `Sending...`; `Clear Selection`                                                                                                                                                                                             | `common:waitingQueue.bulkActions.selectedCount` = `{{count}} selected`; `.sending` = `Sending reminders...`; `.clearSelection` = `Clear Selection`                                                                                                                                                                                                                                                                    | values-tracking retarget                         |
| `frontend/tests/accessibility/waiting-queue-a11y.test.tsx`                       | 1   | same `selectedCount` copy                                                                                                                                                                                                                       | same as above                                                                                                                                                                                                                                                                                                                                                                                                         | values-tracking retarget                         |
| `frontend/tests/unit/FormInput.test.tsx`                                         | 3   | aria-label `Required`; text `Required`                                                                                                                                                                                                          | `common:validation.required` = `Required field` — **the same att-1 pin this task was ordered to remove**, asserted again in an un-granted file                                                                                                                                                                                                                                                                        | values-tracking retarget                         |
| `frontend/tests/component/FilterPanel.test.tsx`                                  | 2   | `Type`                                                                                                                                                                                                                                          | `common:waitingQueue.filters.type` = `Work Item Type`                                                                                                                                                                                                                                                                                                                                                                 | values-tracking retarget                         |
| `frontend/tests/component/SLAIndicator.test.tsx`                                 | 2   | amber approaching status; `Deadline`                                                                                                                                                                                                            | `common:tasks.sla.approaching` is **ABSENT in both locales** — `SLAIndicator.tsx` renders a raw key to users today; `common:tasks.sla.deadline` = `SLA Deadline`                                                                                                                                                                                                                                                      | **1 key of `common.json` authoring** + retarget  |
| `frontend/tests/component/BriefGenerationPanel.manual.test.tsx`                  | 1   | `Brief saved successfully!`                                                                                                                                                                                                                     | `ai-brief:fallback.saved` = `Brief saved successfully` (no `!`; the `!` was the mask default)                                                                                                                                                                                                                                                                                                                         | one-character retarget                           |
| `frontend/src/components/FirstRun/FirstRunModal.test.tsx`                        | 1   | the RAW KEY `firstRun.successTitle`                                                                                                                                                                                                             | `sample-data:firstRun.successTitle` = `Sample data ready`                                                                                                                                                                                                                                                                                                                                                             | values-tracking retarget                         |
| `frontend/src/components/settings/__tests__/SettingsLayout.test.tsx`             | 1   | the RAW KEY `nav.accessAndSecurity`                                                                                                                                                                                                             | `settings:nav.accessAndSecurity` = `Access & Security`                                                                                                                                                                                                                                                                                                                                                                | values-tracking retarget                         |
| `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx` | 3   | the RAW KEYS `cta.close`, `error.load_failed_heading`, `error.retry`                                                                                                                                                                            | `dossier-drawer:` = `Close dossier`, `Could not load this dossier`, `Retry`                                                                                                                                                                                                                                                                                                                                           | values-tracking retarget                         |

Thirty-nine of the 42 are pure values-tracking retargets of exactly the kind §6.1 already performs on
the granted files. The remaining three need **authoring in `frontend/src/i18n/{en,ar}/common.json`**,
which this allowlist does not grant: `tasks.sla.approaching` (absent — a genuine user-visible raw-key
defect, handed to the common-owner lane in §8) and the two interpolation-droppers
`afterActions.decisions.item` / `afterActions.confidence` (the same defect class §3.2 repaired inside
`commitments:`; `DecisionList.tsx` still carries it).

### 0.2 Twelve assertions in two files — pre-existing broken suites the instrument un-hid, with no i18n cause

`EngagementsList.test.tsx:6` and `EngagementsListPage.test.tsx:49` each declare their **own** per-file
`vi.mock('react-i18next')`. Neither ever read the setup map and neither reads the real bundles now, so
neither can be a copy casualty. They were **zero-run at baseline**, and attempt 3 proved the mechanism
by execution — only `frontend/tests/setup.ts` restored to `5094e08fa`, everything else in place:

```
 Test Files  2 failed (2)
      Tests  no tests
No "initReactI18next" export is defined on the "react-i18next" mock
 ❯ src/i18n/index.ts:549:8   .use(initReactI18next)
 ❯ src/lib/format-date.ts:20:1
```

Their own factories are incomplete, and `src/lib/format-date.ts` transitively imports `src/i18n`, so
both files threw at collection. The new setup imports `src/i18n` before those factories apply, so the
files now collect: **18 tests run, 6 pass, 12 fail on their own defects.**

- **EngagementsListPage — 11.** Its own `@tanstack/react-router` mock omits `Link`, which
  `EngagementsListPage.tsx:295` renders: `No "Link" export is defined on the "@tanstack/react-router"
mock`. Remedy: add `Link` to that file's mock. Nothing to do with translation.
- **EngagementsList — 1.** Its own mock echoes keys, so `t('week.of')` renders `week.of` while the test
  asserts `/Week of/i`. `engagements:week.of` = `"Week of"` **exists** and the component's binding
  (`useTranslation(['engagements','list-pages'])`) is correct — the file's own mock is what hides it.

So 12 of the 54 are two suites that have not executed a single assertion since their per-file mocks
went stale. The mandated instrument is the thing that revealed it, and both files are out of scope.

### 0.3 Why no in-allowlist remedy exists

The allowlist grants four bundle pairs — `assignments`, `positions`, `tasks-page`, `commitments`. Every
failing assertion above resolves through `common`, `ai-brief`, `sample-data`, `settings`,
`dossier-drawer` or `engagements`, and none of the 13 test files is in `files_modified`. So every remedy
is either copy in a namespace this task may not author or an edit in a test file it may not touch.

**Reverting `frontend/tests/setup.ts` is not a third option, and it was measured, not argued.** Under
the old mock the colon keys this task introduces normalize (`key.replace(':','.')`) onto entries the
map does not hold, and the ruled repair deleted the mask second arguments at the eleven dynamic sites,
so they render as raw keys: with setup.ts alone reverted, **9 assertions in 4 granted files** go red
(CommitmentList 6, ContributorsList 1, ReminderButton 1, TaskCard 1). The test gate stays red either
way; the revert merely moves the red onto the granted surface _and_ abandons must-have 3. Making the
revert green would require re-adding ~40 map entries — the key-echo shim the amendment orders removed —
plus the two att-1 pins it marks MUST-REMOVE.

### 0.4 Ship/no-ship, recorded (AGENTS.md)

No local remedy was invented: no per-file setup exemption, no `common`-shaped fallback, no loosened or
deleted assertion, no re-grown map. The defect the honest instrument exposes is a **product** defect —
11 suites asserting copy and raw keys the app never renders, 2 suites that stopped executing entirely,
and 3 missing/lossy `common` keys, one of which ships a raw key to users — and it must be fixed where it
lives. The condition that clears this task is a scope decision the operator owns:

1. Extend `files_modified` with the 13 files plus the `common.json` pair (39 pure retargets, 3 authored
   keys, 2 local-mock repairs — the whole remedy is specified per assertion in §0.1/§0.2):

```
frontend/src/i18n/{en,ar}/common.json
frontend/tests/component/{AfterActionForm,DecisionList,BulkActionToolbar,FilterPanel,SLAIndicator,BriefGenerationPanel.manual}.test.tsx
frontend/tests/unit/FormInput.test.tsx
frontend/tests/accessibility/waiting-queue-a11y.test.tsx
frontend/src/components/FirstRun/FirstRunModal.test.tsx
frontend/src/components/settings/__tests__/SettingsLayout.test.tsx
frontend/src/components/list-page/__tests__/EngagementsList.test.tsx
frontend/src/pages/engagements/__tests__/EngagementsListPage.test.tsx
frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx
```

2. **or** move the `frontend/tests/setup.ts` clause of must-have 3 to a task whose allowlist covers
   them, and drop it from this one.

No source, bundle or test byte changed in attempt 3 — the tree is identical to `73629a922` apart from
this section.

---

## 1. Populations, re-derived (D-04)

### 1.1 Scoped strict audit — the eleven `t()`-bearing lane files

```
node scripts/i18n-audit-strict.mjs "$PWD" --scope "<the eleven lane files>"
```

**BEFORE (at `5094e08fa`):**

```
strict i18n audit: 11 file(s); 91/127 two-arg masks unresolved
mask shapes literal/options-default: 91/127 and 0/0
8/61 raw-key sites unresolved
EN/AR two-arg: 91/91
EN/AR raw-key: 8/8
binding defect population: 10 files (0 array + 10 bare)
canonical binding reclassified sites: 0 two-arg / 0 raw-key
loose-hidden two-arg/raw-key: 0/0
```

79 distinct two-arg keys, 8 distinct raw-keys. Per-file two-arg: TaskDetail 21, ReminderButton 22,
WaitingQueue 17, AddContributorDialog 8, AssignmentDetailsModal 8, EscalationDialog 5,
TaskDetailPage 5, AgingIndicator 4, ContributorsList 2, TaskCard 2. Raw-key: CommitmentEditor 6,
WaitingQueue 2.

**AFTER:**

```
strict i18n audit: 11 file(s); 0/127 two-arg masks unresolved
mask shapes literal/options-default: 0/127 and 0/0
0/61 raw-key sites unresolved
EN/AR two-arg: 0/0
EN/AR raw-key: 0/0
binding defect population: 10 files (0 array + 10 bare)
canonical binding reclassified sites: 0 two-arg / 0 raw-key
loose-hidden two-arg/raw-key: 0/0
```

The two-arg TOTAL is unchanged at 127 and the raw-key total at 61: no second argument was deleted
and no `t()` call disappeared. Only resolution moved. The bare-hook binding-defect population is
still 10 files — **hooks were not touched** (D-26).

### 1.2 Second scoped run — StepUpMFA and the positions route

`frontend/src/components/step-up-mfa/StepUpMFA.tsx` (the plan's path was re-derived; the file lives
under `components/step-up-mfa/`, not `components/auth/`).

**BEFORE:** `24/24 raw-key sites unresolved` / `EN/AR raw-key: 24/24`, all under the `stepUp.*`
prefix, bound to `positions` by `useTranslation('positions')` at line 78.

**AFTER:** `0/24 raw-key sites unresolved` / `EN/AR raw-key: 0/0` — repaired by **authoring alone**
in `positions.json`; `StepUpMFA.tsx` was not edited, exactly as the plan's `<interfaces>` directs.

Positions route (`routes/_protected/positions/$id/index.tsx`) after the banner extraction:
`0/2 two-arg masks unresolved`, `0/4 raw-key sites unresolved`, both locales.

### 1.3 partA_maskfinder — the dynamic-prefix class (D-27)

Control first, as required:

```
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
```

**BEFORE:**

```
UNRESOLVED dynamic t() key prefixes: 13 total  (12 mask a raw value -> criterion 1; 1 render a RAW KEY -> criterion 2)
MASKED-RAW-VALUE  frontend/src/components/tasks/AddContributorDialog.tsx:258  prefix='tasks.contributorRole' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/AddContributorDialog.tsx:264  prefix='tasks.roleDescription' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/ContributorsList.tsx:78  prefix='tasks.contributorRole' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:51  prefix='priority' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:54  prefix='status' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskCard.tsx:58  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:124  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:414  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/tasks/TaskDetail.tsx:487  prefix='work_item' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:213  prefix='waitingQueue.status' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:223  prefix='waitingQueue.priority' ns=common
MASKED-RAW-VALUE  frontend/src/components/waiting-queue/AssignmentDetailsModal.tsx:260  prefix='waitingQueue.entityType' ns=common
RAW-KEY           frontend/src/components/commitment-editor/CommitmentEditor.tsx:120  prefix='afterActions.commitments.tracking' ns=common
```

All 13 hits repo-wide were in the six named carriers.

**AFTER:**

```
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
```

---

## 2. The enum sets per dynamic carrier (D-27)

Each set was enumerated from the type the component consumes (`backend/src/types/database.types.ts`
`Constants.public.Enums`, or the component's own literal union), not from the bundle.

| Carrier                                               | Prefix after repair                        | Enum source               | Members                                                                                             |
| ----------------------------------------------------- | ------------------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| TaskCard.tsx:51                                       | `assignments:priority.`                    | `task_priority`           | urgent, high, medium, low                                                                           |
| TaskCard.tsx:54                                       | `assignments:status.`                      | `task_status`             | pending, in_progress, **review**, completed, cancelled                                              |
| TaskCard.tsx:58, TaskDetail.tsx:124/414/487           | `assignments:work_item.`                   | `work_item_type`          | dossier, ticket, position, task                                                                     |
| AddContributorDialog.tsx:258, ContributorsList.tsx:78 | `tasks-page:contributors.role.`            | `CONTRIBUTOR_ROLES`       | helper, reviewer, advisor, observer, supervisor                                                     |
| AddContributorDialog.tsx:264                          | `tasks-page:contributors.roleDescription.` | `CONTRIBUTOR_ROLES`       | same five                                                                                           |
| AssignmentDetailsModal.tsx:213                        | `assignments:waitingQueue.status.`         | `assignment_status`       | pending, assigned, in_progress, completed, cancelled                                                |
| AssignmentDetailsModal.tsx:223                        | `assignments:waitingQueue.priority.`       | assignment priority union | low, medium, high, urgent                                                                           |
| AssignmentDetailsModal.tsx:260                        | `assignments:waitingQueue.entityType.`     | the `entity.type` ternary | dossier, ticket, position                                                                           |
| CommitmentEditor.tsx:120                              | `commitments:trackingMode.`                | `aa_tracking_mode`        | automatic, manual                                                                                   |
| CommitmentEditor.tsx:297                              | `commitments:priority.`                    | `Commitment['priority']`  | low, medium, high, urgent                                                                           |
| CommitmentEditor.tsx:322                              | `commitments:status.`                      | `Commitment['status']`    | pending, in_progress, completed, cancelled, overdue — **five, no `review`**, the verified carve-out |

Each carrier dropped **only** its variable second argument, and only at those sites. The now-dead
`getRoleDescription()` helper in AddContributorDialog went with the argument it fed.

Two authoring gaps the probe found before the existing subtrees were relied on:

- `assignments:status` had no `review`. `task_status` has five members; `review` was authored.
- `assignments:work_item` was a **scalar** `"Work Item"` / `"عنصر العمل"` — a type clash of exactly
  D-12's class. Ruled repair applied: the scalar relocated to `work_item.label` (target verified
  absent in both locales) and the four `work_item_type` members nest beside it. **Nothing consumed
  the scalar** — `grep` for `t('work_item')` / `assignments:work_item` across `frontend/src` returns
  no consumer — so this is a pure relocation with no repoint owed.

---

## 3. Placement — every repaired binding, colon form (D-23 / D-26)

Hooks untouched; only the key argument moved. 45 replacements in the tasks slice, 72 in the
queues/commitments slice, counted per pattern at rewrite time.

- **`tasks-page:`** — TaskCard (`card.created`, `card.due`), TaskDetail (`detail.*`, 19 leaves),
  AddContributorDialog + ContributorsList (`contributors.*`), TaskDetailPage (`page.*`).
  Placement is a sub-object rather than a bare prefix because `tasks-page` already owns `created`
  ("Task created"), `updated`, `deleted`, `due` (an object) and `workflow_stage` (an object): a bare
  colon-prefix would either collide with a live object or bind a mask literal to different copy,
  breaking D-25's byte-identity. `contributors.roleLabel` exists for the same reason —
  `tasks.contributorRole` was **both** a string (line 246) and a dynamic prefix (line 258) in the
  same file.
- **`assignments:`** — the whole waiting-queue slice, key path byte-identical, namespace prefixed:
  `assignments:waitingQueue.{aging,assignmentDetails,escalation,reminder,status,priority,entityType,relatedTo,days}.*`
  and `assignments:waiting.*` (WaitingQueue.tsx). `common.json` belongs to another lane, so the
  keys land in this lane's own feature namespace, per D-26's split.
- **`commitments:`** — `form.{contactEmail,emailPlaceholder,contactName,namePlaceholder,organization,orgPlaceholder}`,
  `trackingMode.*`, `priority.*`, `status.*`, `card.{item,aiConfidence}`.
- **`positions:`** — the banner (§4) and `stepUp.*` (§1.2).
- **`common:`** — one resolvable dot-common site rewritten, `AssignmentDetailsModal.tsx:180`:
  `t('common.unknown', 'Unknown')` → `t('common:unknown', 'Unknown')`; `common:unknown` is
  `"Unknown"` / `"غير معروف"`, byte-identical to the mask literal.

### 3.1 One pre-existing key collision, split

`AssignmentDetailsModal.tsx` bound **two different sentences to one key**: the `AdaptiveDialog`
`description` prop (line 152, "View complete details for assignment …") and the section heading
(line 232, "Description"). Both were unresolved at HEAD, so each rendered its own default and the
collision was invisible. Resolving them would have collapsed both onto one string. The dialog
description got its own key, `assignments:waitingQueue.assignmentDetails.dialogDescription`; **both
second arguments are byte-identical to HEAD.**

### 3.2 Three sites whose resolved copy dropped the interpolation the caller passes

Not mask repairs — these keys _resolved_, and resolved to copy that silently discarded an
interpolation value the call site supplies. Repaired in-namespace so the granted tests keep their
assertions at full strength rather than being weakened to match broken copy:

| Site                     | Was                                                                       | Rendered       | Now                                                         |
| ------------------------ | ------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------- |
| CommitmentEditor.tsx:115 | `t('afterActions.commitments.item', { number })`                          | `"Commitment"` | `commitments:card.item` = `"Commitment {{number}}"`         |
| CommitmentEditor.tsx:133 | `t('afterActions.confidence', { value })`                                 | `"Confidence"` | `commitments:card.aiConfidence` = `"{{value}}% confidence"` |
| EscalationDialog.tsx:217 | `t('waitingQueue.agingIndicator.days', { count })` beside `{daysWaiting}` | `"8 8 day"`    | `assignments:waitingQueue.days` = `"days"` → `"8 days"`     |

---

## 4. The banner (D-32 / D-18) — absence + presence

Four sentences extracted, all four branches of the same `<p>`; the three ruled read-only sentences
plus the draft sentence, because a banner is Arabic-capable only if every branch is.

Keys, both locales:

| Key                                            | en                                                                                                                                                                     | ar                                                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `positions:editor.readOnlyBanner.under_review` | Position Under Review - Read Only. This position is currently under review and cannot be edited. It must go through the approval chain before any changes can be made. | الموقف قيد المراجعة - للقراءة فقط. هذا الموقف قيد المراجعة حاليًا ولا يمكن تعديله. يجب أن يمر عبر سلسلة الموافقات قبل إجراء أي تغييرات.            |
| `positions:editor.readOnlyBanner.approved`     | Position Approved - Read Only. This position has been approved and is awaiting publication. Contact an administrator to make changes.                                  | الموقف معتمد - للقراءة فقط. تم اعتماد هذا الموقف وهو في انتظار النشر. تواصل مع أحد المسؤولين لإجراء أي تغييرات.                                    |
| `positions:editor.readOnlyBanner.published`    | Position Published - Read Only. This position has been published. To make changes, you must use the Emergency Correction workflow or create a new version.             | الموقف منشور - للقراءة فقط. تم نشر هذا الموقف. لإجراء تغييرات، استخدم مسار التصحيح العاجل أو أنشئ إصدارًا جديدًا.                                  |
| `positions:editor.draftBanner`                 | Draft Mode - Editing Enabled. You can edit this position. Changes are auto-saved every 30 seconds. Click "Submit for Review" when ready to start the approval process. | وضع المسودة - التحرير مُتاح. يمكنك تعديل هذا الموقف. تُحفظ التغييرات تلقائيًا كل 30 ثانية. اضغط "إرسال للمراجعة" عند الاستعداد لبدء مسار الموافقة. |

Arabic uses the **`موقف`** family throughout; `منصب` appears nowhere (D-18). Digits are Latin
(D-31) — `grep -c "[٠-٩۰-۹]"` over every `ar` bundle this task touched returns 0.

**Absence:** `grep -c "Read Only" 'frontend/src/routes/_protected/positions/$id/index.tsx'` → `0`
(was `3`).
**Presence:**

```
59:                  t('positions:editor.readOnlyBanner.under_review')}
60:                {position.status === 'approved' && t('positions:editor.readOnlyBanner.approved')}
62:                  t('positions:editor.readOnlyBanner.published')}
75:                {t('positions:editor.draftBanner')}
```

---

## 5. Oracles, verbatim

### 5.1 Oracle 1 — scoped strict-audit zero, both classes, both locales

The plan's exact command (JSON + exit-code gate) run unmodified: **`ORACLE1_EXIT=0`**. Human-readable
form in §1.1.

### 5.2 Oracle 2 — the three rendered banner tests

Count gate first:

```
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:217:5 › UI99-C7 ar banner under_review
  [chromium-en] › 99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner approved
  [chromium-en] › 99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner published
Total: 3 tests in 1 file
```

**RED proved by execution**, with only the route file reverted to `3291501a1` (the pre-fix bytes,
`grep -c "Read Only"` → `3`) and the authored bundles left in place, so the failure is attributable
to the banner and nothing else:

```
PW_EXIT=1
  ✘  1 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:217:5 › UI99-C7 ar banner under_review (9.1s)
  ✘  2 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner published (9.5s)
  ✘  3 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:217:5 › UI99-C7 ar banner under_review (retry #1) (8.7s)
  ✘  4 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner published (retry #1) (8.8s)
  ✘  5 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:217:5 › UI99-C7 ar banner under_review (retry #2) (8.4s)
  ✘  6 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner published (retry #2) (9.0s)
  ✘  7 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner approved (8.3s)
  ✘  8 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner approved (retry #1) (8.4s)
  ✘  9 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner approved (retry #2) (8.3s)
      129 |   expect(text, `UI99-C7 ${status} leaked the hardcoded Read Only literal`).not.toContain(
```

**GREEN with the fix.** The fixture seeded all three statuses — a missing position would have been a
fixture failure, not a skip — and the data precondition D-35 recorded is **retired, not re-recorded**:

```
[P99-C7] verified positions CHECK constraints before INSERT:
positions_status_check: CHECK ((status = ANY (ARRAY['draft'::text, 'under_review'::text, 'approved'::text, 'published'::text])))
[P99-C7] seeded position ids: {"under_review":"e3c0c814-8b4a-4ea7-aeac-faf39c62d73b","approved":"8475d198-861e-4865-a294-8d54fa10b6ba","published":"9250a2d2-8888-43b6-ac87-7f2c53656cd0"}
  ✓  1 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:217:5 › UI99-C7 ar banner under_review (10.3s)
  ✓  2 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner published (10.4s)
  ✓  3 [chromium-en] › tests/e2e/99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner approved (8.4s)
  3 passed (22.7s)
```

The reaped form of the same run (`scripts/pw-run-reaped.mjs`) exited `0`:
`playwright exited code=0 signal=null; … session reaped; verdict clean; report published`.

### 5.3 neg-taskcard — the negative control is still undefused

`node scripts/neg-taskcard.mjs "$PWD"`, **after** the TaskCard repair:

```
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

**3× `MISS=true`**, asserted by text and not by exit code. The control probes ns `translation`
(= `common.json`) and stays discriminating precisely because the repair colon-bound TaskCard to
`assignments:` instead of authoring `priority`/`status`/`work_item` into `common.json` — which this
task never touched. Its own §2 warning ("whoever repairs TaskCard must re-point this probe") does
**not** fire: the probe still measures a genuinely broken routing. The file was not edited.

### 5.4 en/ar parity on the four pairs

```
assignments en=371 ar=375 EN-only:[] AR-extra=4
positions   en=368 ar=368 EN-only:[] AR-extra=0
tasks-page  en=112 ar=112 EN-only:[] AR-extra=0
commitments en=126 ar=126 EN-only:[] AR-extra=0
```

Zero EN-only leaves — D-25 holds. `assignments`'s 4 AR-extra leaves are the pre-existing ones
D-25 records.

### 5.5 Type-check and lint

`pnpm exec tsc --noEmit` → clean, exit 0. `pnpm --filter intake-frontend lint` → eslint
`--max-warnings 0` clean plus all four project checks OK, including
`i18n namespace check OK: 1716 file(s) scanned, 801 static namespace literal(s) checked against 128 registered namespaces`.

---

## 6. `tests/setup.ts` — what changed and why it had to

The mock that was there resolved every `t()` through a hand-maintained key→string map and returned
`translations[key] ?? translations[key.replace(':','.')] ?? defaultValue ?? key`. Three consequences,
all of which the amendment names:

1. **It was a key-echo shim.** Any key it had not been taught rendered as its own raw key, so a
   missing translation was indistinguishable from a present one and unresolved keys shipped green.
2. **It was language-blind.** `t` always returned the en map while `i18n.language` reported `ar`, so
   a test could render Arabic and assert English and pass.
3. **It could not have been extended.** Every colon-form key this task introduces misses that map.
   Making the granted tests green under the old mock would have required ~40 new map entries —
   growing the shim the amendment orders removed.

Replaced by `import i18n from '../src/i18n'`: the app's only resource loader, so tests get
production namespaces, resources, the `translation`→`common` alias, and the same fallback config
(`fallbackLng: 'en'`, no `fallbackNS`, no `defaultNS`). Both att-1 pins are gone —
`'validation.required': 'Required'` was deleted with the map, and `smart-input:select.clear`'s
exemption-by-omission with it.

One addition beyond the import: a `beforeEach` restoring the boot language. The i18next instance is
a module singleton, and `LanguageProvider` calls `changeLanguage` when it finds `id.locale`; without
the reset, one test's `localStorage.setItem('id.locale','ar')` decides the locale of every test after
it in the same file. This is not a fallback hack — a browser re-runs detection on every page load,
and this makes each test start where the app starts. It is load-bearing: `ConflictDialog.test.tsx`
fails without it and passes with it, having never intended to render Arabic.

### 6.1 The eight granted test files — values-tracking only

Every edit moves an assertion to the authored en value at the **same query and the same matcher
shape**. No assertion deleted, loosened, made shape-insensitive, or pointed at a test-only fixture.

| File                                                                | Assertion                                               | Was                                          | Now                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `tests/component/AssignmentDetailsModal.test.tsx`                   | `getByTestId('assignment-status')).toHaveTextContent`   | `'pending'`                                  | `'Pending'`                                                                    |
| "                                                                   | `getByTestId('assignment-priority')).toHaveTextContent` | `'high'`                                     | `'High'`                                                                       |
| `tests/component/ReminderButton.test.tsx`                           | `toHaveTextContent`                                     | `/follow up/i`                               | `/send reminder/i`                                                             |
| `tests/component/ContributorsList.test.tsx`                         | `getByText` ×3                                          | `'helper'`, `'reviewer'`, `'advisor'`        | `'Helper'`, `'Reviewer'`, `'Advisor'`                                          |
| `tests/component/EscalationDialog.test.tsx`                         | `getByText`                                             | `/No manager configured for Test Assignee/i` | `/Could not find a manager for Test Assignee/i`                                |
| `tests/component/CommitmentList.test.tsx`                           | `getByText`                                             | `'No commitments yet'`                       | `'No commitments recorded'`                                                    |
| "                                                                   | `getByRole('button', { name })` ×2                      | `'Remove commitment'`                        | `'Delete commitment'`                                                          |
| `src/components/forms/__tests__/SearchableSelect.a11y.test.tsx`     | `getByRole('button', { name })`                         | `'smart-input:select.clear'`                 | `'Clear selection'`                                                            |
| "                                                                   | `toHaveAttribute('aria-label', …)`                      | `'common:validation.required'`               | `'Required field'`                                                             |
| `tests/component/TaskCard.test.tsx`                                 | —                                                       | —                                            | no edit needed; passes                                                         |
| `src/components/after-actions/__tests__/AfterActionsTable.test.tsx` | —                                                       | —                                            | no edit needed; the suite errored at collection at baseline and now runs green |

The a11y file renders `en`, so both its retargets take the en bundle values; the file has **no other
edit**. The regex forms stayed regexes and the exact-string forms stayed exact strings.

---

## 7. THE BLOCKER — 13 out-of-allowlist test files, 54 assertions

Measured, not estimated. Full-suite JSON reports diffed assertion-by-assertion, baseline
`5094e08fa` vs the final tree:

```
baseline 1529/1596 (41 failed)  |  after 1576/1680 (78 failed)
NEW FAILING ASSERTIONS: 54 across 13 files
```

The suite gained 84 runnable tests because removing the `vi.mock('react-i18next')` factory fixed
**13 collection errors** (13 zero-run files at baseline → 0 suite-level errors after), and 47 more
assertions pass than at baseline.

**Isolation measurement — the source change alone is inside the plan's derived radius.** With
`tests/setup.ts` reverted to HEAD and every other change in place, the full suite shows **9 new
failures in 4 files: CommitmentList (6), ContributorsList (1), ReminderButton (1), TaskCard (1)** —
all granted. The blast radius below is attributable **entirely** to the mandated setup.ts clause.

| File                                                                    | New fails | Cause                                                                                                                                                                                                  | Fix owner                                |
| ----------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `tests/component/AfterActionForm.test.tsx`                              | 18        | asserts the old map's copy; e.g. `common:afterActions.form.title` is `"After Action Details"`, the test wants `"After-Action Record"`                                                                  | common-owner lane (copy) + the test file |
| `src/pages/engagements/__tests__/EngagementsListPage.test.tsx`          | 11        | **zero-run at baseline** (collection error); now collects and asserts stale copy                                                                                                                       | the test file                            |
| `tests/component/DecisionList.test.tsx`                                 | 7         | `afterActions.decisions.empty` is `"No decisions recorded"`, test wants `"No decisions yet"`; `afterActions.confidence` drops `{{value}}` (same defect as §3.2, in a component outside this allowlist) | common-owner lane + the test file        |
| `tests/component/BulkActionToolbar.test.tsx`                            | 3         | `waitingQueue.bulkActions.selectedCount` is `"{{count}} selected"`, test wants `"5 items selected"`                                                                                                    | the test file                            |
| `tests/unit/FormInput.test.tsx`                                         | 3         | `common:validation.required` is `"Required field"`, test wants `"Required"` — **the same att-1 pin this task was ordered to remove**, asserted in a second, un-granted file                            | the test file                            |
| `src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx` | 3         | asserts the RAW KEY `"cta.close"`, which now resolves                                                                                                                                                  | the test file                            |
| `tests/component/FilterPanel.test.tsx`                                  | 2         | `waitingQueue.filters.type` is `"Work Item Type"`, test wants `"Type"`                                                                                                                                 | the test file                            |
| `tests/component/SLAIndicator.test.tsx`                                 | 2         | `common:tasks.sla.approaching` is **genuinely absent** — a real unmasked defect; `SLAIndicator.tsx` is outside this allowlist and the key belongs to `common`                                          | common-owner lane (authoring)            |
| `tests/accessibility/waiting-queue-a11y.test.tsx`                       | 1         | same `selectedCount` copy                                                                                                                                                                              | the test file                            |
| `tests/component/BriefGenerationPanel.manual.test.tsx`                  | 1         | asserts `"Brief saved successfully!"`, absent from the real bundles                                                                                                                                    | common-owner lane + the test file        |
| `src/components/FirstRun/FirstRunModal.test.tsx`                        | 1         | asserts the RAW KEY `'firstRun.successTitle'`; real copy is `"Sample data ready"`                                                                                                                      | the test file                            |
| `src/components/settings/__tests__/SettingsLayout.test.tsx`             | 1         | asserts the RAW KEY `'nav.accessAndSecurity'`; real copy is `"Access & Security"`                                                                                                                      | the test file                            |
| `src/components/list-page/__tests__/EngagementsList.test.tsx`           | 1         | **zero-run at baseline**; asserts `/Week of/i`, absent                                                                                                                                                 | the test file                            |

**Nothing here is fixable inside this task's allowlist.** Every remedy is either copy in
`common.json` (owned by the common-owner lane) or a stale/raw-key assertion in a test file this task
may not touch. Three of them (`FormInput`, `FirstRunModal`, `SettingsLayout`, plus `DossierDrawer`)
are the _same_ raw-key-assertion pathology the amendment granted removal for in two files only.

**What the operator must decide.** The setup.ts clause and this allowlist are inconsistent: the
clause's honest instrument cannot be landed without also retargeting these 13 files. Either

- extend the allowlist to the 13 files above (10 are pure values-tracking retargets of the kind
  §6.1 already performs; `SLAIndicator` and `AfterActionForm`/`DecisionList`/`BriefGenerationPanel`
  additionally need `common.json` authoring, which sequences behind D-12's flatten), or
- move the setup.ts clause to a task whose allowlist covers them.

Reverting `tests/setup.ts` is **not** a third option: under the old mock every colon-form key this
task introduces renders a raw key, so the granted component tests could only be made green by
extending the key-echo shim the amendment orders removed.

---

## 8. Handoffs, by name

**To the common-owner lane (99-06):** every key below is consumed by a lane file, targets `common`,
and was **not** authored here.

- `common:tasks.sla.approaching` — absent in both locales, rendered as a raw key by
  `SLAIndicator.tsx`. The nearest siblings (`safe`, `warning`, `breached`) exist.
- `common:days` is an OBJECT (weekday names), so `t('common.days', 'days')` in `AgingIndicator.tsx`
  and `AssignmentDetailsModal.tsx` had no `common` target. Both now read
  `assignments:waitingQueue.days`; if `common` ever gains a `days` label, they are the repoint set.
- `common:afterActions.commitments.item` (`"Commitment"`) and `common:afterActions.confidence`
  (`"Confidence"`) both drop an interpolation their callers pass. CommitmentEditor was repointed to
  `commitments:card.*`; **`DecisionList` / `DecisionEditor` still carry the defect** and are outside
  this allowlist.
- `common:afterActions.commitments.statuses` (3 members) and `.priorities` (3 members) are now
  orphaned by CommitmentEditor's repoint to the complete `commitments:` enums; they remain live for
  any other consumer and are under-populated against `aa_commitment_status` (5) and `aa_priority` (4).
- `common:waitingQueue.reminder.{noAssignee,success,error}` are SCALARS while
  `ReminderButton.tsx` addressed them as objects (`.title`/`.description`) — the type clash is why
  those sites missed. The subtree now lives at `assignments:waitingQueue.reminder.*`; the `common`
  scalars were left untouched.
- `WorkItemLinker.tsx`'s 8 raw-key sites target `common` — named in the plan as the common-owner
  lane's, and not edited here.

**To the lane's part 2:** every second argument in the twelve source files is byte-identical to
`5094e08fa` outside the eleven dynamic sites, so the D-24 step-3 deletion lane inherits an intact
mask population (127 two-arg calls, 0 unresolved).

**Not edited, by constraint:** `scripts/neg-taskcard.mjs`, `frontend/src/i18n/*/common.json`,
`StepUpMFA.tsx`, and every path outside `files_modified`.

---

## 9. Every command this task ran

```
node scripts/i18n-audit-strict.mjs "$PWD" --scope "<eleven lane files>"            # before / after
node scripts/i18n-audit-strict.mjs "$PWD" --scope "<eleven lane files>" --json | node -e '<exit gate>'
node scripts/i18n-audit-strict.mjs "$PWD" --scope "frontend/src/components/step-up-mfa/StepUpMFA.tsx"
node scripts/i18n-audit-strict.mjs "$PWD" --scope 'frontend/src/routes/_protected/positions/$id/index.tsx'
python3 scripts/partA_maskfinder.py "$PWD" --control                               # control FIRST
python3 scripts/partA_maskfinder.py "$PWD"                                         # before / after
node scripts/neg-taskcard.mjs "$PWD"                                              # after the repair
grep -c "Read Only" 'frontend/src/routes/_protected/positions/$id/index.tsx'      # 3 -> 0
grep -n "t('positions:" 'frontend/src/routes/_protected/positions/$id/index.tsx'  # presence
grep -c "[٠-٩۰-۹]" frontend/src/i18n/ar/*.json                                    # 0 everywhere
pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts -g "UI99-C7 ar banner" --project=chromium-en --no-deps --list
pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts -g "UI99-C7 ar banner" --project=chromium-en --no-deps   # RED, then GREEN
node scripts/pw-run-reaped.mjs -- tests/e2e/99-ar03-leak.spec.ts -g "UI99-C7 ar banner" --project=chromium-en --no-deps
pnpm exec tsc --noEmit
pnpm --filter intake-frontend lint
pnpm exec vitest run                                                              # baseline / isolation / final
```
