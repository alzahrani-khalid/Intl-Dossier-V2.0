/**
 * Duplicate Detection Demo Page
 * Feature: entity-duplicate-detection
 *
 * Demo page to test duplicate detection and merge functionality
 */

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { DuplicateCandidatesList, MergeDialog } from '@/components/duplicate-detection'
import type { DuplicateCandidateListItem } from '@/types/duplicate-detection.types'

export const Route = createFileRoute('/_protected/duplicate-detection-demo')({
  component: DuplicateDetectionDemoPage,
})

function DuplicateDetectionDemoPage() {
  const { t, i18n } = useTranslation('duplicate-detection')
  const isRTL = i18n.language === 'ar'

  const [selectedCandidate, setSelectedCandidate] = useState<DuplicateCandidateListItem | null>(
    null,
  )
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)

  const handleMerge = (candidate: DuplicateCandidateListItem) => {
    setSelectedCandidate(candidate)
    setIsMergeDialogOpen(true)
  }

  const handleViewDetails = (candidate: DuplicateCandidateListItem) => {
    // For demo, open merge dialog to show details
    setSelectedCandidate(candidate)
    setIsMergeDialogOpen(true)
  }

  const handleCloseMergeDialog = () => {
    setIsMergeDialogOpen(false)
    setSelectedCandidate(null)
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('duplicate_candidates', 'Duplicate Detection')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('duplicate_candidates_desc', 'Review and manage potential duplicate entities')}
        </p>
      </div>

      {/* Main Content */}
      <DuplicateCandidatesList onMerge={handleMerge} onViewDetails={handleViewDetails} />

      {/* Merge Dialog */}
      <MergeDialog
        isOpen={isMergeDialogOpen}
        onClose={handleCloseMergeDialog}
        candidate={selectedCandidate}
      />
    </div>
  )
}

export default DuplicateDetectionDemoPage
