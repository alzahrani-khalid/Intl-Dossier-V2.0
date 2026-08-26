# P99-45 Summary — production mask handoff resolved

## Outcome

GREEN. The exact production subset handed off by
`99-30-RED-HANDOFF.md` now resolves in both `en` and `ar`: 30 former misses across the named 18
production files became zero without deleting a translation call, a literal fallback, or an
options-form `defaultValue`. The scoped population remains exactly 134 masks: 109 literal
two-argument sites plus 25 options-default sites.

The work started at `4f483b91574d01e903d29c133fa2c57581e1e055`. Candidate provenance is the
human-reviewed RED candidate register preserved as `99-30-RED-HANDOFF.md`, especially §2.1's
31-site manifest and §4's production/test split. Its one `DossierPicker.test.tsx` options-default
row is test-only policy residue, so it was not reclassified as production work. Removing that row
from the reviewed 31-site register yields the exact 30-site / 18-file population owned here.

## Start-of-task RED re-derivation

The plan's exact 18-file `--scope` was run through `scripts/i18n-audit-strict.mjs --json` before any
edit. The live headline fields were:

```json
{
  "scannedFiles": 18,
  "twoArgTotal": 134,
  "literalTwoArgTotal": 109,
  "optionsDefaultTotal": 25,
  "twoArgUnresolved": 30,
  "twoArgUnresolvedEn": 30,
  "twoArgUnresolvedAr": 30
}
```

The former misses split into 14 literal two-argument sites and 16 options-default sites. There
were 29 distinct before keys because `thread.new` appeared at two sites.

## Exact before identities and resolutions

Every fallback shown below remains present at its original call. “Authored” means the named leaf
was added to both locale bundles with English equal to the preserved fallback and Arabic carrying
the same meaning. “Existing” means only the first-argument binding changed to an already-present
leaf in a namespace declared by that call or hook; the call and fallback were preserved.

|   # | Before identity                                                                                                     | Preserved fallback                                                              | Chosen resolution and both-locale value                                                                                                                            |
| --: | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   1 | `components/ai/ChatInput.tsx:90` · options-default · `sendMessage`                                                  | `Send message`                                                                  | Authored `ai-chat:sendMessage` — en `Send message`; ar `إرسال الرسالة`                                                                                             |
|   2 | `components/bulk-actions/SelectableDataTable.tsx:251` · options-default · `accessibility.cardView`                  | `Card view`                                                                     | Authored `bulk-actions:accessibility.cardView` — en `Card view`; ar `عرض البطاقات`                                                                                 |
|   3 | `components/bulk-actions/SelectableDataTable.tsx:260` · options-default · `accessibility.tableView`                 | `Table view`                                                                    | Authored `bulk-actions:accessibility.tableView` — en `Table view`; ar `عرض الجدول`                                                                                 |
|   4 | `components/copilot/CopilotMessageList.tsx:145` · options-default · `roleYou`                                       | `You`                                                                           | Authored `copilot:roleYou` — en `You`; ar `أنت`                                                                                                                    |
|   5 | `components/copilot/ThreadList.tsx:31` · options-default · `thread.untitled`                                        | `New conversation`                                                              | Authored `copilot:thread.untitled` — en `New conversation`; ar `محادثة جديدة`                                                                                      |
|   6 | `components/copilot/ThreadList.tsx:39` · options-default · `archive.action`                                         | `Archive conversation`                                                          | Authored `copilot:archive.action` — en `Archive conversation`; ar `أرشفة المحادثة`                                                                                 |
|   7 | `components/copilot/ThreadList.tsx:56` · options-default · `thread.new`                                             | `New conversation`                                                              | Authored `copilot:thread.new` — en `New conversation`; ar `محادثة جديدة`                                                                                           |
|   8 | `components/copilot/ThreadList.tsx:60` · options-default · `thread.new`                                             | `New conversation`                                                              | Same authored `copilot:thread.new` leaf as #7                                                                                                                      |
|   9 | `components/dossier/DossierShell.tsx:253` · options-default · `action.edit`                                         | `Edit`                                                                          | Existing declared `dossier:action.edit` — en `Edit`; ar `تحرير`                                                                                                    |
|  10 | `components/dossier/DossierShell.tsx:275` · options-default · `action.export`                                       | `Export`                                                                        | Existing declared `dossier:action.export` — en `Export`; ar `تصدير`                                                                                                |
|  11 | `components/dossier/MiniRelationshipGraph.tsx:625` · two-arg literal · `retry`                                      | `Retry`                                                                         | Existing declared `graph:miniGraph.retry` — en `Retry`; ar `إعادة المحاولة`                                                                                        |
|  12 | `components/dossier/wizard/hooks/useCreateDossierWizard.ts:128` · options-default · `form-wizard:postCreateWarning` | `Dossier created, but some related records (e.g. participants) failed to save.` | Authored `form-wizard:postCreateWarning` — en preserves the sentence; ar `تم إنشاء الدوسيه، لكن تعذّر حفظ بعض السجلات المرتبطة (مثل المشاركين).`                   |
|  13 | `components/intake-form/IntakeForm.tsx:373` · two-arg literal · `form.dossier.hint`                                 | `Select the dossier this request relates to`                                    | Authored `intake:form.dossier.hint` — en preserves the sentence; ar `اختر الدوسيه المرتبط بهذا الطلب`                                                              |
|  14 | `components/intake-form/IntakeForm.tsx:380` · two-arg literal · `form.dossier.linkedTo`                             | `Linked to`                                                                     | Authored `intake:form.dossier.linkedTo` — en `Linked to`; ar `مرتبط بـ`                                                                                            |
|  15 | `components/list-page/PersonsGrid.tsx:100` · options-default · `chip.vip`                                           | `VIP`                                                                           | Authored `persons:chip.vip` — en `VIP`; ar `شخصية مهمة`                                                                                                            |
|  16 | `components/relationships/AdvancedGraphVisualization.tsx:865` · two-arg literal · `playback.skipToStart`            | `Skip to start`                                                                 | Authored `graph:playback.skipToStart` — en `Skip to start`; ar `الانتقال إلى البداية`                                                                              |
|  17 | `components/relationships/AdvancedGraphVisualization.tsx:875` · two-arg literal · `playback.pause`                  | `Pause`                                                                         | Authored `graph:playback.pause` — en `Pause`; ar `إيقاف مؤقت`                                                                                                      |
|  18 | `components/relationships/AdvancedGraphVisualization.tsx:875` · two-arg literal · `playback.play`                   | `Play`                                                                          | Authored `graph:playback.play` — en `Play`; ar `تشغيل`                                                                                                             |
|  19 | `components/relationships/AdvancedGraphVisualization.tsx:888` · two-arg literal · `playback.skipToEnd`              | `Skip to end`                                                                   | Authored `graph:playback.skipToEnd` — en `Skip to end`; ar `الانتقال إلى النهاية`                                                                                  |
|  20 | `components/report-builder/ColumnBuilder.tsx:96` · options-default · `columns.toggleVisibility`                     | `Toggle column visibility`                                                      | Authored `report-builder:columns.toggleVisibility` — en preserves the phrase; ar `تبديل إظهار العمود`                                                              |
|  21 | `components/type-specific-fields/TypeSpecificFields.tsx:32` · two-arg literal · `typeSpecific.engagement.title`     | `Additional Information`                                                        | Authored `intake:typeSpecific.engagement.title` — en `Additional Information`; ar `معلومات إضافية`                                                                 |
|  22 | `components/type-specific-fields/TypeSpecificFields.tsx:133` · two-arg literal · `typeSpecific.position.title`      | `Additional Information`                                                        | Authored `intake:typeSpecific.position.title` — en `Additional Information`; ar `معلومات إضافية`                                                                   |
|  23 | `components/type-specific-fields/TypeSpecificFields.tsx:197` · two-arg literal · `typeSpecific.mou_action.title`    | `Additional Information`                                                        | Authored `intake:typeSpecific.mou_action.title` — en `Additional Information`; ar `معلومات إضافية`                                                                 |
|  24 | `components/type-specific-fields/TypeSpecificFields.tsx:270` · two-arg literal · `typeSpecific.foresight.title`     | `Additional Information`                                                        | Authored `intake:typeSpecific.foresight.title` — en `Additional Information`; ar `معلومات إضافية`                                                                  |
|  25 | `components/work-creation/DossierPicker.tsx:291` · options-default · `chip.remove`                                  | `Remove ${chipName}`                                                            | Authored `work-creation:chip.remove` — en `Remove {{name}}`; ar `إزالة {{name}}`                                                                                   |
|  26 | `components/work-creation/WorkCreationPalette.tsx:278` · two-arg literal · `palette.dossierRequiredGeneric`         | `All work items must be linked to a dossier. Please select one:`                | Authored `work-creation:palette.dossierRequiredGeneric` — en preserves the sentence; ar `يجب ربط جميع عناصر العمل بدوسيه. يرجى اختيار واحد:`                       |
|  27 | `domains/dossiers/hooks/useDossier.ts:237` · options-default · `create.duplicate`                                   | `error.message \|\| 'A dossier with this name already exists.'`                 | Authored `dossier:create.duplicate` from the preserved user-facing alternative — en `A dossier with this name already exists.`; ar `يوجد دوسيه بهذا الاسم بالفعل.` |
|  28 | `pages/dossiers/DossierListPage.tsx:675` · two-arg literal · `list.resetFilters`                                    | `Reset`                                                                         | Existing declared `dossier:filter.reset` — en `Reset`; ar `إعادة تعيين`                                                                                            |
|  29 | `routes/_protected/dossiers/$id.overview.tsx:120` · options-default · `error.invalidId`                             | `Invalid dossier ID`                                                            | Authored `dossier-overview:error.invalidId` — en `Invalid dossier ID`; ar `معرّف الدوسيه غير صالح`                                                                 |
|  30 | `routes/_protected/engagements/$engagementId/after-action.tsx:156` · two-arg literal · `common.goBack`              | `Go back`                                                                       | Existing declared `common:goBack` — en `Go back`; ar `رجوع`                                                                                                        |

This accounts for every distinct before key: 24 bilingual authored leaves and five bindings to
existing bilingual leaves. The only duplicated site identity is `thread.new` (#7/#8), which
shares one authored resolution.

## Both-locale and unchanged-population proof

An independent leaf check loaded every authored and reused namespace from both static locale
trees, required every selected path to be a nonempty string, and printed:

```text
P99-45-BILINGUAL-KEYS-OK authored=24 reused=5 locales=en,ar
```

The canonical plan oracle was then run verbatim against the same 18 comma-separated source paths.
Its verbatim success output is:

```text
P99-45-MASK-RESOLUTION-OK total=134 files=18
```

The underlying final JSON fields are `scannedFiles=18`, `twoArgTotal=134`,
`literalTwoArgTotal=109`, `optionsDefaultTotal=25`, `twoArgUnresolved=0`,
`twoArgUnresolvedEn=0`, and `twoArgUnresolvedAr=0`. Thus both mask shapes remain nonempty and
unchanged while all 30 former production misses resolve independently in both locales.

## Preservation boundary and deferred work

- No fallback literal, `defaultValue`, or `t()` call was removed. The five source edits changed
  only the key argument to existing explicit namespace bindings; all 134 masks remain available
  for P99-30 to prove before any deletion lane opens.
- No scope entry, resolver, gatekeeper, test, or audit policy was changed. The strict audit still
  scans all 18 requested production files and reports the same 134/109/25 population.
- P99-46 deliberately retains the separate reviewed production raw-key repair: 35 unresolved
  raw-key sites across 12 files, with its fixed 207 raw-key / 9-mask scoped population. This task
  neither edits nor claims that residue.
- P99-47 deliberately retains the strict instrument's production/test population-policy repair.
  In particular, the test-only `components/work-creation/__tests__/DossierPicker.test.tsx:20`
  `chip.remove` mask from the RED register is policy evidence, not production work here.
- P99-30 remains the verification-only gatekeeper and must re-run fresh after P99-46 and P99-47;
  this predecessor does not declare the downstream deletion lanes reachable by itself.
