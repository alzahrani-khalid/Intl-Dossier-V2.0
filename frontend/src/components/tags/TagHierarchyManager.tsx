/**
 * TagHierarchyManager Component
 *
 * A comprehensive tag management interface with:
 * - Hierarchical tree view with expand/collapse
 * - Tag CRUD operations
 * - Drag-and-drop reordering (future)
 * - Search and filter
 * - Merge and rename dialogs
 *
 * @mobile-first - Designed for 320px+ with responsive breakpoints
 * @rtl-ready - Uses logical properties for Arabic support
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  Search,
  Tag,
  GitMerge,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  useTagHierarchyTree,
  useTagsFlat,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useMergeTags,
  useRenameTag,
} from '@/hooks/useTagHierarchy'
import type { TagCategory, TagCategoryCreate, TagCategoryUpdate } from '@/types/tag-hierarchy.types'
import { TAG_COLOR_PALETTE, TAG_ICON_OPTIONS, getTagName } from '@/types/tag-hierarchy.types'

interface TagHierarchyManagerProps {
  className?: string
  onTagSelect?: (tag: TagCategory) => void
  selectedTagId?: string
  showActions?: boolean
}

interface TagFormData {
  name_en: string
  name_ar: string
  parent_id: string | null
  color: string
  icon: string
  description_en: string
  description_ar: string
}

const defaultFormData: TagFormData = {
  name_en: '',
  name_ar: '',
  parent_id: null,
  color: '#3B82F6',
  icon: 'tag',
  description_en: '',
  description_ar: '',
}

export function TagHierarchyManager({
  className,
  onTagSelect,
  selectedTagId,
  showActions = true,
}: TagHierarchyManagerProps) {
  const { t, i18n } = useTranslation('tags')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editingTag, setEditingTag] = useState<TagCategory | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<TagCategory | null>(null)
  const [tagToMerge, setTagToMerge] = useState<TagCategory | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState<string>('')
  const [formData, setFormData] = useState<TagFormData>(defaultFormData)

  // Queries
  const { data: hierarchyTree, isLoading, error, refetch } = useTagHierarchyTree()
  const { data: flatTags } = useTagsFlat(true)

  // Mutations
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()
  const mergeTags = useMergeTags()

  // Filter tags by search
  const filteredTree = useMemo(() => {
    if (!searchQuery || !hierarchyTree) return hierarchyTree

    const searchLower = searchQuery.toLowerCase()

    const filterNode = (node: TagCategory): TagCategory | null => {
      const nameMatch =
        node.name_en.toLowerCase().includes(searchLower) || node.name_ar.includes(searchQuery)

      const filteredChildren = node.children?.map(filterNode).filter(Boolean) as TagCategory[]

      if (nameMatch || (filteredChildren && filteredChildren.length > 0)) {
        return { ...node, children: filteredChildren }
      }
      return null
    }

    return hierarchyTree.map(filterNode).filter(Boolean) as TagCategory[]
  }, [hierarchyTree, searchQuery])

  // Handlers
  const toggleExpand = useCallback((tagId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    if (!hierarchyTree) return
    const allIds = new Set<string>()
    const collectIds = (tags: TagCategory[]) => {
      tags.forEach((tag) => {
        if (tag.children && tag.children.length > 0) {
          allIds.add(tag.id)
          collectIds(tag.children)
        }
      })
    }
    collectIds(hierarchyTree)
    setExpandedIds(allIds)
  }, [hierarchyTree])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const handleCreateTag = async () => {
    try {
      await createTag.mutateAsync({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        parent_id: formData.parent_id || undefined,
        color: formData.color,
        icon: formData.icon,
        description_en: formData.description_en || undefined,
        description_ar: formData.description_ar || undefined,
      })

      toast({
        title: t('actions.create'),
        description: getTagName(formData, isRTL),
      })

      setIsCreateDialogOpen(false)
      setFormData(defaultFormData)
    } catch (error) {
      toast({
        title: t('errors.createFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag) return

    try {
      await updateTag.mutateAsync({
        id: editingTag.id,
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        parent_id: formData.parent_id,
        color: formData.color,
        icon: formData.icon,
        description_en: formData.description_en || undefined,
        description_ar: formData.description_ar || undefined,
      })

      toast({
        title: t('actions.edit'),
        description: getTagName(formData, isRTL),
      })

      setEditingTag(null)
      setFormData(defaultFormData)
    } catch (error) {
      toast({
        title: t('errors.updateFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    try {
      await deleteTag.mutateAsync(tagToDelete.id)

      toast({
        title: t('delete.success'),
        description: getTagName(tagToDelete, isRTL),
      })

      setIsDeleteDialogOpen(false)
      setTagToDelete(null)
    } catch (error) {
      toast({
        title: t('errors.deleteFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleMergeTags = async () => {
    if (!tagToMerge || !mergeTargetId) return

    try {
      await mergeTags.mutateAsync({
        source_tag_id: tagToMerge.id,
        target_tag_id: mergeTargetId,
      })

      toast({
        title: t('merge.success'),
      })

      setIsMergeDialogOpen(false)
      setTagToMerge(null)
      setMergeTargetId('')
    } catch (error) {
      toast({
        title: t('errors.mergeFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (tag: TagCategory) => {
    setEditingTag(tag)
    setFormData({
      name_en: tag.name_en,
      name_ar: tag.name_ar,
      parent_id: tag.parent_id,
      color: tag.color,
      icon: tag.icon,
      description_en: tag.description_en || '',
      description_ar: tag.description_ar || '',
    })
  }

  const openDeleteDialog = (tag: TagCategory) => {
    setTagToDelete(tag)
    setIsDeleteDialogOpen(true)
  }

  const openMergeDialog = (tag: TagCategory) => {
    setTagToMerge(tag)
    setMergeTargetId('')
    setIsMergeDialogOpen(true)
  }

  const openCreateChildDialog = (parent: TagCategory) => {
    setFormData({
      ...defaultFormData,
      parent_id: parent.id,
      color: parent.color,
    })
    setIsCreateDialogOpen(true)
  }

  // Render tag node recursively
  const renderTagNode = (tag: TagCategory, depth = 0) => {
    const hasChildren = tag.children && tag.children.length > 0
    const isExpanded = expandedIds.has(tag.id)
    const isSelected = tag.id === selectedTagId

    return (
      <div key={tag.id} className="select-none">
        <div
          className={cn(
            'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
            'hover:bg-muted/50',
            isSelected && 'bg-primary/10 hover:bg-primary/15',
          )}
          style={{ paddingInlineStart: `${depth * 16 + 8}px` }}
          onClick={() => onTagSelect?.(tag)}
        >
          {/* Expand/collapse toggle */}
          <button
            type="button"
            className={cn(
              'flex items-center justify-center size-5 rounded transition-opacity',
              hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) toggleExpand(tag.id)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className={cn('size-4', isRTL && 'rotate-180')} />
            )}
          </button>

          {/* Tag color indicator */}
          <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />

          {/* Tag name */}
          <span className="flex-1 text-sm truncate">{getTagName(tag, isRTL)}</span>

          {/* Usage count */}
          {tag.usage_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {tag.usage_count}
            </Badge>
          )}

          {/* Status badges */}
          {tag.is_system && (
            <Badge variant="outline" className="text-xs">
              {t('status.system')}
            </Badge>
          )}

          {!tag.is_active && (
            <Badge variant="destructive" className="text-xs">
              {t('status.inactive')}
            </Badge>
          )}

          {/* Actions menu */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                <DropdownMenuItem onClick={() => openCreateChildDialog(tag)}>
                  <Plus className="size-4 me-2" />
                  {t('actions.addChild')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditDialog(tag)} disabled={tag.is_system}>
                  <Edit2 className="size-4 me-2" />
                  {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openMergeDialog(tag)} disabled={tag.is_system}>
                  <GitMerge className="size-4 me-2" />
                  {t('actions.merge')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(tag)}
                  disabled={tag.is_system}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 me-2" />
                  {t('actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{tag.children!.map((child) => renderTagNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <AlertCircle className="size-12 text-destructive mb-4" />
        <p className="text-muted-foreground">{t('errors.loadFailed')}</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="size-4 me-2" />
          {t('actions.refresh')}
        </Button>
      </div>
    )
  }

  // Empty state
  if (!filteredTree || filteredTree.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <Tag className="size-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold">{t('empty.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t('empty.description')}</p>
        {showActions && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
            <Plus className="size-4 me-2" />
            {t('empty.action')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with search and actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('actions.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            {t('hierarchy.expandAll')}
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            {t('hierarchy.collapseAll')}
          </Button>
          {showActions && (
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4 me-1" />
              {t('actions.create')}
            </Button>
          )}
        </div>
      </div>

      {/* Tag hierarchy tree */}
      <ScrollArea className="flex-1 max-h-[60vh]">
        <div className="space-y-0.5">{filteredTree.map((tag) => renderTagNode(tag))}</div>
      </ScrollArea>

      {/* Create/Edit Tag Dialog */}
      <Dialog
        open={isCreateDialogOpen || !!editingTag}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setEditingTag(null)
            setFormData(defaultFormData)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTag ? t('actions.edit') : t('actions.create')}</DialogTitle>
            <DialogDescription>
              {editingTag
                ? `${t('actions.edit')}: ${getTagName(editingTag, isRTL)}`
                : t('management.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_en">{t('form.nameEn')}</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData((p) => ({ ...p, name_en: e.target.value }))}
                  placeholder="Tag name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">{t('form.nameAr')}</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData((p) => ({ ...p, name_ar: e.target.value }))}
                  placeholder="اسم الوسم"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Parent selector */}
            <div className="space-y-2">
              <Label htmlFor="parent">{t('form.parent')}</Label>
              <Select
                value={formData.parent_id || '__none__'}
                onValueChange={(value) =>
                  setFormData((p) => ({ ...p, parent_id: value === '__none__' ? null : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectParent')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('hierarchy.noParent')}</SelectItem>
                  {flatTags
                    ?.filter((tag) => tag.id !== editingTag?.id)
                    .map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {'─'.repeat(tag.hierarchy_level)} {getTagName(tag, isRTL)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <Label>{t('form.color')}</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'size-8 rounded-full border-2 transition-transform hover:scale-110',
                      formData.color === color ? 'border-foreground' : 'border-transparent',
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((p) => ({ ...p, color }))}
                  />
                ))}
              </div>
            </div>

            {/* Description fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description_en">{t('form.descriptionEn')}</Label>
                <Input
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData((p) => ({ ...p, description_en: e.target.value }))}
                  placeholder="Description (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ar">{t('form.descriptionAr')}</Label>
                <Input
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData((p) => ({ ...p, description_ar: e.target.value }))}
                  placeholder="الوصف (اختياري)"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setEditingTag(null)
                setFormData(defaultFormData)
              }}
            >
              {t('common:cancel', 'Cancel')}
            </Button>
            <Button
              onClick={editingTag ? handleUpdateTag : handleCreateTag}
              disabled={
                !formData.name_en || !formData.name_ar || createTag.isPending || updateTag.isPending
              }
            >
              {(createTag.isPending || updateTag.isPending) && (
                <RefreshCw className="size-4 me-2 animate-spin" />
              )}
              {editingTag ? t('common:save', 'Save') : t('actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>
              {tagToDelete && (
                <>
                  {t('delete.description')}
                  <br />
                  <strong>{getTagName(tagToDelete, isRTL)}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <p className="text-sm">{t('delete.warning')}</p>
            </div>

            {tagToDelete?.children_count && tagToDelete.children_count > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 text-warning-foreground">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                  {t('delete.childrenWarning', { count: tagToDelete.children_count })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common:cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteTag} disabled={deleteTag.isPending}>
              {deleteTag.isPending && <RefreshCw className="size-4 me-2 animate-spin" />}
              {t('delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Tags Dialog */}
      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('merge.title')}</DialogTitle>
            <DialogDescription>{t('merge.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source tag */}
            <div className="space-y-2">
              <Label>{t('merge.sourceTag')}</Label>
              <div className="flex items-center gap-2 p-3 rounded-md border">
                <div
                  className="size-4 rounded-full"
                  style={{ backgroundColor: tagToMerge?.color }}
                />
                <span>{tagToMerge && getTagName(tagToMerge, isRTL)}</span>
              </div>
            </div>

            {/* Target tag selector */}
            <div className="space-y-2">
              <Label>{t('merge.targetTag')}</Label>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectParent')} />
                </SelectTrigger>
                <SelectContent>
                  {flatTags
                    ?.filter((tag) => tag.id !== tagToMerge?.id && !tag.is_system)
                    .map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {getTagName(tag, isRTL)}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <p className="text-sm">{t('merge.warning')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMergeDialogOpen(false)}>
              {t('common:cancel', 'Cancel')}
            </Button>
            <Button onClick={handleMergeTags} disabled={!mergeTargetId || mergeTags.isPending}>
              {mergeTags.isPending && <RefreshCw className="size-4 me-2 animate-spin" />}
              {t('merge.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TagHierarchyManager
