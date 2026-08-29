---
status: complete
---

# P99-58 Summary — mask deletion lane 1, part 3 of 3

## Outcome

**GREEN.** Commit `d2fabd06a` removes every English literal/default-value mask in this part's 22 production files. The three empty-string sentinels in `DossierTypeGuide.tsx` remain byte-intact. Review also preserved the localized dynamic fallback in `BulkActionPreviewDialog.tsx`: seven reachable hyphenated action IDs normalize to keys absent from both locales, so their title falls back to the translated `confirmation.title` rather than an English literal or raw key. The owned `DossierEngagementsTab` companion was repaired because the deletion activated its hardcoded/default-fallback mock: it now resolves the real English and Arabic `dossier-shell`, `dossier`, `dossier-overview`, and `engagements` resources, throws on missing/non-string keys, asserts both locale values, and rejects the bare `overview.sectionError` key.

No production first-argument key, namespace prefix, translation hook, import, test-mode branch, or locale JSON was changed. Interpolation/namespace options remain. The working dot-form keys remain dot-form under D-20/D-23; this was deletion-only.

## Re-derived population

The live TypeScript-AST census read the 22 allowlisted files at the task base and again after the deletion. It classified nonempty string second arguments, every `defaultValue`/plural-default option regardless of first-argument shape, and empty sentinels separately. Verbatim output:

```text
frontend/src/components/analytics/DossierAnalyticsCard.tsx	literal=0	options=4	total=4	sentinels=0
frontend/src/components/app-error-boundary/ErrorBoundary.tsx	literal=6	options=0	total=6	sentinels=0
frontend/src/components/attachment-uploader/AttachmentUploader.tsx	literal=1	options=3	total=4	sentinels=0
frontend/src/components/briefing-books/BriefingBookBuilder.tsx	literal=4	options=4	total=8	sentinels=0
frontend/src/components/briefing-books/BriefingBooksList.tsx	literal=1	options=1	total=2	sentinels=0
frontend/src/components/bulk-actions/BulkActionPreviewDialog.tsx	literal=0	options=16	total=16	sentinels=0	localized-dynamic-fallbacks=1
frontend/src/components/bulk-actions/EnhancedUndoToast.tsx	literal=0	options=4	total=4	sentinels=0
frontend/src/components/bulk-actions/SelectableDataTable.tsx	literal=0	options=4	total=4	sentinels=0
frontend/src/components/commitments/CommitmentDetailDrawer.tsx	literal=1	options=0	total=1	sentinels=0
frontend/src/components/commitments/StatusDropdown.tsx	literal=1	options=0	total=1	sentinels=0
frontend/src/components/contacts/ContactForm.tsx	literal=0	options=2	total=2	sentinels=0
frontend/src/components/copilot/CopilotMessageList.tsx	literal=0	options=1	total=1	sentinels=0
frontend/src/components/copilot/ThreadList.tsx	literal=0	options=4	total=4	sentinels=0
frontend/src/components/dossier/DossierContextBadge.tsx	literal=5	options=0	total=5	sentinels=0
frontend/src/components/dossier/DossierSelector.tsx	literal=8	options=0	total=8	sentinels=0
frontend/src/components/dossier/DossierShell.tsx	literal=0	options=8	total=8	sentinels=0
frontend/src/components/dossier/DossierTypeGuide.tsx	literal=1	options=0	total=1	sentinels=3
frontend/src/components/dossier/DossierTypeStatsCard.tsx	literal=1	options=0	total=1	sentinels=0
frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx	literal=0	options=4	total=4	sentinels=0
frontend/src/components/dossier/wizard/StepGuidanceBanner.tsx	literal=1	options=0	total=1	sentinels=0
frontend/src/components/dossier/wizard/edit/useEditDossierWizard.ts	literal=0	options=1	total=1	sentinels=0
frontend/src/components/dossier/wizard/hooks/useCreateDossierWizard.ts	literal=0	options=1	total=1	sentinels=0
BASELINE production-files=22 files-with-mask=22 literal=30 options=57 english-mask-total=87 empty-sentinels=3 localized-dynamic-fallbacks=1
BASELINE strict-visible literal=30 options=50 twoArgTotal=80
POST literal=0 options=0 english-mask-total=0 empty-sentinels=3 localized-dynamic-fallbacks=1
```

The corrected live population is 87 English masks, not the plan-time 78. All nine additional masks are inside the declared file list, so the out-of-lane stop condition did not trigger. Two are plural fallback properties newly counted by the amended strict parser; seven have template/identifier first arguments and are intentionally outside its single-quoted matcher but inside the AST census. The separately classified localized dynamic fallback also has a template first argument, is not an English mask, and remains in production. The strict parser therefore read 80 at the task base and zero after the drop. This is a live re-derivation, not a widening of scope.

## Scoped zero register

Command: `node scripts/i18n-audit-strict.mjs "$PWD" --scope <the 22 production paths> --json`, projected to the counters used by this task.

```json
{
  "scannedFiles": 22,
  "twoArgTotal": 0,
  "literalTwoArgTotal": 0,
  "optionsDefaultTotal": 0,
  "rawKeyTotal": 265,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0
}
```

`rawKeyTotal=265` is the positive control: the scoped zero was measured over real `t()` calls. Both locale-specific unresolved counters remain zero, proving that no surviving key moved.

## Acceptance oracle 1 — dynamic sentinels, strict total, English fallback options

The plan's first command ran unchanged at committed HEAD. Verbatim output:

```text
dossier type guide: union=8 [country,elected_official,engagement,forum,organization,person,topic,working_group]
  typeGuide.<t>.whenToUse: fallback=present missing=7/8
  typeGuide.<t>.notFor: fallback=present missing=7/8
dynamic-key coverage: OK (2 site(s))
scoped-files=22 defaultValue-hits=0
```

Process exit: `0`. The two type-guide dynamic families account for three source sentinels: the popover content reads both families, while the compact trigger reads `whenToUse` a second time. The `missing=7/8` rows positively prove why those empty fallbacks must remain. The review repair adds the independently verified `BulkActionType` family: seven of twelve reachable normalized title keys are absent from both locales, and its one surviving `defaultValue` resolves the real localized `confirmation.title` key rather than supplying fallback text. The plan scanner still prints zero because its quoted-key matcher cannot parse the quotes inside this template key; the owned acceptance fixture therefore targets this exact localized sentinel, requires it once, and requires zero fallback-text options after excluding it.

## Acceptance oracle 2 — task-range JSON, unresolved zero, negative control

The plan's second command ran unchanged after the production/test commit. Verbatim output:

```text
task-base=33e62b0bcd174c330a6892a60bf879abd3aae893 i18n-files-changed-by-this-lane=0
negative-control MISS rows=3
```

Process exit: `0`. The command also asserted all six scoped unresolved counters at zero before printing the negative-control line.

## Production spot-diff

`git diff --unified=0` sampled the literal, plural option, interpolation option, dynamic-first-argument, and sentinel-bearing files. Representative hunks:

```diff
-                        ` - ${t('form.attachments.uploading', 'Uploading…')}`}
+                        ` - ${t('form.attachments.uploading')}`}
@@
               {t('form.attachments.fileCount', {
                 count: files.length,
-                defaultValue_one: '{{count}} file',
-                defaultValue_other: '{{count}} files',
               })}
@@
-                                  {t(`status.${item.status}`, { defaultValue: item.status })}
+                                  {t(`status.${item.status}`)}
@@
                         {t(
                           `dossier-overview:${entry.kind === 'dossier' ? 'relationshipType' : 'eventType'}.${entry.badge}`,
-                          { defaultValue: entry.badge },
                         )}
```

`DossierTypeGuide.tsx` changed only its nonempty `typeGuide.learnMore` default. Its three ``t(`typeGuide.${type}...`, '')`` calls do not appear in the diff and the AST post-count remains `empty-sentinels=3`.

The committed production/test logic diff measured `31,938` bytes by summing added/removed `-U0` line content, below the 45,000-byte task ceiling. It changed exactly 23 allowlisted paths (22 production plus the owned companion), with `i18n-json-paths=0`.

## Companion test and type/build verification

The focused companion run used Vite's native config loader plus a process-scoped `__dirname` because the ordinary bundle loader tried to write under the harness-owned read-only `node_modules` symlink. The symlink was not modified. Command:

`cd frontend && NODE_OPTIONS='--import=data:text/javascript,globalThis.__dirname=process.cwd()' npm exec -- vitest run src/components/dossier/tabs/__tests__/DossierEngagementsTab.test.tsx --configLoader native`

Verbatim verdict:

```text
Test Files  1 passed (1)
     Tests  16 passed (16)
  Duration  2.27s (transform 275ms, setup 351ms, import 1.24s, tests 404ms, environment 213ms)
```

All ten pre-existing tests still run. The two error paths assert `enDossier.overview.sectionError`; the generic error path additionally renders Arabic, asserts `arDossier.overview.sectionError`, and rejects the bare key in both renders. Other literal assertions now read their expected values from static resource imports. The mock loads those same resources independently with `await vi.importActual`, with no private copy, default fallback, or key fallback.

The six plan criteria were parsed from the plan front matter/`<done>` block and compared with the Vitest leaf titles:

```text
criteria=6 titles=16
1	MATCH	No t() call in this slice passes an English default; a missing key now shows as missing in both loca
2	MATCH	Decisions covered — D-06, D-20, D-23, D-24, D-28, D-39: deletion-only, behind the gatekeeper, no con
3	MATCH	PRODUCTION keys are byte-untouched. Across the 22 production files the diff contains deletions of de
4	MATCH	A mask site found in a file OUTSIDE this lane's list means the tree moved between the gatekeeper's m
5	MATCH	no DYNAMIC-KEY site drops its fallback while a reachable key is absent from a locale (RULING-P99-498
6	MATCH	no i18n JSON changed in this lane, the scoped strict audit still reads zero UNRESOLVED after the dro
```

`npm run type-check` in `frontend/` exited `0`:

```text
> intake-frontend@1.0.0 type-check
> tsc --noEmit
```

The commit hook also completed scoped ESLint/Prettier and the repository Turbo build; all three packages built successfully (two cache hits and the frontend build cache hit).

## Deferred work

- P99-41 owns the consolidated rendered-product re-proof and operator checkpoint.
- Phase 102 owns D-21's working dot-form-to-colon conversion; this task did not pre-empt it.
- No mask, locale, companion, or scope work remains for P99-58 itself.
