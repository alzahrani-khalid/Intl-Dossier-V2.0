/**
 * Intake Queue Route (FR-033)
 *
 * Work-Queue-First Navigation: Priority route for new requests
 * Displays incoming tickets awaiting triage and classification
 * - AI triage suggestions
 * - Batch classification
 * - Quick preview and action buttons
 * - Filter by source, priority, date
 * - SLA countdown for triage deadlines
 */

import { createFileRoute } from '@tanstack/react-router'
import { IntakeQueuePage } from '../../../pages/IntakeQueue'

export const Route = createFileRoute('/_protected/my-work/intake')({
 component: IntakeQueuePage,
})
