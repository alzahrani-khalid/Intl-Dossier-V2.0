# 010 — After‑Action Notes — Spec

Purpose: standardize capture of outcomes after engagements, generate tasks/commitments, and close the loop.

## Goals

- Structured after‑action records per engagement with decisions, risks, commitments, and next steps.
- Auto‑create Tasks and Commitments; link to Dossier.
- Bilingual summary and distribution PDF.

## UX

- From Engagement: “Log After‑Action” button.
- Form sections: Attendance check, Decisions, Commitments (owner/due), Risks, Follow‑ups, Attachments.
- Review step and publish (with step‑up if confidential).

## UI

- Route: `/_protected/engagements/:id/after-action`
- Components: `AfterActionForm`, `DecisionList`, `CommitmentEditor`, `RiskList`.

## API

- `POST /api/engagements/:id/after-action` (create/update)
- `GET /api/engagements/:id/after-action`

## AI

- Meeting minutes → structured extraction (decisions, action items, risks) with confidence.
- Bilingual summary; suggested owners/dates from context.

## Acceptance

- Creating After‑Action inserts linked tasks/commitments with correct owners/dates.
- Summary in EN/AR; distribution PDF generated.
