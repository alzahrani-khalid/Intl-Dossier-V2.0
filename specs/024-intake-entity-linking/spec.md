# Feature Specification: Intake Entity Linking System

**Feature Branch**: `024-intake-entity-linking`
**Created**: 2025-01-18
**Status**: Draft
**Input**: User description: "@specs/INTAKE_ENTITY_LINKING_IMPLEMENTATION_PLAN.md"

## Clarifications

### Session 2025-01-18

- Q: When the AI suggestion service is unavailable or times out, how should the system behave? → A: manual linking and manual triage
- Q: How long should audit logs for link operations be retained in the system? → A: 7 years
- Q: When a triage officer searches for entities to link, how should search results be ranked? → A: Combination of AI confidence score + recency + alphabetical

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Triage Officer Links Intake to Primary Entity (Priority: P1)

A triage officer receives a new intake ticket about a bilateral meeting with Saudi Arabia. They need to quickly associate this ticket with the correct country dossier so analysts can find all related work in one place.

**Why this priority**: This is the core workflow that enables the entire intake system. Without the ability to link intake tickets to entities, the system cannot organize or route work effectively. This represents the minimum viable product.

**Independent Test**: Can be fully tested by creating an intake ticket, searching for an entity (e.g., Saudi Arabia dossier), and verifying the link appears in both the intake detail view and the dossier's related intakes list.

**Acceptance Scenarios**:

1. **Given** a triage officer is viewing an unclassified intake ticket, **When** they search for "Saudi Arabia" and select the country dossier as a primary link, **Then** the link is created with auto-assigned link_order=1 (first primary link) and displays immediately with appropriate visual indicators
2. **Given** a triage officer searches for entities, **When** they type "Saudi", **Then** search results are ranked by a combination of AI confidence score (relevance to current intake), recency of linking activity, and alphabetical order, with the most relevant entities appearing first
3. **Given** an intake ticket already has a primary link to one entity, **When** the triage officer attempts to add a second primary link, **Then** the system prevents the action and explains only one primary link is allowed
4. **Given** an intake ticket is linked to a dossier, **When** an analyst views that dossier, **Then** they see the intake ticket listed under "Related Intakes"
5. **Given** a triage officer has clearance level 2 (Internal), **When** they attempt to link to a level 4 (Secret) classified entity, **Then** the system prevents the link and displays message "Insufficient clearance: Secret clearance (level 4) required. Your clearance: Internal (level 2)"

---

### User Story 2 - AI Suggests Multiple Related Entities (Priority: P1)

A triage officer receives an intake ticket mentioning multiple countries, organizations, and existing positions. Instead of manually searching for each entity, they receive AI-powered suggestions with confidence scores and can accept multiple suggestions at once.

**Why this priority**: This dramatically reduces triage time and human error. The AI can identify relationships that humans might miss and suggests multiple link types simultaneously. This is critical for scaling the intake process.

**Independent Test**: Can be tested by creating an intake with known keywords (e.g., "bilateral meeting with Saudi Arabia and USA regarding trade policy"), triggering AI analysis, and verifying suggestions include relevant dossiers and positions with appropriate confidence scores.

**Acceptance Scenarios**:

1. **Given** an intake ticket contains text mentioning "Saudi Arabia", "USA", and "trade policy", **When** the triage officer requests AI suggestions, **Then** the system returns 3-5 suggestions including both country dossiers (primary/related) and a trade policy position (requested) with confidence scores 0.70-0.99
2. **Given** AI suggests 5 entity links, **When** the triage officer reviews suggestions and accepts 3 while rejecting 2, **Then** the 3 accepted links are created with source="ai" and the 2 rejected suggestions are logged for model improvement
3. **Given** AI suggests a link to a classified entity, **When** the triage officer views suggestions, **Then** only entities within their clearance level appear in the suggestions
4. **Given** AI suggests a link to an archived entity, **When** suggestions are generated, **Then** the archived entity is filtered out and not presented
5. **Given** the AI service is unavailable or times out, **When** a triage officer attempts to get suggestions, **Then** the system displays a prominent banner indicating AI suggestions are temporarily unavailable and allows the officer to proceed with manual linking and triage
6. **Given** an intake ticket triggers AI suggestions, **When** the AI service exceeds 3000ms timeout threshold, **Then** the system returns HTTP 504 Gateway Timeout with error message "AI suggestions took too long - proceed with manual linking" and fallback banner with yellow warning icon, ensuring the triage workflow is never blocked

---

### User Story 3 - Bulk Link Creation During Intake Conversion (Priority: P2)

A steward converts an intake ticket into a formal position document. All entity links from the intake (dossiers, organizations, related positions) automatically migrate to the new position, preserving the relationships established during triage.

**Why this priority**: This ensures continuity when intake tickets graduate to formal documents. Without this, users would need to manually re-establish all relationships, creating friction and potential data loss. This is essential for workflow completion but can be implemented after core linking works.

**Independent Test**: Can be tested by creating an intake with 3+ entity links (mix of primary, related, requested), converting the intake to a position, and verifying all links appear on the position with appropriate link type mappings.

**Acceptance Scenarios**:

1. **Given** an intake ticket has 1 primary link (dossier), 2 related links (dossiers), and 1 requested link (position), **When** a steward converts the intake to a position document, **Then** all 4 links are migrated to the position's entity links table with appropriate type mapping
2. **Given** an intake has links and is converted to a position, **When** the migration occurs, **Then** an audit log entry records the migration event with timestamp, user, and link count
3. **Given** an intake conversion fails due to validation errors, **When** the migration is attempted, **Then** no links are migrated (transaction rollback) and the intake remains unchanged

---

### User Story 4 - Analyst Discovers All Intakes Related to a Dossier (Priority: P2)

An analyst working on the Saudi Arabia dossier needs to see all intake tickets that mentioned or were linked to this dossier. They access a "Related Intakes" tab that shows a filterable, paginated list of all connected intake tickets.

**Why this priority**: This enables reverse lookup and discovery, helping analysts understand the full context of incoming work. This is valuable for analysis but not critical for the initial triage workflow.

**Independent Test**: Can be tested by linking 10+ intake tickets to a dossier with different link types, then viewing the dossier's "Related Intakes" tab and verifying filtering by link type (primary, related, mentioned) works correctly.

**Acceptance Scenarios**:

1. **Given** a dossier has 15 related intake tickets (5 primary, 7 related, 3 mentioned), **When** an analyst views the "Related Intakes" tab, **Then** they see all 15 tickets grouped by link type with pagination (50 per page)
2. **Given** the "Related Intakes" tab is displayed, **When** the analyst filters to show only "primary" links, **Then** the list updates to show only the 5 primary-linked intakes
3. **Given** an analyst has clearance level 2, **When** viewing related intakes that include level 3 (secret) tickets, **Then** the level 3 tickets are filtered out and not displayed

---

### User Story 5 - Link Management and Soft Delete (Priority: P3)

A triage officer realizes they linked an intake ticket to the wrong dossier. They can delete the incorrect link (soft delete) and add the correct one. A steward can later restore the deleted link if needed for audit purposes.

**Why this priority**: This provides flexibility for correcting mistakes and maintains audit trails. While important for data integrity, the system can function without this in the initial release.

**Independent Test**: Can be tested by creating a link, soft-deleting it, verifying it disappears from active views but remains in the audit log, then restoring it and verifying it reappears.

**Acceptance Scenarios**:

1. **Given** an intake has a link to dossier A, **When** a triage officer soft-deletes the link, **Then** the link is marked with deleted_at timestamp, disappears from active views, but remains in the database and audit log
2. **Given** a link was soft-deleted 5 minutes ago, **When** a steward restores the link, **Then** the deleted_at timestamp is cleared and the link reappears in active views
3. **Given** a link was deleted, **When** a user tries to create the same link again (same intake + entity + link type), **Then** the system allows it (partial unique index excludes deleted records)

---

### Edge Cases

- **Clearance boundary**: What happens when a user with clearance level 1 (restricted) attempts to link to a level 2 (confidential) entity? System must prevent the link and display a clear message explaining the clearance requirement.
- **Archived entities**: How does the system handle attempts to link to archived or deleted entities? Validation trigger must reject the link before it reaches the database.
- **Primary link enforcement**: What happens if a user tries to add a second primary link to an intake that already has one? System must prevent the action and explain the constraint.
- **Bulk operation failures**: When creating 10 links in a batch and 3 fail validation, how are errors reported? System must return both successful creations and detailed error messages for failures without rolling back successful links.
- **Concurrent modifications**: What happens if two users simultaneously try to link the same intake to different primary entities? Database constraints and optimistic locking must prevent race conditions.
- **AI service unavailability**: When AI service is unavailable or times out, system must allow users to continue with manual linking and triage, displaying a prominent banner indicating AI suggestions are temporarily unavailable. The triage workflow must not be blocked by AI service failures.
- **Link ordering conflicts**: When a user manually reorders links via drag-and-drop, how are conflicts resolved? System must maintain link_order values and handle gaps in sequence.
- **Migration rollback**: If an intake-to-position conversion fails halfway through link migration, are all links rolled back? Transaction boundaries must ensure atomicity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create links between intake tickets and any supported entity type (dossier, position, MOU, engagement, assignment, commitment, intelligence signal, organization, country, forum, working group, topic)
- **FR-001a**: System MUST rank entity search results using a weighted combination of: AI confidence score 50% (relevance to current intake content via vector similarity), recency of linking activity 30% (last_linked_at timestamp within 90 days weighted higher), and alphabetical order 20% (tie-breaker) to surface the most relevant entities first. Formula: `score = (0.5 × ai_confidence) + (0.3 × recency_weight) + (0.2 × alphabetical_weight)` where recency_weight = 1.0 if last_linked_at within 7 days, 0.5 if within 30 days, 0.25 if within 90 days, 0.0 otherwise.
- **FR-002**: System MUST enforce link type rules: primary links only to anchor entities (dossier, country, organization, forum, topic), assigned_to links only to assignments, requested links only to positions/MOUs/engagements
- **FR-003**: System MUST enforce a maximum of 1 primary link and 1 assigned_to link per intake ticket while allowing unlimited related, requested, and mentioned links
- **FR-004**: System MUST validate that linked entities exist and are not archived/deleted before creating links
- **FR-005**: System MUST respect clearance levels: users can only link to entities at or below their clearance level, and links must not violate the intake ticket's classification
- **FR-006**: System MUST support AI-powered link suggestions that analyze intake text and return 1-5 suggested entity links with confidence scores (0.00-1.00) and reasoning. AI service timeout MUST be 3000ms (matching SC-002 performance target). When AI service times out (exceeds 3000ms), system MUST return HTTP 504 Gateway Timeout with response body: `{error: 'AI_TIMEOUT', message: 'AI suggestions took too long - proceed with manual linking', show_fallback_banner: true}`. When AI service is unavailable or returns errors, system MUST automatically display fallback banner: "AI suggestions temporarily unavailable - proceed with manual linking" with visual indicator (yellow warning icon). Loading state MUST show spinner with "Generating AI suggestions..." text for 0-3000ms with progress indication. Manual linking workflow MUST remain fully functional during AI unavailability (no blocking). For the 5% of requests exceeding 3s (per SC-002), system MUST NOT show indefinite loading state - timeout handling takes precedence.
- **FR-007**: System MUST track provenance for each link: source (human/ai/import), confidence score (for AI), and the user who created the suggestion
- **FR-008**: System MUST support soft-delete for links, marking them with deleted_at timestamp while preserving data for audit trails
- **FR-009**: System MUST maintain an immutable audit log recording all link operations (create, delete, restore, migrate) with timestamp, user, and details; audit logs MUST be retained for a minimum of 7 years for compliance purposes
- **FR-010**: System MUST support bulk link creation operations, returning both successful creations and detailed error messages for any failures
- **FR-011**: System MUST support reverse lookup: given an entity, find all intake tickets linked to it, with filtering by link type and pagination
- **FR-012**: System MUST automatically migrate entity links when an intake ticket is converted to a position/MOU/engagement, mapping link types appropriately
- **FR-013**: System MUST support link ordering via link_order field, allowing users to manually prioritize links within each link type. Initial implementation (User Story 1) auto-assigns link_order=MAX(link_order)+1 within link_type scope during creation. Advanced drag-and-drop reordering UI is deferred to User Story 5 (Priority P3) with manual link_order updates via PATCH endpoint.
- **FR-014**: System MUST enforce organization-level multi-tenancy: users can only create/view links within their organization's data scope
- **FR-015**: System MUST prevent users from seeing entities they lack clearance to access, both in search results and AI suggestions
- **FR-016**: System MUST allow users to add optional notes to each link, explaining the relationship or providing context
- **FR-017**: System MUST support restoration of soft-deleted links by authorized users (steward role or above)
- **FR-018**: System MUST prevent duplicate active links (same intake + entity + link type combination) while allowing re-creation after soft-delete

### Key Entities *(include if feature involves data)*

- **Intake Entity Link**: Represents a relationship between an intake ticket and any entity in the system. Contains intake_id, entity_type (polymorphic), entity_id, link_type (primary/related/requested/mentioned/assigned_to), source (human/ai/import), confidence score, notes, link_order, provenance fields (suggested_by, linked_by), and soft-delete timestamp (deleted_at).

- **Link Audit Log**: Immutable record of all link operations for compliance and troubleshooting. Contains link_id, intake_id, entity_type, entity_id, action (created/deleted/restored/migrated), performed_by user, timestamp, and details JSON field. Audit logs must be retained for a minimum of 7 years to meet compliance requirements.

- **AI Link Suggestion**: Temporary suggestion generated by AI before user acceptance. Contains intake_id, suggested_entity_type, suggested_entity_id, suggested_link_type, confidence score (0.00-1.00), reasoning text, and status (pending/accepted/rejected).

- **Profile**: User profile with clearance level (1-4: Public/Internal/Confidential/Secret), default organization, global role (user/steward/admin), and preferences. Links to organization membership for multi-tenancy.

- **Organization Member**: Junction table linking users to organizations with per-org roles (owner/admin/steward/triage/member). Enforces multi-tenancy boundaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Triage officers can link an intake ticket to a primary entity in under 30 seconds, including search and selection time
- **SC-002**: AI suggestions return within 3 seconds for 95% of intake tickets, providing 3-5 relevant entity recommendations. For the remaining 5% that exceed 3 seconds, system returns timeout error (per FR-006) rather than indefinite wait, ensuring user workflow is never blocked by slow AI responses.
- **SC-003**: System supports batch creation of up to 50 links in under 500 milliseconds
- **SC-004**: Reverse lookup queries (finding all intakes for an entity) return results in under 2 seconds for datasets with 1000+ intake tickets
- **SC-005**: 90% of AI-suggested links are accepted by triage officers (measured over 30-day rolling window post-deployment, minimum 100 suggestions for statistical validity), indicating high suggestion quality and relevance
- **SC-006**: Zero unauthorized data access incidents: clearance level enforcement prevents users from viewing or linking to entities above their clearance (verified via quarterly penetration testing + continuous RLS policy audits in CI/CD pipeline)
- **SC-007**: All link operations are recorded in audit logs with 100% accuracy for compliance requirements
- **SC-008**: Intake-to-position conversion migrates entity links with 100% success rate, maintaining all relationship data
- **SC-009**: System supports 50 concurrent users performing linking operations without performance degradation (verified via k6 load testing with ramp-up to 50 users over 5 minutes, maintain for 10 minutes, measure p95 latency ≤200ms)
- **SC-010**: Triage time per intake ticket reduces by 40% compared to manual entity assignment workflows (baseline: average 3 minutes per intake measured over 100 tickets pre-deployment using manual stopwatch timing; target: 1.8 minutes post-deployment with AI suggestions enabled, measured over 30-day period)

## Assumptions

1. **Entity Existence**: All entity types referenced in links (dossiers, positions, MOUs, etc.) already exist in the database with stable schemas
2. **Authentication**: Users are already authenticated via Supabase Auth and have assigned clearance levels in their profiles
3. **Organization Setup**: Organizations are pre-configured and users are assigned to organizations before using the linking system
4. **AI Service**: AnythingLLM or equivalent AI service is deployed and accessible for generating link suggestions
5. **Clearance Hierarchy**: The integer-based clearance system (1-4: Public, Internal, Confidential, Secret) is adopted across all entities (dossiers, intake tickets, positions, etc.) before this feature launches. Level 1 (Public) is accessible by all users; each higher level requires explicit clearance assignment in user profiles.
6. **RLS Policies**: Supabase Row Level Security is enabled and enforced for all tables involved in entity linking
7. **Performance**: PostgreSQL database is properly indexed and can handle the expected query load (specified in Success Criteria)
8. **Mobile Support**: UI components will be implemented with mobile-first, RTL-compatible designs as per project standards
9. **Audit Requirements**: Immutable audit logs with 7-year retention are sufficient for compliance; no additional external audit system integration is required
10. **Link Type Semantics**: The distinction between "primary", "related", "requested", and "mentioned" link types is understood by users based on training or documentation

## Dependencies

1. **Database Schema**: Requires migration of existing clearance/sensitivity columns to integer-based classification_level (0-3) across all entity tables
2. **User Profiles**: Requires profiles table with clearance_level and default_org_id columns
3. **Organization System**: Requires organizations and org_members tables for multi-tenancy enforcement
4. **AI Service Integration**: Depends on AnythingLLM API v2.0+ (or equivalent) with support for:
   - **Embedding model**: text-embedding-ada-002 (OpenAI, 1536 dimensions) OR sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, requires re-indexing vectors if switching models)
   - **Vector search**: pgvector extension with HNSW index support for cosine similarity queries
   - **API endpoints**: POST /embed (text → embedding vector), POST /chat (context + prompt → reasoning text)
   - **Timeout handling**: 3000ms timeout with graceful degradation to manual linking workflow
   - **Authentication**: API key-based authentication via environment variable ANYTHINGLLM_API_KEY
   - **Fallback strategy**: If AnythingLLM unavailable, system operates in manual-only mode (no blocking)
5. **Supabase Edge Functions**: May use Edge Functions for complex validation or AI orchestration
6. **React Components**: Depends on shadcn/ui component library and TanStack Query for frontend
7. **Backend API**: Requires Express.js backend with TypeScript for business logic and validation
8. **Testing Infrastructure**: Requires Playwright for E2E tests and Jest for unit/integration tests

## Out of Scope

1. **Phase 2 Global Registry**: Migration to a universal `entities` table with true foreign keys is deferred to a future release (6+ months)
2. **Advanced AI Features**: Training custom models, confidence score calibration, and A/B testing of AI suggestions are not included in initial release
3. **Link Visualization**: Network graph or visual representation of entity relationships is not included
4. **Batch Import**: Bulk import of entity links from external systems (CSV, API) is not included
5. **Mobile App**: Native mobile app implementation is separate; this spec focuses on responsive web UI
6. **Email Notifications**: Notifications when entities are linked or when AI suggests links are not included
7. **Link Approval Workflow**: Multi-stage approval for links (e.g., triage officer suggests, steward approves) is not included
8. **Advanced Search**: Full-text search within linked entities or filtering by multiple criteria simultaneously is not included
9. **Link Expiration**: Time-based expiration or archival of old links is not included
10. **Cross-Organization Links**: Linking intake tickets to entities in different organizations is explicitly out of scope for security reasons
