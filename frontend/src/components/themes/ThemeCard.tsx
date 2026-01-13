/**
 * ThemeCard Component
 * Feature: themes-entity-management
 *
 * Displays a single theme with hierarchy info, category code, and sub-theme count.
 * Mobile-first, RTL-aware design following Aceternity UI patterns.
 */

import { useTranslation } from 'react-i18next'
import {
  Folder,
  FolderTree,
  ChevronRight,
  ExternalLink,
  MoreVertical,
  Tag,
  Hash,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import type { Theme, ThemeWithContext } from '@/types/theme.types'

// Status color mapping
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  inactive: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  },
  archived: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
}

interface ThemeCardProps {
  theme: Theme | ThemeWithContext
  onEdit?: (theme: Theme | ThemeWithContext) => void
  onDelete?: (id: string) => void
  onViewDetails?: (id: string) => void
  onAddChild?: (parentId: string) => void
  onViewHierarchy?: (id: string) => void
  compact?: boolean
  showParentInfo?: boolean
}

export function ThemeCard({
  theme,
  onEdit,
  onDelete,
  onViewDetails,
  onAddChild,
  onViewHierarchy,
  compact = false,
  showParentInfo = true,
}: ThemeCardProps) {
  const { t, i18n } = useTranslation('themes')
  const isRTL = i18n.language === 'ar'

  // Determine title and summary based on language
  const title = isRTL ? theme.name_ar : theme.name_en
  const summary = isRTL ? theme.summary_ar : theme.summary_en

  // Get parent info if available
  const themeWithContext = theme as ThemeWithContext
  const parentName = isRTL ? themeWithContext.parent_name_ar : themeWithContext.parent_name_en
  const childrenCount = themeWithContext.children_count ?? 0

  // Get status colors
  const statusColors = STATUS_COLORS[theme.status] || STATUS_COLORS.active

  // Extension data
  const extension = theme.extension
  const categoryCode = extension?.category_code || 'UNKNOWN'
  const hierarchyLevel = extension?.hierarchy_level || 1
  const isStandard = extension?.is_standard || false
  const themeColor = extension?.color

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer group',
        'border-s-4',
        themeColor ? '' : 'border-s-primary/50',
      )}
      style={themeColor ? { borderInlineStartColor: themeColor } : undefined}
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={() => onViewDetails?.(theme.id)}
    >
      <CardHeader className={cn('pb-2', compact && 'py-3')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div
              className={cn('p-2 rounded-lg shrink-0', 'bg-primary/10 text-primary')}
              style={
                themeColor ? { backgroundColor: `${themeColor}20`, color: themeColor } : undefined
              }
            >
              {childrenCount > 0 ? (
                <FolderTree className="h-5 w-5" />
              ) : (
                <Folder className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle
                className={cn('text-base sm:text-lg font-semibold truncate', compact && 'text-sm')}
              >
                {title}
              </CardTitle>

              {/* Category code and hierarchy level */}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 font-mono">
                        <Hash className="h-3 w-3" />
                        {categoryCode}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('tooltips.categoryCode')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="text-muted-foreground/50">|</span>

                <span>{t('hierarchy.level', { level: hierarchyLevel })}</span>
              </div>

              {/* Summary */}
              {!compact && summary && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{summary}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Standard Badge */}
            {isStandard && (
              <Badge variant="secondary" className="text-xs">
                {t('card.standard')}
              </Badge>
            )}

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn(statusColors.bg, statusColors.text, statusColors.border, 'text-xs')}
            >
              {t(`status.${theme.status}`)}
            </Badge>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 min-h-8 min-w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('actions.menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                {onViewDetails && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDetails(theme.id)
                    }}
                  >
                    {t('actions.viewDetails')}
                  </DropdownMenuItem>
                )}
                {onViewHierarchy && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewHierarchy(theme.id)
                    }}
                  >
                    {t('actions.viewHierarchy')}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(theme)
                    }}
                  >
                    {t('actions.edit')}
                  </DropdownMenuItem>
                )}
                {onAddChild && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddChild(theme.id)
                      }}
                    >
                      {t('actions.createChild')}
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(theme.id)
                      }}
                      className="text-destructive"
                      disabled={childrenCount > 0}
                    >
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('pt-0', compact && 'pb-3')}>
        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {/* Parent Theme (if showing) */}
          {showParentInfo && parentName && (
            <div className="flex items-center gap-1">
              <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              <span className="truncate max-w-32">{parentName}</span>
            </div>
          )}

          {/* Children Count */}
          <div className="flex items-center gap-1">
            <FolderTree className="h-4 w-4" />
            <span>
              {childrenCount > 0
                ? t('hierarchy.childrenCount', { count: childrenCount })
                : t('hierarchy.noChildren')}
            </span>
          </div>

          {/* External URL */}
          {extension?.external_url && (
            <a
              href={extension.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs">{t('detail.externalReference')}</span>
            </a>
          )}

          {/* Tags */}
          {theme.tags && theme.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span>{theme.tags.length}</span>
            </div>
          )}
        </div>

        {/* Tags Display (expanded) */}
        {!compact && theme.tags && theme.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {theme.tags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {theme.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{theme.tags.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ThemeCard
