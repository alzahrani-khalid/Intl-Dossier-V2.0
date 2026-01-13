/**
 * SearchableSelect Component
 * Mobile-optimized searchable dropdown for large option lists
 * Mobile-first and RTL-compatible
 */

import { useTranslation } from 'react-i18next'
import { forwardRef, useCallback, useState, useId, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, Search, X, Loader2 } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

// =============================================================================
// TYPES
// =============================================================================

export interface SelectOption {
  /** Unique value for the option */
  value: string
  /** Display label */
  label: string
  /** Optional description */
  description?: string
  /** Optional icon component */
  icon?: React.ReactNode
  /** Group this option belongs to */
  group?: string
  /** Whether this option is disabled */
  disabled?: boolean
  /** Additional data for custom rendering */
  metadata?: Record<string, unknown>
}

export interface OptionGroup {
  /** Group identifier */
  id: string
  /** Group label */
  label: string
  /** Options in this group */
  options: SelectOption[]
}

export interface SearchableSelectProps {
  /** Available options */
  options: SelectOption[]
  /** Selected value(s) */
  value?: string | string[]
  /** Placeholder text when nothing is selected */
  placeholder?: string
  /** Search input placeholder */
  searchPlaceholder?: string
  /** Label for the select */
  label?: string
  /** Help text displayed below */
  helpText?: string
  /** Error message */
  error?: string
  /** Allow multiple selections */
  multiple?: boolean
  /** Allow creating new options */
  creatable?: boolean
  /** Text shown when creating new option */
  createOptionText?: string
  /** Text shown when no results */
  emptyText?: string
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether the field is required */
  required?: boolean
  /** Loading state */
  loading?: boolean
  /** Maximum number of options to render (virtualization threshold) */
  maxDisplayed?: number
  /** Callback when value changes */
  onChange?: (value: string | string[] | null) => void
  /** Callback when search query changes (for async loading) */
  onSearchChange?: (query: string) => void
  /** Callback when creating new option */
  onCreate?: (value: string) => void
  /** Visual variant */
  variant?: 'default' | 'aceternity'
  /** Additional container classes */
  containerClassName?: string
  /** Additional trigger button classes */
  className?: string
  /** Custom option renderer */
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode
  /** Custom selected value renderer */
  renderValue?: (selected: SelectOption | SelectOption[]) => React.ReactNode
  /** Group options by their group property */
  groupBy?: boolean
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Filters options based on search query with fuzzy matching
 */
function filterOptions(options: SelectOption[], query: string): SelectOption[] {
  if (!query.trim()) return options

  const lowerQuery = query.toLowerCase().trim()

  return options.filter((option) => {
    const labelMatch = option.label.toLowerCase().includes(lowerQuery)
    const valueMatch = option.value.toLowerCase().includes(lowerQuery)
    const descMatch = option.description?.toLowerCase().includes(lowerQuery)
    return labelMatch || valueMatch || descMatch
  })
}

/**
 * Groups options by their group property
 */
function groupOptions(options: SelectOption[]): OptionGroup[] {
  const grouped: Record<string, SelectOption[]> = {}
  const ungrouped: SelectOption[] = []

  options.forEach((option) => {
    if (option.group) {
      if (!grouped[option.group]) {
        grouped[option.group] = []
      }
      grouped[option.group].push(option)
    } else {
      ungrouped.push(option)
    }
  })

  const groups: OptionGroup[] = Object.entries(grouped).map(([id, opts]) => ({
    id,
    label: id,
    options: opts,
  }))

  // Add ungrouped options as first group if any
  if (ungrouped.length > 0) {
    groups.unshift({
      id: '__ungrouped__',
      label: '',
      options: ungrouped,
    })
  }

  return groups
}

// =============================================================================
// COMPONENT
// =============================================================================

export const SearchableSelect = forwardRef<HTMLButtonElement, SearchableSelectProps>(
  (
    {
      options,
      value,
      placeholder,
      searchPlaceholder,
      label,
      helpText,
      error,
      multiple = false,
      creatable = false,
      createOptionText,
      emptyText,
      disabled = false,
      required = false,
      loading = false,
      maxDisplayed = 50,
      onChange,
      onSearchChange,
      onCreate,
      variant = 'default',
      containerClassName,
      className,
      renderOption,
      renderValue,
      groupBy = false,
    },
    ref,
  ) => {
    const { t, i18n } = useTranslation(['smart-input', 'common'])
    const isRTL = i18n.language === 'ar'
    const uniqueId = useId()

    // State
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Generate IDs for accessibility
    const selectId = `searchable-select-${uniqueId}`
    const labelId = `${selectId}-label`
    const errorId = `${selectId}-error`
    const helpId = `${selectId}-help`

    // Normalize value to array for easier handling
    const selectedValues = useMemo(() => {
      if (!value) return []
      return Array.isArray(value) ? value : [value]
    }, [value])

    // Get selected options
    const selectedOptions = useMemo(() => {
      return options.filter((opt) => selectedValues.includes(opt.value))
    }, [options, selectedValues])

    // Filter and potentially group options
    const filteredOptions = useMemo(() => {
      const filtered = filterOptions(options, searchQuery)
      // Limit displayed options for performance
      return filtered.slice(0, maxDisplayed)
    }, [options, searchQuery, maxDisplayed])

    const groupedOptions = useMemo(() => {
      if (!groupBy) return null
      return groupOptions(filteredOptions)
    }, [filteredOptions, groupBy])

    // Check if we can create new option
    const canCreate = useMemo(() => {
      if (!creatable || !searchQuery.trim()) return false
      const lowerQuery = searchQuery.toLowerCase().trim()
      return !options.some(
        (opt) => opt.value.toLowerCase() === lowerQuery || opt.label.toLowerCase() === lowerQuery,
      )
    }, [creatable, searchQuery, options])

    // Handle option selection
    const handleSelect = useCallback(
      (optionValue: string) => {
        if (multiple) {
          const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter((v) => v !== optionValue)
            : [...selectedValues, optionValue]
          onChange?.(newValues.length > 0 ? newValues : null)
        } else {
          onChange?.(optionValue)
          setOpen(false)
        }
        setSearchQuery('')
      },
      [multiple, selectedValues, onChange],
    )

    // Handle creating new option
    const handleCreate = useCallback(() => {
      if (!canCreate) return
      const trimmed = searchQuery.trim()
      onCreate?.(trimmed)
      handleSelect(trimmed)
    }, [canCreate, searchQuery, onCreate, handleSelect])

    // Handle search input change
    const handleSearchChange = useCallback(
      (newQuery: string) => {
        setSearchQuery(newQuery)
        onSearchChange?.(newQuery)
      },
      [onSearchChange],
    )

    // Handle clear selection
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(multiple ? [] : null)
      },
      [multiple, onChange],
    )

    // Focus search input when popover opens
    useEffect(() => {
      if (open) {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 0)
      }
    }, [open])

    // Render selected value(s)
    const renderSelectedValue = () => {
      if (selectedOptions.length === 0) {
        return (
          <span className="text-muted-foreground">
            {placeholder || t('smart-input:select.placeholder')}
          </span>
        )
      }

      if (renderValue) {
        return renderValue(multiple ? selectedOptions : selectedOptions[0])
      }

      if (multiple) {
        return (
          <span className="flex flex-wrap gap-1">
            {selectedOptions.slice(0, 3).map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {opt.icon}
                {opt.label}
              </span>
            ))}
            {selectedOptions.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                +{selectedOptions.length - 3}
              </span>
            )}
          </span>
        )
      }

      const selected = selectedOptions[0]
      return (
        <span className="flex items-center gap-2 truncate">
          {selected.icon}
          <span className="truncate">{selected.label}</span>
        </span>
      )
    }

    // Render a single option
    const renderSingleOption = (option: SelectOption) => {
      const isSelected = selectedValues.includes(option.value)

      if (renderOption) {
        return renderOption(option, isSelected)
      }

      return (
        <CommandItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          onSelect={() => handleSelect(option.value)}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            'min-h-11 sm:min-h-10', // Touch-friendly height
            isSelected && 'bg-primary/10',
          )}
        >
          <div
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-sm border',
              isSelected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30',
            )}
          >
            {isSelected && <Check className="h-3 w-3" />}
          </div>
          {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{option.label}</div>
            {option.description && (
              <div className="truncate text-xs text-muted-foreground">{option.description}</div>
            )}
          </div>
        </CommandItem>
      )
    }

    // Build aria-describedby
    const describedBy = [error ? errorId : null, helpText ? helpId : null].filter(Boolean).join(' ')

    // Base trigger classes
    const triggerBaseClasses = cn(
      'w-full justify-between text-start font-normal',
      'min-h-11 sm:min-h-10 md:min-h-12', // Touch-friendly height
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
                {selectedValues.length > 0 && !disabled && (
                  <span
                    role="button"
                    aria-label={t('smart-input:select.clear')}
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
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            sideOffset={4}
          >
            <Command shouldFilter={false}>
              {/* Search input */}
              <div className="flex items-center border-b px-3">
                <Search className="h-4 w-4 text-muted-foreground me-2 shrink-0" />
                <CommandInput
                  ref={inputRef}
                  placeholder={searchPlaceholder || t('smart-input:select.search')}
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ms-2" />}
              </div>

              <CommandList className="max-h-[300px] overflow-y-auto">
                {/* Empty state */}
                {filteredOptions.length === 0 && !canCreate && (
                  <CommandEmpty className="py-6 text-center text-sm">
                    {emptyText || t('smart-input:select.empty')}
                  </CommandEmpty>
                )}

                {/* Create option */}
                {canCreate && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleCreate}
                      className="flex items-center gap-2 cursor-pointer min-h-11 sm:min-h-10"
                    >
                      <span className="text-primary">+</span>
                      <span>
                        {createOptionText || t('smart-input:select.create', { value: searchQuery })}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Grouped options */}
                {groupedOptions
                  ? groupedOptions.map((group) => (
                      <CommandGroup key={group.id} heading={group.label || undefined}>
                        {group.options.map(renderSingleOption)}
                      </CommandGroup>
                    ))
                  : /* Ungrouped options */
                    filteredOptions.length > 0 && (
                      <CommandGroup>{filteredOptions.map(renderSingleOption)}</CommandGroup>
                    )}

                {/* Show count if options were truncated */}
                {options.length > maxDisplayed && (
                  <div className="px-2 py-2 text-xs text-muted-foreground text-center border-t">
                    {t('smart-input:select.showingCount', {
                      shown: Math.min(filteredOptions.length, maxDisplayed),
                      total: options.length,
                    })}
                  </div>
                )}
              </CommandList>
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

SearchableSelect.displayName = 'SearchableSelect'

export default SearchableSelect
