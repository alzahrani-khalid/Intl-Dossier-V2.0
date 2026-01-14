/**
 * Compliance Rules Demo Page
 * Feature: compliance-rules-management
 *
 * Demo page for testing compliance rules, violations, and sign-off functionality.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import { ComplianceRulesManager } from '@/components/compliance/ComplianceRulesManager'

export const Route = createFileRoute('/_protected/compliance-demo')({
  component: ComplianceDemo,
})

function ComplianceDemo() {
  const { i18n } = useTranslation('compliance')
  const isRTL = i18n.language === 'ar'

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ComplianceRulesManager />
    </div>
  )
}
