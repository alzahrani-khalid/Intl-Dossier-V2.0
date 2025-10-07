# Research Findings: Front Door Intake

**Generated**: 2025-01-29 | **Feature**: 008-front-door-intake

## AI Integration Strategy

### Decision: Hybrid AI with AnythingLLM + pgvector
**Rationale**: 
- AnythingLLM provides self-hosted LLM capabilities for triage classification
- pgvector enables efficient semantic search for duplicate detection
- Combination ensures data sovereignty while maintaining performance

**Alternatives Considered**:
- OpenAI API: Rejected due to data sovereignty requirements
- Pure pgvector: Insufficient for complex triage classification
- Elasticsearch ML: Higher resource overhead, less integration with PostgreSQL

### Best Practices Applied:
- Separate embedding generation from query processing
- Cache embeddings with 24h TTL for fallback scenarios
- Use cosine similarity with configurable thresholds
- Implement circuit breaker pattern for AI service calls

## Bilingual Form Architecture

### Decision: i18next with React Hook Form
**Rationale**:
- i18next provides robust RTL/LTR support with namespace isolation
- React Hook Form offers performant validation with TypeScript support
- Combined solution handles field-level translations efficiently

**Alternatives Considered**:
- Formik: Heavier bundle size, less performant with large forms
- Native HTML5 validation: Insufficient for complex bilingual requirements
- Custom solution: Unnecessary complexity given mature libraries

### Best Practices Applied:
- Separate translation namespaces per form type
- Lazy-load translations based on selected language
- Store user language preference in Supabase profile
- Use Intl API for date/number formatting

## SLA Management Pattern

### Decision: PostgreSQL triggers with Supabase Realtime
**Rationale**:
- Database-level triggers ensure accurate SLA tracking
- Realtime subscriptions enable live countdown updates
- Eliminates clock drift between client and server

**Alternatives Considered**:
- Client-side timers: Unreliable, subject to clock drift
- Cron-based checks: Less responsive, higher latency
- Redis TTL: Additional infrastructure complexity

### Best Practices Applied:
- Store SLA events as immutable audit log
- Use database time functions (NOW()) for consistency
- Implement pause/resume logic for business hours
- Batch SLA breach notifications

## File Upload Strategy

### Decision: Supabase Storage with pre-validation
**Rationale**:
- Built-in RLS policies for secure access
- Direct browser uploads reduce server load
- Supports resumable uploads for large files

**Alternatives Considered**:
- MinIO: Additional infrastructure to maintain
- Direct PostgreSQL storage: Poor performance for large files
- AWS S3: Data sovereignty concerns

### Best Practices Applied:
- Client-side file type/size validation before upload
- Generate presigned URLs with short TTL
- Implement virus scanning webhook on upload
- Store file metadata separately from binary data

## Queue Management Architecture

### Decision: Optimistic UI with TanStack Query
**Rationale**:
- Optimistic updates improve perceived performance
- Query invalidation ensures data consistency
- Built-in retry logic for failed mutations

**Alternatives Considered**:
- Redux/RTK Query: More boilerplate for similar functionality
- SWR: Less mature ecosystem for complex caching
- Direct Supabase subscriptions: Harder to manage cache invalidation

### Best Practices Applied:
- Implement stale-while-revalidate pattern
- Use mutation keys for granular cache updates
- Prefetch queue data on navigation
- Implement infinite scroll for large queues

## Security Implementation

### Decision: Row Level Security with JWT claims
**Rationale**:
- Database-enforced security prevents bypassing
- JWT claims enable fine-grained access control
- Supabase Auth integrates seamlessly with RLS

**Alternatives Considered**:
- Application-level ACL: Less secure, more complex
- OAuth2 scopes: Overkill for internal system
- Custom auth: Unnecessary given Supabase capabilities

### Best Practices Applied:
- Implement least-privilege principle in RLS policies
- Use security definer functions for elevated operations
- Audit log all sensitive operations
- Implement rate limiting at API Gateway level

## Performance Optimization

### Decision: Database indexing strategy with query optimization
**Rationale**:
- Proper indexes critical for queue filtering performance
- Composite indexes for common filter combinations
- Partial indexes for status-based queries

**Alternatives Considered**:
- Elasticsearch: Overkill for current scale
- Redis caching: Added complexity for marginal benefit
- Materialized views: Maintenance overhead

### Best Practices Applied:
- Create indexes for all foreign keys
- Use covering indexes for queue list queries
- Implement database connection pooling
- Monitor slow query log

## Testing Strategy

### Decision: Contract-first testing with Playwright
**Rationale**:
- Contract tests ensure API stability
- Playwright provides cross-browser testing
- Visual regression testing for UI consistency

**Alternatives Considered**:
- Cypress: Less stable for cross-browser testing
- Selenium: More complex setup and maintenance
- Manual testing: Insufficient coverage

### Best Practices Applied:
- Generate tests from OpenAPI contracts
- Implement page object pattern for E2E tests
- Use test containers for database isolation
- Parallelize test execution in CI

## Monitoring & Observability

### Decision: Structured logging with correlation IDs
**Rationale**:
- Correlation IDs enable request tracing
- Structured logs improve searchability
- Native to Supabase edge functions

**Alternatives Considered**:
- APM solutions: Additional cost and complexity
- Custom telemetry: Reinventing the wheel
- Basic console logging: Insufficient for production

### Best Practices Applied:
- Log at appropriate levels (INFO, WARN, ERROR)
- Include user context in audit logs
- Implement log retention policies
- Use sampling for high-volume endpoints

## Deployment Architecture

### Decision: Docker Compose with health checks
**Rationale**:
- Aligns with constitution requirements
- Simplifies local development setup
- Health checks enable proper orchestration

**Alternatives Considered**:
- Kubernetes: Overkill for current scale
- Direct deployment: Lacks consistency
- Serverless: Incompatible with AnythingLLM

### Best Practices Applied:
- Multi-stage builds for smaller images
- Use .dockerignore to exclude unnecessary files
- Implement readiness and liveness probes
- Use environment-specific compose files

---

## Summary of Resolved Decisions

All technical context items have been researched and decisions made:
- ✅ AI integration patterns defined
- ✅ Bilingual form architecture selected
- ✅ SLA management approach determined
- ✅ File upload strategy confirmed
- ✅ Queue management patterns established
- ✅ Security implementation detailed
- ✅ Performance optimization planned
- ✅ Testing strategy defined
- ✅ Monitoring approach selected
- ✅ Deployment architecture confirmed

**Next Step**: Proceed to Phase 1 - Design & Contracts