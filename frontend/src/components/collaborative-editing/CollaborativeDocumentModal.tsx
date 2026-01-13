/**
 * CollaborativeDocumentModal Component
 *
 * Full-screen modal for collaborative document editing.
 * Integrates the CollaborativeEditor with document preview capabilities.
 * Shows active editors, suggestions, track changes, and comments.
 * Mobile-first with RTL support.
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  X,
  Maximize2,
  Minimize2,
  Users,
  MessageSquare,
  History,
  Save,
  FileText,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollaborativeEditor } from './CollaborativeEditor'
import { ActiveEditorAvatars } from './ActiveEditorAvatars'
import { useCollaborativeEditing } from '@/hooks/useCollaborativeEditing'
import type { PreviewDocument } from '@/types/document-preview.types'

interface CollaborativeDocumentModalProps {
  document: PreviewDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (content: string) => Promise<void>
  readOnly?: boolean
  className?: string
}

export function CollaborativeDocumentModal({
  document,
  open,
  onOpenChange,
  onSave,
  readOnly = false,
  className,
}: CollaborativeDocumentModalProps) {
  const { t, i18n } = useTranslation('collaborative-editing')
  const isRTL = i18n.language === 'ar'

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { activeEditors, summary, isConnected, leaveSession } = useCollaborativeEditing({
    documentId: document?.id || '',
    autoJoin: open && !!document,
  })

  // Handle close with cleanup
  const handleClose = useCallback(async () => {
    await leaveSession()
    onOpenChange(false)
  }, [leaveSession, onOpenChange])

  // Handle save
  const handleSave = useCallback(
    async (content: string) => {
      if (!onSave) return
      setIsSaving(true)
      try {
        await onSave(content)
      } finally {
        setIsSaving(false)
      }
    },
    [onSave],
  )

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Early return if no document
  if (!document) {
    return null
  }

  const totalPending =
    (summary?.pendingSuggestions || 0) +
    (summary?.pendingChanges || 0) +
    (summary?.openComments || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col p-0',
          isFullscreen
            ? 'w-screen h-screen max-w-none max-h-none rounded-none'
            : 'w-[95vw] h-[90vh] max-w-6xl',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between gap-4 p-3 sm:p-4 border-b shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg truncate">{document.name}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t('description')}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Active editors */}
            <ActiveEditorAvatars
              editors={activeEditors}
              maxVisible={3}
              size="sm"
              className="hidden sm:flex"
            />

            {/* Connection status */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1 text-xs">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-gray-400',
                      )}
                    />
                    <span className="hidden sm:inline">
                      {isConnected ? t('status.connected') : t('status.disconnected')}
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('editors.count', { count: activeEditors.length })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Pending items badge */}
            {totalPending > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalPending} {t('toolbar.pendingItems')}
              </Badge>
            )}

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Fullscreen toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="h-8 w-8"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? t('common.exitFullscreen') : t('common.enterFullscreen')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Close button */}
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main content - Collaborative Editor */}
        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor
            documentId={document.id}
            documentVersionId={document.versionId}
            initialContent=""
            readOnly={readOnly}
            onSave={handleSave}
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for opening collaborative document modal
export function useCollaborativeDocumentModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [document, setDocument] = useState<PreviewDocument | null>(null)

  const openDocument = useCallback((doc: PreviewDocument) => {
    setDocument(doc)
    setIsOpen(true)
  }, [])

  const closeDocument = useCallback(() => {
    setIsOpen(false)
    setDocument(null)
  }, [])

  return {
    isOpen,
    document,
    openDocument,
    closeDocument,
    setIsOpen,
  }
}

export default CollaborativeDocumentModal
