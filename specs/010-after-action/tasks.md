# Tasks — After‑Action

## Backend

- [ ] Migrations for `after_actions` and `after_action_items` + RLS.
- [ ] `backend/src/api/after-action.ts` routes.
- [ ] Extend `TaskService` and `CommitmentService` to accept `source.after_action` and backlink.

## Frontend

- [ ] Route + form with dynamic lists (decisions/risks/commitments).
- [ ] Upload minutes and run AI extraction; editable review.
- [ ] Publish flow (step‑up if needed).

## AI

- [ ] Extraction endpoint `/api/ai/after-action/extract` leveraging existing IntelligenceService helpers.

## Tests

- [ ] E2E: submit after‑action, verify tasks/commitments created and linked.
