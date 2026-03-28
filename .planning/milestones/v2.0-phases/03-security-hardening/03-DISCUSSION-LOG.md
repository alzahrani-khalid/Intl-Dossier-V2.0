# Phase 3: Security Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 03-security-hardening
**Areas discussed:** RLS & org isolation

---

## Area Selection

| Option                    | Description                                                             | Selected |
| ------------------------- | ----------------------------------------------------------------------- | -------- |
| RLS & org isolation       | RLS audit, SDK verification, org-level data boundaries (SEC-01, SEC-05) | ✓        |
| Role-based access control | Replace clearance stubs with real RBAC (SEC-02)                         |          |
| Input validation strategy | Validation approach for ~60 API routes (SEC-04)                         |          |
| CSP & auth edge cases     | Helmet CSP + expired tokens, concurrent sessions (SEC-03, SEC-06)       |          |

**User's choice:** RLS & org isolation only; remaining areas deferred to Claude's discretion.

---

## RLS & Org Isolation

### Q1: RLS Testing Approach

| Option                           | Description                                                                    | Selected |
| -------------------------------- | ------------------------------------------------------------------------------ | -------- |
| Automated test suite             | Tests authenticate as different roles via Supabase SDK, verify authorized rows | ✓        |
| Manual audit + docs              | Systematically audit by hand, document findings, no automated regression       |          |
| Hybrid — audit first, then tests | Manual audit to understand state, then codify as automated tests               |          |

**User's choice:** Automated test suite
**Notes:** Catches regressions on every build.

### Q2: Organization Membership Model

| Option                              | Description                                                                     | Selected |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Single org per user (org_id column) | Each user belongs to one org. Simpler RLS: WHERE org_id = auth.jwt()->>'org_id' | ✓        |
| Multi-org membership table          | Users can belong to multiple orgs with different roles. Junction table needed.  |          |
| You decide based on codebase        | Let Claude inspect schema and decide                                            |          |

**User's choice:** Single org per user (org_id column)
**Notes:** Simpler RLS policy pattern.

### Q3: RLS Coverage Scope

| Option              | Description                                                                        | Selected |
| ------------------- | ---------------------------------------------------------------------------------- | -------- |
| All tables          | Every table gets RLS. Lookup tables get read-only public. Zero tables without RLS. | ✓        |
| Sensitive data only | Only diplomatic/classified data tables. Reference tables stay open.                |          |
| Tiered approach     | Classify into tiers (public, internal, classified) with different strictness.      |          |

**User's choice:** All tables
**Notes:** Zero exceptions — comprehensive coverage.

---

## Claude's Discretion

- Role-based access control design (SEC-02)
- Input validation strategy across ~60 API routes (SEC-04)
- Helmet CSP configuration (SEC-03)
- Auth edge case handling (SEC-06)

## Deferred Ideas

None — discussion stayed within phase scope.
