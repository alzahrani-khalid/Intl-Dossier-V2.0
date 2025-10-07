# Feature Specification: Front Door Intake

**Feature Branch**: `008-front-door-intake`  
**Created**: 2025-09-29  
**Status**: Draft  
**Input**: User description:

"""
Front Door Intake — Spec

New
Purpose: implement a single entry point to request support (engagements, positions, MoU actions, foresight) with triage, dedupe, SLAs, and conversion into working artifacts.
"""

---

## User Scenarios & Testing (mandatory)

### Primary User Story
As a staff member, I can open the Front Door page, select a request type, complete a bilingual (EN/AR) form, optionally link an existing dossier or propose a new one, preview applicable SLA, and submit to create an intake ticket that appears in the team queue.

As a supervisor, I can review the intake queue with AI triage suggestions (type, sensitivity, urgency, recommended owner/queue), accept or override suggestions, assign an owner, and convert the ticket into an Engagement, Position, MoU Action, or Foresight item, preserving linkage back to the originating ticket and dossier.

### Acceptance Scenarios
1. Given a logged-in staff user, when they submit a valid EN/AR request with required fields, then the system returns a ticket ID and displays SLA countdown badges on the ticket detail and queue list.
2. Given a new ticket, when the queue loads, then the AI triage suggestion renders within 2 seconds and the supervisor can accept in one click or override with a reason.
3. Given a ticket flagged as a likely duplicate, when the user opens the detail view, then the system shows top duplicate candidates with confidence scores and a merge flow; duplicates with confidence ≥ 0.80 are highlighted.
4. Given an approved conversion, when the supervisor chooses a target artifact (Engagement, Position, MoU Action, or Foresight) and confirms, then the system creates the artifact with a backlink to the intake ticket and shows a success banner.
5. Given a ticket classified ≥ "confidential", when a user attempts to convert or close, then the system requires step-up MFA and logs the event.
6. Given AI services are temporarily unavailable, when users interact with triage/dedupe features, then the system gracefully degrades: shows an "AI temporarily unavailable" banner, returns 503 with Retry-After on AI-only routes, and surfaces cached last-successful results with a "stale" badge (≤ 24h).

### Edge Cases
- Large attachments exceeding 25 MB per file or 100 MB total are validated with clear errors; submission remains intact.
- Unauthenticated access is rate-limited per IP and blocked from protected routes.
- Queue shows SLA breaches with visual emphasis; automatic hygiene rules may auto-close stale tickets per policy.
- Conversion rollback: if artifact creation fails after ticket updates, system restores ticket to pre-conversion state and records an error with correlation ID.

---

## Requirements (mandatory)

### Functional Requirements
- FR-001: The system MUST provide a unified entry point ("Front Door") with request type picker covering: Engagement support (with 2-3 specific fields), Position development (with 2-3 specific fields), MoU/Action items (with 2-3 specific fields), and Foresight requests (with 2-3 specific fields).
- FR-002: The system MUST offer bilingual (English/Arabic) forms with field-level validation, attachment limits (25 MB/file, 100 MB/ticket), and support for dossier linking or new dossier proposal.
- FR-003: The system MUST create `intake_tickets` on submission and show SLA badges from triage policy (high-priority: 30 min acknowledgment/8 hr resolution).
- FR-004: The system MUST present AI triage suggestions (request_type, sensitivity, urgency) and recommended unit/queue assignment with an "Accept" or "Override" action and reason capture.
- FR-005: The system MUST surface duplicate candidates for new tickets with confidence scores and a merge flow; candidates with confidence ≥ 0.80 must be highlighted.
- FR-006: The system MUST allow conversion of a ticket into one of: Engagement, Position, MoU Action, Foresight; the new artifact MUST link back to the intake ticket and dossier.
- FR-007: The system MUST enforce role- and unit-based viewing and redaction when sensitivity exceeds the viewer’s clearance; conversion/closure for confidential-or-higher MUST require step-up MFA.
- FR-008: The system MUST provide a queue view for supervisors with filters (status, type, sensitivity, owner/unit, SLA state, date range) and WIP counters.
- FR-009: The system MUST record audit events for triage decisions, assignment changes, conversions, merges, and step-up MFA prompts.
- FR-010: The system MUST provide graceful AI degradation: UI banner, cached last-successful results with "stale" badge and timestamp (≤ 24h), keyword search fallback for dedupe, and background retry for queued AI jobs.
- FR-011: The system MUST expose a REST API for submit, view, triage, assign, convert, and close operations, with health endpoints for both platform and AI.

## Clarifications

### Session 2025-01-29
- Q: What level of field customization is needed per request type? → A: Each type has 2-3 unique required fields beyond common ones
- Q: For high-priority requests (urgent + sensitive), what should be the acknowledgment SLA? → A: 30 minutes acknowledgment, 8 hours resolution
- Q: What attachment file size limit should be enforced per file? → A: 25 MB per file, 100 MB total per ticket
- Q: How long should intake tickets be retained in active storage? → A: 90 days active, then archive for 3 years
- Q: How should tickets be assigned to units/queues? → A: AI suggests unit, supervisor can override

#### Clarifications Needed
- [RESOLVED] Request subtypes and any custom fields per subtype - Each type has 2-3 unique required fields beyond common ones.
- [RESOLVED] SLA targets - High-priority (urgent + sensitive): 30 minutes acknowledgment, 8 hours resolution.
- [RESOLVED] Unit assignment - AI suggests unit, supervisor can override.
- [RESOLVED] Attachment limits - 25 MB per file, 100 MB total per ticket.
- [RESOLVED] Data retention - 90 days active storage, then archive for 3 years.

### Key Entities
- Intake Ticket — represents a single request captured via Front Door; key attributes: type, sensitivity, urgency, description, dossier link(s), attachments, status, SLA state, created_by, created_at, assigned_to, unit/queue, type_specific_fields (JSON for 2-3 unique fields per request type).
- Triage Rule — policy that determines SLA targets and routing hints based on ticket attributes and classifier outputs.
- Assignment — historical record of owner/unit changes for a ticket.
- SLA Event — timestamps for SLA start/pause/breach/stop; used for badges and reporting.
- Duplicate Link — relation connecting potential duplicate tickets and artifacts with confidence and decision (merged/dismissed).

---

## Architecture & Data Model

### Units & Assignment
- AI-driven unit suggestion based on request type, content analysis, and historical patterns
- Supervisor retains override authority with reason tracking
- Unit assignment stored in `assigned_to` and `unit/queue` fields

### AI Embeddings Store (pgvector)
- Table `ai_embeddings` (logical design for this feature’s dedupe/triage artifacts):
  - `id uuid pk`, `owner_type text`, `owner_id uuid`, `content_hash bytea`,
    `embedding vector(1024)`, `model text`, `model_version text`, `created_at timestamptz`.
- Similarity metric: cosine distance.
- Thresholds (environment-configurable): `SIMILARITY_PRIMARY=0.82` (match), `SIMILARITY_CANDIDATE=0.65` (recall window).
- Indexing strategy:
  - Prefer `HNSW (m=16, ef_construction=200)` when pgvector ≥ 0.6.
  - Fallback `IVFFLAT (lists=200)` when HNSW unavailable. Document runtime check.

### Models & Algorithms (for this feature)
- Triage classifier: gradient-boosted trees (LightGBM). Record `model_name` and `model_version` alongside decisions.
- Dedupe ranking: semantic similarity over embeddings (cosine) with thresholds above; combine lexical search and semantic scores via reciprocal rank fusion (RRF) for candidate ordering.
- Optional anomaly flagging for unusual urgency/sensitivity patterns via Isolation Forest (contamination 0.05); used as a hint, not a blocker.
- Embedding model default: `bge-m3` or `multilingual-e5-large` (Arabic/English), embedding dimension `1024`.

### Analysis Metadata
- Persist `analysis_metadata` with each AI-generated artifact or decision:
  - `analysis_id`, `model_name`, `model_version`, `embedding_model`, `embedding_dim`, `prompt_template_id`, `prompt_hash`, `temperature`, `top_p`, `seed`, `input_tokens`, `output_tokens`, `latency_ms`, `confidence_score`, `created_by`, `created_at`, `source_refs[]`, `heuristics[]`.
- Relationship: optional `embedding_id` FK into `ai_embeddings`; reject writes if `embedding_dim` ≠ 1024.

### AI Health & Fallback (applies to triage/dedupe)
- On failed AI health probe: disable AI endpoints, return `503` with `Retry-After` for AI routes; show non-blocking UI banner “AI temporarily unavailable”.
- Use cached last-successful results when available (≤ 24h) with a visible “stale” badge and timestamp.
- Queue background AI jobs with exponential backoff; log and meter all failures.

---

## Service Limits, Performance & Scale

### Rate Limiting
- Per-authenticated user: 300 requests/minute; allow bursts up to 2× for ≤ 10 seconds.
- Unauthenticated (per IP): 60 requests/minute.
- AI generation routes: 60 rpm per user; vector search: 120 rpm per user.
- Global ceiling: 15,000 rpm; exceeding returns 429.
- Responses MUST include: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` when applicable.

### Performance Targets
- API p95 latency ≤ 400 ms under 10,000 rpm sustained load.
- Front Door page contentful render ≤ 2.0 s on 3G Fast, TTI ≤ 3.5 s; queue interactions respond ≤ 200 ms on average.
- SLA alerting latency: high-priority tickets must trigger alerts within 5 minutes of SLA threshold (25 min for acknowledgment, 7.5 hrs for resolution).

### Horizontal Scaling
- Support 1,000 concurrent authenticated users.
- Scale-out triggers (any sustained ≥ 5 min): CPU ≥ 70%, Memory ≥ 75%, API p95 ≥ 400 ms, request queue depth ≥ 200.
- Policy: increase replicas by +50% (min +1, max ×8); cool-down 5 min; scale-in when metrics drop below half thresholds for 10 min.

---

## AI Behavior & Degradation
- Classifier MUST produce request_type, sensitivity, and urgency suggestions and a recommended owner/queue.
- Dedupe MUST compute similarity and present top candidates with confidence; duplicates ≥ 0.80 confidence highlighted; recall window threshold ≥ 0.65.
- Record model name and version used for each AI decision in metadata.
- When AI is unhealthy, disable AI endpoints and return 503 with `Retry-After`; UI shows non-blocking banner and degrades to deterministic heuristics.
- Cached last-successful AI results MUST expire within 24h and be labeled "stale" with timestamp.

---

## Security, Privacy & Compliance
- Enforce role-based access (unit/role) and field redaction when `sensitivity > viewer clearance`.
- Require step-up MFA for converting or closing tickets with `classification ≥ confidential`.
- Log all AI failures, triage overrides (with reasons), and security events with correlation IDs.
- Apply CORS, Helmet, and rate limiting consistently across new endpoints.
- Internationalized content (EN/AR) must be stored and rendered safely; inputs validated to prevent injection.
- Data retention: 90 days in active storage, then archive for 3 years with secure deletion after total retention period.

---

## Internationalization & Accessibility
- All user-facing text is bilingual (EN/AR) with correct RTL/LTR handling.
- Forms and queue views meet WCAG 2.2 AA: labels, focus order, keyboard operability, color contrast, live region updates for SLA badges.

---

## Non-functional Requirements

### Browser Support
- Latest two versions of Chrome, Edge, Firefox, Safari.
- Mobile Safari iOS 16+; Android Chrome 110+.
- CI matrix runs Playwright (chromium, webkit, firefox) smoke/core flows with accessibility checks (axe) and screenshot diffs for key pages.

### Responsive Design Compliance
- Mobile-first, fluid layouts; prefer component-level container queries where practical.
- Suggested breakpoints: `xs 320px`, `sm 375px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`.
- Typographic/spacing guidance: `rem` units; fluid type via `clamp`; body line-length 45–75ch.
- Media: `max-width: 100%`, `height: auto`, set `aspect-ratio`; provide `srcset`/`sizes`; lazy-load non-critical media.
- Navigation/touch: minimum targets 44×44px with ≥8px separation; non-hover affordances on touch.
- WCAG reflow/zoom: fully usable at 320px width; supports 200% page zoom and 400% text zoom; respect `prefers-reduced-motion` and `prefers-contrast`.
- Safe areas: include viewport meta with `viewport-fit=cover`; use `env(safe-area-inset-*)` for headers/footers on notched devices.
- Forms: proper `type`/`inputmode`, visible labels, inline errors; prevent keyboard overlap with critical controls.
- Data tables: responsive patterns (stacked key–value, column priority, or horizontal scroll with sticky header) and `overflow-wrap: anywhere`.
- Definition of Done (Responsive):
  - No horizontal overflow on key pages at widths: 320, 375, 414, 768, 1024, 1280.
  - Primary flows (login, queue, ticket detail) keyboard- and touch-usable at 320px.
  - Axe has no critical violations at 320px and 768px; screenshots reviewed with baseline diffs.
  - Playwright checks verify viewport meta and absence of unintended horizontal scrollbars.

---

## Telemetry & Observability
- Track: time-to-first-action (TTFA), time-to-resolution, dedupe precision/recall, auto-triage acceptance rate, SLA breach counts, queue latency, conversion success rate.
- Emit health metrics for AI services and fallback activation counts.

---

## Testing & QA
- Unit/integration coverage via `@vitest/coverage-v8` with thresholds: 80% statements, 80% branches, 80% lines, 80% functions. Emit `lcov` and HTML under `test-results/coverage` and fail CI below thresholds.
- E2E: Playwright matrix (chromium, webkit, firefox) covers smoke and core flows (submit intake, triage accept/override, dedupe view/merge, convert to artifact).
- Accessibility: axe checks on Front Door page, queue, and ticket detail; no critical violations.
- Visual: screenshot diffs for Front Door form, queue, ticket detail at 320, 768, 1280 widths.
- Performance budgets: verify TTI/TTFB targets from Performance Targets; alert in CI on regression beyond 10%.

---

## Review & Acceptance Checklist
### Content Quality
- [ ] Focused on user value and business needs
- [ ] Bilingual UX and a11y requirements captured
- [ ] Security and rate limits captured

### Requirement Completeness
- [ ] All [NEEDS CLARIFICATION] items resolved
- [ ] Acceptance scenarios are testable and measurable
- [ ] Scope and dependencies are clear

---

## Execution Status
- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [ ] User scenarios defined (requires stakeholder review of clarifications)
- [ ] Requirements finalized (post-clarification)
- [ ] Entities confirmed with data steward
- [ ] Review checklist passed
