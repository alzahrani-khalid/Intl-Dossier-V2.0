---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 6
  referenced: 6
  successfulFeatures: 6
---

# api

### Edge Function endpoints separated into specific concern routes: /events (append), /events/correlated (cross-aggregate), /state (rebuild), /state/at-time (time-travel), /history (timeline), /snapshots, /stats (2026-01-13)

- **Context:** Event store API needs to support multiple query patterns: fetch events, rebuild state, time-travel, find related events, manage snapshots
- **Why:** Separates concerns and enables different caching strategies: /events can use long TTL (immutable), /state should bypass cache (always fresh), /state/at-time is expensive (run only when needed). Explicit endpoints surface the cost model (time-travel is slower) vs single GET /events?query_type=xyz which hides complexity. Makes it clear to client developers which queries are expensive
- **Rejected:** Single /events endpoint with query parameters (query_type, version, time, rebuild=true) - hides performance implications, hard to document caching behavior; GraphQL with complex query language (overkill, requires different client library)
- **Trade-offs:** More endpoints to document/maintain, but: clearer cost model for clients, easier to add rate limiting per endpoint (rebuild is more expensive), easier to change implementation of one query pattern without affecting others
- **Breaking if changed:** Collapsing into single endpoint makes it hard to reason about caching - /state/at-time called weekly will hammer database with expensive queries unless explicitly documented as non-cacheable

### Query keys generated through factory functions (engagementKeys.list, relationshipKeys.detail) instead of string literals scattered throughout (2026-01-13)

- **Context:** TanStack Query caching requires consistent keys, but string literals cause invalidation bugs when keys don't match
- **Why:** Factory functions enforce consistent key structure. Type-safety guarantees all parameters are included in key. Single source of truth prevents cache misses when invalidating
- **Rejected:** String literals throughout codebase (keys drift apart, invalidation fails), global constants (less flexible for parameters)
- **Trade-offs:** Requires defining factory for each query, but prevents cache bugs. Keys become self-documenting through function names
- **Breaking if changed:** If key factory changes structure, all existing cached data becomes orphaned and won't be found. Users see stale data until manual invalidation

#### [Pattern] Tenant context passed via custom HTTP headers (X-Tenant-ID) rather than embedded in request body or JWT claims (2026-01-13)

- **Problem solved:** Frontend needs to send tenant context to backend for cross-tenant requests or explicit tenant switching
- **Why this works:** Headers allow tenant context separate from authentication. Easier to switch tenants without creating new tokens. Doesn't bloat JWT payload
- **Trade-offs:** Gained: flexible tenant switching. Lost: requires middleware to validate header matches user's tenant membership

### Created separate RPC functions (get_saved_search_access, check_alert_permissions) instead of embedding permission checks in main CRUD procedures (2026-01-13)

- **Context:** System required granular permission validation for shares (view/edit/admin levels) and alert management across multiple endpoints
- **Why:** Separated concerns make RLS policies testable independently, allow reuse across multiple endpoints, and prevent logic duplication. Edge function can call specific permission functions and short-circuit on failure
- **Rejected:** Embedding permission logic in main CRUD functions - leads to duplicated WHERE clauses and tightly couples authorization to mutation logic, making permission changes require touching multiple functions
- **Trade-offs:** Additional function calls add minimal latency but provide clear separation of concerns. Makes it obvious which operations need which permissions
- **Breaking if changed:** Removing these helper functions would require rewriting RLS policies or duplicating permission checks in application code, losing single source of truth for access control

#### [Gotcha] Watchlist_events table grew large requiring pagination strategy, but initial implementation was missing filtering optimization (2026-01-13)

- **Situation:** Recording audit events for every watchlist change creates high volume table
- **Root cause:** Need audit trail for compliance/debugging, but querying unfiltered events becomes slow. Requires indexed filtering by entity_id and timestamp.
- **How to avoid:** Storage cost and query complexity vs audit trail completeness. Need to balance event retention policies.

### Watchlist API uses single endpoint with method-based routing (GET for list/check, POST for add/toggle, PATCH for settings, DELETE for remove) instead of separate endpoints (2026-01-13)

- **Context:** Multiple related operations (add, remove, toggle, settings) all operating on same user_watchlist resource
- **Why:** Single endpoint concentrates business logic and RLS policy enforcement in one place. Easier to manage transaction boundaries and audit events. Reduces endpoint proliferation.
- **Rejected:** RESTful /watchlist/:id GET/POST/PATCH/DELETE pattern would split logic across functions and make bulk operations harder
- **Trade-offs:** Less RESTful but more pragmatic for complex operations. Easier to coordinate multiple entities in single request.
- **Breaking if changed:** Splitting into separate endpoints requires duplicating RLS enforcement and making bulk operations multi-step transactions

#### [Gotcha] Import path mismatch between package conventions: expected `@/lib/supabase` but mistakenly used `@/lib/supabaseClient` (2026-01-13)

- **Situation:** Created hook with wrong import path causing 404 at runtime when component tried to load Supabase client
- **Root cause:** Package follows naming convention of `supabase.ts` not `supabaseClient.ts` - naming inference failed during implementation
- **How to avoid:** Cost: feature broken until caught by testing. Benefit of catching it: revealed need for import convention documentation or linting

### Track template usage via RPC function call (track_template_usage) rather than automatic trigger on INSERT to user_recent_templates (2026-01-13)

- **Context:** Recording when a user applies/uses a template for the recent templates list
- **Why:** Explicit function call gives control over when tracking happens - only on successful template application, not on every query. Clearer intent and easier to add validation/logging
- **Rejected:** Trigger on UPDATE/INSERT would auto-track but couldn't distinguish accidental access from intentional usage
- **Trade-offs:** Client must remember to call tracking function, but more precise tracking data and easier debugging
- **Breaking if changed:** If clients don't call track_template_usage, recent templates feature won't work

### Duplicate detection implemented as Edge Function (server-side scan) rather than client-side comparison or scheduled background job (2026-01-13)

- **Context:** Scanning all entities for duplicates is computationally expensive; needs to balance freshness vs. resource consumption
- **Why:** Edge Function allows: (1) on-demand scanning initiated by user, (2) leveraging database proximity for performance, (3) avoiding client-side processing of large datasets, (4) maintaining audit trail in database. Not a background job because UI needs immediate feedback
- **Rejected:** Client-side comparison - would transfer large datasets and lack database context; background job - would create staleness and make it hard to trigger on-demand scans
- **Trade-offs:** Easier: Scalability, consistency. Harder: Requires coordinating with API layer, can't leverage local caching
- **Breaking if changed:** If system scales beyond Edge Function limits, would need migration to distributed job queue. If real-time duplicate detection is required, would need pub/sub integration

### POST /convert-to-commitment endpoint creates commitment AND task in single request, with automatic linking via relationship tables (2026-01-13)

- **Context:** Action items need to convert to both commitments (organizational tracking) and tasks (personal TODO), often atomically as a single user intent
- **Why:** Single POST prevents race conditions where commitment creates but task fails. User sees consistent state. Reduces client-side coordination logic
- **Rejected:** Separate POST for commitment and task would require client to sequence calls and handle partial failures. Two separate requests increases latency
- **Trade-offs:** Server handles more complexity but client stays simpler and atomic operation is guaranteed. Service becomes less composable - can't reuse commitment POST for other purposes without task creation
- **Breaking if changed:** If split into separate endpoints, client must implement retry logic for partial success scenarios and UI must handle transient inconsistent states

#### [Gotcha] Edge Function handles both individual action item updates AND batch conversion of action items to commitments/tasks, requiring different response shapes (2026-01-13)

- **Situation:** Single action item update returns modified item. Convert-to-commitment accepts multiple action item IDs and returns created commitment + created task objects
- **Root cause:** Different endpoints (PUT /detail vs POST /convert-to-commitment) return different contract. Allows conversion endpoint to return newly created entities for immediate UI use
- **How to avoid:** Client must handle multiple response shapes for different endpoints. Simpler for conversion workflow. More efficient network usage

### Bilingual error responses with English code, English message, and Arabic translation in a single response object (2026-01-14)

- **Context:** Edge function returns errors with structure: errorCode, message (English), arabicMessage (Arabic), statusCode, metadata
- **Why:** Single response object reduces payload size vs separate response objects, allows clients to display appropriate language without additional API calls, maintains backward compatibility with error handling clients
- **Rejected:** Separate language-specific error endpoints or requiring client to fetch translations
- **Trade-offs:** Response payload slightly larger per error but no additional network round-trips; translation maintenance burden centralized on backend
- **Breaking if changed:** Removing Arabic translation field breaks RTL UI error display; removing message field breaks English clients; changing error code structure breaks existing error handling middleware

#### [Pattern] Centralized error response wrapper function with error code, status code, and correlation ID for debugging (2026-01-14)

- **Problem solved:** Edge function needs consistent error formatting across multiple endpoints with actionable error codes and request tracking
- **Why this works:** Correlation ID enables log aggregation across distributed system; error codes allow clients to implement retry logic or specific error handling; consistent format reduces client error parsing complexity
- **Trade-offs:** Additional wrapper function overhead; standardized errors easier for monitoring/alerting; limits flexibility for error-specific response structures

#### [Pattern] Edge Function API URL constructed as `${supabaseUrl}/functions/v1/scenario-sandbox${endpoint}` with runtime endpoint appending, enabling single function to handle multiple route patterns without routing configuration. (2026-01-14)

- **Problem solved:** Need to avoid exposing multiple Edge Function endpoints for different CRUD operations while keeping API routes clean
- **Why this works:** Single Edge Function acting as router reduces deployment surface area and cognitive load. Runtime endpoint routing (GET /list, POST /create, etc.) keeps all scenario logic in one deployable unit.
- **Trade-offs:** Simpler deployment and fewer cold starts vs. harder to trace routing logic and requires manual HTTP method/endpoint parsing in function code

### Using existing `affected_participant_ids` from conflict API response to drive participant badge rendering, rather than deriving participant list separately (2026-01-14)

- **Context:** Component needs to show which participants have conflicts with the new event proposal
- **Why:** Reuses backend computation of conflicts rather than re-computing. Backend already knows which participants have overlaps - using that data avoids duplicate logic and stays single-source-of-truth
- **Rejected:** Fetching separate participant availability endpoint (adds latency), computing conflicts client-side by comparing local participant list with event times (duplicates server logic)
- **Trade-offs:** Simpler component code but requires API contract with backend that includes participant IDs. If API changes its conflict computation, component automatically reflects it
- **Breaking if changed:** If backend stops providing `affected_participant_ids`, component has no data to show which participants conflict. Would need new API field or separate participant lookup

### useEntityPreviewSearch searches 5 entity types (dossiers, organizations, countries, forums) in single hook with unified response, not separate hooks per type (2026-01-14)

- **Context:** Relationship dialog allows linking to multiple entity types; user shouldn't see separate dropdowns
- **Why:** Single ranked result set prevents duplicate entries (e.g., 'France' appears as Country AND in some dossier names). Unified scoring allows semantic weighting per type
- **Rejected:** Separate hooks per entity type (caller combines results, harder to rank fairly). Hook per relationship type (less reusable)
- **Trade-offs:** One hook is more complex internally but simpler for consumers. Cross-type ranking requires shared scoring model. Excludes certain types via entityTypeFilter prop
- **Breaking if changed:** Splitting into per-type hooks forces client code to handle duplicate disambiguation; unified scoring advantage lost

### Created createApiActionableError utility to convert API error responses into ActionableError format with specific action recommendations (2026-01-14)

- **Context:** API errors need to be displayed with user-actionable guidance, not generic 'Server Error' messages
- **Why:** API layer speaks a different language (HTTP status, error codes) than the UI layer (field names, user actions). The utility bridges this by mapping error codes to contextual actions (e.g., 409 conflict → 'retry' or 'contact support'). Centralizes error translation logic.
- **Rejected:** Handling API errors directly in components creates coupling between API contracts and UI. Each component would need to understand all possible API errors.
- **Trade-offs:** Requires maintaining mapping of error codes to ActionableError types, but eliminates error handling logic from components. API changes only require updating the utility, not every form.
- **Breaking if changed:** Without this abstraction, moving API error handling into components makes it impossible to reuse the same error across different UI contexts. Changes to API error format require updating every component that uses it.

### Access request API as Supabase Edge Function rather than Next.js API route (2026-01-14)

- **Context:** API needs to interact with database and return complex objects. Both Edge Function and Next.js route possible.
- **Why:** Edge Function has direct database access via Supabase client without network hop, runs geographically closer to database, can trigger RLS policies naturally, reduces attack surface (no exposed Next.js endpoints). Fits Supabase-first architecture.
- **Rejected:** Next.js API route: adds latency, requires separate auth layer, creates separate codebase location for business logic, more infrastructure to maintain
- **Trade-offs:** Easier: Supabase-native RLS and client integration, lower latency. Harder: less ecosystem tooling, harder to test locally, stuck with TypeScript only
- **Breaking if changed:** Moving back to Next.js API routes loses direct RLS enforcement - must re-implement row-level access control in application code

### Created separate RPC functions for different operations (get_preview_layout, get_entity_layouts, set_default_layout) instead of single parameterized function (2026-01-15)

- **Context:** Preview layout admin needed list view, detail view, and mutation operations with different return schemas and business logic
- **Why:** Separate functions allow each to return optimized result shapes (entity_layouts returns field count aggregation, get_preview_layout returns nested fields). PostgreSQL function overloading via parameters adds complexity. Explicit operations improve clarity of intent in client code
- **Rejected:** Single parameterized function with mode parameter: Harder to reason about return schema; adds conditional logic in SQL
- **Trade-offs:** Easier: Client-side clarity, optimized result shapes per operation. Harder: More functions to maintain, potential duplication in business logic
- **Breaking if changed:** Consolidating to single function requires union of all return columns and client-side filtering to determine which columns are relevant

### Create bulk relationship endpoint (`create_bulk_relationships`) instead of looping single relationship creates on frontend (2026-01-15)

- **Context:** Users selecting multiple suggested relationships to create simultaneously
- **Why:** Single transaction ensures atomicity - all relationships create or none do. Network efficient (one round trip), database efficient (single transaction), prevents partial states
- **Rejected:** Loop of individual create calls would risk inconsistent state if one fails mid-loop, require n round trips, and create audit trail complexity
- **Trade-offs:** Slightly more complex RPC function but massive UX improvement - users see all relationships created together or clear error message
- **Breaking if changed:** Removing bulk endpoint forces either frontend loops (breaking atomicity) or complex error recovery logic

### Bulk member addition via single RPC call (`add_bulk_wg_members`) rather than individual endpoints per member (2026-01-15)

- **Context:** Role assignment wizard collects multiple members before submission, requiring batch insertion with transactional consistency
- **Why:** Single RPC call ensures all members are added atomically (all succeed or all fail), reduces network round-trips, and maintains referential integrity within working group member records
- **Rejected:** Individual POST endpoints for each member (would require client-side transaction handling and increase failure points)
- **Trade-offs:** Simpler error handling (single call success/failure), but makes partial updates impossible and harder to identify which member caused an error in a batch
- **Breaking if changed:** If converted to individual endpoints, would need client-side rollback logic if any member fails, and users could see partially-added teams

### Supabase Edge Function checks JWT in Authorization header rather than relying solely on RLS (2026-01-15)

- **Context:** API endpoint needed to expose permission checking to frontend while maintaining security
- **Why:** JWT verification in Edge Function provides application-level security gate. RLS policies provide database-level gate. Defense in depth - if one fails, other catches it. JWT also provides user context needed to check 'SELF' scope permissions.
- **Rejected:** Relying only on RLS policies - loses ability to return user-friendly error messages. Relying only on JWT - loses database-level enforcement if application logic is compromised.
- **Trade-offs:** Adds JWT parsing overhead. Requires maintaining two security layers. But makes system harder to exploit.
- **Breaking if changed:** If JWT check is removed, unauthenticated requests could call Edge Function and RLS might not block everything (depends on auth.uid() being null)

#### [Pattern] Edge Function uses transaction-like patterns with RETURNING clauses to ensure consistency across multiple table updates (2026-01-15)

- **Problem solved:** Operations like start_meeting or complete_item affect multiple tables (agenda, items, snapshots, timestamps)
- **Why this works:** Prevents partial updates if one step fails; ensures parent-child consistency; single round-trip reduces latency
- **Trade-offs:** Edge Function code is more complex, but guarantees atomicity; database constraints catch bugs vs relying on client coordination

### Edge Function exposes both single-item mutations (complete_item, skip_item, update_item) and batch operations (reorder_items) (2026-01-15)

- **Context:** Items need individual status updates frequently but reordering multiple items is a single gesture
- **Why:** Single mutations are simple and fast for typical case (one item completes); batch reorder prevents N separate writes during drag-and-drop
- **Rejected:** All as batch operations would add latency for common single-item updates
- **Trade-offs:** More function signatures but each optimized for its use case; batch operation prevents cascade of individual updates
- **Breaking if changed:** Client code assumes can call complete_item without full items array; batch operations expect specific format

#### [Pattern] Cursor-based pagination with type-specific ordering in Edge Function (2026-01-15)

- **Problem solved:** Timeline events have different creation timestamps (interactions vs annotations) making offset pagination incorrect for unified views
- **Why this works:** Cursor pagination using `created_at` + `id` composite cursor survives data mutations between requests (unlike offset pagination). Type information in cursor distinguishes between interaction and annotation records for proper ordering.
- **Trade-offs:** More complex cursor encoding/decoding logic but stable pagination across mutations. Clients must handle opaque cursor strings (can't derive page numbers).

#### [Gotcha] Edge Function endpoints use entity-type agnostic :entityId parameter despite multiple entity types existing (2026-01-15)

- **Situation:** Implementation supports countries, organizations, relationships but API doesn't distinguish type in URL path
- **Root cause:** Allows compute_entity_dependencies() function to work across entity types uniformly. Foreign key constraints enforce referential integrity. Type discovery happens at query time.
- **How to avoid:** Easier: single endpoint, extensible to new entity types, unified API. Harder: requires database to resolve which table the ID belongs to, less explicit API contract

### Scheduled reports processing via Supabase Edge Function with discrete trigger polling rather than real-time webhooks (2026-01-15)

- **Context:** Need to generate and distribute reports on schedules without maintaining persistent connections or external orchestration
- **Why:** Edge Functions are serverless and stateless; polling-based checks (via database timestamps) avoid managing webhook delivery state and retry logic
- **Rejected:** Real-time subscriptions (would require persistent connections), external job queues (added infrastructure), native Supabase cron (limited scheduling options)
- **Trade-offs:** Simpler deployment but requires consistent polling intervals; eventual consistency instead of immediate execution; polling overhead vs webhook reliability
- **Breaking if changed:** Switching to webhook model would require persistent callback infrastructure and delivery guarantees outside current architecture
