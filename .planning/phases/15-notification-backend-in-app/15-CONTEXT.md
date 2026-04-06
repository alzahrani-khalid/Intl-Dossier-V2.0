# Phase 15: Notification Backend & In-App - Context

**Gathered:** 2026-04-06 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive timely in-app notifications for assignments, deadlines, and lifecycle events, with full control over their preferences. Notification delivery is decoupled from triggering actions via async queue processing. This phase covers in-app channel only — email and push channels are Phase 16.

</domain>

<decisions>
## Implementation Decisions

### Database Schema
- **D-01:** The existing notification schema is sufficient — no new migration needed. The `notifications` table already has all required columns (`user_id`, `type`, `title`, `message`, `data`, `read`, `priority`, `action_url`, `category`, `source_type`, `source_id`). Category enums (`assignments`, `deadlines`, `workflow`), per-category preferences, paginated queries, mark-as-read functions, and Realtime publication are all in place.

### Frontend Notification UI
- **D-02:** The bell icon, notification panel, badge, category tabs, mark-as-read, and Supabase Realtime subscription already exist in the codebase. This phase focuses on integration testing, verifying the existing UI works end-to-end with real backend-dispatched notifications, and minor polish — not a ground-up build.

### Async Notification Dispatch
- **D-03:** Add BullMQ as a new dependency for async notification dispatch. Reuse the existing ioredis connection (v5.10.1 — fully compatible with BullMQ v5).
- **D-04:** Run the BullMQ worker in-process initially (same Express server). Extract to a separate Docker container later if load demands it.

### Notification Trigger Points
- **D-05:** Wire notification triggers inside backend service methods, co-located with business logic. Dispatch to BullMQ queue after successful DB writes — never inside the DB transaction.
- **D-06:** Three trigger categories to implement: (1) task assignment — fires when `assignee_id` is set/changed in task creation or update, (2) deadline approaching/overdue — fires via a BullMQ repeatable/scheduled job that checks deadlines periodically, (3) engagement lifecycle stage change — fires when stage transitions occur in the lifecycle service.
- **D-07:** The existing `notification.service.ts` and `sendInAppNotification` function should be extended (not replaced) to support queue-based dispatch.

### Claude's Discretion
- Exact BullMQ queue naming conventions and job options (retries, backoff)
- Deadline check interval (e.g., every 15 minutes vs hourly)
- Toast notification styling for new arrivals (Sonner already in use)
- Notification grouping or batching strategy for bulk operations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Notification Schema
- `supabase/migrations/20251011214946_create_notifications.sql` — Core notifications table with all columns
- `supabase/migrations/20260111100001_notification_center.sql` — Category enums, preferences table, paginated queries, mark-as-read functions, Realtime publication

### Existing Notification Backend
- `backend/src/services/notification.service.ts` — Existing notification service with `sendInAppNotification`
- `backend/src/api/after-action.ts` — Only current consumer of notification service (reference for dispatch pattern)

### Existing Frontend Components
- `frontend/src/components/notifications/NotificationPanel.tsx` — Bell icon, popover, category tabs, mark-as-read UI
- `frontend/src/hooks/useNotificationCenter.ts` — Paginated queries, Realtime subscription, toast-on-arrival
- `frontend/src/components/settings/sections/NotificationsSettingsSection.tsx` — User notification preferences UI

### Trigger Source Services
- `backend/src/services/tasks.service.ts` — Task CRUD with `assignee_id` (assignment trigger point)
- `backend/src/components/ui/toast.tsx` — Sonner-based toast system (frontend)

### Infrastructure
- `backend/src/config/redis.ts` — ioredis client configuration (BullMQ will reuse)
- `frontend/src/domains/operations-hub/hooks/useAttentionRealtime.ts` — Supabase Realtime subscription pattern reference

### Preference Schema
- `supabase/migrations/20260115200001_email_digest_content_preferences.sql` — Email digest preferences (reference for preference patterns)
- `supabase/migrations/20250930109_create_user_notification_preferences_table.sql` — User notification preferences table

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NotificationPanel.tsx` + `useNotificationCenter.ts` — Complete in-app notification UI already built
- `notification.service.ts` — Backend notification service with `sendInAppNotification` ready to extend
- `backend/src/config/redis.ts` — Configured ioredis client with retry logic, health checks
- `toast.tsx` — Sonner-based toast system for transient notifications
- `useAttentionRealtime.ts` — Proven Supabase Realtime subscription pattern

### Established Patterns
- Frontend domain repository pattern: hooks + repositories + types per feature domain
- Backend flat service pattern: `backend/src/services/*.service.ts` with Express routers in `backend/src/api/`
- Direct Supabase client usage in frontend hooks (not through backend API for reads)
- Supabase Realtime for live updates (already published `notifications` table)

### Integration Points
- `Header.tsx` already renders `<NotificationPanel />` — bell icon is in place
- `notification.service.ts` needs BullMQ queue dispatch instead of (or in addition to) direct insert
- Task service, lifecycle service need notification dispatch calls added after successful writes
- Redis on production droplet available for BullMQ (persistence configured)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope

</deferred>

---

*Phase: 15-notification-backend-in-app*
*Context gathered: 2026-04-06*
