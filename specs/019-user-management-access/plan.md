# Implementation Plan: User Management & Access Control

**Branch**: `019-user-management-access` | **Date**: 2025-10-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-user-management-access/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements comprehensive user lifecycle management and access control for the Intl-DossierV2.0 system, including user onboarding/offboarding, role-based access control (RBAC), time-bound permission delegation, and access review/recertification. The implementation addresses critical security and compliance gaps in the government system by providing dual-approval workflows for admin roles, automatic session termination on role changes, delegation chain validation, and comprehensive audit trails. The system will support both employee and guest user types with proper access scoping and automatic expiration handling.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), Node.js 18+ LTS, React 19
**Primary Dependencies**: Supabase (Auth, PostgreSQL 15+, RLS, Realtime), TanStack Query v5, React Router, i18next, shadcn/ui
**Storage**: PostgreSQL 15+ (Supabase) with extensions: pg_cron (scheduled jobs), pgcrypto (secure tokens)
**Testing**: Vitest (unit/integration), Playwright (E2E), contract tests for API endpoints
**Target Platform**: Web application (responsive desktop/tablet/mobile), backend Edge Functions on Supabase
**Project Type**: Web (frontend + backend monorepo)
**Performance Goals**:
  - User creation: <2 seconds end-to-end
  - Role changes: Take effect within 30 seconds
  - Access review report generation: <10 seconds for any user group
  - Delegation expiration processing: <1 minute after expiration time
  - Bulk role changes: <30 seconds for 100+ users
**Constraints**:
  - Role change requires immediate session termination (all active sessions invalidated within 5 seconds)
  - Dual approval for admin role assignments (requires two distinct administrators)
  - No transitive delegation chains (only direct grantor → grantee)
  - Audit log retention: 7 years immutable storage
  - Access review scheduling: Automatic quarterly with manual override capability
**Scale/Scope**:
  - Expected user base: 500-1000 government employees + 200-500 guest accounts
  - Concurrent administrators: Up to 100 during bulk operations
  - Delegation records: Estimated 1000-2000 active delegations
  - Audit log entries: ~50,000/year retention requirement

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with project constitution (.specify/memory/constitution.md):

### Core Principles Compliance

- [x] **Mobile-First & Responsive**: User management UI components will be built mobile-first with progressive breakpoints (base → sm: → md: → lg:), minimum 44x44px touch targets for buttons, forms optimized for mobile input
- [x] **RTL/LTR Support**: All forms, tables, and UI components will use logical properties (ms-*, me-*, ps-*, pe-*), support Arabic RTL with proper text alignment and icon flipping
- [x] **Test-First**: Contract tests for user management APIs, integration tests for role assignment workflows, E2E tests for user lifecycle (onboarding, delegation, deactivation)
- [x] **Type Safety**: TypeScript strict mode enabled, explicit types for User, Role, Delegation, AuditLog entities, no `any` usage
- [x] **Security by Default**: RLS policies on users, roles, delegations, audit_logs tables; Supabase Auth JWT validation; rate limiting on user management endpoints (10 req/min per IP)
- [x] **Performance**: Indexed queries on user lookups, role assignments; Redis caching for active user sessions; delegation expiration cron job (<1 min processing); access review queries <10s
- [x] **Accessibility**: WCAG AA compliance for user forms, proper ARIA labels, keyboard navigation for role assignment UI, 4.5:1 contrast ratio

### Security & Compliance

- [x] **Data Protection**: User data protected via RLS policies enforcing role-based access; password hashing via Supabase Auth; MFA support for admin roles
- [x] **Audit Trail**: Comprehensive audit logging for all user management actions (creation, role changes, delegation, deactivation) with immutable logs, 7-year retention
- [x] **Authentication**: Supabase Auth with JWT validation, RBAC enforcement via RLS policies, session timeout (30 minutes), immediate session termination on role changes

### Quality Standards

- [x] **Code Organization**: Backend Edge Functions in `supabase/functions/`, Frontend components in `frontend/src/components/user-management/`, hooks in `frontend/src/hooks/use-user-*.ts`
- [x] **Naming Conventions**: PascalCase for React components (UserProfileForm, RoleAssignmentDialog), kebab-case for hooks (use-user-session.ts), SQL migrations follow YYYYMMDDHHMMSS_description.sql
- [x] **Code Style**: ESLint/Prettier enforced via pre-commit hooks, Winston logger for backend, explicit try-catch blocks for error handling, no console.log in production
- [x] **Git Workflow**: Conventional commits (feat/fix/chore), PRs kept ≤300 LOC where possible, UI changes include screenshots, schema changes documented

### Development Workflow

- [x] **Specification**: Feature spec exists at `specs/019-user-management-access/spec.md` following spec-template.md with user stories, requirements, success criteria
- [x] **Planning**: This plan includes technical context, constitution compliance, project structure, and will track complexity violations if needed
- [x] **Task Organization**: Tasks will be organized by user story (US1-US6), include exact file paths, [P] markers for parallel work
- [x] **UI Components**: Will check shadcn/ui for Form, Table, Dialog, Badge components before custom builds; approved registries (originui, aceternity) for specialized components

**Violations Requiring Justification**: None identified. Feature fully complies with constitution principles.

## Project Structure

### Documentation (this feature)

```
specs/019-user-management-access/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── user-lifecycle.yaml         # User creation, activation, deactivation APIs
│   ├── role-management.yaml        # Role assignment, dual approval workflow APIs
│   ├── delegation.yaml             # Permission delegation APIs
│   └── access-review.yaml          # Access review and recertification APIs
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Web application structure
backend/
└── supabase/
    ├── migrations/
    │   ├── YYYYMMDDHHMMSS_create_user_profiles.sql
    │   ├── YYYYMMDDHHMMSS_create_roles_table.sql
    │   ├── YYYYMMDDHHMMSS_create_delegations.sql
    │   ├── YYYYMMDDHHMMSS_create_access_reviews.sql
    │   ├── YYYYMMDDHHMMSS_create_user_sessions.sql
    │   └── YYYYMMDDHHMMSS_setup_rls_policies.sql
    └── functions/
        ├── create-user/
        ├── assign-role/
        ├── delegate-permissions/
        ├── deactivate-user/
        ├── process-delegation-expiry/  # Cron job function
        └── generate-access-review/

frontend/
├── src/
│   ├── components/
│   │   └── user-management/
│   │       ├── UserProfileForm.tsx
│   │       ├── RoleAssignmentDialog.tsx
│   │       ├── DelegationManager.tsx
│   │       ├── AccessReviewDashboard.tsx
│   │       ├── UserTable.tsx
│   │       └── GuestAccountForm.tsx
│   ├── pages/
│   │   ├── users/
│   │   │   ├── UsersListPage.tsx
│   │   │   ├── UserDetailPage.tsx
│   │   │   └── AccessReviewPage.tsx
│   │   └── auth/
│   │       └── ActivateAccountPage.tsx
│   ├── hooks/
│   │   ├── use-user-session.ts
│   │   ├── use-role-assignment.ts
│   │   ├── use-delegation.ts
│   │   └── use-access-review.ts
│   └── services/
│       └── user-management-api.ts
└── tests/
    ├── contract/
    │   ├── user-lifecycle.test.ts
    │   ├── role-management.test.ts
    │   ├── delegation.test.ts
    │   └── access-review.test.ts
    ├── integration/
    │   ├── user-onboarding.test.ts
    │   ├── role-assignment-workflow.test.ts
    │   └── delegation-expiry.test.ts
    └── e2e/
        ├── user-lifecycle.spec.ts
        ├── admin-role-approval.spec.ts
        └── access-review.spec.ts
```

**Structure Decision**: Web application structure selected. This feature is a full-stack user management system requiring both database schema (backend migrations), Edge Functions (backend API), and comprehensive UI (frontend components/pages). The structure follows the existing monorepo pattern with backend Supabase assets and frontend React application.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
