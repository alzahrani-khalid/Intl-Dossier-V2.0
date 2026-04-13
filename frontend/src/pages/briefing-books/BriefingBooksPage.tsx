/**
 * BriefingBooksPage Component
 * Feature: briefing-book-generator
 *
 * Main page for briefing books management with list and builder views.
 * Mobile-first with RTL support.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Plus, ArrowLeft } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { BriefingBookBuilder, BriefingBooksList } from '@/components/briefing-books'
import { useDirection } from '@/hooks/useDirection'

type ViewMode = 'list' | 'builder'

function BriefingBooksPage() {
  const { t } = useTranslation('briefing-books')
  const { isRTL } = useDirection()
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const handleCreateNew = useCallback(() => {
    setViewMode('builder')
  }, [])

  const handleBuilderSuccess = useCallback(() => {
    setViewMode('list')
  }, [])

  const handleBuilderCancel = useCallback(() => {
    setViewMode('list')
  }, [])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <m.div
            key="list"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Page header */}
            <PageHeader
              icon={<FileText className="h-6 w-6" />}
              title={t('title')}
              subtitle={t('subtitle')}
              actions={
                <Button onClick={handleCreateNew} className="w-full sm:w-auto min-h-[44px]">
                  <Plus className="h-4 w-4 me-2" />
                  {t('newBriefingBook')}
                </Button>
              }
            />

            {/* Briefing books list */}
            <BriefingBooksList onCreateNew={handleCreateNew} />
          </m.div>
        ) : (
          <m.div
            key="builder"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Back button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={handleBuilderCancel}
                className="gap-2 min-h-[44px] -ms-2"
              >
                {isRTL ? (
                  <>
                    {t('myBriefingBooks')}
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4" />
                    {t('myBriefingBooks')}
                  </>
                )}
              </Button>
            </div>

            {/* Builder */}
            <BriefingBookBuilder onSuccess={handleBuilderSuccess} onCancel={handleBuilderCancel} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BriefingBooksPage
