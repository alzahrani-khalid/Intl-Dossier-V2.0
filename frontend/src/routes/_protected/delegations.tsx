/**
 * Delegations Route
 * Route for delegation management page
 *
 * Feature: delegation-management
 */

import { createFileRoute } from '@tanstack/react-router'
import { DelegationManagementPage } from '@/pages/delegations'

export const Route = createFileRoute('/_protected/delegations')({
  component: DelegationManagementPage,
})
