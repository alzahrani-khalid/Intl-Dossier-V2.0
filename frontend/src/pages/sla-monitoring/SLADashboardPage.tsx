/**
 * SLA Dashboard Page
 * Feature: sla-monitoring
 *
 * Main dashboard for SLA monitoring with compliance metrics, at-risk items, and escalations
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, RefreshCw, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SLAOverviewCards,
  SLAComplianceChart,
  SLAComplianceTable,
  SLAAtRiskList,
  SLAEscalationsList,
  SLAPolicyForm,
} from '@/components/sla-monitoring'
import {
  useSLADashboard,
  useSLAComplianceByType,
  useSLAComplianceByAssignee,
  useSLAAtRiskItems,
  useSLAEscalations,
  useSLAPolicies,
  useAcknowledgeEscalation,
  useResolveEscalation,
  useCreateSLAPolicy,
  useUpdateSLAPolicy,
  useSLARealtimeUpdates,
} from '@/hooks/useSLAMonitoring'
import type {
  SLAEntityType,
  SLAEscalationStatus,
  SLAPolicy,
  SLAPolicyInput,
} from '@/types/sla.types'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type DateRangeOption = '7d' | '30d' | '90d'

const getDateRange = (option: DateRangeOption) => {
  const end = new Date()
  const start = new Date()

  switch (option) {
    case '7d':
      start.setDate(end.getDate() - 7)
      break
    case '30d':
      start.setDate(end.getDate() - 30)
      break
    case '90d':
      start.setDate(end.getDate() - 90)
      break
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export function SLADashboardPage() {
  const { t, i18n } = useTranslation('sla')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d')
  const [entityType, setEntityType] = useState<SLAEntityType>('ticket')
  const [escalationStatus, setEscalationStatus] = useState<SLAEscalationStatus | 'all'>('all')
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null)

  // Calculate date range
  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange])

  // Queries
  const dashboardQuery = useSLADashboard({
    entityType,
    startDate,
    endDate,
  })

  const complianceByTypeQuery = useSLAComplianceByType({
    entityType,
    startDate,
    endDate,
  })

  const complianceByAssigneeQuery = useSLAComplianceByAssignee({
    startDate,
    endDate,
    limit: 20,
  })

  const atRiskQuery = useSLAAtRiskItems({
    entityType,
    threshold: 75,
    limit: 50,
  })

  const escalationsQuery = useSLAEscalations({
    status: escalationStatus === 'all' ? undefined : escalationStatus,
    entityType,
    limit: 50,
  })

  const policiesQuery = useSLAPolicies()

  // Mutations
  const acknowledgeEscalation = useAcknowledgeEscalation()
  const resolveEscalation = useResolveEscalation()
  const createPolicy = useCreateSLAPolicy()
  const updatePolicy = useUpdateSLAPolicy()

  // Realtime updates
  useSLARealtimeUpdates()

  // Handlers
  const handleRefresh = () => {
    dashboardQuery.refetch()
    complianceByTypeQuery.refetch()
    complianceByAssigneeQuery.refetch()
    atRiskQuery.refetch()
    escalationsQuery.refetch()
  }

  const handleAcknowledge = (escalationId: string) => {
    acknowledgeEscalation.mutate(escalationId)
  }

  const handleResolve = (escalationId: string, notes?: string) => {
    resolveEscalation.mutate({ escalationId, notes })
  }

  const handleCreatePolicy = (data: SLAPolicyInput) => {
    createPolicy.mutate(data, {
      onSuccess: () => {
        setPolicyDialogOpen(false)
        setEditingPolicy(null)
      },
    })
  }

  const handleUpdatePolicy = (data: SLAPolicyInput) => {
    if (editingPolicy) {
      updatePolicy.mutate(
        { id: editingPolicy.id, ...data },
        {
          onSuccess: () => {
            setPolicyDialogOpen(false)
            setEditingPolicy(null)
          },
        },
      )
    }
  }

  const handleEditPolicy = (policy: SLAPolicy) => {
    setEditingPolicy(policy)
    setPolicyDialogOpen(true)
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('filters.last7Days')}</SelectItem>
              <SelectItem value="30d">{t('filters.last30Days')}</SelectItem>
              <SelectItem value="90d">{t('filters.last90Days')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityType} onValueChange={(v) => setEntityType(v as SLAEntityType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ticket">{t('filters.ticket')}</SelectItem>
              <SelectItem value="commitment">{t('filters.commitment')}</SelectItem>
              <SelectItem value="task">{t('filters.task')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">{t('tabs.dashboard')}</TabsTrigger>
          <TabsTrigger value="policies">{t('tabs.policies')}</TabsTrigger>
          <TabsTrigger value="escalations">{t('tabs.escalations')}</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Overview Cards */}
          <SLAOverviewCards data={dashboardQuery.data} isLoading={dashboardQuery.isLoading} />

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SLAComplianceChart
              data={dashboardQuery.data?.trend_data}
              isLoading={dashboardQuery.isLoading}
            />
            <SLAAtRiskList
              data={atRiskQuery.data}
              isLoading={atRiskQuery.isLoading}
              onRefresh={() => atRiskQuery.refetch()}
            />
          </div>

          {/* Compliance Tables */}
          <SLAComplianceTable
            typeData={complianceByTypeQuery.data}
            assigneeData={complianceByAssigneeQuery.data}
            isLoading={complianceByTypeQuery.isLoading || complianceByAssigneeQuery.isLoading}
          />
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('policies.title')}</h2>
            <Button onClick={() => setPolicyDialogOpen(true)}>
              <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('policies.create')}
            </Button>
          </div>

          {policiesQuery.isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : policiesQuery.data && policiesQuery.data.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('policies.name')}</TableHead>
                      <TableHead className="text-center">{t('policies.requestType')}</TableHead>
                      <TableHead className="text-center">{t('policies.priority')}</TableHead>
                      <TableHead className="text-center">
                        {t('policies.acknowledgmentTarget')}
                      </TableHead>
                      <TableHead className="text-center">
                        {t('policies.resolutionTarget')}
                      </TableHead>
                      <TableHead className="text-center">{t('common.status')}</TableHead>
                      <TableHead className="text-end">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policiesQuery.data.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">
                          {isRTL ? policy.name_ar || policy.name : policy.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {policy.request_type ? t(`types.${policy.request_type}`) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {policy.priority ? t(`priority.${policy.priority}`) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {policy.acknowledgment_target} min
                        </TableCell>
                        <TableCell className="text-center">
                          {policy.resolution_target} min
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                            {policy.is_active ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPolicy(policy)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('empty.noPolicies')}</h3>
                <p className="text-muted-foreground mt-1">{t('empty.createFirst')}</p>
                <Button onClick={() => setPolicyDialogOpen(true)} className="mt-4">
                  <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                  {t('policies.create')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Escalations Tab */}
        <TabsContent value="escalations">
          <SLAEscalationsList
            data={escalationsQuery.data}
            isLoading={escalationsQuery.isLoading}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onStatusFilterChange={setEscalationStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Policy Dialog */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle>{editingPolicy ? t('policies.edit') : t('policies.create')}</DialogTitle>
          </DialogHeader>
          <SLAPolicyForm
            defaultValues={editingPolicy || undefined}
            onSubmit={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
            onCancel={() => {
              setPolicyDialogOpen(false)
              setEditingPolicy(null)
            }}
            isSubmitting={createPolicy.isPending || updatePolicy.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SLADashboardPage
