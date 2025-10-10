<!--
Sync Impact Report:
Version Change: 0.0.0 → 1.0.0
Rationale: Initial constitution establishment for Intl-DossierV2.0 project

Modified Principles: N/A (initial creation)
Added Sections:
  - Core Principles (7 principles)
  - Security & Compliance Requirements
  - Quality Standards
  - Governance

Templates Status:
  ✅ plan-template.md - Verified: Constitution Check section aligns with principles
  ✅ spec-template.md - Verified: User story priorities and requirements align
  ✅ tasks-template.md - Verified: Task categorization reflects principle-driven types
  ⚠ Command files - Pending: Agent-specific files need generic principle references

Follow-up TODOs: None - all placeholders filled

Last Synced: 2025-10-09
-->

# Intl-DossierV2.0 Project Constitution

## Core Principles

### I. Mobile-First & Responsive Design (NON-NEGOTIABLE)

Every UI component MUST be built mobile-first with progressive enhancement for larger screens. All components MUST start with base styles for mobile (320-640px) and use Tailwind breakpoints progressively: base → sm: → md: → lg: → xl: → 2xl:. Desktop-first patterns are strictly prohibited. Touch targets MUST be minimum 44x44px with adequate spacing (min 8px gap between interactive elements).

**Rationale**: GASTAT staff and international partners access the system on various devices. Mobile accessibility is critical for field work and remote collaboration scenarios.

**Validation**: All UI components must pass responsive design audit checklist before merge.

### II. RTL/LTR Internationalization (NON-NEGOTIABLE)

All UI components MUST support bidirectional text (Arabic RTL and English LTR) using logical properties exclusively. Physical directional properties (left/right, ml-*/mr-*, pl-*/pr-*) are prohibited. MUST use ms-*, me-*, ps-*, pe-*, text-start, text-end, start-*, end-* instead. Every component MUST detect language direction and flip directional icons accordingly.

**Rationale**: GASTAT operates in Saudi Arabia where Arabic is the primary language, with English as secondary. Full bilingual support with proper RTL handling is a core business requirement, not a feature.

**Validation**: Component reviews must verify use of logical properties and test Arabic rendering.

### III. Test-First Development (MANDATORY)

For new features requiring tests, tests MUST be written FIRST and verified to FAIL before implementation begins. Red-Green-Refactor cycle is strictly enforced. Contract tests are required for new endpoints, integration tests for user journeys, and E2E tests for critical flows (login, dashboard, core CRUD operations).

**Rationale**: Test-first ensures requirements clarity, prevents regression, and maintains code quality in a complex multi-entity relationship system where bugs can cascade across dossiers.

**Validation**: PRs with new functionality must show test files committed before implementation files (git history check).

### IV. Type Safety & Strict Mode (NON-NEGOTIABLE)

TypeScript strict mode MUST be enabled project-wide. All variables, functions, and React props MUST have explicit types. Use of `any` is prohibited except when interfacing with untyped third-party libraries, where it must be wrapped in typed abstractions. Null safety via optional chaining (?.) and nullish coalescing (??) is required.

**Rationale**: The dossier system has complex entity relationships (8-tier architecture). Type safety prevents runtime errors from cascading through relationships and ensures data integrity.

**Validation**: TypeScript compiler must pass with zero errors. ESLint must flag any use of `any` or missing return types.

### V. Security & Privacy by Default

Row Level Security (RLS) MUST be enabled on all Supabase tables. Authentication MUST use Supabase Auth with JWT validation. All API routes MUST validate tokens. Sensitive data (passwords, API keys, secrets) MUST NEVER be committed to git. Environment variables are required for all configuration. Helmet HTTP security headers MUST be enabled. CORS MUST be configured for allowed origins only. Rate limiting MUST be applied to all API routes.

**Rationale**: GASTAT handles sensitive international relations data including confidential MoUs, intelligence signals, and diplomatic positions. Security breaches could damage international partnerships.

**Validation**: Database migrations must include RLS policies. Security scanning in CI/CD pipeline. Code review checklist includes security verification.

### VI. Performance & Scalability

Database queries MUST use indexes and avoid N+1 patterns. Frequently accessed data MUST be cached in Redis with appropriate TTL. React components MUST use lazy loading for route-based code splitting. Large lists MUST implement virtualization. API responses MUST complete within 200ms p95 latency. Image assets MUST be optimized and lazy loaded.

**Rationale**: System manages thousands of dossiers, positions, and relationships. Poor performance impacts staff productivity and user satisfaction across international collaborations.

**Validation**: Performance testing with k6. Monitoring via Prometheus/Grafana. Database query analysis in code reviews.

### VII. Accessibility (WCAG AA Compliance)

All UI components MUST meet WCAG AA standards. Semantic HTML MUST be used. ARIA labels MUST be provided where necessary. Color contrast MUST meet 4.5:1 ratio minimum. All interactive elements MUST be keyboard accessible. Forms MUST have proper labels and error messages.

**Rationale**: GASTAT is a government entity with accessibility obligations. International partners have diverse accessibility needs.

**Validation**: axe-playwright tests must pass. Keyboard navigation verification in E2E tests. Manual accessibility audit before production releases.

## Security & Compliance Requirements

### Data Protection

All documents uploaded to the system MUST be scanned for viruses using ClamAV. Documents with scan_status='infected' MUST be quarantined and download-prevented. Documents MUST have sensitivity levels (public, internal, confidential, secret) enforced via RLS policies. Personal data MUST be handled per Saudi Data & AI Authority (SDAIA) regulations.

### Audit Trail

All create, update, delete operations on dossiers, MoUs, positions, and assignments MUST be logged to audit_logs table with: user_id, timestamp, action, entity_type, entity_id, old_values, new_values. Audit logs MUST be immutable (no updates/deletes allowed). Logs MUST be retained for minimum 7 years per government records retention policy.

### Authentication & Authorization

Users MUST authenticate via Supabase Auth with email/password or SSO integration. Multi-factor authentication (MFA) MUST be available for administrative roles. Role-based access control (RBAC) MUST enforce least-privilege principle. Session timeout MUST be 30 minutes of inactivity.

## Quality Standards

### Code Organization

Follow project structure conventions:
- Backend: Express + TypeScript with src/api/, src/services/, src/middleware/
- Frontend: React 19 with src/components/, src/pages/, src/hooks/, src/store/
- Tests: Vitest for unit/integration, Playwright for E2E
- Database: SQL migrations in backend/migrations/

### Naming Conventions

- React components: PascalCase (e.g., DossierCard.tsx)
- Utilities/hooks: kebab-case (e.g., use-dossier.ts)
- SQL migrations: YYYYMMDDHHMMSS_description.sql
- Test files: *.test.ts or *.test.tsx

### Code Style

ESLint and Prettier MUST be used and pass before commits (enforced via lint-staged and Husky). No console.log in production code (use Winston logger). Error handling MUST be explicit with try-catch blocks. Comments MUST focus on WHY, not WHAT (code should be self-documenting).

### Git Workflow

Follow Conventional Commits specification: feat, fix, docs, style, refactor, test, chore. PRs MUST be ≤300 LOC preferred. PRs MUST link to related issues. UI changes MUST include screenshots. Schema changes MUST be documented. Breaking changes MUST be clearly marked.

## Development Workflow

### Feature Specifications

All features MUST have a specification in specs/###-feature-name/ following the spec-template.md structure. Specs MUST be written from user perspective (WHAT and WHY, not HOW). User stories MUST be prioritized (P1, P2, P3) and independently testable. Acceptance criteria MUST be measurable and technology-agnostic.

### Implementation Planning

All features MUST have an implementation plan following plan-template.md. Plan MUST include: technical context, constitution compliance check, project structure, and complexity tracking if violations are justified. Plans MUST identify library dependencies from shadcn/ui or approved registries before custom builds.

### Task Breakdown

Tasks MUST be organized by user story to enable independent implementation. Each task MUST include exact file paths. Tasks MUST be marked with [P] if parallelizable. Dependencies MUST be explicit. Foundation tasks MUST complete before user story work begins.

### UI Component Strategy

ALWAYS check shadcn/ui first via shadcn MCP tools. If not found, check approved registries (tweakcn, originui, aceternity, kokonutui, kibo-ui, skiper-ui, magicui, cult-ui) in order. Only build custom components if not available in any registry. All components stored in frontend/src/components/ui/ must follow mobile-first and RTL requirements.

## Governance

### Amendment Process

Constitution changes require:
1. Proposal documenting rationale and impact
2. Technical lead approval
3. Update to all dependent templates (plan, spec, tasks)
4. Sync Impact Report prepended to constitution
5. Semantic version bump (MAJOR for breaking changes, MINOR for new principles, PATCH for clarifications)

### Compliance Verification

All PRs MUST verify compliance with applicable principles. Complexity violations MUST be justified in plan.md Complexity Tracking section. Constitution supersedes all other practices except CLAUDE.md and AGENTS.md which provide operational guidance aligned with these principles.

### Review Gates

**Phase 0 (Research)**: Constitution Check must pass before research begins
**Phase 1 (Design)**: Re-check constitution compliance after design artifacts created
**Phase 2 (Implementation)**: Code reviews verify adherence to principles
**Production Release**: Security audit, accessibility audit, performance testing

**Version**: 1.0.0 | **Ratified**: 2025-10-09 | **Last Amended**: 2025-10-09
