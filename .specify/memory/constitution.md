# GASTAT International Dossier System Constitution
**Version 2.1.1** | **Effective**: September 2025

## Core Principles

### 1. Bilingual Excellence
- Arabic and English support from day one
- RTL/LTR seamless switching
- Equal priority for both languages
- Cultural conventions respected

### 2. Type Safety
- TypeScript strict mode mandatory
- No `any` types (except documented edge cases)
- Explicit return types required
- Components <200 lines max

### 3. Security-First
- MFA mandatory for all users
- RLS enforced at database level
- Input validation client + server
- Rate limiting on all APIs
- Encryption at rest and in transit

### 4. Data Sovereignty
- Fully self-hostable system
- No external cloud dependencies
- Data stays within Saudi infrastructure
- AnythingLLM containerized locally
- Offline fallback mechanisms

### 5. Resilient Architecture
- Error boundaries on all components
- Graceful network failure handling
- AI service fallback workflows
- Timeout controls on async operations
- Bilingual error messages

### 6. Accessibility
- WCAG 2.1 Level AA compliance
- Full keyboard navigation
- Screen reader compatibility
- Proper ARIA labels and roles
- Tested in both languages

### 7. Container-First
- Docker containerization mandatory
- Docker Compose orchestration
- Health checks on all services
- Resource limits defined
- Multi-stage builds preferred

## Technology Stack

**Frontend**: Vite + React 18+ + TypeScript + TanStack Router + TanStack Query + Tailwind CSS + RTL/LTR support

**Backend**: Supabase (PostgreSQL + RLS + Auth + Realtime + Storage) + RESTful APIs

**AI**: AnythingLLM (self-hosted) + pgvector + local embeddings + fallback responses

**Infrastructure**: Docker + Docker Compose + Traefik + Prometheus/Grafana

## Development Standards

**Code Quality**:
- TypeScript strict checks pass
- Both languages tested
- Security checklist completed
- Accessibility audit passed
- 80%+ test coverage

**Testing**:
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows
- Performance tests for RTL
- Security tests for auth

**Deployment**:
- Feature branches → isolated containers
- Staging mirrors production
- 2-person approval for production
- Reversible migrations only
- Zero-downtime deployments

## Governance

Constitution supersedes all practices. Deviations require:
1. Written justification
2. Impact analysis
3. Migration plan
4. Technical stakeholder approval
5. Version increment

Non-compliance blocks production deployment. All PRs must include compliance checklist.

## Approved Exceptions

### Exception 1: pg_cron for SLA Monitoring (Feature 013-assignment-engine-sla)
- **Principle Affected**: §7 Container-First
- **Violation**: pg_cron extension runs within managed Supabase PostgreSQL, not as separate container
- **Justification**:
  - SLA monitoring requires sub-minute scheduling (30-second intervals) for 5,000+ concurrent assignments
  - External cron container would require database credentials, increasing attack surface
  - pg_cron is PostgreSQL-native extension, managed by Supabase platform
  - Containerized alternative would add latency and complexity without security benefit
- **Approved By**: Technical Stakeholders (2025-10-02)
- **Migration Plan**: If migrating away from Supabase, pg_cron logic must be refactored to containerized cron daemon
- **Review Date**: 2026-01-01

**Version**: 2.1.1 | **Last Amended**: 2025-09-25