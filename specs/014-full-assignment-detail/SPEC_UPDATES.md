# Specification Updates Summary

**Date**: 2025-10-03
**Reason**: Added engagement context, related tasks, and kanban workflow visualization

## What Was Updated

### 1. Clarifications (New Question)
Added 6th clarification question:
- **Q**: How should assignments relate to engagements and show context?
- **A**: Assignment can be part of engagement (multi-task event) or standalone (from intake). Show engagement context, related tasks, progress across all tasks, and kanban view for workflow visualization

### 2. Primary User Story (Enhanced)
**Before**: Focus only on individual assignment details
**After**: Added emphasis on engagement context: "If this assignment is part of a larger engagement (e.g., preparing for a minister visit), I want to see the engagement context, other related tasks, overall progress, and a kanban view showing where all tasks stand in the workflow."

### 3. Acceptance Scenarios (Added 10 New Scenarios)

**New Section: "Engagement Context & Related Tasks"**

**Scenarios 11-11c**: Engagement context banner
- Display engagement info (title, type, date, progress)
- Link to full engagement page
- Show related tasks list
- Navigate between related assignments

**Scenarios 12-12d**: Kanban board
- Open kanban modal with 4 workflow columns
- Highlight current assignment
- Drag-and-drop task cards between columns
- Real-time updates when others move tasks
- Click card to navigate to assignment

**Scenarios 13-13a**: Standalone assignments
- No engagement banner for standalone tasks
- Simple related tasks list for same-dossier assignments

### 4. Functional Requirements (Added 15 New Requirements)

**FR-029 to FR-033**: Complete engagement context and kanban functionality

Key additions:
- **FR-029**: Engagement context banner display
- **FR-030**: Related tasks section with progress calculation
- **FR-031**: Kanban board with drag-and-drop
- **FR-032**: Automatic workflow_stage sync with status
- **FR-033**: Hide engagement features for standalone assignments

### 5. Key Entities (Updated & Added)

**Updated**:
- **Assignment**: Now includes `engagement_id` (optional) and `workflow_stage` fields

**Added**:
- **Engagement**: New entity describing event/activity that contains multiple assignments

### 6. Non-Functional Requirements (Expanded)

Added performance, scalability, reliability, usability, and accessibility requirements for:
- Kanban drag-and-drop performance (<100ms optimistic, <1s confirmation)
- Scalability for engagements with up to 50 assignments
- Failed operation rollback handling
- Visual distinction between engagement-linked vs standalone
- Keyboard-only kanban navigation
- Screen reader announcements for workflow changes

## Impact on Implementation

### Database Changes
- Add `engagement_id` column to `assignments` table (nullable, FK to `engagements`)
- Add `workflow_stage` enum column to `assignments` table
- Create trigger to auto-sync `workflow_stage` with `status`
- Create function `get_engagement_progress()` for progress calculation

### New API Endpoints
- `GET /assignments-related/{id}` - Fetch sibling assignments
- `GET /engagements/{id}/kanban` - Fetch kanban board data
- `PATCH /assignments/{id}/workflow-stage` - Move task in kanban

### New UI Components
- `EngagementContextBanner` - Shows engagement info and progress
- `RelatedTasksList` - Shows sibling assignments
- `EngagementKanbanDialog` - Modal with drag-and-drop kanban board
- `KanbanColumn` - Individual workflow stage column
- `KanbanTaskCard` - Draggable task card

### Updated UI Components
- `AssignmentDetailPage` - Conditionally render engagement context
- `Breadcrumbs` - Include engagement in path if applicable

### Real-time Subscriptions
- Subscribe to `workflow_stage` changes on related assignments
- Real-time kanban updates when tasks move between columns

## Compatibility

**Backward Compatible**: ✅
- `engagement_id` is nullable (existing assignments work without it)
- Engagement context only shows when `engagement_id` is present
- Standalone assignments (existing behavior) unchanged

**Migration Path**:
1. Add new columns to assignments table
2. Backfill `engagement_id` for assignments where `work_item_type = 'engagement'`
3. Backfill `workflow_stage` based on existing `status` values
4. Deploy new UI components (gracefully degrade if engagement features not available)

## Testing Impact

### New E2E Tests Needed
- View engagement-linked assignment (context banner visible)
- View standalone assignment (no engagement features)
- Navigate between related tasks
- Open kanban board
- Drag task between kanban columns
- Real-time kanban updates (2 windows)
- Keyboard navigation in kanban
- Screen reader announcements for kanban

### Updated Tests
- Assignment detail E2E tests now cover 3 types: engagement-linked, dossier-multi, standalone
- Performance tests include kanban drag-and-drop latency
- Accessibility tests include kanban keyboard navigation

---

**Files Updated**:
- ✅ `spec.md` - Complete specification with all engagement/kanban requirements
- ✅ `DESIGN_REFINEMENT.md` - Detailed technical design document
- ✅ `data-model.md` - Updated with engagement_id, workflow_stage, engagements reference, and get_engagement_progress function
- ✅ `contracts/api-spec.yaml` - Added 3 new endpoints (GET /assignments-related/{id}, GET /engagements/{id}/kanban, PATCH /assignments/{id}/workflow-stage)
- ✅ `quickstart.md` - Added engagement/kanban test scenarios (Steps 12-14, updated numbering)
- ✅ `plan.md` - Updated Phase 2 task breakdown (98 tasks, +26 for engagement features)

**Status**: ✅ All specification artifacts updated and synchronized

**Next Action**: Ready for `/tasks` command to generate tasks.md
