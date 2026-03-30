/**
 * ForumSessionCreator
 *
 * Sheet-based form for creating a forum session child engagement
 * from a parent forum dossier. Pre-fills location and title pattern
 * from the parent forum.
 *
 * Uses Sheet (not AlertDialog) — more fields benefit from the larger canvas.
 * Sheet side="right" handles RTL direction automatically via logical properties.
 * All text from lifecycle i18n namespace.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import type { Forum } from '@/types/forum.types'
import type { ForumSessionCreateRequest } from '@/types/lifecycle.types'

// ============================================================================
// Props
// ============================================================================

interface ForumSessionCreatorProps {
  forum: Forum
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSession: (data: ForumSessionCreateRequest) => void
  isPending?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function ForumSessionCreator({
  forum,
  open,
  onOpenChange,
  onCreateSession,
  isPending = false,
}: ForumSessionCreatorProps): React.JSX.Element {
  const { t, i18n } = useTranslation('lifecycle')
  const isRTL = i18n.language === 'ar'

  // ---------------------------------------------------------------------------
  // Pre-filled field state from parent forum
  // ---------------------------------------------------------------------------
  const sessionNumber = (forum.extension?.number_of_sessions ?? 0) + 1

  const [titleEn, setTitleEn] = useState<string>(
    `${forum.name_en} - Session ${String(sessionNumber)}`,
  )
  const [titleAr, setTitleAr] = useState<string>(
    forum.name_ar != null && forum.name_ar.length > 0
      ? `${forum.name_ar} - ${t('forumSession.cta')} ${String(sessionNumber)}`
      : '',
  )
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [locationEn, setLocationEn] = useState<string>(
    forum.extension?.keynote_speakers != null ? '' : '',
  )
  const [locationAr, setLocationAr] = useState<string>('')
  const [descriptionEn, setDescriptionEn] = useState<string>('')
  const [descriptionAr, setDescriptionAr] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const endDateValid = useMemo<boolean>(() => {
    if (startDate.length === 0 || endDate.length === 0) return true
    return endDate >= startDate
  }, [startDate, endDate])

  const isValid = useMemo<boolean>(() => {
    return (
      titleEn.trim().length > 0 &&
      startDate.length > 0 &&
      endDate.length > 0 &&
      endDateValid
    )
  }, [titleEn, startDate, endDate, endDateValid])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleConfirm = useCallback((): void => {
    if (!isValid || isPending) return

    const request: ForumSessionCreateRequest = {
      parent_forum_id: forum.id,
      title_en: titleEn.trim(),
      title_ar: titleAr.trim(),
      start_date: startDate,
      end_date: endDate,
      location_en: locationEn.trim() || undefined,
      location_ar: locationAr.trim() || undefined,
      description_en: descriptionEn.trim() || undefined,
      description_ar: descriptionAr.trim() || undefined,
    }
    onCreateSession(request)
  }, [
    isValid,
    isPending,
    forum.id,
    titleEn,
    titleAr,
    startDate,
    endDate,
    locationEn,
    locationAr,
    descriptionEn,
    descriptionAr,
    onCreateSession,
  ])

  // ---------------------------------------------------------------------------
  // Shared input classes
  // ---------------------------------------------------------------------------
  const inputClasses =
    'w-full min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm text-start ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  const labelClasses = 'block text-sm font-medium text-foreground mb-1'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SheetHeader>
          <SheetTitle className="text-start">
            {t('forumSession.title')}
          </SheetTitle>
          <SheetDescription className="text-start">
            {t('forumSession.description', {
              forumName: isRTL ? forum.name_ar : forum.name_en,
            })}
          </SheetDescription>
        </SheetHeader>

        {/* Form fields */}
        <div className="grid gap-4 py-4">
          {/* Title EN (required) */}
          <div>
            <label htmlFor="session-title-en" className={labelClasses}>
              {t('forumSession.titleEn')} *
            </label>
            <input
              id="session-title-en"
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
            <label htmlFor="session-title-ar" className={labelClasses}>
              {t('forumSession.titleAr')}
            </label>
            <input
              id="session-title-ar"
              type="text"
              value={titleAr}
              onChange={(e): void => setTitleAr(e.target.value)}
              className={inputClasses}
              disabled={isPending}
              dir="rtl"
            />
          </div>

          {/* Date row — stacked on mobile, side-by-side on sm+ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Start Date (required) */}
            <div>
              <label htmlFor="session-start" className={labelClasses}>
                {t('forumSession.startDate')} *
              </label>
              <input
                id="session-start"
                type="date"
                value={startDate}
                onChange={(e): void => setStartDate(e.target.value)}
                className={inputClasses}
                disabled={isPending}
              />
            </div>

            {/* End Date (required) */}
            <div>
              <label htmlFor="session-end" className={labelClasses}>
                {t('forumSession.endDate')} *
              </label>
              <input
                id="session-end"
                type="date"
                value={endDate}
                onChange={(e): void => setEndDate(e.target.value)}
                className={inputClasses}
                disabled={isPending}
              />
              {!endDateValid && (
                <p className="mt-1 text-xs text-destructive">
                  {t('forumSession.endDateError')}
                </p>
              )}
            </div>
          </div>

          {/* Location EN */}
          <div>
            <label htmlFor="session-loc-en" className={labelClasses}>
              {t('forumSession.locationEn')}
            </label>
            <input
              id="session-loc-en"
              type="text"
              value={locationEn}
              onChange={(e): void => setLocationEn(e.target.value)}
              className={inputClasses}
              disabled={isPending}
              dir="ltr"
            />
          </div>

          {/* Location AR */}
          <div>
            <label htmlFor="session-loc-ar" className={labelClasses}>
              {t('forumSession.locationAr')}
            </label>
            <input
              id="session-loc-ar"
              type="text"
              value={locationAr}
              onChange={(e): void => setLocationAr(e.target.value)}
              className={inputClasses}
              disabled={isPending}
              dir="rtl"
            />
          </div>

          {/* Description EN */}
          <div>
            <label htmlFor="session-desc-en" className={labelClasses}>
              {t('forumSession.descriptionEn')}
            </label>
            <textarea
              id="session-desc-en"
              value={descriptionEn}
              onChange={(e): void => setDescriptionEn(e.target.value)}
              className={`${inputClasses} min-h-20 resize-y`}
              rows={3}
              disabled={isPending}
              dir="ltr"
            />
          </div>

          {/* Description AR */}
          <div>
            <label htmlFor="session-desc-ar" className={labelClasses}>
              {t('forumSession.descriptionAr')}
            </label>
            <textarea
              id="session-desc-ar"
              value={descriptionAr}
              onChange={(e): void => setDescriptionAr(e.target.value)}
              className={`${inputClasses} min-h-20 resize-y`}
              rows={3}
              disabled={isPending}
              dir="rtl"
            />
          </div>
        </div>

        <SheetFooter>
          <button
            type="button"
            onClick={(): void => onOpenChange(false)}
            disabled={isPending}
            className="min-h-11 rounded-md px-4 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {t('forumSession.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
            className="min-h-11 inline-flex items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('forumSession.confirm')}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default ForumSessionCreator
