# Feature Specification: Dossiers Hub

**Feature Branch**: `009-dossiers-hub`
**Created**: 2025-09-30
**Status**: Draft
**Input**: User description: "# 009 — Dossiers Hub — Spec

Purpose: elevate Dossier to a first‑class feature with CRUD, timeline, and a hub view aggregating engagements, positions, MoUs, signals, commitments, and files.

## Goals
- CRUD and search for dossiers (country/org/forum/theme).
- Timeline of interactions and related artifacts with filters.
- Executive summary, owners, sensitivity, review cadence; bilingual.
- One‑click actions: generate brief, add engagement, log intelligence, create task.

## UX
- Dossier list with facets (type, status, sensitivity, owner, tags).
- Dossier detail: header (EN/AR), summary, stats, tabs: Timeline, Positions, MoUs, Commitments, Files, Intelligence.
- Right rail: key contacts, open items, relationship health.

## UI (frontend)
- Route: `/_protected/dossiers` and `/_protected/dossiers/:id`
- Components: `DossierCard`, `DossierHeader`, `DossierTimeline`, `DossierStats`, `DossierActions`.

## API
- `GET /api/dossiers` (filters, pagination)
- `POST /api/dossiers` (create)
- `GET /api/dossiers/:id` (with `include=timeline,stats,relations`)
- `PUT /api/dossiers/:id` (update)
- `DELETE /api/dossiers/:id` (archive)
- `GET /api/dossiers/:id/summary` (exec summary)
- `POST /api/dossiers/:id/briefs` (generate brief)

## Services
- `DossierService`: aggregates: events, positions, mous, commitments, documents, signals.
- Uses existing `RelationshipHealthService` for health score.
- Integrates `BriefService` for summary/briefs.

## AI
- Summary generator (both languages) based on sections + recent activity.
- Next‑best‑action suggestions (e.g., follow‑up commitment, renew MoU, schedule engagement).
- Auto‑tagging and sensitivity hints.

## Acceptance
- Dossier hub loads < 1.5s with timeline of last 90 days.
- One‑click brief creates bilingual brief attached to dossier.
- Health score and open commitments visible; filters persist."

## Execution Flow (main)
```
1. Parse user description from Input
   → Description provided with clear feature goals
2. Extract key concepts from description
   → Actors: system users, dossier owners, contacts
   → Actions: create, read, update, archive, search, filter, generate briefs
   → Data: dossiers, engagements, positions, MoUs, signals, commitments, files
   → Constraints: bilingual support, performance targets, security sensitivity levels
3. For each unclear aspect:
   → Marked with [NEEDS CLARIFICATION] tags below
4. Fill User Scenarios & Testing section
   → User flows derived from UX description
5. Generate Functional Requirements
   → Each requirement is testable and measurable
6. Identify Key Entities
   → Dossier, Timeline Event, Related Artifacts
7. Run Review Checklist
   → Ambiguities marked for clarification
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

---

## Clarifications

### Session 2025-09-30
- Q: Which permission model should control dossier editing access? → A: Hybrid (Owners can edit their dossiers + admins/managers can edit any dossier)
- Q: When the AI service is unavailable during brief generation, what should the system do? → A: Manual template (Provide a structured template for manual brief creation)
- Q: What is the pagination strategy for timeline events when thousands exist? → A: Load 50, scroll for more (Initial load 50 events, infinite scroll loads 50 more per scroll)
- Q: How should the system resolve conflicts when multiple users edit the same dossier simultaneously? → A: Optimistic locking with warning (Detect conflict on save, show warning with option to review changes or force overwrite)
- Q: What is the maximum acceptable time for brief generation before timeout? → A: 60 seconds (Brief generation must complete or timeout within 60 seconds)

---

## User Scenarios & Testing

### Primary User Story
As a diplomatic relations officer, I need a comprehensive view of all dossiers (countries, organizations, forums, themes) so that I can quickly access historical interactions, track commitments, review relationship health, and generate briefing materials for upcoming engagements—all in both English and Arabic.

### Acceptance Scenarios

1. **Given** I am viewing the dossiers hub page, **When** I apply filters for dossier type "Country" and sensitivity level "High", **Then** the system displays only dossiers matching those criteria with performance under 1.5 seconds

2. **Given** I have selected a specific country dossier, **When** I view the dossier detail page, **Then** I see a bilingual header, executive summary, relationship health score, open commitments count, and tabs for Timeline, Positions, MoUs, Commitments, Files, and Intelligence

3. **Given** I am viewing a dossier's timeline, **When** I filter events from the last 90 days, **Then** the system shows chronologically ordered interactions including engagements, position changes, MoU signings, and intelligence signals

4. **Given** I need to prepare for a diplomatic meeting, **When** I click "Generate Brief" on the dossier, **Then** the system creates a bilingual executive brief summarizing recent activity, open commitments, and key positions

5. **Given** I am reviewing a dossier, **When** I click "Add Engagement" in the actions menu, **Then** the system opens a form to log a new engagement linked to this dossier

6. **Given** I have updated dossier information, **When** I navigate away and return, **Then** my filter selections and view preferences persist in the session

7. **Given** I am viewing the right rail of a dossier, **When** the system displays key contacts, **Then** I see contact names, roles, and last interaction dates

8. **Given** the dossier has open commitments, **When** I view the dossier detail, **Then** the system highlights overdue commitments and upcoming deadlines

### Edge Cases
- **Empty Timeline Handling**: When a dossier has no activity in the last 90 days, the system displays an empty timeline with message "No recent activity in the selected period" and provides a "Show Older Events" button that extends the date range to last 180 days, then 1 year, then all time
- **Archive with Active Commitments**: When attempting to archive a dossier with active commitments, the system displays a warning dialog listing all active commitments (count and titles) with two options: "Cancel" to return to dossier, or "Archive Anyway" to proceed with archival. Archived dossiers retain their active commitments which can be viewed but not edited unless dossier is restored.
- **Incomplete Health Score**: When insufficient data exists to calculate relationship health (fewer than 3 engagements OR no commitments recorded), the system displays "—" (em dash) in place of the score with a tooltip in both languages: EN: "Insufficient data to calculate health score. Requires at least 3 engagements and 1 commitment." / AR: "بيانات غير كافية لحساب درجة الصحة. يتطلب 3 تفاعلات على الأقل والتزام واحد."
- **Sensitivity Level Changes**: When a dossier's sensitivity level is increased (e.g., Low → High), users currently viewing the dossier who lack clearance receive a Supabase Realtime notification triggering a soft redirect to the hub page with a bilingual toast message: EN: "Access revoked: Dossier sensitivity level changed" / AR: "تم إلغاء الوصول: تغير مستوى حساسية الملف". Users with sufficient clearance see an in-place update with no interruption. Implementation uses Supabase Realtime subscription to `dossiers` table changes filtered by user clearance.

## Requirements

### Functional Requirements

**Core CRUD Operations**
- **FR-001**: System MUST allow authorized users to create new dossiers with type selection (Country, Organization, Forum, Theme)
- **FR-002**: System MUST allow users to view dossier details including all associated artifacts
- **FR-003**: System MUST allow dossier owners to update their assigned dossiers, and allow users with admin or manager roles to update any dossier. Users without edit permission (neither owner nor admin/manager) receive read-only access.
- **FR-004**: System MUST allow dossier owners and admin/manager roles to archive dossiers rather than permanently delete them
- **FR-005**: System MUST implement optimistic locking to detect concurrent edits and display a warning when a user attempts to save changes to a dossier that has been modified by another user since it was opened, providing options to review the conflicting changes or force overwrite

**Search and Filtering**
- **FR-006**: System MUST provide search functionality across dossiers by name, tags, and content
- **FR-007**: System MUST allow filtering dossiers by type, status, sensitivity level, assigned owner, and tags
- **FR-008**: System MUST persist user filter selections within the session
- **FR-009**: System MUST display search results within the 1.5-second performance target

**Timeline and Aggregation**
- **FR-010**: System MUST aggregate and display timeline of all interactions including engagements, positions, MoUs, commitments, and intelligence signals
- **FR-011**: System MUST allow filtering timeline events by date range with default view of last 90 days
- **FR-012**: System MUST display timeline events in reverse chronological order
- **FR-013**: System MUST link timeline events to their source records for detailed viewing
- **FR-013a**: System MUST initially load 50 timeline events and implement infinite scroll to load 50 additional events per scroll action for timelines with more than 50 events

**Bilingual Support**
- **FR-014**: System MUST display all dossier content in both English and Arabic
- **FR-015**: System MUST allow users to toggle language preference for viewing dossier headers and summaries
- **FR-016**: System MUST generate executive summaries in both English and Arabic simultaneously

**Executive Summary and Briefing**
- **FR-017**: System MUST display an executive summary on each dossier detail page
- **FR-018**: System MUST provide one-click brief generation functionality
- **FR-019**: System MUST generate briefs containing recent activity, open commitments, key positions, and relationship context
- **FR-020**: System MUST attach generated briefs to the dossier for future reference
- **FR-021**: System MUST generate briefs within 60 seconds or timeout and provide the manual template fallback option

**Relationship Health and Metrics**
- **FR-022**: System MUST calculate and display relationship health score for each dossier
- **FR-023**: System MUST display count of open commitments on dossier overview
- **FR-024**: System MUST highlight overdue commitments with visual indicators
- **FR-025**: System MUST show key contacts in the right rail with last interaction date

**One-Click Actions**
- **FR-026**: System MUST provide "Generate Brief" action accessible from dossier detail page
- **FR-027**: System MUST provide "Add Engagement" action that opens pre-populated engagement form
- **FR-028**: System MUST provide "Log Intelligence" action for adding intelligence signals to the dossier
- **FR-029**: System MUST provide "Create Task" action for creating tasks related to the dossier

**Performance and User Experience**
- **FR-030**: System MUST load dossier hub page with initial results in under 1.5 seconds
- **FR-031**: System MUST load dossier detail page with initial 50 timeline events from the last 90 days in under 1.5 seconds
- **FR-032**: System MUST paginate dossier list results with 50 items per page, using infinite scroll (useInfiniteQuery) to automatically load additional pages when user scrolls to bottom of list, with loading indicator during fetch

**AI-Powered Features**
- **FR-033**: System MUST generate bilingual executive briefs automatically based on dossier sections and recent activity within specified date range when AI service (AnythingLLM) is available, with 60-second timeout
- **FR-034**: System MUST provide a structured manual template for brief creation when AI service is unavailable or times out, allowing users to complete briefs manually with pre-populated dossier data (name, type, recent events, open commitments)

**AI Features - Phase 2** _(Out of MVP Scope)_
- **FR-035** _(Future)_: System will provide next-best-action suggestions (e.g., "Follow up on overdue commitment X", "Schedule renewal meeting for MoU Y expiring in 30 days")
- **FR-036** _(Future)_: System will provide auto-tagging suggestions based on dossier content analysis
- **FR-037** _(Future)_: System will provide sensitivity level hints based on content analysis (e.g., mentions of officials, financial data, restricted topics)

> **Note**: MVP focuses on AI-powered brief generation with manual fallback. Advanced AI features (next-best-action, auto-tagging, sensitivity hints) are planned for Phase 2 after validating AnythingLLM performance and accuracy.

**Data Organization**
- **FR-038**: System MUST organize dossier detail page with tabs: Timeline, Positions, MoUs, Commitments, Files, Intelligence
- **FR-039**: System MUST display dossier statistics including total engagements, active commitments, and recent activity count
- **FR-040**: System MUST maintain associations between dossiers and all related artifacts

**Accessibility and Quality**
- **FR-048**: System MUST comply with WCAG 2.1 Level AA standards including full keyboard navigation support, screen reader compatibility with both English and Arabic output, proper ARIA labels and roles, focus indicators on all interactive elements, and sufficient color contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
- **FR-049**: System MUST achieve minimum 80% test coverage across unit tests, integration tests, and end-to-end tests, with coverage reports generated on every build
- **FR-050**: System MUST implement React error boundaries for all major component trees (hub page, detail page, timeline, brief generator) with bilingual fallback UI displaying user-friendly error messages and recovery options

**Security and Sensitivity**
- **FR-041**: System MUST enforce sensitivity-based access controls to restrict viewing of sensitive dossiers
- **FR-042**: System MUST log all access to dossiers for audit purposes
- **FR-043**: System MUST allow dossier owners to modify sensitivity levels of their assigned dossiers, and allow admin/manager roles to modify sensitivity levels of any dossier
- **FR-044**: System MUST prevent unauthorized export of sensitive dossier information

**Review Cadence** _(Deferred to Phase 2)_
- **FR-045** _(Future)_: System will allow setting a review cadence for each dossier (e.g., monthly, quarterly, annually)
- **FR-046** _(Future)_: System will notify assigned owners when dossier review is due via email and in-app notifications
- **FR-047**: System MUST track last review date for each dossier _(MVP: manual update only; automated tracking in Phase 2)_

> **Note**: Review cadence reminder automation (FR-045, FR-046) is planned for Phase 2. MVP includes manual review date tracking (FR-047) to support future automation.

### Key Entities

- **Dossier**: Represents a comprehensive record for a country, organization, forum, or theme. Key attributes include unique identifier, name (bilingual), type, status, sensitivity level, assigned owners, executive summary (bilingual), review cadence, last review date, creation date, and tags. A dossier aggregates all related interactions and artifacts.

- **Timeline Event**: Represents a chronological entry in a dossier's history. Key attributes include event date/time, event type (engagement, position change, MoU signing, commitment recorded, intelligence signal, document added), event description, link to source record, and associated users. Timeline events are always linked to a parent dossier.

- **Related Artifacts**: Collection of associated records linked to a dossier including engagements, positions, MoUs, commitments, documents/files, and intelligence signals. Each artifact type maintains its own schema but shares a relationship with the parent dossier.

- **Relationship Health Score**: Calculated metric (0-100 scale) representing diplomatic relationship health. Formula: `health_score = (engagement_frequency * 0.30) + (commitment_fulfillment_rate * 0.40) + (recency_score * 0.30)` where engagement_frequency = count of positive engagements in last 365 days (normalized 0-100), commitment_fulfillment_rate = (fulfilled_commitments / total_commitments) * 100, recency_score = 100 if activity within 30 days, 70 if 30-90 days, 40 if 90-180 days, 10 if >180 days. Score displayed as both numeric (0-100) and color-coded visual indicator: 80-100 (green/excellent), 60-79 (yellow/good), 40-59 (orange/fair), 0-39 (red/poor).

- **Brief**: Generated document containing executive summary of dossier status. Key attributes include generation date, language versions (English and Arabic), included date range, summary sections, and link to parent dossier. Briefs are immutable snapshots for historical reference.

- **Dossier Owner**: User assigned responsibility for maintaining and reviewing the dossier. Key attributes include user identifier, assignment date, and role/responsibility type.

- **Key Contact**: Individual associated with the dossier entity. Key attributes include name, role, organization affiliation, last interaction date, and contact information. Multiple contacts can be associated with a single dossier.

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain—8 areas requiring clarification identified
- [x] Requirements are testable and unambiguous (excluding marked items)
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [ ] Dependencies and assumptions identified—requires clarification on integration with RelationshipHealthService and BriefService

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed—pending clarifications

---

## Dependencies and Assumptions

### Dependencies
- Existing RelationshipHealthService for calculating health scores
- Existing BriefService for summary/brief generation
- AI service for summary generation, next-best-action suggestions, auto-tagging, and sensitivity hints
- Authentication and authorization system for access control
- Existing data models for engagements, positions, MoUs, commitments, documents, and intelligence signals

### Assumptions
- Users have appropriate permissions configured before accessing dossiers
- Bilingual content storage and retrieval infrastructure exists
- Performance infrastructure can support sub-1.5-second load times
- AI services are generally available with acceptable uptime
- Artifact data models support linking to dossiers
- Notification system exists for review cadence alerts

---

## Areas Requiring Clarification

_All clarifications resolved as of 2025-09-30. See Edge Cases section for documented decisions._

---