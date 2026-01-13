/**
 * Engagements Layout Route
 * Feature: engagements-entity-management
 *
 * Layout route for engagements feature.
 * Renders child routes via Outlet.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/engagements')({
  component: () => <Outlet />,
})
