/**
 * Rich Entity Autocomplete Component
 * Feature: rich-entity-autocomplete
 *
 * Provides rich autocomplete for entity linking with:
 * - Entity previews with key details, status, recent activity
 * - Disambiguation between similar entities
 * - Mobile-first design with RTL support
 * - Touch-friendly interactions
 */

import { forwardRef, useCallback, useState, useId, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  Search,
  X,
  Loader2,
  ChevronDown,
  Building2,
  Globe,
  Users,
  FileText,
  Filter,
} from 'lucide-react'
import { Command, CommandInput, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EntityPreviewCard } from './EntityPreviewCard'
import { useEntityPreviewSearch, type EntityWithPreview } from './useEntityPreviewSearch'

// Entity type - matching the backend types
type EntityType =
  | 'dossier'
  | 'position'
  | 'mou'
  | 'engagement'
  | 'assignment'
  | 'commitment'
  | 'intelligence_signal'
  | 'organization'
  | 'country'
  | 'forum'
  | 'working_group'
  | 'topic'

// =============================================================================
// TYPES
// =============================================================================

export interface RichEntityAutocompleteProps {
  /** Selected entity value */
  value?: EntityWithPreview | null
  /** Placeholder text */
  placeholder?: string
  /** Search placeholder */
  searchPlaceholder?: string
  /** Label for the field */
  label?: string
  /** Help text */
  helpText?: string
  /** Error message */
  error?: string
  /** Entity types to search (defaults to all) */
  entityTypes?: EntityType[]
  /** Entity IDs to exclude from results */
  excludeIds?: string[]
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether the field is required */
  required?: boolean
  /** Loading state */
  loading?: boolean
  /** Show entity type filter */
  showTypeFilter?: boolean
  /** Show compact preview cards */
  compactPreview?: boolean
  /** Callback when value changes */
  onChange?: (entity: EntityWithPreview | null) => void
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void
  /** Visual variant */
  variant?: 'default' | 'aceternity'
  /** Additional container classes */
  containerClassName?: string
  /** Additional trigger button classes */
  className?: string
  /** Minimum characters to trigger search */
  minSearchLength?: number
  /** Debounce delay in ms */
  debounceMs?: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENTITY_TYPE_OPTIONS: {
  value: EntityType
  labelEn: string
  labelAr: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: 'dossier', labelEn: 'Dossier', labelAr: 'ملف', icon: FileText },
  { value: 'organization', labelEn: 'Organization', labelAr: 'منظمة', icon: Building2 },
  { value: 'country', labelEn: 'Country', labelAr: 'دولة', icon: Globe },
  { value: 'forum', labelEn: 'Forum', labelAr: 'منتدى', icon: Users },
]

// =============================================================================
// COMPONENT
// =============================================================================

export const RichEntityAutocomplete = forwardRef<HTMLButtonElement, RichEntityAutocompleteProps>(
  (
    {
      value,
      placeholder,
      searchPlaceholder,
      label,
      helpText,
      error,
      entityTypes,
      excludeIds = [],
      disabled = false,
      required = false,
      loading: externalLoading = false,
      showTypeFilter = true,
      compactPreview = false,
      onChange,
      onSearchChange,
      variant = 'default',
      containerClassName,
      className,
      minSearchLength = 2,
      debounceMs = 300,
    },
    ref,
  ) => {
    const { t, i18n } = useTranslation(['rich-autocomplete', 'common'])
    const isRTL = i18n.language === 'ar'
    const uniqueId = useId()

    // State
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(entityTypes || [])
    const [showFilters, setShowFilters] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Generate IDs for accessibility
    const selectId = `rich-entity-autocomplete-${uniqueId}`
    const labelId = `${selectId}-label`
    const errorId = `${selectId}-error`
    const helpId = `${selectId}-help`

    // Entity search
    const {
      data: searchResults,
      isLoading: isSearching,
      isFetching,
    } = useEntityPreviewSearch(
      {
        query: searchQuery,
        entity_types: selectedTypes.length > 0 ? selectedTypes : entityTypes,
        exclude_ids: [...excludeIds, ...(value ? [value.entity_id] : [])],
      },
      {
        debounceMs,
        minQueryLength: minSearchLength,
        enabled: open,
        limit: 20,
      },
    )

    const isLoading = externalLoading || isSearching || isFetching

    // Handle search input change
    const handleSearchChange = useCallback(
      (newQuery: string) => {
        setSearchQuery(newQuery)
        onSearchChange?.(newQuery)
      },
      [onSearchChange],
    )

    // Handle entity selection
    const handleSelect = useCallback(
      (entity: EntityWithPreview) => {
        onChange?.(entity)
        setOpen(false)
        setSearchQuery('')
      },
      [onChange],
    )

    // Handle clear selection
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(null)
      },
      [onChange],
    )

    // Handle type filter toggle
    const handleToggleType = useCallback((type: EntityType) => {
      setSelectedTypes((prev) => {
        if (prev.includes(type)) {
          return prev.filter((t) => t !== type)
        }
        return [...prev, type]
      })
    }, [])

    // Focus search input when popover opens
    useEffect(() => {
      if (open) {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 0)
      }
    }, [open])

    // Render selected value
    const renderSelectedValue = () => {
      if (!value) {
        return <span className="text-muted-foreground">{placeholder || t('placeholder')}</span>
      }

      const displayName = isRTL ? value.name_ar : value.name_en
      const subtitle = isRTL ? value.subtitle_ar : value.subtitle_en

      return (
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="flex-shrink-0 text-xs">
            {isRTL
              ? ENTITY_TYPE_OPTIONS.find((o) => o.value === value.entity_type)?.labelAr
              : ENTITY_TYPE_OPTIONS.find((o) => o.value === value.entity_type)?.labelEn}
          </Badge>
          <div className="flex flex-col min-w-0">
            <span className="truncate font-medium text-start">{displayName}</span>
            {subtitle && (
              <span className="truncate text-xs text-muted-foreground text-start">{subtitle}</span>
            )}
          </div>
        </div>
      )
    }

    // Build aria-describedby
    const describedBy = [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(' ')

    // Base trigger classes
    const triggerBaseClasses = cn(
      'w-full justify-between text-start font-normal',
      'min-h-11 sm:min-h-10 md:min-h-12',
      'px-4 py-2',
      error ? 'border-red-500 dark:border-red-400' : 'border-input dark:border-gray-600',
      disabled && 'opacity-50 cursor-not-allowed',
    )

    const aceternityTriggerClasses = cn(
      triggerBaseClasses,
      'bg-white dark:bg-zinc-800',
      'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)]',
      open &&
        'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),_0px_1px_0px_0px_rgba(25,28,33,0.04),_0px_0px_0px_2px_rgba(var(--primary),0.3)]',
    )

    const triggerClasses = variant === 'aceternity' ? aceternityTriggerClasses : triggerBaseClasses

    return (
      <div className={cn('space-y-2', containerClassName)} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Label */}
        {label && (
          <motion.label
            id={labelId}
            className={cn(
              'block font-medium text-start',
              'text-sm sm:text-base',
              'text-gray-700 dark:text-gray-300',
              error && 'text-red-700 dark:text-red-400',
            )}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && (
              <span className="text-red-500 ms-1" aria-label={t('common:validation.required')}>
                *
              </span>
            )}
          </motion.label>
        )}

        {/* Select trigger */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-labelledby={label ? labelId : undefined}
              aria-describedby={describedBy || undefined}
              aria-invalid={!!error}
              aria-required={required}
              disabled={disabled}
              className={cn(triggerClasses, className)}
            >
              <span className="flex-1 truncate text-start">{renderSelectedValue()}</span>
              <div className="flex items-center gap-1 ms-2">
                {/* Clear button */}
                {value && !disabled && (
                  <span
                    role="button"
                    aria-label={t('clear')}
                    onClick={handleClear}
                    className="p-0.5 hover:bg-muted rounded-sm"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
                {/* Chevron */}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    open && 'rotate-180',
                    isRTL && 'rotate-180',
                  )}
                />
              </div>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] min-w-[320px] sm:min-w-[400px] p-0"
            align="start"
            sideOffset={4}
          >
            <Command shouldFilter={false}>
              {/* Search input + Filter toggle */}
              <div className="flex items-center border-b">
                <div className="flex-1 flex items-center px-3">
                  <Search className="h-4 w-4 text-muted-foreground me-2 shrink-0" />
                  <CommandInput
                    ref={inputRef}
                    placeholder={searchPlaceholder || t('searchPlaceholder')}
                    value={searchQuery}
                    onValueChange={handleSearchChange}
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ms-2" />
                  )}
                </div>
                {showTypeFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="me-2"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Type filter chips */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 p-2">
                      {ENTITY_TYPE_OPTIONS.map((option) => {
                        const isActive = selectedTypes.includes(option.value)
                        const Icon = option.icon
                        return (
                          <Button
                            key={option.value}
                            type="button"
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className={cn('h-8', isActive && 'bg-primary text-primary-foreground')}
                            onClick={() => handleToggleType(option.value)}
                          >
                            <Icon className="h-3.5 w-3.5 me-1.5" />
                            {isRTL ? option.labelAr : option.labelEn}
                          </Button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results list */}
              <CommandList className="max-h-[400px] overflow-y-auto p-2">
                {/* Empty state */}
                {searchQuery.length < minSearchLength && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('minSearchHint', { count: minSearchLength })}</p>
                  </div>
                )}

                {/* No results */}
                {searchQuery.length >= minSearchLength &&
                  !isLoading &&
                  (!searchResults || searchResults.length === 0) && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('noResults')}</p>
                      <p className="text-xs mt-1">{t('noResultsHint')}</p>
                    </div>
                  )}

                {/* Loading state */}
                {searchQuery.length >= minSearchLength && isLoading && (
                  <div className="py-8 text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t('searching')}</p>
                  </div>
                )}

                {/* Results */}
                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {/* Results count */}
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      {t('resultsCount', { count: searchResults.length })}
                    </div>

                    {/* Entity cards */}
                    {searchResults.map((entity) => (
                      <EntityPreviewCard
                        key={`${entity.entity_type}-${entity.entity_id}`}
                        entity={entity}
                        isSelected={
                          value?.entity_id === entity.entity_id &&
                          value?.entity_type === entity.entity_type
                        }
                        compact={compactPreview}
                        showRecentActivity={!compactPreview}
                        showKeyDetails={true}
                        onClick={() => handleSelect(entity)}
                      />
                    ))}
                  </div>
                )}
              </CommandList>

              {/* Footer hint */}
              {searchResults && searchResults.length > 0 && (
                <div className="border-t px-3 py-2 text-xs text-center text-muted-foreground">
                  {t('selectHint')}
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>

        {/* Help text */}
        <AnimatePresence mode="wait">
          {helpText && !error && (
            <motion.p
              id={helpId}
              key="help-text"
              className="text-sm text-gray-600 dark:text-gray-400 text-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {helpText}
            </motion.p>
          )}

          {/* Error message */}
          {error && (
            <motion.p
              id={errorId}
              key="error"
              className="text-sm text-red-600 dark:text-red-400 text-start"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  },
)

RichEntityAutocomplete.displayName = 'RichEntityAutocomplete'

export default RichEntityAutocomplete
