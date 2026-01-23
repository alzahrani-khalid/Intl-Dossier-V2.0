/**
 * Legislation Detail Page
 * Display single legislation with full details
 */

import { useState, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LegislationDetail, LegislationForm } from '@/components/Legislation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useLegislation } from '@/hooks/useLegislation'

export const Route = createFileRoute('/_protected/legislation/$id')({
  component: LegislationDetailPage,
})

function LegislationDetailPage() {
  const { t, i18n } = useTranslation('legislation')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { id } = Route.useParams()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const { data: legislation, refetch } = useLegislation(id)

  const handleBack = useCallback(() => {
    navigate({ to: '/legislation' })
  }, [navigate])

  const handleEdit = useCallback(() => {
    setIsEditOpen(true)
  }, [])

  const handleEditSuccess = useCallback(() => {
    setIsEditOpen(false)
    refetch()
  }, [refetch])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <LegislationDetail id={id} onBack={handleBack} onEdit={handleEdit} />

      {/* Edit Legislation Sheet */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent
          side={isRTL ? 'left' : 'right'}
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-start">{t('form.title.edit')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {legislation && (
              <LegislationForm
                legislation={legislation}
                onSuccess={handleEditSuccess}
                onCancel={() => setIsEditOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
