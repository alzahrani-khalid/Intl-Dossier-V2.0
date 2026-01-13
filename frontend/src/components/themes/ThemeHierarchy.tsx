/**
 * ThemeHierarchy Component
 * Feature: themes-entity-management
 *
 * Displays themes in a hierarchical tree view with expand/collapse functionality.
 * Mobile-first, RTL-aware design.
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderTree,
  Plus,
  Loader2,
  AlertCircle,
  Hash,
  ExternalLink,
  MoreVertical,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

import { useThemeTree } from '@/hooks/useThemes'
import type { ThemeNode } from '@/types/theme.types'

interface ThemeHierarchyProps {
  onSelectTheme?: (id: string) => void
  onEditTheme?: (id: string) => void
  onDeleteTheme?: (id: string) => void
  onAddChildTheme?: (parentId: string) => void
  selectedThemeId?: string | null
  className?: string
}

interface ThemeTreeItemProps {
  node: ThemeNode
  depth: number
  isRTL: boolean
  selectedId?: string | null
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onAddChild?: (id: string) => void
  t: (key: string, options?: object) => string
}

function ThemeTreeItem({
  node,
  depth,
  isRTL,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  t,
}: ThemeTreeItemProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  const title = isRTL ? node.name_ar : node.name_en

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-2 rounded-md transition-colors group',
          'hover:bg-accent cursor-pointer',
          isSelected && 'bg-accent ring-2 ring-primary',
          depth > 0 && 'border-s-2 border-transparent hover:border-primary/30',
        )}
        style={{
          paddingInlineStart: `${depth * 24 + 8}px`,
          borderInlineStartColor: node.color || undefined,
        }}
        onClick={() => onSelect?.(node.id)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            className="p-1 hover:bg-background rounded shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Folder Icon */}
        <span className="shrink-0" style={{ color: node.color || 'currentColor' }}>
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-5 w-5" />
            ) : (
              <Folder className="h-5 w-5" />
            )
          ) : (
            <Folder className="h-5 w-5" />
          )}
        </span>

        {/* Theme Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          <span className="text-xs text-muted-foreground font-mono">{node.category_code}</span>
          {node.is_standard && (
            <Badge variant="secondary" className="text-xs h-5">
              {t('card.standard')}
            </Badge>
          )}
        </div>

        {/* Children Count */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground shrink-0">({node.children?.length})</span>
        )}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
            {onSelect && (
              <DropdownMenuItem onClick={() => onSelect(node.id)}>
                {t('actions.viewDetails')}
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(node.id)}>
                {t('actions.edit')}
              </DropdownMenuItem>
            )}
            {onAddChild && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                  {t('actions.createChild')}
                </DropdownMenuItem>
              </>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(node.id)}
                  className="text-destructive"
                  disabled={hasChildren}
                >
                  {t('actions.delete')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {node.children?.map((child) => (
            <ThemeTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              isRTL={isRTL}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ThemeHierarchy({
  onSelectTheme,
  onEditTheme,
  onDeleteTheme,
  onAddChildTheme,
  selectedThemeId,
  className,
}: ThemeHierarchyProps) {
  const { t, i18n } = useTranslation('themes')
  const isRTL = i18n.language === 'ar'

  // State for expanded nodes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Fetch theme tree
  const { data, isLoading, isError, error, refetch } = useThemeTree()

  // Toggle expand/collapse
  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    if (!data?.data) return

    const allIds = new Set<string>()
    const collectIds = (nodes: ThemeNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id)
          collectIds(node.children)
        }
      })
    }
    collectIds(data.data)
    setExpandedIds(allIds)
  }, [data])

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  // Memoized tree data
  const treeData = useMemo(() => data?.data || [], [data])

  return (
    <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            {t('hierarchy.title')}
          </h2>
          {data?.total !== undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.total} {t('title').toLowerCase()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll} className="min-h-9">
            {t('actions.expandAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll} className="min-h-9">
            {t('actions.collapseAll')}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errors.loadFailed')}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error?.message || 'Unknown error'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && treeData.length === 0 && (
        <div className="text-center py-12 px-4 border rounded-lg bg-muted/50">
          <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t('hierarchy.empty')}</h3>
          <p className="text-sm text-muted-foreground mt-2">{t('hierarchy.emptyDescription')}</p>
        </div>
      )}

      {/* Tree View */}
      {!isLoading && !isError && treeData.length > 0 && (
        <div className="border rounded-lg p-2 bg-background">
          {treeData.map((node) => (
            <ThemeTreeItem
              key={node.id}
              node={node}
              depth={0}
              isRTL={isRTL}
              selectedId={selectedThemeId}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              onSelect={onSelectTheme}
              onEdit={onEditTheme}
              onDelete={onDeleteTheme}
              onAddChild={onAddChildTheme}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ThemeHierarchy
