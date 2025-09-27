import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Globe2, MapPin, Plus, ShieldAlert } from 'lucide-react'

interface CountryRow {
  id: string
  nameEn: string
  nameAr: string
  iso2: string
  iso3: string
  region: string
  status: 'active' | 'inactive' | 'suspended'
  agreements: number
  recentActivity: string
  riskLevel: 'low' | 'medium' | 'high'
}

const countries: CountryRow[] = [
  {
    id: 'sa',
    nameEn: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    iso2: 'SA',
    iso3: 'SAU',
    region: 'Asia',
    status: 'active',
    agreements: 24,
    recentActivity: 'Digital economy task-force signed 18 Sep 2025',
    riskLevel: 'low',
  },
  {
    id: 'ae',
    nameEn: 'United Arab Emirates',
    nameAr: 'الإمارات العربية المتحدة',
    iso2: 'AE',
    iso3: 'ARE',
    region: 'Asia',
    status: 'active',
    agreements: 19,
    recentActivity: 'Open data exchange pilot renewed 12 Sep 2025',
    riskLevel: 'low',
  },
  {
    id: 'fr',
    nameEn: 'France',
    nameAr: 'فرنسا',
    iso2: 'FR',
    iso3: 'FRA',
    region: 'Europe',
    status: 'active',
    agreements: 11,
    recentActivity: 'Awaiting legal review on urban statistics MoU',
    riskLevel: 'medium',
  },
  {
    id: 'ng',
    nameEn: 'Nigeria',
    nameAr: 'نيجيريا',
    iso2: 'NG',
    iso3: 'NGA',
    region: 'Africa',
    status: 'suspended',
    agreements: 3,
    recentActivity: 'Suspended pending data protection audit',
    riskLevel: 'high',
  },
  {
    id: 'us',
    nameEn: 'United States',
    nameAr: 'الولايات المتحدة الأمريكية',
    iso2: 'US',
    iso3: 'USA',
    region: 'Americas',
    status: 'active',
    agreements: 16,
    recentActivity: 'Joint training programme scheduled Q2 2025',
    riskLevel: 'medium',
  },
]

const regions = ['Asia', 'Europe', 'Africa', 'Americas', 'Oceania']

export default function Countries() {
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | CountryRow['status']>('all')
  const [riskFilter, setRiskFilter] = useState<'all' | CountryRow['riskLevel']>('all')

  const filteredCountries = useMemo(() => {
    return countries.filter((country) => {
      const matchesSearch = [country.nameEn, country.nameAr, country.iso2, country.iso3]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      const matchesRegion = regionFilter === 'all' || country.region === regionFilter
      const matchesStatus = statusFilter === 'all' || country.status === statusFilter
      const matchesRisk = riskFilter === 'all' || country.riskLevel === riskFilter

      return matchesSearch && matchesRegion && matchesStatus && matchesRisk
    })
  }, [searchTerm, regionFilter, statusFilter, riskFilter])

  const totalAgreements = filteredCountries.reduce((acc, curr) => acc + curr.agreements, 0)
  const activeCount = filteredCountries.filter((c) => c.status === 'active').length
  const suspendedCount = filteredCountries.filter((c) => c.status === 'suspended').length

  const isRTL = i18n.dir() === 'rtl'

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-semibold text-base-900 dark:text-base-50">
              {t('countries.title', 'Countries overview')}
            </h1>
            <p className="text-base text-base-600 dark:text-base-300">
              {t(
                'countries.subtitle',
                'Monitor bilateral relationships, workflow status, and compliance posture across every partner state.'
              )}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('countries.actions.addCountry', 'Add new country')}
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-base-700 dark:text-base-200">
              {t('countries.metrics.totalPartners', 'Active partners')}
            </CardTitle>
            <Globe2 className="h-5 w-5 text-primary-600 dark:text-primary-300" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-base-900 dark:text-base-50">{activeCount}</p>
            <p className="mt-2 text-sm text-base-500 dark:text-base-400">
              {t('countries.metrics.totalPartnersHint', 'Includes strategic and operational partnerships')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-base-700 dark:text-base-200">
              {t('countries.metrics.totalAgreements', 'Linked agreements')}
            </CardTitle>
            <FileText className="h-5 w-5 text-primary-600 dark:text-primary-300" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-base-900 dark:text-base-50">{totalAgreements}</p>
            <p className="mt-2 text-sm text-base-500 dark:text-base-400">
              {t('countries.metrics.totalAgreementsHint', 'Contracts and memoranda currently in force')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-base-700 dark:text-base-200">
              {t('countries.metrics.escalations', 'Escalations')}
            </CardTitle>
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{suspendedCount}</p>
            <p className="mt-2 text-sm text-base-500 dark:text-base-400">
              {t('countries.metrics.escalationsHint', 'Partners pending compliance or data-sovereignty review')}
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
            <label className="mb-1 block text-sm font-medium text-base-700 dark:text-base-200">
              {t('countries.filters.search', 'Search by name or ISO code')}
            </label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('countries.filters.searchPlaceholder', 'e.g. AE, France, نيجيريا')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-base-700 dark:text-base-200">
              {t('countries.filters.region', 'Region')}
            </label>
            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="w-48 rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-base-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-base-700 dark:bg-base-900 dark:text-base-100"
              dir={isRTL ? 'rtl' : 'ltr'}
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
            <label className="mb-1 block text-sm font-medium text-base-700 dark:text-base-200">
              {t('countries.filters.status', 'Status')}
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-44 rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-base-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-base-700 dark:bg-base-900 dark:text-base-100"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('countries.filters.allStatuses', 'All statuses')}</option>
              <option value="active">{t('countries.status.active', 'Active')}</option>
              <option value="inactive">{t('countries.status.inactive', 'Inactive')}</option>
              <option value="suspended">{t('countries.status.suspended', 'Suspended')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-base-700 dark:text-base-200">
              {t('countries.filters.risk', 'Risk level')}
            </label>
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)}
              className="w-40 rounded-md border border-base-300 bg-white px-3 py-2 text-sm text-base-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-base-700 dark:bg-base-900 dark:text-base-100"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('countries.filters.allRisks', 'All risks')}</option>
              <option value="low">{t('countries.risk.low', 'Low')}</option>
              <option value="medium">{t('countries.risk.medium', 'Medium')}</option>
              <option value="high">{t('countries.risk.high', 'High')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-base-200 bg-white shadow-sm dark:border-base-700 dark:bg-base-900/70">
        <table className="min-w-full divide-y divide-base-200 text-sm dark:divide-base-700">
          <thead>
            <tr className="bg-base-50 text-start text-xs font-semibold uppercase tracking-wide text-base-500 dark:bg-base-950/40 dark:text-base-400">
              <th className="px-5 py-3 text-start">{t('countries.table.country', 'Country')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.iso', 'ISO codes')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.region', 'Region')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.status', 'Status')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.agreements', 'Agreements')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.activity', 'Recent activity')}</th>
              <th className="px-5 py-3 text-start">{t('countries.table.risk', 'Risk')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-100 dark:divide-base-800">
            {filteredCountries.map((country) => (
              <tr key={country.id} className="hover:bg-base-50/60 dark:hover:bg-base-800/40">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-base-800 dark:text-base-50">{country.nameEn}</span>
                    <span className="text-xs text-base-500 dark:text-base-400">{country.nameAr}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-base-700 dark:text-base-200">
                  {country.iso2} · {country.iso3}
                </td>
                <td className="px-5 py-4 text-base-600 dark:text-base-300">{country.region}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      country.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : country.status === 'inactive'
                        ? 'bg-base-100 text-base-500 dark:bg-base-800/50 dark:text-base-300'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {t(`countries.status.${country.status}`, country.status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-base-700 dark:text-base-200">{country.agreements}</td>
                <td className="px-5 py-4 text-xs text-base-500 dark:text-base-400">
                  {country.recentActivity}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      country.riskLevel === 'low'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : country.riskLevel === 'medium'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    <MapPin className="h-3 w-3" />
                    {t(`countries.risk.${country.riskLevel}`, country.riskLevel)}
                  </span>
                </td>
              </tr>
            ))}
            {filteredCountries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-base-500 dark:text-base-300">
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
