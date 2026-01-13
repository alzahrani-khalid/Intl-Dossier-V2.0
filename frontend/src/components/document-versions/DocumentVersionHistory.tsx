/**
 * DocumentVersionHistory Component
 *
 * Displays version history for a document with timeline view.
 * Allows selecting versions for comparison and reverting.
 * Mobile-first with RTL support.
 */

import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  History,
  FileText,
  Calendar,
  User,
  RotateCcw,
  GitCompare,
  Download,
  MoreVertical,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  DocumentVersion,
  DocumentVersionHistoryProps,
  DocumentChangeType,
} from '@/types/document-version.types'
import { useDocumentVersions } from '@/hooks/useDocumentVersions'

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format date for display
 */
function formatDate(dateString: string, locale: string, short = false): string {
  try {
    const date = new Date(dateString)
    if (short) {
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      })
    }
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Get badge variant for change type
 */
function getChangeTypeBadge(changeType: DocumentChangeType): {
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  icon: React.ReactNode
  className?: string
} {
  switch (changeType) {
    case 'initial':
      return { variant: 'default', icon: <FileText className="h-3 w-3" /> }
    case 'update':
      return { variant: 'secondary', icon: <History className="h-3 w-3" /> }
    case 'major_revision':
      return {
        variant: 'default',
        icon: <AlertTriangle className="h-3 w-3" />,
        className: 'bg-orange-500',
      }
    case 'minor_edit':
      return { variant: 'outline', icon: <FileText className="h-3 w-3" /> }
    case 'revert':
      return { variant: 'destructive', icon: <RotateCcw className="h-3 w-3" /> }
    default:
      return { variant: 'outline', icon: <FileText className="h-3 w-3" /> }
  }
}

/**
 * Single version item in the history list
 */
const VersionItem = memo(function VersionItem({
  version,
  isSelected,
  isCurrent,
  onSelect,
  onDownload,
  onRevert,
  allowRevert,
  locale,
  t,
}: {
  version: DocumentVersion
  isSelected: boolean
  isCurrent: boolean
  onSelect: (version: DocumentVersion, selected: boolean) => void
  onDownload?: (version: DocumentVersion) => void
  onRevert?: (version: DocumentVersion) => void
  allowRevert: boolean
  locale: string
  t: (key: string, fallback?: string, options?: Record<string, unknown>) => string
}) {
  const { variant, icon, className } = getChangeTypeBadge(version.change_type)

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-colors',
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
        isCurrent && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      {/* Selection checkbox */}
      <div className="flex-shrink-0 pt-0.5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(version, checked === true)}
          aria-label={t('history.selectVersion', 'Select version {{version}}', {
            version: version.version_number,
          })}
        />
      </div>

      {/* Version info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="outline" className="font-mono">
            v{version.version_number}
          </Badge>
          <Badge variant={variant} className={cn('text-xs', className)}>
            {icon}
            <span className="ms-1">
              {t(`changeType.${version.change_type}`, version.change_type)}
            </span>
          </Badge>
          {isCurrent && (
            <Badge variant="default" className="bg-green-500 text-xs">
              <Check className="h-3 w-3 me-1" />
              {t('history.current', 'Current')}
            </Badge>
          )}
        </div>

        <p className="text-sm font-medium truncate">{version.file_name}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {version.created_by_name || t('common.unknown', 'Unknown')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(version.created_at, locale)}
          </span>
          <span>{formatFileSize(version.size_bytes)}</span>
        </div>

        {version.change_summary && (
          <p className="mt-2 text-xs text-muted-foreground italic">"{version.change_summary}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onDownload && (
              <DropdownMenuItem onClick={() => onDownload(version)}>
                <Download className="h-4 w-4 me-2" />
                {t('actions.download', 'Download')}
              </DropdownMenuItem>
            )}
            {allowRevert && !isCurrent && onRevert && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRevert(version)}
                  className="text-destructive focus:text-destructive"
                >
                  <RotateCcw className="h-4 w-4 me-2" />
                  {t('actions.revertTo', 'Revert to this version')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})

/**
 * Loading skeleton for version history
 */
const VersionHistorySkeleton = memo(function VersionHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
})

/**
 * Main DocumentVersionHistory component
 */
export const DocumentVersionHistory = memo(function DocumentVersionHistory({
  documentId,
  currentVersion,
  onVersionSelect,
  onCompare,
  onRevert,
  onDownload,
  allowRevert = true,
  className,
}: DocumentVersionHistoryProps & {
  onDownload?: (version: DocumentVersion) => void
}) {
  const { t, i18n } = useTranslation('document-versions')
  const isRTL = i18n.language === 'ar'

  // State
  const [selectedVersions, setSelectedVersions] = useState<Set<number>>(new Set())
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [versionToRevert, setVersionToRevert] = useState<DocumentVersion | null>(null)
  const [revertReason, setRevertReason] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  // Fetch versions
  const { versions, isLoading, error, revertToVersion, isReverting } = useDocumentVersions({
    documentId,
  })

  // Handlers
  const handleSelectVersion = useCallback(
    (version: DocumentVersion, selected: boolean) => {
      setSelectedVersions((prev) => {
        const next = new Set(prev)
        if (selected) {
          // Only allow 2 selections for comparison
          if (next.size >= 2) {
            const [first] = next
            next.delete(first)
          }
          next.add(version.version_number)
        } else {
          next.delete(version.version_number)
        }
        return next
      })
      onVersionSelect?.(version)
    },
    [onVersionSelect],
  )

  const handleCompare = useCallback(() => {
    if (selectedVersions.size === 2) {
      const [a, b] = Array.from(selectedVersions).sort((x, y) => x - y)
      onCompare?.(a, b)
    }
  }, [selectedVersions, onCompare])

  const handleRevertClick = useCallback((version: DocumentVersion) => {
    setVersionToRevert(version)
    setRevertDialogOpen(true)
  }, [])

  const handleRevertConfirm = useCallback(async () => {
    if (!versionToRevert) return

    try {
      await revertToVersion(versionToRevert.version_number, revertReason || undefined)
      onRevert?.(versionToRevert.version_number)
      setRevertDialogOpen(false)
      setVersionToRevert(null)
      setRevertReason('')
    } catch (error) {
      console.error('Revert failed:', error)
    }
  }, [versionToRevert, revertReason, revertToVersion, onRevert])

  const handleClearSelection = useCallback(() => {
    setSelectedVersions(new Set())
  }, [])

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-4" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle className="text-base">{t('history.title', 'Version History')}</CardTitle>
            {versions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {versions.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Compare action bar */}
        {isExpanded && selectedVersions.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">
              {t('history.selectedCount', '{{count}} selected', { count: selectedVersions.size })}
            </span>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleClearSelection}>
              {t('actions.clearSelection', 'Clear')}
            </Button>
            {selectedVersions.size === 2 && (
              <Button size="sm" onClick={handleCompare}>
                <GitCompare className="h-4 w-4 me-2" />
                {t('actions.compare', 'Compare')}
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {isLoading ? (
            <VersionHistorySkeleton />
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t('history.noVersions', 'No version history available')}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pe-4">
              <div className="space-y-3">
                {versions.map((version) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    isSelected={selectedVersions.has(version.version_number)}
                    isCurrent={
                      version.version_number === (currentVersion || versions[0]?.version_number)
                    }
                    onSelect={handleSelectVersion}
                    onDownload={onDownload}
                    onRevert={handleRevertClick}
                    allowRevert={allowRevert}
                    locale={isRTL ? 'ar-SA' : 'en-US'}
                    t={t}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}

      {/* Revert confirmation dialog */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dialogs.revert.title', 'Revert to version {{version}}?', {
                version: versionToRevert?.version_number,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'dialogs.revert.description',
                'This will create a new version based on the selected version. The current version will be preserved in history.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="revert-reason">
              {t('dialogs.revert.reasonLabel', 'Reason (optional)')}
            </Label>
            <Input
              id="revert-reason"
              value={revertReason}
              onChange={(e) => setRevertReason(e.target.value)}
              placeholder={t('dialogs.revert.reasonPlaceholder', 'Why are you reverting?')}
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevertConfirm}
              disabled={isReverting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isReverting ? (
                <>
                  <span className="animate-spin me-2">⏳</span>
                  {t('actions.reverting', 'Reverting...')}
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 me-2" />
                  {t('actions.revert', 'Revert')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
})

export default DocumentVersionHistory
