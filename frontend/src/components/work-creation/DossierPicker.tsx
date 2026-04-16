/**
 * DossierPicker Component
 * Feature: 033-unified-work-creation-hub
 *
 * Searchable combobox for selecting dossiers with:
 * - Recent dossiers from localStorage
 * - Autocomplete search via API
 * - RTL and mobile-first support
 */

import { useState, useEffect, useCallback, useId } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronsUpDown,
  Search,
  X,
  Globe,
  Building2,
  Users,
  FileText,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { autocompleteDossiers, type AutocompleteResult } from '@/services/search-api'
import type { DossierType } from '@/services/dossier-api'
import { useDirection } from '@/hooks/useDirection'

const STORAGE_KEY = 'recent_dossiers_for_work_creation'
const MAX_RECENT = 5
const DEBOUNCE_MS = 300
const MIN_SEARCH_CHARS = 2

export interface DossierOption {
  id: string
  name_en: string
  name_ar: string
  type: DossierType
  status: string
}

export interface DossierPickerProps {
  value?: string
  onChange?: (dossierId: string | null, dossier?: DossierOption) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  /** Pre-selected dossier info (for display when value is set externally) */
  selectedDossier?: DossierOption
  /** Filter results to a specific dossier type (or array of types) */
  filterByDossierType?: DossierType | DossierType[]
  /** Allow quick-adding a new dossier if not found */
  allowQuickAdd?: boolean
  /** Callback when user wants to quick-add a new dossier */
  onQuickAdd?: (searchQuery: string) => void
  /** Opt into multi-select mode (source of truth becomes `values` + `onValuesChange`) */
  multiple?: boolean
  /** Selected dossier ids (multi-select only) */
  values?: string[]
  /** Callback fired with the next (ids, dossiers) pair on add/remove (multi-select only) */
  onValuesChange?: (ids: string[], dossiers: DossierOption[]) => void
  /** Pre-selected dossier info for chip rendering (multi-select only) */
  selectedDossiers?: DossierOption[]
}

/**
 * Get icon for dossier type
 */
function getDossierTypeIcon(type: DossierType) {
  switch (type) {
    case 'country':
      return Globe
    case 'organization':
      return Building2
    case 'forum':
      return Users
    default:
      return FileText
  }
}

/**
 * Get recent dossiers from localStorage
 */
function getRecentDossiers(): DossierOption[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to parse recent dossiers from localStorage:', e)
  }
  return []
}

/**
 * Add dossier to recent list
 */
function addRecentDossier(dossier: DossierOption): void {
  try {
    const recent = getRecentDossiers()
    const updated = [dossier, ...recent.filter((d) => d.id !== dossier.id)].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('Failed to save recent dossier to localStorage:', e)
  }
}

export function DossierPicker({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  selectedDossier: externalSelectedDossier,
  filterByDossierType,
  allowQuickAdd = false,
  onQuickAdd,
  multiple,
  values,
  onValuesChange,
  selectedDossiers,
}: DossierPickerProps) {
  const { t } = useTranslation('work-creation')
  const { isRTL } = useDirection()
  const isMulti = Boolean(multiple)
  const [open, setOpen] = useState(false)
  const listboxId = useId()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DossierOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentDossiers, setRecentDossiers] = useState<DossierOption[]>([])
  const [selectedDossier, setSelectedDossier] = useState<DossierOption | undefined>(
    externalSelectedDossier,
  )

  // Load recent dossiers on mount
  useEffect(() => {
    setRecentDossiers(getRecentDossiers())
  }, [])

  // Update selected dossier when external prop changes
  useEffect(() => {
    if (externalSelectedDossier) {
      setSelectedDossier(externalSelectedDossier)
    }
  }, [externalSelectedDossier])

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < MIN_SEARCH_CHARS) {
      setSearchResults([])
      return undefined
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const typeForApi = Array.isArray(filterByDossierType)
          ? filterByDossierType[0]
          : filterByDossierType
        const response = await autocompleteDossiers({
          query: searchQuery,
          limit: 10,
          dossierType: typeForApi,
        })
        const results: DossierOption[] = response.suggestions.map((s: AutocompleteResult) => ({
          id: s.id,
          name_en: s.name_en,
          name_ar: s.name_ar,
          type: s.type,
          status: s.status,
        }))
        setSearchResults(results)
      } catch (error) {
        console.error('Failed to search dossiers:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filterByDossierType])

  const handleSelect = useCallback(
    (dossier: DossierOption) => {
      if (isMulti) {
        const current = values ?? []
        if (current.includes(dossier.id)) return
        const nextIds = [...current, dossier.id]
        const nextDossiers = [...(selectedDossiers ?? []), dossier]
        addRecentDossier(dossier)
        setRecentDossiers(getRecentDossiers())
        onValuesChange?.(nextIds, nextDossiers)
        setSearchQuery('')
        return
      }
      setSelectedDossier(dossier)
      addRecentDossier(dossier)
      setRecentDossiers(getRecentDossiers())
      onChange?.(dossier.id, dossier)
      setOpen(false)
      setSearchQuery('')
    },
    [isMulti, values, selectedDossiers, onValuesChange, onChange],
  )

  const handleRemove = useCallback(
    (id: string) => {
      const nextIds = (values ?? []).filter((v) => v !== id)
      const nextDossiers = (selectedDossiers ?? []).filter((d) => d.id !== id)
      onValuesChange?.(nextIds, nextDossiers)
    },
    [values, selectedDossiers, onValuesChange],
  )

  const handleClear = useCallback(() => {
    setSelectedDossier(undefined)
    onChange?.(null)
  }, [onChange])

  const displayName = selectedDossier
    ? isRTL
      ? selectedDossier.name_ar || selectedDossier.name_en
      : selectedDossier.name_en
    : null

  const Icon = selectedDossier ? getDossierTypeIcon(selectedDossier.type) : null

  return (
    <div className={cn('w-full', className)}>
      {/* Selected dossier display (single-select) */}
      {!isMulti && selectedDossier && (
        <div className="flex items-center gap-2 p-3 mb-2 rounded-lg border bg-muted/50">
          {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
          <span className="flex-1 text-sm font-medium truncate">{displayName}</span>
          <Badge variant="outline" className="text-xs">
            {selectedDossier.type}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-6 p-0"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="size-3" />
            <span className="sr-only">{t('form.clear', 'Clear')}</span>
          </Button>
        </div>
      )}

      {/* Selected dossier chips (multi-select) */}
      {isMulti && (selectedDossiers ?? []).length > 0 && (
        <div
          className="flex flex-row flex-nowrap gap-2 overflow-x-auto overflow-y-hidden py-2 mb-2"
          aria-live="polite"
        >
          {(selectedDossiers ?? []).map((d) => {
            const ChipIcon = getDossierTypeIcon(d.type)
            const chipName = isRTL ? d.name_ar || d.name_en : d.name_en
            return (
              <Badge
                key={d.id}
                variant="outline"
                className="shrink-0 flex items-center gap-1 min-h-8 px-2"
              >
                {ChipIcon && <ChipIcon className="size-3" />}
                <span className="truncate max-w-[120px]">{chipName}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(d.id)}
                  className="min-h-6 min-w-6 inline-flex items-center justify-center"
                  aria-label={t('chip.remove', { name: chipName, defaultValue: `Remove ${chipName}` })}
                  disabled={disabled}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Dossier picker popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-controls={listboxId}
            aria-expanded={open}
            className={cn(
              'w-full min-h-11 justify-between font-normal',
              !selectedDossier && 'text-muted-foreground',
            )}
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <Search className="size-4 shrink-0" />
              {selectedDossier
                ? t('form.changeDossier', 'Change dossier')
                : placeholder || t('form.selectDossier', 'Select a dossier')}
            </span>
            <ChevronsUpDown className={cn('size-4 shrink-0 opacity-50', isRTL && 'rotate-180')} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('form.searchDossiers', 'Search dossiers...')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList id={listboxId}>
              <CommandEmpty>
                {isSearching ? (
                  t('form.searching', 'Searching...')
                ) : searchQuery.length < MIN_SEARCH_CHARS ? (
                  t('form.typeToSearch', 'Type at least 2 characters to search')
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="text-muted-foreground">
                      {t('form.noDossiersFound', 'No dossiers found')}
                    </span>
                    {allowQuickAdd && searchQuery.length >= MIN_SEARCH_CHARS && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-9 gap-2"
                        onClick={() => {
                          if (onQuickAdd) {
                            onQuickAdd(searchQuery)
                          }
                          setOpen(false)
                        }}
                      >
                        <Plus className="size-4" />
                        {t('form.createNew', 'Create "{{name}}"', { name: searchQuery })}
                      </Button>
                    )}
                  </div>
                )}
              </CommandEmpty>

              {/* Search results */}
              {searchResults.length > 0 && (
                <CommandGroup heading={t('form.searchResults', 'Search Results')}>
                  {searchResults.map((dossier) => {
                    const DossierIcon = getDossierTypeIcon(dossier.type)
                    const name = isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en
                    const isSelected = isMulti
                      ? (values ?? []).includes(dossier.id)
                      : value === dossier.id
                    return (
                      <CommandItem
                        key={dossier.id}
                        value={dossier.id}
                        onSelect={() => handleSelect(dossier)}
                        className="min-h-11"
                      >
                        <Check
                          className={cn(
                            'size-4 shrink-0',
                            isRTL ? 'ms-2' : 'me-2',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <DossierIcon
                          className={cn(
                            'size-4 shrink-0 text-muted-foreground',
                            isRTL ? 'ms-2' : 'me-2',
                          )}
                        />
                        <span className="flex-1 truncate">{name}</span>
                        <Badge variant="outline" className="text-xs ms-2">
                          {dossier.type}
                        </Badge>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* Quick add option at the bottom of search results */}
              {allowQuickAdd &&
                searchQuery.length >= MIN_SEARCH_CHARS &&
                searchResults.length > 0 && (
                  <CommandGroup>
                    <CommandItem
                      value="__create_new__"
                      onSelect={() => {
                        if (onQuickAdd) {
                          onQuickAdd(searchQuery)
                        }
                        setOpen(false)
                      }}
                      className="min-h-11 text-primary"
                    >
                      <Plus className={cn('size-4 shrink-0', isRTL ? 'ms-2' : 'me-2')} />
                      <span className="flex-1">
                        {t('form.createNew', 'Create "{{name}}"', { name: searchQuery })}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}

              {/* Recent dossiers (shown when no search query) */}
              {searchQuery.length < MIN_SEARCH_CHARS && recentDossiers.length > 0 && (
                <CommandGroup heading={t('form.recentDossiers', 'Recent Dossiers')}>
                  {recentDossiers
                    .filter((d) => {
                      if (!filterByDossierType) return true
                      const types = Array.isArray(filterByDossierType)
                        ? filterByDossierType
                        : [filterByDossierType]
                      return types.includes(d.type)
                    })
                    .map((dossier) => {
                      const DossierIcon = getDossierTypeIcon(dossier.type)
                      const name = isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en
                      const isSelected = isMulti
                        ? (values ?? []).includes(dossier.id)
                        : value === dossier.id
                      return (
                        <CommandItem
                          key={dossier.id}
                          value={dossier.id}
                          onSelect={() => handleSelect(dossier)}
                          className="min-h-11"
                        >
                          <Check
                            className={cn(
                              'size-4 shrink-0',
                              isRTL ? 'ms-2' : 'me-2',
                              isSelected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <DossierIcon
                            className={cn(
                              'size-4 shrink-0 text-muted-foreground',
                              isRTL ? 'ms-2' : 'me-2',
                            )}
                          />
                          <span className="flex-1 truncate">{name}</span>
                          <Badge variant="outline" className="text-xs ms-2">
                            {dossier.type}
                          </Badge>
                        </CommandItem>
                      )
                    })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
