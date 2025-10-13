# API Contract: Push Notifications

**Feature**: 021-apply-gusto-design
**Created**: 2025-10-13
**Version**: 1.0
**Base URL**: `https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1`

## Overview

The Push Notifications API enables the mobile app to receive real-time alerts for assignments, calendar events, intelligence signals, messages, and system updates. It uses Expo Push Notification Service (EPNS) for cross-platform delivery and supports deep linking to relevant app screens.

### Key Features

1. **5 Notification Categories**: Assignment, Calendar, Signal, Message, System
2. **Priority Levels**: High (immediate alert), Normal (batched), Low (silent)
3. **Deep Linking**: Direct navigation to specific dossiers, events, or screens
4. **i18n Support**: Bilingual notifications (English/Arabic) based on user preference
5. **Badge Count**: Unread notification counter for app icon
6. **Rich Content**: Title, body, image thumbnails, action buttons

### Expo Push Token Format

Expo push tokens follow this format:
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

Example: `ExponentPushToken[jH7fKr23kP9mN8qL5vR1sT]`

## Endpoints

### 1. Register Device Token

Register or update a device's Expo Push Token for receiving notifications.

**Endpoint**: `POST /notifications-register-device`

**Request Headers**:

```
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

**Request Body**:

```typescript
interface RegisterDeviceRequest {
  push_token: string;                   // Expo Push Token
  device_type: 'ios' | 'android';
  device_name?: string;                 // Optional device name (e.g., "iPhone 14 Pro")
  app_version: string;                  // App version (e.g., "1.2.3")
  locale: 'en' | 'ar';                  // User's preferred language
}
```

**Request Example**:

```json
{
  "push_token": "ExponentPushToken[jH7fKr23kP9mN8qL5vR1sT]",
  "device_type": "ios",
  "device_name": "iPhone 14 Pro",
  "app_version": "1.0.0",
  "locale": "ar"
}
```

**Response Success (200 OK)**:

```json
{
  "id": "device-token-uuid-123",
  "user_id": "user-uuid-456",
  "push_token": "ExponentPushToken[jH7fKr23kP9mN8qL5vR1sT]",
  "device_type": "ios",
  "locale": "ar",
  "registered_at": 1697560000000,
  "status": "active"
}
```

**Response Schema**:

```typescript
interface RegisterDeviceResponse {
  id: string;                           // Device token record UUID
  user_id: string;                      // User UUID
  push_token: string;
  device_type: 'ios' | 'android';
  locale: 'en' | 'ar';
  registered_at: number;                // Unix timestamp (ms)
  status: 'active' | 'inactive';
}
```

**Error Responses**:

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_token` | Malformed Expo Push Token |
| 401 | `unauthorized` | Missing or invalid JWT token |
| 422 | `validation_error` | Missing required fields or invalid device_type |
| 500 | `internal_error` | Server error during registration |

### 2. Unregister Device Token

Remove a device token when the user logs out or uninstalls the app.

**Endpoint**: `DELETE /notifications-register-device`

**Request Headers**:

```
Authorization: Bearer <supabase_jwt_token>
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `push_token` | string | Yes | Expo Push Token to unregister |

**Request Example**:

```http
DELETE /notifications-register-device?push_token=ExponentPushToken[jH7fKr23kP9mN8qL5vR1sT]
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200 OK)**:

```json
{
  "push_token": "ExponentPushToken[jH7fKr23kP9mN8qL5vR1sT]",
  "status": "unregistered",
  "unregistered_at": 1697561000000
}
```

### 3. Send Push Notification (Server-Side)

Internal API for backend services to send push notifications to users.

**Endpoint**: `POST /push-notification`

**Request Headers**:

```
Content-Type: application/json
X-Supabase-Service-Role: <service_role_key>
```

**Request Body**:

```typescript
interface SendNotificationRequest {
  user_id: string;                      // Target user UUID
  notification_type: 'assignment' | 'calendar' | 'signal' | 'message' | 'system';
  priority: 'high' | 'normal' | 'low';
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  deep_link?: string;                   // Optional deep link (e.g., intldossier://dossiers/123)
  image_url?: string;                   // Optional thumbnail image URL
  data?: Record<string, any>;           // Optional custom data payload
  badge_increment?: number;             // Badge count increment (default: 1)
  sound?: 'default' | 'custom' | null;  // Notification sound
  scheduled_at?: number;                // Optional Unix timestamp for scheduled delivery
}
```

**Request Example**:

```json
{
  "user_id": "user-uuid-456",
  "notification_type": "assignment",
  "priority": "high",
  "title_en": "New Assignment",
  "title_ar": "تكليف جديد",
  "body_en": "You have been assigned to Germany dossier as Country Analyst",
  "body_ar": "تم تعيينك في ملف ألمانيا كمحلل قطري",
  "deep_link": "intldossier://dossiers/660e8400-e29b-41d4-a716-446655440001",
  "image_url": "https://example.com/flags/germany.png",
  "data": {
    "dossier_id": "660e8400-e29b-41d4-a716-446655440001",
    "dossier_type": "country",
    "assignment_role": "country_analyst"
  },
  "badge_increment": 1,
  "sound": "default"
}
```

**Response Success (200 OK)**:

```json
{
  "notification_id": "notification-uuid-789",
  "user_id": "user-uuid-456",
  "push_token": "ExponentPushToken[jH7fKr23kP9mN8qL5vR1sT]",
  "status": "sent",
  "sent_at": 1697562000000,
  "expo_receipt_id": "expo-receipt-abc123"
}
```

**Response Schema**:

```typescript
interface SendNotificationResponse {
  notification_id: string;              // Notification record UUID
  user_id: string;
  push_token: string;
  status: 'sent' | 'failed' | 'scheduled';
  sent_at: number;
  expo_receipt_id?: string;             // Expo receipt ID for delivery tracking
  error?: string;                       // Error message if status is 'failed'
}
```

**Error Responses**:

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | Missing required fields or invalid notification_type |
| 403 | `forbidden` | Not authorized to send notifications (service role required) |
| 404 | `user_not_found` | User has no registered device tokens |
| 422 | `invalid_token` | User's device token is invalid or expired |
| 429 | `rate_limit_exceeded` | Too many notifications (limit: 100/min per user) |
| 500 | `internal_error` | Server error or Expo Push API error |

### 4. Fetch User Notifications

Retrieve notification history for the current user.

**Endpoint**: `GET /push-notification`

**Request Headers**:

```
Authorization: Bearer <supabase_jwt_token>
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of notifications to return (default: 20, max: 100) |
| `offset` | number | No | Pagination offset (default: 0) |
| `type` | string | No | Filter by notification_type (comma-separated) |
| `unread_only` | boolean | No | Return only unread notifications (default: false) |

**Request Example**:

```http
GET /push-notification?limit=50&unread_only=true&type=assignment,calendar
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200 OK)**:

```json
{
  "notifications": [
    {
      "id": "notification-uuid-789",
      "user_id": "user-uuid-456",
      "notification_type": "assignment",
      "priority": "high",
      "title_en": "New Assignment",
      "title_ar": "تكليف جديد",
      "body_en": "You have been assigned to Germany dossier as Country Analyst",
      "body_ar": "تم تعيينك في ملف ألمانيا كمحلل قطري",
      "deep_link": "intldossier://dossiers/660e8400-e29b-41d4-a716-446655440001",
      "is_read": false,
      "created_at": 1697562000000
    },
    {
      "id": "notification-uuid-790",
      "user_id": "user-uuid-456",
      "notification_type": "calendar",
      "priority": "normal",
      "title_en": "Upcoming Meeting",
      "title_ar": "اجتماع قادم",
      "body_en": "Meeting with France delegation in 2 hours",
      "body_ar": "اجتماع مع الوفد الفرنسي خلال ساعتين",
      "deep_link": "intldossier://calendar/880e8400-e29b-41d4-a716-446655440003",
      "is_read": false,
      "created_at": 1697561800000
    }
  ],
  "total_count": 42,
  "unread_count": 12,
  "limit": 50,
  "offset": 0
}
```

**Response Schema**:

```typescript
interface FetchNotificationsResponse {
  notifications: NotificationRecord[];
  total_count: number;                  // Total notifications for user
  unread_count: number;                 // Total unread notifications
  limit: number;
  offset: number;
}

interface NotificationRecord {
  id: string;
  user_id: string;
  notification_type: 'assignment' | 'calendar' | 'signal' | 'message' | 'system';
  priority: 'high' | 'normal' | 'low';
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  deep_link?: string;
  image_url?: string;
  is_read: boolean;
  read_at?: number;
  created_at: number;
}
```

### 5. Mark Notification as Read

Mark one or more notifications as read.

**Endpoint**: `PATCH /push-notification`

**Request Headers**:

```
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

**Request Body**:

```typescript
interface MarkAsReadRequest {
  notification_ids: string[];           // Array of notification UUIDs
}
```

**Request Example**:

```json
{
  "notification_ids": [
    "notification-uuid-789",
    "notification-uuid-790"
  ]
}
```

**Response Success (200 OK)**:

```json
{
  "updated_count": 2,
  "notification_ids": [
    "notification-uuid-789",
    "notification-uuid-790"
  ],
  "read_at": 1697563000000
}
```

**Response Schema**:

```typescript
interface MarkAsReadResponse {
  updated_count: number;
  notification_ids: string[];
  read_at: number;
}
```

## Push Notification Payload Structure

Expo Push Notification Service (EPNS) payloads follow this structure:

```typescript
interface ExpoPushMessage {
  to: string;                           // Expo Push Token
  sound?: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;                       // Badge count
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;                   // Android notification channel
}
```

### Example Payload Sent to Expo

```json
{
  "to": "ExponentPushToken[jH7fKr23kP9mN8qL5vR1sT]",
  "sound": "default",
  "title": "تكليف جديد",
  "body": "تم تعيينك في ملف ألمانيا كمحلل قطري",
  "data": {
    "deep_link": "intldossier://dossiers/660e8400-e29b-41d4-a716-446655440001",
    "dossier_id": "660e8400-e29b-41d4-a716-446655440001",
    "notification_type": "assignment"
  },
  "badge": 1,
  "priority": "high",
  "channelId": "intldossier-assignments"
}
```

## Deep Linking Scheme

Deep links use the custom URL scheme `intldossier://` to navigate to specific screens.

### Deep Link Formats

| Screen | Deep Link Format | Example |
|--------|-----------------|---------|
| Dossier Details | `intldossier://dossiers/{id}` | `intldossier://dossiers/660e8400-e29b-41d4-a716-446655440001` |
| Calendar Event | `intldossier://calendar/{id}` | `intldossier://calendar/880e8400-e29b-41d4-a716-446655440003` |
| Intelligence Signal | `intldossier://signals/{id}` | `intldossier://signals/990e8400-e29b-41d4-a716-446655440004` |
| Intake Ticket | `intldossier://intake/{id}` | `intldossier://intake/aa0e8400-e29b-41d4-a716-446655440005` |
| Profile | `intldossier://profile` | `intldossier://profile` |
| Notifications List | `intldossier://notifications` | `intldossier://notifications` |

### Deep Link Handling (React Navigation)

```typescript
// App.tsx
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

const prefix = Linking.createURL('/');

export default function App() {
  const navigation = useNavigation();

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path?.startsWith('dossiers/')) {
        const dossierId = path.split('/')[1];
        navigation.navigate('DossierDetails', { id: dossierId });
      } else if (path?.startsWith('calendar/')) {
        const eventId = path.split('/')[1];
        navigation.navigate('CalendarEvent', { id: eventId });
      } else if (path === 'notifications') {
        navigation.navigate('Notifications');
      }
    };

    // Handle deep link when app is already open
    Linking.addEventListener('url', handleDeepLink);

    // Handle deep link when app is opened from notification
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      Linking.removeAllListeners('url');
    };
  }, [navigation]);

  return <NavigationContainer linking={{ prefixes: [prefix, 'intldossier://'] }}>
    {/* Your app navigation */}
  </NavigationContainer>;
}
```

## Notification Categories & Android Channels

### iOS Categories

```typescript
// app.json
{
  "expo": {
    "notification": {
      "iosDisplayInForeground": true,
      "categoryIdentifier": "intldossier"
    }
  }
}
```

### Android Notification Channels

```typescript
// Android requires notification channels for Android 8.0+ (API level 26+)
import * as Notifications from 'expo-notifications';

await Notifications.setNotificationChannelAsync('intldossier-assignments', {
  name: 'Assignments',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF6B35',
  sound: 'default',
});

await Notifications.setNotificationChannelAsync('intldossier-calendar', {
  name: 'Calendar Events',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#1B5B5A',
});

await Notifications.setNotificationChannelAsync('intldossier-signals', {
  name: 'Intelligence Signals',
  importance: Notifications.AndroidImportance.MAX,  // Critical alerts
  vibrationPattern: [0, 500, 500, 500],
  lightColor: '#FF0000',
});

await Notifications.setNotificationChannelAsync('intldossier-messages', {
  name: 'Messages',
  importance: Notifications.AndroidImportance.DEFAULT,
  sound: 'default',
});

await Notifications.setNotificationChannelAsync('intldossier-system', {
  name: 'System Notifications',
  importance: Notifications.AndroidImportance.LOW,
  vibrationPattern: [0, 100],
  showBadge: false,
});
```

## Notification Triggers & Scheduling

### Server-Side Triggers

| Trigger Event | Notification Type | Priority | Scheduling |
|--------------|-------------------|----------|-----------|
| User assigned to dossier | `assignment` | High | Immediate |
| Calendar event in 2 hours | `calendar` | Normal | Scheduled (event_time - 2h) |
| Calendar event in 15 min | `calendar` | High | Scheduled (event_time - 15m) |
| Critical intelligence signal | `signal` | High | Immediate |
| New message received | `message` | Normal | Immediate |
| MOU expiring in 30 days | `system` | Normal | Scheduled (expiry_date - 30d) |
| Sync conflict detected | `system` | Normal | Immediate |
| App update available | `system` | Low | Silent (no alert) |

### Example: Scheduled Calendar Reminder

```typescript
// Backend Edge Function (e.g., cron job)
const upcomingEvents = await supabase
  .from('calendar_entries')
  .select('*')
  .eq('status', 'scheduled')
  .gte('start_time', twoHoursFromNow)
  .lte('start_time', twoHoursAndFiveMinutesFromNow);

for (const event of upcomingEvents) {
  const assignments = await supabase
    .from('assignments')
    .select('assigned_to_id')
    .eq('dossier_id', event.dossier_id)
    .eq('status', 'active');

  for (const assignment of assignments) {
    await fetch('/push-notification', {
      method: 'POST',
      body: JSON.stringify({
        user_id: assignment.assigned_to_id,
        notification_type: 'calendar',
        priority: 'normal',
        title_en: 'Upcoming Meeting',
        title_ar: 'اجتماع قادم',
        body_en: `${event.title_en} starts in 2 hours`,
        body_ar: `${event.title_ar} يبدأ خلال ساعتين`,
        deep_link: `intldossier://calendar/${event.id}`,
        scheduled_at: event.start_time - (2 * 60 * 60 * 1000),
      }),
    });
  }
}
```

## Badge Count Management

### Client-Side Badge Management

```typescript
import * as Notifications from 'expo-notifications';
import { database } from '@/database';

// Get current unread count from WatermelonDB
async function getUnreadCount(): Promise<number> {
  const notifications = await database
    .get('notifications')
    .query(Q.where('is_read', false))
    .fetchCount();

  return notifications;
}

// Update badge on app foreground
async function updateBadge(): Promise<void> {
  const unreadCount = await getUnreadCount();
  await Notifications.setBadgeCountAsync(unreadCount);
}

// Clear badge when user views notifications
async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
```

### Server-Side Badge Calculation

When sending push notifications, the server calculates the badge count:

```typescript
// Get user's current unread count
const { count } = await supabase
  .from('notifications')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('is_read', false);

// Send notification with badge count
await sendExpoPushNotification({
  to: userPushToken,
  badge: count + 1,  // Increment by 1 for the new notification
  // ... other fields
});
```

## Rate Limiting

| Endpoint | Limit | Window | Applies To |
|----------|-------|--------|------------|
| POST /notifications-register-device | 10 req | 1 min | Per user |
| POST /push-notification | 100 req | 1 min | Per user (recipient) |
| GET /push-notification | 60 req | 1 min | Per user |
| PATCH /push-notification | 30 req | 1 min | Per user |

**Rate Limit Response (429)**:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many notifications sent. Retry after 30 seconds.",
    "retry_after": 30
  }
}
```

## Error Handling & Retry Strategy

### Expo Push Service Errors

| Expo Error Code | Description | Retry Strategy |
|----------------|-------------|----------------|
| `DeviceNotRegistered` | Token is invalid or expired | Remove token from database |
| `MessageTooBig` | Payload exceeds 4KB limit | Truncate body text, retry |
| `MessageRateExceeded` | Too many messages to this device | Exponential backoff (5s, 30s, 2m) |
| `InvalidCredentials` | Expo API key is invalid | Alert admin, do not retry |

### Client-Side Retry Logic

```typescript
import * as Notifications from 'expo-notifications';

async function registerForPushNotifications(maxRetries = 3): Promise<string | null> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id',
      });

      return tokenData.data;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error('Failed to register for push notifications:', error);
        return null;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return null;
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('Push Notification API - Register Device', () => {
  it('should register device token for authenticated user', async () => {
    const response = await fetch('/notifications-register-device', {
      method: 'POST',
      body: JSON.stringify({
        push_token: 'ExponentPushToken[testToken123]',
        device_type: 'ios',
        app_version: '1.0.0',
        locale: 'ar',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.push_token).toBe('ExponentPushToken[testToken123]');
    expect(data.status).toBe('active');
  });

  it('should reject invalid Expo Push Token format', async () => {
    const response = await fetch('/notifications-register-device', {
      method: 'POST',
      body: JSON.stringify({
        push_token: 'invalid-token-format',
        device_type: 'ios',
        app_version: '1.0.0',
        locale: 'en',
      }),
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe('invalid_token');
  });
});

describe('Push Notification API - Send Notification', () => {
  it('should send notification to user', async () => {
    const response = await fetch('/push-notification', {
      method: 'POST',
      headers: { 'X-Supabase-Service-Role': serviceRoleKey },
      body: JSON.stringify({
        user_id: 'test-user-uuid',
        notification_type: 'assignment',
        priority: 'high',
        title_en: 'Test Notification',
        title_ar: 'إشعار تجريبي',
        body_en: 'This is a test',
        body_ar: 'هذا اختبار',
        deep_link: 'intldossier://dossiers/test-id',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('sent');
    expect(data.expo_receipt_id).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('End-to-End Notification Flow', () => {
  it('should complete register-send-receive cycle', async () => {
    // 1. Register device token
    const registerResponse = await fetch('/notifications-register-device', {
      method: 'POST',
      body: JSON.stringify({
        push_token: 'ExponentPushToken[e2eTestToken]',
        device_type: 'ios',
        app_version: '1.0.0',
        locale: 'en',
      }),
    });

    expect(registerResponse.status).toBe(200);

    // 2. Send notification
    const sendResponse = await fetch('/push-notification', {
      method: 'POST',
      headers: { 'X-Supabase-Service-Role': serviceRoleKey },
      body: JSON.stringify({
        user_id: testUserId,
        notification_type: 'system',
        priority: 'normal',
        title_en: 'E2E Test',
        title_ar: 'اختبار شامل',
        body_en: 'End-to-end test notification',
        body_ar: 'إشعار اختبار شامل',
      }),
    });

    expect(sendResponse.status).toBe(200);

    // 3. Fetch notifications
    const fetchResponse = await fetch('/push-notification?limit=1');
    const fetchData = await fetchResponse.json();

    expect(fetchData.notifications.length).toBeGreaterThan(0);
    expect(fetchData.notifications[0].title_en).toBe('E2E Test');
  });
});
```

## Security Considerations

1. **JWT Validation**: All user-facing endpoints validate Supabase JWT
2. **Service Role Protection**: Only backend services can send notifications (service role key required)
3. **Token Validation**: Expo Push Tokens validated via regex pattern: `^ExponentPushToken\[[a-zA-Z0-9-_]+\]$`
4. **User Isolation**: Users only receive notifications for dossiers they have access to
5. **Deep Link Validation**: Deep links validated to prevent injection attacks
6. **Rate Limiting**: Prevent notification spam (100 notifications/min per user)
7. **Data Sanitization**: Notification content sanitized to prevent XSS in push payloads

## Performance Expectations

- **Token Registration**: ≤500ms
- **Notification Delivery**: ≤2s from server to Expo to device
- **Fetch Notifications**: ≤300ms for 50 records
- **Mark as Read**: ≤200ms for batch update
- **Badge Update**: ≤100ms

## References

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Token Format](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- Feature Specification: `specs/021-apply-gusto-design/spec.md`
- Data Model: `specs/021-apply-gusto-design/data-model.md`
