# P99-46 Summary — production raw-key handoff resolved

## Outcome

GREEN. The reviewed production handoff now resolves in both `en` and `ar`: all 35 former raw-key
misses across the named 12 production files became zero without deleting or hiding a `t()` call,
adding a call-level fallback, or changing the strict instrument. The same canonical scope remains
nonempty and unchanged at exactly 207 raw-key sites and 9 mask sites. All nine inherited P99-45
masks remain resolved in both locales.

The task started from `71b272519d8960116f146a70936a244863eabd8f`. The authoritative source was
the human-reviewed `99-30-RED-HANDOFF.md`, especially §2.2 and §4, read after
`RULING-P99-102` and `RULING-P99-101` as required. The repair implementation is commit
`a0ea2d4c1ac98db6c6a900121916c450f85bad92`.

## Start-of-task RED re-derivation

Before any edit, the plan's exact 12-entry `--scope` was run through the canonical
`scripts/i18n-audit-strict.mjs --json`. Its live headline fields were:

```json
{
  "scannedFiles": 12,
  "rawKeyTotal": 207,
  "twoArgTotal": 9,
  "literalTwoArgTotal": 6,
  "optionsDefaultTotal": 3,
  "rawKeyUnresolved": 35,
  "rawKeyUnresolvedEn": 35,
  "rawKeyUnresolvedAr": 35,
  "twoArgUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0
}
```

This exactly re-derived the reviewed production split: 35 bilingual raw-key misses in 12 files,
separate from the already-green 9-site P99-45 mask population. The 35 sites consisted of 17
one-argument calls and 18 options-without-`defaultValue` calls. They represented 30 distinct
before keys: `cancel` occurred twice, `sla.resume` twice, and `sla.pause` four times.

## Exact 35 before identities

Line numbers and key strings below are the RED identities captured before repair. “Resolution”
refers to the distinct-key decision in the next section.

|   # | Before identity                                                          | Shape              | Before key                      | Resolution |
| --: | ------------------------------------------------------------------------ | ------------------ | ------------------------------- | ---------- |
|   1 | `frontend/src/components/attachment-uploader/AttachmentUploader.tsx:380` | options-no-default | `form.attachments.fileCount`    | R01        |
|   2 | `frontend/src/components/collaboration/ConflictResolutionDialog.tsx:252` | options-no-default | `cancel`                        | R02        |
|   3 | `frontend/src/components/collaboration/EditingLockIndicator.tsx:268`     | options-no-default | `cancel`                        | R02        |
|   4 | `frontend/src/components/intake-form/IntakeForm.tsx:487`                 | one-arg            | `actions.submitting`            | R03        |
|   5 | `frontend/src/components/scenario-sandbox/ScenarioCard.tsx:113`          | options-no-default | `actions.more`                  | R04        |
|   6 | `frontend/src/components/signals/SignalsQueue.tsx:95`                    | options-no-default | `queue.count`                   | R05        |
|   7 | `frontend/src/components/sla-countdown/SLACountdown.tsx:238`             | one-arg            | `sla.totalPaused`               | R06        |
|   8 | `frontend/src/components/sla-countdown/SLACountdown.tsx:253`             | one-arg            | `sla.resume`                    | R07        |
|   9 | `frontend/src/components/sla-countdown/SLACountdown.tsx:253`             | one-arg            | `sla.pause`                     | R08        |
|  10 | `frontend/src/components/sla-countdown/SLACountdown.tsx:260`             | one-arg            | `sla.resume`                    | R07        |
|  11 | `frontend/src/components/sla-countdown/SLACountdown.tsx:265`             | one-arg            | `sla.pause`                     | R08        |
|  12 | `frontend/src/components/sla-countdown/SLACountdown.tsx:276`             | one-arg            | `sla.pause`                     | R08        |
|  13 | `frontend/src/components/sla-countdown/SLACountdown.tsx:277`             | one-arg            | `sla.pauseReason`               | R09        |
|  14 | `frontend/src/components/sla-countdown/SLACountdown.tsx:278`             | one-arg            | `sla.pauseReasonPlaceholder`    | R10        |
|  15 | `frontend/src/components/sla-countdown/SLACountdown.tsx:281`             | one-arg            | `sla.pause`                     | R08        |
|  16 | `frontend/src/domains/dossiers/hooks/useDossier.ts:308`                  | options-no-default | `dossier.update.success`        | R11        |
|  17 | `frontend/src/domains/dossiers/hooks/useDossier.ts:316`                  | options-no-default | `dossier.update.error`          | R12        |
|  18 | `frontend/src/domains/dossiers/hooks/useDossier.ts:363`                  | one-arg            | `dossier.delete.success`        | R13        |
|  19 | `frontend/src/domains/dossiers/hooks/useDossier.ts:371`                  | options-no-default | `dossier.delete.error`          | R14        |
|  20 | `frontend/src/domains/dossiers/hooks/useDossier.ts:509`                  | one-arg            | `document.linkSuccess`          | R15        |
|  21 | `frontend/src/domains/dossiers/hooks/useDossier.ts:512`                  | options-no-default | `document.linkError`            | R16        |
|  22 | `frontend/src/domains/dossiers/hooks/useDossier.ts:555`                  | one-arg            | `document.unlinkSuccess`        | R17        |
|  23 | `frontend/src/domains/dossiers/hooks/useDossier.ts:558`                  | options-no-default | `document.unlinkError`          | R18        |
|  24 | `frontend/src/domains/relationships/hooks/useRelationships.ts:128`       | options-no-default | `messages.created`              | R19        |
|  25 | `frontend/src/domains/relationships/hooks/useRelationships.ts:131`       | options-no-default | `messages.createError`          | R20        |
|  26 | `frontend/src/domains/relationships/hooks/useRelationships.ts:169`       | options-no-default | `messages.updated`              | R21        |
|  27 | `frontend/src/domains/relationships/hooks/useRelationships.ts:180`       | options-no-default | `messages.updateError`          | R22        |
|  28 | `frontend/src/domains/relationships/hooks/useRelationships.ts:216`       | options-no-default | `messages.deleted`              | R23        |
|  29 | `frontend/src/domains/relationships/hooks/useRelationships.ts:227`       | options-no-default | `messages.deleteError`          | R24        |
|  30 | `frontend/src/pages/AssignmentQueue.tsx:210`                             | options-no-default | `queue.failedAttempts`          | R25        |
|  31 | `frontend/src/pages/engagements/workspace/DocsTab.tsx:162`               | options-no-default | `docs.count`                    | R26        |
|  32 | `frontend/src/routes/_protected/positions.tsx:236`                       | one-arg            | `positions:type.brief`          | R27        |
|  33 | `frontend/src/routes/_protected/positions.tsx:238`                       | one-arg            | `positions:type.talking_points` | R28        |
|  34 | `frontend/src/routes/_protected/positions.tsx:240`                       | one-arg            | `positions:type.q_and_a`        | R29        |
|  35 | `frontend/src/routes/_protected/positions.tsx:241`                       | one-arg            | `positions:type.guidance`       | R30        |

## Distinct-key resolution decisions and both-locale values

“Authored” means the exact leaf was added as a nonempty string to both locale bundles in the
namespace consulted by the call. No `defaultValue` or other call-level fallback was added. The
four count leaves R01/R05/R25/R26 complement their existing locale-specific plural leaves; those
plural leaves and all call `count` options remain intact.

“Existing binding” means both locale values already existed under the namespace the call intended
to consult. The raw key was changed to explicit colon form so the binding is unambiguous to both
i18next and the canonical resolver. Options objects and calls remain present. Relationship error
options now pass `error`, matching the reused leaves' `{{error}}` interpolation.

| ID  | Before key                      | Chosen resolution                                                                  | English                                    | Arabic                                       |
| --- | ------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| R01 | `form.attachments.fileCount`    | Authored `intake:form.attachments.fileCount`                                       | `{{count}} files`                          | `{{count}} ملفات`                            |
| R02 | `cancel`                        | Existing binding `common:cancel` at both sites                                     | `Cancel`                                   | `إلغاء`                                      |
| R03 | `actions.submitting`            | Authored `intake:actions.submitting`                                               | `Submitting…`                              | `جارٍ التقديم…`                              |
| R04 | `actions.more`                  | Existing binding `common:actions.more`                                             | `More`                                     | `المزيد`                                     |
| R05 | `queue.count`                   | Authored `intelligence-signals:queue.count`                                        | `{{count}} signals`                        | `{{count}} إشارة`                            |
| R06 | `sla.totalPaused`               | Authored `intake:sla.totalPaused`                                                  | `Total paused`                             | `إجمالي مدة الإيقاف المؤقت`                  |
| R07 | `sla.resume`                    | Authored `intake:sla.resume`                                                       | `Resume`                                   | `استئناف`                                    |
| R08 | `sla.pause`                     | Authored `intake:sla.pause`                                                        | `Pause`                                    | `إيقاف مؤقت`                                 |
| R09 | `sla.pauseReason`               | Authored `intake:sla.pauseReason`                                                  | `Reason for pausing the SLA`               | `سبب إيقاف اتفاقية مستوى الخدمة مؤقتًا`      |
| R10 | `sla.pauseReasonPlaceholder`    | Authored `intake:sla.pauseReasonPlaceholder`                                       | `Enter a reason for pausing the SLA`       | `أدخل سبب إيقاف اتفاقية مستوى الخدمة مؤقتًا` |
| R11 | `dossier.update.success`        | Existing binding `dossier:update.success`                                          | `Dossier '{{name}}' updated successfully`  | `تم تحديث الدوسيه '{{name}}' بنجاح`          |
| R12 | `dossier.update.error`          | Existing binding `dossier:update.error`                                            | `Failed to update dossier: {{message}}`    | `فشل تحديث الدوسيه: {{message}}`             |
| R13 | `dossier.delete.success`        | Existing binding `dossier:delete.success`                                          | `Dossier deleted successfully`             | `تم حذف الدوسيه بنجاح`                       |
| R14 | `dossier.delete.error`          | Existing binding `dossier:delete.error`                                            | `Failed to delete dossier: {{message}}`    | `فشل حذف الدوسيه: {{message}}`               |
| R15 | `document.linkSuccess`          | Authored `dossier:document.linkSuccess`; explicit binding corrects the bare hook   | `Document linked successfully`             | `تم ربط المستند بنجاح`                       |
| R16 | `document.linkError`            | Authored `dossier:document.linkError`; explicit binding corrects the bare hook     | `Failed to link document: {{message}}`     | `فشل ربط المستند: {{message}}`               |
| R17 | `document.unlinkSuccess`        | Authored `dossier:document.unlinkSuccess`; explicit binding corrects the bare hook | `Document unlinked successfully`           | `تم إلغاء ربط المستند بنجاح`                 |
| R18 | `document.unlinkError`          | Authored `dossier:document.unlinkError`; explicit binding corrects the bare hook   | `Failed to unlink document: {{message}}`   | `فشل إلغاء ربط المستند: {{message}}`         |
| R19 | `messages.created`              | Existing binding `relationships:messages.created`                                  | `Relationship created successfully`        | `تم إنشاء العلاقة بنجاح`                     |
| R20 | `messages.createError`          | Existing binding `relationships:messages.createError`                              | `Failed to create relationship: {{error}}` | `فشل في إنشاء العلاقة: {{error}}`            |
| R21 | `messages.updated`              | Existing binding `relationships:messages.updated`                                  | `Relationship updated successfully`        | `تم تحديث العلاقة بنجاح`                     |
| R22 | `messages.updateError`          | Existing binding `relationships:messages.updateError`                              | `Failed to update relationship: {{error}}` | `فشل في تحديث العلاقة: {{error}}`            |
| R23 | `messages.deleted`              | Existing binding `relationships:messages.deleted`                                  | `Relationship deleted successfully`        | `تم حذف العلاقة بنجاح`                       |
| R24 | `messages.deleteError`          | Existing binding `relationships:messages.deleteError`                              | `Failed to delete relationship: {{error}}` | `فشل في حذف العلاقة: {{error}}`              |
| R25 | `queue.failedAttempts`          | Authored `assignments:queue.failedAttempts`                                        | `{{count}} failed attempts`                | `{{count}} محاولة فاشلة`                     |
| R26 | `docs.count`                    | Authored `workspace:docs.count`                                                    | `{{count}} documents`                      | `{{count}} مستند`                            |
| R27 | `positions:type.brief`          | Authored `positions:type.brief`                                                    | `Brief`                                    | `ملخص`                                       |
| R28 | `positions:type.talking_points` | Authored `positions:type.talking_points`                                           | `Talking Points`                           | `نقاط نقاش`                                  |
| R29 | `positions:type.q_and_a`        | Authored `positions:type.q_and_a`                                                  | `Q&A`                                      | `أسئلة وأجوبة`                               |
| R30 | `positions:type.guidance`       | Authored `positions:type.guidance`                                                 | `Guidance`                                 | `إرشادات`                                    |

This accounts for every distinct before key through 18 bilingual authored leaves and 12 reused
bilingual leaves. R02 covers two sites, R07 covers two, and R08 covers four; all other decisions
cover one site each, yielding the exact 35-site population.

## Both-locale and unchanged-population proof

An independent leaf check loaded every authored and reused namespace directly from both static
locale trees, required every selected path to be a nonempty string, and printed:

```text
P99-46-BILINGUAL-KEYS-OK authored=18 reused=12 locales=en,ar
```

The canonical plan oracle was then run verbatim against the same 12 comma-separated source paths.
Its verbatim success output is:

```text
P99-46-RAW-RESOLUTION-OK raw=207 masks=9 files=12
```

The underlying final JSON fields are `scannedFiles=12`, `rawKeyTotal=207`, `twoArgTotal=9`,
`literalTwoArgTotal=6`, `optionsDefaultTotal=3`, `rawKeyUnresolved=0`,
`rawKeyUnresolvedEn=0`, `rawKeyUnresolvedAr=0`, `twoArgUnresolved=0`,
`twoArgUnresolvedEn=0`, and `twoArgUnresolvedAr=0`. The strict instrument's own discriminating
self-check also printed `P99-46-STRICT-SELF-CHECK-PASS`.

Thus both audited call classes remain nonempty, all production entries resolve independently in
both locales, and P99-45's mask repair remains green. The unchanged 207/9 totals prove no call was
deleted or hidden from the canonical matchers. Neither the audit script nor its scope policy was
edited.

## Explicit P99-47 test-mock exclusion

The following 12 raw-key sites are the test-only half of the reviewed 47-site repo-wide register.
They are explicitly excluded from this production repair and remain owned by P99-47's strict
instrument population-policy task; none of these files was touched or included in the 12-file
production scope:

| Test-only identity                                                                           | Key                        |
| -------------------------------------------------------------------------------------------- | -------------------------- |
| `frontend/src/components/dossier/DossierDrawer/__tests__/DossierDrawer.test.tsx:107`         | `cta.close`                |
| `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerCtaRow.test.tsx:9`            | `cta.coming_soon`          |
| `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerHead.test.tsx:10`             | `cta.close`                |
| `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx:6`         | `meta.location_fallback`   |
| `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx:7`         | `meta.lead_prefix`         |
| `frontend/src/components/dossier/DossierDrawer/__tests__/DrawerMetaStrip.test.tsx:8`         | `meta.engagements_suffix`  |
| `frontend/src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx:11` | `empty.open_commitments`   |
| `frontend/src/components/dossier/DossierDrawer/__tests__/OpenCommitmentsSection.test.tsx:21` | `section.open_commitments` |
| `frontend/src/components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx:6`   | `empty.recent_activity`    |
| `frontend/src/components/dossier/DossierDrawer/__tests__/RecentActivitySection.test.tsx:14`  | `section.recent_activity`  |
| `frontend/src/components/dossier/DossierDrawer/__tests__/UpcomingSection.test.tsx:6`         | `empty.upcoming`           |
| `frontend/src/components/dossier/DossierDrawer/__tests__/UpcomingSection.test.tsx:11`        | `section.upcoming`         |

This exclusion does not classify the mocks as resolved and does not change audit policy. P99-47
must still make the production/test population contract explicit before P99-30 reruns.

## Preservation boundary and verification

- No `t()` call, literal fallback, `defaultValue`, count option, or plural-specific locale leaf was
  deleted. No new call-level fallback was introduced.
- No strict audit, resolver, scope, test, test mock, or production/test policy file changed.
- Targeted ESLint completed with zero warnings; `pnpm --filter intake-frontend type-check` passed;
  every changed source/JSON file passed Prettier and JSON parsing.
- The implementation commit's required hook ran the complete repository `pnpm build` successfully.
  Its existing nonblocking CSS/chunk and knip diagnostics did not fail the build.
- P99-30 remains verification-only and must re-run after P99-47. This predecessor does not open
  any downstream fallback-deletion lane by itself.
