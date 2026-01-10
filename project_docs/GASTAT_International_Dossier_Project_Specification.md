# Project Specification

# GASTAT International Dossier Management System (Intl‑Dossier v2.0)

## Version 1.0

**Date:** 2026-01-10  
**Owner:** GASTAT International Partnerships / Digital Transformation  
**Status:** Draft

---

## 0) Purpose

The International Dossier Management System (Intl‑Dossier) is an **AI‑assisted relationship management and engagement operations platform** for GASTAT’s international work. It centralizes dossiers, commitments, events, documents, and activity history so teams can:

- Prepare faster for international engagements (briefs, context, contacts, positions)
- Track commitments (MoUs, deliverables, obligations) with accountability
- Coordinate work across departments with clear ownership and audit trails
- Use AI to summarize, recommend actions, and surface insights (without losing governance)

This document describes the **project intent**, **scope**, and **implementation-level specification** for the v2.0 codebase.

---

## 1) References

- Product direction: `project_docs/GASTAT_International_Dossier_PRD.md`
- Requirement catalog (formal SHALLs): `project_docs/GASTAT_ID_System_Requirements_Specification.md`
- Architecture notes: `docs/architecture.md`
- Security posture: `SECURITY.md` and `docs/security/security-features.md`

---

## 2) Goals and Success Criteria

### 2.1 Primary goals

1. **Single source of truth** for international entities, engagements, and commitments
2. **Operational efficiency** for brief creation, coordination, and follow-ups
3. **Strategic alignment** of engagements with GASTAT priorities and positions
4. **Compliance and governance** (access control, auditability, retention)
5. **Bilingual readiness** (Arabic/English) with full RTL/LTR support

### 2.2 Success criteria (examples)

- Reduced time to prepare an engagement brief (target defined by leadership)
- 100% of active MoUs tracked with owners, milestones, and status
- Search and retrieval fast enough for “meeting-room usage” (sub-second typical queries)
- High user satisfaction across executive and operational personas

---

## 3) Users, Roles, and Permissions

### 3.1 Primary personas

- **Executive Leadership**: strategic overview, high‑level dashboards, decision support
- **International Relations Managers**: dossiers, MoUs, events, tasks, coordination
- **Subject Matter Experts**: contributions to briefs/positions, research, follow-ups

### 3.2 Access model (high level)

- **Authentication**: Supabase Auth (JWT-based)
- **Authorization**:
  - Row Level Security (RLS) in PostgreSQL for all core tables
  - Role/permission mapping for admin, manager, contributor, viewer
  - Audit logging for sensitive operations (create/update/delete; exports; AI interactions where required)

---

## 4) Scope

### 4.1 In scope (v2.0)

- **Dossiers** for key entity types (countries, organizations, forums/events, thematic areas)
- **Relationships & contacts** (who is connected to whom, and how)
- **Commitment tracking** (MoUs, deliverables, renewal/expiry)
- **Engagement operations** (events/meetings/missions lifecycle: pre/during/post)
- **Positions & policy artifacts** (position repository, pack generation inputs)
- **Intake and assignment workflows** (requests → triage → assigned work → SLA/aging)
- **Search and retrieval** across structured + unstructured data
- **Documents** (storage, metadata, access control)
- **AI assistance** (brief generation, summarization, translation, recommendations)
- **Mobile readiness** including offline-first flows where applicable (separate app)

### 4.2 Out of scope (explicit)

- Replacing official HR/finance systems (only integrations/links when needed)
- Public-facing publishing (unless explicitly added later)
- Uncontrolled “autonomous actions” by AI (AI may recommend, not execute without user approval)

---

## 5) Core Domain Model (Concepts)

### 5.1 Dossier entity types

- **Country**: profile, key contacts, bilateral history, cooperation areas
- **Organization**: membership/obligations, committees, initiatives, key contacts
- **Forum / Event**: participation history, upcoming events, outcomes, follow-ups
- **Thematic Area**: topics (e.g., SDGs, data governance), best practices, initiatives

### 5.2 Common dossier components

- Executive summary (AI-assisted, human review)
- Timeline of interactions and key milestones
- Active projects/initiatives and ownership
- Contacts directory (roles, expertise, preferred channels)
- Documents and artifacts (MoUs, briefs, minutes, reports)
- Communication and activity logs
- Insights/recommendations (AI-assisted)

### 5.3 Relationship model (high level)

- Entities can relate to other entities (e.g., country ↔ organization, organization ↔ event)
- Contacts link to entities and can participate in events, communications, and tasks
- Commitments (MoUs/deliverables) link to entities and have owners, milestones, status, and evidence

---

## 6) Functional Specification (Modules)

### 6.1 Dossier management

- Create/update/view dossiers per entity type with consistent structure
- Maintain timelines and activity logs
- Attach and categorize documents
- Support bilingual fields where required (Arabic/English)

### 6.2 Relationship & contact directory

- Contact CRUD with organization/country affiliations, roles, expertise, and notes
- Relationship mapping between entities and contacts (graph-like navigation)
- Communication log capture (meeting, email summary, call note)

### 6.3 Commitments (MoU) management

- MoU lifecycle: draft → active → expiring → renewed/closed
- Deliverables: milestones with due dates, owners, status, evidence attachments
- Alerts/reminders and escalation hooks (SLA/aging)
- Reporting views: completion rate, overdue items, at-risk commitments

### 6.4 Engagement operations (events/meetings/missions)

- Pre-engagement: agenda, attendee list, brief generation, talking points inputs
- During: notes capture, action items, stakeholder mapping
- Post: outcomes, follow-up tasks, after-action report templates

### 6.5 Positions & policy artifacts

- Repository of positions (versioning, approvals where required)
- Assemble “policy packs” for a specific engagement (inputs: entity + theme + history)

### 6.6 Intake & assignment workflow

- Intake forms (structured request capture)
- Triage queue, assignment, SLA/aging, reminders
- Clear ownership and accountability; audit trail

### 6.7 Search, retrieval, and intelligence

- Full-text and filtered search across entities, tasks, documents, and notes
- Optional semantic retrieval (pgvector embeddings) for AI-assisted discovery
- Saved searches and dashboards for role-based workflows

### 6.8 AI assistance (guardrailed)

AI features are assistive and must be **reviewable, attributable, and permission-aware**:

- Brief generation (context-aware, bilingual)
- Summarization of documents and timelines
- Translation (Arabic ↔ English)
- Next-best-action suggestions and risk flags (explainable signals where possible)
- Natural-language query layer (answers grounded in authorized data)

---

## 7) Non-Functional Requirements (NFRs)

### 7.1 Security & compliance

- Least privilege access (RLS, RBAC)
- Audit logs for sensitive operations
- Encryption in transit and at rest
- Data classification support (public/internal/confidential/secret)

### 7.2 Performance

- Fast initial load and navigation for common workflows
- Responsive search for “live meeting” use (goal: sub-second typical)
- Scalable real-time subscriptions without UI degradation

### 7.3 Reliability and operability

- Clear health checks (backend + API)
- Structured logging and error reporting
- Predictable migrations and rollback procedures

### 7.4 Accessibility and i18n

- WCAG 2.1 AA target
- Full RTL support for Arabic UI
- Consistent i18n keying and localization patterns

---

## 8) System Architecture (Implementation View)

### 8.1 Web application

- **Frontend**: React 19 + TypeScript (strict), Vite, TanStack Router/Query, Tailwind, shadcn/ui, i18next
- **Backend**: Node.js (>=18) + Express (TypeScript)
- **Realtime**: Supabase Realtime subscriptions for live updates (where applicable)

### 8.2 Data platform

- **Database**: Supabase PostgreSQL (15+) with RLS
- **Search**: Postgres full-text + pg_trgm where needed; optional embeddings via pgvector
- **Storage**: Supabase Storage for documents and generated artifacts
- **Caching/queues**: Redis (where applicable) for caching and background coordination

### 8.3 AI integration

- AI services should be pluggable (cloud or on‑prem LLMs)
- Data access for AI must respect user permissions and classification
- Prefer “retrieval + grounding” over raw generation for factual answers

### 8.4 Mobile application (offline-first)

- React Native + Expo app for field/offline usage
- Local database (offline cache) and conflict-aware sync with server sources
- Biometric and device-level protections where supported

---

## 9) Data Model Overview (Logical)

This is a logical model; exact schema is defined by Supabase migrations.

### 9.1 Core entities

- `countries`, `organizations`, `events`, `themes`
- `contacts` and join tables linking contacts ↔ entities
- `documents` (metadata) + storage objects (binary)
- `commitments` / `mous` with `deliverables` / `milestones`
- `tasks` / `assignments` with SLA, status, ownership, and activity history
- `activity_logs` / `timeline_items` for auditable history

### 9.2 Cross-cutting concerns

- `created_by`, `updated_by`, timestamps, soft-delete (where needed)
- tenant/department scoping (if enabled)
- translation-ready fields (e.g., `name_en`, `name_ar`)

---

## 10) Deliverables and Roadmap

This roadmap aligns with the PRD phases and can be refined during execution:

1. **Foundation**: core dossiers, documents, auth, search baseline
2. **Intelligence layer**: AI briefs, semantic retrieval, initial agents/workflows
3. **Engagement management**: events/meetings/missions end-to-end
4. **Advanced**: foresight, predictive analytics, expanded automation (guardrailed)

---

## 11) Open Questions (to confirm with stakeholders)

- What are the required classification labels and who can downgrade/upgrade classification?
- Which artifacts require formal approval workflows (MoUs, positions, briefs)?
- What are the official KPIs and target baselines for “time to prepare a brief” and “commitment completion”?
- Which external integrations are mandatory for Phase 1 (email/calendar/DMS), and which are optional?

---

## Document Control

| Version | Date       | Owner  | Notes                                               |
| ------- | ---------- | ------ | --------------------------------------------------- |
| 1.0     | 2026-01-10 | GASTAT | Initial project specification for Intl‑Dossier v2.0 |
