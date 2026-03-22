# Codebase Concerns

**Analysis Date:** 2026-03-23

## Tech Debt

### Incomplete Service Implementations

**Duplicate Detection Service:**

- Issue: Core duplicate detection logic not implemented - throws "Not implemented" errors
- Files: `backend/src/services/duplicate-detection-service.ts` (lines 34, 50)
- Impact: Fuzzy matching for contacts and similarity scoring are stubs; any call to `findDuplicates()` or `calculateSimilarity()` will fail
- Fix approach: Implement fuzzy matching using PostgreSQL `pg_trgm` extension (already available), Levenshtein distance for names, exact email/phone matching

### Missing Notification Integrations

**Health Score & MoU Notifications:**

- Issue: Two critical TODO markers for notification triggers
- Files:
  - `backend/src/jobs/refresh-health-scores.job.ts` (line 249) - missing operations team alerts
  - `backend/src/services/MoUService.ts` (lines 394, 437) - missing notification triggers for status transitions and deliverable completion
- Impact: Health score drops and MoU state changes occur silently with no user/operations notifications
- Fix approach: Wire `NotificationService` calls in both locations; implement Sentry/Prometheus integration for health-scores job failure alerts

### Clearance Level Validation Placeholder

**Incomplete Authorization Checks:**

- Issue: Clearance level middleware is a placeholder implementation
- Files: `backend/src/middleware/clearance-check.ts` (line 44)
- Impact: Currently allows all access; no actual clearance validation until user clearance system is implemented
- Fix approach: Add `clearance_level` column to users table, implement database function `check_clearance_level()` with proper entity type checking

### Database Migration Tooling

**Node-PG-Migrate Integration:**

- Issue: Migration system not properly integrated; rollback logic not implemented
- Files: `backend/src/db/migrate.ts` (lines 45, 76, 86)
- Impact: Migrations may not rollback correctly; database state issues harder to recover from
- Fix approach: Complete integration with `node-pg-migrate`, implement proper rollback logic with transaction support

### Organization Check Incomplete

**Entity Organization Validation:**

- Issue: Entity organization check not implemented
- Files: `backend/src/middleware/organization-check.ts` (line 146)
- Impact: Multi-organization isolation may not be enforced; data leakage risk between organizations
- Fix approach: Query entity organization mapping table, validate user org matches entity org

## Security Considerations

### Clearance-Based Access Control

**Risk:** Classified/sensitive entities accessible without clearance validation

- Current state: Middleware passes all requests (placeholder)
- Recommendation: Implement database-backed clearance checks before production; add audit logging for entity access

### Intake Entity Link Access Control

**Risk:** Users may create links to entities they shouldn't access

- Files: `backend/src/api/intake-entity-links.ts` (line 315)
- Current state: TODO comment indicates access check not yet implemented
- Recommendation: Validate user permissions on both intake ticket and target entity before allowing link creation

### Environment Variables in Multiple Locations

**Risk:** `.env` files present in multiple paths (root, backend, frontend, deploy, docker)

- Files: `.env`, `backend/.env`, `frontend/.env`, `deploy/.env`, `docker/anythingllm/.env`, `.auto-claude/.env`, `supabase/functions/.env`
- Current state: `.env` files should be in `.gitignore` (verify)
- Recommendation: Audit which variables are actually needed per workspace; consolidate via environment-specific configs

### Console Logging in Production Code

**Risk:** Sensitive information may be logged to stdout/stderr

- Files: Multiple services log request data:
  - `backend/src/services/email-service.ts` (lines 72-78) - logs email content including To, Subject
  - `backend/src/services/dossier-service.ts` - logs cache operations
  - `backend/src/services/assignment-sla.service.ts` - SLA warnings
- Impact: Email content, error details visible in logs; may expose PII or classified information
- Recommendation: Use structured logger (already imported `logInfo`/`logError`) instead of console methods; strip sensitive fields

## Performance Bottlenecks

### Redis Cache Warnings Indicate Fallback Behavior

**Cache Reliability Issue:**

- Issue: Multiple `console.warn` calls for cache read/write failures suggest cache is unreliable
- Files: `backend/src/services/dossier-service.ts` (lines 666, 678, 728, 843, 855, 899, 933)
- Impact: Frequent cache misses force direct database queries; performance degradation under load
- Symptom: Optimized queries fall back to direct queries when cache fails
- Improvement path:
  1. Monitor Redis connection stability
  2. Implement cache warming for high-traffic dossier queries
  3. Add cache health metrics to monitoring

### Search Timeout Handling

**Graceful Degradation Issue:**

- Issue: Search filters time out, returning partial results
- Files: `backend/src/services/search.service.ts` (line 161)
- Impact: Users may see incomplete search results without knowing
- Improvement path:
  1. Add explicit "partial results" indicator to UI
  2. Implement query optimization for slow filter searches
  3. Consider async search for complex filters

### Vector Embeddings Generation

**Error Handling Pattern:**

- Issue: Failed embeddings return `null` silently
- Files: `backend/src/services/intelligence-embeddings.ts` (line 104 logs error but continues)
- Impact: Intelligence signals indexed without proper vector representation; search quality degrades
- Improvement path: Queue failed embeddings for retry; implement dead-letter handling

## Fragile Areas

### Search Service Error Handling

**Fragile Pattern:**

- Files: `backend/src/services/fulltext-search.service.ts` (lines 180-220)
- Why fragile: Multiple entity types searched in sequence; if one fails, partial results returned with silent fallback
- Safe modification: Add error tracking per entity type; return error status alongside results
- Test coverage: Need integration tests for multi-entity search failures

### State Transition Validation

**Fragile Pattern:**

- Files: `backend/src/services/MoUService.ts` (lines 103-117 state transitions, 351-402 transition logic)
- Why fragile: State machine hardcoded in service; adding new states requires code changes
- Safe modification: Move state transitions to database enum; use database constraints for validation
- Test coverage: Contract tests exist but may not cover all edge case transitions

### Overdue Commitments Job

**Operational Risk:**

- Files: `backend/src/jobs/detect-overdue-commitments.job.ts` (line 77)
- Why fragile: No alert integration on consecutive failures; job could fail silently for extended periods
- Impact: Overdue commitments not detected; users unaware of deadline violations
- Safe modification: Implement AlertService integration; add job status monitoring

## Missing Critical Features

### Duplicate Detection

**Feature Gap:**

- Problem: No mechanism to detect/merge duplicate contacts or entities
- Blocks: Contact hygiene, data quality improvements
- Impact: System accumulates duplicate records over time
- Priority: High - data quality degrades without this

### Notification Infrastructure

**Feature Gap:**

- Problem: Multiple places trigger notifications but integration incomplete
- Blocks: Users don't receive alerts for important events
- Impact: Stakeholders unaware of status changes, escalations, expiries
- Priority: High - affects user engagement

### Robust Job Failure Handling

**Feature Gap:**

- Problem: Background jobs (health scores, overdue commitments) fail silently
- Blocks: Operational visibility; incident response delayed
- Impact: System state becomes inconsistent without operator knowledge
- Priority: High - affects data consistency

## Test Coverage Gaps

### Service Unit Tests

**Untested Area:**

- What's not tested: `duplicate-detection-service.ts`, full `MoUService.ts` state transitions
- Files: `backend/src/services/duplicate-detection-service.ts`, `backend/src/services/MoUService.ts`
- Risk: Code changes break undetected; refactoring impossible safely
- Gap: No unit test file exists; would need `*.test.ts` or `*.spec.ts`

### Middleware Authorization Tests

**Untested Area:**

- What's not tested: Clearance checks, organization isolation, entity access validation
- Files: `backend/src/middleware/clearance-check.ts`, `backend/src/middleware/organization-check.ts`
- Risk: Authorization bypass introduced without detection
- Priority: Critical - security-sensitive code

### Job Integration Tests

**Untested Area:**

- What's not tested: Health score refresh job end-to-end, overdue commitment detection
- Files: `backend/src/jobs/*.job.ts`
- Risk: Job failures discovered in production
- Gap: No Playwright/Jest tests covering full job execution with mocked Redis/Supabase

### Search Failure Scenarios

**Untested Area:**

- What's not tested: Partial failures in multi-entity search, cache miss recovery
- Files: `backend/src/services/fulltext-search.service.ts`, `backend/src/services/search.service.ts`
- Risk: Silent failures return incomplete results
- Coverage: Need tests for each entity type search failing independently

## Known Limitations

### HeroUI v3 Beta Status

**Limitation:**

- Issue: HeroUI v3 is in beta; breaking changes expected
- Impact: Component API may change; migration path unclear
- Current state: Drop-in replacement pattern in place (re-exports); partial migration done
- Mitigation: Monitor HeroUI releases; test component updates thoroughly

### Vector Embeddings Dimension Constraint

**Limitation:**

- Issue: Vector embeddings fixed at 1536 dimensions (BGE-M3 model)
- Impact: Switching embedding models requires data migration
- Constraint: PostgreSQL pgvector extension type created with dimension; can't change per-query
- Mitigation: Version embedding dimensions if model upgrade planned

---

_Concerns audit: 2026-03-23_
