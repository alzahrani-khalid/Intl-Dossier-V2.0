---
quick_id: 260530-1wk
slug: data-entry-p0-data-loss-fixes-attachment
date: 2026-05-30
branch: fix/data-entry-uiux-polish
status: complete
---

# Wave 1 — P0 silent-data-loss honesty fixes — SUMMARY

**Status: COMPLETE.** All 4 commits made on `fix/data-entry-uiux-polish`. Lint,
type-check, and the per-commit pre-commit build all PASS. Not pushed; no PR opened
(user handles the PR).

## One-liner

Made the intake create-form attachment uploader and the AI manual-brief fallback
honest — no fabricated progress, no fake success, no silent data drop — and tracked
the two real backend builds as follow-up todos.

## Commits

| #   | Hash       | Message                                                                                              |
| --- | ---------- | ---------------------------------------------------------------------------------------------------- |
| 1   | cfd68019   | fix(intake): remove non-functional attachment uploader from create form, add honest unavailable note |
| 2   | 65bc725b   | fix(attachments): remove simulated upload progress + deceptive success state                         |
| 3   | ea3a4063   | fix(briefs): make manual brief fallback honest — no silent data drop                                 |
| 4   | (planning) | docs(planning): track attachment-upload + manual-brief backend follow-ups                            |

## Files changed

Commit 1 (cfd68019):

- frontend/src/components/intake-form/IntakeForm.tsx — removed AttachmentUploader
  import, attachmentIds state, handleAttachmentsChange, the setAttachmentIds([])
  reset; payload now attachments: []; replaced the dropzone with an honest
  token-styled "not yet available" note.
- frontend/src/i18n/en/intake.json — added form.attachments.unavailable + .uploading.
- frontend/src/i18n/ar/intake.json — added the same keys (AR strings).

Commit 2 (65bc725b):

- frontend/src/components/attachment-uploader/AttachmentUploader.tsx — dropped
  progress from AttachmentFile; removed the setInterval fake-progress block, the
  clearInterval, and fabricated progress: 0/100; replaced the determinate
  width-bound bar with an indeterminate "uploading" bar; success only on a genuinely
  resolved mutation with a real id; narrowed catch any -> unknown; removed misleading
  FormData-parity comments and left a one-line follow-up reference.

Commit 3 (ea3a4063):

- frontend/src/components/ai/BriefGenerationPanel.tsx — added manualNotice state;
  rewrote handleManualSubmit (was a console.warn TODO) to set an honest notice
  instead of silently dropping input; rendered a destructive Alert above the manual
  action buttons; clear the notice in handleGenerateAnother and handleSwitchToManual.
- frontend/public/locales/en/ai-brief.json — added fallback.notAvailable.
- frontend/public/locales/ar/ai-brief.json — added fallback.notAvailable (AR).

Commit 4 (planning docs):

- .planning/todos/260530-followup-intake-attachment-upload.md
- .planning/todos/260530-followup-manual-brief-endpoint.md
- .planning/quick/260530-1wk-data-entry-p0-data-loss-fixes-attachment/{PLAN.md,SUMMARY.md}

## Follow-up todo paths (referenced from code comments)

1. .planning/todos/260530-followup-intake-attachment-upload.md
   — referenced in IntakeForm.tsx (honest-note comment) and AttachmentUploader.tsx.
2. .planning/todos/260530-followup-manual-brief-endpoint.md
   — referenced in BriefGenerationPanel.tsx (handleManualSubmit comment).

GitHub issues were intentionally NOT created (no external side effects, per task
instruction); follow-ups are tracked as the two markdown files above instead.

## Verification (actual output)

- pnpm lint (eslint --max-warnings 0): PASS (exit 0, no output).
- pnpm type-check (tsc --noEmit): PASS (exit 0, no errors).
- Pre-commit hook (pnpm build + knip + lint-staged): PASS on all 3 code commits.
- Deletion check across HEAD~3..HEAD: no unexpected file deletions.

## Deviations from plan

1. Added a 5th i18n key not named in the plan (form.attachments.uploading, EN + AR).
   Commit 2 replaced the fake ${progress}% text with an honest "Uploading…" label,
   which needs its own key.
2. error: any -> unknown in AttachmentUploader.uploadFile catch (no-explicit-any is
   error-level). Narrowed via error instanceof Error.
3. Added explicit : void / Promise<void> return types to the touched functions
   (uploadFile, handleManualSubmit) for explicit-function-return-type. Pre-existing
   untouched handlers left as-is (surgical changes).
4. Intake locale files committed with Commit 1 rather than split across Commits 1/2,
   because both new intake keys live in the same attachments JSON block and git
   stages whole files; the two component concerns stay cleanly separated.
5. AR locale files found and updated (no missing-AR deviation).

## Self-Check: PASSED

- All 3 source files, 4 locale files, and 2 follow-up todo files exist on disk.
- Commits cfd68019, 65bc725b, ea3a4063 exist in git log.
