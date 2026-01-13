/**
 * TagSelector Component
 *
 * A searchable tag selector with:
 * - Search with auto-complete
 * - Tag suggestions based on entity context
 * - Quick tag assignment/removal
 * - Hierarchical tag display
 *
 * @mobile-first - Designed for 320px+ with responsive breakpoints
 * @rtl-ready - Uses logical properties for Arabic support
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  Plus,
  Search,
  Tag,
  Sparkles,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useTagSearch, useEntityTagging, useTagsFlat } from '@/hooks/useTagHierarchy'
import type {
  TagCategory,
  TagEntityType,
  EntityTagAssignment,
  TagSuggestion,
} from '@/types/tag-hierarchy.types'
import { getTagName, TAG_SUGGESTION_REASON_LABELS } from '@/types/tag-hierarchy.types'

interface TagSelectorProps {
  entityType: TagEntityType
  entityId: string
  className?: string
  disabled?: boolean
  maxDisplayTags?: number
  showSuggestions?: boolean
  onTagsChange?: (tags: EntityTagAssignment[]) => void
}

export function TagSelector({
  entityType,
  entityId,
  className,
  disabled = false,
  maxDisplayTags = 5,
  showSuggestions = true,
  onTagsChange,
}: TagSelectorProps) {
  const { t, i18n } = useTranslation('tags')
  const isRTL = i18n.language === 'ar'
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  // State
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Hooks
  const {
    tags: assignedTags,
    suggestions,
    isLoadingTags,
    isLoadingSuggestions,
    assignTag,
    unassignTag,
    isAssigning,
    isUnassigning,
  } = useEntityTagging(entityType, entityId)

  const { data: allTags } = useTagsFlat()
  const { data: searchResults, isLoading: isSearching } = useTagSearch(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 1 },
  )

  // Get available tags (not already assigned)
  const assignedTagIds = useMemo(() => new Set(assignedTags.map((t) => t.tag_id)), [assignedTags])

  const availableTags = useMemo(() => {
    if (searchQuery && searchResults?.data) {
      return searchResults.data.filter((tag) => !assignedTagIds.has(tag.id))
    }
    if (!allTags) return []
    return allTags.filter((tag) => !assignedTagIds.has(tag.id) && tag.is_active)
  }, [allTags, searchResults, searchQuery, assignedTagIds])

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => !assignedTagIds.has(s.tag_id))
  }, [suggestions, assignedTagIds])

  // Handlers
  const handleAssign = useCallback(
    async (tagId: string, isAutoAssigned = false) => {
      try {
        await assignTag(tagId, {
          is_auto_assigned: isAutoAssigned,
        })
        toast({
          title: t('assignment.assignSuccess'),
        })
        onTagsChange?.(assignedTags)
      } catch (error) {
        toast({
          title: t('errors.assignFailed'),
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        })
      }
    },
    [assignTag, toast, t, onTagsChange, assignedTags],
  )

  const handleUnassign = useCallback(
    async (tagId: string) => {
      try {
        await unassignTag(tagId)
        toast({
          title: t('assignment.unassignSuccess'),
        })
        onTagsChange?.(assignedTags)
      } catch (error) {
        toast({
          title: t('errors.unassignFailed'),
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        })
      }
    },
    [unassignTag, toast, t, onTagsChange, assignedTags],
  )

  const handleApplySuggestion = useCallback(
    (suggestion: TagSuggestion) => {
      handleAssign(suggestion.tag_id, true)
    },
    [handleAssign],
  )

  // Render assigned tag badge
  const renderAssignedTag = (assignment: EntityTagAssignment, index: number) => {
    const tag = assignment.tag || allTags?.find((t) => t.id === assignment.tag_id)
    if (!tag) return null

    return (
      <TooltipProvider key={assignment.id || assignment.tag_id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                'gap-1 pe-1 transition-all',
                assignment.is_auto_assigned && 'border-dashed',
              )}
              style={{
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color,
              }}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="text-xs max-w-24 truncate">{getTagName(tag, isRTL)}</span>
              {!disabled && (
                <button
                  type="button"
                  className="ms-1 rounded-full hover:bg-muted/50 p-0.5"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnassign(assignment.tag_id)
                  }}
                  disabled={isUnassigning}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-xs space-y-1">
              <p className="font-medium">{getTagName(tag, isRTL)}</p>
              {assignment.is_auto_assigned && (
                <p className="text-muted-foreground">{t('assignment.autoAssigned')}</p>
              )}
              {assignment.confidence_score < 1 && (
                <p className="text-muted-foreground">
                  {t('assignment.confidence', {
                    score: Math.round(assignment.confidence_score * 100),
                  })}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn('space-y-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Assigned tags display */}
      <div className="flex flex-wrap items-center gap-1.5">
        {isLoadingTags ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">{t('common:loading', 'Loading...')}</span>
          </div>
        ) : assignedTags.length === 0 ? (
          <span className="text-sm text-muted-foreground">{t('assignment.noAssigned')}</span>
        ) : (
          <>
            {assignedTags
              .slice(0, maxDisplayTags)
              .map((assignment, index) => renderAssignedTag(assignment, index))}
            {assignedTags.length > maxDisplayTags && (
              <Badge variant="outline" className="text-xs">
                +{assignedTags.length - maxDisplayTags}
              </Badge>
            )}
          </>
        )}

        {/* Add tag button */}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                disabled={disabled || isAssigning}
              >
                {isAssigning ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Plus className="size-3" />
                )}
                {t('actions.assign')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align={isRTL ? 'end' : 'start'} side="bottom">
              <Command shouldFilter={false}>
                <CommandInput
                  ref={inputRef}
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        {t('search.noResults')}
                      </div>
                    )}
                  </CommandEmpty>

                  {/* Suggestions section */}
                  {showSuggestions && filteredSuggestions.length > 0 && !searchQuery && (
                    <>
                      <CommandGroup heading={t('suggestions.title')}>
                        {filteredSuggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion.tag_id}
                            value={suggestion.tag_id}
                            onSelect={() => handleApplySuggestion(suggestion)}
                            className="gap-2"
                          >
                            <div
                              className="size-3 rounded-full shrink-0"
                              style={{ backgroundColor: suggestion.color }}
                            />
                            <span className="flex-1 truncate">
                              {isRTL ? suggestion.name_ar : suggestion.name_en}
                            </span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Sparkles className="size-3 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {TAG_SUGGESTION_REASON_LABELS[suggestion.suggestion_reason]?.[
                                    isRTL ? 'ar' : 'en'
                                  ] || suggestion.suggestion_reason}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}

                  {/* Available tags section */}
                  {availableTags.length > 0 && (
                    <CommandGroup heading={t('assignment.available')}>
                      <ScrollArea className="max-h-48">
                        {availableTags.slice(0, 20).map((tag) => (
                          <CommandItem
                            key={tag.id}
                            value={tag.id}
                            onSelect={() => handleAssign(tag.id)}
                            className="gap-2"
                          >
                            <div
                              className="size-3 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="flex-1 truncate">{getTagName(tag, isRTL)}</span>
                            {tag.usage_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {tag.usage_count}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Suggestions quick actions */}
      {showSuggestions && !disabled && filteredSuggestions.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <Sparkles className="size-3 text-amber-500" />
          <span className="text-xs text-muted-foreground">{t('suggestions.title')}:</span>
          <div className="flex flex-wrap gap-1">
            {filteredSuggestions.slice(0, 3).map((suggestion) => (
              <Button
                key={suggestion.tag_id}
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs gap-1"
                onClick={() => handleApplySuggestion(suggestion)}
                disabled={isAssigning}
              >
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: suggestion.color }}
                />
                {isRTL ? suggestion.name_ar : suggestion.name_en}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact tag display for cards and list items
 */
interface TagDisplayProps {
  tags: Array<{ id: string; name_en: string; name_ar: string; color: string }>
  maxDisplay?: number
  className?: string
}

export function TagDisplay({ tags, maxDisplay = 3, className }: TagDisplayProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  if (!tags || tags.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <Tag className="size-3.5 text-muted-foreground" />
      {tags.slice(0, maxDisplay).map((tag) => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-xs px-1.5 py-0"
          style={{
            backgroundColor: `${tag.color}15`,
            borderColor: `${tag.color}40`,
          }}
        >
          {getTagName(tag, isRTL)}
        </Badge>
      ))}
      {tags.length > maxDisplay && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          +{tags.length - maxDisplay}
        </Badge>
      )}
    </div>
  )
}

export default TagSelector
