/**
 * Intake Queue Route - DEPRECATED
 *
 * This route now redirects to /my-work/intake which provides
 * the unified intake queue experience with:
 * - AI triage suggestions
 * - Pull-to-refresh
 * - Batch classification
 * - Mobile-first design
 *
 * The old Queue.tsx component is retained for backwards compatibility
 * but users are directed to the enhanced experience.
 *
 * @deprecated Use /my-work/intake instead
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/intake/queue')({
  beforeLoad: () => {
    // Redirect to the unified intake queue at /my-work/intake
    throw redirect({
      to: '/my-work/intake',
      replace: true,
    })
  },
  component: () => null, // Never renders due to redirect
})
