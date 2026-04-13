/**
 * Compliance Rules Demo Page
 * Feature: compliance-rules-management
 *
 * Demo page for testing compliance rules, violations, and sign-off functionality.
 */

import { createFileRoute } from '@tanstack/react-router'
import { devModeGuard } from '@/lib/dev-mode-guard'
import { ComplianceRulesManager } from '@/components/compliance/ComplianceRulesManager'

export const Route = createFileRoute('/_protected/compliance-demo')({
  beforeLoad: devModeGuard,
  component: ComplianceDemo,
})

function ComplianceDemo() {
  return (
    <div className="container mx-auto py-6">
      <ComplianceRulesManager />
    </div>
  )
}
