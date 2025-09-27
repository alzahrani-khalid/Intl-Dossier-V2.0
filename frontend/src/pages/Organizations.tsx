import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Building2,
  ChevronRight,
  Network,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'

interface OrganizationRow {
  id: string
  name: string
  type: 'government' | 'ngo' | 'international' | 'private'
  parent?: string
  country: string
  members: number
  activeProjects: number
  status: 'active' | 'inactive' | 'suspended'
  delegationExpires: string
}

const organizations: OrganizationRow[] = [
  {
    id: 'mofa',
    name: 'Ministry of Foreign Affairs',
    type: 'government',
    country: 'Saudi Arabia',
    members: 360,
    activeProjects: 14,
    status: 'active',
    delegationExpires: '2025-12-31',
  },
  {
    id: 'mofa-ir',
    name: 'International Relations Department',
    type: 'government',
    parent: 'Ministry of Foreign Affairs',
    country: 'Saudi Arabia',
    members: 56,
    activeProjects: 7,
    status: 'active',
    delegationExpires: '2025-08-30',
  },
  {
    id: 'oecd',
    name: 'Organisation for Economic Co-operation and Development',
    type: 'international',
    country: 'Multilateral',
    members: 1800,
    activeProjects: 5,
    status: 'active',
    delegationExpires: '2026-01-15',
  },
  {
    id: 'escwa',
    name: 'United Nations ESCWA',
    type: 'international',
    country: 'Multilateral',
    members: 420,
    activeProjects: 3,
    status: 'active',
    delegationExpires: '2025-05-20',
  },
  {
    id: 'thinktank',
    name: 'Gulf Policy Think Tank',
    type: 'ngo',
    country: 'United Arab Emirates',
    members: 42,
    activeProjects: 2,
    status: 'inactive',
    delegationExpires: '2024-11-01',
  },
]

const organizationTypes: Record<OrganizationRow['type'], string> = {
  government: 'Government',
  ngo: 'NGO',
  international: 'International',
  private: 'Private',
}

export default function Organizations() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | OrganizationRow['type']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | OrganizationRow['status']>('all')

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const matchesSearch = [org.name, org.parent, org.country]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === 'all' || org.type === typeFilter
      const matchesStatus = statusFilter === 'all' || org.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [searchTerm, typeFilter, statusFilter])

  const totalMembers = filteredOrganizations.reduce((acc, org) => acc + org.members, 0)
  const organisationsWithDelegations = filteredOrganizations.filter((org) => org.delegationExpires).length
  const hierarchyCount = new Set(
    filteredOrganizations.filter((org) => Boolean(org.parent)).map((org) => org.parent)
  ).size

  const isRTL = i18n.dir() === 'rtl'

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-semibold text-base-900 dark:text-base-50">
              {t('organizations.title', 'Organizations & delegations')}
            </h1>
            <p className="text-base text-base-600 dark:text-base-300">
              {t(
                'organizations.subtitle',
                'Track hierarchies, delegation scopes, and project ownership across every partner organization.'
              )}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('organizations.actions.addOrganization', 'Add organization')}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-base-700 dark:text-base-200">
              {t('organizations.metrics.registered', 'Registered entities')}
            </CardTitle>
            <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-300" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-base-900 dark:text-base-50">{filteredOrganizations.length}</p>
            <p className="mt-2 text-sm text-base-500 dark:text-base-400">
              {t('organizations.metrics.registeredHint', 'Includes headquarters and sub-directorates')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-base-700 dark:text-base-200">
              {t('organizations.metrics.members', 'Delegated members')}
            </CardTitle>
            <Users className="h-5 w-5 text-primary-600 dark:text-primary-300" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-base-900 dark:text-base-50">{totalMembers}</p>
            <p className="mt-2 text-sm text-base-500 dark:text-base-400">
              {t('organizations.metrics.membersHint', 'Mapped to Supabase auth roles with MFA enforced')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-base-700 dark:text-base-200">
              {t('organizations.metrics.delegations', 'Active delegations')}
            </CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-300" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-base-900 dark:text-base-50">{organisationsWithDelegations}</p>
            <p className="mt-2 text-sm text-base-500 dark:text-base-400">
              {t('organizations.metrics.delegationsHint', 'Expiring within 90 days: ')}
              <span className="font-semibold">{hierarchyCount}</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('organizations.filters.title', 'Filter organizations')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-base-700 dark:text-base-200">
              {t('organizations.filters.search', 'Search by name or parent')}
            </label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('organizations.filters.searchPlaceholder', 'e.g. Ministry, OECD, statistics')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-base-700 dark:text-base-200">
              {t('organizations.filters.type', 'Type')}
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              className="w-48 rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-base-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-base-700 dark:bg-base-900 dark:text-base-100"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('organizations.filters.allTypes', 'All types')}</option>
              {Object.entries(organizationTypes).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(`organizations.types.${value}`, label)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-base-700 dark:text-base-200">
              {t('organizations.filters.status', 'Status')}
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-40 rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-base-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-base-700 dark:bg-base-900 dark:text-base-100"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('organizations.filters.allStatuses', 'All statuses')}</option>
              <option value="active">{t('organizations.status.active', 'Active')}</option>
              <option value="inactive">{t('organizations.status.inactive', 'Inactive')}</option>
              <option value="suspended">{t('organizations.status.suspended', 'Suspended')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-base-200 bg-white shadow-sm dark:border-base-700 dark:bg-base-900/70">
        <table className="min-w-full divide-y divide-base-200 text-sm dark:divide-base-700">
          <thead>
            <tr className="bg-base-50 text-xs font-semibold uppercase tracking-wide text-base-500 dark:bg-base-950/40 dark:text-base-400">
              <th className="px-5 py-3 text-start">{t('organizations.table.organization', 'Organization')}</th>
              <th className="px-5 py-3 text-start">{t('organizations.table.type', 'Type')}</th>
              <th className="px-5 py-3 text-start">{t('organizations.table.country', 'Country')}</th>
              <th className="px-5 py-3 text-start">{t('organizations.table.members', 'Members')}</th>
              <th className="px-5 py-3 text-start">{t('organizations.table.projects', 'Active projects')}</th>
              <th className="px-5 py-3 text-start">{t('organizations.table.delegation', 'Delegation expires')}</th>
              <th className="px-5 py-3 text-start">{t('organizations.table.status', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-100 dark:divide-base-800">
            {filteredOrganizations.map((org) => (
              <tr key={org.id} className="hover:bg-base-50/60 dark:hover:bg-base-800/40">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-base-800 dark:text-base-50">{org.name}</span>
                    {org.parent && (
                      <span className="flex items-center gap-1 text-xs text-base-500 dark:text-base-400">
                        <ChevronRight className="h-3 w-3" />
                        {t('organizations.table.parent', 'Parent')}: {org.parent}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-base-600 dark:text-base-300">
                  {t(`organizations.types.${org.type}`, organizationTypes[org.type])}
                </td>
                <td className="px-5 py-4 text-base-600 dark:text-base-300">{org.country}</td>
                <td className="px-5 py-4 text-base-700 dark:text-base-200">{org.members}</td>
                <td className="px-5 py-4 text-base-700 dark:text-base-200">{org.activeProjects}</td>
                <td className="px-5 py-4 text-xs text-base-500 dark:text-base-400">{org.delegationExpires}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      org.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : org.status === 'inactive'
                        ? 'bg-base-100 text-base-500 dark:bg-base-800/50 dark:text-base-300'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    <Network className="h-3 w-3" />
                    {t(`organizations.status.${org.status}`, org.status)}
                  </span>
                </td>
              </tr>
            ))}
            {filteredOrganizations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-base-500 dark:text-base-300">
                  {t('organizations.table.empty', 'No organizations match the selected filters')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
