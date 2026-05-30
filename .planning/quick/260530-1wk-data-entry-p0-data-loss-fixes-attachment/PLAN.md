---
quick_id: 260530-1wk
slug: data-entry-p0-data-loss-fixes-attachment
date: 2026-05-30
branch: fix/data-entry-uiux-polish
wave: 1 of 4 (data-entry UI/UX polish sweep)
---

# Wave 1 — P0 silent-data-loss honesty fixes

Continuation of PR #32 data-entry work. From the 2026-05-30 data-entry UI/UX audit
(`/tmp/data-entry-uiux-audit-2026-05-30.md`). Decision: **honesty fix now, full
backend builds tracked as follow-ups** (user-confirmed).

## Why (verified against live code)

Both P0s have backend/architecture depth, so this wave makes the UI **honest** and
defers the real functionality:

1. **Attachment upload is non-functional end-to-end.**
   - `intake-tickets-attachments` edge fn reads `ticketId` from the URL path
     (`/intake/tickets/{id}/attachments`) and requires the ticket to exist.
   - `intake.repository.ts` `uploadAttachment` calls `apiPost('/intake-tickets-attachments', data)`
     — JSON, no ticketId in path. `apiPost` `JSON.stringify`s the `FormData` → `{}`.
   - The create-intake form has **no ticket yet** (created on submit), so upload
     cannot work there regardless of serialization.
   - `TicketDetail.tsx` has **no** upload affordance either (display-only).
   - `AttachmentUploader.tsx` shows a **simulated** progress bar (`setInterval`,
     lines 108-115) — deceptive regardless of outcome.

2. **Manual brief submission cannot persist.** `BriefGenerationPanel.handleManualSubmit`
   (lines 119-124) is a `console.warn` TODO. No create/save-brief endpoint exists
   (all brief endpoints are AI-generation). User input is silently dropped.

## Tasks (atomic commits on `fix/data-entry-uiux-polish`)

### Commit 1 - Intake create form: remove non-functional uploader, stay honest

File: `frontend/src/components/intake-form/IntakeForm.tsx`

- Remove `import { AttachmentUploader }` (line 10).
- Remove `const [attachmentIds, setAttachmentIds] = useState<string[]>([])` (line 66).
- Payload: change `attachments: attachmentIds,` -> `attachments: [],` (line 118).
- Remove `handleAttachmentsChange` (lines 137-141).
- Remove `setAttachmentIds([])` from the "Create another" reset (line 167).
- Replace the `<AttachmentUploader ... />` block (lines 336-342) with a neutral honest
  note (NOT a promise of a specific flow, since detail-page upload also doesn't exist):
  ```tsx
  <div className="rounded-lg border border-border bg-muted/40 p-4">
    <p className="text-sm text-muted-foreground">
      {t('form.attachments.unavailable', 'Attachment upload is not yet available.')}
    </p>
  </div>
  ```
- Leave the optional `attachmentIds` zod field (line 49) - harmless, no setter remains.
- Add i18n key `form.attachments.unavailable` to `intake` EN + AR locale files
  (find under `frontend/src/i18n/**/intake.json` or `public/locales/**/intake.json`).
  AR: «رفع المرفقات غير متاح بعد.»

### Commit 2 - AttachmentUploader: kill the simulated progress + fake success

File: `frontend/src/components/attachment-uploader/AttachmentUploader.tsx`

- Remove the simulated-progress `setInterval` block (lines ~108-115) and its
  `clearInterval` (line ~124). Replace with an honest indeterminate "uploading"
  state (no fabricated percentage): keep `status: 'uploading'` but stop animating a
  fake `progress` number; the progress bar should render indeterminate or be omitted.
- Ensure `status: 'success'` is only set on a genuine resolved mutation that returns
  a real attachment id (it already does - just remove the fake-progress illusion).
- Remove the misleading "pass FormData for parity / simulate progress" comments
  (lines 45-50, 108, 117-119) now that the deception is gone. Keep a one-line note
  that real multipart wiring is tracked as a follow-up (reference the issue/seed).
- Do NOT attempt to wire the real multipart endpoint here (backend follow-up).

### Commit 3 - Brief manual fallback: honest "not available", no silent drop

File: `frontend/src/components/ai/BriefGenerationPanel.tsx`

- Add `const [manualNotice, setManualNotice] = useState<string | null>(null)`.
- Rewrite `handleManualSubmit` (lines 119-124) to surface an honest message instead
  of `console.warn`:
  ```tsx
  const handleManualSubmit = (): void => {
    // No create-brief endpoint exists yet; do not pretend to save. Tracked as a follow-up.
    setManualNotice(
      t(
        'fallback.notAvailable',
        "Saving a manual brief isn't available yet - your text has not been saved.",
      ),
    )
  }
  ```
- Render `manualNotice` as a destructive/warning `Alert` directly above the manual
  action buttons (around line 430), only when non-null.
- Clear `manualNotice` in `handleGenerateAnother` and `handleSwitchToManual`.
- Add i18n key `fallback.notAvailable` to `ai-brief` EN + AR locale files.
  AR: «حفظ الموجز اليدوي غير متاح بعد — لم يتم حفظ النص.»

### Commit 4 - File backend follow-ups + tracking

- Create GitHub issues (via `gh issue create`) - OR if `gh` unavailable, append to
  `.planning/todos/`:
  1. "Intake attachments: implement working upload (ticket-then-attach or pending-upload
     bucket) + multipart `apiUpload` client + wire repository to `/intake/tickets/{id}/attachments`."
  2. "Briefs: add manual-brief create/persist endpoint (or `briefs` insert + RLS) and wire
     `BriefGenerationPanel.handleManualSubmit`."
- Reference both issue numbers/paths in the follow-up comments left in code (Commits 2 & 3).

## Verification

- `pnpm --filter frontend lint` clean (no unused vars from removed uploader wiring).
- `pnpm --filter frontend typecheck` clean.
- `pnpm --filter frontend build` succeeds (commit hook runs build).
- Manual reasoning: create-intake form shows honest note, no dropzone; AttachmentUploader
  no longer animates fake progress; brief manual submit shows honest notice, never
  silently drops. No raw hex / Tailwind color literals introduced (tokens only).

## Out of scope (later waves / follow-ups)

- Real attachment upload + manual-brief endpoint (the two GitHub issues above).
- Fill-Mock gating, alert()->inline, RTL double-flips, dedupe, radius, i18n sweep - Waves 2-4.
