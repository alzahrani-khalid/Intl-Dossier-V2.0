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
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { BriefingBookBuilder, BriefingBooksList } from '@/components/briefing-books'

type ViewMode = 'list' | 'builder'

export function BriefingBooksPage() {
  const { t, i18n } = useTranslation('briefing-books')
  const isRTL = i18n.language === 'ar'

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
    <div
      className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Page header */}
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 sm:p-3">
                  <FileText className="size-6 text-primary sm:size-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{t('title')}</h1>
                  <p className="text-sm text-muted-foreground sm:text-base">{t('subtitle')}</p>
                </div>
              </div>
              <Button onClick={handleCreateNew} className="min-h-touch-sm w-full sm:w-auto">
                <Plus className="me-2 size-4" />
                {t('newBriefingBook')}
              </Button>
            </div>

            {/* Briefing books list */}
            <BriefingBooksList onCreateNew={handleCreateNew} />
          </motion.div>
        ) : (
          <motion.div
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
                className="-ms-2 min-h-touch-sm gap-2"
              >
                {isRTL ? (
                  <>
                    {t('myBriefingBooks')}
                    <ArrowLeft className="size-4 rotate-180" />
                  </>
                ) : (
                  <>
                    <ArrowLeft className="size-4" />
                    {t('myBriefingBooks')}
                  </>
                )}
              </Button>
            </div>

            {/* Builder */}
            <BriefingBookBuilder onSuccess={handleBuilderSuccess} onCancel={handleBuilderCancel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BriefingBooksPage
