import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, FileText, Calendar, AlertCircle, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/Table/DataTable'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface MoU {
 id: string
 reference_number: string
 title_en: string
 title_ar: string
 workflow_state: string
 signing_date: string | null
 effective_date: string | null
 expiry_date: string | null
 primary_party: {
 name_en: string
 name_ar: string
 }
 secondary_party: {
 name_en: string
 name_ar: string
 }
}

const WORKFLOW_STATES = {
 draft: { color: 'gray', next: 'internal_review' },
 internal_review: { color: 'yellow', next: 'external_review' },
 external_review: { color: 'orange', next: 'negotiation' },
 negotiation: { color: 'blue', next: 'signed' },
 signed: { color: 'green', next: 'active' },
 active: { color: 'green', next: 'expired' },
 renewed: { color: 'blue', next: null },
 expired: { color: 'red', next: 'renewed' }
}

export function MousPage() {
 const { t, i18n } = useTranslation()
 const [searchTerm, setSearchTerm] = useState('')
 const [filterState, setFilterState] = useState<string>('all')
 const isRTL = i18n.language === 'ar'

 const { data: mous, isLoading, refetch } = useQuery({
 queryKey: ['mous', searchTerm, filterState],
 queryFn: async () => {
 let query = supabase
 .from('mous_frontend')
 .select('*')
 .order('created_at', { ascending: false })

 if (searchTerm) {
 query = query.or(
 `reference_number.ilike.%${searchTerm}%,title_en.ilike.%${searchTerm}%,title_ar.ilike.%${searchTerm}%`
 )
 }

 if (filterState !== 'all') {
 query = query.eq('workflow_state', filterState)
 }

 const { data, error } = await query

 if (error) throw error
 return data as MoU[]
 }
 })

 const transitionMutation = useMutation({
 mutationFn: async ({ id, newState }: { id: string; newState: string }) => {
 const { error } = await supabase
 .from('mous')
 .update({ lifecycle_state: newState })
 .eq('id', id)

 if (error) throw error
 },
 onSuccess: () => {
 refetch()
 }
 })

 const WorkflowIndicator = ({ state }: { state: string }) => {
 const stateConfig = WORKFLOW_STATES[state as keyof typeof WORKFLOW_STATES]
 return (
 <div className="flex items-center gap-2">
 <span className={`
 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
 ${stateConfig.color === 'gray' ? 'bg-muted text-muted-foreground' : ''}
 ${stateConfig.color === 'yellow' ? 'bg-warning/10 text-warning' : ''}
 ${stateConfig.color === 'orange' ? 'bg-warning/20 text-warning' : ''}
 ${stateConfig.color === 'blue' ? 'bg-primary/10 text-primary' : ''}
 ${stateConfig.color === 'green' ? 'bg-primary/10 text-primary' : ''}
 ${stateConfig.color === 'red' ? 'bg-destructive/10 text-destructive' : ''}
 `}>
 {t(`mous.statuses.${state}`)}
 </span>
 {stateConfig.next && (
 <Button
 size="sm"
 variant="ghost"
 className="h-6 px-2"
 onClick={() => {/* handle transition */}}
 >
 <ChevronRight className="h-3 w-3" />
 {t(`mous.statuses.${stateConfig.next}`)}
 </Button>
 )}
 </div>
 )
 }

 const columns = useMemo<ColumnDef<MoU>[]>(() => [
 {
 id: 'reference',
 accessorKey: 'reference_number',
 header: t('mous.referenceNumber'),
 cell: ({ row }) => (
 <div className="font-mono text-sm">{row.original.reference_number}</div>
 ),
 },
 {
 id: 'title',
 header: t('mous.title'),
 accessorFn: (row) => (isRTL ? row.title_ar : row.title_en),
 cell: ({ row }) => (
 <div className={`font-medium ${isRTL ? 'text-end' : 'text-start'}`}>
 {isRTL ? row.original.title_ar : row.original.title_en}
 </div>
 ),
 },
 {
 id: 'parties',
 header: t('mous.parties'),
 cell: ({ row }) => (
 <div className="text-sm">
 <div>{isRTL ? row.original.primary_party.name_ar : row.original.primary_party.name_en}</div>
 <div className="text-muted-foreground">
 ↔ {isRTL ? row.original.secondary_party.name_ar : row.original.secondary_party.name_en}
 </div>
 </div>
 ),
 },
 {
 id: 'workflow',
 header: t('mous.workflow'),
 accessorKey: 'workflow_state',
 cell: ({ row }) => <WorkflowIndicator state={row.original.workflow_state} />,
 },
 {
 id: 'dates',
 header: t('mous.dates'),
 cell: ({ row }) => (
 <div className="text-sm space-y-1">
 {row.original.signing_date && (
 <div className="flex items-center gap-1">
 <FileText className="h-3 w-3" />
 {format(new Date(row.original.signing_date), 'dd MMM yyyy')}
 </div>
 )}
 {row.original.expiry_date && (
 <div className="flex items-center gap-1">
 <Clock className="h-3 w-3" />
 {format(new Date(row.original.expiry_date), 'dd MMM yyyy')}
 </div>
 )}
 </div>
 ),
 },
 {
 id: 'alerts',
 header: '',
 enableSorting: false,
 cell: ({ row }) => {
 if (row.original.expiry_date) {
 const daysUntilExpiry = Math.floor(
 (new Date(row.original.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
 )
 if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
 return (
 <div className="flex items-center gap-1 text-warning">
 <AlertCircle className="h-4 w-4" />
 <span className="text-xs">{daysUntilExpiry}d</span>
 </div>
 )
 }
 }
 return null
 },
 },
 ], [isRTL, t])

 const workflowStates = Object.keys(WORKFLOW_STATES)

 return (
 <div className="container mx-auto py-6">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-3xl font-bold">{t('navigation.mous')}</h1>
 <Button>
 <Plus className="h-4 w-4 me-2" />
 {t('mous.addMou')}
 </Button>
 </div>

 <div className="grid gap-4 md:grid-cols-4 mb-6">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">{t('mous.total')}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{mous?.length || 0}</div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">{t('mous.active')}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {mous?.filter(m => m.workflow_state === 'active').length || 0}
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">{t('mous.expiringSoon')}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-warning">
 {mous?.filter(m => {
 if (!m.expiry_date) return false
 const days = Math.floor(
 (new Date(m.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
 )
 return days <= 30 && days > 0
 }).length || 0}
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">{t('mous.inProgress')}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">
 {mous?.filter(m => ['internal_review', 'external_review', 'negotiation'].includes(m.workflow_state)).length || 0}
 </div>
 </CardContent>
 </Card>
 </div>

 <Card className="mb-6">
 <CardHeader>
 <CardTitle>{t('common.filter')}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex gap-4">
 <Input
 placeholder={t('common.search')}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="max-w-sm"
 />
 <div className="flex gap-2 flex-wrap">
 <Button
 variant={filterState === 'all' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setFilterState('all')}
 >
 {t('common.all')}
 </Button>
 {workflowStates.map(state => (
 <Button
 key={state}
 variant={filterState === state ? 'default' : 'outline'}
 size="sm"
 onClick={() => setFilterState(state)}
 >
 {t(`mous.statuses.${state}`)}
 </Button>
 ))}
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardContent className="p-0">
 {isLoading ? (
 <div className="p-8 text-center">{t('common.loading')}</div>
 ) : mous && mous.length > 0 ? (
 <DataTable
 data={mous}
 columns={columns}
 onRowClick={(mou) => console.log('MoU clicked:', mou)}
 />
 ) : (
 <div className="p-8 text-center text-muted-foreground">
 {t('common.noData')}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}