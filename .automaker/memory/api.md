---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 2
  referenced: 2
  successfulFeatures: 2
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
