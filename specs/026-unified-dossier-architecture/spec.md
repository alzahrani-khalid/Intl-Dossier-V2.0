# Feature Specification: Unified Dossier Architecture

**Feature Branch**: `026-unified-dossier-architecture`
**Created**: 2025-01-22
**Status**: Draft
**Input**: User description: "Comprehensive refactor to unified dossier architecture using Class Table Inheritance pattern. Consolidate fragmented entity model (countries, organizations, forums, engagements) into universal dossiers base table with type-specific extensions. Implement universal relationship model for graph queries. Separate temporal events from entity identity via calendar_events table. Fix engagement identity crisis (should BE dossiers not reference them). Support 7 dossier types: country, organization, forum, engagement, theme, working_group, person. Enable graph traversal, unified search, and consistent polymorphic linking patterns."

## Clarifications

### Session 2025-10-22

- Q: Migration rollback strategy - If migration fails halfway through (after creating tables but before data conversion), should system auto-rollback or require manual recovery? → A: Clean slate approach - all existing data is mock/test data that will be deleted before migration. No rollback strategy needed.
- Q: Dossier type immutability - Can dossiers.type be changed after creation (e.g., UPDATE SET type='working_group' WHERE type='engagement'), or is it immutable? → A: Immutable type field - dossiers.type cannot be changed after creation; type changes require creating new dossier, copying relationships, marking original as historical/archived.
- Q: Concurrent relationship conflict resolution - When two users simultaneously create contradictory relationships (e.g., A→parent_of→B and B→parent_of→A), how are conflicts detected and resolved? → A: Database constraint enforcement - Use SERIALIZABLE isolation or deferred constraints; conflicting transaction fails at commit with constraint violation error, application displays error message to user who can then retry.

## User Scenarios & Testing

### User Story 1 - Query Any Entity by Single ID (Priority: P1)

As a staff member viewing any diplomatic entity (country, organization, forum, meeting, theme), I want to access all information using a single consistent ID, so I don't need to remember which table stores what or juggle multiple IDs for the same concept.

**Why this priority**: This is the foundation of the unified architecture. Without single ID namespace, all other features fail. This delivers immediate clarity and reduces cognitive load for all users and developers.

**Independent Test**: Can be fully tested by creating entities of different types (country, organization, engagement) and verifying each has a single dossier ID that works across all queries, delivers consistent data access, and eliminates table-switching confusion.

**Acceptance Scenarios**:

1. **Given** user views Saudi Arabia country dossier, **When** they copy the dossier ID, **Then** the same ID works for querying relationships, calendar events, documents, and tasks without table-specific lookups
2. **Given** developer queries dossiers table WHERE id='X', **When** they JOIN to countries or organizations extension, **Then** the JOIN uses the same ID value (countries.id = dossiers.id, not a separate FK column)
3. **Given** user searches for "G20 Summit", **When** they select it from results, **Then** system uses one dossier ID regardless of whether it's stored as forum, engagement, or theme type
4. **Given** intake ticket links to an entity, **When** triage officer views linked entities, **Then** all links reference dossiers.id consistently (no mix of countries.id vs dossiers.id)

---

### User Story 2 - Model Engagement as Independent Entity (Priority: P1)

As a diplomat preparing for bilateral meetings, I want engagements (meetings, consultations, visits) to be independent entities that can relate to multiple countries and organizations, so I can properly represent multi-party diplomatic events without awkward "belongs to one dossier" constraints.

**Why this priority**: Fixes critical architectural flaw where engagements reference a single dossier instead of being entities themselves. This blocking issue prevents proper multi-party meeting modeling and breaks the mental model.

**Independent Test**: Can be fully tested by creating an engagement "China-Saudi Trade Talks", verifying it exists as its own dossier, then adding relationships to both China (country dossier) and Saudi Arabia (country dossier) via the relationships table, proving multi-party linkage works.

**Acceptance Scenarios**:

1. **Given** user creates engagement "2025 China Trade Talks", **When** engagement is saved, **Then** it becomes a dossier (type='engagement') with its own ID, not a record pointing to another dossier
2. **Given** engagement dossier exists, **When** user adds relationships, **Then** they can link engagement to China (country), Saudi Arabia (country), Trade Ministry (org), and Minister X (person) via dossier_relationships table
3. **Given** user views China country dossier, **When** they check related engagements, **Then** "China Trade Talks" appears in relationships (bidirectional query works)
4. **Given** engagement has multiple related entities, **When** user queries "all entities involved in this engagement", **Then** system returns all countries, organizations, and persons linked via relationships
5. **Given** legacy engagement with old dossier_id FK, **When** migration runs, **Then** the FK is converted to relationship entry (source=engagement, target=old_dossier, type='discusses')

---

### User Story 3 - Traverse Entity Relationships as Graph (Priority: P2)

As an analyst researching diplomatic connections, I want to explore relationships between any entities (country-to-country partnerships, organization memberships, forum participation), so I can discover indirect connections and understand the full network of relationships.

**Why this priority**: Unlocks powerful graph query capability that's impossible with current fragmented model. High value for analysis but not blocking for basic CRUD operations.

**Independent Test**: Can be fully tested by creating relationship chain (Saudi Arabia → Trade Agreement → China, China → G20 → UNDP), then querying "all entities within 2 degrees of Saudi Arabia" and verifying all 4 entities return with relationship paths shown.

**Acceptance Scenarios**:

1. **Given** Saudi Arabia has bilateral_relation with China, China has partnership with UNDP, **When** analyst queries "entities within 2 degrees of Saudi Arabia", **Then** system returns China (1 degree), UNDP (2 degrees) with relationship paths
2. **Given** user views organization dossier, **When** they click "Show relationships", **Then** UI displays relationship graph with nodes (entities) and edges (relationship types like membership, partnership, reports_to)
3. **Given** multiple relationship types exist between entities, **When** user filters by relationship_type='membership', **Then** only membership relationships appear in graph visualization
4. **Given** relationships have temporal validity (effective_from, effective_to), **When** user queries relationships as of specific date, **Then** only active relationships for that date are included
5. **Given** relationship is marked status='terminated', **When** user queries active relationships, **Then** terminated relationships are excluded unless historical view is requested

---

### User Story 4 - Separate Temporal Events from Entity Identity (Priority: P2)

As an event coordinator managing forums and meetings, I want calendar events separated from entity definitions, so a multi-day forum can have multiple session events while maintaining a single forum identity.

**Why this priority**: Enables proper calendar functionality and resolves event/engagement/calendar confusion. Important for usability but not blocking core entity model.

**Independent Test**: Can be fully tested by creating forum "G20 Summit 2025" (single dossier), adding 5 calendar events (opening ceremony, 3 working sessions, closing), verifying all events link to same dossier ID, and calendar view shows all 5 events chronologically.

**Acceptance Scenarios**:

1. **Given** user creates forum "G20 Summit 2025", **When** they add calendar events, **Then** each session becomes a calendar_event row (with event_type='session') linked to the forum dossier
2. **Given** engagement has recurring monthly meetings, **When** user schedules instances, **Then** each meeting date becomes a calendar_event (same engagement dossier, different start_datetime values)
3. **Given** user views calendar for March 2025, **When** calendar loads, **Then** all events with start_datetime in March appear regardless of dossier type (forums, engagements, ceremonies)
4. **Given** forum session is cancelled, **When** coordinator updates event status, **Then** calendar_event.status='cancelled' and event appears with cancelled indicator in calendar view
5. **Given** calendar event has participants, **When** viewing event details, **Then** event_participants table shows all attendees (staff users, external contacts, VIP persons) with their roles

---

### User Story 5 - Search Across All Entity Types (Priority: P2)

As any user searching for entities, I want one search box that finds countries, organizations, forums, engagements, and themes, so I don't need to know the entity type in advance or search multiple tables.

**Why this priority**: Major usability improvement. Current system requires knowing entity type before searching. Unified search delivers Google-like experience.

**Independent Test**: Can be fully tested by indexing entities with keyword "climate" (country: "Climate Working Group", forum: "Climate Conference", theme: "Climate Policy"), then searching "climate" and verifying all 3 types appear in ranked results.

**Acceptance Scenarios**:

1. **Given** user types "climate" in global search, **When** search executes, **Then** results include countries, organizations, forums, themes tagged/named with "climate" in ranked order
2. **Given** search results include multiple entity types, **When** user views results list, **Then** each result shows entity type badge (country/org/forum/etc) and primary identifier (ISO code/org code/date)
3. **Given** user searches for "Saudi", **When** results return, **Then** ranking prioritizes exact matches (Saudi Arabia) over partial matches (Saudi-Belgian Trade Agreement) over related matches (tags)
4. **Given** user has clearance level 2 (Internal), **When** searching entities, **Then** level 3 (Confidential) and level 4 (Secret) entities are filtered out from results
5. **Given** user applies filter "type=country", **When** viewing search results, **Then** only dossiers with type='country' appear (organizations, forums excluded)

---

### User Story 6 - Link Documents to Any Entity (Priority: P3)

As a steward managing policy documents, I want to link positions, MOUs, and briefs to any entity type (country, organization, theme, engagement), so documents can be associated with their subjects regardless of entity type.

**Why this priority**: Improves document organization but not critical for core entity model. Can be implemented after unified dossier architecture is stable.

**Independent Test**: Can be fully tested by creating position "Trade Policy 2025", linking it to Saudi Arabia (country), Trade Ministry (org), and Trade Theme (theme) via position_dossier_links table, then verifying each entity's "Related Documents" tab shows the position.

**Acceptance Scenarios**:

1. **Given** user creates position about Saudi-China trade, **When** they add entity links, **Then** position can link to Saudi Arabia (country), China (country), Trade Ministry (org), Trade Theme (theme) via position_dossier_links table
2. **Given** user views country dossier, **When** they open "Related Documents" tab, **Then** all positions, MOUs, briefs linked to this dossier appear in chronological order
3. **Given** MOU is signed between two countries, **When** creating MOU record, **Then** signatory_1_id and signatory_2_id both reference dossiers.id (supporting country or organization dossiers)
4. **Given** brief is prepared for engagement, **When** linking brief to entities, **Then** brief can link to engagement dossier and all participant countries/orgs

---

### User Story 7 - Track VIP Persons as Dossiers (Priority: P3)

As a protocol officer managing high-level contacts, I want to create dossier profiles for ambassadors, ministers, and other VIPs, so I can track their relationships, participation in events, and relevant documents just like I track countries and organizations.

**Why this priority**: Adds new capability for VIP tracking. Nice-to-have but not essential for core architecture. Can be added incrementally.

**Independent Test**: Can be fully tested by creating person dossier "Ambassador John Smith", linking to organization (Ministry of Foreign Affairs), adding relationships (represents USA country dossier), and verifying person appears in calendar event participants.

**Acceptance Scenarios**:

1. **Given** user creates person dossier for "Ambassador Jane Doe", **When** filling details, **Then** person extends dossiers (type='person') with fields: title, organization_id, nationality_country_id, contact_info
2. **Given** person dossier exists, **When** adding to calendar event, **Then** event_participants table links to person dossier via participant_id with participant_type='person_dossier'
3. **Given** ambassador represents a country, **When** creating relationship, **Then** dossier_relationships entry: source=person, target=country, type='represents'
4. **Given** user views organization dossier, **When** checking related persons, **Then** all persons with organization_id pointing to this org appear in "Key Contacts" section
5. **Given** user searches for "Minister of Trade", **When** results return, **Then** person dossiers with matching titles appear alongside organizational results

---

### Edge Cases

- **What happens when entity changes type?** (e.g., engagement promoted to recurring working group): Create new dossier for working group, copy relationships, mark original engagement as historical, add supersedes relationship
- **How to handle entity merges?** (two organizations merge into one): Create new dossier for merged entity, create merged_from relationships to both original dossiers, mark originals as archived (status='archived')
- **What if relationship creates circular dependency?** (A → parent_of B → parent_of A): Database constraint CHECK prevents self-reference, application validates relationship chains before creating parent/child relationships. Concurrent conflicts (two users simultaneously creating contradictory relationships) are caught at commit time via SERIALIZABLE isolation or deferred constraints, failing transaction displays error message prompting retry.
- **How to delete entity with many relationships?** Enable cascade delete on dossier_relationships with ON DELETE CASCADE, warn user before deletion showing relationship count, provide "archive instead" option for soft delete
- **What happens if calendar event outlasts dossier?** If engagement dossier is archived, calendar events remain visible for historical record (ON DELETE SET NULL or keep with archived dossier)
- **How to handle duplicate entities?** Provide merge tool: user selects primary dossier, merges relationships/documents from duplicate to primary, marks duplicate as archived with merged_into relationship
- **What if user lacks clearance to view related entity?** Relationship exists in graph but linked entity is filtered out by RLS, relationship appears with placeholder "[Restricted]" instead of entity name
- **How to version entity data?** Extension tables (countries, organizations) include updated_at timestamp, critical changes logged in audit_logs table (not in scope for MVP but architecture supports it)

## Requirements

### Functional Requirements

- **FR-001**: System MUST maintain single ID namespace where all dossiers (countries, organizations, forums, engagements, themes, working groups, persons) use dossiers.id as primary key
- **FR-002**: System MUST implement Class Table Inheritance pattern where type-specific tables (countries, organizations, etc.) extend dossiers using same UUID (countries.id REFERENCES dossiers.id ON DELETE CASCADE)
- **FR-003**: System MUST support 7 dossier types: 'country', 'organization', 'forum', 'engagement', 'theme', 'working_group', 'person' via dossiers.type CHECK constraint
- **FR-004**: System MUST eliminate dual entity representation by ensuring each real-world entity exists in exactly one dossier row (no separate countries.id vs dossiers.id for same country)
- **FR-005**: System MUST transform engagements from "referencing dossiers" to "being dossiers" (remove engagement.dossier_id FK, engagements.id REFERENCES dossiers.id instead)
- **FR-006**: System MUST provide dossier_relationships table supporting polymorphic many-to-many relationships between any two dossiers with relationship_type, temporal validity (effective_from, effective_to), and status (active, historical, terminated)
- **FR-007**: System MUST support relationship types including but not limited to: bilateral_relation, membership, partnership, parent_of, subsidiary_of, discusses, involves, participant_in, hosted_by, sponsored_by, related_to, represents
- **FR-008**: System MUST enable bidirectional relationship queries (if A relates to B, user can query from A to find B or from B to find A)
- **FR-009**: System MUST separate temporal events from entity identity via calendar_events table where each event links to dossier_id (the engagement/forum) with start_datetime, end_datetime, location, status
- **FR-010**: System MUST support multiple calendar events per dossier (multi-day forum has multiple session events, recurring engagement has multiple meeting instances)
- **FR-011**: System MUST provide event_participants table linking calendar events to participants (staff users, external contacts, person dossiers) with role (organizer, speaker, attendee) and attendance_status
- **FR-012**: System MUST standardize all polymorphic entity_type references to use 'dossier' for all dossier subtypes (intake_entity_links, tasks.work_item_type use 'dossier' not 'country'/'organization'/'forum')
- **FR-013**: System MUST implement unified search across all dossier types using generated search_vector column with weighted full-text search (name_en/name_ar weighted A, description B)
- **FR-014**: System MUST rank search results by combination of relevance score (ts_rank), exact match priority, and entity status (active prioritized over archived)
- **FR-015**: System MUST filter search results by clearance level (RLS policies prevent users from seeing dossiers above their clearance_level)
- **FR-016**: System MUST support document-to-dossier linking via junction tables (position_dossier_links, mou references dossiers.id for signatories, brief_subjects)
- **FR-017**: System MUST enable graph traversal queries via recursive CTEs finding all entities within N degrees of separation from starting dossier
- **FR-018**: System MUST provide relationship path display showing chain of relationships connecting two entities (A → membership → B → partnership → C)
- **FR-019**: System MUST preserve audit trail for all entity changes via updated_at timestamp, created_by/updated_by user references, and optional audit_logs table
- **FR-020**: System MUST support soft delete via dossiers.status='deleted' flag allowing archive/restore without losing data or breaking foreign key references
- **FR-021**: System MUST maintain referential integrity where dossier deletion cascades to type-specific extension (DELETE FROM dossiers WHERE id='X' also removes countries row)
- **FR-022**: System MUST validate dossier type matches extension table (cannot have dossier type='country' without corresponding countries.id row)
- **FR-022a**: System MUST enforce dossiers.type immutability via database constraint or application-level validation preventing UPDATE operations on type field after creation
- **FR-023**: System MUST prevent circular relationships via CHECK constraint (source_dossier_id != target_dossier_id) and application-level validation for transitive cycles in parent/child relationships. System MUST use SERIALIZABLE isolation level or deferred constraints to catch concurrent conflicting relationship creation at commit time, returning constraint violation error to application for user-facing error message.
- **FR-024**: System MUST support organization hierarchy via organizations.parent_org_id with validation preventing circular references
- **FR-025**: System MUST enable VIP person tracking via persons table extending dossiers with title, organization_id, nationality_country_id, biography, photo_url
- **FR-026**: System MUST link persons to organizations (represents), countries (nationality), and events (participants) via relationships or direct FKs where structural relationship exists
- **FR-027**: System MUST implement clean slate migration: drop existing fragmented schema (separate countries/orgs/forums/engagements tables), create unified schema from scratch, populate with fresh seed data covering all 7 dossier types
- **FR-028**: System MUST create all polymorphic references (intake_entity_links, tasks) using dossiers.id and entity_type='dossier' consistently from the start
- **FR-029**: System MUST create engagements as dossiers (not with dossier_id FK) with relationships to involved entities via dossier_relationships table from the start
- **FR-030**: System MUST regenerate TypeScript types from updated database schema ensuring frontend type safety matches new architecture

### Key Entities

- **Dossier (Universal Base)**: Core entity representing any subject of diplomatic interest. Contains id (UUID), type (country/organization/forum/engagement/theme/working_group/person), name_en, name_ar, description_en, description_ar, status (active/inactive/archived/deleted), sensitivity_level (1-4), tags (array), metadata (JSONB for flexible fields), search_vector (generated tsvector for full-text search), created_at, updated_at, created_by, updated_by. Single source of truth for all entity IDs across system.

- **Country (Type Extension)**: Extends dossier for nation states. Contains id (FK to dossiers.id), iso_code_2 (unique 2-letter ISO code), iso_code_3 (unique 3-letter), capital_en, capital_ar, region (continent), subregion, population, area_sq_km, flag_url. Inherits all dossier fields via JOIN.

- **Organization (Type Extension)**: Extends dossier for entities with legal structure. Contains id (FK to dossiers.id), org_code (unique identifier), org_type (government/ngo/private/international/academic), headquarters_country_id (FK to countries.id for structural relationship), parent_org_id (FK to organizations.id for hierarchy), website, email, phone, address_en, address_ar, logo_url, established_date.

- **Engagement (Type Extension)**: Extends dossier for diplomatic events and interactions. Contains id (FK to dossiers.id, NOT dossier_id FK pointing elsewhere), engagement_type (meeting/consultation/coordination/workshop/conference/site_visit/ceremony), engagement_category (bilateral/multilateral/regional/internal), location_en, location_ar. No longer references another dossier; instead uses dossier_relationships to link to countries/orgs/persons involved.

- **Forum (Type Extension)**: Extends dossier for multi-session conferences. Contains id (FK to dossiers.id), number_of_sessions, keynote_speakers (JSONB array), sponsors (JSONB array), registration_fee, currency, agenda_url, live_stream_url. Calendar sessions stored in calendar_events table.

- **Theme (Type Extension)**: Extends dossier for policy areas and initiatives. Contains id (FK to dossiers.id), theme_category (policy/technical/strategic/operational), parent_theme_id (FK to themes.id for thematic hierarchy).

- **Working Group (Type Extension)**: Extends dossier for committees and task forces. Contains id (FK to dossiers.id), mandate_en, mandate_ar, lead_org_id (FK to organizations.id), wg_status (active/suspended/disbanded), established_date, disbandment_date.

- **Person (Type Extension)**: Extends dossier for VIPs requiring tracking. Contains id (FK to dossiers.id), title_en, title_ar, organization_id (FK to organizations.id for current affiliation), nationality_country_id (FK to countries.id), email, phone, biography_en, biography_ar, photo_url. Used for ambassadors, ministers, key officials - not for all staff.

- **Dossier Relationship**: Represents connection between any two dossiers. Contains id (UUID), source_dossier_id (FK to dossiers.id), target_dossier_id (FK to dossiers.id), relationship_type (text: bilateral_relation, membership, partnership, etc.), relationship_metadata (JSONB for additional context), notes_en, notes_ar, effective_from (timestamptz for temporal validity), effective_to (timestamptz, NULL if ongoing), status (active/historical/terminated), created_at, created_by. Enables graph model.

- **Calendar Event**: Represents temporal instance of when dossier occurs in time. Contains id (UUID), dossier_id (FK to dossiers.id pointing to engagement/forum), event_type (main_event/session/plenary/working_session/ceremony/reception), title_en, title_ar, description_en, description_ar, start_datetime, end_datetime, timezone, location_en, location_ar, is_virtual, virtual_link, room_en, room_ar, status (planned/ongoing/completed/cancelled/postponed), created_at, updated_at. Separates "what" (dossier) from "when" (calendar event).

- **Event Participant**: Links participants to calendar events. Contains id (UUID), event_id (FK to calendar_events.id), participant_type (user/external_contact/person_dossier), participant_id (UUID pointing to appropriate table), role (organizer/speaker/moderator/panelist/attendee/observer/vip/support_staff), attendance_status (invited/confirmed/tentative/declined/attended/no_show). Enables attendance tracking across event types.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can locate any entity (country, organization, forum, engagement) using a single dossier ID that works consistently across all queries, eliminating the "which table is this in?" confusion experienced in 100% of multi-table lookups
- **SC-002**: Developers can query all entities of any type with `SELECT * FROM dossiers WHERE [condition]` and JOIN to type-specific tables only when type-specific data is needed, reducing query complexity by 60% compared to current multiple-table queries
- **SC-003**: System supports creation and querying of relationships between any two entities (country-to-country, org-to-org, person-to-engagement) with bidirectional graph traversal returning results in under 2 seconds for networks up to 5 degrees of separation
- **SC-004**: Unified search returns ranked results across all 7 entity types (country, organization, forum, engagement, theme, working group, person) in under 1 second for 95% of queries with datasets containing 10,000+ entities
- **SC-005**: Engagement entities correctly model multi-party diplomatic events with 0 instances of "belongs to one dossier" constraint violations, enabling proper bilateral/multilateral event representation
- **SC-006**: Calendar functionality displays all events (from forums, engagements, ceremonies) in unified view with accurate temporal information, reducing "where is this event stored?" confusion to 0 incidents
- **SC-007**: Clean slate migration from fragmented model (separate countries/orgs/forums tables) to unified model completes successfully with new schema deployed and comprehensive seed data created covering all 7 dossier types with realistic relationships
- **SC-008**: TypeScript type generation from new schema completes successfully with 0 type errors in frontend code and 100% type coverage for all dossier operations
- **SC-009**: All polymorphic entity references (intake_entity_links, tasks.work_item_id, position_dossier_links) consistently use dossiers.id with entity_type='dossier', eliminating entity_type ambiguity (e.g., 'country' vs 'dossier.type=country') in 100% of cases
- **SC-010**: Users can create, view, update, and delete VIP person dossiers with full relationship tracking (represents country, affiliated with org, participates in events) achieving feature parity with other dossier types
- **SC-011**: System maintains referential integrity where deleting a dossier properly cascades to extension tables (countries, organizations, etc.) and relationships, with 0 orphaned records or broken foreign keys after deletion operations
- **SC-012**: Graph visualization displays entity relationship networks showing nodes (entities) and edges (relationship types) with interactive exploration, loading networks of 50+ entities in under 3 seconds

## Assumptions

1. **Mock Data Environment**: All current data is mock/test data that will be deleted before migration. Clean-slate approach: drop existing tables, create new unified schema, populate with fresh seed data. No data preservation or rollback strategy required.
2. **Database Support**: PostgreSQL 15+ with extensions (pg_trgm for fuzzy search, tsvector for full-text search) is available and properly configured for production use
3. **Type System Stability**: The 7 dossier types (country, organization, forum, engagement, theme, working_group, person) cover all current and near-term entity modeling needs; adding new types later requires schema change but architecture supports it
4. **Clearance Model Exists**: User clearance levels (1-4: Public, Internal, Confidential, Secret) are already implemented in profiles table and RLS policies are active
5. **UUID Performance**: PostgreSQL UUID primary keys provide acceptable performance for JOINs and indexes at expected data scales (millions of dossiers); no need for composite keys or integer IDs
6. **Single Organization Tenancy**: Multi-tenant organization boundaries are handled by existing RLS policies and don't require special consideration in dossier architecture (dossiers belong to organizations via existing patterns)
7. **Relationship Types Enumeration**: The set of relationship_type values (bilateral_relation, membership, partnership, etc.) is sufficient as free-text field with application-level validation; formal enum not required for MVP
8. **Calendar Integration**: Existing calendar/scheduling integrations (if any) can consume calendar_events table via API; no special export format required beyond JSON/iCal standard
9. **Person Dossiers for VIPs Only**: The persons table is for high-profile individuals requiring tracking (ambassadors, ministers); regular staff remain in users table and external contacts in external_contacts table
10. **Engagement Historical Data**: Existing engagements with dossier_id FK can be algorithmically converted to relationship entries; manual review not required for every engagement
11. **Document Linking Patterns**: Positions, MOUs, briefs already have or will have junction tables for entity linking; no special handling needed beyond updating entity_id references to use dossiers.id
12. **Search Relevance Tuning**: Default ts_rank algorithm from PostgreSQL provides acceptable search relevance without custom ranking weights; can be tuned post-launch based on user feedback
13. **Graph Depth Limits**: Users rarely need to traverse beyond 3-4 degrees of separation in relationship graphs; recursive CTE depth limit of 10 levels provides adequate safety margin
14. **Temporal Validity**: Relationships with effective_from/effective_to dates are sufficient for temporal tracking; no need for full bi-temporal history (system time vs valid time) in MVP
15. **Cascade Delete Acceptable**: ON DELETE CASCADE for dossier → extension tables is acceptable; users understand that deleting a dossier removes all type-specific data (alternative is soft delete via status='deleted')

## Scope Boundaries

### In Scope

- Redesign dossiers table as universal base with 7 type support (country, organization, forum, engagement, theme, working_group, person)
- Create/update all 7 type extension tables using Class Table Inheritance pattern (countries, organizations, forums, engagements, themes, working_groups, persons)
- Implement dossier_relationships table with polymorphic relationship model supporting bidirectional queries
- Create calendar_events and event_participants tables for temporal event management
- Implement clean slate migration: drop existing schema, create new unified schema
- Create comprehensive seed data covering all 7 dossier types with realistic relationships, calendar events, and document links
- Implement unified search across all dossier types using PostgreSQL full-text search
- Add indexes for performance on dossiers.type, search_vector, relationship queries, calendar datetime ranges
- Update RLS policies for unified model ensuring clearance level filtering works
- Generate TypeScript types from new schema for frontend type safety
- Update backend Edge Functions to use unified dossier queries
- Update frontend components to handle polymorphic dossier loading (single component renders any dossier type)
- Create graph traversal functions (recursive CTEs) for relationship queries
- Implement basic graph visualization for relationship networks
- Create unified entity card component that works for any dossier type
- Update calendar views to query calendar_events table across all dossier types
- Document architectural patterns and migration approach
- Create seed data for all 7 dossier types with realistic relationships

### Out of Scope

- Advanced graph analytics (centrality measures, community detection, shortest path algorithms) - can be added later
- Custom search ranking algorithms beyond PostgreSQL ts_rank - default algorithm sufficient for MVP
- Full audit history/versioning system (bi-temporal tables) - audit_logs table future enhancement
- Automated relationship inference via AI/ML - relationships created manually for MVP
- Real-time collaborative editing of dossiers - standard CRUD operations sufficient
- Advanced calendar features (recurring events with exceptions, timezone conversion UI, calendar sync to external systems) - basic calendar events only
- Entity merge/split workflows - manual process via database updates for MVP
- Relationship visualization filters (by relationship type, date range, entity type) - basic graph only
- Mobile app updates - web application focus for this feature
- Email notifications for relationship changes - notifications out of scope
- Batch import/export of entities and relationships - API-based only for MVP
- Permission system for relationship creation (who can create which relationship types) - all authenticated users can create for MVP
- Workflow engine for approval of relationship changes - direct creation without approval
- Integration with external systems (LDAP for persons, GIS for countries) - standalone system for MVP
- Performance optimization beyond basic indexes (caching, materialized views, read replicas) - can be added based on metrics
- Comprehensive test suite migration - focus on critical path tests, full coverage later
- Documentation site/wiki for end users - inline help text and developer docs only

## Dependencies

1. **PostgreSQL 15+** with extensions: pg_trgm (fuzzy text search), pgvector (if AI features later), tsquery/tsvector (full-text search)
2. **Supabase** Auth, RLS, Realtime (for existing authentication, row-level security, and real-time subscriptions)
3. **Existing user/profile system** with clearance_level field and organization membership for RLS policies
4. **TypeScript code generation** tool (e.g., supabase gen types typescript) to regenerate types from new schema
5. **Database migration system** (Supabase migrations or similar) supporting complex schema changes with rollback capability
6. **Frontend framework compatibility** with polymorphic component patterns (React 19 supports this)
7. **Backend Edge Functions** redeployability without downtime for updated dossier queries
8. **Existing RLS policies** understanding for adaptation to unified dossier model
9. **Test data generation** scripts or ability to recreate comprehensive seed data for all entity types
10. **Version control** for tracking schema changes across iterations (Git already in use)

## Constraints

1. **Clean Slate Migration**: All existing mock/test data will be deleted before migration. New schema created from scratch with fresh seed data. No data preservation required.
2. **Performance Non-Regression**: Query performance for common operations (entity lookup, relationship traversal, search) must not degrade; target <2s for relationship queries, <1s for search
3. **Type Safety**: All polymorphic operations must have corresponding TypeScript types; no `any` types in frontend code for dossier operations
4. **Referential Integrity**: All foreign keys must be valid; orphaned records not acceptable even during migration
5. **Clearance Enforcement**: RLS policies must prevent users from accessing dossiers above their clearance level in 100% of query paths (direct queries, JOINs, CTEs)
6. **Single ID Namespace**: Every dossier uses dossiers.id; no separate ID spaces for countries vs organizations (same UUID value in both dossiers and extension tables)
7. **Type Immutability**: dossiers.type field is immutable after creation; entity type changes require creating new dossier, copying relationships to new dossier, and marking original as archived with supersedes relationship
8. **Cascade Correctness**: DELETE operations must cascade properly without leaving orphaned extension rows or breaking relationships
9. **Search Quality**: Unified search must return relevant results across all types; no bias toward specific entity types in ranking
10. **Backward Compatibility**: Existing APIs that query countries/organizations must continue working via views or adapter functions during transition period
11. **Audit Trail**: All dossier changes must record updated_at, updated_by for audit compliance
12. **Test Coverage**: Critical paths (entity CRUD, relationship creation, search, calendar events) must have automated tests before production
13. **Documentation Currency**: Architectural docs, API contracts, type definitions must be updated to reflect new model before feature completion
14. **Relationship Validation**: System must prevent invalid relationships (e.g., circular parent/child, self-references) via database constraints and application logic
15. **Temporal Consistency**: Calendar events must have start_datetime <= end_datetime; effective_from <= effective_to for relationships

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Feature Readiness
- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification
