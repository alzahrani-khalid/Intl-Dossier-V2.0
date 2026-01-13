/**
 * DocumentVersionComparison Component
 *
 * Side-by-side or inline diff view for comparing document versions.
 * Highlights changes, shows edit history metadata.
 * Mobile-first with RTL support.
 */

import { memo, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftRight,
  FileText,
  Calendar,
  User,
  Hash,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  X,
  Download,
  ToggleLeft,
  ToggleRight,
  Columns,
  Rows,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type {
  DocumentVersionComparisonProps,
  VersionComparisonResult,
  DiffHunk,
  DiffLine,
  DiffViewMode,
  DiffStats,
  DocumentVersion,
} from '@/types/document-version.types'
import { calculateSizeDiff, formatVersionLabel } from '@/types/document-version.types'

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
function formatDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString)
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
 * Diff line component
 */
const DiffLineComponent = memo(function DiffLineComponent({
  line,
  showLineNumbers = true,
}: {
  line: DiffLine
  showLineNumbers?: boolean
}) {
  const bgColor = {
    added: 'bg-green-50 dark:bg-green-950/30',
    removed: 'bg-red-50 dark:bg-red-950/30',
    modified: 'bg-yellow-50 dark:bg-yellow-950/30',
    unchanged: '',
  }[line.type]

  const textColor = {
    added: 'text-green-700 dark:text-green-400',
    removed: 'text-red-700 dark:text-red-400',
    modified: 'text-yellow-700 dark:text-yellow-400',
    unchanged: 'text-foreground',
  }[line.type]

  const prefix = {
    added: '+',
    removed: '-',
    modified: '~',
    unchanged: ' ',
  }[line.type]

  return (
    <div className={cn('flex font-mono text-xs sm:text-sm', bgColor)}>
      {showLineNumbers && (
        <div className="flex-shrink-0 w-8 sm:w-12 text-muted-foreground text-end pe-2 select-none border-e bg-muted/30">
          {line.lineNumberOld || line.lineNumberNew || ''}
        </div>
      )}
      <div className={cn('flex-1 px-2 whitespace-pre-wrap break-all', textColor)}>
        <span className="select-none opacity-50">{prefix}</span>
        {line.content}
      </div>
    </div>
  )
})

/**
 * Diff hunk component
 */
const DiffHunkComponent = memo(function DiffHunkComponent({
  hunk,
  index,
}: {
  hunk: DiffHunk
  index: number
}) {
  const { t } = useTranslation('document-versions')

  return (
    <div className="border rounded-md overflow-hidden mb-4">
      <div className="bg-muted px-3 py-1.5 text-xs text-muted-foreground">
        {t('diff.hunkHeader', 'Changes at lines {{oldStart}}-{{oldEnd}}', {
          oldStart: hunk.oldStart,
          oldEnd: hunk.oldStart + hunk.oldLines - 1,
        })}
      </div>
      <div className="divide-y divide-border">
        {hunk.lines.map((line, lineIndex) => (
          <DiffLineComponent key={`${index}-${lineIndex}`} line={line} />
        ))}
      </div>
    </div>
  )
})

/**
 * Side-by-side diff view
 */
const SideBySideDiff = memo(function SideBySideDiff({
  hunks,
  versionA,
  versionB,
}: {
  hunks: DiffHunk[]
  versionA: DocumentVersion
  versionB: DocumentVersion
}) {
  const { t, i18n } = useTranslation('document-versions')
  const isRTL = i18n.language === 'ar'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Version A (Old) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
          >
            v{versionA.version_number}
          </Badge>
          <span className="text-muted-foreground">{t('diff.oldVersion', 'Old Version')}</span>
        </div>
        <ScrollArea className="h-[400px] border rounded-md">
          <div className="p-2">
            {hunks.map((hunk, index) => (
              <div key={index} className="mb-2">
                {hunk.lines
                  .filter((line) => line.type === 'removed' || line.type === 'unchanged')
                  .map((line, lineIndex) => (
                    <DiffLineComponent key={`a-${index}-${lineIndex}`} line={line} />
                  ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Version B (New) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
          >
            v{versionB.version_number}
          </Badge>
          <span className="text-muted-foreground">{t('diff.newVersion', 'New Version')}</span>
        </div>
        <ScrollArea className="h-[400px] border rounded-md">
          <div className="p-2">
            {hunks.map((hunk, index) => (
              <div key={index} className="mb-2">
                {hunk.lines
                  .filter((line) => line.type === 'added' || line.type === 'unchanged')
                  .map((line, lineIndex) => (
                    <DiffLineComponent key={`b-${index}-${lineIndex}`} line={line} />
                  ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
})

/**
 * Inline/Unified diff view
 */
const InlineDiff = memo(function InlineDiff({ hunks }: { hunks: DiffHunk[] }) {
  return (
    <ScrollArea className="h-[500px] border rounded-md">
      <div className="p-2">
        {hunks.map((hunk, index) => (
          <DiffHunkComponent key={index} hunk={hunk} index={index} />
        ))}
        {hunks.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No text differences found</div>
        )}
      </div>
    </ScrollArea>
  )
})

/**
 * Version metadata card
 */
const VersionMetadataCard = memo(function VersionMetadataCard({
  version,
  label,
  variant,
}: {
  version: DocumentVersion
  label: string
  variant: 'old' | 'new'
}) {
  const { t, i18n } = useTranslation('document-versions')
  const isRTL = i18n.language === 'ar'

  const badgeClass =
    variant === 'old'
      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
      : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={badgeClass}>
            v{version.version_number}
          </Badge>
          <CardTitle className="text-sm">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{version.file_name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-4 w-4 flex-shrink-0" />
          <span>{formatFileSize(version.size_bytes)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {version.created_by_name || t('common.unknown', 'Unknown')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>{formatDate(version.created_at, isRTL ? 'ar-SA' : 'en-US')}</span>
        </div>
        {version.change_summary && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">{version.change_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

/**
 * Diff statistics component
 */
const DiffStatsComponent = memo(function DiffStatsComponent({ stats }: { stats: DiffStats }) {
  const { t } = useTranslation('document-versions')

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
        <Plus className="h-4 w-4" />
        <span>{t('stats.additions', '{{count}} additions', { count: stats.additions })}</span>
      </div>
      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
        <Minus className="h-4 w-4" />
        <span>{t('stats.deletions', '{{count}} deletions', { count: stats.deletions })}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <ArrowLeftRight className="h-4 w-4" />
        <span>{t('stats.similarity', '{{percent}}% similar', { percent: stats.similarity })}</span>
      </div>
    </div>
  )
})

/**
 * Main DocumentVersionComparison component
 */
export const DocumentVersionComparison = memo(function DocumentVersionComparison({
  comparisonResult,
  viewMode = 'inline',
  onViewModeChange,
  onClose,
  onDownloadVersion,
  className,
}: {
  comparisonResult: VersionComparisonResult
  viewMode?: DiffViewMode
  onViewModeChange?: (mode: DiffViewMode) => void
  onClose?: () => void
  onDownloadVersion?: (version: DocumentVersion) => void
  className?: string
}) {
  const { t, i18n } = useTranslation('document-versions')
  const isRTL = i18n.language === 'ar'

  const { versionA, versionB, canCompareText, diffHunks, diffStats } = comparisonResult

  // Calculate size difference
  const sizeDiff = useMemo(
    () => calculateSizeDiff(versionA.size_bytes, versionB.size_bytes),
    [versionA.size_bytes, versionB.size_bytes],
  )

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t('comparison.title', 'Version Comparison')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('comparison.subtitle', 'Comparing version {{a}} with version {{b}}', {
              a: versionA.version_number,
              b: versionB.version_number,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {canCompareText && onViewModeChange && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'inline' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('inline')}
                className="rounded-e-none"
              >
                <Rows className="h-4 w-4 me-1" />
                <span className="hidden sm:inline">{t('viewMode.inline', 'Inline')}</span>
              </Button>
              <Button
                variant={viewMode === 'side_by_side' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('side_by_side')}
                className="rounded-s-none"
              >
                <Columns className="h-4 w-4 me-1" />
                <span className="hidden sm:inline">{t('viewMode.sideBySide', 'Side by Side')}</span>
              </Button>
            </div>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Version metadata cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        <VersionMetadataCard
          version={versionA}
          label={t('diff.oldVersion', 'Old Version')}
          variant="old"
        />
        <div className="hidden sm:flex items-center justify-center">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
        </div>
        <VersionMetadataCard
          version={versionB}
          label={t('diff.newVersion', 'New Version')}
          variant="new"
        />
      </div>

      {/* Size change indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('comparison.sizeChange', 'Size change')}:</span>
        <Badge
          variant={
            sizeDiff.direction === 'increased'
              ? 'default'
              : sizeDiff.direction === 'decreased'
                ? 'secondary'
                : 'outline'
          }
        >
          {sizeDiff.direction === 'increased' && <ArrowUp className="h-3 w-3 me-1" />}
          {sizeDiff.direction === 'decreased' && <ArrowDown className="h-3 w-3 me-1" />}
          {sizeDiff.direction === 'unchanged'
            ? t('comparison.noChange', 'No change')
            : `${sizeDiff.percentage}%`}
        </Badge>
      </div>

      <Separator />

      {/* Diff content */}
      {canCompareText && diffHunks && diffHunks.length > 0 ? (
        <>
          {/* Diff stats */}
          {diffStats && <DiffStatsComponent stats={diffStats} />}

          {/* Diff view */}
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange?.(v as DiffViewMode)}>
            <TabsContent value="inline" className="mt-0">
              <InlineDiff hunks={diffHunks} />
            </TabsContent>
            <TabsContent value="side_by_side" className="mt-0">
              <SideBySideDiff hunks={diffHunks} versionA={versionA} versionB={versionB} />
            </TabsContent>
            <TabsContent value="unified" className="mt-0">
              <InlineDiff hunks={diffHunks} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-8 sm:py-12 border rounded-lg bg-muted/30">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="text-base font-medium mb-2">
            {canCompareText
              ? t('comparison.noTextDiff', 'No text differences found')
              : t('comparison.binaryFile', 'Binary file comparison')}
          </h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {canCompareText
              ? t('comparison.noTextDiffDesc', 'The text content of these versions is identical.')
              : t(
                  'comparison.binaryFileDesc',
                  'This file type does not support text comparison. Download both versions to compare manually.',
                )}
          </p>
          {onDownloadVersion && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => onDownloadVersion(versionA)}>
                <Download className="h-4 w-4 me-2" />
                {t('actions.downloadVersionA', 'Download v{{version}}', {
                  version: versionA.version_number,
                })}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDownloadVersion(versionB)}>
                <Download className="h-4 w-4 me-2" />
                {t('actions.downloadVersionB', 'Download v{{version}}', {
                  version: versionB.version_number,
                })}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default DocumentVersionComparison
