/**
 * Legislation Page
 * Main legislation listing page with filtering and search
 */

import { useState, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LegislationList } from '@/components/Legislation'
import { LegislationForm } from '@/components/Legislation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type {
  LegislationType,
  LegislationStatus,
  LegislationPriority,
} from '@/types/legislation.types'

// Search params schema for URL filter synchronization
interface LegislationSearchParams {
  type?: string // Comma-separated type values
  status?: string // Comma-separated status values
  priority?: string // Comma-separated priority values
  jurisdiction?: string
  search?: string
  dossierId?: string
  hasOpenCommentPeriod?: boolean
  hasUpcomingDeadlines?: boolean
}

export const Route = createFileRoute('/_protected/legislation')({
  component: LegislationPage,
  validateSearch: (search: Record<string, unknown>): LegislationSearchParams => {
    return {
      type: search.type as string | undefined,
      status: search.status as string | undefined,
      priority: search.priority as string | undefined,
      jurisdiction: search.jurisdiction as string | undefined,
      search: search.search as string | undefined,
      dossierId: search.dossierId as string | undefined,
      hasOpenCommentPeriod:
        search.hasOpenCommentPeriod === 'true' || search.hasOpenCommentPeriod === true,
      hasUpcomingDeadlines:
        search.hasUpcomingDeadlines === 'true' || search.hasUpcomingDeadlines === true,
    }
  },
})

function LegislationPage() {
  const { t, i18n } = useTranslation('legislation')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate({ from: Route.fullPath })
  const searchParams = Route.useSearch()

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCreateClick = useCallback(() => {
    setIsCreateOpen(true)
  }, [])

  const handleCreateSuccess = useCallback(
    (id: string) => {
      setIsCreateOpen(false)
      navigate({
        to: '/legislation/$id',
        params: { id },
      })
    },
    [navigate],
  )

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <LegislationList dossierId={searchParams.dossierId} onCreateClick={handleCreateClick} />

      {/* Create Legislation Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-start">{t('form.title.create')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <LegislationForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
