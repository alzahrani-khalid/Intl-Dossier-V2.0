/**
 * IntakePromotionDialog
 *
 * Modal dialog for promoting an intake ticket to an engagement.
 * Pre-maps fields from the ticket with editable overrides.
 * Requires engagement_type and engagement_category selection.
 *
 * Uses AlertDialog pattern (consistent with existing archive dialog).
 * All text from lifecycle i18n namespace.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import type { TicketDetailResponse } from '@/types/intake'
import type { IntakePromotionRequest } from '@/types/lifecycle.types'
import type {
  EngagementType,
  EngagementCategory,
} from '@/types/engagement.types'
import {
  ENGAGEMENT_TYPE_LABELS,
  ENGAGEMENT_CATEGORY_LABELS,
} from '@/types/engagement.types'

// ============================================================================
// Props
// ============================================================================

interface IntakePromotionDialogProps {
  ticket: TicketDetailResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  onPromote: (data: IntakePromotionRequest) => void
  isPending?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function IntakePromotionDialog({
  ticket,
  open,
  onOpenChange,
  onPromote,
  isPending = false,
}: IntakePromotionDialogProps): React.JSX.Element {
  const { t, i18n } = useTranslation('lifecycle')
  const isRTL = i18n.language === 'ar'

  // ---------------------------------------------------------------------------
  // Field state — pre-populated from ticket
  // ---------------------------------------------------------------------------
  const [titleEn, setTitleEn] = useState<string>(ticket.title ?? '')
  const [titleAr, setTitleAr] = useState<string>(ticket.titleAr ?? '')
  const [objectivesEn, setObjectivesEn] = useState<string>(
    ticket.description ?? '',
  )
  const [objectivesAr, setObjectivesAr] = useState<string>(
    ticket.descriptionAr ?? '',
  )
  const [engagementType, setEngagementType] = useState<string>('')
  const [engagementCategory, setEngagementCategory] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Linked dossiers (read-only display)
  // ---------------------------------------------------------------------------
  const linkedDossierIds = useMemo<string[]>(() => {
    if (ticket.dossierId != null) {
      return [ticket.dossierId]
    }
    return []
  }, [ticket.dossierId])

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const isValid = useMemo<boolean>(() => {
    return (
      titleEn.trim().length > 0 &&
      engagementType.length > 0 &&
      engagementCategory.length > 0
    )
  }, [titleEn, engagementType, engagementCategory])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleConfirm = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault()
      if (!isValid || isPending) return

      const request: IntakePromotionRequest = {
        ticket_id: ticket.id,
        title_en: titleEn.trim(),
        title_ar: titleAr.trim(),
        objectives_en: objectivesEn.trim() || undefined,
        objectives_ar: objectivesAr.trim() || undefined,
        engagement_type: engagementType,
        engagement_category: engagementCategory,
        dossier_links:
          linkedDossierIds.length > 0 ? linkedDossierIds : undefined,
      }
      onPromote(request)
    },
    [
      isValid,
      isPending,
      ticket.id,
      titleEn,
      titleAr,
      objectivesEn,
      objectivesAr,
      engagementType,
      engagementCategory,
      linkedDossierIds,
      onPromote,
    ],
  )

  // ---------------------------------------------------------------------------
  // Engagement type/category options
  // ---------------------------------------------------------------------------
  const typeEntries = useMemo(
    () => Object.entries(ENGAGEMENT_TYPE_LABELS) as [EngagementType, { en: string; ar: string }][],
    [],
  )
  const categoryEntries = useMemo(
    () =>
      Object.entries(ENGAGEMENT_CATEGORY_LABELS) as [
        EngagementCategory,
        { en: string; ar: string },
      ][],
    [],
  )

  // ---------------------------------------------------------------------------
  // Shared input classes
  // ---------------------------------------------------------------------------
  const inputClasses =
    'w-full min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm text-start ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  const labelClasses = 'block text-sm font-medium text-foreground mb-1'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="mx-4 max-w-lg overflow-y-auto max-h-[85vh]"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-start">
            {t('promotion.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-start">
            {t('promotion.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Form fields */}
        <div className="grid gap-4 py-2">
          {/* Title EN (required) */}
          <div>
            <label htmlFor="promo-title-en" className={labelClasses}>
              {t('promotion.titleEn')} *
            </label>
            <input
              id="promo-title-en"
              type="text"
              value={titleEn}
              onChange={(e): void => setTitleEn(e.target.value)}
              className={inputClasses}
              disabled={isPending}
              dir="ltr"
            />
          </div>

          {/* Title AR */}
          <div>
            <label htmlFor="promo-title-ar" className={labelClasses}>
              {t('promotion.titleAr')}
            </label>
            <input
              id="promo-title-ar"
              type="text"
              value={titleAr}
              onChange={(e): void => setTitleAr(e.target.value)}
              className={inputClasses}
              disabled={isPending}
              dir="rtl"
            />
          </div>

          {/* Engagement Type (required) */}
          <div>
            <label htmlFor="promo-eng-type" className={labelClasses}>
              {t('promotion.engagementType')} *
            </label>
            <select
              id="promo-eng-type"
              value={engagementType}
              onChange={(e): void => setEngagementType(e.target.value)}
              className={inputClasses}
              disabled={isPending}
            >
              <option value="">{t('promotion.selectType')}</option>
              {typeEntries.map(([key, label]) => (
                <option key={key} value={key}>
                  {isRTL ? label.ar : label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Engagement Category (required) */}
          <div>
            <label htmlFor="promo-eng-cat" className={labelClasses}>
              {t('promotion.engagementCategory')} *
            </label>
            <select
              id="promo-eng-cat"
              value={engagementCategory}
              onChange={(e): void => setEngagementCategory(e.target.value)}
              className={inputClasses}
              disabled={isPending}
            >
              <option value="">{t('promotion.selectCategory')}</option>
              {categoryEntries.map(([key, label]) => (
                <option key={key} value={key}>
                  {isRTL ? label.ar : label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Objectives EN */}
          <div>
            <label htmlFor="promo-obj-en" className={labelClasses}>
              {t('promotion.objectivesEn')}
            </label>
            <textarea
              id="promo-obj-en"
              value={objectivesEn}
              onChange={(e): void => setObjectivesEn(e.target.value)}
              className={`${inputClasses} min-h-20 resize-y`}
              rows={3}
              disabled={isPending}
              dir="ltr"
            />
          </div>

          {/* Objectives AR */}
          <div>
            <label htmlFor="promo-obj-ar" className={labelClasses}>
              {t('promotion.objectivesAr')}
            </label>
            <textarea
              id="promo-obj-ar"
              value={objectivesAr}
              onChange={(e): void => setObjectivesAr(e.target.value)}
              className={`${inputClasses} min-h-20 resize-y`}
              rows={3}
              disabled={isPending}
              dir="rtl"
            />
          </div>

          {/* Linked Dossiers (read-only) */}
          {linkedDossierIds.length > 0 && (
            <div>
              <span className={labelClasses}>
                {t('promotion.linkedDossiers')}
              </span>
              <div className="flex flex-wrap gap-2">
                {linkedDossierIds.map((id) => (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="min-h-11">
            {t('promotion.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid || isPending}
            className="min-h-11"
          >
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('promotion.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default IntakePromotionDialog
