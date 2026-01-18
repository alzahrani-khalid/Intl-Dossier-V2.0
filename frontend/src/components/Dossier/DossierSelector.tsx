/**
 * DossierSelector Component
 * Feature: 035-dossier-context (Smart Dossier Context Inheritance)
 * Task: T034
 *
 * Required dossier selector for work item creation.
 * Shows when no dossier context is available (generic pages).
 * Mobile-first, RTL support, WCAG 2.1 AA compliant.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Check,
  X,
  Globe,
  Building2,
  Users,
  Target,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDossierSearch, type DossierSearchResult } from '@/hooks/useDossierSearch'
import type { DossierType as BaseDossierType } from '@/types/dossier'

// ============================================================================
// Type Icons
// ============================================================================

const dossierTypeIcons: Record<string, React.ElementType> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  engagement: FileText,
  topic: Target,
  theme: Target, // Alias for compatibility
  working_group: Users,
  person: FileText,
}

// ============================================================================
// Types
// ============================================================================

export interface SelectedDossier {
  id: string
  type: string
  name_en: string
  name_ar: string | null
}

export interface DossierSelectorProps {
  /**
   * Currently selected dossier IDs (for controlled component).
   * When provided, the component operates in controlled mode.
   */
  value?: string[]
  /**
   * Currently selected dossiers with full data (for controlled mode).
   * If provided along with `value`, avoids the need to re-fetch dossier details.
   */
  selectedDossiers?: SelectedDossier[]
  /**
   * Callback when selection changes.
   */
  onChange: (dossierIds: string[], dossiers: SelectedDossier[]) => void
  /**
   * Whether at least one dossier is required.
   * @default true
   */
  required?: boolean
  /**
   * Whether to allow multiple selections.
   * @default false
   */
  multiple?: boolean
  /**
   * Whether the selector is disabled.
   */
  disabled?: boolean
  /**
   * Filter by dossier type(s).
   */
  types?: BaseDossierType[]
  /**
   * Show validation error.
   */
  error?: string
  /**
   * Custom label.
   */
  label?: string
  /**
   * Hint text to show below the selector.
   */
  hint?: string
  /**
   * Additional CSS classes.
   */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function DossierSelector({
  value,
  selectedDossiers: externalSelectedDossiers,
  onChange,
  required = true,
  multiple = false,
  disabled = false,
  types,
  error,
  label,
  hint,
  className,
}: DossierSelectorProps) {
  const { t, i18n } = useTranslation('dossier-context')
  const isRTL = i18n.language === 'ar'

  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [internalSelectedDossiers, setInternalSelectedDossiers] = useState<SelectedDossier[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Determine if we're in controlled mode (value prop provided)
  const isControlled = value !== undefined

  // Use external dossiers if provided (controlled mode), otherwise use internal state
  const selectedDossiers =
    isControlled && externalSelectedDossiers ? externalSelectedDossiers : internalSelectedDossiers

  const setSelectedDossiers = isControlled
    ? (_dossiers: SelectedDossier[]) => {
        // In controlled mode, state is managed externally via onChange
      }
    : setInternalSelectedDossiers

  // Sync internal state with external value when in controlled mode
  // This allows controlled mode to work when only value (IDs) is provided
  useEffect(() => {
    if (isControlled && externalSelectedDossiers) {
      // Filter external dossiers to match the value array
      const filtered = externalSelectedDossiers.filter((d) => value?.includes(d.id))
      // Only update if different to avoid loops
      const currentIds = internalSelectedDossiers
        .map((d) => d.id)
        .sort()
        .join(',')
      const newIds = filtered
        .map((d) => d.id)
        .sort()
        .join(',')
      if (currentIds !== newIds) {
        setInternalSelectedDossiers(filtered)
      }
    }
  }, [isControlled, value, externalSelectedDossiers])

  // Search dossiers
  const { results, isSearching, isLoading } = useDossierSearch({
    query: searchQuery,
    types,
    limit: 20,
    enabled: open,
  })

  // Handle selection
  const handleSelect = useCallback(
    (dossier: DossierSearchResult) => {
      const newSelected: SelectedDossier = {
        id: dossier.id,
        type: dossier.type,
        name_en: dossier.name_en,
        name_ar: dossier.name_ar,
      }

      if (multiple) {
        // Toggle selection
        const isAlreadySelected = selectedDossiers.some((d) => d.id === dossier.id)
        let updated: SelectedDossier[]

        if (isAlreadySelected) {
          updated = selectedDossiers.filter((d) => d.id !== dossier.id)
        } else {
          updated = [...selectedDossiers, newSelected]
        }

        setSelectedDossiers(updated)
        onChange(
          updated.map((d) => d.id),
          updated,
        )
      } else {
        // Single selection
        setSelectedDossiers([newSelected])
        onChange([newSelected.id], [newSelected])
        setOpen(false)
        setSearchQuery('')
      }
    },
    [multiple, selectedDossiers, onChange],
  )

  // Remove selection
  const handleRemove = useCallback(
    (dossierId: string) => {
      const updated = selectedDossiers.filter((d) => d.id !== dossierId)
      setSelectedDossiers(updated)
      onChange(
        updated.map((d) => d.id),
        updated,
      )
    },
    [selectedDossiers, onChange],
  )

  // Clear all selections
  const handleClear = useCallback(() => {
    setSelectedDossiers([])
    onChange([], [])
  }, [onChange])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !searchQuery && selectedDossiers.length > 0) {
        // Remove last selected dossier
        const lastDossier = selectedDossiers[selectedDossiers.length - 1]
        if (lastDossier) {
          handleRemove(lastDossier.id)
        }
      }
    },
    [searchQuery, selectedDossiers, handleRemove],
  )

  // Get display name
  const getDisplayName = (dossier: SelectedDossier | DossierSearchResult) => {
    return isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en
  }

  // Check if dossier is selected
  const isSelected = (dossierId: string) => {
    return selectedDossiers.some((d) => d.id === dossierId)
  }

  return (
    <div className={cn('w-full space-y-2', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Label */}
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ms-1">*</span>}
        </Label>
      )}

      {/* Selected dossiers display */}
      {selectedDossiers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 rounded-md border bg-muted/30">
          {selectedDossiers.map((dossier) => {
            const Icon = dossierTypeIcons[dossier.type] || FileText
            return (
              <Badge
                key={dossier.id}
                variant="secondary"
                className="flex items-center gap-1.5 py-1 ps-2 pe-1"
              >
                <Icon className="size-3" />
                <span className="max-w-[150px] truncate">{getDisplayName(dossier)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-5 p-0 ms-1 hover:bg-destructive/20"
                  onClick={() => handleRemove(dossier.id)}
                  disabled={disabled}
                  aria-label={t('actions.remove_dossier', 'Remove Dossier')}
                >
                  <X className="size-3" />
                </Button>
              </Badge>
            )
          })}
          {selectedDossiers.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={handleClear}
              disabled={disabled}
            >
              {t('selector.clear_selection', 'Clear selection')}
            </Button>
          )}
        </div>
      )}

      {/* Selector popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-required={required}
            aria-invalid={!!error}
            className={cn(
              'w-full min-h-11 justify-start gap-2 font-normal',
              error && 'border-destructive',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            disabled={disabled}
          >
            <Search className="size-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {selectedDossiers.length > 0
                ? multiple
                  ? t('selector.select_at_least_one', 'Select at least one dossier')
                  : t('selector.placeholder', 'Search dossiers...')
                : t('selector.placeholder', 'Search dossiers...')}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="size-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                placeholder={t('selector.search_hint', 'Type to search by name')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-0 focus-visible:ring-0"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
            <CommandList>
              <CommandEmpty>
                {isLoading || isSearching ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t('selector.loading', 'Loading dossiers...')}</span>
                  </div>
                ) : (
                  <span>{t('selector.no_results', 'No dossiers found')}</span>
                )}
              </CommandEmpty>

              {results.length > 0 && (
                <CommandGroup>
                  {results.map((dossier) => {
                    const Icon = dossierTypeIcons[dossier.type] || FileText
                    const selected = isSelected(dossier.id)

                    return (
                      <CommandItem
                        key={dossier.id}
                        value={dossier.id}
                        onSelect={() => handleSelect(dossier)}
                        className="min-h-11 cursor-pointer"
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center size-4 border rounded me-2 shrink-0',
                            selected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/30',
                          )}
                        >
                          {selected && <Check className="size-3" />}
                        </div>
                        <Icon className="size-4 text-muted-foreground me-2 shrink-0" />
                        <span className="flex-1 truncate">{getDisplayName(dossier)}</span>
                        <Badge variant="outline" className="text-xs ms-2">
                          {t(`type.${dossier.type}`, dossier.type)}
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

      {/* Hint text */}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  )
}

export default DossierSelector
