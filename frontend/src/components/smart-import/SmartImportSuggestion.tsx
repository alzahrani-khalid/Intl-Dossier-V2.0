/**
 * SmartImportSuggestion Component
 *
 * Displays smart import suggestions when sections are empty.
 * Detects available data sources and shows preview before import.
 * Mobile-first responsive with RTL support.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  Calendar,
  Mail,
  FileText,
  FolderOpen,
  ChevronRight,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSmartImportSuggestions } from '@/hooks/useSmartImportSuggestions'
import { ImportPreviewDialog } from './ImportPreviewDialog'
import type { DataSource, ImportableSection } from '@/types/smart-import.types'

// Icon mapping for data source types
const sourceIcons = {
  Calendar,
  Mail,
  FileText,
  FolderOpen,
}

export interface SmartImportSuggestionProps {
  /** Target section for import */
  section: ImportableSection
  /** Entity ID to import into */
  entityId: string
  /** Entity type */
  entityType: string
  /** Optional CSS class */
  className?: string
  /** Callback when import is complete */
  onImportComplete?: () => void
  /** Whether to show in compact mode */
  compact?: boolean
}

/**
 * Smart import suggestion component for empty sections
 */
export function SmartImportSuggestion({
  section,
  entityId,
  entityType,
  className,
  onImportComplete,
  compact = false,
}: SmartImportSuggestionProps) {
  const { t, i18n } = useTranslation('smart-import')
  const isRTL = i18n.language === 'ar'
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const {
    suggestions,
    isLoading,
    dataSources,
    hasDataSources,
    previewSource,
    executeImport,
    isPreviewLoading,
    isImporting,
  } = useSmartImportSuggestions({
    section,
    entityId,
    entityType,
  })

  // Handle source selection
  const handleSourceClick = async (source: DataSource) => {
    if (source.status === 'disconnected') {
      // TODO: Navigate to settings to connect the service
      return
    }

    setSelectedSource(source)
    setPreviewOpen(true)
  }

  // Handle import complete
  const handleImportComplete = () => {
    setPreviewOpen(false)
    setSelectedSource(null)
    onImportComplete?.()
  }

  // Get icon component for source
  const getSourceIcon = (iconName: string) => {
    const Icon = sourceIcons[iconName as keyof typeof sourceIcons] || FileText
    return Icon
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center py-4', className)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ms-2 text-sm text-muted-foreground">
          {t('loading', 'Checking available data sources...')}
        </span>
      </div>
    )
  }

  // No data sources available
  if (!hasDataSources && dataSources.every((s) => s.status === 'disconnected')) {
    if (compact) {
      return null
    }

    return (
      <Card className={cn('border-dashed', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md px-4">
            {t('noSources.description', 'Connect external services to enable smart import')}
          </p>
          <Button variant="outline" size="sm" className="mt-4 min-h-11">
            <ExternalLink className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('noSources.connectAction', 'Connect Services')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Compact mode - single line suggestion
  if (compact) {
    const connectedSources = dataSources.filter((s) => s.status === 'connected')
    const recommendedSource = suggestions?.recommendedSource || connectedSources[0]

    if (!recommendedSource) return null

    return (
      <div
        className={cn(
          'flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20',
          className,
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-foreground">
            {t('compact.suggestion', 'Import data from {{source}}', {
              source: isRTL ? recommendedSource.nameAr : recommendedSource.name,
            })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSourceClick(recommendedSource)}
          className="min-h-9 min-w-9 flex-shrink-0"
          disabled={isPreviewLoading}
        >
          {isPreviewLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t('compact.action', 'Import')}
              <ChevronRight className={cn('h-4 w-4 ms-1', isRTL && 'rotate-180')} />
            </>
          )}
        </Button>
      </div>
    )
  }

  // Full mode - card with all sources
  return (
    <>
      <Card className={cn('border-primary/20 bg-primary/5', className)} dir={isRTL ? 'rtl' : 'ltr'}>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base">
                {t('title', 'Smart Import Available')}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                {t('description', 'Import data from connected services to populate this section')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3">
            {dataSources.map((source) => {
              const Icon = getSourceIcon(source.icon)
              const isConnected = source.status === 'connected'
              const hasItems = (source.itemCount || 0) > 0

              return (
                <button
                  key={source.id}
                  onClick={() => handleSourceClick(source)}
                  disabled={!isConnected || isPreviewLoading}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 sm:p-4 rounded-lg border transition-all',
                    'text-start min-h-14',
                    isConnected
                      ? 'bg-background hover:bg-accent/50 hover:border-primary/50 cursor-pointer'
                      : 'bg-muted/50 cursor-not-allowed opacity-60',
                  )}
                >
                  <div
                    className={cn(
                      'rounded-full p-2 flex-shrink-0',
                      isConnected ? 'bg-primary/10' : 'bg-muted',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 sm:h-5 sm:w-5',
                        isConnected ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {isRTL ? source.nameAr : source.name}
                      </span>
                      {source.isRecommended && isConnected && (
                        <Badge variant="secondary" className="text-xs">
                          {t('recommended', 'Recommended')}
                        </Badge>
                      )}
                      {!isConnected && (
                        <Badge variant="outline" className="text-xs">
                          {t('notConnected', 'Not Connected')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {isRTL ? source.descriptionAr : source.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isConnected && hasItems && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs">
                            {source.itemCount}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent dir={isRTL ? 'rtl' : 'ltr'}>
                          {t('itemsAvailable', '{{count}} items available', {
                            count: source.itemCount,
                          })}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {isConnected ? (
                      <ChevronRight
                        className={cn('h-4 w-4 text-muted-foreground', isRTL && 'rotate-180')}
                      />
                    ) : (
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {suggestions?.message && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {isRTL ? suggestions.messageAr : suggestions.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Import Preview Dialog */}
      <ImportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        source={selectedSource}
        section={section}
        entityId={entityId}
        entityType={entityType}
        onPreview={previewSource}
        onImport={executeImport}
        isLoading={isPreviewLoading}
        isImporting={isImporting}
        onImportComplete={handleImportComplete}
      />
    </>
  )
}

export default SmartImportSuggestion
