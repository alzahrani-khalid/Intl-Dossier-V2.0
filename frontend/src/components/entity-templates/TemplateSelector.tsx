/**
 * TemplateSelector Component
 * Feature: Entity Creation Templates
 *
 * Displays available templates for entity creation with:
 * - Favorites and recently used templates prioritized
 * - Keyboard navigation and shortcuts
 * - Context-aware filtering
 * - RTL support
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  useContextAwareTemplates,
  useToggleFavorite,
  useApplyTemplate,
} from '@/hooks/useEntityTemplates'
import { TemplateCard } from './TemplateCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, X, Keyboard, Star, Clock, Sparkles } from 'lucide-react'
import type {
  EntityTemplate,
  TemplateEntityType,
  TemplateContext,
} from '@/types/entity-template.types'

export interface TemplateSelectorProps {
  entityType: TemplateEntityType
  context?: TemplateContext
  onSelect: (template: EntityTemplate, values: Record<string, unknown>) => void
  onSkip?: () => void
  className?: string
}

export function TemplateSelector({
  entityType,
  context,
  onSelect,
  onSkip,
  className,
}: TemplateSelectorProps) {
  const { t, i18n } = useTranslation('entity-templates')
  const isRTL = i18n.language === 'ar'

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Queries & Mutations
  const { data, isLoading, error } = useContextAwareTemplates(entityType, {
    enabled: true,
  })
  const toggleFavorite = useToggleFavorite()
  const { applyTemplate } = useApplyTemplate()

  // Filter templates by search
  const filteredTemplates =
    data?.templates?.filter((template) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        template.name_en.toLowerCase().includes(query) ||
        template.name_ar.includes(query) ||
        template.tags.some((tag) => tag.includes(query))
      )
    }) || []

  // Group templates
  const favorites = filteredTemplates.filter((t) => t.is_favorite)
  const recent = filteredTemplates.filter((t) => t.is_recent && !t.is_favorite)
  const other = filteredTemplates.filter((t) => !t.is_favorite && !t.is_recent)

  // Handle template selection
  const handleSelect = useCallback(
    (template: EntityTemplate) => {
      const values = applyTemplate(template)
      onSelect(template, values)
    },
    [applyTemplate, onSelect],
  )

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    (template: EntityTemplate) => {
      toggleFavorite.mutate(template.id)
    },
    [toggleFavorite],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        !containerRef.current?.contains(document.activeElement) &&
        document.activeElement !== searchInputRef.current
      ) {
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredTemplates.length - 1))
          break

        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break

        case 'Enter':
          e.preventDefault()
          if (filteredTemplates[selectedIndex]) {
            handleSelect(filteredTemplates[selectedIndex])
          }
          break

        case 'Escape':
          e.preventDefault()
          if (searchQuery) {
            setSearchQuery('')
          } else if (onSkip) {
            onSkip()
          }
          break

        case '/':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            searchInputRef.current?.focus()
          }
          break
      }

      // Keyboard shortcut matching
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const shortcutKey = `Alt+${e.key.toUpperCase()}`
        const template = filteredTemplates.find((t) => t.keyboard_shortcut === shortcutKey)
        if (template) {
          e.preventDefault()
          handleSelect(template)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredTemplates, selectedIndex, searchQuery, handleSelect, onSkip])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  if (error) {
    return <div className="p-4 text-center text-destructive">{t('error.loadFailed')}</div>
  }

  return (
    <div
      ref={containerRef}
      data-testid="template-selector"
      className={cn('flex flex-col gap-4', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">{t('title.selectTemplate')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle.selectTemplate')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="h-8 gap-1"
          >
            <Keyboard className="h-4 w-4" />
            <span className="hidden sm:inline">{t('action.shortcuts')}</span>
          </Button>
          {onSkip && (
            <Button variant="outline" size="sm" onClick={onSkip} className="h-8">
              {t('action.skip')}
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {showShortcuts && (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <kbd className="rounded bg-background px-1">↑↓</kbd> {t('shortcut.navigate')}
            </div>
            <div>
              <kbd className="rounded bg-background px-1">Enter</kbd> {t('shortcut.select')}
            </div>
            <div>
              <kbd className="rounded bg-background px-1">/</kbd> {t('shortcut.search')}
            </div>
            <div>
              <kbd className="rounded bg-background px-1">Esc</kbd> {t('shortcut.cancel')}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
            isRTL ? 'end-3' : 'start-3',
          )}
        />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={t('placeholder.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn('h-10', isRTL ? 'pe-3 ps-10' : 'pe-10 ps-10')}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className={cn('absolute top-1/2 h-6 w-6 -translate-y-1/2', isRTL ? 'start-2' : 'end-2')}
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            {searchQuery ? t('empty.noResults') : t('empty.noTemplates')}
          </p>
          {onSkip && (
            <Button variant="outline" onClick={onSkip} className="mt-4">
              {t('action.createFromScratch')}
            </Button>
          )}
        </div>
      )}

      {/* Templates list */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="space-y-4">
          {/* Favorites */}
          {favorites.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Star className="h-4 w-4" />
                {t('section.favorites')}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={filteredTemplates.indexOf(template) === selectedIndex}
                    onClick={handleSelect}
                    onFavoriteToggle={handleToggleFavorite}
                    showKeyboardShortcut
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recently used */}
          {recent.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                {t('section.recent')}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={filteredTemplates.indexOf(template) === selectedIndex}
                    onClick={handleSelect}
                    onFavoriteToggle={handleToggleFavorite}
                    showKeyboardShortcut
                  />
                ))}
              </div>
            </div>
          )}

          {/* All templates */}
          {other.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {t('section.all')}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {other.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={filteredTemplates.indexOf(template) === selectedIndex}
                    onClick={handleSelect}
                    onFavoriteToggle={handleToggleFavorite}
                    showKeyboardShortcut
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TemplateSelector
