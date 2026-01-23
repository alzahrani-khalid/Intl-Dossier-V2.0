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
        <div className="w-8 shrink-0 select-none border-e bg-muted/30 pe-2 text-end text-muted-foreground sm:w-12">
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
    <div className="mb-4 overflow-hidden rounded-md border">
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        <ScrollArea className="h-[400px] rounded-md border">
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
        <ScrollArea className="h-[400px] rounded-md border">
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
    <ScrollArea className="h-[500px] rounded-md border">
      <div className="p-2">
        {hunks.map((hunk, index) => (
          <DiffHunkComponent key={index} hunk={hunk} index={index} />
        ))}
        {hunks.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">No text differences found</div>
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
          <FileText className="size-4 shrink-0" />
          <span className="truncate">{version.file_name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="size-4 shrink-0" />
          <span>{formatFileSize(version.size_bytes)}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-4 shrink-0" />
          <span className="truncate">
            {version.created_by_name || t('common.unknown', 'Unknown')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-4 shrink-0" />
          <span>{formatDate(version.created_at, isRTL ? 'ar-SA' : 'en-US')}</span>
        </div>
        {version.change_summary && (
          <div className="border-t pt-2">
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
    <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
        <Plus className="size-4" />
        <span>{t('stats.additions', '{{count}} additions', { count: stats.additions })}</span>
      </div>
      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
        <Minus className="size-4" />
        <span>{t('stats.deletions', '{{count}} deletions', { count: stats.deletions })}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <ArrowLeftRight className="size-4" />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex items-center rounded-md border">
              <Button
                variant={viewMode === 'inline' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('inline')}
                className="rounded-e-none"
              >
                <Rows className="me-1 size-4" />
                <span className="hidden sm:inline">{t('viewMode.inline', 'Inline')}</span>
              </Button>
              <Button
                variant={viewMode === 'side_by_side' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('side_by_side')}
                className="rounded-s-none"
              >
                <Columns className="me-1 size-4" />
                <span className="hidden sm:inline">{t('viewMode.sideBySide', 'Side by Side')}</span>
              </Button>
            </div>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Version metadata cards */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <VersionMetadataCard
          version={versionA}
          label={t('diff.oldVersion', 'Old Version')}
          variant="old"
        />
        <div className="hidden items-center justify-center sm:flex">
          <ArrowLeftRight className="size-6 text-muted-foreground" />
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
          {sizeDiff.direction === 'increased' && <ArrowUp className="me-1 size-3" />}
          {sizeDiff.direction === 'decreased' && <ArrowDown className="me-1 size-3" />}
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
        <div className="rounded-lg border bg-muted/30 py-8 text-center sm:py-12">
          <FileText className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h4 className="mb-2 text-base font-medium">
            {canCompareText
              ? t('comparison.noTextDiff', 'No text differences found')
              : t('comparison.binaryFile', 'Binary file comparison')}
          </h4>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {canCompareText
              ? t('comparison.noTextDiffDesc', 'The text content of these versions is identical.')
              : t(
                  'comparison.binaryFileDesc',
                  'This file type does not support text comparison. Download both versions to compare manually.',
                )}
          </p>
          {onDownloadVersion && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="outline" size="sm" onClick={() => onDownloadVersion(versionA)}>
                <Download className="me-2 size-4" />
                {t('actions.downloadVersionA', 'Download v{{version}}', {
                  version: versionA.version_number,
                })}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDownloadVersion(versionB)}>
                <Download className="me-2 size-4" />
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
