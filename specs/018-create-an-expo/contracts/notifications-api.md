# Push Notifications API Contract: Mobile App Notifications

**Feature**: 018-create-an-expo
**Date**: 2025-10-10
**Purpose**: Define API endpoints for push notification registration, management, and delivery

---

## Overview

The mobile app uses **Expo Push Notifications** to deliver real-time notifications for new assignments (dossiers, briefs, intake requests), updates, and reminders. This contract defines:

1. **Device Registration**: Register device push token with backend
2. **Notification Preferences**: Manage notification settings by assignment type
3. **Send Notifications**: Backend endpoint to send push notifications (internal use)

### Notification Flow

```
User Grants Permission → Obtain Expo Push Token → Register Token with Backend
                                                            ↓
Backend Event (New Assignment) → Backend Sends Push → Expo Push Service → Device
                                                            ↓
User Taps Notification → App Opens → Navigate to Assignment
```

---

## Base URL

All notification endpoints use the backend API:

```
https://zkrcjzdemdmwhearhfgg.supabase.co/functions/v1
```

---

## 1. Register Push Token

**Endpoint**: `POST /notifications/register`

**Description**: Register or update the device's Expo push token for the authenticated user. Should be called when the app obtains a push token (first launch, permission granted, token refresh).

### Request

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_info": {
    "platform": "ios",
    "os_version": "17.1",
    "app_version": "1.0.0",
    "device_model": "iPhone 14 Pro",
    "locale": "ar"
  }
}
```

**Request Schema**:
- `user_id` (string, required): Authenticated user's UUID
- `expo_push_token` (string, required): Expo push token obtained from `expo-notifications`
- `device_info` (object, optional): Device metadata for debugging and analytics
  - `platform` (string): `"ios"` or `"android"`
  - `os_version` (string): iOS/Android version
  - `app_version` (string): Mobile app version
  - `device_model` (string): Device model name
  - `locale` (string): Device language (`"en"` or `"ar"`)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Push token registered successfully",
  "token_id": "t1o2k3e4-n5i6-7890-abcd-ef1234567890",
  "registered_at": 1696122000000
}
```

**Response Schema**:
- `success` (boolean): Always `true` for 200 OK
- `message` (string): Success message
- `token_id` (string): Unique identifier for this device registration
- `registered_at` (number): Unix timestamp of registration

### Response (Error - Invalid Token)

**Status**: `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PUSH_TOKEN",
    "message": "Expo push token format is invalid"
  }
}
```

---

## 2. Unregister Push Token

**Endpoint**: `POST /notifications/unregister`

**Description**: Remove the device's push token from the backend. Should be called when the user logs out or disables notifications.

### Request

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Request Schema**:
- `user_id` (string, required): Authenticated user's UUID
- `expo_push_token` (string, required): Token to unregister

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Push token unregistered successfully"
}
```

---

## 3. Update Notification Preferences

**Endpoint**: `PUT /notifications/preferences`

**Description**: Update user's notification preferences by assignment type. This controls which types of assignments trigger push notifications.

### Request

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "preferences": {
    "dossier_assignments": true,
    "brief_assignments": false,
    "intake_assignments": true,
    "updates": true,
    "reminders": false
  }
}
```

**Request Schema**:
- `user_id` (string, required): Authenticated user's UUID
- `preferences` (object, required): Notification preferences
  - `dossier_assignments` (boolean): Notify on new dossier assignments
  - `brief_assignments` (boolean): Notify on new brief assignments
  - `intake_assignments` (boolean): Notify on new intake request assignments
  - `updates` (boolean): Notify on updates to assigned items
  - `reminders` (boolean): Notify on deadline reminders

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "message": "Notification preferences updated",
  "preferences": {
    "dossier_assignments": true,
    "brief_assignments": false,
    "intake_assignments": true,
    "updates": true,
    "reminders": false
  },
  "updated_at": 1696122500000
}
```

---

## 4. Get Notification Preferences

**Endpoint**: `GET /notifications/preferences`

**Description**: Retrieve the user's current notification preferences.

### Request

**Query Parameters**:
- `user_id` (string, required): Authenticated user's UUID

**Example**: `GET /notifications/preferences?user_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Headers**:
```
Authorization: Bearer <access_token>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "preferences": {
    "dossier_assignments": true,
    "brief_assignments": false,
    "intake_assignments": true,
    "updates": true,
    "reminders": false
  },
  "updated_at": 1696122500000
}
```

---

## 5. Send Push Notification (Internal)

**Endpoint**: `POST /notifications/send`

**Description**: Send a push notification to one or more users. This endpoint is called by backend services when triggering events occur (new assignment, update, reminder). **Not directly called by mobile app**.

### Request

```json
{
  "user_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
  "notification": {
    "title": "New Dossier Assignment",
    "title_ar": "تعيين ملف جديد",
    "body": "You have been assigned to: Saudi-UAE Trade Relations 2025",
    "body_ar": "تم تعيينك إلى: العلاقات التجارية السعودية الإماراتية 2025",
    "type": "assignment",
    "data": {
      "dossier_id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
      "assignment_id": "x1y2z3a4-b5c6-7890-defg-hijklmnopqrs",
      "priority": "high",
      "screen": "/dossiers/d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy"
    },
    "sound": "default",
    "badge": 1,
    "priority": "high"
  }
}
```

**Request Schema**:
- `user_ids` (array[string], required): List of user UUIDs to send notification to
- `notification` (object, required): Notification payload
  - `title` (string, required): English notification title
  - `title_ar` (string, required): Arabic notification title
  - `body` (string, required): English notification body
  - `body_ar` (string, required): Arabic notification body
  - `type` (string, required): Notification type (`"assignment"`, `"update"`, `"reminder"`)
  - `data` (object, optional): Custom data payload for deep linking
  - `sound` (string, optional): Notification sound (`"default"` or `null`)
  - `badge` (number, optional): Badge count for app icon
  - `priority` (string, optional): Notification priority (`"high"`, `"default"`)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <service_role_key>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "sent_count": 1,
  "failed_count": 0,
  "receipts": [
    {
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "ok",
      "expo_ticket_id": "ticket_xxxxxxxxxxxxxxxxxxxxx"
    }
  ]
}
```

**Response Schema**:
- `success` (boolean): `true` if at least one notification sent
- `sent_count` (number): Number of notifications successfully sent
- `failed_count` (number): Number of notifications that failed
- `receipts` (array[object]): Delivery receipts per user
  - `user_id` (string): User UUID
  - `status` (string): `"ok"`, `"error"`, `"invalid_token"`
  - `expo_ticket_id` (string): Expo ticket ID for tracking delivery
  - `error` (string, optional): Error message if status is `"error"`

### Response (Partial Failure)

**Status**: `207 Multi-Status`

```json
{
  "success": true,
  "sent_count": 1,
  "failed_count": 1,
  "receipts": [
    {
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "ok",
      "expo_ticket_id": "ticket_xxxxxxxxxxxxxxxxxxxxx"
    },
    {
      "user_id": "b2c3d4e5-f6g7-8901-hijk-lmnopqrstuvw",
      "status": "error",
      "error": "DeviceNotRegistered: Push token is no longer valid"
    }
  ]
}
```

---

## 6. Get Notification History

**Endpoint**: `GET /notifications/history`

**Description**: Retrieve notification history for the authenticated user. Returns notifications from the last 30 days.

### Request

**Query Parameters**:
- `user_id` (string, required): Authenticated user's UUID
- `limit` (number, optional): Maximum number of notifications to return (default: 50, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)
- `read_status` (string, optional): Filter by read status (`"read"`, `"unread"`, or omit for all)

**Example**: `GET /notifications/history?user_id=a1b2c3d4&limit=20&read_status=unread`

**Headers**:
```
Authorization: Bearer <access_token>
```

### Response (Success)

**Status**: `200 OK`

```json
{
  "success": true,
  "notifications": [
    {
      "id": "n1o2p3q4-r5s6-7890-tuvw-xyzabcdefghi",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "New Dossier Assignment",
      "title_ar": "تعيين ملف جديد",
      "message": "You have been assigned to: Saudi-UAE Trade Relations 2025",
      "message_ar": "تم تعيينك إلى: العلاقات التجارية السعودية الإماراتية 2025",
      "type": "assignment",
      "dossier_id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
      "read_status": false,
      "created_at": 1696118000000
    }
  ],
  "total_count": 42,
  "unread_count": 8,
  "has_more": true
}
```

**Response Schema**:
- `success` (boolean): Always `true` for 200 OK
- `notifications` (array[object]): List of notifications
- `total_count` (number): Total notification count for user
- `unread_count` (number): Count of unread notifications
- `has_more` (boolean): Whether more notifications are available (pagination)

---

## Client-Side Implementation

### 1. Request Push Permission and Obtain Token

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id'
    })).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
```

### 2. Register Token with Backend

```typescript
const registerPushToken = async (userId: string, pushToken: string) => {
  const response = await fetch('/notifications/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      user_id: userId,
      expo_push_token: pushToken,
      device_info: {
        platform: Platform.OS,
        os_version: Platform.Version.toString(),
        app_version: '1.0.0',
        device_model: Device.modelName,
        locale: i18n.language
      }
    })
  });

  return response.json();
};
```

### 3. Handle Incoming Notifications

```typescript
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

// Set notification handler (foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function App() {
  const navigation = useNavigation();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Notification received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // User tapped on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      // Navigate to appropriate screen based on notification type
      if (data.dossier_id) {
        navigation.navigate('DossierDetails', { id: data.dossier_id });
      } else if (data.brief_id) {
        navigation.navigate('BriefDetails', { id: data.brief_id });
      } else if (data.intake_request_id) {
        navigation.navigate('IntakeRequestDetails', { id: data.intake_request_id });
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [navigation]);

  return <YourApp />;
}
```

---

## Rate Limiting

- **Register Token**: 10 requests per hour per user
- **Unregister Token**: 10 requests per hour per user
- **Update Preferences**: 30 requests per hour per user
- **Get Preferences**: 60 requests per hour per user
- **Get History**: 60 requests per hour per user
- **Send Notification (Internal)**: 1000 requests per minute (backend only)

**Rate Limit Response**:

**Status**: `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry after 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PUSH_TOKEN` | 400 | Push token format invalid |
| `USER_NOT_FOUND` | 404 | User ID does not exist |
| `UNAUTHORIZED` | 401 | Invalid or expired JWT token |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `NOTIFICATION_SEND_FAILED` | 500 | Failed to send notification |
| `EXPO_API_ERROR` | 502 | Expo Push API error |

---

## Notification Types and Data Payloads

### Assignment Notification

**Type**: `assignment`

**Data Payload**:
```json
{
  "type": "assignment",
  "assignment_id": "x1y2z3a4-b5c6-7890-defg-hijklmnopqrs",
  "dossier_id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
  "brief_id": null,
  "intake_request_id": null,
  "priority": "high",
  "screen": "/dossiers/d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy"
}
```

### Update Notification

**Type**: `update`

**Data Payload**:
```json
{
  "type": "update",
  "dossier_id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
  "update_type": "status_change",
  "new_status": "active",
  "screen": "/dossiers/d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy"
}
```

### Reminder Notification

**Type**: `reminder`

**Data Payload**:
```json
{
  "type": "reminder",
  "dossier_id": "d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy",
  "reminder_type": "deadline",
  "deadline_date": 1696204800000,
  "screen": "/dossiers/d1e2f3g4-h5i6-7890-jklm-nopqrstuvwxy"
}
```

---

## Performance Targets

- **Register Token**: < 500ms
- **Unregister Token**: < 300ms
- **Update Preferences**: < 400ms
- **Get Preferences**: < 200ms
- **Get History**: < 1 second for 50 notifications
- **Send Notification**: < 1 second per notification
- **Notification Delivery**: 95% delivered within 30 seconds

---

## Security Considerations

1. **JWT Authentication**: All endpoints (except internal send) require valid JWT
2. **Service Role Key**: Internal send endpoint requires Supabase service role key
3. **User Isolation**: Users can only register tokens and update preferences for their own account
4. **Token Validation**: Expo push tokens validated against Expo Push API format
5. **Notification Filtering**: Backend respects user preferences before sending notifications
6. **Secure Storage**: Push tokens stored securely in database with encryption at rest
