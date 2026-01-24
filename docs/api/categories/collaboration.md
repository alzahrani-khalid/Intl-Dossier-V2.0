# Collaboration & Communication API

## Overview

The Collaboration & Communication API provides team collaboration features, comments, interaction notes, Slack/Teams bot integration, and collaborative editing. All endpoints support real-time updates and bilingual content.

## Endpoints

### Team Collaboration

Manage team collaboration spaces and activities.

**Endpoint:** `POST /team-collaboration`

**Create Collaboration Space Request:**
```json
{
  "action": "create_space",
  "name_en": "Climate Policy Working Group",
  "name_ar": "مجموعة العمل المعنية بسياسة المناخ",
  "description_en": "Cross-functional team for climate initiatives",
  "description_ar": "فريق متعدد الوظائف لمبادرات المناخ",
  "members": ["user-uuid-1", "user-uuid-2", "user-uuid-3"],
  "linked_dossier_id": "dossier-uuid",
  "visibility": "team"
}
```

**Response (201 Created):**
```json
{
  "space_id": "space-uuid",
  "name_en": "Climate Policy Working Group",
  "name_ar": "مجموعة العمل المعنية بسياسة المناخ",
  "created_by": "user-uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "members_count": 3,
  "channel_url": "/collaboration/space-uuid"
}
```

**List Collaboration Spaces:**
```http
GET /team-collaboration?filter=my_spaces
```

**Response (200 OK):**
```json
{
  "spaces": [
    {
      "space_id": "space-uuid",
      "name_en": "Climate Policy Working Group",
      "members_count": 8,
      "unread_messages": 5,
      "last_activity": "2024-01-15T09:45:00Z",
      "linked_dossier_id": "dossier-uuid"
    }
  ],
  "total": 12
}
```

**Error Responses:**
- `400 Bad Request` - Invalid action or parameters
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to create collaboration space
- `500 Internal Server Error` - Operation failed

---

### Entity Comments

Add and manage comments on entities (positions, dossiers, assignments, etc.).

**Endpoint:** `POST /entity-comments` or `GET /entity-comments`

**Create Comment Request:**
```json
{
  "entity_type": "position",
  "entity_id": "pos-uuid",
  "comment_text": "This position needs clarification on section 3",
  "comment_text_ar": "هذا الموقف يحتاج إلى توضيح في القسم 3",
  "mentions": ["user-uuid-1", "user-uuid-2"],
  "attachments": ["https://storage.supabase.co/files/doc.pdf"]
}
```

**Response (201 Created):**
```json
{
  "comment_id": "comment-uuid",
  "entity_type": "position",
  "entity_id": "pos-uuid",
  "comment_text": "This position needs clarification on section 3",
  "author_id": "user-uuid",
  "author_name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z",
  "mentions": ["user-uuid-1", "user-uuid-2"],
  "mention_notifications_sent": 2
}
```

**Get Comments:**
```http
GET /entity-comments?entity_type=position&entity_id=pos-uuid
```

**Response (200 OK):**
```json
{
  "comments": [
    {
      "comment_id": "comment-uuid",
      "comment_text": "This position needs clarification on section 3",
      "author_id": "user-uuid",
      "author_name": "John Doe",
      "author_avatar_url": "https://avatar.url",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": null,
      "replies_count": 2,
      "reactions": {
        "👍": 5,
        "👎": 1,
        "❤️": 3
      },
      "is_resolved": false
    }
  ],
  "total": 24,
  "unresolved_count": 8
}
```

**Error Responses:**
- `400 Bad Request` - Invalid entity_type or entity_id
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to comment on entity
- `404 Not Found` - Entity not found
- `500 Internal Server Error` - Operation failed

---

### Interaction Notes

Create and search interaction notes with stakeholders.

**Create Interaction Note:**

**Endpoint:** `POST /interaction-notes-create`

**Request Body:**
```json
{
  "dossier_id": "dossier-uuid",
  "interaction_type": "bilateral_meeting",
  "interaction_date": "2024-01-10T14:00:00Z",
  "participants": [
    {
      "name": "Ambassador Smith",
      "title": "Ambassador",
      "organization": "Embassy of Country X"
    }
  ],
  "notes_en": "Discussed framework for climate cooperation. Ambassador expressed strong interest in joint initiatives.",
  "notes_ar": "ناقشنا إطار التعاون في مجال المناخ. أعرب السفير عن اهتمام قوي بالمبادرات المشتركة.",
  "action_items": [
    {
      "description_en": "Draft MOU framework",
      "description_ar": "صياغة إطار مذكرة التفاهم",
      "assigned_to": "user-uuid",
      "due_date": "2024-02-01T00:00:00Z"
    }
  ],
  "attachments": ["meeting-notes.pdf"],
  "tags": ["climate", "bilateral", "mou"]
}
```

**Response (201 Created):**
```json
{
  "note_id": "note-uuid",
  "dossier_id": "dossier-uuid",
  "interaction_type": "bilateral_meeting",
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "user-uuid",
  "action_items_created": 1
}
```

---

**List Interaction Notes:**

**Endpoint:** `GET /interaction-notes-list?dossier_id={id}`

**Query Parameters:**
- `dossier_id` (optional): Filter by dossier
- `interaction_type` (optional): Filter by type
- `date_from` (optional): Filter by date range
- `date_to` (optional): Filter by date range
- `limit` (optional): Page size (default: 20)
- `offset` (optional): Page offset

**Response (200 OK):**
```json
{
  "notes": [
    {
      "note_id": "note-uuid",
      "dossier_id": "dossier-uuid",
      "dossier_name_en": "Ministry of Environment - Country X",
      "interaction_type": "bilateral_meeting",
      "interaction_date": "2024-01-10T14:00:00Z",
      "notes_preview_en": "Discussed framework for climate cooperation...",
      "created_by_name": "John Doe",
      "created_at": "2024-01-15T10:30:00Z",
      "action_items_count": 3,
      "pending_action_items": 2
    }
  ],
  "total": 45
}
```

---

**Search Interaction Notes:**

**Endpoint:** `GET /interaction-notes-search?q={query}`

**Query Parameters:**
- `q` (required): Search query (searches in bilingual notes and action items)
- `dossier_id` (optional): Filter by dossier
- `date_from` (optional): Filter by date range

**Response (200 OK):**
```json
{
  "results": [
    {
      "note_id": "note-uuid",
      "dossier_name_en": "Ministry of Environment - Country X",
      "interaction_type": "bilateral_meeting",
      "interaction_date": "2024-01-10T14:00:00Z",
      "matched_text_en": "...framework for **climate cooperation**...",
      "relevance_score": 0.85
    }
  ],
  "total": 12,
  "search_time_ms": 45
}
```

---

### Collaborative Editing

Real-time collaborative document editing.

**Endpoint:** `POST /collaborative-editing` (WebSocket endpoint)

**WebSocket Connection:**
```typescript
const ws = new WebSocket('wss://project-ref.supabase.co/collaborative-editing');

ws.onopen = () => {
  // Join document session
  ws.send(JSON.stringify({
    action: 'join',
    document_id: 'doc-uuid',
    user_id: 'user-uuid',
    access_token: 'bearer-token'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle: cursor_update, text_change, user_joined, user_left
};
```

**Messages:**
- `cursor_update`: User cursor position changed
- `text_change`: Document text modified (operational transformation)
- `user_joined`: User joined editing session
- `user_left`: User left editing session
- `lock_acquired`: Section locked by user
- `lock_released`: Section unlocked

---

### Add Contributors

Add contributors to an entity (position, dossier, etc.).

**Endpoint:** `POST /contributors-add`

**Request Body:**
```json
{
  "entity_type": "position",
  "entity_id": "pos-uuid",
  "user_ids": ["user-uuid-1", "user-uuid-2"],
  "role": "reviewer",
  "notify": true
}
```

**Response (200 OK):**
```json
{
  "added": 2,
  "contributors": [
    {
      "user_id": "user-uuid-1",
      "user_name": "Jane Smith",
      "role": "reviewer",
      "added_at": "2024-01-15T10:30:00Z"
    },
    {
      "user_id": "user-uuid-2",
      "user_name": "Mike Johnson",
      "role": "reviewer",
      "added_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Remove Contributors

Remove contributors from an entity.

**Endpoint:** `POST /contributors-remove`

**Request Body:**
```json
{
  "entity_type": "position",
  "entity_id": "pos-uuid",
  "user_ids": ["user-uuid-1"],
  "reason": "No longer involved in project"
}
```

**Response (200 OK):**
```json
{
  "removed": 1,
  "remaining_contributors": 5
}
```

---

### Slack Bot

Slack integration for notifications and quick actions.

**Endpoint:** `POST /slack-bot` (Slack webhook endpoint)

**Supported Commands:**
- `/intldossier search {query}` - Search dossiers
- `/intldossier position {id}` - Get position details
- `/intldossier assignments` - List my assignments
- `/intldossier create-ticket {title}` - Create intake ticket

**Slash Command Response:**
```json
{
  "response_type": "ephemeral",
  "text": "Search Results",
  "attachments": [
    {
      "title": "Climate Policy Framework",
      "text": "Position paper on bilateral climate cooperation",
      "actions": [
        {
          "type": "button",
          "text": "View in App",
          "url": "https://app.intl-dossier.com/positions/pos-uuid"
        }
      ]
    }
  ]
}
```

---

### Teams Bot

Microsoft Teams integration.

**Endpoint:** `POST /teams-bot` (Teams webhook endpoint)

**Supported Commands:**
Same as Slack bot, with Teams-specific formatting.

**Adaptive Card Response:**
```json
{
  "type": "message",
  "attachments": [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "type": "AdaptiveCard",
        "body": [
          {
            "type": "TextBlock",
            "text": "Climate Policy Framework"
          }
        ],
        "actions": [
          {
            "type": "Action.OpenUrl",
            "title": "View in App",
            "url": "https://app.intl-dossier.com/positions/pos-uuid"
          }
        ]
      }
    }
  ]
}
```

---

## Collaboration Features

### Real-Time Presence

```typescript
const supabase = createClient(projectUrl, anonKey);

const channel = supabase.channel('collaboration-space-uuid');

// Track user presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', state);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', leftPresences);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: 'user-uuid', online_at: new Date().toISOString() });
    }
  });
```

## Related APIs

- [Notifications](./notifications.md) - Mention and comment notifications
- [Dossiers](./dossiers.md) - Dossier collaboration
- [Positions](./positions.md) - Position comments and reviews
- [Assignments](./assignments.md) - Assignment comments
