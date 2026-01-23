import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileText, Globe2, MapPin, Plus, ShieldAlert, Loader2 } from 'lucide-react'
import { useDossiersByType } from '@/hooks/useDossier'

const regions = ['Asia', 'Europe', 'Africa', 'Americas', 'Oceania']

export default function Countries() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>(
    'all',
  )

  // Query countries from unified dossiers table
  const { data, isLoading, isError, error } = useDossiersByType('country', 1, 1000)

  const filteredCountries = useMemo(() => {
    if (!data?.data) return []

    return data.data.filter((dossier) => {
      const country = dossier.extension_data

      // Search filter
      const matchesSearch = [dossier.name_en, dossier.name_ar, country?.iso2, country?.iso3]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      // Region filter
      const matchesRegion = regionFilter === 'all' || country?.region === regionFilter

      // Status filter
      const matchesStatus = statusFilter === 'all' || dossier.status === statusFilter

      return matchesSearch && matchesRegion && matchesStatus
    })
  }, [data, searchTerm, regionFilter, statusFilter])

  const totalAgreements = filteredCountries.reduce((acc, curr) => {
    const agreements = curr.extension_data?.agreements_count || 0
    return acc + agreements
  }, 0)
  const activeCount = filteredCountries.filter((c) => c.status === 'active').length
  const suspendedCount = filteredCountries.filter((c) => c.status === 'suspended').length

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
            {t('countries.error.title', 'Failed to load countries')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message ||
              t('countries.error.message', 'An error occurred while fetching data')}
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
              {t('countries.title', 'Countries overview')}
            </h1>
            <p className="text-base text-muted-foreground">
              {t(
                'countries.subtitle',
                'Monitor bilateral relationships, workflow status, and compliance posture across every partner state.',
              )}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            {t('countries.actions.addCountry', 'Add new country')}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('countries.metrics.totalPartners', 'Active partners')}
            </CardTitle>
            <Globe2 className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                'countries.metrics.totalPartnersHint',
                'Includes strategic and operational partnerships',
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('countries.metrics.totalAgreements', 'Linked agreements')}
            </CardTitle>
            <FileText className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalAgreements}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                'countries.metrics.totalAgreementsHint',
                'Contracts and memoranda currently in force',
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-card-foreground">
              {t('countries.metrics.escalations', 'Escalations')}
            </CardTitle>
            <ShieldAlert className="size-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{suspendedCount}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                'countries.metrics.escalationsHint',
                'Partners pending compliance or data-sovereignty review',
              )}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('countries.filters.title', 'Filters & search')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t('countries.filters.search', 'Search by name or ISO code')}
            </label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('countries.filters.searchPlaceholder', 'e.g. AE, France, نيجيريا')}
            />
          </div>
          <div>
            <label
              htmlFor="region-filter"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t('countries.filters.region', 'Region')}
            </label>
            <select
              id="region-filter"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? 'rtl' : 'ltr'}
              aria-label={t('countries.filters.region', 'Region')}
            >
              <option value="all">{t('countries.filters.allRegions', 'All regions')}</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="status-filter"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t('countries.filters.status', 'Status')}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-44 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? 'rtl' : 'ltr'}
              aria-label={t('countries.filters.status', 'Status')}
            >
              <option value="all">{t('countries.filters.allStatuses', 'All statuses')}</option>
              <option value="active">{t('countries.status.active', 'Active')}</option>
              <option value="inactive">{t('countries.status.inactive', 'Inactive')}</option>
              <option value="suspended">{t('countries.status.suspended', 'Suspended')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead>
            <tr className="bg-muted/50 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 text-start">{t('countries.table.country', 'Country')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.iso', 'ISO codes')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.region', 'Region')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.status', 'Status')}</th>
              <th className="px-5 py-3 text-start">
                {t('countries.table.agreements', 'Agreements')}
              </th>
              <th className="px-5 py-3 text-start">
                {t('countries.table.updated', 'Last updated')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCountries.map((dossier) => {
              const country = dossier.extension_data
              return (
                <tr key={dossier.id} className="hover:bg-accent/50">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{dossier.name_en}</span>
                      <span className="text-xs text-muted-foreground">{dossier.name_ar}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-foreground">
                    {country?.iso2 || '—'} · {country?.iso3 || '—'}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{country?.region || '—'}</td>
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
                      {t(`countries.status.${dossier.status}`, dossier.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-foreground">{country?.agreements_count || 0}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {new Date(dossier.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
            {filteredCountries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  {t('countries.table.empty', 'No countries match the current filters')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
