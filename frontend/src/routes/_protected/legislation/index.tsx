/**
 * Legislation list (index child of the /legislation layout)
 *
 * Phase 95 DEAD-08: the list body moved out of `legislation.tsx` so that file
 * could become a layout with an <Outlet/> and make `legislation/$id.tsx`
 * reachable. `validateSearch` still lives on the layout route, so the search
 * params are read from it via `getRouteApi`.
 */

import { useState, useCallback } from 'react'
import { createFileRoute, getRouteApi, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LegislationList } from '@/components/legislation'
import { LegislationForm } from '@/components/legislation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const legislationLayoutRoute = getRouteApi('/_protected/legislation')

export const Route = createFileRoute('/_protected/legislation/')({
  component: LegislationPage,
})

function LegislationPage() {
  const { t } = useTranslation('legislation')
  const navigate = useNavigate()
  const searchParams = legislationLayoutRoute.useSearch()

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCreateClick = useCallback(() => {
    setIsCreateOpen(true)
  }, [])

  const handleCreateSuccess = useCallback(
    (id: string) => {
      setIsCreateOpen(false)
      navigate({
        to: '/legislation/$id',
        params: { id } as any,
      })
    },
    [navigate],
  )

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <LegislationList dossierId={searchParams.dossierId} onCreateClick={handleCreateClick} />

      {/* Create Legislation Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
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
