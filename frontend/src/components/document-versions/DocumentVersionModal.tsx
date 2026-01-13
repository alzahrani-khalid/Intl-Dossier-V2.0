/**
 * DocumentVersionModal Component
 *
 * Modal for viewing document version history and comparison.
 * Combines history and comparison views in a single dialog.
 * Mobile-first with RTL support.
 */

import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { History, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentVersions } from '@/hooks/useDocumentVersions'
import { DocumentVersionHistory } from './DocumentVersionHistory'
import { DocumentVersionComparison } from './DocumentVersionComparison'
import type { DocumentVersion, DiffViewMode } from '@/types/document-version.types'
import { supabase } from '@/lib/supabase'

interface DocumentVersionModalProps {
  documentId: string
  documentName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  currentVersion?: number
  className?: string
}

export const DocumentVersionModal = memo(function DocumentVersionModal({
  documentId,
  documentName,
  open,
  onOpenChange,
  currentVersion,
  className,
}: DocumentVersionModalProps) {
  const { t, i18n } = useTranslation('document-versions')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState<'history' | 'compare'>('history')
  const [viewMode, setViewMode] = useState<DiffViewMode>('inline')

  // Version management
  const {
    versions,
    comparisonState,
    selectVersionA,
    selectVersionB,
    clearSelection,
    compareVersions,
    setViewMode: setCompareViewMode,
    refreshVersions,
  } = useDocumentVersions({ documentId, enabled: open })

  // Handle comparison
  const handleCompare = useCallback(
    async (versionA: number, versionB: number) => {
      selectVersionA(versionA)
      selectVersionB(versionB)
      await compareVersions()
      setActiveTab('compare')
    },
    [selectVersionA, selectVersionB, compareVersions],
  )

  // Handle download
  const handleDownload = useCallback(async (version: DocumentVersion) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(version.file_path)
      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = version.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }, [])

  // Handle revert success
  const handleRevertSuccess = useCallback(() => {
    refreshVersions()
    clearSelection()
    setActiveTab('history')
  }, [refreshVersions, clearSelection])

  // Handle close comparison
  const handleCloseComparison = useCallback(() => {
    clearSelection()
    setActiveTab('history')
  }, [clearSelection])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <DialogTitle className="text-base sm:text-lg">
                {t('modal.title', 'Version History')}
              </DialogTitle>
            </div>
            {documentName && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {documentName}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'history' | 'compare')}
            className="h-full flex flex-col"
          >
            <TabsList className="mx-4 sm:mx-6 mt-4 grid w-auto grid-cols-2 max-w-xs">
              <TabsTrigger value="history">{t('tabs.history', 'History')}</TabsTrigger>
              <TabsTrigger value="compare" disabled={!comparisonState.comparisonResult}>
                {t('tabs.compare', 'Compare')}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="history"
              className="flex-1 overflow-auto px-4 sm:px-6 pb-4 sm:pb-6 mt-4"
            >
              <DocumentVersionHistory
                documentId={documentId}
                currentVersion={currentVersion}
                onCompare={handleCompare}
                onRevert={handleRevertSuccess}
                onDownload={handleDownload}
                allowRevert={true}
              />
            </TabsContent>

            <TabsContent
              value="compare"
              className="flex-1 overflow-auto px-4 sm:px-6 pb-4 sm:pb-6 mt-4"
            >
              {comparisonState.comparisonResult ? (
                <DocumentVersionComparison
                  comparisonResult={comparisonState.comparisonResult}
                  viewMode={viewMode}
                  onViewModeChange={(mode) => {
                    setViewMode(mode)
                    setCompareViewMode(mode)
                  }}
                  onClose={handleCloseComparison}
                  onDownloadVersion={handleDownload}
                />
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {t('compare.selectVersions', 'Select two versions from the history to compare')}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('history')}
                  >
                    {t('actions.goToHistory', 'Go to History')}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
})

export default DocumentVersionModal
