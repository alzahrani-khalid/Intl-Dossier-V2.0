# 008 — Front Door (Unified Intake) — Spec

Purpose: implement a single entry point to request support (engagements, positions, MoU actions, foresight) with triage, dedupe, SLAs, and conversion into working artifacts.

## Goals
- Standardize request capture with bilingual forms and dossier linkage.
- Auto‑triage to the correct queue/unit with clear SLAs and WIP limits.
- Detect duplicates/stale tickets and auto‑close per hygiene policy.
- Convert intake tickets to Engagement, Position workflow, MoU action, or Foresight synthesis.

## Scope (Phase 1)
- Entities: `intake_tickets`, `intake_triage_rules`, `intake_assignments`, `intake_sla_events`.
- REST API: submit, view, triage, assign, convert, close.
- UI: Front Door page, request forms, SLA badges, queue with filters, conversion wizard.
- AI: auto‑classification, dedupe suggestions, owner/queue recommendation, initial brief stub.

## Non‑Goals (Phase 1)
- External partner portal.
- Deep CRM features.

## UX Flows
- New request → type picker → bilingual form → link existing dossier or propose new → preview SLA → submit.
- Queue view (Supervisor): triage suggestions, WIP counters, one‑click assign/convert.
- Ticket detail: SLA clock, duplicates, dossier context panel, conversion wizard.

## UI Components (frontend)
- `routes/_protected/front-door.tsx` (container)
- `components/intake/IntakeForm.tsx` (EN/AR)
- `components/intake/TriagePanel.tsx` (AI suggestions, SLA)
- `components/intake/TicketList.tsx` (queue, filters, WIP)
- `components/intake/ConvertWizard.tsx` (to Engagement/Position/MoU/Foresight)

## AI Agents
- Classifier: request_type, sensitivity, urgency → suggested queue/owner, SLA target.
- Dedupe: fuzzy match across open tickets/engagements; confidence score with reasons.
- Contextualizer: pull dossier summary + open commitments + positions to prefill brief.

## Security & Compliance
- RLS by unit/role; redaction for `sensitivity>viewer`.
- Step‑up MFA to convert or close tickets with `classification >= confidential`.

## Telemetry
- TTFB (time to first action), time to resolution, dedupe precision, auto‑triage acceptance rate.

## Acceptance Criteria
- Submit EN/AR request; receives ticket id and visible SLA clocks.
- Queue shows AI triage suggestion within 2s; supervisor can accept/override.
- Conversion creates the correct artifact with linkage to original ticket and dossier.
- Duplicates flagged with ≥0.8 confidence and merge flow.

See ./data-model.md and ./contracts/api-spec.yaml for details.

