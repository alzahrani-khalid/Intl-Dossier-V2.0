# Data Model — Front Door

## Tables

### intake_tickets
- id (uuid, pk)
- request_type (enum: engagement | position | mou_action | foresight | inquiry)
- title_en (text), title_ar (text)
- description_en (text), description_ar (text)
- dossier_id (uuid, nullable)
- proposed_dossier (jsonb: {type, title, entity_id?})
- sensitivity (enum: public | internal | confidential | secret)
- urgency (enum: low | medium | high | critical)
- status (enum: new | triaged | in_progress | waiting | resolved | closed | duplicate)
- ai_triage (jsonb: {queue, unit, owner_suggestion, confidence})
- duplicate_of (uuid, nullable)
- sla_target_first_action (timestamptz)
- sla_target_resolution (timestamptz)
- first_action_at (timestamptz)
- resolved_at (timestamptz)
- created_by (uuid)
- assigned_to (uuid, nullable)
- assigned_unit (text, nullable)
- metadata (jsonb)
- created_at, updated_at (timestamptz)

Indexes: status, request_type, assigned_unit, dossier_id, created_at desc; GIN on ai_triage and metadata.

### intake_triage_rules
- id (uuid, pk)
- request_type (enum)
- conditions (jsonb) // e.g., {country:'SA', sensitivity:'confidential'}
- route_to (jsonb) // {unit:'Policy', role:'analyst'}
- sla (jsonb) // {ack_days:1, first_action_days:2, resolution_days:5}
- priority (int)
- active (bool)
- created_at, updated_at

### intake_assignments
- id (uuid, pk)
- ticket_id (uuid, fk intake_tickets)
- assigned_to (uuid)
- assigned_by (uuid)
- reason (text)
- created_at

### intake_sla_events
- id (uuid, pk)
- ticket_id (uuid)
- event (enum: created | first_action | resolved | breached | escalated)
- details (jsonb)
- at (timestamptz)

## Derived Views
- v_intake_sla_health: computes SLA compliance per ticket and aggregates per unit.

