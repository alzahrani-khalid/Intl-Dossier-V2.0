# Phase 3: Security Hardening - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Enforce access control, validate all input, and follow OWASP best practices for handling classified diplomatic data. Covers: RLS audit & org isolation, role-based access control, input validation on all API endpoints, Helmet/CSP configuration, and auth edge cases.

</domain>

<decisions>
## Implementation Decisions

### RLS & Organization Isolation (SEC-01, SEC-05)
- **D-01:** Verify RLS via automated test suite — tests authenticate as different user roles via Supabase SDK and verify each table returns only authorized rows. Catches regressions on every build.
- **D-02:** Organization membership is single-org per user (org_id column on profiles). RLS policies use `WHERE org_id = auth.jwt()->>'org_id'` pattern.
- **D-03:** ALL tables get RLS enabled — zero exceptions. Lookup/reference tables get read-only public access policies. Sensitive data tables get org-scoped policies.

### Role-Based Access Control (SEC-02)
- **D-04:** Claude's Discretion — Replace clearance middleware stubs with real RBAC. Inspect existing `permission-delegation.service.ts` and `backend/src/middleware/auth.ts` to determine current state and design the role hierarchy based on existing patterns.

### Input Validation (SEC-04)
- **D-05:** Claude's Discretion — Currently only 3 of ~60 API routes use express-validator (positions, permissions, signatures). Decide on validation approach (per-route validators, shared Zod schemas, or middleware pattern) based on codebase patterns. Goal: every API endpoint rejects malformed input with structured validation errors.

### Helmet & CSP (SEC-03)
- **D-06:** Claude's Discretion — Configure Helmet with strict CSP whitelisting only Supabase, Sentry, and AnythingLLM origins. Existing setup at `backend/src/middleware/security.ts` should be hardened.

### Auth Edge Cases (SEC-06)
- **D-07:** Claude's Discretion — Handle expired tokens, concurrent sessions, and password reset flows. Inspect current auth middleware at `backend/src/middleware/auth.ts` and `backend/src/middleware/supabase-auth.ts` for gaps.

### Claude's Discretion
Claude has flexibility on D-04 through D-07 — the user trusts best-practice approaches for RBAC design, validation strategy, CSP configuration, and auth edge case handling. Research phase should investigate current state and recommend specific approaches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security Infrastructure
- `backend/src/middleware/auth.ts` — Current authentication middleware
- `backend/src/middleware/supabase-auth.ts` — Supabase-specific auth handling
- `backend/src/middleware/security.ts` — Helmet and security headers setup
- `backend/src/middleware/rate-limit.middleware.ts` — Rate limiting (consolidated in Phase 1)
- `backend/src/services/permission-delegation.service.ts` — Permission delegation logic

### RLS Policies
- `supabase/migrations/20260206120012_rls_policies.sql` — Main RLS policy migration
- `supabase/migrations/20260206180000_fix_forums_rls_policy.sql` — Forum-specific RLS fix
- `supabase/migrations/20260205000001_fix_dossier_insert_rls.sql` — Dossier insert RLS fix

### Validation (Current State)
- `backend/src/api/positions.ts` — One of 3 routes with express-validator
- `backend/src/api/permissions.ts` — One of 3 routes with express-validator
- `backend/src/api/signatures.ts` — One of 3 routes with express-validator

### API Routes (Full Set)
- `backend/src/api/index.ts` — Route registry (all ~60 endpoints)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/middleware/security.ts` — Helmet already imported and configured, needs CSP hardening
- `backend/src/middleware/rate-limit.middleware.ts` — Rate limiting already consolidated with Redis
- `backend/src/services/permission-delegation.service.ts` — Existing delegation logic to build RBAC on
- 15+ RLS migration files — Existing policies to audit, not start from scratch
- `express-validator` already a dependency — 3 routes demonstrate the pattern

### Established Patterns
- Supabase Auth with JWT middleware — token verification flow exists
- Express middleware chain — auth → rate-limit → route handlers
- Supabase RLS migrations — SQL-based policy management

### Integration Points
- Auth middleware sits between rate-limiter and route handlers in `backend/src/api/index.ts`
- RLS policies are applied at database level via Supabase migrations
- Frontend uses `@supabase/supabase-js` which automatically sends auth tokens

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants comprehensive coverage with automated testing as the primary verification method.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-security-hardening*
*Context gathered: 2026-03-24*
