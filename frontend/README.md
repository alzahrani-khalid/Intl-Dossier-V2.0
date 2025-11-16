# GASTAT International Dossier System - Frontend

**Tech Stack**: React 19 + TypeScript 5.8+ + Vite + TanStack Router/Query + Tailwind CSS + shadcn/ui

## Overview

Frontend application for the GASTAT International Dossier System, featuring relationship management, commitment tracking, and health score monitoring.

---

## Quick Start

### Prerequisites

- Node.js 18+ LTS
- pnpm 10.x+
- Supabase CLI (for local development)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
# App runs at http://localhost:5173
```

### Environment Variables

Create `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Feature Flags
VITE_ENABLE_HEALTH_SCORES=true
VITE_ENABLE_COMMITMENT_TRACKING=true
```

---

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui + Aceternity UI components
│   │   ├── DossierStats.tsx # Dossier statistics panel (User Story 1)
│   │   ├── commitments/
│   │   │   ├── CommitmentsList.tsx           # Commitment list with status badges (US3)
│   │   │   └── PersonalCommitmentsDashboard.tsx # Personal commitment tracker (US3)
│   │   └── notifications/
│   │       └── NotificationBell.tsx # Real-time notifications (US4)
│   ├── hooks/               # Custom React hooks
│   │   ├── useDossierStats.ts              # Dossier stats query hook (US1)
│   │   ├── useHealthScore.ts               # Health score calculation hook (US1)
│   │   ├── useBulkDossierStats.ts          # Bulk stats for dashboard (US2)
│   │   ├── useDashboardHealthAggregations.ts # Dashboard aggregations (US2)
│   │   └── useNotifications.ts             # Real-time notifications (US4)
│   ├── services/            # API service layer
│   │   ├── dossier-stats.service.ts # Dossier stats API client (US1, US2)
│   │   └── notification.service.ts   # Notification API client (US4)
│   ├── pages/               # Page components
│   │   ├── Dashboard/
│   │   │   └── components/
│   │   │       └── RelationshipHealthChart.tsx # Regional health chart (US2)
│   │   └── Dossiers/
│   │       └── DossierDetail.tsx # Dossier detail page with stats (US1)
│   └── lib/                 # Utilities and configurations
│       ├── supabase.ts      # Supabase client
│       └── utils.ts         # Utility functions
├── public/                  # Static assets
├── components.json          # shadcn/ui configuration
└── package.json
```

---

## Key Features

### 030-health-commitment: Relationship Health & Commitment Intelligence

#### User Story 1: View Accurate Dossier Stats

**Components**:
- `DossierStats.tsx`: Displays real-time statistics panel
  - Active commitments count
  - Overdue commitments (with warning indicator)
  - Total documents
  - Recent activity (90-day engagement count)
  - Health score with color-coded indicator (green/yellow/orange/red)

**Hooks**:
- `useDossierStats(dossierId)`: Fetches single dossier stats with 5-minute cache
  - Query key: `['dossierStats', dossierId]`
  - Stale time: 5 minutes
  - Background refetch: Every 5 minutes
  - Refetch on window focus: Enabled

- `useHealthScore(dossierId)`: On-demand health score calculation
  - Query key: `['healthScore', dossierId]`
  - Stale time: 5 minutes

**API Service**:
- `dossier-stats.service.ts`:
  - `getStats(dossierId, include?)`: GET single dossier stats
  - `calculateHealthScore(dossierId, forceRecalculation?)`: POST health calculation

**Usage Example**:
```tsx
import { useDossierStats } from '@/hooks/useDossierStats';
import { DossierStats } from '@/components/DossierStats';

function DossierDetailPage({ dossierId }: { dossierId: string }) {
  const { data: stats, isLoading, error } = useDossierStats(dossierId);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorMessage error={error} />;

  return <DossierStats stats={stats} />;
}
```

#### User Story 2: Monitor Relationship Health Across Partners

**Components**:
- `RelationshipHealthChart.tsx`: Dashboard health aggregations
  - Grouped by region/bloc/classification
  - Health distribution breakdown (excellent/good/fair/poor)
  - Auto-refresh every 5 minutes
  - Click-through navigation to filtered dossier list

**Hooks**:
- `useBulkDossierStats(dossierIds)`: Bulk stats query (max 100 dossiers)
  - Query key: `['bulkDossierStats', dossierIds]`
  - Stale time: 5 minutes
  - Enabled: Only when `dossierIds.length > 0`

- `useDashboardHealthAggregations(groupBy, filter?)`: Dashboard aggregations
  - Query key: `['dashboardHealthAggregations', groupBy, filter]`
  - Stale time: 5 minutes
  - Background refetch: Every 5 minutes (via `refetchInterval`)

**API Service**:
- `dossier-stats.service.ts`:
  - `getBulkStats(dossierIds, include?)`: POST bulk stats query
  - `getDashboardAggregations(groupBy, filter?)`: POST dashboard aggregations

**Usage Example**:
```tsx
import { useDashboardHealthAggregations } from '@/hooks/useDashboardHealthAggregations';
import { RelationshipHealthChart } from '@/pages/Dashboard/components/RelationshipHealthChart';

function Dashboard() {
  const { data: aggregations, isLoading } = useDashboardHealthAggregations('region');

  return <RelationshipHealthChart aggregations={aggregations} loading={isLoading} />;
}
```

#### User Story 3: Track Commitment Fulfillment

**Components**:
- `CommitmentsList.tsx`: Commitment list with visual indicators
  - Status badges (pending, in_progress, completed, overdue, cancelled)
  - Upcoming commitments (due within 30 days) - yellow badge
  - Overdue commitments - red badge with days overdue
  - Status update actions (pending → in_progress → completed)
  - Cache invalidation on status update

- `PersonalCommitmentsDashboard.tsx`: Personal commitment tracker
  - Filter: `owner_id = auth.uid()`
  - Sorted by `due_date ASC`
  - Dossier context (name, type)
  - Quick status update actions

**Features**:
- TanStack Query mutation for status updates
- Automatic `useDossierStats()` cache invalidation after update
- Health score recalculation triggered via backend job (within 2 minutes)

**Usage Example**:
```tsx
import { CommitmentsList } from '@/components/commitments/CommitmentsList';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CommitmentsPage() {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (data) => updateCommitmentStatus(data),
    onSuccess: (_, variables) => {
      // Invalidate dossier stats cache to refetch latest data
      queryClient.invalidateQueries({ queryKey: ['dossierStats', variables.dossierId] });
    },
  });

  return <CommitmentsList onStatusUpdate={updateStatusMutation.mutate} />;
}
```

#### User Story 4: Receive Real-Time Health Updates

**Components**:
- `NotificationBell.tsx`: Notification center
  - Unread count badge
  - Notification dropdown
  - Color-coded icons (health drop = orange, overdue = red)
  - Click-through navigation to dossier
  - Mark as read on click
  - Cache invalidation on navigation

**Hooks**:
- `useNotifications(userId)`: Real-time notification polling
  - Query key: `['notifications', userId]`
  - Stale time: 0 (always refetch)
  - Refetch interval: 30 seconds (polling)
  - Refetch on window focus: Enabled

**API Service**:
- `notification.service.ts`:
  - `getNotifications(userId, unreadOnly?)`: GET user notifications
  - `markAsRead(notificationId)`: PATCH mark notification as read

**Usage Example**:
```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNotifications } from '@/hooks/useNotifications';

function AppHeader() {
  const { data: notifications, isLoading } = useNotifications(userId);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return <NotificationBell unreadCount={unreadCount} notifications={notifications} />;
}
```

---

## TanStack Query Caching Strategy

### Cache Configuration

All data fetching uses TanStack Query with consistent caching patterns:

```typescript
// Standard cache configuration
{
  staleTime: 5 * 60 * 1000, // 5 minutes (data considered fresh)
  gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection time)
  refetchOnWindowFocus: true, // Refetch when user returns to tab
  refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes (optional)
}
```

### Cache Invalidation

Components invalidate relevant caches on user actions:

```typescript
// After commitment status update
queryClient.invalidateQueries({ queryKey: ['dossierStats', dossierId] });

// After notification read
queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
```

### Performance Benefits

- **Dashboard loads in <2s**: Cached aggregations + background refetch
- **Dossier stats load in <500ms**: Cached stats from Edge Functions
- **Health scores update within 2 minutes**: Background job + cache invalidation
- **95% cache hit rate**: 5-minute stale time balances freshness vs. performance

---

## Styling Guidelines

### Tailwind CSS + shadcn/ui

All components use Tailwind CSS for styling with shadcn/ui components for consistency.

**Configuration**: `tailwind.config.js` + `components.json`

**Component Libraries (in priority order)**:
1. **Aceternity UI** (primary): https://ui.aceternity.com
2. **Kibo-UI** (secondary fallback): https://www.kibo-ui.com
3. **shadcn/ui** (last resort): https://ui.shadcn.com

### Mobile-First & RTL Requirements

**Every component MUST**:
1. **Be Mobile-First**: Start with base styles (320-640px), scale up with breakpoints
2. **Support Arabic RTL**: Use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`)
3. **Touch-Friendly**: Minimum 44x44px touch targets (`min-h-11 min-w-11`)

**Example**:
```tsx
import { useTranslation } from 'react-i18next';

export function ResponsiveRTLComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl text-start">{t('title')}</h1>
      <button className="h-11 min-w-11 px-4 sm:px-6 ms-4 rounded-s-lg">
        {t('action')}
      </button>
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
    </div>
  );
}
```

**Never Use**: `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `left-*`, `right-*`
**Always Use**: `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`

---

## Development Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build            # Production build
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint fix
pnpm format           # Prettier format
pnpm typecheck        # TypeScript check

# Testing
pnpm test             # Run unit tests (Vitest)
pnpm test:ui          # Run tests with UI
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm test:e2e:ui      # Run E2E tests with UI
```

---

## Accessibility (WCAG AA Compliance)

All components meet WCAG AA standards:

- **Aria Labels**: Screen reader support for interactive elements
- **Contrast Ratios**: 4.5:1 minimum for normal text
- **Keyboard Navigation**: Full keyboard access for all interactive elements
- **Focus Indicators**: Visible focus states for navigation
- **RTL Support**: Proper directionality for Arabic language

**Example**:
```tsx
<button
  aria-label={`Active commitments: ${activeCount}`}
  className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
>
  Active: {activeCount}
</button>
```

---

## Performance Optimization

### TanStack Query

- **5-minute stale time**: Reduces API calls while keeping data fresh
- **Background refetch**: Updates data seamlessly without loading spinners
- **Query key patterns**: Efficient cache management and invalidation

### Code Splitting

- **Route-based splitting**: Automatic via TanStack Router
- **Component lazy loading**: `React.lazy()` for large components

### Bundle Optimization

- **Vite tree-shaking**: Removes unused code automatically
- **Dynamic imports**: Reduces initial bundle size
- **Asset optimization**: Image compression and lazy loading

---

## Troubleshooting

### Issue: Stats display zeros instead of real data

**Solution**:
1. Check Supabase environment variables in `.env.local`
2. Verify Edge Functions are deployed: `supabase functions list`
3. Check network tab for API errors
4. Verify materialized views exist: `SELECT * FROM dossier_engagement_stats;`

### Issue: Health score returns null (insufficient data)

**Solution**:
1. Check dossier has >= 3 engagements (last 365 days)
2. Check dossier has >= 1 commitment (non-cancelled)
3. Use "Insufficient Data" message component

### Issue: Dashboard health chart shows stale data

**Solution**:
1. Verify `refetchInterval: 5 * 60 * 1000` in `useDashboardHealthAggregations()` hook
2. Manually refetch: `queryClient.invalidateQueries({ queryKey: ['dashboardHealthAggregations'] })`
3. Check backend scheduled job logs for materialized view refresh

---

## Related Documentation

- **Feature Spec**: `specs/030-health-commitment/spec.md`
- **Implementation Plan**: `specs/030-health-commitment/plan.md`
- **Data Model**: `specs/030-health-commitment/data-model.md`
- **API Contracts**: `specs/030-health-commitment/contracts/`
- **Quickstart Guide**: `specs/030-health-commitment/quickstart.md`
- **Backend README**: `backend/README.md`

---

## Contributing

### Code Style

- **TypeScript strict mode**: Enabled
- **ESLint**: Enforced on commit via pre-commit hook
- **Prettier**: Auto-format on save
- **Conventional Commits**: Required for all commits

### Pull Request Checklist

- [ ] All tests passing (`pnpm test && pnpm test:e2e`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Mobile-first responsive design verified (375px viewport)
- [ ] RTL layout tested with Arabic language
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Components documented with JSDoc comments

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review feature documentation in `specs/030-health-commitment/`
3. Contact team: Slack #intl-dossier-dev channel

---

**Last Updated**: 2025-11-15
**Maintainer**: GASTAT Technical Team
