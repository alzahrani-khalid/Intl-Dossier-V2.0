/**
 * Dossiers Hub Page (T038)
 *
 * Displays filterable list of dossiers with infinite scroll
 * Components: FilterPanel, DossierCard list
 * URL state: Syncs filters to query params
 * Accessibility: Skip to content, keyboard navigation
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Check, ChevronsUpDown } from 'lucide-react';
import { useDossiers } from '../../../hooks/useDossiers';
import { DossierCard } from '../../../components/DossierCard';
import { CreateDossierDialog } from '../../../components/CreateDossierDialog';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { cn } from '../../../lib/utils';
import type { DossierFilters } from '../../../types/dossier';

// Search params validation
interface DossiersSearchParams {
  type?: string[];
  status?: string[];
  sensitivity?: string[];
  owner_id?: string;
  tags?: string[];
  search?: string;
  cursor?: string;
  limit?: number;
}

export const Route = createFileRoute('/_protected/dossiers/')({
  component: DossiersHubPage,
  validateSearch: (search: Record<string, unknown>): DossiersSearchParams => {
    return {
      type: Array.isArray(search.type) ? search.type : search.type ? [search.type as string] : undefined,
      status: Array.isArray(search.status) ? search.status : search.status ? [search.status as string] : undefined,
      sensitivity: Array.isArray(search.sensitivity) ? search.sensitivity : search.sensitivity ? [search.sensitivity as string] : undefined,
      owner_id: search.owner_id as string | undefined,
      tags: search.tags as string[] | undefined,
      search: search.search as string | undefined,
      cursor: search.cursor as string | undefined,
      limit: search.limit as number | undefined,
    };
  },
});

function DossiersHubPage() {
  const { t } = useTranslation('dossiers');
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Popover states for multi-select filters
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [sensitivityOpen, setSensitivityOpen] = useState(false);

  // Initialize filters from URL params only once
  const initialFilters: DossierFilters = {
    type: searchParams.type as any,
    status: searchParams.status as any,
    sensitivity: searchParams.sensitivity as any,
    owner_id: searchParams.owner_id,
    tags: searchParams.tags,
    search: searchParams.search,
    limit: searchParams.limit || 50,
  };

  const [filters, setFilters] = useState<DossierFilters>(initialFilters);

  // Fetch dossiers with current filters
  const { data, isLoading, error } = useDossiers(filters);

  // Update URL when filters change (but skip if filters match URL params)
  useEffect(() => {
    const params: Record<string, string | string[] | number> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Skip limit if it's the default value (50)
        if (key === 'limit' && value === 50) {
          return;
        }
        if (Array.isArray(value)) {
          if (value.length > 0) params[key] = value;
        } else {
          params[key] = value;
        }
      }
    });

    // Only navigate if params actually changed to prevent infinite loop
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => newParams.append(key, String(v)));
      } else {
        newParams.set(key, String(value));
      }
    });

    if (currentParams.toString() !== newParams.toString()) {
      navigate({
        search: params as any,
        replace: true,
      });
    }
  }, [filters, navigate]);

  const handleFilterChange = (newFilters: DossierFilters) => {
    setFilters(newFilters);
  };

  // DossierCard handles navigation internally, no need for click handler

  // Filter options
  const typeOptions = [
    { value: 'country', label: t('types.country') },
    { value: 'organization', label: t('types.organization') },
    { value: 'forum', label: t('types.forum') },
    { value: 'theme', label: t('types.theme') },
  ];

  const statusOptions = [
    { value: 'active', label: t('statuses.active') },
    { value: 'inactive', label: t('statuses.inactive') },
    { value: 'archived', label: t('statuses.archived') },
  ];

  const sensitivityOptions = [
    { value: 'low', label: t('sensitivity.low') },
    { value: 'medium', label: t('sensitivity.medium') },
    { value: 'high', label: t('sensitivity.high') },
  ];

  return (
    <div
      className="dossiers-hub min-h-screen"
      style={{
        background: 'transparent'
      }}
    >
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-600"
      >
        {t('common:skip_to_content')}
      </a>

      {/* Page Header with Modern Design */}
      <div className="border-b border-white/20" style={{ background: 'transparent' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10" style={{ background: 'transparent' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                {t('hub.title')}
              </h1>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-700">
                {t('hub.description')}
              </p>
            </div>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center justify-center px-6 py-3 min-h-11 border border-transparent text-sm font-medium rounded-xl shadow-md hover:shadow-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
            >
              {t('hub.create_button')}
            </button>
          </div>
        </div>
      </div>

      {/* Compact Filter Bar */}
      <div className="border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
            {/* Search Input - Wider */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('filters.search')}
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                  className="pe-9 ps-9 h-10 bg-white/80 border-white/20"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange({ ...filters, search: '' })}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter - Multi-select */}
            <div className="space-y-2 min-w-[200px]">
              <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={typeOpen}
                    className="w-full justify-between h-10 bg-white/80 border-white/20"
                  >
                    {(filters.type?.length ?? 0) > 0
                      ? `${filters.type?.length} ${t('filters.type_selected')}`
                      : t('filters.select_type')}
                    <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={t('filters.search_type')} />
                    <CommandList>
                      <CommandEmpty>{t('filters.no_type_found')}</CommandEmpty>
                      <CommandGroup>
                        {typeOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              const currentTypes = filters.type || [];
                              const newTypes = currentTypes.includes(currentValue)
                                ? currentTypes.filter((v) => v !== currentValue)
                                : [...currentTypes, currentValue];
                              handleFilterChange({
                                ...filters,
                                type: newTypes.length > 0 ? newTypes as any : undefined,
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                'me-2 size-4',
                                filters.type?.includes(option.value) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {(filters.type?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.type?.map((value) => (
                    <Badge key={value} variant="secondary">
                      {typeOptions.find((opt) => opt.value === value)?.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter - Multi-select */}
            <div className="space-y-2 min-w-[200px]">
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={statusOpen}
                    className="w-full justify-between h-10 bg-white/80 border-white/20"
                  >
                    {(filters.status?.length ?? 0) > 0
                      ? `${filters.status?.length} ${t('filters.status_selected')}`
                      : t('filters.select_status')}
                    <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={t('filters.search_status')} />
                    <CommandList>
                      <CommandEmpty>{t('filters.no_status_found')}</CommandEmpty>
                      <CommandGroup>
                        {statusOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              const currentStatuses = filters.status || [];
                              const newStatuses = currentStatuses.includes(currentValue)
                                ? currentStatuses.filter((v) => v !== currentValue)
                                : [...currentStatuses, currentValue];
                              handleFilterChange({
                                ...filters,
                                status: newStatuses.length > 0 ? newStatuses as any : undefined,
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                'me-2 size-4',
                                filters.status?.includes(option.value) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {(filters.status?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.status?.map((value) => (
                    <Badge key={value} variant="secondary">
                      {statusOptions.find((opt) => opt.value === value)?.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Sensitivity Filter - Multi-select */}
            <div className="space-y-2 min-w-[200px]">
              <Popover open={sensitivityOpen} onOpenChange={setSensitivityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={sensitivityOpen}
                    className="w-full justify-between h-10 bg-white/80 border-white/20"
                  >
                    {(filters.sensitivity?.length ?? 0) > 0
                      ? `${filters.sensitivity?.length} ${t('filters.sensitivity_selected')}`
                      : t('filters.select_sensitivity')}
                    <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={t('filters.search_sensitivity')} />
                    <CommandList>
                      <CommandEmpty>{t('filters.no_sensitivity_found')}</CommandEmpty>
                      <CommandGroup>
                        {sensitivityOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              const currentSensitivities = filters.sensitivity || [];
                              const newSensitivities = currentSensitivities.includes(currentValue)
                                ? currentSensitivities.filter((v) => v !== currentValue)
                                : [...currentSensitivities, currentValue];
                              handleFilterChange({
                                ...filters,
                                sensitivity: newSensitivities.length > 0 ? newSensitivities as any : undefined,
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                'me-2 size-4',
                                filters.sensitivity?.includes(option.value) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {(filters.sensitivity?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.sensitivity?.map((value) => (
                    <Badge key={value} variant="secondary">
                      {sensitivityOptions.find((opt) => opt.value === value)?.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Button */}
            {(filters.type?.length || filters.status?.length || filters.sensitivity?.length || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ limit: 50 })}
                className="h-10 text-xs bg-white/80 whitespace-nowrap"
              >
                {t('filters.reset')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with Modern Design */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          backgroundColor: 'transparent'
        }}
      >
        <div className="flex flex-col gap-6">
          {/* Dossier List with Improved Spacing */}
          <div className="flex-1 min-w-0">
            {/* Loading State with Modern Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="isolate h-64 sm:h-72 bg-white/10 backdrop-blur-xl border-0 ring-1 ring-black/5 rounded-[20px] animate-pulse"
                    aria-label={t('common:loading')}
                  />
                ))}
              </div>
            )}

            {/* Error State with Modern Alert */}
            {error && (
              <div
                className="isolate bg-red-100/20 backdrop-blur-xl border-0 ring-1 ring-red-500/20 rounded-[20px] p-5 sm:p-6 shadow-lg"
                role="alert"
              >
                <h3 className="text-base font-semibold text-red-800">
                  {t('hub.error_title')}
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  {error instanceof Error ? error.message : t('hub.error_generic')}
                </p>
              </div>
            )}

            {/* Empty State with Modern Design */}
            {!isLoading && !error && data?.data.length === 0 && (
              <div className="isolate text-center py-16 px-4 rounded-[20px] bg-white/10 backdrop-blur-xl border-0 ring-1 ring-black/5 shadow-lg">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {t('hub.empty_title')}
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  {t('hub.empty_description')}
                </p>
              </div>
            )}

            {/* Dossier Cards Grid with Modern Spacing */}
            {!isLoading && !error && data && data.data.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.data.map((dossier) => (
                    <DossierCard key={dossier.id} dossier={dossier} />
                  ))}
                </div>

                {/* Load More Button with Modern Styling */}
                {data.pagination.has_more && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          cursor: data.pagination.next_cursor || undefined,
                        }));
                      }}
                      className="isolate inline-flex items-center px-6 py-3 min-h-12 border-0 ring-1 ring-black/5 text-sm font-medium rounded-xl bg-white/10 backdrop-blur-xl hover:bg-white/20 hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {t('hub.load_more')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Dossier Dialog */}
      <CreateDossierDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}