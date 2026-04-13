/**
 * DossierCreatePage Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T058)
 *
 * Simplified page for creating new dossiers using the multi-step wizard.
 * Goes directly to type selection, then wizard flow with AI field assist.
 *
 * Features:
 * - Direct wizard flow (no template gallery)
 * - AI-assisted field pre-fill in Step 1
 * - Mobile-first responsive layout (320px → desktop)
 * - RTL support via logical properties
 * - Multi-step wizard with progress indicator
 * - Draft saving to localStorage
 * - Conditional field visibility
 * - Form validation and error handling
 * - Success redirect to detail page
 * - Touch-friendly UI (44x44px min)
 * - Accessibility compliant (WCAG AA)
 */

import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DossierCreateWizard } from '@/components/dossier/DossierCreateWizard'
import { cn } from '@/lib/utils'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import type { DossierType } from '@/services/dossier-api'
import { useDirection } from '@/hooks/useDirection'

export function DossierCreatePage() {
  const { t } = useTranslation('dossier')
  const { isRTL } = useDirection()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate({ to: '/dossiers' })
  }

  const handleSuccess = (dossierId: string, dossierType?: DossierType) => {
    navigate({ to: getDossierDetailPath(dossierId, dossierType) })
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start">
            {t('create.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1 sm:mt-2">
            {t('create.subtitleSelectType')}
          </p>
        </div>
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="self-start sm:self-center min-h-11"
        >
          <ArrowLeft className={cn('h-4 w-4', isRTL ? 'ms-2 rotate-180' : 'me-2')} />
          {t('create.cancel')}
        </Button>
      </div>

      {/* Main Content - Wizard directly */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-4 sm:p-6">
          <DossierCreateWizard onSuccess={handleSuccess} onCancel={handleBack} />
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="max-w-4xl mx-auto mt-4 sm:mt-6 p-4 bg-muted rounded-lg">
        <p className="text-xs sm:text-sm text-muted-foreground text-start">
          <strong>{t('create.helpTitle')}:</strong> {t('create.helpText')}
        </p>
      </div>
    </div>
  )
}
