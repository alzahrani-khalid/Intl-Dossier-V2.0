/**
 * DossierSearchFilters Component
 * Feature: Dossier-first search experience
 *
 * Filter bar for dossier search with:
 * - All Types dropdown (filter by dossier type)
 * - Status filter (Active/Archived)
 * - My Dossiers toggle (only show user's dossiers)
 *
 * Mobile-first, RTL-compatible design.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  Building2,
  Users,
  Briefcase,
  Target,
  BookOpen,
  User,
  Vote,
  Filter,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DossierType } from '@/lib/dossier-type-guards'
import type { DossierSearchFilters as FilterState } from '@/types/dossier-search.types'

// Dossier type icons
const typeIcons: Record<DossierType | 'all', React.ComponentType<{ className?: string }>> = {
  all: Filter,
  country: Globe,
  organization: Building2,
  forum: Users,
  engagement: Briefcase,
  topic: Target,
  working_group: BookOpen,
  person: User,
  elected_official: Vote,
}

interface DossierSearchFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  typeCounts?: Record<DossierType | 'all', number>
  disabled?: boolean
  className?: string
}

export function DossierSearchFilters({
  filters,
  onChange,
  typeCounts,
  disabled = false,
  className,
}: DossierSearchFiltersProps) {
  const { t, i18n } = useTranslation('dossier-search')
  const isRTL = i18n.language === 'ar'

  // Handle type filter change
  const handleTypeChange = (value: string) => {
    if (value === 'all') {
      onChange({ ...filters, types: 'all' })
    } else {
      onChange({ ...filters, types: [value as DossierType] })
    }
  }

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    onChange({ ...filters, status: value as 'all' | 'active' | 'archived' })
  }

  // Handle my dossiers toggle
  const handleMyDossiersToggle = (checked: boolean) => {
    onChange({ ...filters, myDossiersOnly: checked })
  }

  // Clear all filters
  const handleClearFilters = () => {
    onChange({
      types: 'all',
      status: 'all',
      myDossiersOnly: false,
      query: filters.query,
    })
  }

  // Check if any filters are active
  const hasActiveFilters =
    filters.types !== 'all' || filters.status !== 'all' || filters.myDossiersOnly

  // Get current type value for select
  const currentTypeValue = Array.isArray(filters.types) ? filters.types[0] : 'all'

  const TypeIcon = typeIcons[currentTypeValue]

  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Type Filter Dropdown */}
      <div className="flex items-center gap-2">
        <Select value={currentTypeValue} onValueChange={handleTypeChange} disabled={disabled}>
          <SelectTrigger className="w-full sm:w-48">
            <div className="flex items-center gap-2">
              <TypeIcon className="size-4 text-gray-500" />
              <SelectValue placeholder={t('filters.allTypes')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-gray-500" />
                <span>{t('filters.allTypes')}</span>
                {typeCounts?.all !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.all}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="country">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-blue-500" />
                <span>{t('types.country')}</span>
                {typeCounts?.country !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.country}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="organization">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-purple-500" />
                <span>{t('types.organization')}</span>
                {typeCounts?.organization !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.organization}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="forum">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-cyan-500" />
                <span>{t('types.forum')}</span>
                {typeCounts?.forum !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.forum}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="engagement">
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-green-500" />
                <span>{t('types.engagement')}</span>
                {typeCounts?.engagement !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.engagement}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="topic">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-pink-500" />
                <span>{t('types.topic')}</span>
                {typeCounts?.topic !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.topic}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="working_group">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-amber-500" />
                <span>{t('types.working_group')}</span>
                {typeCounts?.working_group !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.working_group}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="person">
              <div className="flex items-center gap-2">
                <User className="size-4 text-teal-500" />
                <span>{t('types.person')}</span>
                {typeCounts?.person !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.person}
                  </Badge>
                )}
              </div>
            </SelectItem>
            <SelectItem value="elected_official">
              <div className="flex items-center gap-2">
                <Vote className="size-4 text-rose-500" />
                <span>{t('types.elected_official')}</span>
                {typeCounts?.elected_official !== undefined && (
                  <Badge variant="secondary" className="ms-auto text-xs">
                    {typeCounts.elected_official}
                  </Badge>
                )}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Select value={filters.status} onValueChange={handleStatusChange} disabled={disabled}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('status.all')}</SelectItem>
            <SelectItem value="active">{t('status.active')}</SelectItem>
            <SelectItem value="archived">{t('status.archived')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* My Dossiers Toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <Switch
          checked={filters.myDossiersOnly}
          onCheckedChange={handleMyDossiersToggle}
          disabled={disabled}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">{t('filters.myDossiers')}</span>
      </label>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
            'transition-colors',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <X className="size-4" />
          {t('filters.clear')}
        </button>
      )}

      {/* Active filter indicators (mobile) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 sm:hidden">
          {filters.types !== 'all' && Array.isArray(filters.types) && (
            <Badge variant="secondary" className="text-xs">
              {t(`types.${filters.types[0]}`)}
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {t(`status.${filters.status}`)}
            </Badge>
          )}
          {filters.myDossiersOnly && (
            <Badge variant="secondary" className="text-xs">
              {t('filters.myDossiers')}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Export filter chip component for alternative layout
export function DossierTypeChips({
  selectedType,
  onChange,
  counts,
  disabled = false,
}: {
  selectedType: DossierType | 'all'
  onChange: (type: DossierType | 'all') => void
  counts?: Record<DossierType | 'all', number>
  disabled?: boolean
}) {
  const { t, i18n } = useTranslation('dossier-search')
  const isRTL = i18n.language === 'ar'

  const types: (DossierType | 'all')[] = [
    'all',
    'country',
    'organization',
    'forum',
    'engagement',
    'topic',
    'working_group',
    'person',
    'elected_official',
  ]

  return (
    <div className="flex flex-wrap gap-2" dir={isRTL ? 'rtl' : 'ltr'} role="tablist">
      {types.map((type) => {
        const Icon = typeIcons[type]
        const isSelected = selectedType === type
        const count = counts?.[type]

        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            disabled={disabled}
            role="tab"
            aria-selected={isSelected}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <Icon className="size-4" />
            <span>{type === 'all' ? t('filters.allTypes') : t(`types.${type}`)}</span>
            {count !== undefined && count > 0 && (
              <Badge
                variant={isSelected ? 'secondary' : 'outline'}
                className="ms-1 px-1.5 py-0 text-xs"
              >
                {count}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}
