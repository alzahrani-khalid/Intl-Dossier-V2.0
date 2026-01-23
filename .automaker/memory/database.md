---
tags: [database]
summary: database implementation decisions and patterns
relevantTo: [database]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 5
  referenced: 5
  successfulFeatures: 5
---

# database

### Used PostgreSQL advisory locks (pg_advisory_xact_lock) instead of FOR UPDATE for optimistic concurrency control in append_event function (2026-01-13)

- **Context:** Need to prevent duplicate aggregate versions when concurrent events are appended to the same entity
- **Why:** Advisory locks avoid table-level locks and deadlocks. FOR UPDATE on domain_events table would lock all rows being scanned, causing contention. Advisory locks use a hash of (aggregate_type + aggregate_id) as key - locks only that aggregate, not the entire table. Transaction-scoped (xact_lock) ensures lock is held only for the duration needed to increment version
- **Rejected:** FOR UPDATE clause which creates row-level locks on all matching rows; pessimistic locking with explicit lock tables; application-level UUID-based concurrency
- **Trade-offs:** Advisory locks are harder to reason about (invisible to standard monitoring) but provide better concurrency than pessimistic approaches. Requires careful key design (must hash aggregate identifier consistently). No blocking UI feedback - optimistic approach assumes conflicts are rare
- **Breaking if changed:** Removing advisory locks reverts to race conditions where concurrent events increment from same base version, corrupting aggregate version sequence. This silently creates invalid state where event N and N+1 both exist - downstream rebuild_aggregate_state will apply both incorrectly

#### [Pattern] Immutable append-only event log with separate snapshot table for state reconstruction optimization (2026-01-13)

- **Problem solved:** Event sourcing requires audit trail of all changes, but replaying thousands of events for each state query becomes expensive
- **Why this works:** Events are write-once, never updated/deleted - this enables temporal queries, audit guarantees, and prevents accidental data corruption. Snapshots store pre-computed state at specific versions - can skip replaying old events. rebuild_aggregate_state checks for snapshots first before replaying from beginning. This is event sourcing's fundamental pattern: immutability for correctness + snapshots for performance
- **Trade-offs:** More disk space and query complexity, but gains: temporal correctness, audit compliance, time-travel queries, ability to backfill/replay events. Snapshots add maintenance burden (when to create, how to validate, stale snapshot detection) but solve the 'event log gets too long' problem

#### [Gotcha] Idempotency keys must use 24-hour expiration with separate table, not just UUID deduplication in events table (2026-01-13)

- **Situation:** During implementation, could use unique constraint on (aggregate_id, idempotency_key) or store idempotency_key in domain_events. Testing showed this insufficient for client retries across sessions
- **Root cause:** Client may retry same request (with same idempotency_key) hours later. If key is stored in domain_events forever, and user deletes all events for testing, the idempotency check fails. Separate idempotency_keys table with TTL ensures: (1) expired keys allow new events with old keys, (2) cleanup is automatic, (3) failed inserts don't create orphaned keys
- **How to avoid:** Requires extra table and TTL cleanup (Postgres job_scheduler), but provides correct semantic: 'prevent duplicate within timeframe' not 'prevent duplicate forever'. Slightly slower writes (extra insert to idempotency_keys table), but idempotency is correctness-critical

#### [Pattern] Comprehensive event metadata (actor_id, correlation_id, causation_id, source, metadata JSONB) stored in every event for traceability and workflow orchestration (2026-01-13)

- **Problem solved:** Event sourcing needs to track not just what changed, but who changed it, how it relates to other changes, and why it happened
- **Why this works:** This enables: (1) Audit compliance - actor_id tracks who made change, (2) Sagas/Workflows - correlation_id links related events across aggregates (person created → engagement created → task assigned all have same correlation_id), (3) Debugging - source field marks if event came from API, webhook, migration, test, (4) Integration - metadata JSONB is extensible for domain-specific tracing without schema changes. Causation_id creates event causality chain: if event B was caused by event A, B.causation_id = A.id
- **Trade-offs:** Larger row size (more disk/network), slower inserts (more columns to populate), but gains: queryability (can SELECT \* FROM events WHERE actor_id = ?), auditability (regulators/investigators need this), debuggability (can trace request across system using correlation_id)

#### [Gotcha] rebuild_aggregate_state with version parameter requires careful semantics: version is 'what is the state AFTER this event version', not 'at this timestamp' (2026-01-13)

- **Situation:** Implementing time-travel queries - client may ask for 'state as of version 1' or 'state as of timestamp T', these are different queries with different performance profiles
- **Root cause:** Event versions are strictly sequential integers (1, 2, 3...), timestamps are approximate (can have multiple events in same millisecond). rebuild_aggregate_state(type, id, version=1) means 'apply events 1 through 1, return final state' - event 2+ are ignored. This is fast (stop replaying when version reached). Timestamp-based queries require scanning all events, finding those <= timestamp, then applying in order - slower but gives point-in-time snapshots
- **How to avoid:** Two separate query patterns (/state?version=1 vs /state/at-time?timestamp=...) to learn, but each is optimized for its use case. Version-based is fast (exact cutoff), timestamp-based is slower (full scan) but closer to user thinking

### Implemented tenant context as PostgreSQL session variables (set_config) rather than application-level thread-local storage (2026-01-13)

- **Context:** Multi-tenant data isolation requires tenant context to be available at database query time for RLS policies to evaluate correctly
- **Why:** Session variables survive across connection pooling and async contexts, ensuring RLS policies always have correct tenant context. Application-level storage would require manual parameter passing through all repository methods
- **Rejected:** Application-level context (thread-local or request-scoped): would require modifying all repository methods to accept and pass tenant_id explicitly, breaking abstraction
- **Trade-offs:** Gained: automatic RLS enforcement without code changes. Lost: tenant context less visible in application code
- **Breaking if changed:** Removing this would require manually filtering all queries by tenant_id at application layer, defeating RLS benefits

### Created universal RLS policy helpers (rls_select_policy, rls_insert_policy, etc) that accept policy logic as parameters rather than hardcoding tenant_id checks (2026-01-13)

- **Context:** Multiple tables need RLS with similar tenant isolation logic but different business rules
- **Why:** Parameterized policies reduce code duplication and ensure consistent tenant checking. If tenant context mechanism changes, only helpers need updating
- **Rejected:** Hardcoded RLS policies per table: would scatter tenant context logic across database, making it hard to maintain or audit
- **Trade-offs:** Gained: maintainability and consistency. Lost: slightly more complex policy definitions
- **Breaking if changed:** Removing these helpers would scatter tenant context enforcement across RLS policies, making audit and changes difficult

#### [Gotcha] Read model tables remain empty after schema creation until existing data is explicitly synced via trigger execution or backfill job - tests must handle empty resultsets gracefully (2026-01-13)

- **Situation:** Created read_models schema with tables and functions, but the one-way sync (write→read) only triggers on NEW writes. Existing dossiers/relationships/events have no corresponding read model entries
- **Root cause:** CQRS projections are built incrementally from events. Without backfilling, queries return empty results even though source data exists. This is correct behavior for event sourcing but breaks expectations for tests expecting data to be immediately available
- **How to avoid:** Empty read models on deploy is correct (events are source of truth), but requires explicit backfill step before read models provide value. Documentation and tests must reflect this

### SuperbaseAdapter provides utilities (column name mapping, value conversion) rather than auto-generating queries (2026-01-13)

- **Context:** Needed bridge between strongly-typed specification objects and weakly-typed Postgrest query builder API
- **Why:** Explicit mappings catch schema mismatches early. Type safety preserved in specification layer, conversion layer is thin and testable. Avoids reflection/naming conventions that silently fail
- **Rejected:** Convention-based column name mapping (camelCase -> snake_case); automatic type coercion
- **Trade-offs:** More boilerplate in adapter, but explicitness means 'column X not found' fails loudly instead of silently filtering wrong data
- **Breaking if changed:** If database schema columns are renamed, toSupabaseFilter() must be updated - but breaking change is immediate and obvious

### Implemented separate junction table (saved_search_shares) instead of JSON array field for team sharing permissions (2026-01-13)

- **Context:** Needed to support granular permission levels (view/edit/admin) with audit trail for team collaboration on saved searches
- **Why:** Relational approach enables query-time filtering by permission level, easier RLS policies per permission type, and supports tracking share history. JSON would require application-layer permission checks and make revoke operations complex
- **Rejected:** JSONB array in saved_searches table with permissions nested - would couple permission logic to storage and complicate RLS policies that need to filter by specific permission types
- **Trade-offs:** Slight increase in query joins but massive simplification of permission logic. RLS policies can now directly check share table instead of JSON extraction in WHERE clause
- **Breaking if changed:** Changing to JSONB would require rewriting all share-related RLS policies and moving permission validation from database to application layer, losing database-enforced consistency

#### [Gotcha] Smart filters stored as search_templates rows rather than computed views or separate smart_filters table (2026-01-13)

- **Situation:** System needed 8 predefined 'intelligent' filters that apply complex criteria (e.g., 'High Priority Cases', 'Due Soon', 'Unassigned')
- **Root cause:** Using search_templates table allows reusing existing query infrastructure, reduces schema sprawl, and makes smart filters behave identically to user-saved searches for UI consistency. Pre-populated rows marked with is_smart_filter flag
- **How to avoid:** Treats smart filters as data rather than schema constructs (simpler to modify), but requires application code to understand the is_smart_filter flag semantics

#### [Pattern] Used RLS policies with user_id check + helper functions (is_watchlist_owner) rather than relying on session context alone (2026-01-13)

- **Problem solved:** Securing watchlist data access in multi-tenant SaaS environment
- **Why this works:** RLS policies enforce security at database layer (cannot be bypassed), helper functions make policy intent explicit and testable. Row-level isolation is guaranteed regardless of API bugs.
- **Trade-offs:** More database-level code to maintain but security guarantees become database-enforced rather than application-dependent

### PostgreSQL trigger automatically records field changes instead of application-level change tracking (2026-01-13)

- **Context:** Need to ensure all field changes are captured regardless of how data is modified (API, direct SQL, migrations)
- **Why:** Database triggers provide enforcement at the source - changes cannot bypass history tracking even if application code is compromised or modified. Eliminates requirement for careful instrumentation across all mutation code paths
- **Rejected:** Application-level change tracking in hooks/mutations - fragile, easy to forget in new mutation endpoints, vulnerable to direct DB modifications
- **Trade-offs:** Harder to test in isolation without triggering DB side effects, but gains auditability and compliance-critical reliability. Requires understanding trigger mechanics
- **Breaking if changed:** Removing triggers means field changes go unrecorded; requires migrating to application-level tracking with risk of gaps

#### [Gotcha] User favorite/recent templates tracked in separate tables (user_favorite_templates, user_recent_templates) instead of columns on templates table (2026-01-13)

- **Situation:** Template usage varies per user - same template can be favorite for user A but not user B
- **Root cause:** Separates template definitions (immutable system data) from user state (mutable per-user data). Enables efficient RLS policies and prevents circular dependencies
- **How to avoid:** More tables but cleaner separation of concerns. Queries need joins but RLS policies are simpler

#### [Pattern] System templates seeded in migration with tag associations via junction table rather than tags stored as JSONB array in templates row (2026-01-13)

- **Problem solved:** Templates have searchable/filterable tags (quick-entry, favorite, productivity, etc.)
- **Why this works:** Junction table allows efficient filtering (WHERE tag IN (...)) and indexing. JSONB tags would require expensive CONTAINS operators. Enables tagging as first-class feature
- **Trade-offs:** Extra join in queries but much better query performance for large template sets and complex filtering

#### [Pattern] Similarity scoring implemented as separate SQL functions (calculate_name_similarity, calculate_email_similarity, calculate_phone_similarity) with composable person/organization-level functions, rather than monolithic matching logic (2026-01-13)

- **Problem solved:** Cross-entity duplicate detection requires field-level fuzzy matching with field-specific algorithms
- **Why this works:** Modular function design allows: (1) reusing field matchers across entity types, (2) tuning weights per field independently, (3) testing each scoring function in isolation, (4) extending with new entity types by composing existing matchers
- **Trade-offs:** Easier: Maintainability, testability, extensibility. Harder: More SQL functions to manage, potentially more function call overhead (negligible in practice)

#### [Gotcha] Merge functions (merge_duplicate_persons, merge_duplicate_organizations) preserve relationships by duplicating foreign key references to both source and target entities before deletion, rather than updating foreign keys to point to merged entity (2026-01-13)

- **Situation:** Standard approach would be to UPDATE all foreign key references to point to the surviving entity, but this risks orphaning relationships if deletion fails
- **Root cause:** Two-phase approach (duplicate references, then delete source) reduces transaction scope and makes rollback safer. Relationship duplication is idempotent; update+delete would require coordinating multiple tables with potential locking issues
- **How to avoid:** Easier: Transaction safety, easier rollback. Harder: Duplicate relationship data temporarily exists, requires cleanup; increased storage during merge operations

### Polymorphic attendees design using union type (user | person_dossier | external_contact | organization) stored via jsonb with type discriminator (2026-01-13)

- **Context:** Meeting attendees can be internal users, dossier contacts, external contacts, or organizations - need to link to different tables without creating multiple nullable foreign keys
- **Why:** Avoids creating 4 separate nullable foreign key columns (user_id, person_dossier_id, external_contact_id, organization_id). Single jsonb column with type discriminator is more maintainable and queryable via generated columns. Allows flexible attendee types without schema migration
- **Rejected:** Multiple nullable FK columns would bloat schema and make queries verbose with COALESCE. EAV pattern would lose referential integrity
- **Trade-offs:** More flexible but requires application-layer type validation and careful jsonb querying. Harder to enforce FK constraints at database level. Better scalability for future attendee types
- **Breaking if changed:** Removing polymorphism requires migrating all attendee records to a single FK column, losing type information and potentially breaking queries that depend on type discriminator

### Action item extraction stores confidence_score and ai_model metadata, making extraction metadata first-class data instead of annotation (2026-01-13)

- **Context:** AI extracts action items from meeting minutes text, but extraction quality varies - need to track which items are AI-generated and how confident
- **Why:** Allows UI to visually differentiate AI-extracted vs manually-added items. Enables sorting by confidence. Future ML training can use score feedback. Not treated as hidden metadata
- **Rejected:** Storing only extraction text loses confidence data, forcing UI to treat all items as equally trusted. Separate audit table would fragment related data
- **Trade-offs:** More columns but better transparency. UI can show confidence scores and let users correct low-confidence extractions. Creates audit trail of AI quality
- **Breaking if changed:** Removing confidence_score loses ability to track extraction quality over time and UI loses ability to highlight uncertain items

#### [Pattern] Report data persisted as JSONB with nested key_findings and recommendations arrays rather than separate junction tables (2026-01-14)

- **Problem solved:** Stakeholder analysis reports contain variable-length findings and recommendations that need to be retrieved together without joins
- **Why this works:** Reduces query complexity for analytical reports; JSONB allows flexible schema evolution for recommendation structure; findings and recommendations are report-specific metadata not shared across reports
- **Trade-offs:** Easier to store and retrieve report data (fewer joins); harder to query/aggregate findings across multiple reports; slightly larger storage footprint due to JSONB overhead

#### [Pattern] Scenario sandbox uses enum types (ENGAGEMENT, STAKEHOLDER, FINANCIAL, etc.) for variable types and snapshot enums for outcome impact levels, with PostgreSQL constraints enforcing valid values at database level. (2026-01-14)

- **Problem solved:** Need to ensure only specific variable types and impact levels are stored while keeping validation consistent across API and client
- **Why this works:** Database-level enum constraints provide single source of truth preventing invalid data at storage layer. Reduces need for client-side and API validation duplication.
- **Trade-offs:** Enum migration is harder (requires ALTER TYPE in PostgreSQL) vs. simpler text changes. Gains type safety and database integrity at cost of schema flexibility.

### Used IndexedDB with 7-day TTL for form draft persistence instead of localStorage or backend storage (2026-01-14)

- **Context:** Needed to persist multi-step form progress across page refreshes without constant server round-trips
- **Why:** IndexedDB provides larger storage quota (~50MB vs 5-10MB for localStorage), supports structured queries, and automatic expiration via TTL indexes. Avoids backend load for temporary drafts while maintaining offline-first capability
- **Rejected:** localStorage (too small for large forms), sessionStorage (lost on close), server-side persistence (latency + cost for temporary data)
- **Trade-offs:** More complex API than localStorage but better for large form payloads; automatic TTL cleanup reduces storage bloat; trade complexity for scalability
- **Breaking if changed:** Changing to localStorage would lose ability to persist large multi-step forms; changing to server-side would require network connectivity; removing TTL would cause storage bloat

### Automatic permission delegation on access request approval via trigger rather than application logic (2026-01-14)

- **Context:** When a user approves an access request, the requested permission must be granted to the requester. Could be handled in API endpoint or database trigger.
- **Why:** Database trigger ensures atomicity - if approval succeeds, permission is guaranteed to be granted. Prevents race conditions where API crash between approval and permission grant leaves user in limbo state. Single source of truth in database.
- **Rejected:** Application-level delegation: separate API calls to update request status then grant permission creates window where request shows approved but permission missing
- **Trade-offs:** Easier: guaranteed consistency, one atomic operation. Harder: debugging requires understanding trigger logic, less visible in application code
- **Breaking if changed:** If trigger is removed, approving access requests becomes a two-step unreliable process - approval stored but permission not granted

#### [Pattern] Extended single preferences table with 10 new boolean/config columns rather than creating separate junction table for digest preferences (2026-01-15)

- **Problem solved:** Email digest feature needed to store 7 content type toggles plus 3 config values (lookahead, max items, time) per user
- **Why this works:** Digest preferences are user-level configuration, not many-to-many relationships; avoids JOIN complexity for common read patterns; simpler migration path
- **Trade-offs:** Easier to implement and query, but schema becomes wider; minimal practical impact since one row per user; future schema redesign harder

### Used JSONB for layout_config and individual field configurations (source_config, display_config, visibility_rules) rather than normalized tables for each configuration type (2026-01-15)

- **Context:** Needed to store flexible, schema-less preview layout configurations that vary significantly by entity type and field type
- **Why:** JSONB provides runtime flexibility without schema migrations when adding new configuration options. Normalizing these would require new tables for each config type and complex joins. Preview layouts are read-heavy (many queries) but write-light (admin UI only), making denormalization acceptable
- **Rejected:** Fully normalized approach with separate tables for source_config, display_config, visibility_rules - would require 3 additional junction tables and expensive joins on read path
- **Trade-offs:** Easier: Adding new config types without migrations. Harder: Querying/filtering on specific config values requires JSON operators; loses some query optimization benefits
- **Breaking if changed:** Switching to normalized storage would require migrating JSONB data to relational structure and rewriting all read queries to use multiple JOINs instead of JSON aggregation

#### [Gotcha] Type mismatch between function return type declarations (VARCHAR(200)) and actual column types (TEXT) caused silent failures in Supabase RPC execution (2026-01-15)

- **Situation:** Function get_entity_layouts declared name_en/name_ar as VARCHAR(200) in RETURNS TABLE but selected from columns typed as TEXT
- **Root cause:** PostgreSQL type coercion in function returns doesn't fail loudly - it just silently casts or skips results. This is especially insidious in RPC functions where errors surface as empty result sets rather than exceptions
- **How to avoid:** Easier: To debug by strictly matching return type declarations to actual column types. Harder: Functions fail silently making root cause analysis difficult

#### [Gotcha] Ambiguous column references in CTE with multiple tables having same column names (epl.id, plf.id) caused query to fail silently when aggregating without explicit GROUP BY (2026-01-15)

- **Situation:** In get_preview_layout function, used COALESCE with jsonb_agg without properly grouping by all non-aggregated columns from the epl table
- **Root cause:** PostgreSQL allows this syntax but results in undefined behavior - aggregation doesn't know which rows to group together. This is a common mistake with LEFT JOIN + aggregation patterns
- **How to avoid:** Easier: Adding explicit GROUP BY clauses. Harder: Debugging aggregate function behavior without explicit grouping

#### [Pattern] Used specialized ENUM types (preview_entity_type, preview_context, preview_field_type) instead of VARCHAR with CHECK constraints for preview layout domains (2026-01-15)

- **Problem solved:** Preview layouts need to support fixed sets of entity types (dossier, contact, etc.), contexts (hover, modal, etc.), and field types
- **Why this works:** ENUMs provide database-enforced cardinality, better storage efficiency (1 byte vs variable length), type safety in functions, and prevent invalid values at insert time. This is better than CHECK constraints for fixed domains that don't change frequently
- **Trade-offs:** Easier: Type validation, compact storage, function signatures reflect domain. Harder: Adding new values requires ALTER TYPE (DDL), can't easily remove values

### Separate RPC functions for each suggestion type (co_event, organization, hierarchy, affiliation) instead of single monolithic function (2026-01-15)

- **Context:** Generating relationship suggestions from multiple data sources with different query logic
- **Why:** Allows independent optimization, testing, and selective caching of each suggestion type. Frontend can request only needed types to reduce payload and computation cost
- **Rejected:** Single RPC function with all logic would require fetching all data regardless of user needs, making it harder to implement selective suggestion types
- **Trade-offs:** More RPC calls but each is faster; `generate_all_relationship_suggestions` aggregates them with parallel execution via Supabase
- **Breaking if changed:** Removing this separation would require major refactor of Edge Function logic and lose ability to request specific suggestion types independently

#### [Pattern] Using RPC functions with aggregation (json_agg) to generate suggestions from related entities, with filtering to exclude already-added members (2026-01-15)

- **Problem solved:** Need to suggest potential working group members based on lead organization affiliations without creating N+1 queries or exposing raw joins
- **Why this works:** Supabase RPC functions execute server-side, reducing data transfer and allowing complex business logic (relationship traversal, filtering by existing members) in a single query. json_agg prevents client-side processing of potentially large result sets
- **Trade-offs:** RPC functions are less flexible than client libraries for ad-hoc changes, but provide performance and security boundaries. Requires database function deployment in schema migrations

#### [Gotcha] SQL function column references must match exact column names (name_en vs name, engagement_type vs type). Function fails silently if columns don't exist in source table (2026-01-15)

- **Situation:** Initial RPC function returned empty results despite data existing in database
- **Root cause:** PostgreSQL functions referencing non-existent columns don't error clearly; they return null which cascades through json_agg, collapsing results. Requires careful schema validation
- **How to avoid:** Requires schema documentation/validation step, but prevents silent failures. Runtime SQL checks (SELECT \* from table) catch issues during testing

### Created bilingual enum types at the database level (commitment_deliverable_type, commitment_deliverable_status) rather than storing enum values as strings (2026-01-15)

- **Context:** Supporting both English and Arabic languages for deliverable types and statuses across the system
- **Why:** Database-level enums enforce data integrity and consistency across all applications. Bilingual support requires semantic meaning at storage layer, not just UI translation layer. The enum values themselves don't change by language - only their display labels do
- **Rejected:** Storing enum values as TEXT and translating only in UI/frontend. This would allow inconsistent values in database and make queries fragile
- **Trade-offs:** Easier: Query consistency and type safety. Harder: Requires database migration if enum values change; less flexibility for custom deliverable types without database changes
- **Breaking if changed:** Removing enums would require adding a new 'type' column or refactoring existing data; existing queries depend on enum constraints

#### [Pattern] Implemented calculate_commitment_progress() as a PostgreSQL function that computes weighted progress based on deliverable statuses and timestamps (2026-01-15)

- **Problem solved:** Need to track commitment progress based on milestone completion without constantly querying frontend
- **Why this works:** Centralizing progress calculation logic in database ensures consistency across all clients and eliminates network round-trips. The function is reusable for APIs, reports, and can be indexed/cached at database level. Weighted calculation (in_progress counts as 50%) prevents false optimism on incomplete work
- **Trade-offs:** Easier: Single source of truth, efficient queries. Harder: Database logic is harder to test and version control than application code

### Created separate tracking tables for tokens (bot_workspace_connections, bot_user_links) and audit logs (bot_command_logs, bot_notification_deliveries) (2026-01-15)

- **Context:** Need to track OAuth tokens, user-workspace mappings, command audit trails, and notification delivery status
- **Why:** Separates sensitive credentials from audit/operational data with different access patterns; command/delivery logs are write-heavy append-only while token tables are read-heavy with infrequent updates
- **Rejected:** Single table would couple credential rotation with audit trail management, making backup/cleanup operations dangerous
- **Trade-offs:** More tables to join but better schema isolation; easier to implement separate retention policies (delete old logs, keep tokens longer)
- **Breaking if changed:** Removing bot_command_logs or bot_notification_deliveries breaks audit compliance and delivery debugging; removing token tables breaks OAuth and workspace state

#### [Gotcha] Migration audit trigger must be created AFTER seed data insertion, not before (2026-01-15)

- **Situation:** Initial migration failed with 'auth.uid() is NULL' error when audit trigger tried to fire during seed data insert
- **Root cause:** The audit trigger references auth.uid() to track which user made changes. During migration seed data (before any user is authenticated), auth.uid() is NULL, causing constraint violations. Seed data must be inserted without the trigger active.
- **How to avoid:** Requires careful ordering of migration operations. Trade-off between having audit trail completeness vs. reliable data seeding. Chose reliability of initial data load.

### Use ENUM types for field_permission_action, field_permission_scope, and field_permission_entity_type (2026-01-15)

- **Context:** Needed to enforce valid values for permission actions (VIEW, EDIT, DELETE), scopes (SELF, SAME_ORGANIZATION, ALL), and entity types
- **Why:** ENUMs provide database-level validation that's impossible to violate at the SQL layer. More efficient than CHECK constraints (built into type system). Self-documenting for database schema.
- **Rejected:** VARCHAR with CHECK constraints - allows adding new values requires ALTER TABLE. String values in application layer - loses database validation layer.
- **Trade-offs:** Adding new action/scope requires migration. Slightly less flexible than strings. But prevents invalid data from ever entering database regardless of application bugs.
- **Breaking if changed:** If ENUMs are removed in favor of VARCHAR, permission system becomes vulnerable to invalid values being stored that application doesn't handle

### Normalized agenda structure with separate agenda_items table instead of storing items as JSON array in meeting_agendas (2026-01-15)

- **Context:** Meeting agendas contain variable number of topics/items that need individual timestamps, status tracking, and presenter assignment
- **Why:** Allows querying and updating individual items independently, supports reordering without touching parent record, enables RLS policies per item, prevents race conditions on item updates
- **Rejected:** JSONB array of items would be simpler but prevents granular updates and makes concurrent edits problematic
- **Trade-offs:** More joins required in queries but gains normalization benefits; slightly more complex schema but significantly better concurrency handling
- **Breaking if changed:** Item-level RLS policies, individual item mutations, and reordering logic all depend on separate table structure

### Created agenda_timing_snapshots table for historical tracking instead of recording timing in agenda_items.actual_duration only (2026-01-15)

- **Context:** Need to track how time was spent during meeting execution - actual vs planned durations for each item
- **Why:** Snapshots capture complete state at specific moments, enabling analytics on how meetings drift from plan; allows auditing of when items started/ended; supports meeting duration analytics
- **Rejected:** Just storing final actual_duration loses granularity and prevents understanding execution timeline
- **Trade-offs:** Additional storage and complexity, but gains complete audit trail and timing analytics capabilities
- **Breaking if changed:** Timing tracker UI and analytics queries depend on snapshot history; real-time updates must write snapshots at transitions

#### [Gotcha] agenda_items.sequence field used for ordering instead of relying on insertion order or separate position column (2026-01-15)

- **Situation:** Items can be reordered after creation; need reliable sort order persisted in database
- **Root cause:** Explicit sequence field survives app restarts and browser refreshes; reorder operation updates single field not array
- **How to avoid:** One extra column but prevents off-by-one errors and makes gaps in sequence obvious for debugging

#### [Gotcha] RLS policies using organization_members table reference instead of direct organization columns (2026-01-15)

- **Situation:** Timeline data needs organization-level isolation but stakeholder_interactions table doesn't have direct org_id column
- **Root cause:** Joining through `people` → `organization_members` for RLS policies is necessary because the table structure doesn't denormalize org_id. However, this creates implicit dependencies: if organization_members doesn't have the person, queries fail silently.
- **How to avoid:** Eliminates data redundancy but makes RLS policy dependencies non-obvious. A future developer might delete organization_members entries without realizing it breaks timeline visibility.

### Used PostgreSQL BFS traversal in compute_entity_dependencies() function rather than application-layer graph traversal (2026-01-15)

- **Context:** Need to analyze transitive dependencies across multiple entity types (countries, organizations, relationships)
- **Why:** Pushes computational work to database where it can be optimized with indexes, avoids N+1 queries, reduces network overhead for large dependency graphs. Single source of truth for dependency logic.
- **Rejected:** Application-layer recursive traversal or caching dependency chains in a separate application service
- **Trade-offs:** Easier: single authoritative computation, better performance at scale. Harder: complex SQL debugging, version control of schema logic, testing requires database setup
- **Breaking if changed:** Moving dependency logic to application layer would require significant refactoring of Edge Functions, impact caching would become inconsistent, client code would need graph traversal library

### Created entity_dependency_snapshots table as materialized cache rather than computing dependencies on-demand (2026-01-15)

- **Context:** Dependency graphs needed for visualization and reports frequently, computation is expensive (BFS traversal)
- **Why:** Snapshots enable fast reads, reduce database load, provide version history of dependency state, can be refreshed on a schedule or on-change
- **Rejected:** Pure on-demand computation, Redis caching of graphs
- **Trade-offs:** Easier: fast reads, audit trail, works if database offline. Harder: snapshot staleness, refresh complexity, storage overhead
- **Breaking if changed:** Removing snapshots would make graph queries slow, lose historical dependency state, require caching infrastructure outside database

#### [Gotcha] RLS policy with self-referential joins causes infinite recursion when evaluating authorization checks (2026-01-15)

- **Situation:** Initial RLS policy on report_schedules joined back to custom_reports table to check ownership, causing Supabase to recursively evaluate policies
- **Root cause:** RLS policies are evaluated for every row access; nested joins that trigger additional policy checks create circular dependencies
- **How to avoid:** Moved data consistency checks to application layer (query-time validation) instead of RLS; simpler RLS but requires client-side enforcement
