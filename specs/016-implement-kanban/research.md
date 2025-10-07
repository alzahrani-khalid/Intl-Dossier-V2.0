# Research: Full Engagement Kanban Board

**Feature**: 016-implement-kanban
**Date**: 2025-10-07

## Overview
This document captures technical research and decision-making for the Engagement Kanban Board feature. All decisions were made to support real-time collaboration, role-based permissions, dual SLA tracking, and full accessibility compliance.

---

## 1. Real-time Collaboration Architecture

### Problem
Need to show assignment movements across multiple user sessions in real-time when users drag-and-drop tasks between Kanban columns.

### Research Findings

**Option A: Supabase Realtime Subscriptions**
- ✅ Native Supabase feature, zero custom WebSocket code
- ✅ Automatic reconnection and error handling
- ✅ Latency: <500ms for most operations
- ✅ Scales to 100+ concurrent users without additional infrastructure
- ✅ Works with RLS policies (security maintained)
- ❌ Requires Supabase (vendor lock-in, but acceptable per constitution §4)

**Option B: Custom WebSocket Implementation**
- ❌ Requires building/maintaining WebSocket server
- ❌ Complex reconnection logic needed
- ❌ Must coordinate with RLS policies manually
- ✅ No vendor lock-in
- ✅ Full control over message format

**Option C: HTTP Polling**
- ❌ High latency (minimum 2-3 second poll intervals)
- ❌ Increased server load
- ✅ Simple implementation
- ❌ Poor UX for real-time collaboration

### Decision
**Use Supabase Realtime subscriptions on `assignments` table**

### Rationale
- Native Supabase feature provides sub-second latency without reinventing WebSocket infrastructure
- Automatic handling of reconnections, errors, and RLS enforcement
- Proven scalability for 100+ concurrent users (within project scope)
- Aligns with constitution §4 (self-hosted Supabase acceptable for data sovereignty)

### Implementation Notes
- Subscribe to channel: `engagement:{engagementId}:kanban`
- Broadcast event: `assignment:moved` when workflow_stage changes
- Payload includes: `{ assignment_id, from_stage, to_stage, moved_by_user_id }`
- Client-side optimistic updates + rollback on broadcast mismatch

---

## 2. Drag-and-Drop Library Selection

### Problem
Need a drag-and-drop library that supports mobile touch, accessibility, RTL layouts, and works well with React 18+.

### Research Findings

**Option A: @dnd-kit/core + kibo-ui Kanban**
- ✅ Excellent mobile touch support (pointer events API)
- ✅ Built-in accessibility (keyboard navigation, screen reader announcements)
- ✅ RTL-aware (automatically flips drag direction)
- ✅ Tree-shakeable (small bundle size)
- ✅ Actively maintained (last update <1 month)
- ✅ TypeScript-first with excellent type definitions
- ❌ Requires manual column/card component setup (mitigated by kibo-ui)

**Option B: react-beautiful-dnd**
- ❌ No longer maintained (archived by Atlassian)
- ❌ Poor mobile touch support
- ❌ Large bundle size (~100KB)
- ✅ Simple API
- ✅ Good documentation

**Option C: react-dnd**
- ❌ Complex API (HTML5 drag API + monitors + connectors)
- ❌ Poor mobile touch support (requires react-dnd-touch-backend)
- ❌ No built-in accessibility
- ✅ Mature library
- ✅ Flexible

### Decision
**Use @dnd-kit/core + kibo-ui Kanban component (via shadcn MCP)**

### Rationale
- Best-in-class mobile touch and accessibility support (constitutional requirements §6)
- RTL-aware out of the box (constitutional requirement §1)
- Small bundle size aligns with performance goals
- kibo-ui provides pre-built Kanban components that follow shadcn/ui patterns
- Active maintenance ensures long-term viability

### Implementation Notes
- Install via: `npx shadcn@latest add https://www.kibo-ui.com/components/kanban`
- Use `<DndContext>` wrapper in KanbanBoard.tsx
- Implement `<Droppable>` for columns, `<Draggable>` for cards
- Add `useSensors` hook for touch support configuration

---

## 3. Role-Based Permission Strategy

### Problem
Need to enforce different stage transition rules for staff (sequential) vs managers (skip allowed) securely.

### Research Findings

**Option A: Server-side validation + client-side optimistic UI**
- ✅ Secure: Server validates all transitions via Edge Function + RLS
- ✅ Fast UX: Optimistic updates, graceful rollback on failure
- ✅ Maintainable: Single source of truth (server)
- ❌ Requires Edge Function for validation logic

**Option B: Client-only checks**
- ❌ Insecure: Can be bypassed via dev tools
- ✅ Simple implementation
- ✅ No server roundtrip

**Option C: Synchronous server validation**
- ✅ Secure
- ❌ Slow UX: User must wait for server response before seeing card move
- ❌ Poor mobile experience on slow networks

### Decision
**Server-side role validation in Edge Function + client-side optimistic UI**

### Rationale
- Security via RLS policies and server-side validation (constitutional requirement §3)
- Fast UX with optimistic updates (drag card immediately, rollback if server rejects)
- Graceful error handling (show validation message, revert card position)
- Single source of truth prevents client-server permission drift

### Implementation Notes
- Edge Function: `assignments-workflow-stage-update`
- Check user role from JWT claims
- Validate transition rules:
  - Staff: `current_stage` must be sequential predecessor of `new_stage`
  - Manager/Admin: Allow all transitions
  - All roles: Allow any stage → `cancelled`
- Return 403 with `{ validation_error: "..." }` on failure
- Client shows toast notification and reverts card on 403

---

## 4. Dual SLA Tracking Implementation

### Problem
Need to track both overall assignment SLA (creation to completion) and individual stage-specific SLA targets.

### Research Findings

**Option A: Separate tables (assignment_sla_overall + assignment_stage_history)**
- ✅ Clean separation of concerns
- ✅ Efficient queries (no complex JOINs for overall SLA)
- ✅ Enables historical analysis (stage duration trends)
- ✅ Schema extensibility (easy to add per-stage metrics)
- ❌ Two tables to manage

**Option B: Single denormalized table**
- ✅ Single source of data
- ❌ Complex queries (need to aggregate stage history for overall SLA)
- ❌ Data duplication (overall SLA repeated for each stage row)
- ❌ Hard to add new metrics

**Option C: JSONB columns in assignments table**
- ✅ Single table
- ❌ Poor query performance (can't index JSONB effectively)
- ❌ Complex SQL for aggregations
- ❌ Hard to enforce schema validation

### Decision
**Separate `assignment_stage_history` table for stage tracking, extend `assignments` table for overall SLA**

### Rationale
- Clean data model enables efficient queries (overall SLA lookup = O(1), stage history = indexed FK)
- Historical analysis is first-class (can analyze stage duration trends)
- Schema extensibility for future per-stage metrics
- PostgreSQL strengths (relational integrity, indexing) utilized fully

### Implementation Notes
- `assignments` table:
  - Add `overall_sla_deadline` (timestamptz)
  - Add `current_stage_sla_deadline` (timestamptz)
- New `assignment_stage_history` table:
  - Track every stage transition
  - Calculate `stage_duration_seconds` on insert
  - Flag `stage_sla_met` boolean for analytics
- Edge Function updates both tables atomically in transaction

---

## 5. Large Dataset Optimization

### Problem
Engagements may have 50+ assignments, causing performance issues with full DOM rendering.

### Research Findings

**Option A: Virtual scrolling (react-window)**
- ✅ Handles 100+ items without performance degradation
- ✅ Maintains drag-and-drop UX (dnd-kit supports virtualization)
- ✅ Simple API
- ❌ Requires height calculation for each item

**Option B: Pagination**
- ✅ Simple implementation
- ❌ Breaks drag-and-drop UX (can't drag across pages)
- ❌ Poor mental model for Kanban board

**Option C: "Load more" buttons**
- ✅ Simple implementation
- ❌ Awkward interaction in Kanban context
- ❌ Still requires virtualization for performance

### Decision
**Implement simple virtual scrolling with react-window initially**

### Rationale
- Handles 50+ assignments without performance degradation (meets FR-015)
- Maintains intuitive drag-and-drop UX
- Can optimize later based on actual usage patterns (deferred optimization per spec)
- react-window is lightweight (~6KB) and well-maintained

### Implementation Notes
- Use `<FixedSizeList>` from react-window for each Kanban column
- Configure `itemSize={120}` (approximate card height)
- Enable `overscanCount={5}` for smooth scrolling
- dnd-kit sensors work with virtual lists out-of-the-box

---

## 6. Notification Preferences Storage

### Problem
Users need to configure which stage transitions trigger notifications (all, specific stages, or none).

### Research Findings

**Option A: JSONB column in staff_profiles table**
- ✅ Flexible schema (easy to extend preferences)
- ✅ No additional tables (simpler architecture)
- ✅ Fast lookups (indexed on staff_profiles PK)
- ✅ JSONB query support for filtering users by preferences
- ❌ Requires JSONB validation logic

**Option B: Separate notification_settings table**
- ✅ Relational integrity
- ✅ Easy to add columns
- ❌ Over-engineered for this scope
- ❌ Additional JOIN for every notification check

**Option C: Hardcoded defaults (no customization)**
- ✅ Simplest implementation
- ❌ Doesn't meet FR-011 requirement

### Decision
**Store in `staff_profiles.notification_preferences` JSONB column**

### Rationale
- Flexible schema supports future notification types without migrations
- Fast lookups (single-table query on indexed PK)
- JSONB validation via CHECK constraint ensures schema correctness
- Aligns with Supabase best practices for user preferences

### Implementation Notes
- Schema:
  ```json
  {
    "stage_transitions": {
      "enabled": true,
      "stages": ["review", "done"] // or "all"
    }
  }
  ```
- CHECK constraint: `notification_preferences ? 'stage_transitions'`
- Default value on user creation: `{"stage_transitions": {"enabled": true, "stages": "all"}}`

---

## Summary

All research tasks completed. Key decisions:
1. ✅ Supabase Realtime for real-time collaboration
2. ✅ @dnd-kit/core + kibo-ui for drag-and-drop
3. ✅ Server-side validation + optimistic UI for permissions
4. ✅ Separate tables for dual SLA tracking
5. ✅ Virtual scrolling (react-window) for large datasets
6. ✅ JSONB column for notification preferences

No blocking unknowns remain. Ready for Phase 1 (Design & Contracts).
