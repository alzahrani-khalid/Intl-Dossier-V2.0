import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, ChevronRight, Network, Plus, ShieldCheck, Users } from 'lucide-react'

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
  const organisationsWithDelegations = filteredOrganizations.filter(
    (org) => org.delegationExpires,
  ).length
  const hierarchyCount = new Set(
    filteredOrganizations.filter((org) => Boolean(org.parent)).map((org) => org.parent),
  ).size

  const isRTL = i18n.dir() === 'rtl'

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
              {t('organizations.title', 'Organizations & delegations')}
            </h1>
            <p className="text-base text-muted-foreground">
              {t(
                'organizations.subtitle',
                'Track hierarchies, delegation scopes, and project ownership across every partner organization.',
              )}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {t('organizations.actions.addOrganization', 'Add organization')}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('organizations.metrics.registered', 'Registered entities')}
            </CardTitle>
            <Building2 className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{filteredOrganizations.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                'organizations.metrics.registeredHint',
                'Includes headquarters and sub-directorates',
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('organizations.metrics.members', 'Delegated members')}
            </CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                'organizations.metrics.membersHint',
                'Mapped to Supabase auth roles with MFA enforced',
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('organizations.metrics.delegations', 'Active delegations')}
            </CardTitle>
            <ShieldCheck className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{organisationsWithDelegations}</p>
            <p className="mt-2 text-sm text-muted-foreground">
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
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('organizations.filters.search', 'Search by name or parent')}
            </label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t(
                'organizations.filters.searchPlaceholder',
                'e.g. Ministry, OECD, statistics',
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('organizations.filters.type', 'Type')}
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('organizations.filters.status', 'Status')}
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead>
            <tr className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 text-start">
                {t('organizations.table.organization', 'Organization')}
              </th>
              <th className="px-5 py-3 text-start">{t('organizations.table.type', 'Type')}</th>
              <th className="px-5 py-3 text-start">
                {t('organizations.table.country', 'Country')}
              </th>
              <th className="px-5 py-3 text-start">
                {t('organizations.table.members', 'Members')}
              </th>
              <th className="px-5 py-3 text-start">
                {t('organizations.table.projects', 'Active projects')}
              </th>
              <th className="px-5 py-3 text-start">
                {t('organizations.table.delegation', 'Delegation expires')}
              </th>
              <th className="px-5 py-3 text-start">{t('organizations.table.status', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrganizations.map((org) => (
              <tr key={org.id} className="hover:bg-accent/50">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{org.name}</span>
                    {org.parent && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ChevronRight className="size-3" />
                        {t('organizations.table.parent', 'Parent')}: {org.parent}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {t(`organizations.types.${org.type}`, organizationTypes[org.type])}
                </td>
                <td className="px-5 py-4 text-muted-foreground">{org.country}</td>
                <td className="px-5 py-4 text-foreground">{org.members}</td>
                <td className="px-5 py-4 text-foreground">{org.activeProjects}</td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{org.delegationExpires}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      org.status === 'active'
                        ? 'bg-primary/10 text-primary'
                        : org.status === 'inactive'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    <Network className="size-3" />
                    {t(`organizations.status.${org.status}`, org.status)}
                  </span>
                </td>
              </tr>
            ))}
            {filteredOrganizations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
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
