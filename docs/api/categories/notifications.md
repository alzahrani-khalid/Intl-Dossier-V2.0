# Notifications & Messaging API

## Overview

The Notifications & Messaging API provides multi-channel notification delivery including push notifications, email, and in-app notifications. Supports bilingual content (English/Arabic), notification preferences, digest subscriptions, and device management for mobile apps.

## Endpoints

### Send Push Notification

Send push notification to specific users or broadcast to groups.

**Endpoint:** `POST /push-notification-send`

**Request Body:**
```json
{
  "recipient_type": "user",
  "recipient_ids": ["user-550e8400-e29b-41d4-a716-446655440000"],
  "title_en": "New Assignment",
  "title_ar": "مهمة جديدة",
  "body_en": "You have been assigned a new task",
  "body_ar": "تم تعيين مهمة جديدة لك",
  "priority": "high",
  "data": {
    "assignment_id": "assign-id",
    "deep_link": "/assignments/assign-id"
  },
  "action_buttons": [
    {
      "label_en": "View Task",
      "label_ar": "عرض المهمة",
      "action": "open_assignment",
      "data": { "assignment_id": "assign-id" }
    }
  ]
}
```

**Parameters:**
- `recipient_type` (required): Type (`'user'`, `'group'`, `'organization'`, `'broadcast'`)
- `recipient_ids` (required): Array of recipient UUIDs (not needed for broadcast)
- `title_en` (required): English notification title
- `title_ar` (required): Arabic notification title
- `body_en` (required): English notification body
- `body_ar` (required): Arabic notification body
- `priority` (optional): Priority (`'low'`, `'medium'`, `'high'`, `'urgent'`, default: `'medium'`)
- `data` (optional): Custom payload data
- `action_buttons` (optional): Action buttons (max 3)
- `badge_count` (optional): Badge count to display
- `sound` (optional): Notification sound (`'default'`, `'alert'`, `'none'`)
- `ttl` (optional): Time to live in seconds (default: 86400 = 24 hours)

**Response (200 OK):**
```json
{
  "notification_id": "notif-550e8400-e29b-41d4-a716-446655440000",
  "recipients_count": 1,
  "delivery_status": {
    "queued": 1,
    "sent": 0,
    "failed": 0
  },
  "estimated_delivery_time": "2024-01-15T10:30:30Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid recipient_type
- `401 Unauthorized` - Missing authorization
- `403 Forbidden` - Insufficient permissions to send notifications
- `429 Too Many Requests` - Rate limit exceeded (max 100 notifications/minute)

**Implementation Example:**
```typescript
const sendPushNotification = async (
  recipientIds: string[],
  title: { en: string; ar: string },
  body: { en: string; ar: string },
  data?: any
) => {
  const response = await fetch('/push-notification-send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient_type: 'user',
      recipient_ids: recipientIds,
      title_en: title.en,
      title_ar: title.ar,
      body_en: body.en,
      body_ar: body.ar,
      priority: 'high',
      data: data,
      action_buttons: [
        {
          label_en: 'View',
          label_ar: 'عرض',
          action: 'open_detail',
          data: data
        }
      ]
    })
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new Error(`Rate limit exceeded. Retry after ${retryAfter}s`);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send notification');
  }

  return await response.json();
};
```

**Notes:**
- Notifications are delivered via Expo Push Notification Service
- Users must have registered devices (see `/push-device-register`)
- Bilingual content automatically displayed based on device language
- Failed deliveries retried up to 3 times with exponential backoff
- Rate limit: 100 notifications/minute per user

---

### Register Push Device

Register a mobile device for push notifications.

**Endpoint:** `POST /push-device-register`

**Request Body:**
```json
{
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_type": "ios",
  "device_name": "iPhone 14 Pro",
  "app_version": "2.1.0",
  "notification_preferences": {
    "assignments": true,
    "intake_tickets": true,
    "commitments": true,
    "mentions": true,
    "quiet_hours": {
      "enabled": true,
      "start": "22:00",
      "end": "07:00",
      "timezone": "Asia/Riyadh"
    }
  }
}
```

**Parameters:**
- `expo_push_token` (required): Expo push token from Expo Notifications API
- `device_type` (required): Device type (`'ios'`, `'android'`)
- `device_name` (optional): Human-readable device name
- `app_version` (optional): Mobile app version
- `notification_preferences` (optional): Notification preferences

**Response (201 Created):**
```json
{
  "device_id": "device-550e8400-e29b-41d4-a716-446655440000",
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_type": "ios",
  "registered_at": "2024-01-15T10:30:00Z",
  "notification_preferences": {
    "assignments": true,
    "intake_tickets": true,
    "commitments": true,
    "mentions": true,
    "quiet_hours": {
      "enabled": true,
      "start": "22:00",
      "end": "07:00",
      "timezone": "Asia/Riyadh"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid Expo push token format
- `401 Unauthorized` - Missing authorization
- `409 Conflict` - Device already registered (returns existing device_id)

**Implementation Example (React Native):**
```typescript
import * as Notifications from 'expo-notifications';

const registerPushDevice = async () => {
  // Request notification permissions
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Notification permission denied');
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id'
  });

  // Register with backend
  const response = await fetch('/push-device-register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      expo_push_token: tokenData.data,
      device_type: Platform.OS,
      device_name: await DeviceInfo.getDeviceName(),
      app_version: Constants.manifest?.version,
      notification_preferences: {
        assignments: true,
        intake_tickets: true,
        commitments: true,
        mentions: true,
        quiet_hours: {
          enabled: true,
          start: '22:00',
          end: '07:00',
          timezone: 'Asia/Riyadh'
        }
      }
    })
  });

  const result = await response.json();

  // Store device_id locally
  await AsyncStorage.setItem('device_id', result.device_id);

  return result;
};
```

**Quiet Hours:**
- Notifications during quiet hours are queued and delivered at end time
- Urgent priority notifications bypass quiet hours
- Timezone-aware scheduling

---

### Notifications Center

Retrieve in-app notifications for the authenticated user.

**Endpoint:** `GET /notifications-center`

**Query Parameters:**
- `status` (optional): Filter by status (`'unread'`, `'read'`, `'archived'`)
- `category` (optional): Filter by category (`'assignment'`, `'intake'`, `'commitment'`, `'mention'`)
- `priority` (optional): Filter by priority
- `start_date` (optional): Filter from date (ISO 8601)
- `end_date` (optional): Filter to date (ISO 8601)
- `limit` (optional): Page size (default: 20, max: 100)
- `offset` (optional): Page offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "notif-550e8400-e29b-41d4-a716-446655440000",
      "category": "assignment",
      "priority": "high",
      "title_en": "New Assignment",
      "title_ar": "مهمة جديدة",
      "body_en": "You have been assigned task: Prepare briefing document",
      "body_ar": "تم تعيين المهمة: إعداد وثيقة إحاطة",
      "data": {
        "assignment_id": "assign-id",
        "deep_link": "/assignments/assign-id"
      },
      "action_buttons": [
        {
          "label_en": "View Task",
          "label_ar": "عرض المهمة",
          "action": "open_assignment"
        }
      ],
      "status": "unread",
      "read_at": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "unread_count": 12,
  "total": 127,
  "limit": 20,
  "offset": 0
}
```

**Endpoint (Mark as Read):** `PUT /notifications-center/:id/read`

**Response (200 OK):**
```json
{
  "id": "notif-550e8400-e29b-41d4-a716-446655440000",
  "status": "read",
  "read_at": "2024-01-15T10:35:00Z"
}
```

**Endpoint (Mark All as Read):** `PUT /notifications-center/mark-all-read`

**Response (200 OK):**
```json
{
  "marked_read": 12,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Implementation Example:**
```typescript
const getNotifications = async (status: string = 'unread') => {
  const params = new URLSearchParams({
    status,
    limit: '20',
    offset: '0'
  });

  const response = await fetch(`/notifications-center?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  // Display unread badge
  if (data.unread_count > 0) {
    updateBadgeCount(data.unread_count);
  }

  return data;
};

const markAsRead = async (notificationId: string) => {
  await fetch(`/notifications-center/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Refresh notifications list
  await getNotifications();
};
```

---

### Send Email

Send email notifications with template support and attachments.

**Endpoint:** `POST /email-send`

**Request Body:**
```json
{
  "recipient_type": "user",
  "recipient_ids": ["user-id"],
  "template_id": "assignment_notification",
  "subject_en": "New Assignment: Prepare briefing document",
  "subject_ar": "مهمة جديدة: إعداد وثيقة إحاطة",
  "template_data": {
    "assignee_name": "John Doe",
    "assignment_title": "Prepare briefing document",
    "deadline": "2024-01-20",
    "priority": "high",
    "link": "https://app.intl-dossier.sa/assignments/assign-id"
  },
  "cc": ["manager@example.com"],
  "bcc": [],
  "attachments": [
    {
      "filename": "briefing_template.docx",
      "url": "https://storage.example.com/templates/briefing.docx"
    }
  ],
  "priority": "high"
}
```

**Parameters:**
- `recipient_type` (required): Type (`'user'`, `'group'`, `'external'`)
- `recipient_ids` (required): Array of user UUIDs or email addresses
- `template_id` (required): Email template ID
- `subject_en` (required): English subject line
- `subject_ar` (required): Arabic subject line
- `template_data` (required): Template variable data
- `cc` (optional): CC email addresses
- `bcc` (optional): BCC email addresses
- `attachments` (optional): File attachments (max 5, 10MB total)
- `priority` (optional): Email priority

**Response (200 OK):**
```json
{
  "email_id": "email-550e8400-e29b-41d4-a716-446655440000",
  "recipients_count": 1,
  "queued_at": "2024-01-15T10:30:00Z",
  "estimated_delivery": "2024-01-15T10:31:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid template_id or recipients
- `401 Unauthorized` - Missing authorization
- `413 Payload Too Large` - Attachments exceed 10MB limit

**Available Email Templates:**
- `assignment_notification`: New assignment created
- `deadline_reminder`: Deadline approaching
- `commitment_update`: Commitment status changed
- `intake_ticket_created`: New intake ticket
- `position_approved`: Position paper approved
- `engagement_invitation`: Engagement invitation

**Implementation Example:**
```typescript
const sendEmail = async (
  recipientIds: string[],
  templateId: string,
  templateData: any
) => {
  const response = await fetch('/email-send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient_type: 'user',
      recipient_ids: recipientIds,
      template_id: templateId,
      subject_en: `Action Required: ${templateData.title}`,
      subject_ar: `إجراء مطلوب: ${templateData.title_ar}`,
      template_data: templateData,
      priority: 'normal'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return await response.json();
};
```

---

### Notifications Digest

Subscribe to daily/weekly notification digests.

**Endpoint (Get Preferences):** `GET /notifications-digest`

**Response (200 OK):**
```json
{
  "user_id": "user-550e8400-e29b-41d4-a716-446655440000",
  "digest_enabled": true,
  "digest_frequency": "daily",
  "digest_time": "08:00",
  "digest_timezone": "Asia/Riyadh",
  "include_categories": [
    "assignments",
    "commitments",
    "intake_tickets"
  ],
  "exclude_low_priority": true,
  "last_sent_at": "2024-01-15T08:00:00Z"
}
```

**Endpoint (Update Preferences):** `PUT /notifications-digest`

**Request Body:**
```json
{
  "digest_enabled": true,
  "digest_frequency": "daily",
  "digest_time": "08:00",
  "digest_timezone": "Asia/Riyadh",
  "include_categories": [
    "assignments",
    "commitments"
  ],
  "exclude_low_priority": true
}
```

**Response (200 OK):**
```json
{
  "updated": true,
  "next_digest_at": "2024-01-16T08:00:00Z"
}
```

**Digest Frequencies:**
- `daily`: Every day at specified time
- `weekly`: Every Monday at specified time
- `monthly`: First day of month at specified time

**Implementation Example:**
```typescript
const updateDigestPreferences = async (
  frequency: 'daily' | 'weekly' | 'monthly',
  time: string
) => {
  const response = await fetch('/notifications-digest', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      digest_enabled: true,
      digest_frequency: frequency,
      digest_time: time,
      digest_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      include_categories: ['assignments', 'commitments', 'intake_tickets'],
      exclude_low_priority: true
    })
  });

  return await response.json();
};
```

---

### Bot Notification Dispatcher

Internal endpoint for scheduling and dispatching bot-generated notifications.

**Endpoint:** `POST /bot-notification-dispatcher`

**Request Body:**
```json
{
  "notification_type": "sla_breach",
  "resource_type": "intake_ticket",
  "resource_id": "ticket-id",
  "recipients": ["user-id", "manager-id"],
  "priority": "urgent",
  "schedule_at": null
}
```

**Response (200 OK):**
```json
{
  "dispatched": true,
  "notifications_sent": 2,
  "scheduled": false
}
```

**Notes:**
- Used internally by workflow automation
- Requires system-level authorization
- Supports scheduled notifications

---

### Inbound Email Handler

Process inbound emails for ticket creation and replies.

**Endpoint:** `POST /email-inbound`

**Request Body (Webhook from Email Provider):**
```json
{
  "from": "user@example.com",
  "to": "intake@intl-dossier.sa",
  "subject": "Urgent: Visa request for delegation",
  "body": "Email body content...",
  "attachments": [
    {
      "filename": "passport-copy.pdf",
      "content_type": "application/pdf",
      "size": 125000,
      "url": "https://temp-storage.com/file.pdf"
    }
  ],
  "headers": {
    "In-Reply-To": "ticket-550e8400@intl-dossier.sa",
    "References": "ticket-550e8400@intl-dossier.sa"
  }
}
```

**Response (200 OK):**
```json
{
  "action": "ticket_created",
  "ticket_id": "ticket-550e8400-e29b-41d4-a716-446655440000",
  "notification_sent": true
}
```

**Supported Email Actions:**
- New email to `intake@...` → Create intake ticket
- Reply to existing ticket email → Add comment to ticket
- Forward to `intake@...` → Create ticket with forwarded context

---

### MOU Notifications

Send notifications related to Memorandum of Understanding (MOU) events.

**Endpoint:** `POST /mou-notifications`

**Request Body:**
```json
{
  "mou_id": "mou-550e8400-e29b-41d4-a716-446655440000",
  "event_type": "expiring_soon",
  "recipients": ["user-id"],
  "days_until_expiry": 30
}
```

**Response (200 OK):**
```json
{
  "notifications_sent": 1,
  "notification_type": "mou_expiring_soon"
}
```

**MOU Event Types:**
- `expiring_soon`: MOU expiring within threshold
- `expired`: MOU has expired
- `renewed`: MOU renewed
- `milestone_reached`: MOU milestone achieved

---

### Register Device for Notifications

Alternative device registration endpoint (legacy).

**Endpoint:** `POST /notifications-register-device`

**Note:** Use `/push-device-register` for new implementations.

---

### Push Notification (Legacy)

Legacy push notification endpoint.

**Endpoint:** `POST /push-notification`

**Note:** Use `/push-notification-send` for new implementations.

---

## Common Features

### Authentication

All notification endpoints require JWT authentication:

```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Bilingual Support

All notifications support bilingual content (English/Arabic). The appropriate language is selected based on:
1. User's preferred language setting
2. Device language setting (mobile)
3. Fallback to English if neither available

### Delivery Channels

Notifications can be delivered via:
- **Push**: Mobile push notifications (via Expo)
- **Email**: SMTP email delivery
- **In-App**: Notifications center

### Notification Preferences

Users can configure notification preferences:
- Enable/disable by category
- Quiet hours scheduling
- Digest subscriptions
- Delivery channel preferences

### Rate Limiting

Rate limits per user:
- Push notifications: 100/minute
- Email: 50/hour
- In-app notifications: Unlimited

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

- [Workflow API](./workflow.md) - Automated notification triggers
- [Assignments API](./assignments.md) - Assignment notifications
- [Intake API](./intake.md) - Ticket notifications
- [AI Services API](./ai-services.md) - AI-generated notifications
