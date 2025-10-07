# Frontend Integration Guide: Assignment Engine Components

**Feature**: Assignment Engine & SLA
**Version**: 1.0.0
**Last Updated**: 2025-10-02

## Overview

This guide documents the React components and TanStack Query hooks for the Assignment Engine & SLA feature. All components support bilingual (Arabic/English), RTL layout, and real-time updates via Supabase Realtime.

**Tech Stack**:
- React 18+
- TanStack Router v5
- TanStack Query v5
- Tailwind CSS
- shadcn/ui components
- Supabase Realtime
- i18next (bilingual support)

---

## Table of Contents

1. [Components](#components)
   - [SLACountdown](#slacount down-component)
   - [AssignmentQueue](#assignmentqueue-component)
   - [ManualOverrideDialog](#manualoverridedialog-component)
   - [CapacityPanel](#capacitypanel-component)
   - [AvailabilityStatusToggle](#availabilitystatustoggle-component)
   - [AvailabilityBadge](#availabilitybadge-component)
2. [TanStack Query Hooks](#tanstack-query-hooks)
   - [useAutoAssign](#useautoassign)
   - [useMyAssignments](#usemyassignments)
   - [useAssignmentQueue](#useassignmentqueue)
   - [useEscalateAssignment](#useescalateassignment)
   - [useCapacityCheck](#usecapacitycheck)
   - [useUpdateAvailability](#useupdateavailability)
3. [Supabase Realtime Integration](#supabase-realtime-integration)
4. [Accessibility Features](#accessibility-features)
5. [Bilingual Support](#bilingual-support)
6. [Performance Optimization](#performance-optimization)

---

## Components

### SLACountdown Component

Displays real-time SLA countdown with color-coded status indicators.

**Path**: `frontend/src/components/assignments/SLACountdown.tsx`

#### Usage

```tsx
import { SLACountdown } from '@/components/assignments/SLACountdown';

function MyAssignments() {
  return (
    <div>
      <SLACountdown
        assignmentId="assign-123"
        slaDeadline={new Date('2025-10-02T12:00:00Z')}
        assignedAt={new Date('2025-10-02T10:00:00Z')}
        status="warning"
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `assignmentId` | string | Yes | Assignment ID (for Realtime subscription) |
| `slaDeadline` | Date | Yes | SLA deadline timestamp |
| `assignedAt` | Date | Yes | When assignment was created |
| `status` | 'ok' \| 'warning' \| 'breached' | No | Current SLA status (calculated if not provided) |
| `showIcon` | boolean | No | Show status icon (default: true) |
| `compact` | boolean | No | Compact display mode (default: false) |

#### Features

- **Client-side countdown**: Updates every second using setInterval
- **Realtime updates**: Subscribes to assignment changes via Supabase Realtime
- **Color-coded status**:
  - Green: <75% of SLA elapsed
  - Yellow: 75-100% of SLA elapsed
  - Red: >100% of SLA elapsed
- **Accessibility**: ARIA live region announces status changes
- **Graceful degradation**: Falls back to periodic polling if Realtime unavailable

#### Example Output

```
🟢 2h 15m remaining (Status: OK)
🟡 25m remaining (Status: Warning)
🔴 Overdue by 15m (Status: Breached)
```

#### Customization

```tsx
// Compact mode (for tables)
<SLACountdown assignmentId={id} slaDeadline={deadline} assignedAt={assigned} compact />

// Without icon
<SLACountdown assignmentId={id} slaDeadline={deadline} assignedAt={assigned} showIcon={false} />

// Custom styling
<SLACountdown
  assignmentId={id}
  slaDeadline={deadline}
  assignedAt={assigned}
  className="text-sm font-medium"
/>
```

---

### AssignmentQueue Component

Displays queued work items with filtering, sorting, and real-time updates.

**Path**: `frontend/src/components/assignments/AssignmentQueue.tsx`

#### Usage

```tsx
import { AssignmentQueue } from '@/components/assignments/AssignmentQueue';

function QueuePage() {
  return (
    <div className="container mx-auto p-6">
      <AssignmentQueue
        unitId="unit-translation" // Optional: Filter by unit
        showFilters={true}
        pageSize={50}
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `unitId` | string | No | Filter by organizational unit |
| `showFilters` | boolean | No | Show filter panel (default: true) |
| `pageSize` | number | No | Items per page (default: 50) |
| `compact` | boolean | No | Compact table view (default: false) |

#### Features

- **Filters**: Priority, work item type, unit
- **Real-time updates**: Queue count and positions update live
- **Pagination**: Server-side pagination with page size selector
- **Sorting**: Priority DESC, created_at ASC (FIFO within priority)
- **Responsive**: Mobile-friendly table layout

#### Columns

| Column | Description |
|--------|-------------|
| Position | Queue position (1-indexed) |
| Work Item | Work item ID and type |
| Priority | Priority badge (Urgent/High/Normal/Low) |
| Required Skills | Skill badges |
| Queued At | Timestamp with relative time |
| Attempts | Number of failed assignment attempts |

#### Example

```tsx
function SupervisorDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Assignment Queue</h1>
      <AssignmentQueue
        unitId={user.unit_id}
        showFilters={true}
        pageSize={25}
      />
    </div>
  );
}
```

---

### ManualOverrideDialog Component

Dialog for supervisors to manually override auto-assignment.

**Path**: `frontend/src/components/assignments/ManualOverrideDialog.tsx`

#### Usage

```tsx
import { ManualOverrideDialog } from '@/components/assignments/ManualOverrideDialog';

function WorkItemActions({ workItem }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>Override Assignment</Button>
      <ManualOverrideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workItemId={workItem.id}
        workItemType={workItem.type}
        priority={workItem.priority}
      />
    </>
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | boolean | Yes | Dialog open state |
| `onOpenChange` | (open: boolean) => void | Yes | Callback when dialog opens/closes |
| `workItemId` | string | Yes | Work item ID to assign |
| `workItemType` | WorkItemType | Yes | dossier \| ticket \| position \| task |
| `priority` | PriorityLevel | Yes | urgent \| high \| normal \| low |
| `onSuccess` | (assignment) => void | No | Callback after successful assignment |

#### Form Fields

1. **Assignee Selector**: Autocomplete dropdown with staff search
2. **Override Reason**: Textarea (min 10 characters, required)

#### Validation

- Assignee must be selected
- Override reason must be at least 10 characters
- Displays capacity warning if assignee at WIP limit

#### Example

```tsx
<ManualOverrideDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  workItemId="ticket-123"
  workItemType="ticket"
  priority="urgent"
  onSuccess={(assignment) => {
    toast.success(`Assigned to ${assignment.assignee_name}`);
  }}
/>
```

---

### CapacityPanel Component

Displays staff or unit capacity utilization with color-coded progress bar.

**Path**: `frontend/src/components/assignments/CapacityPanel.tsx`

#### Usage

```tsx
import { CapacityPanel } from '@/components/assignments/CapacityPanel';

function StaffProfile({ staffId }) {
  return (
    <div className="space-y-4">
      <h2>My Capacity</h2>
      <CapacityPanel staffId={staffId} />
    </div>
  );
}

function UnitDashboard({ unitId }) {
  return (
    <div className="space-y-4">
      <h2>Unit Capacity</h2>
      <CapacityPanel unitId={unitId} />
    </div>
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `staffId` | string | No* | Staff member user ID |
| `unitId` | string | No* | Organizational unit ID |
| `showBreakdown` | boolean | No | Show detailed breakdown (default: true) |
| `refreshInterval` | number | No | Refresh interval in ms (default: 30000) |

*Exactly one of `staffId` or `unitId` must be provided.

#### Features

- **Color-coded progress bar**:
  - Green: <75% utilization
  - Yellow: 75-90% utilization
  - Red: >90% utilization
- **Auto-refresh**: Polls capacity every 30 seconds
- **Breakdown**: Shows assigned vs in_progress vs completed

#### Example Output

**Staff Capacity**:
```
3 / 5 assignments (60% utilization)
[████████░░░░░░░░░░░░] Green
Breakdown: 1 assigned, 2 in progress
```

**Unit Capacity**:
```
18 / 20 assignments (90% utilization)
[████████████████████] Red
4 staff members, 1 available, 3 at limit
```

---

### AvailabilityStatusToggle Component

Dropdown and form to update staff availability status.

**Path**: `frontend/src/components/assignments/AvailabilityStatusToggle.tsx`

#### Usage

```tsx
import { AvailabilityStatusToggle } from '@/components/assignments/AvailabilityStatusToggle';

function ProfileSettings() {
  return (
    <div>
      <h3>Availability</h3>
      <AvailabilityStatusToggle
        staffId={currentUser.id}
        currentStatus="available"
      />
    </div>
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `staffId` | string | No | Staff member user ID (omit for current user) |
| `currentStatus` | AvailabilityStatus | Yes | Current availability status |
| `onSuccess` | (result) => void | No | Callback after status update |

#### Form Fields

1. **Status Dropdown**: available / on_leave / unavailable
2. **Unavailable Until**: Date picker (required if status != available)
3. **Reason**: Textarea (optional)

#### Features

- **Automatic reassignment**: If going on leave, shows reassignment summary
- **Confirmation dialog**: Warns about reassignment before submitting
- **Loading state**: Disables form while processing

#### Example

```tsx
<AvailabilityStatusToggle
  currentStatus="available"
  onSuccess={(result) => {
    if (result.reassigned_items.length > 0) {
      toast.success(`${result.reassigned_items.length} urgent items reassigned`);
    }
    if (result.flagged_for_review.length > 0) {
      toast.warning(`${result.flagged_for_review.length} items flagged for review`);
    }
  }}
/>
```

---

### AvailabilityBadge Component

Displays current availability status with color-coded badge.

**Path**: `frontend/src/components/assignments/AvailabilityBadge.tsx`

#### Usage

```tsx
import { AvailabilityBadge } from '@/components/assignments/AvailabilityBadge';

function StaffList({ staff }) {
  return (
    <ul>
      {staff.map((member) => (
        <li key={member.id}>
          {member.name}
          <AvailabilityBadge
            status={member.availability_status}
            unavailableUntil={member.unavailable_until}
            reason={member.unavailable_reason}
          />
        </li>
      ))}
    </ul>
  );
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `status` | AvailabilityStatus | Yes | available \| on_leave \| unavailable |
| `unavailableUntil` | Date \| null | No | Return date (shown if status != available) |
| `reason` | string \| null | No | Unavailability reason (shown in tooltip) |

#### Output

- **Available**: Green badge "Available"
- **On Leave**: Yellow badge "On Leave (until 2025-10-15)"
- **Unavailable**: Red badge "Unavailable (Sick leave)"

#### Accessibility

- ARIA label announces status for screen readers
- Tooltip shows reason on hover or focus

---

## TanStack Query Hooks

### useAutoAssign

Mutation hook for triggering auto-assignment.

**Path**: `frontend/src/hooks/useAutoAssign.ts`

#### Usage

```tsx
import { useAutoAssign } from '@/hooks/useAutoAssign';

function IntakeTicket({ ticket }) {
  const { mutate: autoAssign, isPending } = useAutoAssign();

  const handleAssign = () => {
    autoAssign({
      workItemId: ticket.id,
      workItemType: 'ticket',
      requiredSkills: ticket.skills,
      priority: ticket.priority,
    });
  };

  return (
    <Button onClick={handleAssign} disabled={isPending}>
      {isPending ? 'Assigning...' : 'Auto-Assign'}
    </Button>
  );
}
```

#### API

```typescript
const {
  mutate, // (params) => void
  mutateAsync, // (params) => Promise<Assignment | QueueEntry>
  isPending, // boolean
  isError, // boolean
  error, // Error | null
} = useAutoAssign();
```

#### Parameters

```typescript
interface AutoAssignParams {
  workItemId: string;
  workItemType: 'dossier' | 'ticket' | 'position' | 'task';
  requiredSkills: string[];
  priority: 'urgent' | 'high' | 'normal' | 'low';
  targetUnitId?: string;
}
```

#### Features

- Invalidates `my-assignments` query on success
- Shows toast notification with assignee name or queue position
- Error handling with bilingual error messages

---

### useMyAssignments

Query hook for fetching user's assignments with real-time updates.

**Path**: `frontend/src/hooks/useMyAssignments.ts`

#### Usage

```tsx
import { useMyAssignments } from '@/hooks/useMyAssignments';

function MyAssignmentsPage() {
  const { data, isLoading, error } = useMyAssignments({
    status: 'assigned',
    includeCompleted: false,
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data.assignments.map((assignment) => (
        <AssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  );
}
```

#### API

```typescript
const {
  data, // { assignments: Assignment[], total_count: number }
  isLoading, // boolean
  error, // Error | null
  refetch, // () => Promise<void>
} = useMyAssignments(options);
```

#### Options

```typescript
interface MyAssignmentsOptions {
  status?: 'assigned' | 'in_progress' | 'completed';
  includeCompleted?: boolean;
}
```

#### Features

- Real-time updates via Supabase Realtime
- Auto-refetch on window focus
- Stale time: 60 seconds
- Cache time: 5 minutes

---

### useAssignmentQueue

Query hook for fetching assignment queue with filters.

**Path**: `frontend/src/hooks/useAssignmentQueue.ts`

#### Usage

```tsx
import { useAssignmentQueue } from '@/hooks/useAssignmentQueue';

function QueueDashboard() {
  const { data, isLoading } = useAssignmentQueue({
    priority: 'urgent',
    workItemType: 'ticket',
    page: 1,
    pageSize: 50,
  });

  return (
    <Table data={data?.items} pagination={data?.pagination} />
  );
}
```

#### Options

```typescript
interface QueueOptions {
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  workItemType?: 'dossier' | 'ticket' | 'position' | 'task';
  unitId?: string;
  page?: number;
  pageSize?: number;
}
```

#### Features

- Realtime updates (queue count, positions)
- Pagination support
- Filter persistence via query params

---

### useEscalateAssignment

Mutation hook for escalating assignments.

**Path**: `frontend/src/hooks/useEscalateAssignment.ts`

#### Usage

```tsx
import { useEscalateAssignment } from '@/hooks/useEscalateAssignment';

function AssignmentActions({ assignmentId }) {
  const { mutate: escalate, isPending } = useEscalateAssignment();

  return (
    <Button
      onClick={() => escalate({
        assignmentId,
        reason: 'manual',
        notes: 'Requires specialized expertise',
      })}
      disabled={isPending}
    >
      Escalate
    </Button>
  );
}
```

#### Features

- Invalidates `my-assignments` and `escalations` queries
- Shows toast with escalation recipient name

---

### useCapacityCheck

Query hook for checking staff/unit capacity.

**Path**: `frontend/src/hooks/useCapacityCheck.ts`

#### Usage

```tsx
import { useCapacityCheck } from '@/hooks/useCapacityCheck';

function CapacityWidget({ staffId }) {
  const { data } = useCapacityCheck({ staffId });

  return (
    <div>
      <p>{data?.current_count} / {data?.limit} assignments</p>
      <p>Utilization: {data?.utilization_pct}%</p>
    </div>
  );
}
```

#### Features

- Caching: 30 seconds (capacity changes slowly)
- Auto-refetch on interval (configurable)

---

### useUpdateAvailability

Mutation hook for updating staff availability.

**Path**: `frontend/src/hooks/useUpdateAvailability.ts`

#### Usage

```tsx
import { useUpdateAvailability } from '@/hooks/useUpdateAvailability';

function AvailabilityForm() {
  const { mutate: updateAvailability } = useUpdateAvailability();

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateAvailability({
        status: 'on_leave',
        unavailableUntil: '2025-10-15',
        reason: 'Annual leave',
      });
    }}>
      {/* Form fields */}
    </form>
  );
}
```

#### Features

- Invalidates `staff-profile` and `my-assignments` queries
- Shows reassignment summary in toast

---

## Supabase Realtime Integration

### Setup

Configure Realtime service in your Supabase client:

```typescript
// frontend/src/services/realtime.service.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Assignment updates channel
export const subscribeToAssignmentUpdates = (
  userId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`assignment-updates-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'assignments',
        filter: `assignee_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

// Queue updates channel
export const subscribeToQueueUpdates = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('queue-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assignment_queue',
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};
```

### Usage in Hooks

```typescript
// Example: useMyAssignments with Realtime
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeToAssignmentUpdates } from '@/services/realtime.service';

export function useMyAssignments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['my-assignments', user.id],
    queryFn: () => fetchMyAssignments(user.id),
  });

  useEffect(() => {
    const unsubscribe = subscribeToAssignmentUpdates(user.id, (payload) => {
      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['my-assignments', user.id] });

      // Or optimistically update cache
      queryClient.setQueryData(['my-assignments', user.id], (old) => {
        if (!old) return old;
        return {
          ...old,
          assignments: old.assignments.map((a) =>
            a.id === payload.new.id ? payload.new : a
          ),
        };
      });
    });

    return unsubscribe;
  }, [user.id, queryClient]);

  return query;
}
```

### Graceful Degradation

If Realtime fails, fall back to polling:

```typescript
const REALTIME_TIMEOUT = 5000; // 5 seconds
const POLL_INTERVAL = 30000; // 30 seconds

useEffect(() => {
  let timeoutId: number;
  let pollIntervalId: number;

  const setupRealtime = async () => {
    try {
      const channel = await subscribeToAssignmentUpdates(userId, callback);

      // Clear timeout if Realtime connects successfully
      clearTimeout(timeoutId);

      return channel;
    } catch (error) {
      console.warn('Realtime failed, falling back to polling', error);
      // Set up polling
      pollIntervalId = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      }, POLL_INTERVAL);
    }
  };

  // Timeout for Realtime connection
  timeoutId = setTimeout(() => {
    console.warn('Realtime timeout, falling back to polling');
    pollIntervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
    }, POLL_INTERVAL);
  }, REALTIME_TIMEOUT);

  setupRealtime();

  return () => {
    clearTimeout(timeoutId);
    clearInterval(pollIntervalId);
  };
}, [userId, queryClient]);
```

---

## Accessibility Features

### Keyboard Navigation

All components support full keyboard navigation:

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons, open dropdowns
- **Arrow keys**: Navigate within dropdowns, tables
- **Escape**: Close dialogs, dropdowns

### Screen Reader Support

#### SLACountdown

```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <span className="sr-only">
    {t('assignments.sla_status', {
      timeRemaining: formatTime(remaining),
      status: slaStatus,
    })}
  </span>
  {/* Visual countdown */}
</div>
```

Announces:
- "Time remaining: 2 hours 15 minutes. Status: OK"
- "Assignment at risk. 25 minutes remaining. Status: Warning"
- "SLA deadline exceeded. Overdue by 15 minutes. Status: Breached"

#### AvailabilityBadge

```tsx
<span
  role="status"
  aria-label={t('assignments.availability_status', {
    status: availabilityStatus,
    until: unavailableUntil,
  })}
>
  {/* Visual badge */}
</span>
```

### Focus Management

Dialogs trap focus and restore focus on close:

```tsx
import { Dialog } from '@radix-ui/react-dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <Dialog.Content
    onOpenAutoFocus={(e) => {
      // Focus first input on open
      e.preventDefault();
      firstInputRef.current?.focus();
    }}
    onCloseAutoFocus={() => {
      // Restore focus to trigger button
      triggerRef.current?.focus();
    }}
  >
    {/* Dialog content */}
  </Dialog.Content>
</Dialog>
```

---

## Bilingual Support

### i18next Configuration

```typescript
// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import assignmentsEn from './en/assignments.json';
import assignmentsAr from './ar/assignments.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { assignments: assignmentsEn },
    ar: { assignments: assignmentsAr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
```

### Translation Files

**English** (`frontend/src/i18n/en/assignments.json`):
```json
{
  "sla_status_ok": "Time remaining: {{timeRemaining}}",
  "sla_status_warning": "At risk: {{timeRemaining}} remaining",
  "sla_status_breached": "Overdue by {{timeOverdue}}",
  "priority_urgent": "Urgent",
  "priority_high": "High",
  "priority_normal": "Normal",
  "priority_low": "Low"
}
```

**Arabic** (`frontend/src/i18n/ar/assignments.json`):
```json
{
  "sla_status_ok": "الوقت المتبقي: {{timeRemaining}}",
  "sla_status_warning": "في خطر: {{timeRemaining}} متبقي",
  "sla_status_breached": "متأخر بمقدار {{timeOverdue}}",
  "priority_urgent": "عاجل",
  "priority_high": "عالي",
  "priority_normal": "عادي",
  "priority_low": "منخفض"
}
```

### RTL Support

Tailwind CSS RTL plugin handles directionality:

```tsx
// Auto-reverses on RTL
<div className="ml-4"> {/* becomes mr-4 in RTL */}
  <SLACountdown />
</div>

// Manual RTL styling
<div className="flex flex-row-reverse rtl:flex-row">
  {/* Content */}
</div>
```

---

## Performance Optimization

### Code Splitting

```tsx
// Lazy load components
const AssignmentQueue = lazy(() => import('@/components/assignments/AssignmentQueue'));

function QueuePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AssignmentQueue />
    </Suspense>
  );
}
```

### Memoization

```tsx
// Memoize expensive calculations
const slaStatus = useMemo(() => {
  const elapsed = (Date.now() - assignedAt.getTime()) / (slaDeadline.getTime() - assignedAt.getTime());
  if (elapsed >= 1) return 'breached';
  if (elapsed >= 0.75) return 'warning';
  return 'ok';
}, [assignedAt, slaDeadline]);

// Memoize callbacks
const handleAssign = useCallback(() => {
  autoAssign({ workItemId, workItemType, requiredSkills, priority });
}, [workItemId, workItemType, requiredSkills, priority]);
```

### Query Optimization

```tsx
// Prefetch related data
const queryClient = useQueryClient();

const prefetchQueue = () => {
  queryClient.prefetchQuery({
    queryKey: ['assignment-queue'],
    queryFn: fetchQueue,
  });
};

// Use on hover to prefetch queue before navigation
<Link to="/queue" onMouseEnter={prefetchQueue}>
  View Queue
</Link>
```

---

## Testing

### Component Tests

```tsx
// frontend/tests/unit/components.test.tsx
import { render, screen } from '@testing-library/react';
import { SLACountdown } from '@/components/assignments/SLACountdown';

test('displays green status when SLA < 75% elapsed', () => {
  const assignedAt = new Date('2025-10-02T10:00:00Z');
  const slaDeadline = new Date('2025-10-02T12:00:00Z'); // 2 hours

  render(<SLACountdown assignmentId="test" assignedAt={assignedAt} slaDeadline={slaDeadline} />);

  expect(screen.getByRole('status')).toHaveTextContent(/remaining/i);
  expect(screen.getByRole('status')).toHaveClass('text-green-600');
});
```

### E2E Tests

```typescript
// frontend/tests/e2e/sla-countdown-display.spec.ts
import { test, expect } from '@playwright/test';

test('SLA countdown updates every second', async ({ page }) => {
  await page.goto('/assignments/my-assignments');

  // Get initial countdown
  const initial = await page.locator('[role="status"]').textContent();

  // Wait 2 seconds
  await page.waitForTimeout(2000);

  // Get updated countdown
  const updated = await page.locator('[role="status"]').textContent();

  // Should have decreased
  expect(initial).not.toEqual(updated);
});
```

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
**Maintained By**: GASTAT Frontend Team
