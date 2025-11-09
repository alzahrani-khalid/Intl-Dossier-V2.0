/**
 * Waiting Queue Route (FR-033)
 *
 * Work-Queue-First Navigation: Priority route for blocked items
 * Displays work items awaiting external dependencies or approvals
 * - Items waiting for approvals
 * - Items waiting for external responses
 * - Items waiting for capacity
 * - Aging indicators
 * - Escalation actions
 */

import { createFileRoute } from '@tanstack/react-router'
import { WaitingQueuePage } from '../../../pages/WaitingQueue'

export const Route = createFileRoute('/_protected/my-work/waiting')({
 component: WaitingQueuePage,
})
