# Design Refinement: Assignment Context & Kanban View

**Date**: 2025-10-03
**Issue**: Missing visual context for multi-task engagements and parent-child relationships

## Problem Statement

Current assignment detail page shows individual assignment in isolation, but doesn't show:
1. **Parent context**: Which engagement/dossier does this assignment belong to?
2. **Sibling tasks**: What other assignments are related to the same engagement?
3. **Workflow stage**: Where is this assignment in the overall process?
4. **Engagement progress**: How many related tasks are complete?

**User Story**:
> As a staff member viewing an assignment to "Prepare briefing for Minister visit", I want to see:
> - This is 1 of 5 tasks for the "Minister Visit - Jan 15" engagement
> - Other tasks: "Coordinate logistics" (done), "Review documents" (in progress), "Draft agenda" (to do), "Arrange interpreters" (to do)
> - Overall engagement progress: 40% complete (2/5 tasks done)
> - Kanban board showing all 5 tasks across workflow stages

## Refined Data Model

### 1. Update assignments table (add engagement link)

```sql
-- Add engagement_id to assignments table
ALTER TABLE assignments ADD COLUMN engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL;

-- Index for querying assignments by engagement
CREATE INDEX idx_assignments_engagement ON assignments(engagement_id) WHERE engagement_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN assignments.engagement_id IS 'Optional link to engagement (NULL for standalone assignments from intake)';
```

**Assignment Types**:
- **Engagement-linked**: `engagement_id` is NOT NULL → part of multi-task engagement
- **Standalone**: `engagement_id` is NULL → direct from intake/dossier (e.g., "Review visa application")

### 2. Add engagement workflow stages (kanban columns)

```sql
-- Create engagement workflow stages enum
CREATE TYPE engagement_workflow_stage AS ENUM (
  'todo',          -- Not started
  'in_progress',   -- Being worked on
  'review',        -- Awaiting review/approval
  'done'           -- Completed
);

-- Add workflow_stage to assignments
ALTER TABLE assignments ADD COLUMN workflow_stage engagement_workflow_stage NOT NULL DEFAULT 'todo';

-- Update workflow_stage when status changes (trigger)
CREATE OR REPLACE FUNCTION sync_assignment_workflow_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- Map assignment status to workflow stage
  NEW.workflow_stage := CASE NEW.status
    WHEN 'assigned' THEN 'todo'::engagement_workflow_stage
    WHEN 'in_progress' THEN 'in_progress'::engagement_workflow_stage
    WHEN 'completed' THEN 'done'::engagement_workflow_stage
    WHEN 'cancelled' THEN 'done'::engagement_workflow_stage
    ELSE NEW.workflow_stage
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_workflow_stage_on_status_change
  BEFORE INSERT OR UPDATE OF status ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_assignment_workflow_stage();
```

### 3. Add engagement metadata (for progress calculation)

```sql
-- Add engagement stats (calculated via function)
CREATE OR REPLACE FUNCTION get_engagement_progress(p_engagement_id UUID)
RETURNS TABLE(
  total_assignments INTEGER,
  completed_assignments INTEGER,
  in_progress_assignments INTEGER,
  todo_assignments INTEGER,
  progress_percentage INTEGER,
  kanban_stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'done')::INTEGER as completed_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'in_progress')::INTEGER as in_progress_assignments,
    COUNT(*) FILTER (WHERE workflow_stage = 'todo')::INTEGER as todo_assignments,
    ROUND((COUNT(*) FILTER (WHERE workflow_stage = 'done')::DECIMAL / NULLIF(COUNT(*), 0)::DECIMAL) * 100)::INTEGER as progress_percentage,
    jsonb_build_object(
      'todo', COUNT(*) FILTER (WHERE workflow_stage = 'todo'),
      'in_progress', COUNT(*) FILTER (WHERE workflow_stage = 'in_progress'),
      'review', COUNT(*) FILTER (WHERE workflow_stage = 'review'),
      'done', COUNT(*) FILTER (WHERE workflow_stage = 'done')
    ) as kanban_stats
  FROM assignments
  WHERE engagement_id = p_engagement_id;
END;
$$ LANGUAGE plpgsql;
```

## Refined UI/UX Design

### Assignment Detail Page - New Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumbs: Dossiers > Saudi-China Trade > Minister Visit  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔗 Part of Engagement: "Minister Visit - Jan 15"        │ │
│ │ Progress: ████████░░░░░░░░░░ 40% (2/5 tasks complete)  │ │
│ │ [View Full Engagement →]  [Show Kanban →]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Assignment: Prepare briefing for Minister visit         │ │
│ │ Status: In Progress  Priority: High  SLA: 2h 15m        │ │
│ │ Assigned to: Ahmed Al-Zahrani  Date: Jan 13, 2025      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Related Tasks (4)                          [Expand All] │ │
│ │                                                          │ │
│ │ ✅ Coordinate logistics (Sara) - Completed             │ │
│ │ 🔄 Review documents (Mohammed) - In Progress            │ │
│ │ ⬜ Draft agenda (Unassigned) - To Do                    │ │
│ │ ⬜ Arrange interpreters (Fatima) - To Do                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [Rest of assignment detail page: Comments, Checklist, etc.] │
└─────────────────────────────────────────────────────────────┘
```

### New Component: EngagementKanbanDialog

When user clicks "Show Kanban →":

```
┌─────────────────────────────────────────────────────────────────┐
│ Minister Visit - Jan 15                                [Close] │
│ Progress: 40% (2/5 complete)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  To Do (2)     │ In Progress (2)  │  Review (0)   │  Done (1)   │
│ ───────────────┼──────────────────┼───────────────┼──────────── │
│                │                  │               │              │
│ ┌────────────┐ │ ┌────────────┐  │               │ ┌──────────┐│
│ │Draft agenda│ │ │Prepare     │  │               │ │Coordinate││
│ │            │ │ │briefing ⭐ │  │               │ │logistics ││
│ │Unassigned  │ │ │Ahmed       │  │               │ │Sara      ││
│ │SLA: 4h     │ │ │SLA: 2h 15m │  │               │ │✓ Done    ││
│ └────────────┘ │ └────────────┘  │               │ └──────────┘│
│                │                  │               │              │
│ ┌────────────┐ │ ┌────────────┐  │               │              │
│ │Arrange     │ │ │Review docs │  │               │              │
│ │interpreters│ │ │            │  │               │              │
│ │Fatima      │ │ │Mohammed    │  │               │              │
│ │SLA: 6h     │ │ │SLA: 3h     │  │               │              │
│ └────────────┘ │ └────────────┘  │               │              │
│                │                  │               │              │
└─────────────────────────────────────────────────────────────────┘

⭐ = Current assignment (highlighted)
Cards are draggable between columns (updates workflow_stage)
Click card to navigate to that assignment's detail page
```

### Engagement Detail Page - New Tab

On `/engagements/{id}` page, add new "Tasks" tab:

```
┌─────────────────────────────────────────────────────────────┐
│ Engagement: Minister Visit - Jan 15                          │
│ [Overview] [After Actions] [Tasks ⬅ NEW]                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Task Progress: ████████░░░░░░░░░░ 40% (2/5 complete)        │
│                                                               │
│ [Kanban View] [List View] [Timeline View]                    │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔄 In Progress (2)                                       │ │
│ │                                                          │ │
│ │ • Prepare briefing (Ahmed) - 2h 15m left [View Detail] │ │
│ │ • Review documents (Mohammed) - 3h left [View Detail]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⬜ To Do (2)                                             │ │
│ │                                                          │ │
│ │ • Draft agenda (Unassigned) - 4h allocated              │ │
│ │ • Arrange interpreters (Fatima) - 6h allocated          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Done (1)                                              │ │
│ │                                                          │ │
│ │ • Coordinate logistics (Sara) - Completed 2 days ago    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## How Assignments Are Created (Refined Flow)

### Scenario 1: Intake → Standalone Assignment
```
1. Ticket created in intake ("Review visa application #12345")
2. Auto-assignment engine assigns to staff based on skills
3. Assignment created with:
   - work_item_id = ticket_id
   - work_item_type = 'ticket'
   - engagement_id = NULL (standalone)
   - workflow_stage = 'todo'
4. Staff sees assignment in "My Assignments" list
5. Staff opens assignment detail → sees only this task (no related tasks)
```

### Scenario 2: Engagement → Multiple Assignments
```
1. Dossier created ("Saudi-China Trade Partnership")
2. Engagement created within dossier ("Minister Visit - Jan 15")
3. Supervisor manually creates 5 assignments for engagement:
   a. "Coordinate logistics" → assigned to Sara
   b. "Review documents" → assigned to Mohammed
   c. "Prepare briefing" → assigned to Ahmed
   d. "Draft agenda" → unassigned (in queue)
   e. "Arrange interpreters" → assigned to Fatima

   Each assignment has:
   - work_item_id = engagement_id
   - work_item_type = 'engagement'
   - engagement_id = engagement_id (parent)
   - workflow_stage = 'todo'

4. Ahmed opens "Prepare briefing" assignment detail → sees:
   - Engagement context banner (top)
   - Related tasks section (4 sibling tasks)
   - "Show Kanban" button to view all 5 tasks
```

### Scenario 3: Dossier → Multiple Assignments (No Engagement)
```
1. Dossier created ("Routine Documentation Review")
2. Auto-assignment creates 3 assignments directly on dossier:
   a. "Review Section A" → Ali
   b. "Review Section B" → Nora
   c. "Review Section C" → Khalid

   Each assignment has:
   - work_item_id = dossier_id
   - work_item_type = 'dossier'
   - engagement_id = NULL (no engagement)
   - workflow_stage = 'todo'

3. Staff opens assignment → sees:
   - Dossier context banner (simpler than engagement)
   - Related tasks section (2 sibling tasks with same dossier_id)
   - No kanban (simpler list view)
```

## New API Endpoints

### GET /assignments-related/{id}
Returns sibling assignments (same engagement or dossier):
```json
{
  "context_type": "engagement", // or "dossier" or "standalone"
  "context_id": "uuid",
  "context_title": "Minister Visit - Jan 15",
  "progress": {
    "total": 5,
    "completed": 2,
    "in_progress": 2,
    "todo": 1,
    "percentage": 40
  },
  "related_assignments": [
    {
      "id": "uuid",
      "title": "Coordinate logistics",
      "assignee": "Sara Al-Mutairi",
      "status": "completed",
      "workflow_stage": "done",
      "completed_at": "2025-01-11T14:30:00Z"
    },
    // ... other 3 tasks
  ]
}
```

### GET /engagements/{id}/kanban
Returns kanban board data:
```json
{
  "engagement_id": "uuid",
  "engagement_title": "Minister Visit - Jan 15",
  "columns": {
    "todo": [
      {
        "id": "uuid",
        "title": "Draft agenda",
        "assignee": null,
        "sla_remaining_seconds": 14400,
        "priority": "medium"
      }
    ],
    "in_progress": [
      {
        "id": "uuid",
        "title": "Prepare briefing",
        "assignee": "Ahmed Al-Zahrani",
        "sla_remaining_seconds": 8100,
        "priority": "high",
        "is_current": true // Highlighted in kanban
      }
    ],
    "review": [],
    "done": [...]
  }
}
```

### PATCH /assignments/{id}/workflow-stage
Move assignment between kanban columns:
```json
{
  "workflow_stage": "review" // or "todo", "in_progress", "done"
}
```

## Updated Functional Requirements

**FR-029**: System MUST display engagement context when assignment is part of an engagement
- Show engagement title, type, and date
- Display progress bar (% of related assignments complete)
- Link to full engagement detail page

**FR-030**: System MUST show related assignments (sibling tasks)
- List all assignments with same engagement_id or work_item_id
- Show assignee, status, and workflow stage for each
- Allow navigation to sibling assignment details

**FR-031**: System MUST provide kanban view for engagement assignments
- 4 columns: To Do, In Progress, Review, Done
- Drag-and-drop to change workflow_stage
- Highlight current assignment
- Real-time updates when other users move tasks

**FR-032**: System MUST sync workflow_stage with assignment status
- assigned → todo
- in_progress → in_progress
- completed → done
- Automatic via database trigger

## Migration Plan

1. Add `engagement_id` column to assignments (nullable)
2. Add `workflow_stage` enum and column
3. Create sync trigger
4. Backfill existing assignments:
   - If work_item_type = 'engagement' → set engagement_id = work_item_id
   - Set workflow_stage based on current status
5. Create progress calculation function
6. Update RLS policies to include engagement-based access

## Benefits

✅ **Context Awareness**: Staff see the "big picture" for their task
✅ **Progress Visibility**: Managers see engagement-level progress at a glance
✅ **Visual Workflow**: Kanban makes task flow intuitive
✅ **Real-time Collaboration**: Multiple staff working on same engagement see updates
✅ **Flexible**: Works for both engagement-linked AND standalone assignments

---

**Next Steps**: Update plan.md and data-model.md with these refinements, then regenerate tasks.md
