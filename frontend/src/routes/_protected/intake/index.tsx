/**
 * Intake Index Route
 *
 * Redirects to the unified intake queue at /my-work/intake
 */
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/intake/')({
  component: IntakeIndex,
})

function IntakeIndex() {
  return <Navigate to="/my-work/intake" />
}
