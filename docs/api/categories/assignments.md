# Assignments API

## Overview

The Assignments API manages task assignments with SLA tracking, checklist management, collaborative features, and real-time progress monitoring. Supports auto-assignment based on workload and skills, escalation workflows, and observer roles for cross-team collaboration.

## Endpoints

### Get Assignment Details

Retrieve comprehensive details for a single assignment including engagement context, checklist, comments, and SLA status.

**Endpoint:** `POST /assignments-get`

**Request Body:**
```json
{
  "id": "assignment-uuid"
}
```

**Response (200 OK):**
```json
{
  "assignment": {
    "id": "assignment-uuid",
    "work_item_id": "task-uuid",
    "work_item_type": "task",
    "work_item_title": "Prepare briefing materials for France meeting",
    "work_item_preview": "Compile background documents and talking points...",
    "work_item_linked_entities": [
      {
        "type": "dossier",
        "id": "dossier-uuid",
        "name_en": "France Bilateral Relations",
        "name_ar": "العلاقات الثنائية مع فرنسا",
        "status": "active"
      }
    ],
    "assignee_id": "user-uuid",
    "assignee_name": "Ahmed Al-Saud",
    "assigned_by": "supervisor-uuid",
    "assigned_by_name": "Sara Al-Rashid",
    "status": "in_progress",
    "priority": "high",
    "sla_deadline": "2024-01-16T18:00:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z",
    "escalation_recipient_id": null,
    "escalated_at": null,
    "completed_at": null,
    "completed_by": null,
    "required_skills": ["research", "writing"],
    "can_escalate": true,
    "can_complete": true,
    "engagement_id": "engagement-uuid"
  },
  "engagement": {
    "id": "engagement-uuid",
    "title_en": "Bilateral Meeting with France",
    "title_ar": "اجتماع ثنائي مع فرنسا",
    "engagement_type": "bilateral_meeting",
    "start_date": "2024-02-15T10:00:00Z",
    "end_date": "2024-02-15T12:00:00Z",
    "progress_percentage": 65,
    "total_assignments": 8,
    "completed_assignments": 5
  },
  "sla": {
    "deadline": "2024-01-16T18:00:00Z",
    "time_remaining_seconds": 118800,
    "percentage_elapsed": 38,
    "health_status": "safe"
  },
  "comments": [
    {
      "id": "comment-uuid",
      "text": "Initial draft completed, awaiting review",
      "author": {
        "id": "user-uuid",
        "name": "Ahmed Al-Saud",
        "username": "aalsaud"
      },
      "created_at": "2024-01-15T14:00:00Z",
      "updated_at": "2024-01-15T14:00:00Z",
      "mentions": [
        {
          "id": "supervisor-uuid",
          "name": "Sara Al-Rashid",
          "username": "salrashid"
        }
      ],
      "reactions": [
        {
          "emoji": "👍",
          "count": 2,
          "users": ["Sara Al-Rashid", "Omar Al-Faisal"],
          "user_reacted": false
        }
      ]
    }
  ],
  "checklist_items": [
    {
      "id": "item-uuid-1",
      "text": "Research France's climate policy positions",
      "completed": true,
      "completed_at": "2024-01-15T12:00:00Z",
      "completed_by": {
        "id": "user-uuid",
        "name": "Ahmed Al-Saud",
        "username": "aalsaud"
      },
      "sequence": 1
    },
    {
      "id": "item-uuid-2",
      "text": "Draft talking points",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "sequence": 2
    }
  ],
  "observers": [
    {
      "user": {
        "id": "observer-uuid",
        "name": "Fatima Al-Dosari",
        "username": "faldosari"
      },
      "role": "subject_matter_expert",
      "added_at": "2024-01-15T10:30:00Z"
    }
  ],
  "timeline": [
    {
      "id": "event-uuid",
      "event_type": "status_changed",
      "actor": {
        "id": "user-uuid",
        "name": "Ahmed Al-Saud",
        "username": "aalsaud"
      },
      "event_data": {
        "from": "pending",
        "to": "in_progress"
      },
      "created_at": "2024-01-15T10:15:00Z",
      "is_critical": true
    }
  ],
  "checklist_progress": 50
}
```

**Error Responses:**
- `400 Bad Request` - Missing assignment ID
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User lacks permission to view assignment
- `404 Not Found` - Assignment not found

**Authorization:**
User can view if they are:
- The assignee
- The supervisor who assigned it
- An escalation recipient
- An observer
- A supervisor in the same unit
- An admin

**SLA Health Status:**
- `safe`: < 75% elapsed
- `warning`: 75-99% elapsed
- `breached`: ≥ 100% elapsed

**Implementation Example:**
```typescript
const getAssignmentDetails = async (assignmentId: string) => {
  const response = await fetch('/assignments-get', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: assignmentId })
  });

  if (response.status === 403) {
    throw new Error('You do not have permission to view this assignment');
  }

  const data = await response.json();

  // Display SLA warning if needed
  if (data.sla.health_status === 'warning') {
    showSLAWarning(data.sla.time_remaining_seconds);
  }

  // Enable/disable actions based on permissions
  setCanEscalate(data.assignment.can_escalate);
  setCanComplete(data.assignment.can_complete);

  return data;
};
```

**Notes:**
- Real-time SLA calculation on each request
- Engagement data included if assignment is linked to an engagement
- Comments include reaction summaries and mention details
- Timeline events flagged as critical for important state changes

---

### Get My Assignments

Retrieve all assignments for the authenticated user with SLA countdown.

**Endpoint:** `GET /assignments-my-assignments`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `in_progress`, `completed`, `cancelled`)
- `include_completed` (optional): Include completed assignments (default: false)

**Response (200 OK):**
```json
{
  "assignments": [
    {
      "id": "assignment-uuid-1",
      "work_item_id": "task-uuid-1",
      "work_item_type": "task",
      "work_item_title": "Prepare briefing materials",
      "assigned_at": "2024-01-15T10:00:00Z",
      "sla_deadline": "2024-01-16T18:00:00Z",
      "time_remaining_seconds": 118800,
      "priority": "high",
      "status": "in_progress",
      "warning_sent_at": null,
      "escalated_at": null,
      "escalation_recipient_id": null
    },
    {
      "id": "assignment-uuid-2",
      "work_item_id": "task-uuid-2",
      "work_item_type": "task",
      "work_item_title": "Review position paper",
      "assigned_at": "2024-01-15T14:00:00Z",
      "sla_deadline": "2024-01-17T10:00:00Z",
      "time_remaining_seconds": 230400,
      "priority": "medium",
      "status": "pending",
      "warning_sent_at": null,
      "escalated_at": null,
      "escalation_recipient_id": null
    }
  ],
  "total_count": 2,
  "summary": {
    "active_count": 2,
    "at_risk_count": 0,
    "breached_count": 0
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated

**Implementation Example:**
```typescript
const getMyAssignments = async (includeCompleted = false) => {
  const params = new URLSearchParams();
  if (includeCompleted) {
    params.set('include_completed', 'true');
  }

  const response = await fetch(
    `/assignments-my-assignments?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  // Sort by urgency (most urgent first)
  const sortedAssignments = data.assignments.sort((a, b) =>
    a.time_remaining_seconds - b.time_remaining_seconds
  );

  // Show notifications for at-risk assignments
  if (data.summary.at_risk_count > 0) {
    showNotification(`You have ${data.summary.at_risk_count} assignments at risk of SLA breach`);
  }

  return { ...data, assignments: sortedAssignments };
};
```

**Notes:**
- Results ordered by `sla_deadline` (most urgent first)
- Default behavior excludes completed and cancelled assignments
- `time_remaining_seconds` can be negative (indicates breach)
- Summary provides quick overview of assignment health

---

### Get Assignment Queue

Retrieve assignments queue with filtering for managers/supervisors.

**Endpoint:** `GET /assignments-queue`

**Query Parameters:**
- `unit_id` (optional): Filter by organizational unit
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `limit` (optional): Items per page (default: 20)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "assignments": [
    {
      "id": "assignment-uuid",
      "assignee_name": "Ahmed Al-Saud",
      "work_item_title": "Prepare briefing materials",
      "status": "in_progress",
      "priority": "high",
      "sla_deadline": "2024-01-16T18:00:00Z",
      "time_remaining_seconds": 118800,
      "health_status": "safe"
    }
  ],
  "total": 15,
  "queue_stats": {
    "total_pending": 3,
    "total_in_progress": 9,
    "total_at_risk": 2,
    "total_breached": 1
  }
}
```

---

### Auto-Assign Assignment

Automatically assign a task based on workload and skills.

**Endpoint:** `POST /assignments-auto-assign`

**Request Body:**
```json
{
  "work_item_id": "task-uuid",
  "work_item_type": "task",
  "required_skills": ["research", "writing"],
  "priority": "high",
  "unit_id": "bilateral-relations-uuid"
}
```

**Response (200 OK):**
```json
{
  "assignment": {
    "id": "assignment-uuid",
    "work_item_id": "task-uuid",
    "assignee_id": "selected-user-uuid",
    "assignee_name": "Ahmed Al-Saud",
    "assigned_by": "system",
    "status": "pending",
    "priority": "high",
    "sla_deadline": "2024-01-16T18:00:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "assignment_reason": "Best skill match with lowest current workload",
  "assignment_score": 0.89
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - No suitable assignee found

**Auto-Assignment Algorithm:**
Considers:
1. **Skill matching**: Required skills vs. user skills
2. **Current workload**: Active assignments count
3. **SLA health**: User's SLA compliance rate
4. **Unit membership**: Users in specified unit
5. **Availability**: Users not on leave/out-of-office

**Implementation Example:**
```typescript
const autoAssignTask = async (taskId: string, requirements: AssignmentRequirements) => {
  const response = await fetch('/assignments-auto-assign', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      work_item_id: taskId,
      work_item_type: 'task',
      required_skills: requirements.skills,
      priority: requirements.priority,
      unit_id: requirements.unitId
    })
  });

  if (response.status === 404) {
    throw new Error('No suitable assignee found. Consider manual assignment.');
  }

  const result = await response.json();

  console.log(`Auto-assigned to ${result.assignment.assignee_name}`);
  console.log(`Reason: ${result.assignment_reason}`);

  return result.assignment;
};
```

---

### Manual Assignment Override

Manually override auto-assignment or reassign.

**Endpoint:** `POST /assignments-manual-override`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "new_assignee_id": "user-uuid",
  "override_reason": "Subject matter expertise required",
  "notify_assignee": true
}
```

**Response (200 OK):**
```json
{
  "assignment": {
    "id": "assignment-uuid",
    "assignee_id": "user-uuid",
    "assignee_name": "Fatima Al-Dosari",
    "reassigned_at": "2024-01-15T11:00:00Z",
    "reassigned_by": "supervisor-uuid"
  }
}
```

---

### Complete Assignment

Mark an assignment as completed.

**Endpoint:** `POST /assignments-complete`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "completion_notes": "All briefing materials prepared and submitted for review"
}
```

**Response (200 OK):**
```json
{
  "id": "assignment-uuid",
  "status": "completed",
  "assignee_id": "user-uuid",
  "completed_at": "2024-01-15T16:00:00Z",
  "completed_by": "user-uuid",
  "updated_at": "2024-01-15T16:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Assignment already completed
- `403 Forbidden` - User lacks permission to complete
- `409 Conflict` - Concurrent modification detected

**Authorization:**
Can complete if:
- User is the assignee
- User is an observer with completion rights

**Implementation Example:**
```typescript
const completeAssignment = async (
  assignmentId: string,
  notes?: string
) => {
  try {
    const response = await fetch('/assignments-complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignment_id: assignmentId,
        completion_notes: notes
      })
    });

    if (response.status === 409) {
      throw new Error('Assignment was modified. Please refresh and try again.');
    }

    const result = await response.json();

    // Show success notification
    showNotification('Assignment completed successfully!');

    return result;
  } catch (error) {
    console.error('Failed to complete assignment:', error);
    throw error;
  }
};
```

**Notes:**
- Creates completion event in timeline
- Updates assignment status to `completed`
- Records completion timestamp and user
- Optional completion notes for audit trail

---

### Escalate Assignment

Escalate an assignment to a supervisor or manager.

**Endpoint:** `POST /assignments-escalate`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "escalation_recipient_id": "manager-uuid",
  "escalation_reason": "Requires additional resources and time extension",
  "requested_extension_hours": 24
}
```

**Response (200 OK):**
```json
{
  "assignment": {
    "id": "assignment-uuid",
    "status": "in_progress",
    "escalated_at": "2024-01-15T15:00:00Z",
    "escalation_recipient_id": "manager-uuid",
    "escalation_recipient_name": "Omar Al-Faisal"
  },
  "notification_sent": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid escalation
- `403 Forbidden` - Only assignee can escalate
- `404 Not Found` - Recipient not found

**Implementation Example:**
```typescript
const escalateAssignment = async (
  assignmentId: string,
  escalationData: EscalationRequest
) => {
  const response = await fetch('/assignments-escalate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assignment_id: assignmentId,
      escalation_recipient_id: escalationData.recipientId,
      escalation_reason: escalationData.reason,
      requested_extension_hours: escalationData.extensionHours
    })
  });

  const result = await response.json();

  if (result.notification_sent) {
    showNotification('Escalation request sent to manager');
  }

  return result;
};
```

---

### Create Checklist Item

Add an item to assignment checklist.

**Endpoint:** `POST /assignments-checklist-create-item`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "text": "Verify all statistics are up-to-date",
  "sequence": 3
}
```

**Response (201 Created):**
```json
{
  "id": "item-uuid",
  "assignment_id": "assignment-uuid",
  "text": "Verify all statistics are up-to-date",
  "completed": false,
  "sequence": 3,
  "created_at": "2024-01-15T12:00:00Z"
}
```

---

### Toggle Checklist Item

Mark a checklist item as completed or incomplete.

**Endpoint:** `POST /assignments-checklist-toggle-item`

**Request Body:**
```json
{
  "item_id": "item-uuid",
  "completed": true
}
```

**Response (200 OK):**
```json
{
  "id": "item-uuid",
  "completed": true,
  "completed_at": "2024-01-15T14:30:00Z",
  "completed_by": "user-uuid"
}
```

---

### Import Checklist Template

Import a predefined checklist template.

**Endpoint:** `POST /assignments-checklist-import-template`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "template_id": "briefing-prep-template-uuid"
}
```

**Response (201 Created):**
```json
{
  "assignment_id": "assignment-uuid",
  "imported_items_count": 8,
  "items": [
    {
      "id": "item-uuid-1",
      "text": "Research country background",
      "sequence": 1
    },
    {
      "id": "item-uuid-2",
      "text": "Draft key messages",
      "sequence": 2
    }
  ]
}
```

---

### Create Comment

Add a comment to an assignment.

**Endpoint:** `POST /assignments-comments-create`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "text": "Initial draft completed, @salrashid please review",
  "mentions": ["user-uuid-supervisor"]
}
```

**Response (201 Created):**
```json
{
  "id": "comment-uuid",
  "assignment_id": "assignment-uuid",
  "text": "Initial draft completed, @salrashid please review",
  "user_id": "commenter-uuid",
  "mentions": [
    {
      "user_id": "user-uuid-supervisor",
      "username": "salrashid"
    }
  ],
  "created_at": "2024-01-15T14:00:00Z"
}
```

**Notes:**
- Mentioned users receive notifications
- Supports @ mentions with username
- Markdown formatting supported

---

### Toggle Comment Reaction

Add or remove an emoji reaction to a comment.

**Endpoint:** `POST /assignments-comments-reactions-toggle`

**Request Body:**
```json
{
  "comment_id": "comment-uuid",
  "emoji": "👍"
}
```

**Response (200 OK):**
```json
{
  "comment_id": "comment-uuid",
  "emoji": "👍",
  "action": "added",
  "reaction_count": 3
}
```

**Supported Emojis:**
- `👍` Thumbs up
- `❤️` Heart
- `🎉` Celebration
- `👀` Eyes
- `✅` Check mark

---

### Add Observer

Add an observer to an assignment for visibility and collaboration.

**Endpoint:** `POST /assignments-observer-action`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "action": "add",
  "user_id": "observer-uuid",
  "role": "subject_matter_expert"
}
```

**Response (200 OK):**
```json
{
  "assignment_id": "assignment-uuid",
  "observer_id": "observer-uuid",
  "role": "subject_matter_expert",
  "added_at": "2024-01-15T11:00:00Z"
}
```

**Observer Roles:**
- `subject_matter_expert`: Provides domain expertise
- `stakeholder`: Interested party requiring visibility
- `quality_reviewer`: Reviews work for quality assurance

---

### Update Workflow Stage

Update the workflow stage of an assignment.

**Endpoint:** `POST /assignments-workflow-stage-update`

**Request Body:**
```json
{
  "assignment_id": "assignment-uuid",
  "stage": "review",
  "notes": "Moving to review stage after initial draft"
}
```

**Response (200 OK):**
```json
{
  "assignment_id": "assignment-uuid",
  "previous_stage": "in_progress",
  "current_stage": "review",
  "updated_at": "2024-01-15T15:00:00Z"
}
```

---

### Get Related Assignments

Retrieve assignments related to the same work item or engagement.

**Endpoint:** `GET /assignments-related-get?assignment_id={id}`

**Response (200 OK):**
```json
{
  "assignment_id": "assignment-uuid",
  "related_by_engagement": [
    {
      "id": "related-uuid-1",
      "work_item_title": "Logistics planning",
      "assignee_name": "Sara Al-Rashid",
      "status": "completed"
    }
  ],
  "related_by_work_item": [
    {
      "id": "related-uuid-2",
      "work_item_title": "Same task - previous assignment",
      "assignee_name": "Previous assignee",
      "status": "completed"
    }
  ]
}
```

---

## Assignment Lifecycle States

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| `pending` | Assigned but not started | start, reassign, cancel |
| `in_progress` | Actively being worked on | complete, escalate, update_stage |
| `completed` | Finished successfully | - (terminal) |
| `cancelled` | Cancelled before completion | - (terminal) |

## SLA Calculation

SLA deadline calculated based on:
1. **Priority**: Determines base duration
2. **Complexity**: May extend duration
3. **Working hours**: Business hours only (configurable)
4. **Holidays**: Excluded from calculation

## Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| `400` | Bad Request | Validate required fields and status transitions |
| `401` | Unauthorized | Verify authentication token |
| `403` | Forbidden | Check assignment permissions (assignee/observer/supervisor) |
| `404` | Not Found | Assignment doesn't exist or user lacks access |
| `409` | Conflict | Concurrent modification - refresh and retry |
| `500` | Server Error | Contact support with correlation_id |

## Best Practices

1. **Monitor SLA status proactively** - Set up alerts at 75% elapsed threshold
2. **Use checklist templates** for common assignment types to ensure consistency
3. **Add observers** for cross-functional assignments requiring multiple perspectives
4. **Escalate early** when blockers arise - don't wait until SLA breach
5. **Provide completion notes** for knowledge transfer and audit trail
6. **Use auto-assignment** for balanced workload distribution
7. **Track related assignments** to understand dependencies
8. **Leverage comments with mentions** for async collaboration
9. **Update workflow stages** to provide visibility on progress
10. **Review assignment queue regularly** (managers) to identify bottlenecks
