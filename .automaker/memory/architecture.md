---
tags: [architecture]
summary: architecture implementation decisions and patterns
relevantTo: [architecture]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 4
  referenced: 4
  successfulFeatures: 4
---

# architecture

### Non-blocking event emission in Edge Functions - events emitted with .catch() to prevent failures from blocking main request (2026-01-13)

- **Context:** Persons Edge Function was updated to emit PersonCreated/PersonUpdated/PersonArchived events on CRUD operations
- **Why:** Event emission is secondary concern - failure to emit event should not fail the API response. Using await would cause 500 on event store failures (network partition, Supabase down temporarily). Pattern: fire-and-forget via .catch() ensures: (1) API remains responsive, (2) failures logged but don't cascade, (3) clients see successful person creation even if event store lags. Events eventually consumed by background workers/subscriptions
- **Rejected:** await on event emission (blocks request, causes cascading failures); queuing events in PostgreSQL first then async worker (extra latency, more infrastructure); synchronous strict consistency (slows down happy path for edge case of event store issues)
- **Trade-offs:** Easier to achieve: reduced latency, resilience to downstream failures, true async architecture. Harder: debugging (events may not appear immediately), eventual consistency (consumers see stale state temporarily), requires .catch() handlers everywhere emitting events
- **Breaking if changed:** Removing .catch() and making event emission await would require event store to never fail - one network hiccup during high load cascades into failed API calls. Clients would experience failed mutations even though database writes succeeded

### Implemented Result<T,E> pattern across all domain services instead of throwing exceptions or using null (2026-01-13)

- **Context:** Cross-context communication needed consistent error handling that doesn't break caller logic
- **Why:** Exceptions are invisible in TypeScript types and force try-catch blocks everywhere. Result<T,E> makes error cases explicit in function signatures, allowing callers to handle failures type-safely without runtime surprises
- **Rejected:** null/undefined returns (lose type info), exceptions (invisible to callers, scattered error handling), optional chaining (errors get silently ignored)
- **Trade-offs:** More verbose function calls (must check isOk/handle Err), but guarantees caller sees all error paths. Prevents silent failures and enables type-driven error handling
- **Breaking if changed:** If any service switches back to exceptions, all calling code loses error visibility and may crash silently. Types become the contract and breaking it creates bugs at runtime

### Created explicit Shared Kernel bounded context with only cross-cutting types, not shared business logic or utilities (2026-01-13)

- **Context:** Multiple bounded contexts needed common types like DossierReference, but sharing business logic creates hidden coupling
- **Why:** Shared Kernel should be minimal and stable - only types that contexts must communicate with. Business logic belongs in contexts. Utilities (apiGet, apiPost) go in Shared only if they're truly generic and never change
- **Rejected:** Shared utils folder with all common code (creates dependency hell), no shared types (each context re-implements them causing inconsistency)
- **Trade-offs:** Small Shared Kernel is harder to maintain as it grows, but prevents accidental coupling. Contexts remain independent and can change internals without affecting others
- **Breaking if changed:** If business logic gets added to Shared Kernel, contexts depend on implementation details instead of contracts. Changes to 'shared' utilities break all contexts simultaneously

#### [Gotcha] AuditInfo was removed from shared kernel imports during refactoring but not from actual exports, causing confusion about what's available (2026-01-13)

- **Situation:** During migration, relationship types needed cleanup but shared kernel's actual exports weren't updated consistently
- **Root cause:** Barrel exports can hide what's actually available. If something is in index.ts but not used, nobody knows if it's forgotten or intentional. This creates zombie code
- **How to avoid:** Extra verification step with test files costs time, but prevents surprise missing exports. Explicit index.ts files serve as documentation of what each context offers

#### [Pattern] Context Map with explicit CONTEXT_MAP object defining upstream/downstream relationships and integration patterns at the architecture level (2026-01-13)

- **Problem solved:** Multiple contexts with dependencies needed clear documentation of how they communicate and what patterns to use
- **Why this works:** Domain-Driven Design recommends documenting bounded context relationships. An explicit map prevents unexpected coupling and serves as contracts for inter-context communication
- **Trade-offs:** Context map must be maintained as architecture evolves, but provides single source of truth for dependencies and integration contracts. Enables static analysis of context relationships

### Removed AuditInfo from shared kernel to keep contexts decoupled from audit concerns, making audit optional per-context (2026-01-13)

- **Context:** Not all operations need audit trails, but shared kernel had forced audit info on everything
- **Why:** Audit is a cross-cutting concern that some contexts need more than others. Forcing it in shared kernel couples all contexts to audit requirements. Each context decides if/how to track changes
- **Rejected:** Keep AuditInfo in shared (all contexts pay audit cost), remove completely (lose audit capability)
- **Trade-offs:** Contexts that need audit must implement separately, but each can choose their audit strategy. Shared kernel stays minimal and focused
- **Breaking if changed:** If code expects AuditInfo on all domain objects, removing it from shared kernel breaks those assumptions. Contexts that relied on shared audit lose capability

### Generic base repository port with specialized child ports instead of domain-specific interfaces only (2026-01-13)

- **Context:** Needed to avoid duplication of CRUD, pagination, soft-delete, and bulk operation signatures across multiple repository ports
- **Why:** Single source of truth for common operations reduces maintenance burden and ensures consistency. Child ports extend with domain-specific methods (findByAssignee, getOverdueTasks). This scales better than repeating boilerplate in each port.
- **Rejected:** Flat ports list where each repository interface duplicates all CRUD methods. Would create 10+ duplicate method signatures and makes bulk changes (e.g., adding audit fields) require updates across all files.
- **Trade-offs:** Adds inheritance complexity but eliminates massive duplication. Generic base is reusable across unrelated domains (tasks, users, documents). Slight learning curve for developers unfamiliar with port hierarchies.
- **Breaking if changed:** If base port is removed, all specialized repositories lose CRUD contract and tests checking generic CRUD methods would fail. Adapters implementing specialized ports would break if they no longer inherit base methods.

### Symbol-based DI tokens instead of string keys for dependency resolution (2026-01-13)

- **Context:** Needed type-safe dependency registration and resolution in the IoC container without relying on string magic keys
- **Why:** Symbols are unique, cannot accidentally collide, and are invisible to stringification/serialization. This prevents typos in registration vs resolution (string-based DI breaks silently if 'CachePort' != 'cachePort'). IDEs provide autocomplete on symbol constants.
- **Rejected:** String-based tokens (common in Angular/NestJS) are simpler initially but cause runtime failures when string literals don't match exactly. Would require runtime validation or error-prone manual verification.
- **Trade-offs:** Symbols require upfront token definition file but eliminate entire class of string-matching bugs. Slightly more boilerplate at registration (need to import tokens) but catches errors at development time via TypeScript.
- **Breaking if changed:** If container switches to string-based lookup, all symbol.toString() calls would fail. All existing registrations using symbols would silently resolve to undefined. Adapters expecting concrete types via injection would receive undefined.

### Lightweight singleton container pattern instead of full-featured DI framework (inversify, awilix) (2026-01-13)

- **Context:** Needed dependency injection for ports/adapters but wanted to avoid framework lock-in and large dependency tree
- **Why:** Custom container gives explicit control over resolution logic. No magic decorators or reflection metadata to debug. Single 50-line container is auditable. Can easily inspect what's registered. Team owns the entire DI system.
- **Rejected:** InversifyJS would provide decorators, auto-factory creation, and circular dependency detection. But adds 200KB+ dependencies, requires TypeScript emitDecoratorMetadata, and couples entire app to framework-specific patterns. Harder to migrate away from.
- **Trade-offs:** Manual registration is more verbose but explicit. No auto-factory or lazy initialization built-in (but these are rare needs). Debugging DI issues requires reading <100 lines of code vs framework source.
- **Breaking if changed:** If container is replaced with external framework, all manual Map-based registrations would fail. Symbol tokens would no longer work (frameworks expect decorators). All resolve() calls would need refactoring to new API.

#### [Gotcha] Domain service must use ONLY port interfaces in imports/constructor, never concrete implementations (2026-01-13)

- **Situation:** Test verification failed initially because TaskDomainService was checking imports - subtle violation that breaks hexagonal architecture's core benefit
- **Root cause:** If domain logic imports concrete adapters (e.g., from '@supabase/supabase-js'), then domain is tightly coupled to infrastructure. Cannot swap implementations at runtime. Cannot test with mocks. Entire premise of ports/adapters fails.
- **How to avoid:** Requires discipline—domain must import ONLY from core/ports/, never from adapters/. IDE search for 'supabase' in domain/ must return zero results. Adds validation test cost but saves months of refactoring later when requirements change.

#### [Pattern] Adapter naming convention: [Library].[PortInterface].adapter.ts (e.g., redis.cache.adapter.ts, winston.logger.adapter.ts) (2026-01-13)

- **Problem solved:** Needed clear naming to distinguish which library each adapter wraps and which port it implements
- **Why this works:** Name tells story: redis (technology) + cache (port) + adapter (pattern). Immediately conveys origin library and port contract. Grep for 'redis' finds all Redis-specific code. Organizing adapters by library prevents circular imports—all adapters in same directory depend inward only.
- **Trade-offs:** Slightly longer names but self-documenting. Renaming library (redis → valkey) requires only file rename. Tech choice is visible from filename—good for code review and documentation.

### Ports segregated by concern (repositories/, infrastructure/, services/) instead of flat or by domain entity (2026-01-13)

- **Context:** Needed to organize ~10 ports and multiple adapters without creating directory sprawl or confusing relationships
- **Why:** Separation by concern (repository, infrastructure service, domain service) groups related ports even if they're used by different entities. Easier to understand: 'all caching goes through infrastructure/cache.port', 'all persistence through repositories/\*'. Adapters for one concern (e.g., caching) naturally cluster.
- **Rejected:** Organizing by entity (task/, user/, document/) would require repeating infrastructure ports in each entity folder. Or flat ports/ directory would become 30+ files with no organization. Or mixing ports and adapters in same folder confuses interface contract from implementation.
- **Trade-offs:** Requires understanding 3 port categories but pays off when scaling to 20+ ports. Entity-based organization would require duplicate cache/logger ports per entity.
- **Breaking if changed:** If ports are reorganized into entity folders, adapters become harder to locate and maintain. DI container registration would scatter across domain folders instead of centralizing infrastructure setup.

#### [Gotcha] Middleware must call tenant service AFTER authentication but BEFORE repository instantiation, requiring specific ordering in middleware chain (2026-01-13)

- **Situation:** Initial implementation had tenant context set after some repository calls were made, causing queries to execute without tenant context
- **Root cause:** RLS policies depend on tenant context being set. Repositories need context available at instantiation/query time. Authentication provides user_id needed to resolve tenant membership
- **How to avoid:** Gained: clean separation of concerns. Lost: implicit ordering requirements in middleware chain that's easy to break

### Tenant-scoped repository base class with generics rather than separate repository implementations for each entity (2026-01-13)

- **Context:** Avoid duplicating tenant isolation logic across dozens of repository implementations
- **Why:** Single source of truth for tenant filtering. All repositories automatically inherit security policies. New entities automatically scoped without boilerplate
- **Rejected:** Per-entity repositories: would require copy-pasting tenant checks into each repository, creating audit nightmare
- **Trade-offs:** Gained: consistency and maintainability. Lost: less explicit about what tenant filtering is happening
- **Breaking if changed:** Removing base class would require manually adding tenant_id WHERE clauses to every query, with high risk of omission

### Plugin registry implemented as singleton with runtime registration instead of compile-time static configuration (2026-01-13)

- **Context:** System needed to support dynamic entity type plugins loaded at runtime without modifying core application code
- **Why:** Allows third-party plugins to register themselves after app initialization, enabling extensibility without deployment changes. Singleton ensures single source of truth across app.
- **Rejected:** Static plugin configuration in config files or at build time - would require app rebuild/restart for new plugins
- **Trade-offs:** Easier to add plugins dynamically, harder to statically analyze all available plugins at build time. Requires runtime validation of plugin contracts.
- **Breaking if changed:** Removing singleton pattern would require passing registry through context/props everywhere, increasing coupling and complexity

### Plugin contract enforced through discriminated union types with field/relationship/validation/permission factories (2026-01-13)

- **Context:** Multiple plugin subsystems (validation, relationships, permissions, UI) need consistent structure without runtime boilerplate
- **Why:** Factory pattern with typed builders (textField, enumField, relationship) provides compile-time safety while keeping plugin definitions concise and declarative. Discriminated unions ensure type-safe handling of different field types.
- **Rejected:** Manual object creation - would require verbose, error-prone typing. Generic validators - would lose type information across subsystems.
- **Trade-offs:** Factory functions add indirection but eliminate most validation errors at compile time. Plugin definitions are more readable but slightly less flexible.
- **Breaking if changed:** Removing factories would require plugins to manually construct complex nested types with all validation rules, making plugins error-prone and verbose

#### [Gotcha] Plugin registration happens at runtime but Playwright tests need to wait 3 seconds for plugins to fully initialize despite page.waitForLoadState('networkidle') (2026-01-13)

- **Situation:** Tests showed that networkidle alone wasn't sufficient - validation hooks, relationship definitions, and permission systems weren't accessible immediately
- **Root cause:** Plugin initialization includes multiple async operations beyond network requests: context provider mounting, registry population, hook setup. These complete asynchronously after network is idle.
- **How to avoid:** Hardcoded timeout is fragile but ensures all plugin subsystems are initialized. Better solution would be to expose plugin readiness state or wait condition.

### Validation hooks (beforeCreate, beforeUpdate, beforeDelete) implemented as functions within plugin definition rather than external middleware (2026-01-13)

- **Context:** Validation rules are tightly coupled to entity type definition and need access to entity-specific types and context
- **Why:** Keeps validation logic colocated with entity definition for maintainability. Field-level validators (minLength, pattern) are also in same structure for consistency. Allows validation to be composable and reusable.
- **Rejected:** Separate validation middleware layer - would require string-based field references losing type safety. Global validation registry - would make entity-specific validation hard to discover.
- **Trade-offs:** Easier to understand and modify validation for an entity (all in one place), harder to apply cross-entity validation patterns
- **Breaking if changed:** Extracting validation to middleware would lose type information about which fields exist and what transformations are safe

#### [Gotcha] Permission system includes both role-based clearance levels AND custom permission checks, creating two paths of authorization that must both pass (2026-01-13)

- **Situation:** Simple role-based system (clearance levels) insufficient for business logic like 'can only edit own team assignments'
- **Root cause:** Two-layer system handles simple cases (clearance) efficiently while allowing complex cases (custom checks) without explosion of role types. Both must pass (AND logic) prevents escalation exploits.
- **How to avoid:** More secure (defense in depth), more complex to reason about. Developers must understand both layers and how they combine.

### Relationships include bidirectional cardinality information but storage and sync responsibility left to consuming application (2026-01-13)

- **Context:** Plugin system defines relationship structure but doesn't implement storage layer or synchronization logic
- **Why:** Keeps plugin system focused on metadata/contracts. Storage is app-specific (SQL, document, graph DB). Plugin system can describe relationships without forcing implementation.
- **Rejected:** Plugin system implementing relationship storage - would require ORM/database dependency. Only allowing one-way relationships - would lose information for navigation.
- **Trade-offs:** Simpler plugin system (no storage logic), more responsibility on app developers to implement sync. Enables flexible storage strategies.
- **Breaking if changed:** If plugin system was required to maintain relationship consistency, it would need database coupling and coordination across entities

### Implemented CQRS with denormalized read models (timeline_events, relationship_graph, dossier_summaries) rather than serving queries directly from normalized source tables (2026-01-13)

- **Context:** Complex queries like timeline filtering, relationship traversal, and dossier search require expensive joins across multiple normalized tables
- **Why:** Denormalized projections enable O(1) or O(log n) reads vs O(n\*m) normalized queries. Timeline queries with filtering/pagination, relationship graph traversal, and full-text search all benefit from pre-computed structure. The tradeoff is write consistency complexity, but this is mitigated by event-driven sync
- **Rejected:** Direct queries on normalized dossiers/relationships/events tables with materialized views - views still require computation at query time; explicit tables allow indexes on denormalized fields
- **Trade-offs:** Read performance dramatically improves but requires maintaining eventual consistency between write and read models. Write operations remain unchanged (existing code), only reads route to projections. Must monitor projection staleness
- **Breaking if changed:** If read models are removed/disabled, queries revert to expensive normalized joins, causing slow timeline loads and search failures. The fallback mechanism exists but is performance-degraded

### Separated commands and queries into distinct Edge Functions (`cqrs-commands` and `cqrs-queries`) rather than using router logic within a single function (2026-01-13)

- **Context:** Standard CQRS separates write and read concerns, but this is often just logical separation within monolithic code
- **Why:** Splitting into separate functions enables independent deployment, scaling, and monitoring. Commands can use different auth/validation than queries. Queries can be optimized for read patterns without affecting write latency. Creates clear contract boundaries between read/write paths
- **Rejected:** Single polymorphic function with if/else routing - harder to scale reads independently, mixes concerns, makes monitoring and error handling less granular
- **Trade-offs:** Two functions to maintain instead of one, but gained independent scaling, clearer code intent, and easier future separation (e.g., different timeouts, caching strategies, SLAs for reads vs writes)
- **Breaking if changed:** If merged back into single function, would require rebuilding command/query routing logic and lose independent scaling guarantees

#### [Pattern] Implemented projection_metadata table to track staleness and cache freshness per read model rather than application-level staleness detection (2026-01-13)

- **Problem solved:** Read models could become stale if sync functions fail, triggers don't fire, or there's a lag between writes and reads
- **Why this works:** Database-side staleness tracking allows queries to decide whether to trust cached results or fallback to direct queries. Avoids application guessing about data freshness. Enables granular SLAs per projection type. The sync functions update metadata atomically with projection updates
- **Trade-offs:** Adds one more table to manage, but provides single source of truth for projection health. Enables fallback logic: if projection_metadata shows staleness > threshold, query from source

### Frontend uses same CQRS commands/queries API for all data operations (routing to Edge Functions) rather than directly calling Supabase RPC or REST (2026-01-13)

- **Context:** Could call read_models functions directly via supabase.rpc() in frontend, but chose to route through cqrs-queries Edge Function
- **Why:** Centralizes business logic, enables circuit breaker/fallback patterns, allows monitoring/auth at request boundary, makes caching strategy consistent, prevents frontend directly depending on database schema changes. Edge Function can implement fallback: if read_models are stale, query normalized tables
- **Rejected:** Direct supabase.rpc() calls from frontend - couples frontend to database schema, loses ability to implement fallback strategy, makes monitoring/SLAs harder
- **Trade-offs:** Added network hop (frontend→edge function instead of frontend→database), but gained flexibility for future optimizations (caching, fallback, circuit breaking), monitoring, and schema evolution
- **Breaking if changed:** If edge function layer is removed and frontend calls Supabase RPC directly, fallback mechanism breaks and frontend must handle stale read models itself

#### [Pattern] Sync functions (sync_timeline_event, sync_relationship, sync_dossier_summary) are designed to be idempotent and called on every write, creating event-driven eventual consistency between write and read models (2026-01-13)

- **Problem solved:** Rather than background jobs polling for changes, sync triggers on each write operation
- **Why this works:** Event-driven sync ensures read models update immediately after writes (within same transaction when possible), providing near-real-time consistency. Idempotency prevents duplicate projections if trigger fires multiple times. No background job infrastructure needed
- **Trade-offs:** Writes become slightly heavier (trigger + sync function call), but read models stay fresh automatically. Eventual consistency is nearly instantaneous (milliseconds) in normal case

### Module contracts defined as TypeScript interfaces (IDocumentModule, IRelationshipModule, IAIModule) enforcing public APIs at compile-time rather than runtime validation (2026-01-13)

- **Context:** Building modular monolith where modules need clear boundaries but maintaining type safety across module boundaries in a single codebase
- **Why:** TypeScript interfaces provide compile-time checking, IDE autocompletion, and self-documenting APIs. Runtime validation would be redundant in monolith context since all code compiles together. Interface-based design allows future extraction to microservices by replacing implementations with HTTP clients
- **Rejected:** Runtime schema validation (adds overhead in monolith), duck typing (loses type safety), class-based inheritance (less flexible for testing/mocking)
- **Trade-offs:** Gained: type safety and IDE support. Lost: ability to swap implementations at runtime without re-declaring types
- **Breaking if changed:** If contracts are changed, dependent modules fail at compile-time (good), but requires code review across module boundaries

#### [Pattern] Event bus as pub/sub for inter-module communication instead of direct service calls, using namespace-prefixed event types (document._, relationship._, ai.\*) (2026-01-13)

- **Problem solved:** Modules need to communicate without creating circular dependencies or tight coupling that would prevent future microservice extraction
- **Why this works:** Event-driven architecture decouples modules - they don't know about each other's implementations, only event contracts. Namespace prefixing prevents event naming collisions and makes event origin obvious. Allows multiple modules to react to same event without coordination
- **Trade-offs:** Gained: loose coupling, broadcast capability, future message-broker compatibility. Lost: synchronous request-response simplicity, harder to debug event flows, eventual consistency instead of atomic operations

### Module registry with topological sorting for dependency resolution and health status tracking, rather than direct dependency injection or service locator (2026-01-13)

- **Context:** Multiple modules need to initialize in correct order, manage lifecycle (started/stopped/failed states), and be accessible from any component without prop drilling
- **Why:** Topological sorting handles implicit dependencies automatically without manual ordering. Registry pattern (global access point) solves the prop drilling problem in React while maintaining module independence. Health status tracking enables graceful degradation and diagnostics. Module-level lifecycle management (not just React component lifecycle) ensures cleanup happens correctly
- **Rejected:** React Context/Provider (doesn't handle initialization ordering, tightly couples to React), direct imports (no lifecycle management), constructor dependency injection (can't handle circular dependencies, doesn't work with modules created dynamically)
- **Trade-offs:** Gained: automatic dependency ordering, global accessibility, lifecycle management. Lost: implicit dependencies harder to trace, testing requires registry reset between tests
- **Breaking if changed:** If registry is removed, there's no way to initialize modules in correct order or access them globally - modules become unusable. If health tracking is removed, can't detect failed modules affecting other modules

#### [Gotcha] Module request context (containing userId, requestId, timestamp) required for all operations, not just for security but for event traceability and audit trails (2026-01-13)

- **Situation:** Discovered during testing that events published without context are untraceable across module boundaries, making debugging multi-module flows impossible
- **Root cause:** In distributed monolith, events can be triggered by multiple sources (user actions, batch jobs, webhooks). Without context, impossible to trace which request caused which event or audit user actions. Request ID enables tracing across async operations
- **How to avoid:** Gained: full auditability and traceability. Lost: verbose method signatures, every operation carries context overhead

#### [Pattern] Data Transfer Objects (DTOs) as single source of truth for cross-module communication contracts, distinct from internal module types (2026-01-13)

- **Problem solved:** Modules have internal types optimized for their use case (Document, Relationship) but need to share data with other modules without exposing internal structure
- **Why this works:** DTOs decouple internal representation from external contract. Module A can refactor its internal Document type without affecting Module B, as long as DTO stays compatible. Enables each module to have different internal optimizations (e.g., Relationships uses graph structures, Documents uses hierarchies) while sharing through common DTOs
- **Trade-offs:** Gained: module independence, ability to refactor internals. Lost: need to maintain both internal and DTO types, potential data transformation overhead

#### [Gotcha] Module initialization must happen before any React component uses modules, but useModules hook makes this implicit and easy to forget (2026-01-13)

- **Situation:** Tests passed by running complete initialization before component mounting, but real app could have race conditions if components try to access modules before registry is ready
- **Root cause:** Initialization is asynchronous (might load from backend) but module access is synchronous. React doesn't enforce initialization ordering - components render whenever they mount. Missing initialization causes runtime errors that are hard to debug because they only appear when components render
- **How to avoid:** Gained: simple API (useModules hook just works). Lost: implicit dependency that's easy to forget, requires external orchestration to initialize

### Hierarchical scope chain (Application → Tenant → Request) with explicit ScopeLevel enum enforces scoping rules at resolution time (2026-01-13)

- **Context:** Multi-tenant system requires services to be resolvable only from appropriate scope levels. Service registered at Tenant level should be resolvable from Request scope (child) but not from Application scope (parent).
- **Why:** Prevents accidental scope violations where code tries to resolve tenant-scoped service from root container. The scope validation throws at runtime if minimum scope level isn't met, catching architectural violations early.
- **Rejected:** Alternative of no scope level validation would silently create instances in wrong scope, causing tenant data leakage or missing tenant context.
- **Trade-offs:** Adds validation overhead at resolution time but prevents subtle bugs that are hard to debug in production. Requires developers to explicitly declare scope requirements.
- **Breaking if changed:** Removing scope level validation would break multi-tenant isolation guarantees and allow tenant-scoped services to be resolved from application scope.

### Tenant scopes are reused and cached by tenant ID rather than creating new scope per request (2026-01-13)

- **Context:** System creates request-scoped containers for each HTTP request but wants tenant-scoped singletons to persist across requests from same tenant.
- **Why:** Request scope is created as child of existing tenant scope. This allows tenant-scoped services to be instantiated once per tenant and reused across all requests from that tenant, reducing object allocation and enabling shared tenant state.
- **Rejected:** Creating new tenant scope per request would waste memory and break cross-request tenant state sharing. Creating tenant scope only at startup loses multi-tenant isolation.
- **Trade-offs:** Requires explicit tenant scope management and lifecycle tracking. Tenant scopes must be explicitly disposed when tenant is deleted/deprovisioned, otherwise stale instances persist in memory.
- **Breaking if changed:** If tenant scope caching is removed and each request creates fresh scopes, tenant-scoped singletons become request-scoped, losing shared state and requiring service redesign.

#### [Gotcha] Test initially expected request-scoped service to return same instance as tenant-scoped service, but each scope maintains separate instances - this is correct behavior, not a bug (2026-01-13)

- **Situation:** When resolving a tenant-scoped service from a request scope, the test expected the exact same instance object. The actual behavior was that request scope creates its own instance.
- **Root cause:** This is actually correct - scoped services are cached PER SCOPE. The request scope is a separate scope from tenant scope with its own instance cache. Both instances are equivalent but different objects, both correctly scoped to their parent tenant.
- **How to avoid:** More instances in memory (one per scope level) but cleaner scope semantics where each scope is responsible for its own instances. Prevents accidentally sharing mutable state between scopes.

#### [Pattern] Reverse-order disposal of scoped instances (LIFO) with separate async disposal path for IAsyncDisposable (2026-01-13)

- **Problem solved:** Services may depend on other services, and resources must be cleaned up in correct order - if Service A depends on Service B, Service A must dispose before Service B.
- **Why this works:** Tracks creation order and reverses it for disposal. This ensures dependencies are disposed AFTER dependents. Separate async path allows services with async cleanup (DB connections, file handles) to complete cleanup properly.
- **Trade-offs:** Added complexity in tracking creation order and maintaining separate disposal lists. Async disposal requires understanding async patterns but provides correctness guarantee.

### Scope metadata (tenantId, userId, requestId) inherited from parent scopes and available to factory functions (2026-01-13)

- **Context:** Services need to know which tenant/user they're being instantiated for, especially in factory functions that create instances.
- **Why:** Metadata is passed through scope hierarchy - request scope inherits tenant metadata from tenant scope. Factory receives scope with full metadata context, enabling context-aware service construction (e.g., logger configured with current user/tenant).
- **Rejected:** Alternative of passing context as function parameters would require changes to all factory signatures. Ambient context from global variables would be unsafe in concurrent requests.
- **Trade-offs:** Scope object becomes required parameter for all factories, but provides type-safe, request-local context without global state.
- **Breaking if changed:** If metadata inheritance removed, factories lose ability to access tenant/user context and would require alternative context passing mechanism like thread-local storage (error-prone in async Node.js).

#### [Pattern] Express middleware creates request scope and attaches it to request object for later access in route handlers (2026-01-13)

- **Problem solved:** Express is single-threaded with async handlers; each request needs its own DI scope without requiring explicit parameter passing through handler chain.
- **Why this works:** Middleware creates scope before route handlers run, stores on request object for access via helpers like `getRequestScope()` and `resolveFromRequest()`. This is the standard Express pattern for request-local state.
- **Trade-offs:** Requires middleware to run in correct position and requires route handlers to use helper functions. But keeps scope isolated per request and scope lifecycle tied to HTTP response completion.

### Convenience methods `registerTenantScoped()` and `registerRequestScoped()` that set minimumScopeLevel automatically (2026-01-13)

- **Context:** Developers frequently register services with specific scope levels but need to remember both the lifetime AND the minimum scope level.
- **Why:** Encodes the intent directly - `registerTenantScoped()` means 'this must be scoped to at least tenant level'. This prevents developer error of registering tenant-scoped service but forgetting minimumScopeLevel, which would allow accidental application-scope resolution.
- **Rejected:** Requiring developers to manually set both `ScopeLevel` parameter AND lifetime could be forgotten. Having only `registerScoped()` without scope level hints would lose safety.
- **Trade-offs:** More methods to learn but clearer intent and safer by default. Reduces boilerplate and makes scope requirements explicit.
- **Breaking if changed:** If these convenience methods removed, developers must remember to set minimumScopeLevel when registering scoped services, increasing chance of scope validation bypass.

### Used composition-based specification pattern with abstract base class instead of inheritance-heavy hierarchy (2026-01-13)

- **Context:** Needed to support multiple filtering scenarios (work items, intake tickets, report filters) with reusable business logic
- **Why:** Composition allows specifications to be combined via AllOf/AnyOf/NoneOf without explosion of concrete subclasses. A single Equals specification can work with any domain object type via generics
- **Rejected:** Deep inheritance hierarchy with separate classes per domain entity; Visitor pattern with type checking
- **Trade-offs:** Easier to compose and test, but requires callers to understand fluent API; harder to discover available specifications without IDE hints
- **Breaking if changed:** If specification evaluation logic moves to database-only, in-memory filtering via isSatisfiedBy() would be lost

### Implemented dual evaluation paths: in-memory (isSatisfiedBy) and database (toSupabaseFilter) with shared specification objects (2026-01-13)

- **Context:** Same business rules needed to work both for filtering already-loaded data and for query optimization at the database layer
- **Why:** Avoids duplication of business logic and ensures client-side filtering and server queries stay in sync. Single source of truth for each business rule
- **Rejected:** Separate FilterSpec classes for database queries; pure ORM-based filtering without client-side evaluation
- **Trade-offs:** More complex specification objects (must support two evaluation paths), but massive reduction in logic duplication and consistency guarantees
- **Breaking if changed:** If database schema changes field names, toSupabaseFilter() breaks for all affected specifications - requires coordinated updates

#### [Pattern] URL query parameter serialization via toJsonFilters/fromJsonFilters functions for specification persistence (2026-01-13)

- **Problem solved:** Need to preserve complex filter state across page navigation and share filter links without losing specification composition
- **Why this works:** JSON representation of specifications is deterministic and compact enough for URLs. Avoids session state management for filters. Users can bookmark filtered views
- **Trade-offs:** URLs become longer but human-readable; easy to debug; serialization must handle all specification types, but not tied to backend technology

### Fluent SpecificationBuilder API as wrapper rather than modification of core Specification class (2026-01-13)

- **Context:** Needed both simple factory functions (bySource, byStatus) and complex composition (allOf, and, or) without polluting Specification interface
- **Why:** Separates concerns: Specification focuses on evaluation logic, Builder focuses on API ergonomics. Allows multiple builder styles without core class complexity. Optional dependency
- **Rejected:** Adding builder methods directly to Specification class; DSL with string-based query parsing
- **Trade-offs:** Extra wrapper class to learn, but core Specification class stays focused. Builder can be optimized independently without affecting eval logic
- **Breaking if changed:** If Specification class interface changes, Builder.build() may need updates to still generate valid specifications

### Conditional specifications (when, whenDefined) take Predicate<T> function instead of another specification (2026-01-13)

- **Context:** Some filtering logic is data-dependent (only apply filter if certain data exists) but doesn't map to domain entity properties
- **Why:** Predicate allows any boolean logic without forcing everything into specification pattern. More flexible than forcing all conditions into specifications. Keeps specs focused on domain rules
- **Rejected:** Everything must be a specification; nested specifications for every conditional
- **Trade-offs:** Conditional logic inside predicate is harder to serialize to database; but enables complex runtime logic without specification explosion
- **Breaking if changed:** Predicate functions cannot be converted to toSupabaseFilter() - they only work for in-memory filtering

#### [Pattern] Port interfaces defined separately from adapters, with adapters registering in a dedicated DI module (acl-registration.ts) rather than inline (2026-01-13)

- **Problem solved:** ACL pattern implementation for external service integrations across multiple domains (email, signature, calendar, AI)
- **Why this works:** Centralizes adapter registration logic in one place, making it easy to add/remove integrations without modifying service layer. Follows hexagonal architecture where ports are domain contracts and adapters are infrastructure concerns
- **Trade-offs:** Requires an additional registration module to maintain, but gains: single source of truth for all external integrations, easy to mock all adapters for testing, clear visualization of what external systems are integrated

### Request/response mappers built into adapters as transformation methods rather than separate mapper classes (2026-01-13)

- **Context:** Converting between domain models (e.g., SignatureEnvelope) and external API models (e.g., DocuSign envelope format)
- **Why:** Keeps translation logic colocated with the adapter that uses it, reducing indirection. External API contracts change infrequently, so tight coupling to adapter is acceptable. Reduces file count and cognitive load
- **Rejected:** Separate mapper classes would add another layer of indirection, making the code path: domain → mapper → adapter → API harder to follow
- **Trade-offs:** Easier to find transformation logic (it's in the adapter), but if multiple adapters need same transformation, logic gets duplicated. This is acceptable because: (1) rarely happens, (2) each API has unique transformation needs
- **Breaking if changed:** If external API changes contract, the mapping code is tightly bound to it, requiring adapter changes. This is intentional - adapters are designed to absorb external changes

#### [Gotcha] Test assertions failed because they searched for lowercase adapter names (nodemailer, docusign) but exports used PascalCase class names (NodemailerEmailAdapter, DocuSignSignatureAdapter) (2026-01-13)

- **Situation:** Writing Playwright tests to verify all adapters are properly exported and registered
- **Root cause:** This reveals the naming pattern: adapters are classes with PascalCase names following convention (SpecificServiceAdapter), exports must match class names exactly. Grep patterns that don't match actual export statements will fail silently until tested
- **How to avoid:** The extra verbosity (NodemailerEmailAdapter vs nodemailer) makes the adapter's purpose explicit in code (EmailAdapter suffix clarifies it's an adapter pattern), but requires tests to know the exact naming convention

#### [Pattern] Separate port interfaces per service domain (EmailService, DigitalSignatureService, CalendarService) rather than one unified ExternalService interface (2026-01-13)

- **Problem solved:** Designing contracts that external adapters must implement
- **Why this works:** Each external service has different methods, parameters, and responsibilities. Separate interfaces allow consumers to depend only on what they need, following Interface Segregation Principle. Makes it clear what each adapter is responsible for
- **Trade-offs:** More interfaces to maintain, but each is focused and easier to test/mock. DI registration becomes clearer because you register EmailService separately from SignatureService

### AnythingLLM adapter includes a fallback service and health monitoring rather than failing fast (2026-01-13)

- **Context:** Wrapping AnythingLLM API which may be unstable or unavailable
- **Why:** AI services often have availability issues. Building resilience at the ACL layer means the domain layer doesn't need to know about fallbacks or retry logic. Centralizes resilience strategy in one place
- **Rejected:** Failing fast (throwing error immediately) would push resilience concerns to domain layer, duplicating error handling across services that use AI
- **Trade-offs:** Adds complexity to adapter (needs health check, fallback logic), but isolates reliability concerns from business logic. If fallback service is misconfigured, AI features degrade gracefully rather than failing
- **Breaking if changed:** If fallback/health monitoring is removed, the service becomes brittle. Any AnythingLLM downtime breaks all features that depend on it

#### [Pattern] Implemented alert frequency system using enums ('immediately', 'daily', 'weekly') with frequency_next_check timestamp for deterministic trigger timing (2026-01-13)

- **Problem solved:** System needed to schedule automatic alerts without implementing full job queue system
- **Why this works:** Storing next_check timestamp allows using simple queries on each search execution (check if now > frequency_next_check) rather than cron jobs. Enum-based frequency is database-agnostic and queryable. Application checks on search execution provide implicit trigger points
- **Trade-offs:** Alerts only trigger when users execute searches (eventual consistency), not guaranteed at exact times. But avoids infrastructure overhead and works well for search-related alerts by definition

### Used Edge Functions as watchlist API layer instead of direct Supabase client calls from frontend (2026-01-13)

- **Context:** Building watchlist CRUD API with complex business logic (bulk operations, templates, event tracking)
- **Why:** Edge Functions provide centralized request validation, authorization enforcement via RLS policies, and audit trail through watchlist_events table. Prevents frontend from bypassing security policies.
- **Rejected:** Direct Supabase client-side queries would expose RLS policy complexity to frontend and make audit logging harder to enforce consistently
- **Trade-offs:** Added network latency layer but gained centralized security validation and easier enforcement of business rules. Bulk operations become atomic at function level.
- **Breaking if changed:** Removing this layer would require duplicating authorization logic in frontend or creating security holes where RLS policies could be circumvented

#### [Pattern] Used TanStack Query with infinite pagination + real-time Supabase subscriptions rather than polling or simple infinite scroll (2026-01-13)

- **Problem solved:** WatchlistPanel displays large watchlist with new entries being added by user actions and potential server-side updates
- **Why this works:** Query handles pagination state/caching, subscriptions handle real-time updates without refetching all pages. Avoids refetch cascades on mutations.
- **Trade-offs:** Higher complexity but smooth UX. Must handle subscription cleanup properly to avoid memory leaks.

#### [Pattern] Polymorphic entity tracking using entity_type + entity_id instead of separate tables per entity (2026-01-13)

- **Problem solved:** Field history needs to track changes across multiple entity types (dossiers, persons, organizations, etc.) without creating separate history tables for each
- **Why this works:** Single history table with polymorphic references reduces schema bloat, makes auditing centralized, and allows generic query/rollback functions. Alternative of separate tables per entity would require maintenance of n history tables with duplicate logic
- **Trade-offs:** Requires application-level type safety for entity_type values and polymorphic queries are slightly less typed, but gains maintainability and unified audit trail

#### [Pattern] Separate demo/testing route (`/field-history-demo`) distinct from production feature routes (2026-01-13)

- **Problem solved:** Feature requires validation of full stack without exposing unfinished UI to users
- **Why this works:** Demo route allows testing complete data flow and user interactions in isolation before integrating into main application. Keeps production code clean of test fixtures
- **Trade-offs:** Slight code duplication in demo vs production usage, but gains ability to test independently and remove demo without affecting production

### i18n translations (EN/AR) added to feature core rather than as optional localization (2026-01-13)

- **Context:** Application supports international users with Arabic language requirements
- **Why:** RTL language support requires translations and layout changes at component level, not optional. Baking in from start prevents UI asymmetry and ensures all features work in all supported languages
- **Rejected:** English-only implementation with future localization - creates technical debt, RTL layout breaks need rework, strings hardcoded
- **Trade-offs:** Slight increase in file count and translation maintenance burden, but ensures consistent internationalization across feature
- **Breaking if changed:** Without Arabic translations, feature displays untranslated strings and RTL layout may break for Arabic users

### Template system uses JSONB default_values column to store arbitrary entity-specific data instead of separate template type tables (2026-01-13)

- **Context:** Supporting templates across 4 different entity types (task, commitment, engagement, dossier) with different default field requirements
- **Why:** Single templates table with JSONB is more maintainable than separate task_templates, commitment_templates, etc. tables. Reduces schema explosion and allows templates to evolve without migrations
- **Rejected:** Type-specific tables (task_templates, commitment_templates) would require join logic and migrations for each new entity type
- **Trade-offs:** Easier to add new entity types later, but requires client-side validation/typing of JSONB content. Loss of database-level constraints for template field validity
- **Breaking if changed:** Client code assumes templates are valid for their entity_type - no DB enforcement of schema match

### Template selector uses TanStack Query with separate hooks (useEntityTemplates, useFavoriteTemplates) instead of single mega-query (2026-01-13)

- **Context:** Need to fetch templates, user favorites, and recent templates with separate refresh/caching requirements
- **Why:** Separate queries allow independent caching policies and partial refetching. useEntityTemplates caches templates list (rarely changes), while useFavoriteTemplates refetches when user toggles
- **Rejected:** Single query returning all data (harder to refetch subset), combined client-side filtering (less flexible)
- **Trade-offs:** Multiple network requests but cleaner cache invalidation. Query keys must be carefully structured to avoid conflicts
- **Breaking if changed:** If query keys overlap, toggling favorites could invalidate template list cache causing unnecessary refetch

### Removed useSupabaseClient() dependency from custom hooks (useMergeDuplicates, useDismissDuplicate, useUpdateDuplicateSettings, useCheckDuplicatesOnCreate), relying solely on queryClient for state management (2026-01-13)

- **Context:** Initial implementation had dual dependencies on Supabase client and React Query, creating redundant client initialization
- **Why:** React Query already abstracts backend communication; Supabase client was unused in hook bodies, adding unnecessary coupling to persistence layer. Hooks now focus on cache management only
- **Rejected:** Keeping Supabase client for consistency with other hooks - but this violates separation of concerns since the actual mutations would use queryClient anyway
- **Trade-offs:** Easier: Simpler hook signatures, testability improves. Harder: Any direct Supabase operations (beyond mutations) would require re-adding the dependency
- **Breaking if changed:** If hooks were changed to use Supabase operations directly (bypassing React Query), they would fail. Callers relying on Supabase-specific transaction handling would break

### Centralized role-specific configuration via role-dashboard.config.ts instead of scattering role logic across components (2026-01-13)

- **Context:** Multiple components need role-specific behavior (quick actions, KPIs, sections, entities). Without centralization, role changes require updates across 5+ files.
- **Why:** Single source of truth for role mapping enables: (1) adding new roles without component changes, (2) bulk role permission updates in one place, (3) easy A/B testing of role features
- **Rejected:** Context API with role reducers (excessive boilerplate) or role-based conditionals in each component (unmaintainable, violates DRY)
- **Trade-offs:** Configuration-driven approach requires more upfront structure but eliminates role logic duplication. Initial setup cost higher, but scaling new roles becomes cheap.
- **Breaking if changed:** If removed, role-specific quick actions, KPIs, and sections would become generic; adding new roles would require modifying 8+ component files instead of 1 config

### Separate useRoleBasedDashboard hook returning role-specific data vs embedding logic in dashboard component (2026-01-13)

- **Context:** Dashboard component needs role-specific metrics, pending actions, and KPI calculations. Logic is not trivial (filters, aggregations based on role).
- **Why:** Custom hook enables: (1) reusability across multiple pages/dashboards, (2) testability in isolation, (3) composition with other hooks without callback hell, (4) server-side rendering adaptation
- **Rejected:** Dashboard component with nested state management (couple data logic to rendering) or Redux slice (overkill for single page data)
- **Trade-offs:** Hook requires learning custom hook patterns but makes logic testable and reusable. Component stays focused on rendering.
- **Breaking if changed:** If logic is moved into component, adding another page that needs same role-specific data requires duplication; hook becomes hard to test in isolation

#### [Pattern] RoleDashboardRouter component as single entry point that conditionally renders role-specific dashboard instead of route-level role checking (2026-01-13)

- **Problem solved:** Eight different roles need different dashboard layouts. Route-level checks (middleware) don't give component-level control over fallbacks and loading states.
- **Why this works:** Router component enables: (1) graceful degradation (shows default if role unknown), (2) loading state management per dashboard, (3) permission fallback UI without failing entire route, (4) composition with other routers
- **Trade-offs:** Router layer adds abstraction but provides better control. Slightly more indirection but cleaner separation of concerns.

#### [Gotcha] RoleDashboard component imports all role-specific dashboard implementations even if user doesn't have that role, causing code bloat (2026-01-13)

- **Situation:** RoleDashboardRouter imports AdminDashboard, AnalystDashboard, ManagerDashboard, etc. statically. Bundle includes code for all roles even if logged-in user is only Admin.
- **Root cause:** Static imports are easy to understand but waste bundle size. Dynamic imports (React.lazy) would require error boundaries for fallback UI.
- **How to avoid:** Simplicity vs bundle size. Each dashboard component adds ~5-10KB uncompressed even if unused for that user.

### Meeting minutes link to multiple downstream entities (calendar_events, engagements, working_group_meetings, dossiers, commitments, tasks) without back-references from those entities (2026-01-13)

- **Context:** Meeting is source of truth for attendees, actions, and decisions that generate downstream artifacts but no need for those artifacts to query back to the meeting
- **Why:** One-way references keep downstream entities focused on their domain. Avoids circular dependencies and lets downstream entities evolve independently. Add meeting link doesn't require migration of downstream schema
- **Rejected:** Bidirectional links (commitment.meeting_id) would couple entities and complicate deletion (if meeting deletes, what happens to commitment?)
- **Trade-offs:** Easy to trace from meeting to artifacts, hard to trace artifacts back to source meeting. Acceptable because meeting lookup happens infrequently (mostly during creation)
- **Breaking if changed:** If UI needs to show 'View meeting where this task was created', must implement denormalized meeting_id on task table or complex join through action_items

#### [Gotcha] Edge function must call .select().single() after INSERT to return the created record, not just INSERT without select (2026-01-14)

- **Situation:** Supabase edge function INSERT statement without explicit select returns null unless explicitly selecting the inserted row
- **Root cause:** Supabase by default returns row count only on INSERT; .select().single() forces server to return the full inserted record
- **How to avoid:** Extra database round-trip to fetch inserted row; guarantees API returns complete report data for immediate client use vs returning null and requiring separate GET

#### [Gotcha] Self-referential object definitions in TypeScript fail at runtime. An object cannot reference itself (e.g., complianceKeys.all) before it's fully defined, even though type definitions allow forward references. (2026-01-14)

- **Situation:** complianceKeys object tried to reference complianceKeys.all within its own initializer, causing circular reference issues during runtime object construction.
- **Root cause:** JavaScript evaluates object properties sequentially. When the property accessor (complianceKeys.all) is evaluated, the object doesn't exist yet in the scope, causing a reference error. Type checking doesn't catch this because types exist in a separate compilation phase.
- **How to avoid:** Using a separate constant (COMPLIANCE_BASE_KEY) adds an extra symbol but eliminates the circular dependency. Slightly more verbose but more reliable.

#### [Pattern] Multi-step feature implementation requires sequential verification gates: database schema, runtime values, routing, i18n registration, and route generation. Failures at any step cascade. (2026-01-14)

- **Problem solved:** Compliance feature touched multiple layers (DB, types, hooks, components, routing, i18n) and required verification that each layer was correctly integrated before the next could be tested.
- **Why this works:** Modern full-stack frameworks have multiple integration points. A missing route makes the component unreachable. Missing i18n causes translation errors. Missing imports cause runtime failures. Each layer builds on previous layers.
- **Trade-offs:** End-to-end verification catches integration issues early but requires creating temporary test artifacts and managing multiple verification phases. Faster feedback vs additional cleanup overhead.

### Side-by-side conflict view with collapsible details section using Framer Motion animations (2026-01-14)

- **Context:** Presenting conflicting events to users during calendar event creation without overwhelming the UI
- **Why:** Allows progressive disclosure - users see summary initially, can expand for full conflict period overlap details. Animations provide visual feedback that details are contextual, not permanent state changes
- **Rejected:** Modal overlay (breaks context with form), inline expansion without animation (feels jarring), separate detail page (too many clicks)
- **Trade-offs:** Added complexity of managing two visual states (collapsed/expanded) but improved UX by keeping users in the creation flow. Animation libraries add dependency weight
- **Breaking if changed:** Removing Framer Motion would require reimplementing collapse/expand without smooth visual transitions, degrading UX. Removing collapsible details forces showing all conflict info at once, cluttering the interface

#### [Gotcha] Component must manage state for both `proceedWithConflict` flag AND separate duration adjustment state, not a single conflict-resolution state object (2026-01-14)

- **Situation:** When user selects 'Adjust Duration', the event duration changes; when they select 'Proceed Anyway', a flag is set but form data unchanged. These are independent state paths
- **Root cause:** Proceeding with conflict is boolean flag that modifies validation behavior (skip conflict check). Duration adjustment is actual form data mutation (end time). Conflating them causes state management confusion
- **How to avoid:** More state variables but clearer intent. Easier to reason about: 'proceedWithConflict' is validation flag, duration changes are form mutations

### Separated relationship type guidance into independent component layer with validation logic in types file rather than embedded in form dialog (2026-01-14)

- **Context:** RelationshipFormDialog needed to guide users toward correct relationship types while preventing invalid combinations
- **Why:** Decoupling allows type validation logic to be reused across components (API validation, other forms) without duplication. Type definitions become single source of truth for relationship semantics
- **Rejected:** Embedding validation rules directly in RelationshipFormDialog component would couple UI rendering to business logic, making it hard to validate relationships server-side or in other contexts
- **Trade-offs:** Extra file/abstraction layer slightly increases cognitive load but enables testability of validation logic independent of React rendering. Validation can now be used in Node backend
- **Breaking if changed:** If validation logic is moved back into component, server-side validation will require duplicating rules or creating API-only version

### Implemented relationship metadata with category grouping (Membership, Hierarchy, Cooperation, Participation, Temporal, Association) rather than flat type list (2026-01-14)

- **Context:** Need to guide users through 20+ relationship types without overwhelming them
- **Why:** Categorical organization reduces cognitive load by grouping semantically related types. Allows progressive disclosure - users first choose category, then type. Makes recommendations more intelligent (only suggest types from relevant categories)
- **Rejected:** Flat searchable list would require users to know relationship nomenclature upfront. Command palette alone doesn't teach users about semantic differences
- **Trade-offs:** Added complexity in type definitions but significantly improves UX for non-expert users. Category grouping also enables analytics on which types users actually understand/use
- **Breaking if changed:** If categories are removed, recommendation engine loses its primary heuristic for suggesting compatible types. Users must rely on search/trial

### Validation logic validates (source dossier type, target dossier type) tuples against allowed type combinations rather than validating individual types in isolation (2026-01-14)

- **Context:** Some relationship types only valid between specific entity types (e.g., 'parent_org' only valid source→organization)
- **Why:** Context-dependent validation prevents creating semantically impossible relationships. Type alone isn't sufficient - 'parent_org' needs organizational hierarchy to make sense
- **Rejected:** Type-only validation would allow user to create 'parent_org' relationship between two people, which is nonsensical
- **Trade-offs:** Requires knowing both source and target types upfront, but enables smart recommendations and real-time validation. Can reject invalid combos before API roundtrip
- **Breaking if changed:** If validation removed, invalid relationship types can be created and will likely fail server-side, providing poor UX. API must have redundant validation

### Participant availability display uses badge count + tooltip pattern rather than full list expansion (2026-01-14)

- **Context:** Showing which participants are busy during conflict requires displaying availability without overwhelming UI
- **Why:** Badge count summarizes at a glance (e.g., '3 busy') while tooltip provides details on hover, balancing information density with readability; prevents layout thrashing from expanding participant lists
- **Rejected:** Full participant list expansion; dropdown menu; modal dialog for details
- **Trade-offs:** Tooltip discovery requires hover/interaction; better for desktop but requires fallback for touch; reduces initial cognitive load in exchange for interaction requirement
- **Breaking if changed:** If tooltip is removed, users lose conflict-causing participant details; if expanded to full list, UI becomes dense and mobile-unfriendly

#### [Gotcha] Duration adjustment directly modifies end datetime in parent form state rather than creating separate conflict resolution state (2026-01-14)

- **Situation:** Users selecting duration adjustments need those changes reflected in the CalendarEntryForm's datetime fields
- **Root cause:** Single source of truth - form state is already being submitted, avoiding need to sync duration changes back to form; simpler data flow than maintaining parallel conflict resolution state
- **How to avoid:** Tighter coupling between component and parent form structure; eliminates ghost state that could diverge from actual form submission values

#### [Pattern] Wrapped auto-save logic in custom hook (useAutoSaveForm) that returns both state and operations, allowing form components to remain simple (2026-01-14)

- **Problem solved:** Multi-step form needed draft persistence, progress tracking, restoration logic, and cleanup - complex behavior scattered across multiple concerns
- **Why this works:** Custom hook encapsulates IndexedDB operations, debouncing, TTL management, and state synchronization. Components consume simple interface (formData, progress, save, discard) without knowing about persistence layer. Enables reuse across different form implementations
- **Trade-offs:** Hook hides complexity but adds indirection; easier to test persistence logic in isolation; harder to debug data flow across hook boundaries

### Separated FormProgressIndicator and FormDraftBanner into distinct components rather than single unified component (2026-01-14)

- **Context:** Form had both progress tracking (top of form) and draft restoration (prominently displayed banner) - visually and functionally separate concerns
- **Why:** Separation allows independent mounting/unmounting and styling. Progress appears always; draft banner only when previous draft exists. Each component has single responsibility. Easier to test, reuse, and update independently
- **Rejected:** Single FormAutoSaveContainer component (tight coupling, harder to conditionally render, mixing concerns)
- **Trade-offs:** Two components require coordination via shared state but improves composition and testability; slightly more boilerplate
- **Breaking if changed:** Merging components would lock their lifecycle together - progress indicator would re-render on draft dismissal even though it shouldn't change

#### [Pattern] Relationship type validation separated into metadata-driven system with source/target dossier type constraints rather than hardcoded business logic (2026-01-14)

- **Problem solved:** Preventing users from creating invalid relationship combinations (e.g., Person cannot be 'Parent Organization Of' a Country)
- **Why this works:** Enables non-developers to maintain validation rules via type definitions; scales to handle 17+ relationship types with complex constraints; symmetric relationships and directional limitations become declarative
- **Trade-offs:** Increased upfront complexity in types file but eliminates runtime validation logic duplication; easier to audit all constraints in one place vs searching codebase

#### [Pattern] Relationship type metadata includes usage tips and anti-patterns (what NOT to use it for) alongside descriptions to guide user selection (2026-01-14)

- **Problem solved:** Similar-sounding types like 'Participant In' vs 'Member Of' lead to incorrect categorization; domain experts spend time correcting entries
- **Why this works:** Inline education reduces user errors at point of selection; anti-patterns explicitly warn against common mistakes ('For temporary event participation, use Participant In instead of Member Of')
- **Trade-offs:** Longer descriptions increase UI space; requires subject matter expert to review and maintain; may feel verbose to expert users

### Category grouping (Membership, Hierarchy, Cooperation, etc.) implemented as visual/logical structure rather than type system enumeration, enabling flexible reorganization (2026-01-14)

- **Context:** 17 relationship types need cognitive grouping for discoverability; requirements might shift to reorder or add categories without code changes
- **Why:** Categories are metadata in type definitions rather than hardcoded enum; allows product/domain teams to reorganize presentation without touching component logic
- **Rejected:** Categories as TypeScript enum - creates coupling between UI grouping and code; changing order requires rebuild
- **Trade-offs:** Metadata approach requires schema discipline but decouples presentation from type system; slightly larger initial implementation
- **Breaking if changed:** Removing category metadata collapses all 17 types into flat list; losing organizational structure increases selection friction

#### [Pattern] i18n translations split across separate EN/AR JSON files with full parallelism for relationship guidance content rather than single source file with conditional logic (2026-01-14)

- **Problem solved:** RTL languages (Arabic) require not just translation but reversed descriptions, alternative visual layouts, and context-specific guidance
- **Why this works:** Maintains semantic parity between languages; allows native speakers to adjust guidance without understanding type system; avoids complex runtime layout switching
- **Trade-offs:** Duplication of structure across EN/AR files but isolation of concerns; translation costs higher upfront but easier to maintain

### Implemented side-by-side comparison as a separate encapsulated component rather than inline within CalendarEntryForm (2026-01-14)

- **Context:** Needed to display overlapping event conflicts with detailed participant availability and resolution options in the event creation flow
- **Why:** Separation of concerns allows the component to manage its own expand/collapse state, severity calculations, and resolution workflows independently. Reduces CalendarEntryForm complexity and makes conflict resolution logic reusable across different event creation contexts
- **Rejected:** Inline conditional rendering within CalendarEntryForm would couple conflict visualization tightly with form logic, making testing harder and future reuse impossible
- **Trade-offs:** Extra component adds one more abstraction layer but gains testability, reusability, and clearer responsibility boundaries. State management becomes simpler per component at cost of slightly more prop drilling
- **Breaking if changed:** If this component is removed, conflict acknowledgment flow breaks - users lose visibility into which participants are affected and cannot make informed rescheduling decisions

#### [Gotcha] Component only renders when `conflicts.has_conflicts` is true, requiring parent CalendarEntryForm to handle conditional rendering rather than component self-checking (2026-01-14)

- **Situation:** SchedulingConflictComparison receives conflict data from parent form and must determine when to display itself
- **Root cause:** Passing responsibility to parent allows form to control when conflict data is fetched/computed. Component receives pre-computed conflicts and focuses only on display. Avoids duplicate conflict detection logic
- **How to avoid:** Parent becomes aware of component existence (tighter coupling) but conflict detection logic stays in one place. Component becomes simpler and purely presentational

### Used i18n translation keys in nested structure (`calendar.conflict.comparison.severity_critical`) with 20 new English and Arabic keys rather than inline strings (2026-01-14)

- **Context:** Component renders severity labels, button text, and informational messages that appear to users in both English and Arabic
- **Why:** Externalized strings enable single maintenance point for text changes. Nested key structure mirrors component hierarchy making translations discoverable. Arabic translations ensure product is genuinely bilingual not just English-first
- **Rejected:** Inline strings would work but prevent localization. Single flat translation key structure would be harder to navigate with 300+ keys per language
- **Trade-offs:** Extra translation file maintenance but gains product usability in Arabic market. Developers must remember to add translation keys before adding UI text
- **Breaking if changed:** Removing translation keys causes untranslated labels (i18n fallback keys) to appear in UI - poor user experience especially for Arabic speakers

### Resolution options implemented as separate method calls (`setRescheduleMode()`, `adjustDuration()`, `proceedWithConflict()`) rather than single handler with action types (2026-01-14)

- **Context:** Component needs to trigger four different resolution paths: reschedule, adjust duration, proceed anyway, or get AI suggestions
- **Why:** Separate methods make call sites explicit and self-documenting. Each method can handle its own validation/side effects. Parent doesn't need to parse action types. Easier to add logging/analytics per resolution path
- **Rejected:** Single handler with action types (dispatch model) would be more Redux-like but adds switch/case complexity and type safety challenges with unions
- **Trade-offs:** More prop drilling but simpler to understand per call site. Testing each flow is more explicit but requires more test cases
- **Breaking if changed:** If resolution method contracts change, must update all call sites in parent component

### Used Zustand store with localStorage persistence for entity history instead of URL state or context API (2026-01-14)

- **Context:** Needed to track recently visited entities across page navigations and page reloads
- **Why:** Zustand provides lightweight, persistent state that survives page reloads via localStorage. URL state would pollute URLs; Context API doesn't persist across reloads without additional logic
- **Rejected:** React Context alone (no persistence), URL query params (bloats URLs and back button behavior), sessionStorage (lost on browser close, less suitable for 'recent' history)
- **Trade-offs:** Easier: Simple selectors and actions, automatic localStorage hydration. Harder: Requires manual cleanup on storage quota limits, browser storage state can diverge if user clears localStorage manually
- **Breaking if changed:** Remove this store and breadcrumb disappears entirely; switching to Context API loses persistence across page reloads; changing storage key breaks existing user history

#### [Pattern] Created typed navigation hooks per entity type (useDossierNavigation, usePersonNavigation, etc.) instead of single generic hook (2026-01-14)

- **Problem solved:** Multiple entity detail pages needed to track navigation with different data shapes and routes
- **Why this works:** Typed hooks enable TypeScript to catch errors early (wrong entity data passed to dossier hook), make intent explicit, and allow customization per entity type (skip conditions, transformations). Generic hook would lose type safety
- **Trade-offs:** Easier: Type safety, IDE autocomplete, clear intent. Harder: Code duplication across hooks (mitigated by extract shared logic), more files to maintain

### Implemented entity icons via color-coded badges by type rather than image lookups or generic icons (2026-01-14)

- **Context:** Needed visual distinction between entity types (country, person, organization, position) in breadcrumb trail
- **Why:** Color-coded badges are lightweight (no image fetches), immediately scannable (users learn associations), work well in RTL, don't require external data. Image lookups would add complexity and load time
- **Rejected:** Country flags (political sensitivity, RTL layout issues), entity-specific image assets (requires API calls/CDN), generic generic icon for all (loses visual distinction)
- **Trade-offs:** Easier: No additional API calls, clean scalable SVG. Harder: Users must learn color associations, less visually rich than icons
- **Breaking if changed:** If color scheme changes to use same colors for multiple types, visual distinction is lost; if i18n text is removed, icon becomes only identifier

#### [Pattern] RTL support baked into EntityPreviewCard and dialog components via dir attribute inheritance, not wrapper overlay (2026-01-14)

- **Problem solved:** Arabic language support required for international dossier system; RTL must work in autocomplete previews
- **Why this works:** Attribute inheritance is CSS-native (avoids JS state duplication). Components check parent dir='rtl' or detect lang=ar in URL. Reduces bi-directional layout bugs caused by style overrides
- **Trade-offs:** Parent dir attribute must be set correctly or RTL fails silently. Components inherit without awareness. More performant than CSS-in-JS theme switching

### i18n structure uses separate namespace files (rich-autocomplete.json in EN/AR) instead of merging into root locale bundles (2026-01-14)

- **Context:** Feature adds ~40 new translation keys for component labels, error messages, help text
- **Why:** Feature-scoped namespacing allows independent feature deployment; prevents blocking on translation completion of unrelated strings. Enables lazy-loading translations per feature
- **Rejected:** Flat translation structure (all in one file, easier but blocks on full localization). Feature translations in inline JSX (no reuse across variants)
- **Trade-offs:** Requires i18n resource registration (one-time setup in index.ts). Modular but adds namespace lookup overhead (negligible with caching)
- **Breaking if changed:** Removing namespace registration causes missing translation fallback; UI shows translation keys instead of localized strings

### Separated error definition (types) from error presentation (components) from error management (hook) into distinct layers (2026-01-14)

- **Context:** Building an actionable error system that scales across multiple forms and error scenarios
- **Why:** Allows types to be reusable across backend/frontend contract, components to be composable at different granularities (message, summary, field), and hook to encapsulate business logic without coupling to UI. Each layer can evolve independently.
- **Rejected:** Monolithic ErrorHandler component that combines types, rendering, and state management would require prop drilling through validation layers and prevent reuse in different UI contexts
- **Trade-offs:** More files and indirection, but eliminates duplicate error handling code across forms. Developers must understand the three-layer pattern to use correctly.
- **Breaking if changed:** If you merge types into components, you lose the ability to use ActionableError interfaces in API response handlers or shared validation utilities without importing React components

#### [Gotcha] useActionableErrors hook generates error fixes for common patterns (email spaces, missing protocol) but these must be idempotent and field-aware (2026-01-14)

- **Situation:** Created auto-fix actions like 'removeSpaces' for email and 'addProtocol' for URLs, but if applied multiple times or to wrong field type, they fail silently
- **Root cause:** Auto-fixes must check field type before applying transformation. Email fix only works on email fields (not text fields with @ symbols). URL fix only adds protocol once (idempotent). This prevents cascading fixes that corrupt data.
- **How to avoid:** Requires field type context in the hook, making fixes less generic. Payoff: prevents data corruption. Each fix is safe to retry.

### Used enum for ErrorActionType instead of string literals or union types to control available actions and prevent arbitrary action types (2026-01-14)

- **Context:** Actions need to be predictable and have specific handling logic (auto_fix runs handler, navigate changes route, etc.)
- **Why:** Enum provides exhaustive type checking - TypeScript ensures all action types have corresponding handlers. Prevents typos like 'autofox' being treated as unknown action. Makes it possible to switch/case on action type without default catches.
- **Rejected:** String literals would allow any string and require runtime validation. Union types are less discoverable - developers can't see all available actions without reading type definition.
- **Trade-offs:** Enum requires explicit list maintenance, but eliminates runtime validation. Easier for IDE autocomplete and refactoring.
- **Breaking if changed:** If converted to string literals, consumers could pass unhandled action types that silently fail. If action type check is removed from handlers, invalid actions are silently ignored.

#### [Gotcha] i18n translations for actionable errors need both English and Arabic versions with context-aware strings, but translation keys must match across languages (2026-01-14)

- **Situation:** Created separate actionable-errors.json files for EN and AR, but if keys don't match (e.g., EN has 'email.invalid' but AR only has 'email_invalid'), i18n falls back to key name
- **Root cause:** i18n library returns the key itself if translation is missing. This creates untranslated strings in the UI. Keys must be consistent across all language files to avoid this.
- **How to avoid:** Requires discipline to keep all translation files in sync. Payoff: no untranslated strings in production. Using same structure for both EN/AR files makes this enforceable.

### Preview dialog added entity details (status, priority, assignee) to the PreviewItem interface rather than querying full entity data separately (2026-01-14)

- **Context:** Need to show sufficient context for users to make exclusion decisions without requiring additional API calls
- **Why:** Reducing API round-trips; preview data already contains enough context since items are pre-selected from list; avoids N+1 query pattern
- **Rejected:** Lazy-loading full entity details on dialog open (would add latency); showing only names (insufficient context for exclusion decisions)
- **Trade-offs:** Slightly larger dialog payload but eliminates loading states and API delays; simpler than lazy-loading but requires data to already be available
- **Breaking if changed:** If entity details aren't included in initial bulk selection, preview loses context and becomes just a confirmation dialog; excludes use cases where detailed review is critical

### Preview dialog integrates with existing useBulkActions hook methods (requestPreview, confirmPreview, cancelPreview) rather than creating separate state management (2026-01-14)

- **Context:** Need consistent state flow for bulk operations with preview capability without duplicating business logic
- **Why:** Reusing existing hook prevents state divergence between preview and execution; single source of truth for which items are included; reduces coupling to specific state library
- **Rejected:** Local component state for preview (duplicates inclusion tracking, causes sync bugs); separate preview context provider (adds provider hell and increases boilerplate)
- **Trade-offs:** Simpler state management and fewer sync bugs, but hook must be designed to support preview flow; less flexible if preview logic differs significantly
- **Breaking if changed:** If hook is removed or refactored, preview feature breaks; if preview state isn't persisted in hook, canceling preview loses user's exclusion selections

#### [Pattern] Progressive disclosure with field importance levels (required/recommended/optional) implemented via controlled state hook rather than form library abstraction (2026-01-14)

- **Problem solved:** Building a form system that needs to show/hide optional fields and track completion at multiple levels (field, group, overall)
- **Why this works:** Custom hook gives fine-grained control over progressive disclosure logic without coupling to specific form library. Allows independent group collapse/expand and completion tracking. Easier to implement conditional field visibility based on importance level without form library constraints
- **Trade-offs:** More boilerplate code upfront, but much more flexible for complex disclosure patterns. Easier to implement group-level completion tracking separate from field validation

#### [Gotcha] Group-level completion tracking required separate state management from individual field values because form validation state and UI completion state have different concerns (2026-01-14)

- **Situation:** Initially attempted to derive group completion solely from form validation state, but optional fields that are empty need to be considered 'complete' for progress purposes while still being optional
- **Root cause:** A group is UI-complete when all required fields are filled and all non-empty optional fields are valid, but incomplete when required fields are missing. This doesn't map cleanly to form validation errors. Separate completion state allows counting 'visible required fields filled' independently
- **How to avoid:** Extra state to maintain, but enables accurate progress reporting. Clearer semantics: completion tracking is about UX flow, not validation logic

#### [Pattern] Form configuration (fields, groups, validation) externalized into a config object rather than hardcoded in component, enabling reusability across different form contexts (2026-01-14)

- **Problem solved:** Demo page needed to showcase the progressive form system, but the same components need to work with different field/group configurations in production
- **Why this works:** Config-driven approach separates data from presentation. Demo can pass different formConfig to show flexibility, and production forms can inject their own config without modifying components. Enables composition and reusability
- **Trade-offs:** Need to define config schema and maintain type safety for formConfig, but enables plug-and-play form building. More initial setup but pays off quickly

### Mobile responsiveness and RTL support handled via Tailwind responsive classes and dir attributes rather than separate mobile/desktop component variants (2026-01-14)

- **Context:** App targets multiple screen sizes and languages including RTL (Arabic), so form needed to work seamlessly across all configurations
- **Why:** Single component that adapts via CSS eliminates maintenance burden of keeping mobile/desktop variants in sync. Tailwind's responsive utilities and CSS logical properties (which RTL-aware) handle layout flipping automatically. Testing a single component path is simpler than managing variants
- **Rejected:** Separate mobile/desktop component variants - doubles maintenance surface. Layout shifts based on viewport JS checks - less reliable and harder to debug
- **Trade-offs:** CSS becomes slightly more complex with responsive prefixes, but component logic stays simpler. RTL is handled automatically by CSS rather than JS logic
- **Breaking if changed:** Removing Tailwind responsive classes would require adding imperative layout logic in JS, making RTL support harder to maintain

#### [Pattern] Separated filter state management from UI rendering via dedicated `useActiveFilters` hook (2026-01-14)

- **Problem solved:** Need to display active filters across multiple pages and provide consistent removal/reset logic
- **Why this works:** Hook-based approach enables state logic reuse without tight coupling to component tree. Allows filter state to be managed independently from chip rendering, making it composable across DossierListPage and potentially other pages
- **Trade-offs:** Easier: reusability across pages, testable logic in isolation. Harder: requires understanding hook contract for implementation; requires passing filter state through props to hook

### Chip bar positioned between filter controls and results, not floating or sticky by default (2026-01-14)

- **Context:** Balancing visibility of active filters with screen real estate and mobile usability
- **Why:** Fixed position between controls and results creates clear visual flow: user adjusts filters → sees what's active → sees results. Avoids viewport space issues on mobile from floating bars
- **Rejected:** Sticky/floating bar - adds implementation complexity and can occlude results on small screens; collapsible bar hidden by default - reduces discoverability of active filters
- **Trade-offs:** Easier: simple DOM positioning, better mobile experience. Harder: takes permanent vertical space; may require scrolling on small screens with many active filters
- **Breaking if changed:** If positioned as sticky/floating without proper z-index management, overlaps results; if removed from DOM, users lose visibility of why results changed

### Placed digest configuration in dedicated /settings/email-digest route instead of in general settings page with tab structure (2026-01-15)

- **Context:** Email digest feature is complex enough to warrant its own page but needs to be discoverable from settings
- **Why:** Avoids cluttering main settings page; allows feature to grow (scheduled tests, digest preview, analytics) without architectural constraints
- **Rejected:** Tab-based approach in main settings would be simpler initially but limits future expansion; nested route structure allows independent maintenance
- **Trade-offs:** Additional navigation required; clearer separation of concerns; easier to lazy-load digest component; harder to provide unified settings UX if preferences scattered across routes
- **Breaking if changed:** If consolidating back to main settings page, need to restructure route hierarchy and adjust settings navigation UI

### File size validation done client-side with visual indicators (25MB per file, 100MB total, 10 files max) displayed in empty state component (2026-01-15)

- **Context:** Need to communicate upload constraints to users before they attempt drag-drop operation
- **Why:** Client-side limits shown upfront prevent user frustration of selecting files only to get rejected. Framer Motion animations and color-coding make constraints visible without blocking content. Server will still validate, but client provides fast feedback.
- **Rejected:** Silent validation on drop (show error after attempt) would require users to discover constraints through failure. Server-only validation shifts validation load and creates poor UX.
- **Trade-offs:** Client-side limits are easier to see but can become stale if server limits change. Requires duplication of validation logic. Easier UX vs maintainability burden.
- **Breaking if changed:** Removing displayed limits means users discover constraints only through upload failure. Changing limit values requires updates in two places (client display + server validation) or users see incorrect information.

### DocumentEmptyState is a pure presentation component (receives entity type, returns selected file + template callback) with no internal state management (2026-01-15)

- **Context:** Empty state is ephemeral - disappears once documents exist. Component needs to coordinate with parent EntityDocumentsTab
- **Why:** Stateless design makes component predictable and testable. Parent (EntityDocumentsTab) owns documents list and manages showing/hiding empty state. Single source of truth for 'does entity have documents' prevents sync bugs.
- **Rejected:** Component managing its own 'documents' state would duplicate document list logic. Component knowing about upload progress would tightly couple to uploader implementation.
- **Trade-offs:** Parent component becomes slightly more complex (managing visibility logic). Component more flexible and reusable but requires careful prop threading.
- **Breaking if changed:** If empty state manages upload state internally, parent can't coordinate with uploader or refresh documents after upload. Adding pagination or filtering becomes impossible without state restructuring.

#### [Pattern] Stored complete field configuration (label_en, label_ar, source_config, display_config, visibility_rules) in preview_layout_fields and returned as nested JSONB array instead of separate queries (2026-01-15)

- **Problem solved:** Admin UI and entity preview card both need full field configuration details to render correctly
- **Why this works:** Aggregating fields into single JSONB array via jsonb_agg avoids N+1 queries and returns exactly the shape needed by frontend (nested structure). Reduces round-trips and simplifies client-side assembly
- **Trade-offs:** Easier: Single query, optimized shape, no client-side joining. Harder: JSONB aggregation syntax is complex; changes to field schema require SQL updates

#### [Pattern] Check if person has existing relationships before showing AI suggestions feature (2026-01-15)

- **Problem solved:** Empty state for stakeholder networks - showing suggestions when person has zero relationships
- **Why this works:** AI suggestions are meant to bootstrap networks for isolated people. If relationships exist, showing suggestions clutters UI and wastes compute. Serves as feature gate
- **Trade-offs:** Requires additional DB query (`get_person_relationship_count`) but prevents unnecessary feature display. Cleaner UX for populated networks

### Implement suggestion logic in Supabase RPC functions rather than Edge Functions or frontend JavaScript (2026-01-15)

- **Context:** Generating multiple suggestion types from complex SQL queries across person, event, organization tables
- **Why:** RPC functions execute server-side with direct database access - no network latency. Complex joins (event attendees, org hierarchy) execute efficiently. Reduces payload sent to frontend
- **Rejected:** Edge Functions add extra hop and require duplicating query logic. Frontend JavaScript would load all related data then filter - massive payload and performance issue
- **Trade-offs:** RPC is less flexible than JavaScript but database-level performance is critical for this feature. Easier to optimize queries later
- **Breaking if changed:** Moving logic to frontend would require sending person's entire network graph to client, making even small networks slow

### Implemented role-based template recommendation via `suggestedFor` array on templates, filtering with `.filter(t => t.suggestedFor?.includes(userRole))` rather than pre-computing per-role template sets. (2026-01-15)

- **Context:** CalendarEmptyWizard needed to show different recommended templates based on user role (admin/manager/analyst/officer/viewer) while maintaining single source of truth
- **Why:** Adding new roles only requires updating one template's `suggestedFor` array, not creating new data structures per role. Scales better than role-keyed maps. Allows templates to be relevant to multiple roles.
- **Rejected:** Role-indexed template map: `{admin: [Meeting, Deadline], manager: [Meeting, Deadline, Training]}` - brittle when roles change, requires updating every template definition
- **Trade-offs:** Filter at render time (tiny perf cost) vs pre-computed role maps. Query-based approach is more maintainable and flexible for cross-cutting role changes.
- **Breaking if changed:** If `suggestedFor` array becomes required on all templates, existing templates without it would show to no roles. Must be defensive with `.filter(t => t.suggestedFor?.includes(...))`

### Template defaults (duration, reminder, eventType) stored directly on template object rather than in separate config or computed from template ID. Example: `{id: 'deadline', eventType: 'deadline', duration: 1440, reminder: true}` (2026-01-15)

- **Context:** CalendarEntryForm needs pre-filled values when opening from template. Could source defaults from template ID lookup or embed in template object.
- **Why:** Embedding defaults on template object keeps all template metadata colocated. No separate lookup table needed. Form can destructure template properties directly: `const {eventType, duration, reminder} = selectedTemplate`
- **Rejected:** Separate defaultsMap keyed by templateId - would split template definition across two files, harder to maintain, would require JOIN logic when rendering template
- **Trade-offs:** More data duplication in template definitions vs single source. Template object is larger but self-contained - better for reuse in different contexts.
- **Breaking if changed:** If template shape changes (remove `eventType`), form pre-fill breaks silently. Need runtime validation or TypeScript to catch at compile time.

#### [Gotcha] CalendarEmptyWizard must return `null` (not empty div) when not showing to prevent layout shift. Returning `<div/>` when hidden causes parent to reserve space for invisible wizard, breaking calendar grid centering. (2026-01-15)

- **Situation:** Initial integration showed wizard displaced calendar grid even when `showWizard=false` because component returned wrapper div
- **Root cause:** Calendar uses flexbox centering for empty state. Any child component, even invisible, affects flex calculations. Returning `null` removes component from DOM entirely.
- **How to avoid:** Returning null means re-mount on visibility toggle (animation state reset) vs keeping mounted but hidden. Chose remount for cleaner layout.

#### [Gotcha] UI state divergence: Members were successfully added to database but UI showed 'No Members Yet' until page refresh (2026-01-15)

- **Situation:** After completing the role assignment wizard and clicking 'Add 2 Members', the button submitted but the member list didn't update
- **Root cause:** The root cause appears to be missing cache invalidation or refetch trigger after the RPC call completed. The frontend likely fetched members once on mount but didn't re-fetch after the bulk add operation
- **How to avoid:** Page refresh is a workaround but poor UX. Proper fix would use React Query/SWR invalidation or real-time subscriptions. The manual refresh verified backend worked correctly

#### [Pattern] Empty state with smart suggestions: Rather than showing blank 'Add Members' form, system auto-generates suggestions from related data (lead org affiliates), decreasing user friction (2026-01-15)

- **Problem solved:** Working group creation often leaves members empty; users don't know who to add
- **Why this works:** Reduces activation friction by providing contextual suggestions based on existing relationships (lead organization). Users can accept suggestions with one click instead of searching for members. Transforms empty state from blocker to opportunity
- **Trade-offs:** Requires relationship traversal in database (slightly more complex schema), but dramatically improves user experience. Suggestions filter themselves out as users add members

### Created separate template types (templates, templateSets) with helper functions (generateDeliverablesFromTemplateSet) rather than storing templates in database (2026-01-15)

- **Context:** Supporting quick-add templates for common deliverable patterns without managing them in database
- **Why:** Templates are application logic defaults that should ship with the app version, not be runtime configuration. Hardcoding in TypeScript allows type safety, enables bundling optimization, and templates can be versioned with code. Database storage would require additional migrations and query overhead for every new deliverable creation
- **Rejected:** Storing templates in database as default records. Would add table complexity and require API endpoint for retrieving templates separately from user data
- **Trade-offs:** Easier: No database overhead, type-safe, can be imported anywhere. Harder: Changing templates requires code deployment; can't customize per-user or tenant
- **Breaking if changed:** Removing templates would break the quick-add UI feature and require users to manually fill all deliverable fields

#### [Pattern] Used TanStack Query hooks (useQuery, useMutation) with optimistic updates and cache invalidation for commitment deliverables state management (2026-01-15)

- **Problem solved:** Managing fetching, caching, and syncing of deliverable data across components without Redux or context API
- **Why this works:** TanStack Query handles stale data, automatic refetching, and cache invalidation automatically. Optimistic updates provide immediate UI feedback. This pattern avoids prop drilling and duplicate state management. Built-in handling of loading/error states reduces boilerplate
- **Trade-offs:** Easier: Less boilerplate, built-in sync mechanisms. Harder: Requires learning TanStack Query API and cache key strategy

### Implemented RLS (Row Level Security) policies at database level for commitment_deliverables table rather than relying on application-level authorization checks (2026-01-15)

- **Context:** Securing deliverable data so users can only access deliverables for commitments they have access to
- **Why:** Database-level RLS is the security boundary - if application layer is bypassed (direct API calls, database access), RLS still protects. It's enforced regardless of code path. Application-level checks can be forgotten or circumvented; database policies cannot. This follows principle of defense in depth
- **Rejected:** Only checking authorization in API middleware or React components. Application bugs could leak data; direct database queries would bypass checks
- **Trade-offs:** Easier: Guaranteed security. Harder: RLS policies are complex to test and debug; requires understanding of Supabase RLS syntax
- **Breaking if changed:** Removing RLS would immediately expose users to seeing each other's private deliverables; not fixable by application code alone

#### [Pattern] Implemented multi-platform bot integration with platform-specific Edge Functions (slack-bot, teams-bot) plus shared dispatcher service (2026-01-15)

- **Problem solved:** Need to support both Slack and Teams with different protocols/message formats while maintaining consistent notification delivery
- **Why this works:** Platform-specific handlers isolate protocol complexity (Slack events, Teams Adaptive Cards) from business logic, while dispatcher centralizes notification queuing and delivery retry logic
- **Trade-offs:** More files/functions but cleaner separation of concerns; adds coordination complexity between services but easier to scale/deprecate platforms

### Implemented i18n translations at both backend (bot messages) and frontend (settings page) levels (2026-01-15)

- **Context:** Bots send messages to Slack/Teams and settings UI needs localization; single source of translation vs. split responsibility
- **Why:** Backend translations ensure bot messages honor user workspace language preferences (e.g., Arabic Slack workspace gets Arabic briefings); frontend translations handle UI only. This keeps message generation close to content logic
- **Rejected:** Centralizing all translations in one service would require cross-service calls and language context threading through Edge Functions
- **Trade-offs:** Split translations require maintaining parity between files and managing language fallbacks in two places, but provides better isolation and independent scaling
- **Breaking if changed:** Removing frontend translations breaks UI; removing backend translations breaks bot message localization; inconsistency between them causes user confusion

#### [Pattern] Helper SQL functions (can_view_field, can_edit_field) encapsulate permission logic at database layer (2026-01-15)

- **Problem solved:** Permission checking needs to work consistently across API endpoints, RLS policies, and audit triggers without duplicating logic
- **Why this works:** Centralizing permission logic in SQL functions ensures single source of truth. Prevents authorization bugs from inconsistent implementations across the stack. RLS policies and Edge Functions both call same function.
- **Trade-offs:** Requires strong SQL knowledge. Makes debugging harder (logic is in database). But ensures security can't be bypassed by calling API differently.

#### [Pattern] Query keys structured hierarchically (agenda, agendas, agenda_items, etc.) enabling selective cache invalidation and prefetching (2026-01-15)

- **Problem solved:** Multiple UI components query different subsets of agenda data (list, details, items, participants, documents)
- **Why this works:** TanStack Query cache invalidation matches semantic boundaries - updating one item invalidates only item queries not whole agenda; enables prefetch on navigation
- **Trade-offs:** More keys to maintain but finer-grained cache control; easier to debug which queries are stale

### Unified view pattern for multi-source timeline aggregation (2026-01-15)

- **Context:** Stakeholder interactions come from multiple tables (direct interactions, annotations, external communications) requiring unified timeline display
- **Why:** A database view (`stakeholder_timeline_unified`) aggregates heterogeneous data sources into a single queryable interface, avoiding N+1 queries and complex application-level joins. Pagination and filtering happen at database level where indexes work efficiently.
- **Rejected:** Fetching from multiple tables separately and merging in application code would require: (1) multiple queries per request, (2) manual cursor tracking across datasets, (3) client-side sorting/filtering losing database index benefits
- **Trade-offs:** View is read-only (updates require triggers or stored procedures). Adds database schema complexity but eliminates runtime query complexity and improves query performance.
- **Breaking if changed:** Removing the view requires rewriting the Edge Function to handle multi-table joins, losing pagination efficiency and cursor-based navigation across heterogeneous data

#### [Pattern] Separation of timeline queries (list/stats) as distinct Edge Function endpoints (2026-01-15)

- **Problem solved:** Both timeline event listing and engagement statistics needed; different query patterns and caching strategies
- **Why this works:** Separate endpoints allow: (1) independent caching strategies (stats less frequently updated), (2) different pagination requirements (list needs pagination, stats doesn't), (3) avoiding inefficient joined queries that compute both simultaneously
- **Trade-offs:** Two API calls instead of one, slight latency increase. Stats endpoint is simpler, less likely to timeout on large datasets.

### Event type enum with direction/sentiment attributes instead of separate filter fields (2026-01-15)

- **Context:** Timeline events can be filtered by: type (call/email/note), direction (inbound/outbound), sentiment (positive/negative/neutral)
- **Why:** Modeling event_type as enum with associated direction/sentiment attributes in views allows: (1) enforcing valid combinations (inbound email is valid, outbound meeting is questionable), (2) single column index supporting all filter combinations, (3) database-level validation of event semantics
- **Rejected:** Separate type/direction/sentiment columns would allow invalid combinations and require multiple indexes or inefficient multi-column indexes
- **Trade-offs:** Fixed set of event types (requires migration to add types). Filtering UI must respect valid combinations. More semantic correctness but less flexible.
- **Breaking if changed:** Adding new event types requires schema migration. Removing event types breaks filters referencing old types. Queries assuming all combinations are valid will have logic errors.

#### [Pattern] Separated impact assessment as async job via dependency_rules table rather than real-time computation (2026-01-15)

- **Problem solved:** Impact changes can cascade through many entities, blocking requests would timeout
- **Why this works:** Allows configurable impact rules and thresholds without code changes. Impact assessments are persisted for audit trail. Rules can be toggled on/off or modified without redeployment.
- **Trade-offs:** Easier: dynamic rule management, audit trail, non-blocking. Harder: eventual consistency, requires async job scheduler, stale assessment risk

### Implemented dependency rules as configurable records in dependency_rules table rather than hardcoded heuristics (2026-01-15)

- **Context:** Impact propagation logic varies by entity type and relationship type; needs to change without code deployment
- **Why:** Rules engine allows non-technical users to adjust impact thresholds/logic. Avoids redeployment cycles. Enables A/B testing different impact models.
- **Rejected:** Hardcoded impact logic in Edge Function, AI-driven heuristics
- **Trade-offs:** Easier: flexibility, no redeploy cycles, auditable changes. Harder: rules need UI to manage, complex rule evaluation, rule conflicts possible
- **Breaking if changed:** Removing rules table would require rebuilding impact logic as code, lose changeability without deployment, impact assessment becomes brittle

#### [Pattern] Multi-channel distribution (email, in-app, Slack, Teams) abstracted through conditional evaluation engine (2026-01-15)

- **Problem solved:** Reports need delivery to multiple destinations with different payload formats and conditional logic
- **Why this works:** Decouples channel logic from report generation; conditions are evaluated once, applied to all channels; enables easy channel addition
- **Trade-offs:** Centralized condition engine is simpler but requires each channel adapter to handle its own payload transformation
