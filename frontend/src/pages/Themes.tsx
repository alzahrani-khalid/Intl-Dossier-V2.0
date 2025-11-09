import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FileText, Target, Plus, Loader2, ShieldAlert } from 'lucide-react'
import { useDossiersByType } from '@/hooks/useDossier'

export default function Themes() {
 const { t, i18n } = useTranslation()
 const [searchTerm, setSearchTerm] = useState('')
 const [scopeFilter, setScopeFilter] = useState<string>('all')
 const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')

 // Query themes from unified dossiers table
 const { data, isLoading, isError, error } = useDossiersByType('theme', 1, 1000)

 const filteredThemes = useMemo(() => {
 if (!data?.data) return []

 return data.data.filter((dossier) => {
 const theme = dossier.extension_data

 // Search filter
 const matchesSearch = [dossier.name_en, dossier.name_ar]
 .filter(Boolean)
 .join(' ')
 .toLowerCase()
 .includes(searchTerm.toLowerCase())

 // Scope filter
 const matchesScope = scopeFilter === 'all' || theme?.scope === scopeFilter

 // Status filter
 const matchesStatus = statusFilter === 'all' || dossier.status === statusFilter

 return matchesSearch && matchesScope && matchesStatus
 })
 }, [data, searchTerm, scopeFilter, statusFilter])

 const activeCount = filteredThemes.filter((t) => t.status === 'active').length
 const totalEngagements = filteredThemes.reduce((acc, curr) => {
 const engagements = curr.extension_data?.related_engagements_count || 0
 return acc + engagements
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
 {t('themes.error.title', 'Failed to load themes')}
 </h2>
 <p className="text-sm text-muted-foreground">
 {error?.message || t('themes.error.message', 'An error occurred while fetching data')}
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
 {t('themes.title', 'Strategic Themes')}
 </h1>
 <p className="text-base text-muted-foreground">
 {t(
 'themes.subtitle',
 'Track cross-cutting strategic themes across engagements, working groups, and partnerships.'
 )}
 </p>
 </div>
 <Button size="sm" className="gap-2">
 <Plus className="size-4" />
 {t('themes.actions.addTheme', 'Add new theme')}
 </Button>
 </div>
 </header>

 <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-sm font-semibold text-card-foreground">
 {t('themes.metrics.activeThemes', 'Active themes')}
 </CardTitle>
 <Target className="size-5 text-primary" />
 </CardHeader>
 <CardContent>
 <p className="text-2xl font-bold text-foreground">{activeCount}</p>
 <p className="mt-2 text-sm text-muted-foreground">
 {t('themes.metrics.activeThemesHint', 'Currently tracked strategic priorities')}
 </p>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="text-sm font-semibold text-card-foreground">
 {t('themes.metrics.linkedEngagements', 'Linked engagements')}
 </CardTitle>
 <FileText className="size-5 text-primary" />
 </CardHeader>
 <CardContent>
 <p className="text-2xl font-bold text-foreground">{totalEngagements}</p>
 <p className="mt-2 text-sm text-muted-foreground">
 {t('themes.metrics.linkedEngagementsHint', 'Engagements aligned with themes')}
 </p>
 </CardContent>
 </Card>
 </section>

 <Card>
 <CardHeader>
 <CardTitle>{t('themes.filters.title', 'Filters & search')}</CardTitle>
 </CardHeader>
 <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end">
 <div className="flex-1">
 <label className="mb-1 block text-sm font-medium text-foreground">
 {t('themes.filters.search', 'Search by name')}
 </label>
 <Input
 value={searchTerm}
 onChange={(event) => setSearchTerm(event.target.value)}
 placeholder={t('themes.filters.searchPlaceholder', 'e.g. Digital Transformation, AI')}
 />
 </div>
 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">
 {t('themes.filters.scope', 'Scope')}
 </label>
 <select
 value={scopeFilter}
 onChange={(event) => setScopeFilter(event.target.value)}
 className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <option value="all">{t('themes.filters.allScopes', 'All scopes')}</option>
 <option value="global">{t('themes.scope.global', 'Global')}</option>
 <option value="regional">{t('themes.scope.regional', 'Regional')}</option>
 <option value="bilateral">{t('themes.scope.bilateral', 'Bilateral')}</option>
 <option value="internal">{t('themes.scope.internal', 'Internal')}</option>
 </select>
 </div>
 <div>
 <label className="mb-1 block text-sm font-medium text-foreground">
 {t('themes.filters.status', 'Status')}
 </label>
 <select
 value={statusFilter}
 onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
 className="w-44 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <option value="all">{t('themes.filters.allStatuses', 'All statuses')}</option>
 <option value="active">{t('themes.status.active', 'Active')}</option>
 <option value="inactive">{t('themes.status.inactive', 'Inactive')}</option>
 <option value="archived">{t('themes.status.archived', 'Archived')}</option>
 </select>
 </div>
 </CardContent>
 </Card>

 <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
 <table className="min-w-full divide-y divide-border text-sm">
 <thead>
 <tr className="bg-muted/50 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 <th className="px-5 py-3 text-start">{t('themes.table.theme', 'Theme')}</th>
 <th className="px-5 py-3 text-start">{t('themes.table.scope', 'Scope')}</th>
 <th className="px-5 py-3 text-start">{t('themes.table.priority', 'Priority')}</th>
 <th className="px-5 py-3 text-start">{t('themes.table.status', 'Status')}</th>
 <th className="px-5 py-3 text-start">{t('themes.table.engagements', 'Engagements')}</th>
 <th className="px-5 py-3 text-start">{t('themes.table.updated', 'Last updated')}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredThemes.map((dossier) => {
 const theme = dossier.extension_data
 return (
 <tr key={dossier.id} className="hover:bg-accent/50">
 <td className="px-5 py-4">
 <div className="flex flex-col">
 <span className="font-semibold text-foreground">{dossier.name_en}</span>
 <span className="text-xs text-muted-foreground">{dossier.name_ar}</span>
 </div>
 </td>
 <td className="px-5 py-4 text-muted-foreground">
 {theme?.scope ? t(`themes.scope.${theme.scope}`, theme.scope) : '—'}
 </td>
 <td className="px-5 py-4">
 <span
 className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
 theme?.priority === 'high'
 ? 'bg-destructive/10 text-destructive'
 : theme?.priority === 'medium'
 ? 'bg-warning/10 text-warning'
 : 'bg-muted text-muted-foreground'
 }`}
 >
 {theme?.priority
 ? t(`themes.priority.${theme.priority}`, theme.priority)
 : t('themes.priority.notSet', 'Not set')}
 </span>
 </td>
 <td className="px-5 py-4">
 <span
 className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
 dossier.status === 'active'
 ? 'bg-primary/10 text-primary'
 : dossier.status === 'inactive'
 ? 'bg-muted text-muted-foreground'
 : 'bg-secondary/10 text-secondary-foreground'
 }`}
 >
 {t(`themes.status.${dossier.status}`, dossier.status)}
 </span>
 </td>
 <td className="px-5 py-4 text-foreground">
 {theme?.related_engagements_count || 0}
 </td>
 <td className="px-5 py-4 text-xs text-muted-foreground">
 {new Date(dossier.updated_at).toLocaleDateString()}
 </td>
 </tr>
 )
 })}
 {filteredThemes.length === 0 && (
 <tr>
 <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
 {t('themes.table.empty', 'No themes match the current filters')}
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )
}
