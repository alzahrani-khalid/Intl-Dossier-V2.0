<!--
Sync Impact Report
==================
Version change: [UNDEFINED] → 1.0.0 (Initial ratification)
Modified principles: None (initial creation)
Added sections: All sections newly defined
Removed sections: None
Templates requiring updates:
  ✅ .specify/templates/spec-template.md (to be aligned)
  ✅ .specify/templates/plan-template.md (to be aligned)
  ✅ .specify/templates/tasks-template.md (to be aligned)
Follow-up TODOs: None
-->

# GASTAT International Dossier System Constitution

## Core Principles

### I. Bilingual Parity & Internationalization
Every feature, interface element, and system message MUST be available in both Arabic
and English from day one. No feature ships without complete RTL/LTR support and proper
localization. Text direction switching must be seamless, and Arabic content receives
equal priority in design, testing, and optimization. All date/time formats, numerical
representations, and cultural conventions must respect locale-specific standards.

### II. Type Safety & Code Quality
TypeScript with strict mode is mandatory throughout the codebase. The use of 'any'
type is prohibited except in clearly documented edge cases with explicit justification.
All functions must have explicit return types, all props must be properly typed, and
type inference should be leveraged where appropriate. Components must not exceed 200
lines to ensure maintainability and testability.

### III. Security-First Architecture
Multi-factor authentication (MFA) is mandatory for all user accounts. Row-Level
Security (RLS) must be enforced at the database level for all tables. Input validation
must occur at both client and server levels with proper sanitization. API endpoints
must implement rate limiting, and all sensitive data must be encrypted at rest and
in transit. Security headers must be properly configured for all responses.

### IV. Data Sovereignty & Self-Hosting
The system must be fully self-hostable with no hard dependencies on external cloud
services. All core functionality must work within an air-gapped environment. Data
must remain within the organization's infrastructure unless explicitly authorized.
AnythingLLM integration must be containerized and locally deployable. External service
dependencies must have offline fallback mechanisms.

### V. Resilient Architecture & Error Handling
Every component must implement comprehensive error boundaries and fallback UI states.
Network failures must be gracefully handled with retry logic and offline queuing.
AI service unavailability must trigger predefined fallback workflows. All async
operations must have timeout controls and proper loading states. Error messages must
be actionable and available in both languages.

### VI. Accessibility & Compliance
WCAG 2.1 Level AA compliance is mandatory for all user interfaces. Keyboard navigation
must be fully supported throughout the application. Screen reader compatibility must
be tested for both Arabic and English interfaces. Color contrast ratios must meet
accessibility standards. All interactive elements must have appropriate ARIA labels
and roles properly configured.

### VII. Container-First Deployment
All services must be containerized using Docker with explicit resource limits.
Docker Compose must orchestrate the complete stack for development and production.
Container images must be minimal, using multi-stage builds where appropriate.
Health checks and restart policies must be configured for all containers. Volume
mounts must be clearly documented for data persistence.

## Technology Stack Requirements

### Frontend Architecture
- **Framework**: Vite + React 18+ with TypeScript
- **Routing**: TanStack Router with type-safe routing
- **State Management**: TanStack Query for server state, Zustand for client state
- **Styling**: Tailwind CSS with RTL/LTR variants
- **Forms**: React Hook Form with Zod validation
- **I18n**: react-i18next with namespace separation

### Backend Architecture
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Authentication**: Supabase Auth with MFA support
- **Real-time**: Supabase Realtime for live updates
- **Storage**: Supabase Storage with bucket policies
- **API**: RESTful with OpenAPI documentation

### AI Integration
- **LLM Provider**: AnythingLLM (self-hosted)
- **Embedding Model**: Local deployment required
- **Vector Storage**: pgvector extension in Supabase
- **Fallback**: Predefined responses for AI unavailability

### Infrastructure
- **Containerization**: Docker 20.10+ with BuildKit
- **Orchestration**: Docker Compose for single-node deployment
- **Reverse Proxy**: Traefik with automatic SSL
- **Monitoring**: Prometheus + Grafana stack
- **Logging**: ELK stack or Loki for centralized logging

## Development Workflow

### Code Review Requirements
- All PRs must pass TypeScript strict checks
- Both Arabic and English UI must be tested
- Security checklist must be completed
- Accessibility audit must pass
- Docker build must succeed
- Component size limit must be respected

### Testing Standards
- Unit tests required for all business logic (>80% coverage)
- Integration tests for all API endpoints
- E2E tests for critical user flows in both languages
- Performance tests for RTL rendering
- Security tests for authentication flows
- Accessibility tests with automated tools

### Deployment Pipeline
- Feature branches deploy to isolated containers
- Staging environment mirrors production exactly
- Production deployment requires 2-person approval
- Database migrations must be reversible
- Rollback procedure must be documented
- Zero-downtime deployments required

## Governance

The Constitution supersedes all development practices and architectural decisions.
Any deviation from these principles requires explicit documentation and approval
from the project governance board. Amendments to this constitution require:

1. Written proposal with clear justification
2. Impact analysis on existing systems
3. Migration plan for affected components
4. Majority approval from technical stakeholders
5. Version increment following semantic versioning

All pull requests must include a constitution compliance checklist. Code reviews
must verify adherence to these principles. Quarterly audits will assess overall
compliance with special attention to security, accessibility, and bilingual parity.

Non-compliance with core principles blocks deployment to production. Temporary
exceptions require documented mitigation plans with specific remediation timelines.

**Version**: 1.0.0 | **Ratified**: 2025-09-25 | **Last Amended**: 2025-09-25