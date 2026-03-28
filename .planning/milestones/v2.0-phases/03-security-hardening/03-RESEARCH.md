# Phase 3: Security Hardening - Research

**Researched:** 2026-03-24
**Domain:** Application security -- RLS, RBAC, input validation, CSP, auth edge cases
**Confidence:** HIGH

## Summary

Phase 3 hardens the Intl-Dossier application across five security domains: RLS audit and organization isolation, role-based access control, input validation, Helmet/CSP configuration, and authentication edge cases. The codebase already has significant security infrastructure but with critical gaps that leave the application vulnerable.

The backend uses two authentication middlewares (`auth.ts` with custom JWT and `supabase-auth.ts` with Supabase Auth), both populating `req.user`. There are 45+ RLS migration files but no systematic audit verifying all tables have policies. Input validation coverage is mixed: countries, tasks, events, contacts, mous, and auth routes use Zod schemas via a centralized `validate()` middleware, while intelligence, cache-metrics, and some entity-search endpoints accept unvalidated input. The `profiles` table has `organization_id` and `clearance_level` columns but the `supabase-auth.ts` middleware hardcodes `DEFAULT_ORGANIZATION_ID` instead of reading from the profile, bypassing real org isolation.

**Primary recommendation:** Standardize on Zod validation (already the dominant pattern), audit every table for RLS via Supabase SDK tests, replace the hardcoded org ID in `supabase-auth.ts` with profile lookup, harden Helmet CSP with explicit Sentry/AnythingLLM origins, and unify the dual auth middleware system.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Verify RLS via automated test suite -- tests authenticate as different user roles via Supabase SDK and verify each table returns only authorized rows. Catches regressions on every build.
- **D-02:** Organization membership is single-org per user (org_id column on profiles). RLS policies use `WHERE org_id = auth.jwt()->>'org_id'` pattern.
- **D-03:** ALL tables get RLS enabled -- zero exceptions. Lookup/reference tables get read-only public access policies. Sensitive data tables get org-scoped policies.

### Claude's Discretion

- **D-04:** Replace clearance middleware stubs with real RBAC. Inspect existing `permission-delegation.service.ts` and `backend/src/middleware/auth.ts` to determine current state and design the role hierarchy based on existing patterns.
- **D-05:** Decide on validation approach (per-route validators, shared Zod schemas, or middleware pattern) based on codebase patterns. Goal: every API endpoint rejects malformed input with structured validation errors.
- **D-06:** Configure Helmet with strict CSP whitelisting only Supabase, Sentry, and AnythingLLM origins. Existing setup at `backend/src/middleware/security.ts` should be hardened.
- **D-07:** Handle expired tokens, concurrent sessions, and password reset flows. Inspect current auth middleware for gaps.

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                      | Research Support                                                                                                                                                                                                                                                                 |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-01 | Every Supabase table has RLS policies verified via live audit    | 45+ RLS migrations exist but no systematic verification. Test suite needed per D-01. profiles table has org_id. tenant_isolation schema exists.                                                                                                                                  |
| SEC-02 | Clearance middleware replaced from placeholder stub to real RBAC | `auth.ts` has `requireRole()` and `requirePermission()` -- functional but roles are simple strings. `permission-delegation.service.ts` adds delegation layer. Role hierarchy: admin, editor, viewer (users table) + super_admin, manager (field permissions). Needs unification. |
| SEC-03 | Helmet configured with strict CSP                                | Helmet v8.1.0 already configured in `security.ts`. CSP exists but missing Sentry DSN origin and AnythingLLM origin. `reportOnly` in dev mode. Needs production enforcement.                                                                                                      |
| SEC-04 | All API endpoints validate and sanitize input                    | Zod `validate()` middleware in `utils/validation.ts` already used by ~14 of 21 route files (97 validate() calls). ~7 routes/endpoints have gaps (intelligence trends/signals, cache-metrics, some entity-search).                                                                |
| SEC-05 | Organization isolation implemented                               | `profiles.organization_id` column exists. `supabase-auth.ts` hardcodes `DEFAULT_ORGANIZATION_ID`. `entity-search.service.ts` already filters by org. `tenant_isolation` schema with session variables exists but unused by middleware.                                           |
| SEC-06 | Auth edge cases handled                                          | Token expiry handled in `auth.ts` (catches `TokenExpiredError`). `supabase-auth.ts` uses `getUser()` which validates tokens server-side. Missing: concurrent session limits, refresh token rotation enforcement, password reset token expiry.                                    |

</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library               | Version | Purpose                                 | Why Standard                                                                         |
| --------------------- | ------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| zod                   | 4.3.6   | Schema validation for all API input     | Already dominant in codebase (14/21 route files), TypeScript-native, <0.1ms overhead |
| helmet                | 8.1.0   | Security headers and CSP                | Industry standard, already configured in security.ts                                 |
| @supabase/supabase-js | 2.98.0  | RLS testing via authenticated SDK calls | Required by D-01 for SDK-level RLS verification                                      |
| jsonwebtoken          | 9.0.3   | JWT token handling                      | Already used in auth.ts                                                              |
| express-validator     | 7.3.1   | Legacy validation (3 routes)            | Positions/permissions/signatures use it -- migrate to Zod                            |

### Supporting

| Library | Version | Purpose                                | When to Use                            |
| ------- | ------- | -------------------------------------- | -------------------------------------- |
| vitest  | 4.0.18  | Test runner for RLS and security tests | RLS audit test suite, validation tests |

### Alternatives Considered

| Instead of       | Could Use         | Tradeoff                                                                                       |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| Zod (chosen)     | express-validator | express-validator already used in 3 routes but Zod is dominant (14 routes); standardize on one |
| Manual RLS audit | pgTAP             | pgTAP is DB-level testing; SDK-level tests per D-01 catch more realistic scenarios             |

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
  middleware/
    auth.ts                    # Unified auth middleware (merge JWT + Supabase)
    rbac.ts                    # NEW: Role-based access control middleware
    security.ts                # Helmet + CSP (harden)
    rate-limit.middleware.ts   # Already consolidated
  utils/
    validation.ts              # Zod validate() middleware (existing, extend)
  schemas/                     # NEW: Shared Zod schemas per domain
    country.schema.ts
    task.schema.ts
    event.schema.ts
    ...
tests/
  security/
    rls-audit.test.ts          # NEW: Per-table RLS verification
    rbac.test.ts               # NEW: Role-based access tests
    validation.test.ts         # NEW: Input rejection tests
    auth-edge-cases.test.ts    # NEW: Token expiry, sessions, reset
```

### Pattern 1: Zod Validation Middleware (Existing)

**What:** Centralized `validate()` function wrapping Zod schema parsing for body, query, params
**When to use:** Every route handler -- no exceptions
**Example:**

```typescript
// Source: backend/src/utils/validation.ts (existing pattern)
export const validate = (schema: {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = await schema.body.parseAsync(req.body)
      if (schema.query) req.query = (await schema.query.parseAsync(req.query)) as any
      if (schema.params) req.params = (await schema.params.parseAsync(req.params)) as any
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          new ValidationError(
            'Validation failed',
            error.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
              type: i.code,
            })),
          ),
        )
      } else next(error)
    }
  }
}
```

### Pattern 2: RLS Testing via Supabase SDK

**What:** Authenticate as different roles, verify table access returns only authorized rows
**When to use:** RLS audit test suite (SEC-01, SEC-05)
**Example:**

```typescript
// Source: Supabase RLS testing pattern
import { createClient } from '@supabase/supabase-js'

// Create client with user's JWT (not service_role)
const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${userToken}` } },
})

// This query should be filtered by RLS
const { data, error } = await userClient.from('countries').select('*')
// Verify only org-scoped data returned
expect(data.every((row) => row.organization_id === userOrgId)).toBe(true)
```

### Pattern 3: RBAC Middleware

**What:** Role hierarchy check middleware that replaces string-based role checks
**When to use:** All protected endpoints requiring specific roles
**Example:**

```typescript
// Recommended: Hierarchical role check
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  editor: 40,
  viewer: 20,
}

export const requireMinRole = (minRole: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError())
    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0
    if (userLevel < requiredLevel) return next(new ForbiddenError())
    next()
  }
}
```

### Pattern 4: Unified Auth Middleware

**What:** Single middleware that handles both JWT and Supabase Auth tokens
**When to use:** Replace the current dual-middleware system
**Example:**

```typescript
// Unified: Try Supabase Auth first, fall back to custom JWT
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next(new UnauthorizedError('No token provided'))

  // Try Supabase Auth first (primary)
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)
  if (user) {
    // Fetch profile with org_id and clearance
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, clearance_level')
      .eq('user_id', user.id)
      .single()

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'viewer',
      organization_id: profile?.organization_id, // NOT hardcoded
      clearance_level: profile?.clearance_level || 1,
    }
    return next()
  }
  // ... fallback to custom JWT for backward compat
}
```

### Anti-Patterns to Avoid

- **Hardcoded org IDs:** `supabase-auth.ts` line 14 hardcodes `DEFAULT_ORGANIZATION_ID = '4d931519-...'` -- this MUST be replaced with profile lookup
- **Dual auth middlewares:** Having both `auth.ts` (custom JWT) and `supabase-auth.ts` (Supabase Auth) creates confusion about which middleware guards which routes. Unify.
- **Service role bypass without audit:** RLS policies with `TO service_role USING (true)` are correct for backend operations but must be logged
- **Missing validation on entity-type params:** `intelligence.ts` lines 21-28 accept `entityType` as raw string from URL without enum validation
- **Inline role checks:** `positions.ts` line 275 checks `['admin', 'analyst'].includes(req.user?.role)` inline instead of using middleware

## Don't Hand-Roll

| Problem               | Don't Build             | Use Instead                                       | Why                                                   |
| --------------------- | ----------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| Input sanitization    | Custom regex sanitizers | Zod `.transform()` + DOMPurify                    | XSS edge cases are endless; Zod handles type coercion |
| CSP header generation | Manual header strings   | Helmet's `contentSecurityPolicy` directive object | CSP syntax is error-prone; Helmet handles escaping    |
| JWT verification      | Custom token parsing    | `jsonwebtoken.verify()` or Supabase `getUser()`   | Timing attacks, algorithm confusion attacks           |
| Rate limiting         | Custom counters         | `express-rate-limit` (already consolidated)       | Redis-backed sliding window; race conditions handled  |
| Password hashing      | Custom bcrypt calls     | `bcrypt.hash()` with cost factor >= 12            | Already used; don't lower cost factor                 |

**Key insight:** The codebase already has most security building blocks -- the problem is gaps in coverage and configuration, not missing libraries.

## Common Pitfalls

### Pitfall 1: RLS Policies Exist But Are Not Enforced

**What goes wrong:** Tables have `ENABLE ROW LEVEL SECURITY` but no policies, meaning all access is denied (or all access is allowed if using service_role).
**Why it happens:** RLS is enabled in migration but policy creation fails silently or is in a different migration file.
**How to avoid:** Automated test that queries every table as an authenticated (non-service-role) user and verifies it either returns data or a permission error -- never a silent empty result when data exists.
**Warning signs:** Queries returning empty results unexpectedly in development.

### Pitfall 2: Supabase Service Role Key Leaking to Frontend

**What goes wrong:** Service role key bypasses all RLS -- if it reaches the frontend, any user can access any data.
**Why it happens:** Environment variable confusion between `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
**How to avoid:** Verify service role key is only in backend `.env`, never in frontend build. Add a test that greps frontend build output for the service role key pattern.
**Warning signs:** Frontend bundle containing `SUPABASE_SERVICE_ROLE_KEY` string.

### Pitfall 3: CSP Breaking Frontend Features

**What goes wrong:** Strict CSP blocks Sentry error reporting, font loading, or WebSocket connections.
**Why it happens:** CSP directives are too restrictive; missing `connect-src` for Sentry or Supabase Realtime.
**How to avoid:** Start with `reportOnly: true`, monitor violations in browser console, then switch to enforcement after fixing all violations. Add Sentry DSN domain and AnythingLLM origin explicitly.
**Warning signs:** Console errors starting with `Refused to connect/load/execute` in production.

### Pitfall 4: Organization Isolation Only at API Level

**What goes wrong:** API middleware filters by org_id but RLS policies don't -- a direct Supabase client call from frontend bypasses API middleware.
**Why it happens:** Developers add org filtering in Express handlers but forget RLS policies.
**How to avoid:** Org isolation MUST be at the RLS level (database). API middleware is defense-in-depth, not the primary control.
**Warning signs:** Frontend using `supabase.from('table').select()` without org filtering and seeing cross-org data.

### Pitfall 5: Validation Schemas Not Matching Database Constraints

**What goes wrong:** Zod schema allows values the database rejects (or vice versa), causing 500 errors instead of 400.
**Why it happens:** Schema defined independently of DB constraints; they drift over time.
**How to avoid:** Schema enum values must match database CHECK constraints. Document the mapping.
**Warning signs:** PostgreSQL constraint violation errors (23514) in production logs.

### Pitfall 6: Dual Auth Middleware Inconsistency

**What goes wrong:** Some routes use `authenticateToken` (custom JWT), others use `supabaseAuth` (Supabase Auth), and they populate `req.user` with different shapes.
**Why it happens:** `auth.ts` uses `tenantId` while `supabase-auth.ts` uses `organization_id`. Different fields available depending on which middleware ran.
**How to avoid:** Unify to a single auth middleware. Standardize `req.user` interface.
**Warning signs:** `req.user?.tenantId` being undefined when route uses supabaseAuth, or vice versa.

## Code Examples

### Validated Route Handler (Existing Pattern to Replicate)

```typescript
// Source: backend/src/api/countries.ts (existing, good pattern)
router.get('/', validate({ query: countryFiltersSchema }), async (req, res, next) => {
  try {
    const filters = req.query  // Already validated and typed
    const result = await countryService.getCountries(filters as any)
    res.json({ data: result.data, pagination: { ... } })
  } catch (error) {
    next(error)
  }
})
```

### Unvalidated Route Handler (Must Fix)

```typescript
// Source: backend/src/api/intelligence.ts (missing validation)
// BEFORE: Raw params, no validation
router.get('/insights/:entityType/:entityId', async (req, res, next) => {
  const { entityType, entityId } = req.params // NOT VALIDATED
  // ...
})

// AFTER: Add schema validation
const insightParamsSchema = z.object({
  entityType: z.enum(['country', 'organization', 'forum', 'engagement', 'topic']),
  entityId: z.string().uuid(),
})
router.get(
  '/insights/:entityType/:entityId',
  validate({ params: insightParamsSchema }),
  async (req, res, next) => {
    /* ... */
  },
)
```

### CSP Configuration (Hardened)

```typescript
// Source: backend/src/middleware/security.ts (to be updated)
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    scriptSrc: ["'self'"],
    connectSrc: [
      "'self'",
      process.env.SUPABASE_URL,                    // Supabase API
      process.env.SUPABASE_URL?.replace('https://', 'wss://'),  // Supabase Realtime
      process.env.SENTRY_DSN ? new URL(process.env.SENTRY_DSN).origin : null,  // Sentry
      process.env.ANYTHINGLLM_API_URL,             // AnythingLLM
    ].filter(Boolean),
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    workerSrc: ["'self'", 'blob:'],  // For service workers
  },
  reportOnly: false,  // Enforce in production
}
```

### RLS Test Pattern

```typescript
// Source: Supabase RLS best practices
describe('RLS: countries table', () => {
  it('user sees only their org data', async () => {
    const client = createAuthenticatedClient(orgAUserToken)
    const { data } = await client.from('countries').select('*')
    // Every returned row must belong to org A
    expect(data?.every((r) => r.organization_id === ORG_A_ID)).toBe(true)
  })

  it('user cannot see other org data', async () => {
    const client = createAuthenticatedClient(orgAUserToken)
    const { data } = await client.from('countries').select('*').eq('organization_id', ORG_B_ID)
    expect(data).toHaveLength(0)
  })

  it('service role can see all data', async () => {
    const { data } = await supabaseAdmin.from('countries').select('*')
    expect(data?.length).toBeGreaterThan(0)
  })
})
```

## State of the Art

| Old Approach                   | Current Approach                 | When Changed   | Impact                                                      |
| ------------------------------ | -------------------------------- | -------------- | ----------------------------------------------------------- |
| express-validator (imperative) | Zod schemas (declarative)        | 2024+          | 14/21 routes already use Zod; 3 still use express-validator |
| Manual JWT verification        | Supabase `getUser()` server-side | Supabase JS v2 | More secure; validates token with Supabase Auth server      |
| Per-route CSP headers          | Helmet v8 contentSecurityPolicy  | Helmet v7+     | Centralized, declarative CSP management                     |
| `reportOnly` CSP               | Enforced CSP                     | Best practice  | Must switch from `reportOnly` in production                 |

**Deprecated/outdated:**

- `xssFilter` (Helmet): Browser XSS auditor removed from all major browsers. Helmet still sets it for older browsers, harmless but not protective.
- Custom JWT auth when Supabase Auth available: The codebase has both -- should unify on Supabase Auth.

## Open Questions

1. **What tables exist without RLS policies?**
   - What we know: 45+ RLS migration files exist, `tenant_isolation` schema created
   - What's unclear: Complete list of tables that have RLS enabled but no policies, or don't have RLS enabled at all
   - Recommendation: First task in plan should query `pg_tables` joined with `pg_policies` to enumerate gaps. Use Supabase MCP or admin client.

2. **What role values exist in the database?**
   - What we know: `users.role` CHECK constraint allows `admin`, `editor`, `viewer`. Field-level permissions reference `super_admin`, `admin`, `manager`. `staff_profiles.role` has `staff`, `supervisor`, `admin`.
   - What's unclear: Whether all role values are actually used; whether `super_admin` exists in users table or only in field_level_permissions
   - Recommendation: Query `SELECT DISTINCT role FROM users` and `SELECT DISTINCT role FROM staff_profiles` to determine actual role usage before designing RBAC hierarchy.

3. **Is the tenant_isolation schema actually used?**
   - What we know: Migration `20260113500001_tenant_isolation_layer.sql` creates `tenant_isolation` schema with `set_tenant_context()` function and audit tables
   - What's unclear: Whether any middleware or service calls `tenant_isolation.set_tenant_context()` -- it may be dead infrastructure
   - Recommendation: Grep for `set_tenant_context` usage. If unused, decide whether to adopt it or use simpler JWT-claim-based org isolation per D-02.

## Validation Architecture

### Test Framework

| Property           | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| Framework          | Vitest v4.0.18                                         |
| Config file        | `vitest.config.ts` (root) + `backend/vitest.config.ts` |
| Quick run command  | `pnpm vitest run --reporter=verbose`                   |
| Full suite command | `pnpm test`                                            |

### Phase Requirements to Test Map

| Req ID | Behavior                                           | Test Type        | Automated Command                                           | File Exists? |
| ------ | -------------------------------------------------- | ---------------- | ----------------------------------------------------------- | ------------ |
| SEC-01 | Every table has RLS policies; SDK queries filtered | integration      | `pnpm vitest run tests/security/rls-audit.test.ts -x`       | No -- Wave 0 |
| SEC-02 | Unauthorized role gets 403 on restricted endpoints | integration      | `pnpm vitest run tests/security/rbac.test.ts -x`            | No -- Wave 0 |
| SEC-03 | Helmet CSP blocks unauthorized origins             | unit             | `pnpm vitest run tests/security/csp.test.ts -x`             | No -- Wave 0 |
| SEC-04 | Malformed input returns 400 with structured errors | unit             | `pnpm vitest run tests/security/validation.test.ts -x`      | No -- Wave 0 |
| SEC-05 | Cross-org data inaccessible                        | integration      | `pnpm vitest run tests/security/org-isolation.test.ts -x`   | No -- Wave 0 |
| SEC-06 | Expired tokens return 401; sessions handled        | unit+integration | `pnpm vitest run tests/security/auth-edge-cases.test.ts -x` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm vitest run tests/security/ -x`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/security/rls-audit.test.ts` -- covers SEC-01, SEC-05
- [ ] `tests/security/rbac.test.ts` -- covers SEC-02
- [ ] `tests/security/csp.test.ts` -- covers SEC-03
- [ ] `tests/security/validation.test.ts` -- covers SEC-04
- [ ] `tests/security/auth-edge-cases.test.ts` -- covers SEC-06
- [ ] `tests/security/test-helpers.ts` -- shared fixtures: authenticated Supabase clients per role, test org setup

## Environment Availability

| Dependency        | Required By              | Available                   | Version       | Fallback |
| ----------------- | ------------------------ | --------------------------- | ------------- | -------- |
| Supabase (remote) | RLS audit, org isolation | Yes                         | PG 17.6.1.008 | --       |
| Redis             | Rate limiting tests      | Yes (used by existing code) | 7.x           | --       |
| Node.js           | All                      | Yes                         | 20.19.0+      | --       |
| pnpm              | Package management       | Yes                         | 10.29.1+      | --       |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `backend/src/middleware/auth.ts`, `supabase-auth.ts`, `security.ts` -- direct code inspection
- Codebase analysis: `backend/src/utils/validation.ts` -- existing Zod validate() pattern
- Codebase analysis: `backend/src/api/*.ts` (21 route files) -- validation coverage audit
- Codebase analysis: `supabase/migrations/` (45+ RLS files) -- existing policy patterns
- Codebase analysis: `backend/src/services/permission-delegation.service.ts` -- delegation RBAC
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- Official RLS patterns
- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- Index recommendations

### Secondary (MEDIUM confidence)

- [Supabase RLS Best Practices for Multi-Tenant Apps](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- JWT claim patterns for tenant isolation
- [Zod Express Validation Guide (2026)](https://dev.to/1xapi/how-to-validate-api-requests-with-zod-in-nodejs-2026-guide-3ibm) -- Zod v4.x patterns with Express 5
- [Multi-Tenant RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) -- org_id column patterns

### Tertiary (LOW confidence)

- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all packages already installed and in use; versions verified against npm registry
- Architecture: HIGH -- patterns derived from existing codebase code (14/21 routes already use recommended Zod pattern)
- Pitfalls: HIGH -- identified from actual code gaps (hardcoded org ID, dual auth middleware, missing validation on specific routes)
- RLS coverage: MEDIUM -- know 45+ migration files exist but cannot enumerate actual table-to-policy mapping without DB query

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable domain; security practices don't change rapidly)
