/**
 * Workflow Automation Route
 * No-code workflow builder for automating common processes
 */

import { createFileRoute } from '@tanstack/react-router'
import { WorkflowAutomationPage } from '@/pages/workflow-automation'

export const Route = createFileRoute('/_protected/workflow-automation')({
  component: WorkflowAutomationPage,
})
