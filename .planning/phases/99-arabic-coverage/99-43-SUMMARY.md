# 99-43 — the instrument cutover: colon form, banner, real bundles, ledger retargets

**Task:** P99-43 (wave 7, part C — LAST — of the RULING-P99-163 split)
**Base:** `f8dfc90c7` (P99-22 merged)
**Commits:** `44cf9c6a5` (colon form + banner), `52aa2499a` (setup.ts cutover + every retarget),
`30f36adb7` (one object-clash repoint), this commit (summary).
**Verdict: GREEN.** All four acceptance oracles pass with output recorded verbatim below.
**This task authored NOTHING** — `git diff --name-only` contains no `frontend/src/i18n/**` path.
Every value it retargets onto was authored by 99-12 (the four lane bundle pairs) or 99-22
(the three `common.json` items).

---

## 0. Populations, re-derived at start (D-04)

### 0.1 Scoped strict audit — the eleven `t()`-bearing lane files

**BEFORE (at `f8dfc90c7`)** — byte-identical to the ledger's §1.1 BEFORE, so the lane was still
holding every unresolved site the ledger measured:

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

**AFTER:**

```
strict i18n audit: 11 file(s); 0/125 two-arg masks unresolved
mask shapes literal/options-default: 0/125 and 0/0
0/63 raw-key sites unresolved
EN/AR two-arg: 0/0
EN/AR raw-key: 0/0
binding defect population: 10 files (0 array + 10 bare)
canonical binding reclassified sites: 0 two-arg / 0 raw-key
loose-hidden two-arg/raw-key: 0/0
```

The two totals that moved are accounted for exactly: the two `t('common.days', 'days')` sites
(`AgingIndicator.tsx:66`, `AssignmentDetailsModal.tsx:315`) lost their second argument when they
were repointed at `assignments:waitingQueue.days`, whose value already **is** `days`, so a mask
literal became redundant rather than deleted-with-meaning. `127 → 125` two-arg and `61 → 63`
raw-key is that one move, twice, and nothing else. **No `t()` call disappeared.** The bare-hook
binding-defect population is still 10 files — hooks were not touched (D-26).

### 0.2 partA_maskfinder — the dynamic-prefix class (D-27), control FIRST

```
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
```

**BEFORE:** `UNRESOLVED dynamic t() key prefixes: 13 total  (12 mask a raw value -> criterion 1; 1 render a RAW KEY -> criterion 2)`
— the same 13 hits in the same six carriers the ledger §1.3 lists.

**AFTER:**

```
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
```

---

## 1. The colon-form rewrite — 146 replacements across the eleven `t()`-bearing lane files

Hooks untouched; only the key argument moved. Placement follows ledger §3 exactly.

| Slice                                                                      | Count | Placement                                                                                                        |
| -------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------- |
| TaskCard (2 static + 3 dynamic)                                            | 5     | `tasks-page:card.{created,due}`; `assignments:{priority,status,work_item}.`                                      |
| TaskDetail (19 static + 3 dynamic + 1 repoint)                             | 23    | `tasks-page:detail.*`; `assignments:work_item.`                                                                  |
| AddContributorDialog (8 static + 2 dynamic)                                | 10    | `tasks-page:contributors.*`, incl. `contributorRole` → `contributors.roleLabel` (string/prefix clash, ledger §3) |
| ContributorsList (2 static + 1 dynamic)                                    | 3     | `tasks-page:contributors.*`                                                                                      |
| TaskDetailPage                                                             | 5     | `tasks-page:page.*`                                                                                              |
| AgingIndicator                                                             | 4     | `assignments:waitingQueue.aging.*`, `assignments:waitingQueue.days`                                              |
| AssignmentDetailsModal (15 + 3 dynamic + `common:unknown` + `days` + §3.1) | 21    | `assignments:waitingQueue.{assignmentDetails,status,priority,entityType,days}.*`; `common:unknown`               |
| EscalationDialog                                                           | 21    | `assignments:waitingQueue.{escalation,assignmentDetails,days}.*`                                                 |
| ReminderButton                                                             | 22    | `assignments:waitingQueue.reminder.*`                                                                            |
| WaitingQueue                                                               | 21    | `assignments:waiting.*`, `assignments:waitingQueue.relatedTo`                                                    |
| CommitmentEditor (6 raw + 3 dynamic + 2 interpolation)                     | 11    | `commitments:form.*`, `commitments:{trackingMode,priority,status}.`, `commitments:card.{item,aiConfidence}`      |

**Second arguments are byte-identical to the base outside the eleven dynamic sites** (D-24/D-25):
each dynamic carrier dropped **only** its variable second argument, and only at those sites. The
now-dead `getRoleDescription()` helper in `AddContributorDialog.tsx` went with the argument it fed.

### 1.1 §3.1 — the pre-existing key collision, split

`AssignmentDetailsModal.tsx` bound two different sentences to
`waitingQueue.assignmentDetails.description`: the `AdaptiveDialog` `description` prop (line 152,
"View complete details for assignment …") and the section heading (line 232, "Description"). Both
were unresolved at base, so each rendered its own default and the collision was invisible;
resolving them would have collapsed both onto one string. The dialog description took the key
99-12 authored for it, `assignments:waitingQueue.assignmentDetails.dialogDescription`. Both second
arguments are byte-identical to base.

### 1.2 §3.2 — the three sites whose resolved copy dropped the caller's interpolation

| Site                     | Was                                                | Rendered       | Now                                                         |
| ------------------------ | -------------------------------------------------- | -------------- | ----------------------------------------------------------- |
| CommitmentEditor.tsx:115 | `t('afterActions.commitments.item', { number })`   | `"Commitment"` | `commitments:card.item` = `"Commitment {{number}}"`         |
| CommitmentEditor.tsx:133 | `t('afterActions.confidence', { value })`          | `"Confidence"` | `commitments:card.aiConfidence` = `"{{value}}% confidence"` |
| EscalationDialog.tsx:223 | `t('waitingQueue.agingIndicator.days', { count })` | `"8 8 day"`    | `assignments:waitingQueue.days` = `"days"` → `"8 days"`     |

### 1.3 One object clash repointed (`30f36adb7`)

`TaskDetail.tsx:324` read `t('contributors', 'Contributors')`, which resolves at the flattened
`common` root to an **object** (`{add_failed, added, added_success, remove_failed, removed,
removed_success}`) — a live type clash of D-12's class in a granted file. Repointed to
`tasks-page:detail.contributors` = `"Contributors"`, **byte-identical to the mask literal**, using
the leaf 99-12 authored for exactly this site. Nothing authored.

### 1.4 Measured: the namespace move changed no rendered copy where the key already resolved

Every already-resolving site that moved namespace was diffed old-value vs new-value in **both**
locales (34 key pairs, 68 comparisons). All twenty waiting-queue pairs
(`waitingQueue.assignmentDetails.*`, `waitingQueue.escalation.*`) are **byte-identical between
`common` and `assignments`** — the prefixing is pure re-binding. The sixteen comparisons that do
differ are all the ruled repairs, not drift:

- `card.item` gains `{{number}}` and `commitments:trackingMode.*` exists at all (§3.2 / §8: the
  `common` `tracking.*` subtree is **absent in both locales**, so those badges shipped raw keys);
- `commitments:priority.urgent`, `status.cancelled`, `status.overdue` exist while the `common`
  `priorities`/`statuses` subtrees are under-populated against `aa_priority` (4) and
  `aa_commitment_status` (5) — the D-27 atomic-enum-unit repair, ledger §8;
- three `ar` priority members and `ar status.pending` take the authored `commitments:` wording,
  which agrees grammatically with the singular noun the enums qualify.

### 1.5 Mask byte-identity audit, and the three literals deliberately left stale

`125` two-arg literal sites checked against their resolved `en` value; **3** are not byte-identical,
and all three were **already** stale at base (they resolved to the same string through `common`
then, so nothing rendered differently):

| Site                                    | Mask literal                           | Resolved value                            | Left because                                                                          |
| --------------------------------------- | -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `AddContributorDialog.tsx:278`          | `Optional`                             | `common:optional` = `(optional)`          | `common` copy; the site renders `((optional))` — a pre-existing `common`-owner defect |
| `EscalationDialog.tsx:239`              | `No manager configured for {{user}} …` | `Could not find a manager for {{user}} …` | resolved copy, same in `common` and `assignments`; changing the literal violates D-24 |
| `EscalationDialog.tsx:329` (aria-label) | `Reason`                               | `Reason (Optional)`                       | same; the visible label at :316 already carries the byte-identical literal            |

Editing a second argument would break the intact 125-mask population the D-24 step-3 deletion lane
inherits, so they stay and are named instead (§7).

---

## 2. The banner (D-32 / D-18) — absence + presence

Three status-ternary sentences in `frontend/src/routes/_protected/positions/$id/index.tsx` replaced
by `t()` onto the keys 99-12 authored in **both** locales at
`positions:readOnlyBanner.{under_review,approved,published}`. The route already binds
`useTranslation('positions')`; only the key argument is new.

**Absence:** `grep -c "Read Only" 'frontend/src/routes/_protected/positions/$id/index.tsx'` → `0`
(was `3`).
**Presence:**

```
59:                  t('positions:readOnlyBanner.under_review')}
60:                {position.status === 'approved' && t('positions:readOnlyBanner.approved')}
62:                  t('positions:readOnlyBanner.published')}
```

The draft-mode sentence is **not** converted: `positions:draftBanner` does not exist in either
locale, and this task authors nothing. Named for the positions-copy owner in §7.

`grep -c "[٠-٩۰-۹]"` over the four `ar` lane bundles → `0` everywhere (D-31 holds; nothing authored
here anyway).

```
assignments  en=392 ar=396 EN-only:[] AR-extra=4
positions    en=367 ar=367 EN-only:[] AR-extra=0
tasks-page   en=113 ar=113 EN-only:[] AR-extra=0
commitments  en=126 ar=126 EN-only:[] AR-extra=0
```

Zero EN-only leaves — D-25 holds; the 4 AR-extra are the pre-existing ones D-25 records.

---

## 3. `tests/setup.ts` — the cutover, and nothing else

The 287-line hand-maintained key→string map returned
`translations[key] ?? translations[key.replace(':','.')] ?? defaultValue ?? key`. Deleted whole and
replaced by **one import**:

```ts
import i18n from '../src/i18n'
```

`src/i18n/index.ts` is the app's only resource loader, so tests now get the production namespaces,
the production `resources` object, the `translation` → `common` alias (`translation: enCommon` /
`arCommon`, lines 274 / 410) and the same fallback config (`fallbackLng: 'en'`, no `fallbackNS`, no
`defaultNS`). **No fallback hack, no key-echo shim, no exact-key exemption of any kind**, and both
att-1 pins are gone with the map — `'validation.required': 'Required'` and
`smart-input:select.clear`'s exemption-by-omission.

**One addition beyond the import**, and it is not a fallback: a `beforeEach` restoring the boot
language. The i18next instance is a module singleton and `LanguageProvider` calls `changeLanguage`
whenever it finds `id.locale`, so without the reset one test's
`localStorage.setItem('id.locale','ar')` decides the locale of every test after it in the same file.
A browser re-runs detection on every page load; this makes each test start where the app starts.

Every colon-form `t()` this task introduces now resolves through that real instance — the scoped
audit's zero is measured against the same bundles the app ships, and the two zero-run suites'
oracle (§5.4) proves the real instance is what the suites load.

---

## 4. Every test-side retarget — values-tracking only

Each edit moves an assertion to the authored `en` value at the **same query and the same matcher
shape**. No assertion deleted, loosened, made shape-insensitive, or pointed at a test-only fixture.
Exact strings stayed exact strings; regexes stayed regexes; `getByRole` stayed `getByRole`.

### 4.1 The eight granted files (values-tracking rule)

| File                                                                | Query                                                   | Old assertion                                | New assertion                                                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/component/AssignmentDetailsModal.test.tsx`                   | `getByTestId('assignment-status')).toHaveTextContent`   | `'pending'`                                  | `'Pending'`                                                                                                                           |
| "                                                                   | `getByTestId('assignment-priority')).toHaveTextContent` | `'high'`                                     | `'High'`                                                                                                                              |
| `tests/component/ReminderButton.test.tsx`                           | `toHaveTextContent`                                     | `/follow up/i`                               | `/send reminder/i`                                                                                                                    |
| `tests/component/EscalationDialog.test.tsx`                         | `getByText`                                             | `/No manager configured for Test Assignee/i` | `/Could not find a manager for Test Assignee/i`                                                                                       |
| `tests/component/CommitmentList.test.tsx`                           | `getByText`                                             | `'No commitments yet'`                       | `'No commitments recorded'`                                                                                                           |
| "                                                                   | `getAllByRole/queryAllByRole('button', { name })` ×2    | `'Remove commitment'`                        | `'Delete commitment'`                                                                                                                 |
| `src/components/forms/__tests__/SearchableSelect.a11y.test.tsx`     | `getByRole('button', { name })`                         | `'smart-input:select.clear'`                 | `'Clear selection'`                                                                                                                   |
| "                                                                   | `toHaveAttribute('aria-label', …)`                      | `'common:validation.required'`               | `'Required field'`                                                                                                                    |
| `tests/component/TaskCard.test.tsx`                                 | —                                                       | —                                            | **no edit needed** — 32/32 pass                                                                                                       |
| `tests/component/ContributorsList.test.tsx`                         | —                                                       | —                                            | **no edit needed** — `contributors.role.*` is authored lowercase (`helper`/`reviewer`/`advisor`); the component supplies `capitalize` |
| `src/components/after-actions/__tests__/AfterActionsTable.test.tsx` | —                                                       | —                                            | **no edit needed** — errored at collection at base, now runs green                                                                    |

The a11y file renders `en`, so both its retargets take the `en` bundle values; its two stale
comments ("(raw-key) accessible name", "resolves to the raw key") were corrected in place because
they asserted the opposite of the new instrument. It has no other edit.

### 4.2 The thirteen collateral suites — ledger §0.1 / §0.2 remedy column only

| File (ledger row)                                                              | Old assertion (deleted map's copy)                                                            | New assertion (authored bundle value)                                                                                                                       | n   |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `tests/component/AfterActionForm.test.tsx` (§0.1 AfterActionForm)              | `'After-Action Record'`                                                                       | `'After Action Details'` (`common:afterActions.form.title`)                                                                                                 | 1   |
| "                                                                              | `'Enter attendee names (comma-separated)'`                                                    | `'Type a name and press Enter'` (`.attendeesPlaceholder`)                                                                                                   | 13  |
| "                                                                              | `/Enter names separated by commas/`                                                           | `/Add attendees one at a time/` (`.attendeesHelp`)                                                                                                          | 4   |
| "                                                                              | `'This record contains sensitive information'`                                                | `'This record is marked as confidential and will have restricted access'` (`.confidentialWarning`)                                                          | 2   |
| "                                                                              | `'Add at least one attendee and one outcome (decision/commitment/risk/follow-up) to publish'` | `'Add at least one decision, commitment, risk, or follow-up action to publish'` (`.publishRequirements`)                                                    | 1   |
| "                                                                              | `'Enter any additional notes'`                                                                | `'Add any additional notes or context'` (`.notesPlaceholder`)                                                                                               | 4   |
| `tests/component/DecisionList.test.tsx` (§0.1 DecisionList)                    | `'No decisions yet'`                                                                          | `'No decisions recorded'` (`common:afterActions.decisions.empty`)                                                                                           | 1   |
| "                                                                              | `'Remove decision'`                                                                           | `'Delete decision'` (`.decisions.delete`)                                                                                                                   | 3   |
| " — **the two interpolation rows**                                             | `'Decision 1'`, `'80% confidence'`                                                            | **unchanged**: they now pass against 99-22's repaired `decisions.item` = `"Decision {{number}}"` and `confidence` = `"{{value}}% confidence"`               | 0   |
| `tests/component/BulkActionToolbar.test.tsx` (§0.1 BulkActionToolbar)          | `getByText('5 items selected')`                                                               | `getByText('5 selected')` (`waitingQueue.bulkActions.selectedCount`)                                                                                        | 1   |
| "                                                                              | `getByText('Max 100 items')`                                                                  | `getByText('(max 100)')` (`.maxItems`)                                                                                                                      | 1   |
| "                                                                              | `getByText('Sending...')`                                                                     | `getByText('Sending reminders...')` (`.sending`)                                                                                                            | 1   |
| "                                                                              | `getByText('Clear Selection')).toHaveClass('ms-2')`                                           | `getByText('Clear')).toHaveClass('ms-2')` — the span renders `.clear`, not `.clearSelection` (which is the button's `aria-label`, still asserted unchanged) | 1   |
| `tests/accessibility/waiting-queue-a11y.test.tsx` (§0.1 waiting-queue-a11y)    | `toHaveTextContent('3 items selected')`                                                       | `toHaveTextContent('3 selected')`                                                                                                                           | 1   |
| `tests/unit/FormInput.test.tsx` (§0.1 FormInput)                               | `toHaveAttribute('aria-label', 'Required')`                                                   | `'Required field'` (`common:validation.required` — the att-1 pin, now unpinned)                                                                             | 1   |
| "                                                                              | `getByText('Required')`                                                                       | `getByText('Required field')`                                                                                                                               | 2   |
| `tests/component/FilterPanel.test.tsx` (§0.1 FilterPanel)                      | `getByText('Type')`                                                                           | `getByText('Work Item Type')` (`waitingQueue.filters.type`)                                                                                                 | 1   |
| "                                                                              | `'2 filters applied'`                                                                         | `'2 filters active'` (`waitingQueue.filters.active`)                                                                                                        | 2   |
| "                                                                              | `getByRole('button', { name: /clear filters/i })`                                             | `/clear all/i` — the button renders `filters.clearAll` = `"Clear All"`                                                                                      | 1   |
| `tests/component/SLAIndicator.test.tsx` (§0.1 SLAIndicator)                    | `getByText('Deadline')`                                                                       | `getByText('SLA Deadline')` (`common:tasks.sla.deadline`)                                                                                                   | 1   |
| " — **the approaching row**                                                    | amber approaching status                                                                      | **unchanged**: passes against 99-22's authored `common:tasks.sla.approaching` = `"Approaching"`                                                             | 0   |
| `tests/component/BriefGenerationPanel.manual.test.tsx` (§0.1)                  | `'Brief saved successfully!'`                                                                 | `'Brief saved successfully'` (`ai-brief:fallback.saved`) — the one-character retarget                                                                       | 2   |
| `src/components/FirstRun/FirstRunModal.test.tsx` (§0.1)                        | the RAW KEY `'firstRun.successTitle'`                                                         | `'Sample data ready'` (`sample-data:firstRun.successTitle`)                                                                                                 | 1   |
| `src/components/settings/__tests__/SettingsLayout.test.tsx` (§0.1)             | the RAW KEY `'nav.accessAndSecurity'`                                                         | `'Access & Security'` (`settings:nav.accessAndSecurity`)                                                                                                    | 1   |
| `src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx` (§0.1) | RAW KEYS `'cta.close'`, `'error.load_failed_heading'`, `'error.retry'`                        | `'Close dossier'`, `'Could not load this dossier'`, `'Retry'` (`dossier-drawer:`)                                                                           | 4   |
| `src/components/list-page/__tests__/EngagementsList.test.tsx` (§0.2)           | —                                                                                             | **no edit** — see §4.3                                                                                                                                      | 0   |
| `src/pages/engagements/__tests__/EngagementsListPage.test.tsx` (§0.2)          | —                                                                                             | **no edit** — see §4.3                                                                                                                                      | 0   |

The `BulkActionToolbar`/`FilterPanel`/`AfterActionForm` rows marked with a bundle key beyond the
ledger's cell (`.maxItems`, `.clear`, `.clearAll`, `.notesPlaceholder`) are assertions in the
**same tests** the ledger names, which the ledger could not see because Testing Library aborts a
test at its first failing query. They are the same values-tracking remedy at the same query and
shape, on the same ledger row.

### 4.3 The two §0.2 zero-run suites — KEEP-TRUE regression guard, nothing to restore

RULING-P99-166 granted P99-20 the mock repairs and P99-20 landed them: `EngagementsList.test.tsx`
already carries a **complete** per-file `react-i18next` factory (it exports `initReactI18next`,
which is what threw at collection), and `EngagementsListPage.test.tsx`'s `@tanstack/react-router`
mock already exports the `Link` its page renders at line 295. Both files therefore collect and pass
at this task's base **by design**, and this task's job on them is the negative one the acceptance
item states: the `setup.ts` cutover must not re-break them, and no value inside them needed
retargeting. **Neither file was edited.** A green here proves no regression; it never proves this
task did the restoring.

---

## 5. Oracles, verbatim

### 5.1 Oracle 1 — scoped strict-audit zero (both classes, both locales)

The plan's exact command (JSON + exit-code gate) run unmodified: **`ORACLE1_EXIT=0`**.
Human-readable form in §0.1. RED at base: `91/127` + `8/61` unresolved, i.e. the exit gate's
`twoArgUnresolved !== 0` branch.

### 5.2 Oracle 2 — the three rendered banner tests

Count gate first (list reporter; `playwright.config.ts` switches to `blob`/`github` when `CI` is
set, which suppresses the `Total:` line — the count was read with `CI` unset, exactly as the
ledger's §5.2 evidence was):

```
Listing tests:
  [chromium-en] › 99-ar03-leak.spec.ts:221:5 › UI99-C7 ar banner under_review
  [chromium-en] › 99-ar03-leak.spec.ts:225:5 › UI99-C7 ar banner approved
  [chromium-en] › 99-ar03-leak.spec.ts:229:5 › UI99-C7 ar banner published
Total: 3 tests in 1 file
```

**RED proved by execution in this worktree**, with only the route file reverted to `f8dfc90c7`
(`grep -c "Read Only"` → `3`) and everything else in place, so the failure is attributable to the
banner and nothing else:

```
pw-run-reaped: playwright exited code=1 signal=null; … session reaped; verdict clean; report published
{"expected":0,"skipped":0,"unexpected":3,"flaky":0}
UI99-C7 ar banner under_review :: unexpected :: Error: UI99-C7 under_review banner must contain Arabic script
UI99-C7 ar banner approved     :: unexpected :: Error: UI99-C7 approved banner must contain Arabic script
UI99-C7 ar banner published    :: unexpected :: Error: UI99-C7 published banner must contain Arabic script
```

**GREEN with the fix**, at the final tree:

```
pw-run-reaped: playwright exited code=0 signal=null; group 41928 -> {"termed":false,"killed":false,"alreadyGone":true,"unavailable":false,"identityMismatch":false,"finalZero":true}; session reaped; verdict clean; report published
{"startTime":"2026-08-25T16:24:38.136Z","duration":16487.831,"expected":3,"skipped":0,"unexpected":0,"flaky":0}
UI99-C7 ar banner under_review :: expected
UI99-C7 ar banner approved     :: expected
UI99-C7 ar banner published    :: expected
```

The fixture seeded all three ruled statuses; a missing position would have been a fixture failure
(`toBeVisible` on `p.text-xs.font-bold.text-foreground`), never a skip — `skipped: 0` in both runs.

### 5.3 neg-taskcard — the negative control is still undefused

`node scripts/neg-taskcard.mjs "$PWD"`, **after** the TaskCard repair, at the final tree:

```
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
```

**3× `MISS=true`**, asserted by text and not by exit code. `scripts/neg-taskcard.mjs` was **not
edited** — it is absent from `git diff --name-only f8dfc90c7 HEAD`. It stays discriminating
precisely because the repair colon-bound TaskCard to `assignments:` instead of authoring
`priority`/`status`/`work_item` into `common.json`, which this task never touched. Its own §2
warning ("whoever repairs TaskCard must re-point this probe") does not fire: the probe still
measures genuinely broken routing.

### 5.4 Oracle 4 — the two formerly zero-run suites (KEEP-TRUE)

```
 Test Files  2 passed (2)
      Tests  18 passed (18)
COUNT 18
ORACLE4_PASS
```

Exactly 2 test files, 18 executed tests (≥ 18), exit 0 — **after** the `setup.ts` cutover. Declared
as a keep-true regression guard per P99-24 discipline (see §4.3).

---

## 6. Whole-suite state, and why the residual red is not this task's

```
Test Files 606   total 1680   passed 1630   failed 24
```

The 24 are the ledger's named **pre-existing** wider FAIL list and nothing else:

```
2  src/components/layout/AppShell.a11y.test.tsx
4  src/components/layout/AppShell.test.tsx
3  src/components/layout/Sidebar.test.tsx
3  src/routes/_protected/dossiers/countries/__tests__/CountriesListPage.test.tsx
3  src/routes/_protected/dossiers/forums/__tests__/ForumsListPage.test.tsx
3  src/routes/_protected/dossiers/organizations/__tests__/OrganizationsListPage.test.tsx
3  src/routes/_protected/dossiers/topics/__tests__/TopicsListPage.test.tsx
3  src/routes/_protected/dossiers/working_groups/__tests__/WorkingGroupsListPage.test.tsx
```

**Measured, not asserted.** With the whole tree reverted to `f8dfc90c7` those same eight files
produce the same count:

```
 Test Files  8 failed (8)
      Tests  24 failed (24)
```

All eight are outside `files_modified` and untouched. Against the ledger's own numbers the
instrument cutover moved the suite from `baseline 1529/1596 (41 failed)` and
`after 1576/1680 (78 failed)` to **1630/1680 (24 failed)**: the 54 collateral assertions are gone
and 84 previously zero-run tests still run.

`pnpm exec tsc --noEmit` → exit 0. `pnpm --filter intake-frontend lint` → eslint
`--max-warnings 0` clean plus all four project checks OK, including
`i18n namespace check OK: 1716 file(s) scanned, 803 static namespace literal(s) checked against 128 registered namespaces`.

---

## 7. Left with its named owner

Nothing was authored here, so every copy defect the honest instrument exposes is handed on by name.

**To the `common`-owner lane (99-06):**

- `common:optional` is `"(optional)"`, so `AddContributorDialog.tsx:278` renders `((optional))`.
  Pre-existing; the mask literal stays `'Optional'` because D-24 owns the second arguments.
- `common:afterActions.commitments.tracking.*` is **absent in both locales**;
  `.priorities` (3 members vs `aa_priority`'s 4) and `.statuses` (3 vs `aa_commitment_status`'s 5)
  are under-populated. CommitmentEditor is repointed at the complete `commitments:` enums, so those
  `common` subtrees are now orphaned but remain live for any other consumer.
- `common:afterActions.decisions.item` / `common:afterActions.confidence` carry their interpolation
  again after 99-22, but **`DecisionList.tsx` / `DecisionEditor.tsx` still bind through `common`**
  and are outside this allowlist.
- `common:contributors` is an OBJECT at the flattened root; `TaskDetail` no longer reads it (§1.3),
  but any other `t('contributors')` consumer still hits the clash.
- `common:days` (weekday-name object), `common:waitingQueue.reminder.{noAssignee,success,error}`
  (scalars addressed as objects) and `WorkItemLinker.tsx`'s 8 raw-key `common` sites are unchanged
  from the ledger §8 handoff.

**To the positions-copy owner:** `positions:draftBanner` does not exist in either locale, so the
draft-mode sentence in the `$id` index route is still a hardcoded English literal. It is not one of
the three ruled read-only sentences and this task authors nothing; a banner is only fully
Arabic-capable once that fourth branch has a key.

**To the D-24 step-3 deletion lane:** the mask population it inherits is intact — 125 two-arg
literal sites, 0 unresolved, every second argument byte-identical to `f8dfc90c7` outside the eleven
dynamic sites.

**To the stale-comment sweep:** `src/components/list-page/__tests__/EngagementsList.test.tsx:5`
still says "global mock has afterActions-only map". There is no global mock any more. The file was
deliberately not edited (§4.3, keep-true guard).

**Not edited, by constraint:** `scripts/neg-taskcard.mjs`, every `frontend/src/i18n/**` bundle,
`StepUpMFA.tsx`, and every path outside `files_modified`.

---

## 8. Diff size against the scoped cap (RULING-P99-163(5))

```
git diff f8dfc90c7 HEAD -- . ':(exclude).planning' | wc -c   →   109139
git diff --numstat …                                          →   added 287, deleted 512
```

**109,139 non-`.planning` bytes** — over the default `100000` and inside the **125000** scoped
`gates.diffCap` grant the plan's DIFF-CAP NOTE names for this task only, to be restored at its
terminal. The bulk is the 287-line key-echo map deleted from `tests/setup.ts`.

Part of the count is the project formatter, not new intent: the repo's `pre-commit` hook runs
`lint-staged` (`eslint --fix` + `prettier --write`) over every staged `frontend/**/*.{ts,tsx}`, so
the longer colon-form key arguments reflowed their JSX lines. Those reflow hunks carry no semantic
change, and no formatting was performed by hand.

`git diff --name-only f8dfc90c7 HEAD` lists **29 files, all inside `files_modified`**: the 12
source files, `tests/setup.ts`, the 5 edited granted tests, and the 11 edited collateral tests.
No bundle, no script, no exogenous path.

---

## 9. Every command this task ran

```
node scripts/i18n-audit-strict.mjs "$PWD" --scope "<the eleven lane files>"                     # before / after
node scripts/i18n-audit-strict.mjs "$PWD" --scope "<the eleven lane files>" --json | node -e '<exit gate>'
python3 scripts/partA_maskfinder.py "$PWD" --control                                            # control FIRST
python3 scripts/partA_maskfinder.py "$PWD"                                                      # before / after
node scripts/neg-taskcard.mjs "$PWD"                                                            # after the repair
grep -c "Read Only" 'frontend/src/routes/_protected/positions/$id/index.tsx'                    # 3 -> 0
grep -n "t('positions:" 'frontend/src/routes/_protected/positions/$id/index.tsx'                # presence
grep -c "[٠-٩۰-۹]" frontend/src/i18n/ar/{assignments,positions,tasks-page,commitments}.json     # 0 everywhere
pnpm exec playwright test tests/e2e/99-ar03-leak.spec.ts -g "UI99-C7 ar banner" --project=chromium-en --no-deps --list
node scripts/pw-run-reaped.mjs -- tests/e2e/99-ar03-leak.spec.ts -g "UI99-C7 ar banner" --project=chromium-en --no-deps   # RED, then GREEN
pnpm exec vitest run src/components/list-page/__tests__/EngagementsList.test.tsx src/pages/engagements/__tests__/EngagementsListPage.test.tsx
pnpm exec vitest run                                                                            # base / after each stage / final
pnpm exec tsc --noEmit
pnpm --filter intake-frontend lint
```
