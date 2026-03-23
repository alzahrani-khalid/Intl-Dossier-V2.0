/**
 * My Assignments Route (FR-033)
 *
 * Work-Queue-First Navigation: Priority route for active work items
 * Displays user's assigned tasks in Kanban board format
 * - Columns: Assigned, In Progress, Under Review, Completed
 * - SLA countdown with color-coded urgency
 * - Drag-and-drop to change status
 * - Filters by dossier, type, priority
 */

import { createFileRoute } from '@tanstack/react-router'
import { MyAssignmentsPage } from '../../../pages/MyAssignments'

export const Route = createFileRoute('/_protected/my-work/assignments')({
  component: MyAssignmentsPage,
})
