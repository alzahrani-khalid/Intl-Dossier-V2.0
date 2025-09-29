# Data Model — After‑Action

## Tables

### after_actions

- id (uuid, pk)
- engagement_id (uuid)
- dossier_id (uuid)
- summary_en (text), summary_ar (text)
- decisions (jsonb[])
- risks (jsonb[])
- commitments (jsonb[]) // denormalized copy for history
- attachments (uuid[])
- status (enum: draft | published | archived)
- created_by, reviewed_by (uuid)
- created_at, updated_at, published_at (timestamptz)

### after_action_items

- id (uuid, pk)
- after_action_id (uuid)
- type (enum: decision | commitment | risk | note)
- payload (jsonb)
- created_at

## Triggers

- On publish → create `tasks` and `commitments` rows (via existing services), link back to after_action_id.
