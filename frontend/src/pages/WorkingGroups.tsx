import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, Target, Plus, Loader2, ShieldAlert, Calendar } from 'lucide-react'
import { useDossiersByType } from '@/hooks/useDossier'

export default function WorkingGroups() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all')

  // Query working groups from unified dossiers table
  const { data, isLoading, isError, error } = useDossiersByType('working_group', 1, 1000)

  const filteredGroups = useMemo(() => {
    if (!data?.data) return []

    return data.data.filter((dossier) => {
      // Search filter
      const matchesSearch = [dossier.name_en, dossier.name_ar]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || dossier.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [data, searchTerm, statusFilter])

  const activeCount = filteredGroups.filter((g) => g.status === 'active').length
  const totalMembers = filteredGroups.reduce((acc, curr) => {
    const members = curr.extension_data?.member_count || 0
    return acc + members
  }, 0)
  const totalMeetings = filteredGroups.reduce((acc, curr) => {
    const meetings = curr.extension_data?.meetings_count || 0
    return acc + meetings
  }, 0)

  const isRTL = i18n.dir() === 'rtl'

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <ShieldAlert className="size-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {t('workingGroups.error.title', 'Failed to load working groups')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message ||
              t('workingGroups.error.message', 'An error occurred while fetching data')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              {t('workingGroups.title', 'Working Groups')}
            </h1>
            <p className="text-base text-muted-foreground">
              {t(
                'workingGroups.subtitle',
                'Manage technical committees, task forces, and collaborative working groups across partnerships.'
              )}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {t('workingGroups.actions.addGroup', 'Add new group')}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('workingGroups.metrics.activeGroups', 'Active groups')}
            </CardTitle>
            <Target className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('workingGroups.metrics.activeGroupsHint', 'Currently active working groups')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('workingGroups.metrics.totalMembers', 'Total members')}
            </CardTitle>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('workingGroups.metrics.totalMembersHint', 'Across all working groups')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('workingGroups.metrics.totalMeetings', 'Total meetings')}
            </CardTitle>
            <Calendar className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalMeetings}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('workingGroups.metrics.totalMeetingsHint', 'Scheduled and completed')}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('workingGroups.filters.title', 'Filters & search')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('workingGroups.filters.search', 'Search by name')}
            </label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t(
                'workingGroups.filters.searchPlaceholder',
                'e.g. Data Standards, Climate Task Force'
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('workingGroups.filters.status', 'Status')}
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-44 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('workingGroups.filters.allStatuses', 'All statuses')}</option>
              <option value="active">{t('workingGroups.status.active', 'Active')}</option>
              <option value="inactive">{t('workingGroups.status.inactive', 'Inactive')}</option>
              <option value="suspended">{t('workingGroups.status.suspended', 'Suspended')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead>
            <tr className="bg-muted/50 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 text-start">{t('workingGroups.table.group', 'Group')}</th>
              <th className="px-5 py-3 text-start">{t('workingGroups.table.chair', 'Chair')}</th>
              <th className="px-5 py-3 text-start">{t('workingGroups.table.members', 'Members')}</th>
              <th className="px-5 py-3 text-start">{t('workingGroups.table.status', 'Status')}</th>
              <th className="px-5 py-3 text-start">
                {t('workingGroups.table.meetings', 'Meetings')}
              </th>
              <th className="px-5 py-3 text-start">
                {t('workingGroups.table.updated', 'Last updated')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredGroups.map((dossier) => {
              const group = dossier.extension_data
              return (
                <tr key={dossier.id} className="hover:bg-accent/50">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{dossier.name_en}</span>
                      <span className="text-xs text-muted-foreground">{dossier.name_ar}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{group?.chair_name || '—'}</td>
                  <td className="px-5 py-4 text-foreground">{group?.member_count || 0}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        dossier.status === 'active'
                          ? 'bg-primary/10 text-primary'
                          : dossier.status === 'inactive'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {t(`workingGroups.status.${dossier.status}`, dossier.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-foreground">{group?.meetings_count || 0}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {new Date(dossier.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
            {filteredGroups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {t('workingGroups.table.empty', 'No working groups match the current filters')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
