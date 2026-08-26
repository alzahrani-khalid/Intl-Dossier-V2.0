# P99-30 Summary — AR-04a gatekeeper STOP

## Outcome

**RED. No deletion lane is reachable.** At
`aefd383247e5479a04b99f73c5e9740577fbd68e`, the unscoped canonical strict audit walked 1,714
TypeScript files and a nonzero `twoArgTotal` of 2,074, but re-derived 31 unresolved mask sites and
47 unresolved raw-key sites in **each** locale. D-24 therefore stops the phase before P99-31–38.
This task changed no source, locale JSON, test, backend, Supabase, or script file and deleted no
default.

The other instruments discriminate and are green: the dynamic-prefix control ran before a live
zero, the resolution harness reports zero misses, and the independent negative control still
prints three `MISS=true` lines. Those greens do not override the strict audit's nonzero result.

This is the required finding for the overseer, not a silent pass. The struck plan-time figure 473
is not reused: the destructive population was re-derived under `scripts/lib/i18n-binding.mjs` and
is nonempty at 31 mask sites, all missing in both locales. Removing any of those defaults now would
turn the same miss into a raw-key render in English and Arabic while making the deletion grep
greener.

## 1. Ordered gate evidence

### 1.1 Unscoped strict audit — RED

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/i18n-audit-strict.mjs" "$R" --json
```

Verbatim top-level output (the emitted `sites` array is transcribed site by site in §2):

```text
"scannedFiles": 1714
"scope": []
"locales": ["en", "ar"]
"candidateModel.resolver": "scripts/lib/i18n-binding.mjs"
"candidateModel.fallbackNS": null
"candidateModel.defaultNS": null
"bindingModel.measuredSyntaxFiles": 667
"bindingModel.arrayFirstOnlyFiles": 47
"bindingModel.bareUnmatchedFiles": 110
"bindingModel.defectiveShapeFiles": 157
"bindingModel.canonicalParsedFiles": 664
"bindingModel.canonicalStringFiles": 515
"bindingModel.canonicalArrayFiles": 46
"bindingModel.canonicalBareFiles": 110
"twoArgTotal": 2074
"literalTwoArgTotal": 1760
"optionsDefaultTotal": 314
"rawKeyTotal": 6503
"nonKeyTotal": 0
"twoArgUnresolved": 31
"literalTwoArgUnresolved": 14
"optionsDefaultUnresolved": 17
"rawKeyUnresolved": 47
"twoArgUnresolvedEn": 31
"rawKeyUnresolvedEn": 47
"twoArgUnresolvedAr": 31
"rawKeyUnresolvedAr": 47
"twoArgDistinct": 29
"rawKeyDistinct": 41
"looseModelDelta.twoArgHiddenSites": 0
"looseModelDelta.literalTwoArgHiddenSites": 0
"looseModelDelta.rawKeyHiddenSites": 3
"looseModelDelta.twoArgRescuedByAlias": 2
"looseModelDelta.rawKeyRescuedByAlias": 0
"defectiveBindingDelta.twoArgSitesReclassified": 1
"defectiveBindingDelta.rawKeySitesReclassified": 35
```

The plan's exact conjunction stops on its first clause. Verbatim output and status:

```text
unresolved sites survive {"root":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260826-160417-0000000000000043--P99-30","scannedRoot":"/Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/.tickmarkr/worktrees.noindex/tickmarkr-run-20260826-160417-0000000000000043--P99-30/frontend/src","scannedFiles":1714,"scope":[],"locales":["en","ar"],"candidateModel":{
EXIT_CODE=1
```

### 1.2 Dynamic-prefix control, then live run

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R" --control
```

Verbatim output:

```text
CONTROL resolves(intelligence-signals, "severity") = True (expect True)
CONTROL resolves(common, "waitingQueue.statuses")  = True (expect True)
CONTROL resolves(common, "waitingQueue.status")    = False (expect False)
CONTROL resolves(common, "waitingQueue.priority")  = False (expect False)
EXIT_CODE=0
```

Only after that control, the live command ran:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; python3 "$R/scripts/partA_maskfinder.py" "$R"
```

Verbatim output:

```text
UNRESOLVED dynamic t() key prefixes: 0 total  (0 mask a raw value -> criterion 1; 0 render a RAW KEY -> criterion 2)
EXIT_CODE=0
```

### 1.3 Resolution harness

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/resolve-check.mjs" "$R"
```

Verbatim output:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙

===== locale en (fallbackLng disabled, so an en miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

===== locale ar (fallbackLng disabled, so an ar miss cannot borrow en) =====
  OK    SignalRow.tsx:84                     ns=intelligence-signals  4/4 resolve
  OK    KanbanTaskCard.tsx:71                ns=assignments           4/4 resolve
  OK    ActivityTimelineSection.tsx:221      ns=dossier-overview      22/22 resolve
  OK    AssignmentDetailsModal.tsx:276       ns=translation           15/15 resolve
  OK    TaskDetail.tsx:261                   ns=translation           10/10 resolve
  OK    MiniRelationshipGraph.tsx:266,374    ns=graph                 18/18 resolve
  OK    EnhancedGraphVisualization:623,808   ns=graph                 18/18 resolve
  OK    AlertRuleForm.tsx:237                ns=intelligence-alerts   7/7 resolve
  OK    EngagementsList.tsx:171 (type)       ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:174 (status)     ns=engagements           4/4 resolve
  OK    EngagementsList.tsx:145 (prefix)     ns=engagements           1/1 resolve

CONTROL negative: t('sourceType.__not_a_real_member__') -> "sourceType.__not_a_real_member__" ; detected-as-miss=true
CONTROL positive: t('sourceType.human_entered') -> "Human entered" ; detected-as-miss=false

214 lookups across 11 routings x 2 locales — routings with a miss: 0
EXIT_CODE=0
```

### 1.4 Phase negative control

Command:

```sh
PATH="/opt/homebrew/bin:$PATH"; R="$PWD"; node "$R/scripts/neg-taskcard.mjs" "$R"
```

Verbatim output; the verdict is the three text matches, not exit status:

```text
🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
  TaskCard t('priority.low') ns=translation -> "priority.low"  MISS=true
  TaskCard t('status.in_progress') ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task') ns=translation -> "work_item.task"  MISS=true
  (for contrast, the family that DOES hold these:)
  t('priority.low') ns=assignments -> "Low"
EXIT_CODE=0
```

## 2. Strict residue register

Every row below is missing in both locales (`EN=MISS AR=MISS`). A deletion consumer is named for
each mask site from the file-disjoint P99-31–38 manifest, but that consumer is **not** authorized
to repair the miss or delete the default. There is no unfinished upstream correction node in the
current DAG, so the correction owner is `UNASSIGNED / overseer recut required`.

### 2.1 AR-04a mask residue — 31 sites / 19 files

| Planned deletion consumer | Shape                      | Site                                                                            | Key                              |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------- | -------------------------------- |
| P99-31                    | options-default            | `frontend/src/components/ai/ChatInput.tsx:90`                                   | `sendMessage`                    |
| P99-31                    | options-default            | `frontend/src/components/bulk-actions/SelectableDataTable.tsx:251`              | `accessibility.cardView`         |
| P99-31                    | options-default            | `frontend/src/components/bulk-actions/SelectableDataTable.tsx:260`              | `accessibility.tableView`        |
| P99-31                    | options-default            | `frontend/src/components/copilot/CopilotMessageList.tsx:145`                    | `roleYou`                        |
| P99-31                    | options-default            | `frontend/src/components/copilot/ThreadList.tsx:31`                             | `thread.untitled`                |
| P99-31                    | options-default            | `frontend/src/components/copilot/ThreadList.tsx:39`                             | `archive.action`                 |
| P99-31                    | options-default            | `frontend/src/components/copilot/ThreadList.tsx:56`                             | `thread.new`                     |
| P99-31                    | options-default            | `frontend/src/components/copilot/ThreadList.tsx:60`                             | `thread.new`                     |
| P99-31                    | options-default            | `frontend/src/components/dossier/DossierShell.tsx:253`                          | `action.edit`                    |
| P99-31                    | options-default            | `frontend/src/components/dossier/DossierShell.tsx:275`                          | `action.export`                  |
| P99-31                    | two-arg literal            | `frontend/src/components/dossier/MiniRelationshipGraph.tsx:625`                 | `retry`                          |
| P99-31                    | options-default            | `frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts:128`    | `form-wizard:postCreateWarning`  |
| P99-32                    | two-arg literal            | `frontend/src/components/intake-form/IntakeForm.tsx:373`                        | `form.dossier.hint`              |
| P99-32                    | two-arg literal            | `frontend/src/components/intake-form/IntakeForm.tsx:380`                        | `form.dossier.linkedTo`          |
| P99-33                    | options-default            | `frontend/src/components/list-page/PersonsGrid.tsx:100`                         | `chip.vip`                       |
| P99-33                    | two-arg literal            | `frontend/src/components/relationships/AdvancedGraphVisualization.tsx:865`      | `playback.skipToStart`           |
| P99-33                    | two-arg literal            | `frontend/src/components/relationships/AdvancedGraphVisualization.tsx:875`      | `playback.pause`                 |
| P99-33                    | two-arg literal            | `frontend/src/components/relationships/AdvancedGraphVisualization.tsx:875`      | `playback.play`                  |
| P99-33                    | two-arg literal            | `frontend/src/components/relationships/AdvancedGraphVisualization.tsx:888`      | `playback.skipToEnd`             |
| P99-34                    | options-default            | `frontend/src/components/report-builder/ColumnBuilder.tsx:96`                   | `columns.toggleVisibility`       |
| P99-34                    | two-arg literal            | `frontend/src/components/type-specific-fields/TypeSpecificFields.tsx:32`        | `typeSpecific.engagement.title`  |
| P99-34                    | two-arg literal            | `frontend/src/components/type-specific-fields/TypeSpecificFields.tsx:133`       | `typeSpecific.position.title`    |
| P99-34                    | two-arg literal            | `frontend/src/components/type-specific-fields/TypeSpecificFields.tsx:197`       | `typeSpecific.mou_action.title`  |
| P99-34                    | two-arg literal            | `frontend/src/components/type-specific-fields/TypeSpecificFields.tsx:270`       | `typeSpecific.foresight.title`   |
| P99-35                    | options-default            | `frontend/src/components/work-creation/DossierPicker.tsx:291`                   | `chip.remove`                    |
| P99-35                    | two-arg literal            | `frontend/src/components/work-creation/WorkCreationPalette.tsx:278`             | `palette.dossierRequiredGeneric` |
| P99-35                    | options-default; test mock | `frontend/src/components/work-creation/__tests__/DossierPicker.test.tsx:20`     | `chip.remove`                    |
| P99-35                    | options-default            | `frontend/src/domains/dossiers/hooks/useDossier.ts:237`                         | `create.duplicate`               |
| P99-36                    | two-arg literal            | `frontend/src/pages/dossiers/DossierListPage.tsx:675`                           | `list.resetFilters`              |
| P99-38                    | options-default            | `frontend/src/routes/_protected/dossiers/$id.overview.tsx:120`                  | `error.invalidId`                |
| P99-38                    | two-arg literal            | `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx:156` | `common.goBack`                  |

Lane split: P99-31 = 12, P99-32 = 2, P99-33 = 5, P99-34 = 5, P99-35 = 4, P99-36 = 1,
P99-37 = 0, P99-38 = 2. The shape split is 14 literal plus 17 `defaultValue` options sites.

### 2.2 AR-04b raw-key residue — 47 sites / 19 files

These are a separate population from §2.1 (D-28). The owning class is the AR-04b resolution lane,
but the current DAG has no unfinished resolution task after this gatekeeper; therefore every
non-test row is `UNASSIGNED / overseer recut required`. Test-mock rows instead belong to the
strict-instrument population-policy repair described in §4.

| Owner                          | Shape              | Site                                                                                         | Key                             |
| ------------------------------ | ------------------ | -------------------------------------------------------------------------------------------- | ------------------------------- |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/components/attachment-uploader/AttachmentUploader.tsx:380`                     | `form.attachments.fileCount`    |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/components/collaboration/ConflictResolutionDialog.tsx:252`                     | `cancel`                        |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/components/collaboration/EditingLockIndicator.tsx:268`                         | `cancel`                        |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx:107`         | `cta.close`                     |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerCtaRow.test.tsx:9`            | `cta.coming_soon`               |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerHead.test.tsx:10`             | `cta.close`                     |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx:6`         | `meta.location_fallback`        |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx:7`         | `meta.lead_prefix`              |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx:8`         | `meta.engagements_suffix`       |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx:11` | `empty.open_commitments`        |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx:21` | `section.open_commitments`      |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx:6`   | `empty.recent_activity`         |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx:14`  | `section.recent_activity`       |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/UpcomingSection.test.tsx:6`         | `empty.upcoming`                |
| instrument policy — UNASSIGNED | one-arg test mock  | `frontend/src/components/dossier/DossierDrawer/__tests__/UpcomingSection.test.tsx:11`        | `section.upcoming`              |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/intake-form/IntakeForm.tsx:487`                                     | `actions.submitting`            |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/components/scenario-sandbox/ScenarioCard.tsx:113`                              | `actions.more`                  |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/components/signals/SignalsQueue.tsx:95`                                        | `queue.count`                   |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:238`                                 | `sla.totalPaused`               |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:253`                                 | `sla.resume`                    |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:253`                                 | `sla.pause`                     |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:260`                                 | `sla.resume`                    |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:265`                                 | `sla.pause`                     |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:276`                                 | `sla.pause`                     |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:277`                                 | `sla.pauseReason`               |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:278`                                 | `sla.pauseReasonPlaceholder`    |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/components/sla-countdown/SLACountdown.tsx:281`                                 | `sla.pause`                     |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/domains/dossiers/hooks/useDossier.ts:363`                                      | `dossier.delete.success`        |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/domains/dossiers/hooks/useDossier.ts:509`                                      | `document.linkSuccess`          |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/domains/dossiers/hooks/useDossier.ts:555`                                      | `document.unlinkSuccess`        |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/dossiers/hooks/useDossier.ts:308`                                      | `dossier.update.success`        |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/dossiers/hooks/useDossier.ts:316`                                      | `dossier.update.error`          |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/dossiers/hooks/useDossier.ts:371`                                      | `dossier.delete.error`          |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/dossiers/hooks/useDossier.ts:512`                                      | `document.linkError`            |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/dossiers/hooks/useDossier.ts:558`                                      | `document.unlinkError`          |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/relationships/hooks/useRelationships.ts:128`                           | `messages.created`              |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/relationships/hooks/useRelationships.ts:131`                           | `messages.createError`          |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/relationships/hooks/useRelationships.ts:169`                           | `messages.updated`              |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/relationships/hooks/useRelationships.ts:180`                           | `messages.updateError`          |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/relationships/hooks/useRelationships.ts:216`                           | `messages.deleted`              |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/domains/relationships/hooks/useRelationships.ts:227`                           | `messages.deleteError`          |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/pages/AssignmentQueue.tsx:210`                                                 | `queue.failedAttempts`          |
| AR-04b — UNASSIGNED            | options-no-default | `frontend/src/pages/engagements/workspace/DocsTab.tsx:162`                                   | `docs.count`                    |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/routes/_protected/positions.tsx:236`                                           | `positions:type.brief`          |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/routes/_protected/positions.tsx:238`                                           | `positions:type.talking_points` |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/routes/_protected/positions.tsx:240`                                           | `positions:type.q_and_a`        |
| AR-04b — UNASSIGNED            | one-arg            | `frontend/src/routes/_protected/positions.tsx:241`                                           | `positions:type.guidance`       |

## 3. Re-derived deletion manifests — recorded separately

The manifest was derived from the strict audit's exact cross-line matchers over the same unscoped
walk. The two deletion populations are deliberately not blended with the raw-key population:

- **two-arg literal class:** `t('key', 'Default')` — **1,760 sites / 160 files**;
- **object-form fallback-text-options class:** `t('key', { defaultValue: ... })` — **314 sites /
  103 files**;
- their deletion-only union is **2,074 sites / 248 files**. This union is only a manifest total,
  not an AR-04a/AR-04b blended defect figure.

Verbatim census output:

```json
{
  "strictInstrumentPolicy": "includes *.test.* and __tests__ in both classes",
  "repoWide": {
    "scannedFiles": 1714,
    "literalTwoArg": { "sites": 1760, "files": 160 },
    "defaultValueOptions": { "sites": 314, "files": 103 },
    "union": { "sites": 2074, "files": 248 }
  },
  "productionOnly_if_tests_excluded": {
    "scannedFiles": 1532,
    "literalTwoArg": { "sites": 1760, "files": 160 },
    "defaultValueOptions": { "sites": 313, "files": 102 },
    "union": { "sites": 2073, "files": 247 }
  },
  "testOnly": {
    "scannedFiles": 182,
    "literalTwoArg": { "sites": 0, "files": 0 },
    "defaultValueOptions": { "sites": 1, "files": 1 },
    "union": { "sites": 1, "files": 1 }
  }
}
```

The current file-disjoint consumers cover the entire 2,074-site/248-file repo-wide population;
there is no unassigned deletion file. Verbatim lane split (`sites/files` per shape):

```text
99-31 literal=199/29 files defaultValue=70/19 files union=269/44 files
99-32 literal=240/24 files defaultValue=15/9 files union=255/30 files
99-33 literal=256/25 files defaultValue=38/13 files union=294/36 files
99-34 literal=290/25 files defaultValue=18/12 files union=308/35 files
99-35 literal=211/18 files defaultValue=23/12 files union=234/28 files
99-36 literal=131/11 files defaultValue=120/26 files union=251/37 files
99-37 literal=182/11 files defaultValue=10/3 files union=192/13 files
99-38 literal=251/17 files defaultValue=20/9 files union=271/25 files
EXIT_CODE=0
```

These counts replace, rather than quote, the stale 1,768/161 plan-time literal figure. They are
the manifest P99-31–38 would consume only after a later strict audit proves the destructive
population empty.

## 4. Test-file policy finding

The operative strict instrument does **not** implement the policy stated in P99-14/P99-15/P99-16
and repeated by this plan's interface. Its `walk()` includes `*.test.*` and `__tests__` in both
classes. The live population proves that behavior: 182 test files were walked; they contribute one
unresolved `defaultValue` mask and 12 unresolved raw-key mocks across seven files. Excluding tests
only as a diagnostic still leaves 30 unresolved masks / 18 files and 35 unresolved raw-key sites /
12 files, so correcting the policy alone cannot green this gate.

Verbatim split:

```json
{
  "repoWide": {
    "twoArg": { "sites": 31, "files": 19, "enMisses": 31, "arMisses": 31 },
    "rawKey": { "sites": 47, "files": 19, "enMisses": 47, "arMisses": 47 }
  },
  "productionOnly_if_tests_excluded": {
    "twoArg": { "sites": 30, "files": 18, "enMisses": 30, "arMisses": 30 },
    "rawKey": { "sites": 35, "files": 12, "enMisses": 35, "arMisses": 35 }
  },
  "testOnly": {
    "twoArg": { "sites": 1, "files": 1, "enMisses": 1, "arMisses": 1 },
    "rawKey": { "sites": 12, "files": 7, "enMisses": 12, "arMisses": 12 }
  }
}
```

An instrument-policy correction belongs in a newly scoped predecessor task because
`scripts/i18n-audit-strict.mjs` is forbidden to this verification-only node. The production
residue likewise needs newly scoped authoring/routing work in both locales. This SUMMARY does not
prescribe whether individual misses should be authored or rebound; the canonical resolver's site
list is the handoff.

## 5. D-05/D-06/D-24/D-27/D-28 boundary and untouched proof

- **Population:** the unscoped `frontend/src` TypeScript walk, both `en` and `ar`, the two literal
  mask shapes in §3, and the separate raw-key class in §2.2.
- **Outside:** dynamic nonliteral key shapes beyond maskfinder, rendering/reachability, trees
  outside `frontend/src`, wholesale working dot-to-colon conversion (D-21 / Phase 102), and every
  deletion. No later lane may infer that those are green from this static finding.
- **Controls:** `twoArgTotal=2074` and `rawKeyTotal=6503` prove the strict walk was nonempty;
  maskfinder ran both polarities before its live zero; resolve-check ran its positive and negative
  controls; neg-taskcard supplied the independent three-miss probe.
- **Order:** P99-31–38 depend on P99-30 and remain unreachable because P99-30 is RED. Nothing was
  deleted or repaired here.
- **Class separation:** 31 unresolved mask sites are AR-04a; 47 unresolved raw-key sites are
  AR-04b. The two figures are never summed into a defect population.

Before this SUMMARY was added, the required protected-tree diff command printed no path:

```sh
git diff --name-only HEAD -- frontend backend supabase tests scripts
```

```text

```

The only task path added is:

```text
.planning/phases/99-arabic-coverage/99-30-SUMMARY.md
```

## 6. Handoff

The overseer must recut predecessors for (1) the 30 production mask misses, (2) the 35 production
raw-key misses, and (3) the strict audit's test-population contract, then rerun this gate from the
beginning. P99-31–38 must remain blocked. There is no authorized in-scope change that can turn the
strict nonzeros into zero, so this verification-only task cannot satisfy its success criterion on
the current tree.
