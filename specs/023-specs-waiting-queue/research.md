# Research: Waiting Queue Actions

**Feature**: Waiting Queue Actions
**Branch**: 023-specs-waiting-queue
**Date**: 2025-01-14
**Status**: Complete

## Overview

This document captures research decisions and technology choices for implementing action management (reminders, escalations, filtering) in the waiting queue system. Since the feature extends existing infrastructure, most technical context is pre-determined. Research focused on best practices for rate limiting, bulk operations, and notification patterns.

## Research Areas

### 1. Rate Limiting Strategy

**Decision**: Redis-based distributed rate limiting with token bucket algorithm

**Rationale**:
- **Why chosen**:
  - Redis provides atomic operations (INCR, EXPIRE) for distributed rate limiting across multiple API instances
  - Token bucket algorithm allows burst traffic while enforcing long-term rate limits
  - Existing Redis 7.x infrastructure already deployed for caching
  - Supabase Edge Functions can connect to external Redis via environment variables

- **Alternatives considered**:
  - **In-memory rate limiting (Node.js)**: Rejected - does not scale across multiple backend instances, loses state on restart
  - **Database-based rate limiting (PostgreSQL)**: Rejected - adds unnecessary database load for non-persistent counters
  - **API Gateway rate limiting (Supabase/Kong)**: Rejected - too coarse-grained, cannot enforce per-user limits with 100 req/5min granularity

- **Implementation approach**:
  - Key pattern: `rate-limit:user:{user_id}:reminder` with 5-minute TTL
  - Increment counter on each reminder request
  - Return 429 Too Many Requests if counter exceeds 100
  - Queue excess reminders in Redis list for background processing after cooldown

- **References**:
  - Redis INCR documentation: https://redis.io/commands/incr/
  - Token bucket algorithm: https://en.wikipedia.org/wiki/Token_bucket

---

### 2. Bulk Operation Processing Pattern

**Decision**: Background job queue with chunked processing (10 items per chunk, max 10 parallel workers)

**Rationale**:
- **Why chosen**:
  - Chunking prevents timeout on large bulk operations (100 items = 10 chunks of 10)
  - Parallel workers (max 10) improve throughput while preventing database connection exhaustion
  - Background queue allows immediate UI response (202 Accepted) with progress tracking
  - Transactional integrity per chunk - if chunk fails, only that chunk needs retry

- **Alternatives considered**:
  - **Synchronous processing**: Rejected - 100 items × 500ms avg = 50s request time exceeds typical 30s API timeout
  - **Fire-and-forget async**: Rejected - no progress feedback, no retry mechanism, no error reporting to user
  - **Single-threaded queue**: Rejected - 100 items processed serially takes too long (100s+), poor UX

- **Implementation approach**:
  - Use BullMQ (or similar Redis-based queue) for job persistence
  - Bulk action creates job with array of assignment IDs
  - Worker processes chunks of 10 with Promise.allSettled for parallel execution
  - Update job progress (e.g., "30/100 completed") for real-time UI feedback
  - Store results in Redis with 1-hour TTL for client polling

- **References**:
  - BullMQ documentation: https://docs.bullmq.io/
  - Chunking pattern: https://www.patterns.dev/posts/chunking-pattern

---

### 3. Notification Service Integration

**Decision**: Leverage existing notification service with template-based bilingual rendering

**Rationale**:
- **Why chosen**:
  - Notification service already exists (assumption D-001) with email + in-app channels
  - Template-based approach separates content from delivery logic
  - Bilingual templates (English/Arabic) with i18next integration for RTL support
  - Existing service handles retry logic, delivery tracking, and failure handling

- **Alternatives considered**:
  - **Direct email sending (nodemailer)**: Rejected - duplicates existing notification infrastructure, no centralized delivery tracking
  - **Third-party service (SendGrid, AWS SES)**: Rejected - adds new dependency when existing service meets requirements
  - **In-app only (no email)**: Rejected - spec requires email for reminder delivery (FR-019)

- **Implementation approach**:
  - Define notification types: `WAITING_QUEUE_REMINDER`, `WAITING_QUEUE_ESCALATION`
  - Create bilingual templates in `backend/src/templates/notifications/`
  - Templates include variables: `{assignee_name}`, `{work_item_id}`, `{days_waiting}`, `{assignment_link}`
  - Service determines language based on user locale preference (assumption A-007)
  - RTL rendering handled by email template CSS (`dir="rtl"` for Arabic)

- **Best practices**:
  - Keep message size <5KB (constraint C-011) to prevent delivery failures
  - Include unsubscribe link for reminder notifications (email best practice)
  - Use plain text fallback for email clients that don't support HTML

- **References**:
  - i18next email templates: https://www.i18next.com/misc/creating-own-plugins#backend
  - Email RTL best practices: https://www.litmus.com/blog/rtl-email-design-best-practices/

---

### 4. Escalation Path Configuration

**Decision**: Organizational hierarchy table with role-based escalation paths

**Rationale**:
- **Why chosen**:
  - Flexible hierarchy definition supports different escalation paths per department/work_item_type
  - Role-based escalation (e.g., "Team Lead → Department Manager → Division Director") is standard in government organizations
  - Database-driven configuration allows runtime updates without code changes

- **Alternatives considered**:
  - **Hardcoded escalation paths**: Rejected - inflexible, requires code deployment to change hierarchy
  - **File-based configuration (YAML/JSON)**: Rejected - requires file system access, harder to update via admin UI
  - **User-selectable recipient**: Rejected - too manual, does not enforce organizational hierarchy

- **Implementation approach**:
  - Create `organizational_hierarchy` table with columns: `id`, `user_id`, `reports_to_user_id`, `role`, `department`, `escalation_level`
  - Escalation service queries hierarchy starting from assignee, walks up chain until appropriate level found
  - If no path exists, return error "Cannot escalate: No escalation path configured" (edge case handled)

- **Sample hierarchy schema**:
  ```sql
  CREATE TABLE organizational_hierarchy (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    reports_to_user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL,
    department TEXT,
    escalation_level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

---

### 5. Filter Performance Optimization

**Decision**: Composite indexes on frequently filtered columns + query result caching

**Rationale**:
- **Why chosen**:
  - Composite indexes on (status, workflow_stage, assigned_at) support multi-criteria filtering (FR-024 to FR-027)
  - Partial indexes for common filter combinations (e.g., `WHERE status = 'pending' AND assigned_at < NOW() - INTERVAL '7 days'`)
  - Redis caching for expensive filter queries with 5-minute TTL

- **Alternatives considered**:
  - **Full table scan**: Rejected - unacceptable performance with 10,000+ assignments
  - **Materialized views**: Rejected - adds maintenance overhead, refresh lag, not suitable for real-time data
  - **Elasticsearch**: Rejected - overkill for simple filtering, adds complex dependency

- **Implementation approach**:
  - Create composite index: `CREATE INDEX idx_assignments_queue_filters ON assignments (status, workflow_stage, assigned_at DESC) WHERE status IN ('pending', 'assigned');`
  - Create aging bucket index: `CREATE INDEX idx_assignments_aging ON assignments ((EXTRACT(EPOCH FROM (NOW() - assigned_at)) / 86400)) WHERE status = 'pending';`
  - Cache filter results in Redis with key pattern: `queue-filter:{user_id}:{filter_hash}` (5-min TTL)
  - Invalidate cache on assignment status change via database trigger

- **Performance target validation**:
  - Indexed queries should complete in <100ms for 10,000 rows (well under 1s requirement)
  - Cached queries return in <10ms

- **References**:
  - PostgreSQL composite indexes: https://www.postgresql.org/docs/current/indexes-multicolumn.html
  - Partial indexes: https://www.postgresql.org/docs/current/indexes-partial.html

---

### 6. Real-Time Updates for Queue Changes

**Decision**: Supabase Realtime subscriptions with optimistic UI updates

**Rationale**:
- **Why chosen**:
  - Supabase Realtime (assumption D-005) provides built-in PostgreSQL change data capture (CDC)
  - Optimistic updates improve perceived performance (UI updates immediately, rolls back on error)
  - Real-time sync ensures all users see assignment status changes without manual refresh

- **Alternatives considered**:
  - **Polling (setInterval)**: Rejected - inefficient, adds database load, introduces lag (5-30s typical polling interval)
  - **WebSocket custom implementation**: Rejected - Supabase Realtime already provides this functionality
  - **Server-Sent Events (SSE)**: Rejected - not supported by Supabase, requires custom backend

- **Implementation approach**:
  - Subscribe to `assignments` table changes: `supabase.channel('waiting-queue').on('postgres_changes', ...)`
  - Listen for UPDATE events where `status` or `workflow_stage` changes
  - Update TanStack Query cache when change detected
  - Show toast notification: "Assignment #{id} was completed and removed from queue"

- **Edge case handling**:
  - User is viewing assignment details modal when assignment completes → close modal, show toast
  - User has assignment selected for bulk action when it completes → deselect, update selection count

- **References**:
  - Supabase Realtime: https://supabase.com/docs/guides/realtime
  - TanStack Query optimistic updates: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates

---

### 7. Mobile-First Responsive Patterns

**Decision**: shadcn/ui Sheet component for mobile filters, responsive table with card view on mobile

**Rationale**:
- **Why chosen**:
  - shadcn/ui Sheet (bottom sheet) is mobile-optimized drawer component for filters (User Story 5, Scenario 4)
  - Table → Card transformation on mobile (<640px) improves readability on small screens
  - Touch-friendly controls (44x44px) built into shadcn/ui components by default

- **Alternatives considered**:
  - **Modal for filters**: Rejected - less intuitive on mobile, blocks entire screen
  - **Accordion for table rows**: Rejected - poor UX for bulk selection, hard to scan
  - **Horizontal scroll for table**: Rejected - difficult to use on mobile, hides columns

- **Implementation approach**:
  - Use shadcn/ui `Sheet` component for FilterPanel on mobile
  - Desktop: FilterPanel as sidebar or dropdown
  - Mobile table view: Switch to card layout with Tailwind `sm:` breakpoint
  - Example card structure:
    ```tsx
    <div className="flex flex-col gap-2 p-4 border rounded-lg sm:hidden">
      <div className="flex items-center justify-between">
        <h3>{assignment.work_item_id}</h3>
        <Badge>{aging} days</Badge>
      </div>
      <div>Assignee: {assignee_name}</div>
      <div className="flex gap-2 mt-2">
        <Button size="sm">View</Button>
        <Button size="sm">Follow Up</Button>
      </div>
    </div>
    ```

- **References**:
  - shadcn/ui Sheet: https://ui.shadcn.com/docs/components/sheet
  - Responsive table patterns: https://css-tricks.com/responsive-data-tables/

---

## Summary of Technology Choices

| Decision Area | Choice | Justification |
|---------------|--------|---------------|
| Rate Limiting | Redis token bucket | Atomic operations, distributed support, existing infrastructure |
| Bulk Processing | BullMQ chunked queue | Background processing, progress tracking, retry mechanism |
| Notifications | Existing service + templates | Leverage existing infra, bilingual support, delivery tracking |
| Escalation Paths | Organizational hierarchy table | Flexible, database-driven, supports role-based escalation |
| Filter Performance | Composite indexes + caching | Sub-second queries, Redis cache for expensive filters |
| Real-Time Updates | Supabase Realtime | Built-in CDC, optimistic updates, no custom WebSocket code |
| Mobile Responsiveness | shadcn/ui Sheet + card view | Touch-friendly, mobile-optimized, Tailwind responsive patterns |

---

## Open Questions & Assumptions

**All questions resolved. Key assumptions documented:**

1. **A-001**: Assignees have valid email addresses in users table for reminder delivery
2. **A-005**: RBAC system manages escalation action permissions
3. **A-007**: Users table contains locale preference field for notification language selection
4. **D-001**: Notification Service API exists for email + in-app delivery
5. **D-006**: Redis infrastructure available for rate limiting and queue management

**No blocking unknowns remain. Proceed to Phase 1 (Design).**

---

## References

- Redis Rate Limiting: https://redis.io/docs/manual/patterns/rate-limiter/
- BullMQ Job Queues: https://docs.bullmq.io/
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- shadcn/ui Components: https://ui.shadcn.com/docs/components
- PostgreSQL Indexing Strategies: https://www.postgresql.org/docs/current/indexes.html
- Email RTL Best Practices: https://www.litmus.com/blog/rtl-email-design-best-practices/
