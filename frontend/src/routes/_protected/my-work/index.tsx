/**
 * Feature 032: Unified Work Management - My Work Dashboard
 *
 * This is the unified "My Work" dashboard that combines:
 * - Commitments (from aa_commitments)
 * - Tasks (from tasks table)
 * - Intake Tickets (from intake_tickets table)
 *
 * Features:
 * - Summary stats header (total active, overdue, due today/week)
 * - Productivity metrics (completion rate, avg completion time)
 * - Tabbed view by source (All, Commitments, Tasks, Intake)
 * - Filter by tracking type (Delivery, Follow-up, SLA)
 * - Cursor-based pagination with infinite scroll
 * - URL state sync for filters
 * - Real-time updates with debouncing
 * - Mobile-first, RTL-compatible design
 */

import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import MyWorkDashboard from '@/pages/my-work/MyWorkDashboard';

// URL search params schema for type-safe routing
const myWorkSearchSchema = z.object({
  tab: z.enum(['all', 'commitments', 'tasks', 'intake']).optional().default('all'),
  filter: z.enum(['active', 'overdue', 'due-today', 'due-week']).optional(),
  trackingType: z.enum(['delivery', 'follow_up', 'sla']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['deadline', 'created_at', 'priority']).optional().default('deadline'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type MyWorkSearchParams = z.infer<typeof myWorkSearchSchema>;

export const Route = createFileRoute('/_protected/my-work/')({
  component: MyWorkDashboard,
  validateSearch: (search) => myWorkSearchSchema.parse(search),
});
