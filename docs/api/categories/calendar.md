# Calendar & Scheduling API

## Overview

The Calendar & Scheduling API provides comprehensive calendar management for diplomatic engagements, meetings, deadlines, and staff availability tracking. It supports recurring events, conflict detection, timezone handling, and synchronization with external calendar systems.

**Key Features:**
- Calendar event CRUD operations with bilingual support
- Conflict detection and resolution
- Recurring event patterns (daily, weekly, monthly, yearly)
- Staff availability tracking
- Multi-calendar support (personal, team, organizational)
- External calendar sync (Google Calendar, Outlook)
- Event reminders and notifications
- Timezone-aware scheduling

## Endpoints

### Create Calendar Event

Create a new calendar event with participant invitations and reminders.

**Endpoint:** `POST /calendar-create`

**Request Body:**
```json
{
  "title": "G20 Climate Summit Preparation Meeting",
  "title_ar": "اجتماع التحضير لقمة مجموعة العشرين للمناخ",
  "description": "Preparation session for G20 summit",
  "description_ar": "جلسة تحضيرية لقمة مجموعة العشرين",
  "event_type": "meeting",
  "start_time": "2024-02-15T10:00:00Z",
  "end_time": "2024-02-15T12:00:00Z",
  "timezone": "Asia/Riyadh",
  "location": "Conference Room A",
  "location_ar": "قاعة المؤتمرات أ",
  "is_all_day": false,
  "participants": [
    {
      "user_id": "user-123",
      "role": "required",
      "response_status": "pending"
    },
    {
      "user_id": "user-456",
      "role": "optional",
      "response_status": "pending"
    }
  ],
  "reminders": [
    {
      "minutes_before": 30,
      "method": "email"
    },
    {
      "minutes_before": 15,
      "method": "notification"
    }
  ],
  "linked_entities": [
    {
      "entity_type": "engagement",
      "entity_id": "eng-789"
    }
  ],
  "visibility": "public",
  "color": "#4285F4"
}
```

**Response (201 Created):**
```json
{
  "id": "cal-550e8400-e29b-41d4-a716-446655440000",
  "title": "G20 Climate Summit Preparation Meeting",
  "title_ar": "اجتماع التحضير لقمة مجموعة العشرين للمناخ",
  "event_type": "meeting",
  "start_time": "2024-02-15T10:00:00Z",
  "end_time": "2024-02-15T12:00:00Z",
  "timezone": "Asia/Riyadh",
  "status": "scheduled",
  "organizer_id": "user-id",
  "participants": [
    {
      "user_id": "user-123",
      "role": "required",
      "response_status": "pending"
    }
  ],
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid time range
- `401 Unauthorized` - Missing or invalid authorization header
- `409 Conflict` - Time slot conflicts with existing event
- `500 Internal Server Error` - Failed to create event

**Implementation Example:**
```typescript
const createCalendarEvent = async (eventData: CreateEventRequest) => {
  const response = await fetch('/calendar-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: eventData.title,
      title_ar: eventData.titleAr,
      event_type: eventData.type,
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      timezone: eventData.timezone || 'Asia/Riyadh',
      participants: eventData.participants,
      reminders: eventData.reminders
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Event invitations are automatically sent to participants
- Organizer is set from authenticated user JWT
- Conflicts are checked before creation (use `/calendar-conflicts` to pre-check)
- Supports linking to engagements, positions, and dossiers

---

### Get Calendar Event

Retrieve a single calendar event by ID with participant details.

**Endpoint:** `GET /calendar-get?event_id={id}`

**Query Parameters:**
- `event_id` (required): UUID of the calendar event
- `include_participants` (optional): Include participant details (default: true)
- `include_recurrence` (optional): Include recurrence pattern (default: true)

**Response (200 OK):**
```json
{
  "id": "cal-550e8400-e29b-41d4-a716-446655440000",
  "title": "G20 Climate Summit Preparation Meeting",
  "title_ar": "اجتماع التحضير لقمة مجموعة العشرين للمناخ",
  "description": "Preparation session for G20 summit",
  "event_type": "meeting",
  "start_time": "2024-02-15T10:00:00Z",
  "end_time": "2024-02-15T12:00:00Z",
  "timezone": "Asia/Riyadh",
  "location": "Conference Room A",
  "status": "scheduled",
  "organizer_id": "user-id",
  "participants": [
    {
      "user_id": "user-123",
      "name": "Ahmed Al-Rashid",
      "role": "required",
      "response_status": "accepted",
      "responded_at": "2024-01-20T11:00:00Z"
    },
    {
      "user_id": "user-456",
      "name": "Sara Al-Mutairi",
      "role": "optional",
      "response_status": "tentative"
    }
  ],
  "reminders": [
    {
      "minutes_before": 30,
      "method": "email"
    }
  ],
  "linked_entities": [
    {
      "entity_type": "engagement",
      "entity_id": "eng-789",
      "title": "G20 Climate Summit"
    }
  ],
  "recurrence": null,
  "visibility": "public",
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing event_id parameter
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - User lacks permission to view this event
- `404 Not Found` - Event not found

**Access Control:**
- **Public events**: Visible to all organization members
- **Private events**: Only organizer and participants can view
- **Confidential events**: Only organizer can view participant list

**Implementation Example:**
```typescript
const getCalendarEvent = async (eventId: string) => {
  const params = new URLSearchParams({
    event_id: eventId,
    include_participants: 'true'
  });

  const response = await fetch(`/calendar-get?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    throw new Error('Calendar event not found or access denied');
  }

  return await response.json();
};
```

---

### Update Calendar Event

Update an existing calendar event with optional participant notification.

**Endpoint:** `PUT /calendar-update`

**Request Body:**
```json
{
  "event_id": "cal-550e8400-e29b-41d4-a716-446655440000",
  "title": "G20 Climate Summit Preparation (Updated)",
  "start_time": "2024-02-15T11:00:00Z",
  "end_time": "2024-02-15T13:00:00Z",
  "notify_participants": true,
  "update_message": "Meeting time changed to accommodate international participants",
  "update_message_ar": "تم تغيير وقت الاجتماع لاستيعاب المشاركين الدوليين"
}
```

**Response (200 OK):**
```json
{
  "id": "cal-550e8400-e29b-41d4-a716-446655440000",
  "title": "G20 Climate Summit Preparation (Updated)",
  "start_time": "2024-02-15T11:00:00Z",
  "end_time": "2024-02-15T13:00:00Z",
  "updated_at": "2024-01-20T14:00:00Z",
  "participants_notified": true,
  "conflicts": []
}
```

**Error Responses:**
- `400 Bad Request` - Invalid update data
- `401 Unauthorized` - Missing authorization header
- `403 Forbidden` - Only organizer can update event
- `404 Not Found` - Event not found
- `409 Conflict` - Updated time conflicts with other events

**Implementation Example:**
```typescript
const updateCalendarEvent = async (
  eventId: string,
  updates: Partial<CalendarEvent>,
  notifyParticipants = true
) => {
  const response = await fetch('/calendar-update', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_id: eventId,
      ...updates,
      notify_participants: notifyParticipants
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_ar || error.error);
  }

  return await response.json();
};
```

**Notes:**
- Participants receive update notifications if `notify_participants` is true
- Update conflicts are checked before applying changes
- Recurrence instances can be updated individually or as a series

---

### Calendar Conflicts

Check for scheduling conflicts before creating or updating events.

**Endpoint:** `GET /calendar-conflicts?user_id={id}&start_time={start}&end_time={end}`

**Query Parameters:**
- `user_id` (required): User ID to check conflicts for
- `start_time` (required): Proposed event start time (ISO 8601)
- `end_time` (required): Proposed event end time (ISO 8601)
- `exclude_event_id` (optional): Exclude specific event from conflict check (for updates)
- `include_tentative` (optional): Include tentatively accepted events (default: true)

**Response (200 OK - No Conflicts):**
```json
{
  "has_conflicts": false,
  "conflicts": [],
  "suggested_times": []
}
```

**Response (200 OK - Conflicts Found):**
```json
{
  "has_conflicts": true,
  "conflicts": [
    {
      "event_id": "cal-123",
      "title": "Budget Review Meeting",
      "title_ar": "اجتماع مراجعة الميزانية",
      "start_time": "2024-02-15T10:00:00Z",
      "end_time": "2024-02-15T11:30:00Z",
      "overlap_minutes": 30,
      "severity": "hard_conflict"
    }
  ],
  "suggested_times": [
    {
      "start_time": "2024-02-15T13:00:00Z",
      "end_time": "2024-02-15T15:00:00Z",
      "confidence": 0.95
    },
    {
      "start_time": "2024-02-15T15:30:00Z",
      "end_time": "2024-02-15T17:30:00Z",
      "confidence": 0.87
    }
  ]
}
```

**Conflict Severity:**
- `hard_conflict` - Direct time overlap with confirmed event
- `soft_conflict` - Overlap with tentative event
- `adjacent` - Event immediately before/after (no buffer time)
- `travel_time_conflict` - Insufficient travel time between locations

**Implementation Example:**
```typescript
const checkCalendarConflicts = async (
  userId: string,
  startTime: string,
  endTime: string
) => {
  const params = new URLSearchParams({
    user_id: userId,
    start_time: startTime,
    end_time: endTime
  });

  const response = await fetch(`/calendar-conflicts?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// Pre-check before creating event
const createEventWithConflictCheck = async (eventData: CreateEventRequest) => {
  const conflicts = await checkCalendarConflicts(
    eventData.organizerId,
    eventData.startTime,
    eventData.endTime
  );

  if (conflicts.has_conflicts) {
    throw new Error(`Scheduling conflict: ${conflicts.conflicts[0].title}`);
  }

  return await createCalendarEvent(eventData);
};
```

---

### Calendar Sync

Synchronize calendar events with external calendar systems (Google Calendar, Outlook).

**Endpoint:** `POST /calendar-sync`

**Request Body:**
```json
{
  "provider": "google",
  "action": "import",
  "calendar_id": "primary",
  "date_range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "sync_options": {
    "bidirectional": true,
    "conflict_resolution": "manual",
    "sync_deletions": false
  }
}
```

**Response (202 Accepted):**
```json
{
  "sync_job_id": "sync-550e8400-e29b-41d4-a716-446655440000",
  "provider": "google",
  "status": "in_progress",
  "started_at": "2024-01-20T10:30:00Z",
  "estimated_completion": "2024-01-20T10:32:00Z"
}
```

**Check Sync Status - GET Request:**

**Endpoint:** `GET /calendar-sync?sync_job_id={id}`

**Response (200 OK):**
```json
{
  "sync_job_id": "sync-550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "statistics": {
    "events_imported": 45,
    "events_exported": 12,
    "conflicts_detected": 2,
    "errors": 0
  },
  "conflicts": [
    {
      "local_event_id": "cal-123",
      "external_event_id": "ext-456",
      "conflict_type": "time_mismatch",
      "resolution_required": true
    }
  ],
  "completed_at": "2024-01-20T10:31:45Z"
}
```

**Supported Providers:**
- `google` - Google Calendar
- `microsoft` - Microsoft Outlook/Office 365
- `apple` - Apple iCloud Calendar
- `caldav` - CalDAV-compatible calendars

**Implementation Example:**
```typescript
const syncCalendar = async (provider: string, action: 'import' | 'export') => {
  const response = await fetch('/calendar-sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider,
      action,
      calendar_id: 'primary',
      sync_options: {
        bidirectional: true,
        conflict_resolution: 'manual'
      }
    })
  });

  const { sync_job_id } = await response.json();

  // Poll for completion
  return await pollSyncStatus(sync_job_id);
};

const pollSyncStatus = async (jobId: string) => {
  const params = new URLSearchParams({ sync_job_id: jobId });

  while (true) {
    const response = await fetch(`/calendar-sync?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const status = await response.json();

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};
```

---

### Events List

Retrieve calendar events with filtering, pagination, and date range queries.

**Endpoint:** `GET /events`

**Query Parameters:**
- `start_date` (optional): Filter events from this date (ISO 8601)
- `end_date` (optional): Filter events until this date (ISO 8601)
- `user_id` (optional): Filter by participant user ID
- `event_type` (optional): Filter by type (meeting, deadline, engagement, personal)
- `status` (optional): Filter by status (scheduled, cancelled, completed)
- `calendar_ids` (optional): Comma-separated calendar IDs
- `include_recurrence` (optional): Expand recurring events (default: true)
- `limit` (optional): Page size (default: 50, max: 200)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "cal-123",
      "title": "G20 Summit Prep",
      "title_ar": "التحضير لقمة مجموعة العشرين",
      "event_type": "meeting",
      "start_time": "2024-02-15T10:00:00Z",
      "end_time": "2024-02-15T12:00:00Z",
      "timezone": "Asia/Riyadh",
      "status": "scheduled",
      "organizer": {
        "user_id": "user-123",
        "name": "Ahmed Al-Rashid"
      },
      "participant_count": 8,
      "is_recurring": false
    }
  ],
  "total": 42,
  "date_range": {
    "start": "2024-02-01T00:00:00Z",
    "end": "2024-02-29T23:59:59Z"
  },
  "limit": 50,
  "offset": 0,
  "has_more": false
}
```

**Implementation Example:**
```typescript
const getCalendarEvents = async (
  startDate: string,
  endDate: string,
  filters?: {
    eventType?: string;
    status?: string;
  }
) => {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: '50'
  });

  if (filters?.eventType) params.append('event_type', filters.eventType);
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(`/events?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

---

### Recurring Events

Manage recurring event patterns and series.

**Endpoint (GET):** `GET /recurring-events?event_id={id}`
**Endpoint (POST):** `POST /recurring-events`
**Endpoint (PUT):** `PUT /recurring-events`

**Create Recurring Event - POST Request:**

**Request Body:**
```json
{
  "title": "Weekly Team Standup",
  "title_ar": "اجتماع الفريق الأسبوعي",
  "event_type": "meeting",
  "start_time": "2024-02-01T09:00:00Z",
  "end_time": "2024-02-01T09:30:00Z",
  "timezone": "Asia/Riyadh",
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "days_of_week": ["monday", "wednesday", "friday"],
    "end_type": "after",
    "occurrences": 20
  }
}
```

**Response (201 Created):**
```json
{
  "series_id": "series-550e8400-e29b-41d4-a716-446655440000",
  "master_event_id": "cal-123",
  "title": "Weekly Team Standup",
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "days_of_week": ["monday", "wednesday", "friday"],
    "occurrences": 20
  },
  "instances_created": 20,
  "first_instance": "2024-02-01T09:00:00Z",
  "last_instance": "2024-03-29T09:00:00Z"
}
```

**Recurrence Patterns:**
- **Frequency**: `daily`, `weekly`, `monthly`, `yearly`
- **End Types**: `never`, `on_date`, `after` (occurrences)
- **Advanced**: First/last day of month, specific weekdays

**Get Recurring Series - GET Request:**

**Query Parameters:**
- `event_id` (required): Master event ID or any instance ID
- `expand_instances` (optional): Include all instances (default: false)

**Response (200 OK):**
```json
{
  "series_id": "series-123",
  "master_event": {
    "id": "cal-123",
    "title": "Weekly Team Standup",
    "recurrence": {
      "frequency": "weekly",
      "interval": 1,
      "days_of_week": ["monday", "wednesday", "friday"]
    }
  },
  "instances": [
    {
      "instance_id": "cal-123-1",
      "start_time": "2024-02-05T09:00:00Z",
      "status": "scheduled"
    },
    {
      "instance_id": "cal-123-2",
      "start_time": "2024-02-07T09:00:00Z",
      "status": "cancelled"
    }
  ],
  "total_instances": 20,
  "completed_instances": 5,
  "upcoming_instances": 15
}
```

**Update Recurring Series - PUT Request:**

**Request Body:**
```json
{
  "series_id": "series-123",
  "update_scope": "this_and_future",
  "start_time": "2024-02-10T10:00:00Z",
  "end_time": "2024-02-10T10:30:00Z"
}
```

**Update Scopes:**
- `this_only` - Update single instance
- `this_and_future` - Update from this instance onwards
- `all` - Update entire series

**Implementation Example:**
```typescript
const createRecurringEvent = async (eventData: RecurringEventRequest) => {
  const response = await fetch('/recurring-events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });

  return await response.json();
};
```

---

### Staff Availability

Track and query staff availability for scheduling.

**Endpoint:** `GET /staff-availability?user_ids={ids}&start_date={start}&end_date={end}`

**Query Parameters:**
- `user_ids` (required): Comma-separated user IDs
- `start_date` (required): Query start date (ISO 8601)
- `end_date` (required): Query end date (ISO 8601)
- `working_hours_only` (optional): Limit to business hours (default: true)
- `timezone` (optional): Timezone for results (default: Asia/Riyadh)

**Response (200 OK):**
```json
{
  "date_range": {
    "start": "2024-02-15T00:00:00Z",
    "end": "2024-02-15T23:59:59Z"
  },
  "users": [
    {
      "user_id": "user-123",
      "name": "Ahmed Al-Rashid",
      "availability": [
        {
          "start_time": "2024-02-15T08:00:00Z",
          "end_time": "2024-02-15T10:00:00Z",
          "status": "available"
        },
        {
          "start_time": "2024-02-15T10:00:00Z",
          "end_time": "2024-02-15T12:00:00Z",
          "status": "busy",
          "event_id": "cal-456",
          "event_title": "Budget Meeting"
        },
        {
          "start_time": "2024-02-15T12:00:00Z",
          "end_time": "2024-02-15T13:00:00Z",
          "status": "tentative",
          "event_id": "cal-789"
        }
      ],
      "working_hours": {
        "start": "08:00",
        "end": "17:00"
      }
    }
  ],
  "common_free_slots": [
    {
      "start_time": "2024-02-15T13:00:00Z",
      "end_time": "2024-02-15T15:00:00Z",
      "duration_minutes": 120,
      "all_available": true
    }
  ]
}
```

**Availability Status:**
- `available` - No scheduled events
- `busy` - Confirmed event
- `tentative` - Tentatively accepted event
- `out_of_office` - Away/unavailable

**Implementation Example:**
```typescript
const getStaffAvailability = async (
  userIds: string[],
  startDate: string,
  endDate: string
) => {
  const params = new URLSearchParams({
    user_ids: userIds.join(','),
    start_date: startDate,
    end_date: endDate,
    working_hours_only: 'true'
  });

  const response = await fetch(`/staff-availability?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// Find best meeting time
const findBestMeetingTime = async (
  userIds: string[],
  duration: number,
  dateRange: { start: string; end: string }
) => {
  const availability = await getStaffAvailability(
    userIds,
    dateRange.start,
    dateRange.end
  );

  return availability.common_free_slots.filter(
    slot => slot.duration_minutes >= duration
  )[0];
};
```

---

## Related APIs

- **Engagements API** - Link calendar events to diplomatic engagements
- **Notifications API** - Event reminders and updates
- **Staff Availability API** - Detailed availability tracking
- **Unified Work API** - Calendar integration with tasks and commitments

## Performance Considerations

- **Event queries**: Indexed by date range for <100ms response
- **Conflict detection**: <50ms for up to 100 events
- **Recurring expansion**: Limited to 1000 instances per series
- **Sync operations**: Async jobs with polling (typical: 1-3 minutes)

## Security & Access Control

All calendar operations enforce access control:
- **Public events**: Visible to all organization members
- **Private events**: Only organizer and participants
- **Confidential events**: Organizer only (participants see "Busy")
- **Calendar sharing**: Explicit permission grants required
