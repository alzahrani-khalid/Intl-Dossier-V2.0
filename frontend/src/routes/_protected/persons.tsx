/**
 * Persons Layout Route
 * Feature: persons-entity-management
 *
 * Layout route for persons feature.
 * Renders child routes via Outlet.
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/persons')({
  component: () => <Outlet />,
})
