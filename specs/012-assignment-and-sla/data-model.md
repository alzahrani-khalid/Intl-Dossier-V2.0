# Data Model — Assignment & SLA

## Tables

### user_skills

- user_id (uuid), skill (text), level (int 1–5)

### user_capacity

- user_id (uuid), daily_capacity_hours (int), wip_limit (int), unit (text)

### user_oof

- id, user_id, from (timestamptz), to (timestamptz), reason (text)

### assignment_decisions

- id, source (enum: intake|task), source_id (uuid)
- suggestion (jsonb), selected_user (uuid), reason (text), overridden (bool), overridden_by (uuid)
- created_at

### sla_policies

- id, applies_to (enum: intake|task|position|mou), request_type (text)
- ack_hours (int), first_action_hours (int), resolution_hours (int)
- escalation_policy (jsonb: {levels:[{after_hours, role_or_user, channel}]})

### sla_events

- id, entity_type, entity_id, event (enum: created|first_action|resolved|breach|escalated), at, details (jsonb)

## Views

- v_capacity_health: wip vs limit, availability factoring OOO.
