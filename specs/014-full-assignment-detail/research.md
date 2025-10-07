# Research: Full Assignment Detail Page

**Feature**: 014-full-assignment-detail
**Date**: 2025-10-03
**Approach**: Ultrathink - Deep analysis before implementation

## Research Areas

### 1. Real-time State Synchronization (<1s Latency)

**Decision**: Supabase Realtime with Postgres Changes (CDC) + optimistic updates

**Rationale**:
- Supabase Realtime uses WebSocket connection with automatic reconnection
- Postgres Change Data Capture (CDC) provides sub-second updates
- TanStack Query's optimistic updates enable instant UI feedback
- Meets <1 second latency requirement for all real-time operations

**Implementation Pattern**:
```typescript
// Subscribe to assignment changes
const channel = supabase
  .channel(`assignment:${id}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'assignments', filter: `id=eq.${id}` },
    (payload) => queryClient.setQueryData(['assignment', id], payload.new)
  )
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'assignment_comments', filter: `assignment_id=eq.${id}` },
    (payload) => queryClient.invalidateQueries(['assignment', id, 'comments'])
  )
  .subscribe()
```

**Alternatives Considered**:
- Polling every 1 second: Higher latency, more server load
- Server-Sent Events (SSE): One-way only, no bi-directional support
- Custom WebSocket: Reinventing wheel, more maintenance

### 2. Optimistic UI Updates with Rollback

**Decision**: TanStack Query mutations with onMutate/onError rollback pattern

**Rationale**:
- Instant UI feedback for user actions (comments, checklist, reactions)
- Automatic rollback on network/validation failures
- Integrates seamlessly with Supabase Realtime
- Prevents race conditions with mutation context tracking

**Implementation Pattern**:
```typescript
const addCommentMutation = useMutation({
  mutationFn: (text: string) => supabase.from('assignment_comments').insert({ text, assignment_id: id }),
  onMutate: async (newComment) => {
    await queryClient.cancelQueries(['assignment', id, 'comments'])
    const previous = queryClient.getQueryData(['assignment', id, 'comments'])
    queryClient.setQueryData(['assignment', id, 'comments'], (old) => [...old, { ...newComment, id: 'temp', created_at: new Date() }])
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['assignment', id, 'comments'], context.previous)
    toast.error(t('errors.comment_failed'))
  },
  onSettled: () => {
    queryClient.invalidateQueries(['assignment', id, 'comments'])
  }
})
```

**Alternatives Considered**:
- Redux with manual rollback: More boilerplate, harder to maintain
- No optimistic updates: Poor UX, feels slow
- Immer for immutable state: Adds complexity without real-time benefit

### 3. @Mention Parsing and Validation

**Decision**: Client-side parsing with server-side validation + permission check

**Rationale**:
- Client parses @username from comment text for UI highlighting
- Server validates mentioned user exists and has view permission to assignment
- Prevents unauthorized @mentions via RLS policy check
- Notification sent only after server validation passes

**Implementation Pattern**:
```typescript
// Client: Parse mentions for UI
const parseMentions = (text: string): string[] => {
  const regex = /@(\w+)/g
  return [...text.matchAll(regex)].map(m => m[1])
}

// Server (Edge Function): Validate and create notifications
const mentions = parseMentions(comment.text)
for (const username of mentions) {
  const user = await supabase.from('users').select('id').eq('username', username).single()
  const hasAccess = await supabase.rpc('user_can_view_assignment', { user_id: user.id, assignment_id })
  if (hasAccess) {
    await supabase.from('notifications').insert({ user_id: user.id, type: 'mention', ... })
  }
}
```

**Alternatives Considered**:
- Client-only validation: Security risk, users could mention unauthorized people
- Rich text editor with autocomplete: Overkill for simple @mentions
- Email-style mentions with select dropdown: Slower UX, more clicks

### 4. Checklist State Management

**Decision**: Separate `assignment_checklist_items` table with order/sequence tracking

**Rationale**:
- Each checklist item is independent entity (can be checked/unchecked independently)
- Order preserved via `sequence` column for drag-drop reordering
- Template import creates multiple rows efficiently
- Progress percentage calculated via SQL: `COUNT(*) FILTER (WHERE completed) / COUNT(*)`

**Database Schema**:
```sql
CREATE TABLE assignment_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_assignment ON assignment_checklist_items(assignment_id, sequence);
```

**Alternatives Considered**:
- JSONB array in assignments table: Harder to query, no referential integrity
- Single text field with markdown checkboxes: No structured queries, poor UX
- Separate checklist_templates + checklist_instances: Over-engineered for v1

### 5. Emoji Reaction Storage

**Decision**: `comment_reactions` junction table with composite unique constraint

**Rationale**:
- User can react with each emoji only once per comment
- Reaction counts aggregated via SQL for efficient display
- Easy to add/remove reactions (upsert/delete)
- Supports future reaction types (not just emojis)

**Database Schema**:
```sql
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES assignment_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('👍', '✅', '❓', '❤️')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Query: Get reaction counts
SELECT emoji, COUNT(*) as count, ARRAY_AGG(users.name) as users
FROM comment_reactions
JOIN users ON users.id = user_id
WHERE comment_id = :id
GROUP BY emoji;
```

**Alternatives Considered**:
- JSONB object: `{ "👍": [user_ids] }`: Harder to query, denormalized
- Increment counter only: Can't see who reacted
- Separate table per emoji: Schema explosion, inflexible

### 6. Observer Pattern for Escalations

**Decision**: `assignment_observers` table + RLS policy extension

**Rationale**:
- Supervisor added as observer when assignment escalated
- RLS policy grants view access to assignee + observers
- Observer can accept (become assignee), reassign, or continue observing
- Original assignee remains primary until supervisor takes action

**Database Schema**:
```sql
CREATE TABLE assignment_observers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('supervisor', 'other')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- RLS Policy: Allow assignee + observers to view
CREATE POLICY assignment_view ON assignments FOR SELECT USING (
  assignee_id = auth.uid() OR
  id IN (SELECT assignment_id FROM assignment_observers WHERE user_id = auth.uid())
);
```

**Alternatives Considered**:
- Array of observer_ids in assignments: Harder to query, no timestamps
- Separate escalations table without observers: Can't view assignment details
- Role-based access only: Less flexible, can't add ad-hoc observers

### 7. Bilingual RTL/LTR Real-time Content

**Decision**: i18next with `dir` attribute + CSS logical properties

**Rationale**:
- HTML `dir="rtl"` attribute switches text direction dynamically
- CSS logical properties (`margin-inline-start`) adapt to direction
- Real-time content (comments, usernames) rendered in user's locale
- Timestamps use `Intl.DateTimeFormat` for locale-aware formatting

**Implementation Pattern**:
```tsx
// Component
const { t, i18n } = useTranslation()
const dir = i18n.language === 'ar' ? 'rtl' : 'ltr'

return (
  <div dir={dir} className="space-y-4">
    {comments.map(comment => (
      <div key={comment.id} className="flex gap-3">
        <Avatar />
        <div className="flex-1">
          <p>{comment.text}</p>
          <time>{new Intl.DateTimeFormat(i18n.language).format(comment.created_at)}</time>
        </div>
      </div>
    ))}
  </div>
)
```

**Alternatives Considered**:
- Separate Arabic/English components: Code duplication, hard to maintain
- Translation files only (no dir attribute): Visual layout breaks
- Server-side rendering: Slower, less interactive

### 8. Accessibility for Real-time Updates

**Decision**: ARIA live regions + focus management + keyboard shortcuts

**Rationale**:
- `aria-live="polite"` announces new comments to screen readers
- Focus management prevents loss when new items appear
- Keyboard shortcuts (e.g., `E` to escalate) for power users
- `role="feed"` for timeline indicates dynamic content stream

**Implementation Pattern**:
```tsx
<div role="feed" aria-label={t('assignment.timeline')} aria-live="polite">
  {events.map((event, index) => (
    <article
      key={event.id}
      aria-posinset={index + 1}
      aria-setsize={events.length}
      tabIndex={0}
    >
      <time>{event.timestamp}</time>
      <p>{event.description}</p>
    </article>
  ))}
</div>

// Keyboard shortcuts
useHotkeys('e', () => escalateMutation.mutate(), { enabled: canEscalate })
useHotkeys('c', () => commentInputRef.current?.focus())
```

**Alternatives Considered**:
- No ARIA live regions: Screen readers miss updates
- Alert() for new items: Disruptive, annoying
- No keyboard shortcuts: Mouse-only, slower workflow

## Performance Considerations

### Real-time Connection Management
- Single Realtime channel per assignment (not per entity type)
- Automatic cleanup on component unmount via `useEffect` return
- Heartbeat/presence tracking to detect stale connections
- Exponential backoff on reconnection failures

### Query Optimization
- Database indexes on `assignment_id` for all related tables
- Composite indexes for common filters (e.g., `assignment_id, created_at DESC`)
- RLS policies use indexed columns (avoid sequential scans)
- Pagination for comments/timeline (load 50 at a time, infinite scroll)

### Bundle Size
- shadcn/ui components tree-shakeable (import only what's used)
- i18next locale files lazy-loaded (Arabic only if needed)
- TanStack Router code-splitting by route
- Target: <300KB initial bundle, <50KB per lazy chunk

## Security Considerations

### RLS Policies
- All tables have RLS enabled with explicit policies
- No public access to any assignment-related tables
- Observers verified via junction table (no direct array access)
- Comment @mentions validated via server-side RPC

### Input Validation
- Comment text: max 5000 characters, sanitized HTML
- Checklist item text: max 500 characters, no special chars
- @mention usernames: alphanumeric only, must exist in database
- Emoji reactions: whitelist of allowed emojis

### Rate Limiting
- Edge Functions: 60 requests/minute per user
- Realtime subscriptions: 10 channels per user max
- Comment creation: 10 comments/minute per assignment
- Escalation: 1 escalation/hour per assignment

## Testing Strategy

### Unit Tests (Vitest)
- TanStack Query hooks (optimistic updates, rollback)
- @mention parsing logic
- Progress percentage calculation
- Date/time formatting for both locales

### Integration Tests (Contract Tests)
- Edge Function contracts for all API operations
- RLS policy validation (assignee vs observer access)
- Real-time subscription message handling

### E2E Tests (Playwright)
- Complete assignment detail flow (view → comment → escalate → complete)
- Real-time updates between two browser windows
- Bilingual support (switch locale mid-session)
- Accessibility (keyboard navigation, screen reader)

## Complexity Tracking

**No constitutional violations detected.**

All constitutional principles met:
- ✅ Bilingual Excellence: i18next + RTL/LTR
- ✅ Type Safety: TypeScript strict mode
- ✅ Security-First: RLS + rate limiting
- ✅ Data Sovereignty: Supabase self-hosted
- ✅ Resilient Architecture: Optimistic updates + error boundaries
- ✅ Accessibility: WCAG 2.1 AA + ARIA live regions
- ✅ Container-First: Docker + Edge Functions

---

**Status**: Research complete ✅
**Next**: Phase 1 - Design & Contracts
