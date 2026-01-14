/**
 * QuickEntryDialog Component
 * Feature: Entity Creation Templates
 *
 * Keyboard-driven quick entry mode for power users.
 * Press Alt+T to open, type to filter templates,
 * arrow keys to navigate, Enter to select.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Command } from 'lucide-react'
import { useEntityTemplates, useApplyTemplate } from '@/hooks/useEntityTemplates'
import type {
  EntityTemplate,
  TemplateEntityType,
  TemplateContext,
} from '@/types/entity-template.types'
import {
  formatKeyboardShortcut,
  getColorClass,
  TEMPLATE_ENTITY_TYPES,
} from '@/types/entity-template.types'
import {
  FileText,
  Users,
  Globe,
  Building,
  Calendar,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  Search,
  FileSearch,
  Plane,
  Flag,
  Lightbulb,
  Clock,
  Star,
} from 'lucide-react'

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Globe,
  Building,
  Calendar,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  Search,
  FileSearch,
  Plane,
  Flag,
  Lightbulb,
  Clock,
  Star,
}

export interface QuickEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType?: TemplateEntityType
  context?: TemplateContext
  onSelect: (
    template: EntityTemplate,
    values: Record<string, unknown>,
    entityType: TemplateEntityType,
  ) => void
}

export function QuickEntryDialog({
  open,
  onOpenChange,
  entityType,
  context,
  onSelect,
}: QuickEntryDialogProps) {
  const { t, i18n } = useTranslation('entity-templates')
  const isRTL = i18n.language === 'ar'

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedEntityType, setSelectedEntityType] = useState<TemplateEntityType>(
    entityType || 'task',
  )

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch templates for selected entity type
  const { data, isLoading } = useEntityTemplates(selectedEntityType, {
    context,
    enabled: open,
  })

  const { applyTemplate } = useApplyTemplate()

  // Filter templates by search query
  const filteredTemplates =
    data?.templates?.filter((template) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()

      // Support entity type prefix (e.g., "task:" or "commitment:")
      const colonIndex = query.indexOf(':')
      if (colonIndex > 0) {
        const typePrefix = query.substring(0, colonIndex)
        const templateQuery = query.substring(colonIndex + 1).trim()

        // Check if type matches
        if (!selectedEntityType.startsWith(typePrefix)) {
          return false
        }

        // Filter by remaining query
        if (!templateQuery) return true
        return (
          template.name_en.toLowerCase().includes(templateQuery) ||
          template.name_ar.includes(templateQuery) ||
          template.tags.some((tag) => tag.includes(templateQuery))
        )
      }

      return (
        template.name_en.toLowerCase().includes(query) ||
        template.name_ar.includes(query) ||
        template.tags.some((tag) => tag.includes(query))
      )
    }) || []

  // Handle template selection
  const handleSelect = useCallback(
    (template: EntityTemplate) => {
      const values = applyTemplate(template)
      onSelect(template, values, selectedEntityType)
      onOpenChange(false)
      setSearchQuery('')
      setSelectedIndex(0)
    },
    [applyTemplate, onSelect, selectedEntityType, onOpenChange],
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
          onOpenChange(false)
          break

        case 'Tab':
          // Cycle through entity types
          e.preventDefault()
          const currentIndex = TEMPLATE_ENTITY_TYPES.indexOf(selectedEntityType)
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + TEMPLATE_ENTITY_TYPES.length) % TEMPLATE_ENTITY_TYPES.length
            : (currentIndex + 1) % TEMPLATE_ENTITY_TYPES.length
          setSelectedEntityType(TEMPLATE_ENTITY_TYPES[nextIndex])
          setSelectedIndex(0)
          break
      }
    },
    [filteredTemplates, selectedIndex, handleSelect, onOpenChange, selectedEntityType],
  )

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('')
      setSelectedIndex(0)
      if (entityType) {
        setSelectedEntityType(entityType)
      }
      // Focus input after a short delay to ensure dialog is open
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, entityType])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery, selectedEntityType])

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = document.querySelector(`[data-template-index="${selectedIndex}"]`)
    selectedElement?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Entity type display name
  const getEntityTypeLabel = (type: TemplateEntityType) => {
    const labels: Record<TemplateEntityType, string> = {
      dossier: t('entityType.dossier'),
      engagement: t('entityType.engagement'),
      commitment: t('entityType.commitment'),
      task: t('entityType.task'),
      intake: t('entityType.intake'),
      position: t('entityType.position'),
      contact: t('entityType.contact'),
      calendar_event: t('entityType.calendarEvent'),
    }
    return labels[type]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] max-w-lg overflow-hidden p-0"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Command className="h-4 w-4" />
            {t('quickEntry.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="p-3">
          {/* Entity type tabs */}
          <div className="mb-3 flex flex-wrap gap-1">
            {(['task', 'commitment', 'engagement', 'dossier'] as TemplateEntityType[]).map(
              (type) => (
                <Badge
                  key={type}
                  variant={selectedEntityType === type ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedEntityType === type && 'bg-primary',
                  )}
                  onClick={() => {
                    setSelectedEntityType(type)
                    setSelectedIndex(0)
                  }}
                >
                  {getEntityTypeLabel(type)}
                </Badge>
              ),
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search
              className={cn(
                'absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
                isRTL ? 'end-3' : 'start-3',
              )}
            />
            <Input
              ref={inputRef}
              type="text"
              placeholder={t('quickEntry.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn('h-10', isRTL ? 'pe-3 ps-10' : 'pe-3 ps-10')}
            />
          </div>
        </div>

        {/* Templates list */}
        <div className="max-h-[50vh] overflow-y-auto px-3 pb-3">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">{t('quickEntry.loading')}</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('quickEntry.noResults')}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTemplates.map((template, index) => {
                const IconComponent = ICON_MAP[template.icon] || FileText
                const name = isRTL ? template.name_ar : template.name_en

                return (
                  <div
                    key={template.id}
                    data-template-index={index}
                    onClick={() => handleSelect(template)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors',
                      index === selectedIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                        index === selectedIndex
                          ? 'bg-primary-foreground/20'
                          : getColorClass(template),
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{name}</span>
                        {template.is_favorite && (
                          <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        {template.tags.slice(0, 2).map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                    </div>

                    {template.keyboard_shortcut && (
                      <kbd
                        className={cn(
                          'shrink-0 rounded px-1.5 py-0.5 font-mono text-xs',
                          index === selectedIndex ? 'bg-primary-foreground/20' : 'bg-muted',
                        )}
                      >
                        {formatKeyboardShortcut(template.keyboard_shortcut)}
                      </kbd>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with hints */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              <kbd className="rounded bg-muted px-1">↑↓</kbd> {t('shortcut.navigate')}
            </span>
            <span>
              <kbd className="rounded bg-muted px-1">Enter</kbd> {t('shortcut.select')}
            </span>
            <span>
              <kbd className="rounded bg-muted px-1">Tab</kbd> {t('shortcut.switchType')}
            </span>
            <span>
              <kbd className="rounded bg-muted px-1">Esc</kbd> {t('shortcut.close')}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuickEntryDialog
