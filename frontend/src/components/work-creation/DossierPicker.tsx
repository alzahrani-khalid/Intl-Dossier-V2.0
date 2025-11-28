/**
 * DossierPicker Component
 * Feature: 033-unified-work-creation-hub
 *
 * Searchable combobox for selecting dossiers with:
 * - Recent dossiers from localStorage
 * - Autocomplete search via API
 * - RTL and mobile-first support
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Search, X, Globe, Building2, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { autocompleteDossiers, type AutocompleteResult } from '@/services/search-api';
import type { DossierType } from '@/services/dossier-api';

const STORAGE_KEY = 'recent_dossiers_for_work_creation';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;
const MIN_SEARCH_CHARS = 2;

export interface DossierOption {
  id: string;
  name_en: string;
  name_ar: string;
  type: DossierType;
  status: string;
}

export interface DossierPickerProps {
  value?: string;
  onChange: (dossierId: string | null, dossier?: DossierOption) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Pre-selected dossier info (for display when value is set externally) */
  selectedDossier?: DossierOption;
}

/**
 * Get icon for dossier type
 */
function getDossierTypeIcon(type: DossierType) {
  switch (type) {
    case 'country':
      return Globe;
    case 'organization':
      return Building2;
    case 'forum':
      return Users;
    default:
      return FileText;
  }
}

/**
 * Get recent dossiers from localStorage
 */
function getRecentDossiers(): DossierOption[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse recent dossiers from localStorage:', e);
  }
  return [];
}

/**
 * Add dossier to recent list
 */
function addRecentDossier(dossier: DossierOption): void {
  try {
    const recent = getRecentDossiers();
    const updated = [dossier, ...recent.filter((d) => d.id !== dossier.id)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save recent dossier to localStorage:', e);
  }
}

export function DossierPicker({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
  selectedDossier: externalSelectedDossier,
}: DossierPickerProps) {
  const { t, i18n } = useTranslation('work-creation');
  const isRTL = i18n.language === 'ar';

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DossierOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentDossiers, setRecentDossiers] = useState<DossierOption[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<DossierOption | undefined>(
    externalSelectedDossier
  );

  // Load recent dossiers on mount
  useEffect(() => {
    setRecentDossiers(getRecentDossiers());
  }, []);

  // Update selected dossier when external prop changes
  useEffect(() => {
    if (externalSelectedDossier) {
      setSelectedDossier(externalSelectedDossier);
    }
  }, [externalSelectedDossier]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < MIN_SEARCH_CHARS) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await autocompleteDossiers({
          query: searchQuery,
          limit: 10,
        });
        const results: DossierOption[] = response.suggestions.map((s: AutocompleteResult) => ({
          id: s.id,
          name_en: s.name_en,
          name_ar: s.name_ar,
          type: s.type,
          status: s.status,
        }));
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search dossiers:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (dossier: DossierOption) => {
      setSelectedDossier(dossier);
      addRecentDossier(dossier);
      setRecentDossiers(getRecentDossiers());
      onChange(dossier.id, dossier);
      setOpen(false);
      setSearchQuery('');
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setSelectedDossier(undefined);
    onChange(null);
  }, [onChange]);

  const displayName = selectedDossier
    ? isRTL
      ? selectedDossier.name_ar || selectedDossier.name_en
      : selectedDossier.name_en
    : null;

  const Icon = selectedDossier ? getDossierTypeIcon(selectedDossier.type) : null;

  return (
    <div className={cn('w-full', className)}>
      {/* Selected dossier display */}
      {selectedDossier && (
        <div
          className="flex items-center gap-2 p-3 mb-2 rounded-lg border bg-muted/50"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
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

      {/* Dossier picker popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full min-h-11 justify-between font-normal',
              !selectedDossier && 'text-muted-foreground'
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
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('form.searchDossiers', 'Search dossiers...')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isSearching
                  ? t('form.searching', 'Searching...')
                  : searchQuery.length < MIN_SEARCH_CHARS
                    ? t('form.typeToSearch', 'Type at least 2 characters to search')
                    : t('form.noDossiersFound', 'No dossiers found')}
              </CommandEmpty>

              {/* Search results */}
              {searchResults.length > 0 && (
                <CommandGroup heading={t('form.searchResults', 'Search Results')}>
                  {searchResults.map((dossier) => {
                    const DossierIcon = getDossierTypeIcon(dossier.type);
                    const name = isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en;
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
                            value === dossier.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <DossierIcon
                          className={cn('size-4 shrink-0 text-muted-foreground', isRTL ? 'ms-2' : 'me-2')}
                        />
                        <span className="flex-1 truncate">{name}</span>
                        <Badge variant="outline" className="text-xs ms-2">
                          {dossier.type}
                        </Badge>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* Recent dossiers (shown when no search query) */}
              {searchQuery.length < MIN_SEARCH_CHARS && recentDossiers.length > 0 && (
                <CommandGroup heading={t('form.recentDossiers', 'Recent Dossiers')}>
                  {recentDossiers.map((dossier) => {
                    const DossierIcon = getDossierTypeIcon(dossier.type);
                    const name = isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en;
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
                            value === dossier.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <DossierIcon
                          className={cn('size-4 shrink-0 text-muted-foreground', isRTL ? 'ms-2' : 'me-2')}
                        />
                        <span className="flex-1 truncate">{name}</span>
                        <Badge variant="outline" className="text-xs ms-2">
                          {dossier.type}
                        </Badge>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DossierPicker;
