/**
 * Persons List Page (Phase 40 LIST-02)
 *
 * Replaces legacy dossiers/persons table with the unified ListPageShell + PersonsGrid pattern.
 * - 1 / 2 / 3-col responsive grid (mobile-first)
 * - 44px circular initial avatar + name + VIP chip + role / organization
 * - VIP detection: importance_level >= 4 (PersonListItem)
 */

import { useMemo, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListPageShell, PersonsGrid, ToolbarSearch, type PersonCard } from '@/components/list-page'
import { DisplayPopover } from '@/components/list-controls/DisplayPopover'
import { FilterChipsRow } from '@/components/list-controls/FilterChipsRow'
import { FilterPopover } from '@/components/list-controls/FilterPopover'
import type {
  ListControlsConfig,
  UseListControlsReturn,
} from '@/components/list-controls/useListControls'
import { ListEmptyState } from '@/components/empty-states/ListEmptyState'
import { usePersons } from '@/hooks/usePersons'
import { useDirection } from '@/hooks/useDirection'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { PeekRegistration } from '@/store/peekStore'
import type { ImportanceLevel } from '@/types/person.types'

export const PERSONS_PAGE_SIZE = 20

export const personsListConfig: ListControlsConfig = {
  filters: [
    {
      key: 'importance',
      labelKey: 'list-controls:field.importance',
      options: [
        { value: '1', labelKey: 'list-controls:importance.1' },
        { value: '2', labelKey: 'list-controls:importance.2' },
        { value: '3', labelKey: 'list-controls:importance.3' },
        { value: '4', labelKey: 'list-controls:importance.4' },
        { value: '5', labelKey: 'list-controls:importance.5' },
      ],
    },
  ],
  properties: [
    { id: 'role', labelKey: 'list-controls:property.role', defaultVisible: true },
    { id: 'organization', labelKey: 'list-controls:property.organization', defaultVisible: true },
    { id: 'vip', labelKey: 'list-controls:property.vip', defaultVisible: true },
  ],
}

interface PersonRecord {
  id?: unknown
  name_en?: unknown
  name_ar?: unknown
  title_en?: unknown
  title_ar?: unknown
  role?: unknown
  organization_name?: unknown
  organization?: unknown
  importance_level?: unknown
  is_vip?: unknown
}

const toCard = (raw: PersonRecord, isRTL: boolean): PersonCard => {
  const id = typeof raw.id === 'string' ? raw.id : String(raw.id ?? '')
  const name_en = typeof raw.name_en === 'string' ? raw.name_en : ''
  const name_ar = typeof raw.name_ar === 'string' ? raw.name_ar : name_en
  const role =
    typeof raw.role === 'string' && raw.role !== ''
      ? raw.role
      : isRTL && typeof raw.title_ar === 'string' && raw.title_ar !== ''
        ? raw.title_ar
        : typeof raw.title_en === 'string' && raw.title_en !== ''
          ? raw.title_en
          : undefined
  const organization =
    typeof raw.organization_name === 'string' && raw.organization_name !== ''
      ? raw.organization_name
      : typeof raw.organization === 'string' && raw.organization !== ''
        ? raw.organization
        : undefined
  const is_vip =
    raw.is_vip === true || (typeof raw.importance_level === 'number' && raw.importance_level >= 4)
  return { id, name_en, name_ar, role, organization, is_vip }
}

const extractList = (raw: unknown): PersonRecord[] => {
  if (Array.isArray(raw)) return raw as PersonRecord[]
  if (raw !== null && typeof raw === 'object') {
    const obj = raw as { items?: unknown; data?: unknown }
    if (Array.isArray(obj.items)) return obj.items as PersonRecord[]
    if (Array.isArray(obj.data)) return obj.data as PersonRecord[]
  }
  return []
}

export interface PersonsListPageProps {
  /** Search term from the route's validated URL params. */
  search?: string
  page?: number
  controls?: UseListControlsReturn
  /** Writes the search term back to the URL (debounced by ToolbarSearch). */
  onSearchChange: (next: string) => void
  onClearFilters?: () => void
  onCreate?: () => void
  /** Navigates to a person dossier (owned by the route wrapper). */
  onPersonClick?: (person: PersonCard) => void
  onPersonOpen?: (person: PersonCard, registration: PeekRegistration) => void
}

function PersonsListPage({
  search,
  page = 1,
  controls,
  onSearchChange,
  onClearFilters,
  onCreate,
  onPersonClick,
  onPersonOpen,
}: PersonsListPageProps): ReactElement {
  const { t } = useTranslation(['persons', 'list-pages'])
  const { isRTL } = useDirection()
  const debouncedSearch = useDebouncedValue(search ?? '', 250)
  const importance =
    controls?.filters.importance !== undefined
      ? (Number(controls.filters.importance) as ImportanceLevel)
      : undefined
  const query = usePersons({
    search: debouncedSearch !== '' ? debouncedSearch : undefined,
    importance_level: importance,
    limit: PERSONS_PAGE_SIZE,
    offset: (page - 1) * PERSONS_PAGE_SIZE,
  })

  const items: PersonCard[] = useMemo(
    () => extractList(query.data).map((p) => toCard(p, isRTL)),
    [query.data, isRTL],
  )
  const visibleProperties = controls?.visibleProperties
  const visible = useMemo(
    () => new Set(visibleProperties ?? ['role', 'organization', 'vip']),
    [visibleProperties],
  )
  const visibleItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        role: visible.has('role') ? item.role : undefined,
        organization: visible.has('organization') ? item.organization : undefined,
        is_vip: visible.has('vip') ? item.is_vip : false,
      })),
    [items, visible],
  )

  const total =
    query.data !== undefined && !Array.isArray(query.data) && 'pagination' in query.data
      ? query.data.pagination.total
      : items.length
  const filtered = Boolean((search ?? '') !== '' || controls?.hasActiveFilters)
  const clearFilters = onClearFilters ?? controls?.clearAll

  const handlePersonClick = (person: PersonCard): void => {
    const registration: PeekRegistration = {
      ids: items.map((item) => item.id),
      type: 'person',
      total,
      pageOffset: (page - 1) * PERSONS_PAGE_SIZE,
      pageSize: PERSONS_PAGE_SIZE,
    }
    if (onPersonOpen !== undefined) {
      onPersonOpen(person, registration)
      return
    }
    onPersonClick?.(person)
  }

  const toolbar = (
    <>
      <ToolbarSearch
        value={search ?? ''}
        onChange={onSearchChange}
        placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search...' })}
      />
      {controls !== undefined ? (
        <>
          <FilterPopover
            config={personsListConfig}
            surfaceKey="persons"
            activeFilters={controls.filters}
            activeFilterCount={controls.activeFilterCount}
            onFilterChange={controls.setFilter}
          />
          <DisplayPopover
            config={personsListConfig}
            sort={controls.sort}
            dir={controls.dir}
            visibleProperties={controls.visibleProperties}
            onSetSort={controls.setSort}
            onSetDir={controls.setDir}
            onToggleProperty={controls.toggleProperty}
            onSetGroup={controls.setGroup}
            onReset={controls.resetDisplay}
          />
        </>
      ) : null}
    </>
  )

  return (
    <ListPageShell
      title={t('persons:title')}
      subtitle={t('persons:subtitle')}
      toolbar={toolbar}
      actions={
        <Button asChild className="min-h-11 min-w-11 w-full sm:w-auto">
          <Link to="/dossiers/persons/create">
            <Plus className="h-4 w-4 me-2" />
            {t('empty-states:list.person.cta')}
          </Link>
        </Button>
      }
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && items.length === 0}
      emptyState={
        <ListEmptyState
          entityType="person"
          onCreate={onCreate}
          filtered={filtered}
          onClearFilters={clearFilters}
          title={t('persons:empty.title')}
          description={t('persons:empty.description')}
        />
      }
    >
      {controls !== undefined ? (
        <FilterChipsRow
          chips={controls.filterChips}
          onRemove={controls.removeFilter}
          onClearAll={controls.clearAll}
        />
      ) : null}
      <PersonsGrid persons={visibleItems} onPersonClick={handlePersonClick} />
    </ListPageShell>
  )
}

export default PersonsListPage
