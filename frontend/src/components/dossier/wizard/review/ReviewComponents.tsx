/**
 * ReviewComponents -- Shared review helpers for all wizard review steps (Plan 28-01, Task 1)
 *
 * Extracted from CountryReviewStep.tsx to prevent duplication across
 * country, organization, topic, and person review steps.
 */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// ReviewSection
// ---------------------------------------------------------------------------

interface ReviewSectionProps {
  title: string
  onEdit: () => void
  children: React.ReactNode
}

export function ReviewSection({ title, onEdit, children }: ReviewSectionProps): ReactElement {
  const { t } = useTranslation('form-wizard')
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="min-h-11 min-w-11 text-accent-foreground"
        >
          <Pencil className="h-4 w-4 me-1" />
          {t('review.edit')}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReviewField
// ---------------------------------------------------------------------------

interface ReviewFieldProps {
  label: string
  value: string | undefined
}

export function ReviewField({ label, value }: ReviewFieldProps): ReactElement {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">
        {value !== undefined && value !== '' ? (
          value
        ) : (
          <span className="text-muted-foreground italic">--</span>
        )}
      </dd>
    </div>
  )
}
