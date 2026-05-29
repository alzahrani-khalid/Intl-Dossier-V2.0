# Follow-up: Implement working intake attachment upload (backend + client)

Created: 2026-05-30
Origin: Wave 1 P0 honesty fix (`.planning/quick/260530-1wk-data-entry-p0-data-loss-fixes-attachment/PLAN.md`)
Branch context: `fix/data-entry-uiux-polish`

## Problem

Attachment upload is non-functional end-to-end. The create-intake form previously
rendered an `AttachmentUploader` that could never persist a file:

- The `intake-tickets-attachments` edge function reads `ticketId` from the URL path
  (`/intake/tickets/{id}/attachments`) and requires the ticket to already exist.
- `intake.repository.ts` `uploadAttachment` calls
  `apiPost('/intake-tickets-attachments', data)` — JSON, with no `ticketId` in the path.
  `apiPost` `JSON.stringify`s the `FormData`, which yields `{}`, so the file payload
  never reaches the server.
- The create form has no ticket yet (it is created on submit), so an upload there
  cannot work regardless of serialization.
- `TicketDetail.tsx` has no upload affordance either (display-only).

Wave 1 removed the dropzone from the create form and replaced it with an honest
"Attachment upload is not yet available." note, and removed the simulated progress
bar / fake success state from `AttachmentUploader.tsx`. The real functionality is
deferred to this follow-up.

## Backend build required

1. Decide an upload strategy:
   - **ticket-then-attach**: create the ticket first, then attach to
     `/intake/tickets/{id}/attachments` from the detail page, OR
   - **pending-upload bucket**: stage uploads against a temp/pending bucket and
     associate them with the ticket on create.
2. Add a multipart-aware client path (`apiUpload`) that sends `FormData` as real
   `multipart/form-data` (do NOT `JSON.stringify` it).
3. Wire `intake.repository.ts` `uploadAttachment` to the correct path
   (`/intake/tickets/{id}/attachments`) with the multipart client.
4. Re-introduce an upload affordance — either on `TicketDetail.tsx` (post-create)
   or, with the pending-upload bucket, back on the create form.
5. Replace the honest "unavailable" note in
   `frontend/src/components/intake-form/IntakeForm.tsx` once upload works.

## Touch points

- `frontend/src/components/intake-form/IntakeForm.tsx`
- `frontend/src/components/attachment-uploader/AttachmentUploader.tsx`
- `frontend/src/components/.../TicketDetail.tsx`
- intake repository (`intake.repository.ts`) + API client (`apiPost` / new `apiUpload`)
- `intake-tickets-attachments` edge function
