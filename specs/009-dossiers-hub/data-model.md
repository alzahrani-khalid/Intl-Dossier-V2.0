# Data Model — Dossiers Hub

Use existing `Dossier` shape (backend/src/models/Dossier.ts). Add persistence tables if missing:

## Tables
- dossiers (if not present in DB):
  - id, type, entity_id, title, executive_summary, status, classification, tags[], owner_id, contributors[], viewers[], last_reviewed, review_schedule, next_review_date, metadata, created_at, updated_at
- dossier_links (artifact index):
  - id, dossier_id, entity_type (engagement|position|mou|commitment|document|signal), entity_id, occurred_at

## Views
- v_dossier_timeline: union of events, positions, mous, commitments, documents, intelligence for a dossier over time.

