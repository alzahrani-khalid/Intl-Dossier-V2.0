/**
 * Persons List Page (Phase 40 LIST-02)
 *
 * Replaces legacy dossiers/persons table with the unified ListPageShell + PersonsGrid pattern.
 * - 1 / 2 / 3-col responsive grid (mobile-first)
 * - 44px circular initial avatar + name + VIP chip + role · organization
 * - VIP detection: importance_level >= 4 (PersonListItem)
 */

import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  ListPageShell,
  PersonsGrid,
  ToolbarSearch,
  type PersonCard,
} from '@/components/list-page'
import { usePersons } from '@/hooks/usePersons'
import { useDirection } from '@/hooks/useDirection'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/persons/')({
  component: PersonsListPage,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})

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
    raw.is_vip === true ||
    (typeof raw.importance_level === 'number' && raw.importance_level >= 4)
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

function PersonsListPage(): React.ReactNode {
  const { t } = useTranslation(['persons', 'list-pages'])
  const { isRTL } = useDirection()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const query = usePersons({ search: debouncedSearch !== '' ? debouncedSearch : undefined })

  const items: PersonCard[] = useMemo(
    () => extractList(query.data).map((p) => toCard(p, isRTL)),
    [query.data, isRTL],
  )

  const handlePersonClick = (person: PersonCard): void => {
    void navigate({ to: '/dossiers/persons/$id', params: { id: person.id } })
  }

  return (
    <ListPageShell
      title={t('persons:title')}
      subtitle={t('persons:subtitle')}
      toolbar={
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          placeholder={t('list-pages:search.placeholder', { defaultValue: 'Search…' })}
        />
      }
      isLoading={query.isLoading}
      isEmpty={!query.isLoading && items.length === 0}
      emptyState={
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-base font-medium">{t('persons:empty.title')}</p>
          <p className="text-sm text-muted-foreground">{t('persons:empty.description')}</p>
        </div>
      }
    >
      <PersonsGrid persons={items} onPersonClick={handlePersonClick} />
    </ListPageShell>
  )
}

export default PersonsListPage
