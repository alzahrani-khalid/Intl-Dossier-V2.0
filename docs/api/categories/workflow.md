# Workflow & Automation API

## Overview

The Workflow & Automation API provides background job processing, SLA monitoring, queue management, and rule-based workflow automation. These endpoints enable automated escalations, deadline tracking, and intelligent task routing.

## Endpoints

### Queue Processor

Process pending jobs from various work queues with priority-based execution.

**Endpoint:** `POST /queue-processor`

**Request Body:**
```json
{
  "queue_name": "assignments",
  "batch_size": 10,
  "priority_threshold": "high"
}
```

**Parameters:**
- `queue_name` (required): Queue to process (`assignments`, `notifications`, `intake`, `commitments`)
- `batch_size` (optional): Number of jobs to process (default: 10, max: 100)
- `priority_threshold` (optional): Minimum priority (`low`, `medium`, `high`, `urgent`)

**Response (200 OK):**
```json
{
  "queue_name": "assignments",
  "processed": 8,
  "failed": 2,
  "skipped": 0,
  "execution_time_ms": 4523,
  "results": [
    {
      "job_id": "job-550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "execution_time_ms": 342
    },
    {
      "job_id": "job-660e8400-e29b-41d4-a716-446655440001",
      "status": "failed",
      "error": "Assignment not found",
      "execution_time_ms": 125
    }
  ],
  "next_batch_available": true,
  "processed_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid queue_name or batch_size
- `401 Unauthorized` - Missing authorization (admin only)
- `500 Internal Server Error` - Queue processing failed

**Implementation Example:**
```typescript
const processQueue = async (
  queueName: string,
  batchSize: number = 10
) => {
  const response = await fetch('/queue-processor', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      queue_name: queueName,
      batch_size: batchSize,
      priority_threshold: 'medium'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Queue processing failed');
  }

  const result = await response.json();

  // Process next batch if available
  if (result.next_batch_available) {
    console.log(`${result.processed} jobs completed, processing next batch...`);
    // Schedule next batch processing
  }

  return result;
};
```

**Notes:**
- Queue processor runs as a background worker
- Failed jobs are retried up to 3 times with exponential backoff
- Jobs older than 7 days are automatically archived
- Priority order: `urgent` > `high` > `medium` > `low`

**Supported Queues:**
- `assignments`: Task auto-assignment and routing
- `notifications`: Push notifications and emails
- `intake`: Ticket classification and triage
- `commitments`: Deadline tracking and reminders
- `sla`: SLA breach detection and escalation

---

### SLA Monitoring

Monitor and track SLA compliance for intake tickets, assignments, and commitments.

**Endpoint:** `POST /sla-monitoring`

**Request Body:**
```json
{
  "resource_type": "intake_ticket",
  "check_overdue": true,
  "send_alerts": true,
  "organization_id": "org-id"
}
```

**Parameters:**
- `resource_type` (required): Type to monitor (`intake_ticket`, `assignment`, `commitment`)
- `check_overdue` (optional): Check for overdue items (default: `true`)
- `send_alerts` (optional): Send alert notifications (default: `true`)
- `organization_id` (optional): Filter by organization

**Response (200 OK):**
```json
{
  "resource_type": "intake_ticket",
  "total_monitored": 127,
  "within_sla": 98,
  "at_risk": 18,
  "overdue": 11,
  "sla_compliance_rate": 0.77,
  "breaches": [
    {
      "resource_id": "ticket-550e8400-e29b-41d4-a716-446655440000",
      "title": "Urgent visa request",
      "sla_deadline": "2024-01-15T09:00:00Z",
      "current_time": "2024-01-15T10:30:00Z",
      "overdue_hours": 1.5,
      "priority": "urgent",
      "assigned_to": "user-id",
      "alert_sent": true
    }
  ],
  "at_risk_items": [
    {
      "resource_id": "ticket-660e8400-e29b-41d4-a716-446655440001",
      "title": "Document translation request",
      "sla_deadline": "2024-01-15T14:00:00Z",
      "time_remaining_hours": 3.5,
      "priority": "high",
      "assigned_to": "user-id"
    }
  ],
  "alerts_sent": 11,
  "monitored_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid resource_type
- `401 Unauthorized` - Missing authorization
- `500 Internal Server Error` - Monitoring check failed

**Implementation Example:**
```typescript
const monitorSLA = async (resourceType: string, orgId?: string) => {
  const response = await fetch('/sla-monitoring', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      resource_type: resourceType,
      check_overdue: true,
      send_alerts: true,
      organization_id: orgId
    })
  });

  if (!response.ok) {
    throw new Error('SLA monitoring failed');
  }

  const result = await response.json();

  // Display SLA dashboard
  console.log(`SLA Compliance: ${(result.sla_compliance_rate * 100).toFixed(1)}%`);
  console.log(`At Risk: ${result.at_risk}`);
  console.log(`Overdue: ${result.overdue}`);

  return result;
};
```

**SLA Calculation:**
- **Intake Tickets**: Based on priority and ticket type
  - `urgent`: 4 hours
  - `high`: 24 hours
  - `medium`: 3 business days
  - `low`: 7 business days
- **Assignments**: Based on deadline field
- **Commitments**: Based on target_date field

**Alert Thresholds:**
- At-risk: 80% of SLA time elapsed
- Overdue: Past SLA deadline

---

### Waiting Queue Escalation

Automatically escalate items that have been in waiting queue too long.

**Endpoint:** `POST /waiting-queue-escalation`

**Request Body:**
```json
{
  "queue_type": "intake",
  "escalation_threshold_hours": 24,
  "dry_run": false
}
```

**Parameters:**
- `queue_type` (required): Queue type (`intake`, `assignments`, `approvals`)
- `escalation_threshold_hours` (required): Hours before escalation (default: 24)
- `dry_run` (optional): Preview without executing (default: `false`)

**Response (200 OK):**
```json
{
  "queue_type": "intake",
  "items_checked": 45,
  "items_escalated": 7,
  "escalations": [
    {
      "item_id": "ticket-550e8400-e29b-41d4-a716-446655440000",
      "title": "Urgent document request",
      "waiting_since": "2024-01-14T10:30:00Z",
      "waiting_hours": 24,
      "previous_assignee": "user-id-1",
      "escalated_to": "manager-id-1",
      "escalation_reason": "Waiting queue threshold exceeded",
      "notification_sent": true
    }
  ],
  "dry_run": false,
  "escalated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid queue_type or threshold
- `401 Unauthorized` - Missing authorization
- `500 Internal Server Error` - Escalation failed

**Implementation Example:**
```typescript
const escalateWaitingQueue = async (
  queueType: string,
  thresholdHours: number = 24
) => {
  // First, dry run to preview escalations
  const dryRunResponse = await fetch('/waiting-queue-escalation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      queue_type: queueType,
      escalation_threshold_hours: thresholdHours,
      dry_run: true
    })
  });

  const preview = await dryRunResponse.json();
  console.log(`${preview.items_escalated} items ready for escalation`);

  // Execute escalation
  const response = await fetch('/waiting-queue-escalation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      queue_type: queueType,
      escalation_threshold_hours: thresholdHours,
      dry_run: false
    })
  });

  return await response.json();
};
```

**Escalation Rules:**
- Items escalated to direct manager of current assignee
- If manager unavailable, escalate to department head
- Notifications sent to both previous and new assignee
- Escalation logged in audit trail

---

### Waiting Queue Filters

Apply intelligent filters to waiting queue items for prioritization.

**Endpoint:** `GET /waiting-queue-filters`

**Query Parameters:**
- `queue_type` (required): Queue type (`intake`, `assignments`, `approvals`)
- `priority` (optional): Filter by priority
- `waiting_hours_min` (optional): Minimum waiting hours
- `waiting_hours_max` (optional): Maximum waiting hours
- `organization_id` (optional): Filter by organization
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "queue_type": "intake",
  "data": [
    {
      "item_id": "ticket-550e8400-e29b-41d4-a716-446655440000",
      "title": "Urgent visa request",
      "priority": "urgent",
      "waiting_since": "2024-01-15T09:00:00Z",
      "waiting_hours": 1.5,
      "assigned_to": "user-id",
      "sla_deadline": "2024-01-15T13:00:00Z",
      "sla_status": "at_risk"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0,
  "filters_applied": {
    "priority": null,
    "waiting_hours_min": null,
    "waiting_hours_max": null
  }
}
```

**Implementation Example:**
```typescript
const getWaitingQueueItems = async (
  queueType: string,
  filters: { priority?: string; minHours?: number }
) => {
  const params = new URLSearchParams({
    queue_type: queueType,
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.minHours && { waiting_hours_min: filters.minHours.toString() })
  });

  const response = await fetch(`/waiting-queue-filters?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return await response.json();
};
```

---

### Waiting Queue Reminder

Send reminders to assignees for items in waiting queue.

**Endpoint:** `POST /waiting-queue-reminder`

**Request Body:**
```json
{
  "queue_type": "intake",
  "reminder_threshold_hours": 12,
  "include_manager": true
}
```

**Response (200 OK):**
```json
{
  "queue_type": "intake",
  "reminders_sent": 15,
  "recipients": [
    {
      "user_id": "user-id",
      "items_count": 5,
      "notification_sent": true
    }
  ]
}
```

---

### Workflow Executor

Execute predefined workflow rules based on triggers.

**Endpoint:** `POST /workflow-executor`

**Request Body:**
```json
{
  "workflow_id": "workflow-550e8400-e29b-41d4-a716-446655440000",
  "trigger_type": "manual",
  "context": {
    "resource_type": "intake_ticket",
    "resource_id": "ticket-id"
  }
}
```

**Parameters:**
- `workflow_id` (required): UUID of workflow to execute
- `trigger_type` (required): Trigger type (`manual`, `scheduled`, `event`)
- `context` (required): Workflow execution context

**Response (200 OK):**
```json
{
  "workflow_id": "workflow-550e8400-e29b-41d4-a716-446655440000",
  "execution_id": "exec-660e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "steps_executed": 5,
  "steps_failed": 0,
  "results": [
    {
      "step_id": "step-1",
      "step_name": "Check ticket priority",
      "status": "completed",
      "output": { "priority": "high" }
    },
    {
      "step_id": "step-2",
      "step_name": "Auto-assign to specialist",
      "status": "completed",
      "output": { "assigned_to": "user-id" }
    },
    {
      "step_id": "step-3",
      "step_name": "Send notification",
      "status": "completed",
      "output": { "notification_sent": true }
    }
  ],
  "execution_time_ms": 1234,
  "executed_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid workflow_id or context
- `401 Unauthorized` - Missing authorization
- `404 Not Found` - Workflow not found
- `500 Internal Server Error` - Workflow execution failed

**Implementation Example:**
```typescript
const executeWorkflow = async (
  workflowId: string,
  resourceType: string,
  resourceId: string
) => {
  const response = await fetch('/workflow-executor', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      trigger_type: 'manual',
      context: {
        resource_type: resourceType,
        resource_id: resourceId
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Workflow execution failed');
  }

  const result = await response.json();

  // Check execution status
  if (result.status === 'failed') {
    console.error('Workflow failed:', result.error);
  } else {
    console.log(`Workflow completed: ${result.steps_executed} steps`);
  }

  return result;
};
```

**Workflow Step Types:**
- **Condition**: Evaluate boolean condition
- **Assignment**: Auto-assign task to user or team
- **Notification**: Send email or push notification
- **API Call**: Make HTTP request to external service
- **Data Transform**: Transform data using rules
- **Delay**: Wait for specified duration
- **Escalation**: Escalate to manager or team

**Workflow Triggers:**
- **Manual**: Triggered by user action
- **Scheduled**: Cron-based scheduling (e.g., daily at 9 AM)
- **Event**: Triggered by system event (e.g., ticket created, SLA breach)

---

### Workflow Rules

Manage workflow automation rules.

**Endpoint (List):** `GET /workflow-rules`

**Query Parameters:**
- `active` (optional): Filter by active status (`true` or `false`)
- `trigger_type` (optional): Filter by trigger type
- `resource_type` (optional): Filter by resource type
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "rule-550e8400-e29b-41d4-a716-446655440000",
      "name": "Auto-assign urgent intake tickets",
      "description": "Automatically assign urgent intake tickets to on-call specialist",
      "trigger_type": "event",
      "trigger_event": "intake_ticket.created",
      "conditions": [
        {
          "field": "priority",
          "operator": "equals",
          "value": "urgent"
        }
      ],
      "actions": [
        {
          "type": "auto_assign",
          "parameters": {
            "team": "intake_specialists",
            "strategy": "on_call"
          }
        },
        {
          "type": "notification",
          "parameters": {
            "template": "urgent_ticket_assigned",
            "recipients": ["assignee", "manager"]
          }
        }
      ],
      "active": true,
      "execution_count": 127,
      "success_rate": 0.95,
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 23,
  "limit": 20,
  "offset": 0
}
```

**Endpoint (Create):** `POST /workflow-rules`

**Request Body:**
```json
{
  "name": "Escalate overdue assignments",
  "description": "Escalate assignments that are overdue by 24 hours",
  "trigger_type": "scheduled",
  "schedule": "0 9 * * *",
  "conditions": [
    {
      "field": "deadline",
      "operator": "before",
      "value": "now-24h"
    },
    {
      "field": "status",
      "operator": "not_in",
      "value": ["completed", "cancelled"]
    }
  ],
  "actions": [
    {
      "type": "escalate",
      "parameters": {
        "escalate_to": "manager",
        "notification": true
      }
    }
  ],
  "active": true
}
```

**Response (201 Created):**
```json
{
  "id": "rule-660e8400-e29b-41d4-a716-446655440001",
  "name": "Escalate overdue assignments",
  "active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Endpoint (Update):** `PUT /workflow-rules/:id`

**Endpoint (Delete):** `DELETE /workflow-rules/:id`

**Implementation Example:**
```typescript
const createWorkflowRule = async (ruleData: WorkflowRuleData) => {
  const response = await fetch('/workflow-rules', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ruleData)
  });

  if (!response.ok) {
    throw new Error('Failed to create workflow rule');
  }

  return await response.json();
};

// Example: Create auto-assignment rule
const createAutoAssignRule = async () => {
  return await createWorkflowRule({
    name: 'Auto-assign new intake tickets',
    trigger_type: 'event',
    trigger_event: 'intake_ticket.created',
    conditions: [
      {
        field: 'category',
        operator: 'equals',
        value: 'visa_request'
      }
    ],
    actions: [
      {
        type: 'auto_assign',
        parameters: {
          team: 'visa_team',
          strategy: 'round_robin'
        }
      }
    ],
    active: true
  });
};
```

**Supported Operators:**
- `equals`: Exact match
- `not_equals`: Not equal
- `in`: Value in list
- `not_in`: Value not in list
- `before`: Date before value
- `after`: Date after value
- `contains`: String contains substring
- `greater_than`: Numeric comparison
- `less_than`: Numeric comparison

**Assignment Strategies:**
- `round_robin`: Distribute evenly across team
- `on_call`: Assign to current on-call user
- `least_loaded`: Assign to user with fewest active items
- `skill_match`: Match based on user skills/expertise

---

## Common Features

### Authentication

All workflow endpoints require JWT authentication:

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Admin Access

Some endpoints require admin privileges:
- `/queue-processor`
- `/sla-monitoring` (organization-wide)
- `/workflow-rules` (create, update, delete)

### Background Execution

Workflow processes run in the background:
- Queue processor: Every 5 minutes
- SLA monitoring: Every 15 minutes
- Waiting queue escalation: Every hour
- Scheduled workflows: Per cron schedule

### Error Handling

Standard error response format:

```json
{
  "error": "Error message",
  "error_ar": "رسالة الخطأ",
  "details": {
    "field": "context"
  }
}
```

---

## Related APIs

- [Assignments API](./assignments.md) - Task management
- [Intake API](./intake.md) - Service request management
- [Notifications API](./notifications.md) - Alert delivery
- [AI Services API](./ai-services.md) - Intelligent automation
