/**
 * Route: /admin/data-retention
 * Data Retention Policies Administration
 * Feature: data-retention-policies
 *
 * Configurable retention policies for different entity types and document classes.
 * Includes legal hold support and policy execution.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import {
  Shield,
  Database,
  Clock,
  Archive,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  FileText,
  Lock,
  Unlock,
  Plus,
  Settings,
  BarChart3,
  History,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import {
  useRetentionPolicies,
  useRetentionStatistics,
  usePendingRetentionActions,
  useExpiringEntities,
  useRetentionExecutionLog,
  useLegalHolds,
  useRunRetentionProcessor,
  useCreateRetentionPolicy,
  useUpdateRetentionPolicy,
  useCreateLegalHold,
  useReleaseLegalHold,
} from '@/hooks/useRetentionPolicies'
import type {
  RetentionPolicy,
  RetentionPolicyInput,
  LegalHold,
  LegalHoldInput,
  RetentionEntityType,
  DocumentClass,
  RetentionActionType,
  ProcessorConfig,
} from '@/types/retention-policy.types'

export const Route = createFileRoute('/_protected/admin/data-retention')({
  component: DataRetentionPage,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
    if (!isAdmin) {
      throw new Error('Admin access required')
    }
  },
})

// Entity type options
const ENTITY_TYPES: Array<{ value: RetentionEntityType; label: string }> = [
  { value: 'dossier', label: 'Dossiers' },
  { value: 'intake_ticket', label: 'Intake Tickets' },
  { value: 'document', label: 'Documents' },
  { value: 'attachment', label: 'Attachments' },
  { value: 'audit_log', label: 'Audit Logs' },
  { value: 'ai_interaction_log', label: 'AI Interaction Logs' },
  { value: 'commitment', label: 'Commitments' },
  { value: 'after_action_record', label: 'After Action Records' },
  { value: 'position', label: 'Positions' },
  { value: 'engagement', label: 'Engagements' },
  { value: 'calendar_event', label: 'Calendar Events' },
  { value: 'notification', label: 'Notifications' },
  { value: 'activity_feed', label: 'Activity Feed' },
]

// Document class options
const DOCUMENT_CLASSES: Array<{ value: DocumentClass; label: string }> = [
  { value: 'operational', label: 'Operational' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'legal', label: 'Legal' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'financial', label: 'Financial' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'research', label: 'Research' },
  { value: 'archive_permanent', label: 'Permanent Archive' },
]

// Action type options
const RETENTION_ACTIONS: Array<{ value: RetentionActionType; label: string }> = [
  { value: 'archive', label: 'Archive' },
  { value: 'soft_delete', label: 'Soft Delete' },
  { value: 'hard_delete', label: 'Hard Delete' },
  { value: 'anonymize', label: 'Anonymize' },
]

function DataRetentionPage() {
  const { t, i18n } = useTranslation('retention-policies')
  const isRTL = i18n.language === 'ar'

  // State
  const [activeTab, setActiveTab] = useState('overview')
  const [showPolicyDialog, setShowPolicyDialog] = useState(false)
  const [showLegalHoldDialog, setShowLegalHoldDialog] = useState(false)
  const [showProcessorDialog, setShowProcessorDialog] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<RetentionPolicy | null>(null)

  // Hooks
  const { data: policies = [], isLoading: policiesLoading } = useRetentionPolicies({
    status: 'active',
  })
  const { data: statistics = [], isLoading: statsLoading } = useRetentionStatistics()
  const { data: pendingActions = [], isLoading: pendingLoading } = usePendingRetentionActions({
    limit: 10,
  })
  const { data: expiringEntities = [], isLoading: expiringLoading } = useExpiringEntities({
    days: 30,
    limit: 10,
  })
  const { data: executionLog = [], isLoading: logLoading } = useRetentionExecutionLog()
  const { data: legalHolds = [], isLoading: holdsLoading } = useLegalHolds({ status: 'active' })

  // Mutations
  const createPolicy = useCreateRetentionPolicy()
  const updatePolicy = useUpdateRetentionPolicy()
  const createLegalHold = useCreateLegalHold()
  const releaseLegalHold = useReleaseLegalHold()
  const runProcessor = useRunRetentionProcessor()

  // Calculate summary stats
  const totalPolicies = policies.length
  const activeLegalHolds = legalHolds.filter((h) => h.status === 'active').length
  const totalPendingActions = pendingActions.length
  const totalExpiringSoon = expiringEntities.length
  const entitiesUnderHold = statistics.reduce((sum, s) => sum + s.under_hold, 0)

  // Format retention period
  const formatRetentionPeriod = (days: number) => {
    if (days === 0) return t('period.permanent', 'Permanent')
    if (days >= 365) {
      const years = Math.floor(days / 365)
      return `${years} ${years === 1 ? t('period.year', 'Year') : t('period.years', 'Years')}`
    }
    return `${days} ${t('period.days', 'Days')}`
  }

  // Format action
  const formatAction = (action: RetentionActionType) => {
    const map: Record<RetentionActionType, string> = {
      archive: t('action.archive', 'Archive'),
      soft_delete: t('action.softDelete', 'Soft Delete'),
      hard_delete: t('action.hardDelete', 'Hard Delete'),
      anonymize: t('action.anonymize', 'Anonymize'),
    }
    return map[action] || action
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'disabled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      case 'released':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Database className="h-7 w-7 text-primary" />
            {t('title', 'Data Retention Policies')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description', 'Configure data lifecycle, retention periods, and legal holds')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowProcessorDialog(true)}>
            <Play className="h-4 w-4 me-2" />
            {t('actions.runProcessor', 'Run Processor')}
          </Button>
          <Button onClick={() => setShowPolicyDialog(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t('actions.newPolicy', 'New Policy')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPolicies}</p>
                <p className="text-sm text-muted-foreground">
                  {t('stats.activePolicies', 'Active Policies')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeLegalHolds}</p>
                <p className="text-sm text-muted-foreground">
                  {t('stats.legalHolds', 'Legal Holds')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPendingActions}</p>
                <p className="text-sm text-muted-foreground">
                  {t('stats.pendingActions', 'Pending Actions')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalExpiringSoon}</p>
                <p className="text-sm text-muted-foreground">
                  {t('stats.expiringSoon', 'Expiring Soon')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{entitiesUnderHold}</p>
                <p className="text-sm text-muted-foreground">
                  {t('stats.underHold', 'Under Hold')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="gap-2 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.overview', 'Overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2 py-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.policies', 'Policies')}</span>
          </TabsTrigger>
          <TabsTrigger value="legal-holds" className="gap-2 py-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.legalHolds', 'Legal Holds')}</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 py-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.pending', 'Pending')}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 py-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.history', 'History')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistics by Entity Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('overview.byEntityType', 'Statistics by Entity Type')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : statistics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t('overview.noStats', 'No retention tracking data yet')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {statistics.slice(0, 6).map((stat) => (
                      <div key={stat.entity_type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {stat.entity_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {stat.total_tracked} {t('overview.tracked', 'tracked')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {stat.under_hold > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {stat.under_hold} held
                            </Badge>
                          )}
                          {stat.archived > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {stat.archived} archived
                            </Badge>
                          )}
                          {stat.pending_action > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {stat.pending_action} pending
                            </Badge>
                          )}
                          {stat.expiring_soon > 0 && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800">
                              {stat.expiring_soon} expiring
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Execution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t('overview.recentExecutions', 'Recent Executions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : executionLog.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t('overview.noExecutions', 'No processor executions yet')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {executionLog.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={log.execution_type === 'dry_run' ? 'outline' : 'default'}
                            >
                              {log.execution_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(log.started_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">
                            {log.items_processed} processed, {log.items_archived} archived,{' '}
                            {log.items_deleted} deleted
                          </p>
                        </div>
                        {log.completed_at ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Expiring Soon Alert */}
          {totalExpiringSoon > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('overview.expiringAlert', 'Entities Expiring Soon')}</AlertTitle>
              <AlertDescription>
                {t(
                  'overview.expiringAlertDesc',
                  '{{count}} entities will expire within the next 30 days. Review them in the Pending tab.',
                  { count: totalExpiringSoon },
                )}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('policies.title', 'Retention Policies')}</CardTitle>
                  <CardDescription>
                    {t(
                      'policies.description',
                      'Configure how long data is retained and what happens when it expires',
                    )}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowPolicyDialog(true)}>
                  <Plus className="h-4 w-4 me-2" />
                  {t('actions.newPolicy', 'New Policy')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : policies.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('policies.empty', 'No Policies')}</p>
                  <p className="text-muted-foreground mb-4">
                    {t(
                      'policies.emptyDesc',
                      'Create your first retention policy to start managing data lifecycle',
                    )}
                  </p>
                  <Button onClick={() => setShowPolicyDialog(true)}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('actions.newPolicy', 'Create Policy')}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('policies.name', 'Name')}</TableHead>
                      <TableHead>{t('policies.entityType', 'Entity Type')}</TableHead>
                      <TableHead>{t('policies.retention', 'Retention')}</TableHead>
                      <TableHead>{t('policies.action', 'Action')}</TableHead>
                      <TableHead>{t('policies.status', 'Status')}</TableHead>
                      <TableHead className="text-end">{t('policies.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{policy.name_en}</p>
                            <p className="text-sm text-muted-foreground">{policy.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {policy.entity_type.replace(/_/g, ' ')}
                          {policy.document_class && (
                            <span className="text-muted-foreground">
                              {' '}
                              / {policy.document_class}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatRetentionPeriod(policy.retention_days)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatAction(policy.action)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPolicy(policy)
                              setShowPolicyDialog(true)
                            }}
                          >
                            {t('actions.edit', 'Edit')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Holds Tab */}
        <TabsContent value="legal-holds">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {t('legalHolds.title', 'Legal Holds')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'legalHolds.description',
                      'Prevent data from being archived or deleted during legal proceedings',
                    )}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowLegalHoldDialog(true)}>
                  <Plus className="h-4 w-4 me-2" />
                  {t('actions.newLegalHold', 'New Legal Hold')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {holdsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : legalHolds.length === 0 ? (
                <div className="text-center py-12">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('legalHolds.empty', 'No Legal Holds')}</p>
                  <p className="text-muted-foreground mb-4">
                    {t(
                      'legalHolds.emptyDesc',
                      'Legal holds prevent data deletion during legal proceedings',
                    )}
                  </p>
                  <Button onClick={() => setShowLegalHoldDialog(true)}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('actions.newLegalHold', 'Create Legal Hold')}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('legalHolds.reference', 'Reference')}</TableHead>
                      <TableHead>{t('legalHolds.name', 'Name')}</TableHead>
                      <TableHead>{t('legalHolds.matter', 'Legal Matter')}</TableHead>
                      <TableHead>{t('legalHolds.effectiveDate', 'Effective Date')}</TableHead>
                      <TableHead>{t('legalHolds.status', 'Status')}</TableHead>
                      <TableHead className="text-end">
                        {t('legalHolds.actions', 'Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {legalHolds.map((hold) => (
                      <TableRow key={hold.id}>
                        <TableCell className="font-mono text-sm">{hold.reference_number}</TableCell>
                        <TableCell>
                          <p className="font-medium">{hold.name_en}</p>
                          {hold.entity_type && (
                            <p className="text-sm text-muted-foreground capitalize">
                              {hold.entity_type.replace(/_/g, ' ')}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{hold.legal_matter || '-'}</TableCell>
                        <TableCell>{new Date(hold.effective_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(hold.status)}>{hold.status}</Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          {hold.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => releaseLegalHold.mutate(hold.id)}
                              disabled={releaseLegalHold.isPending}
                            >
                              <Unlock className="h-4 w-4 me-2" />
                              {t('actions.release', 'Release')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Actions Tab */}
        <TabsContent value="pending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Retention Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('pending.actions', 'Pending Retention Actions')}
                </CardTitle>
                <CardDescription>
                  {t('pending.actionsDesc', 'Entities that have exceeded their retention period')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : pendingActions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t('pending.noActions', 'No pending actions')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingActions.map((action) => (
                      <div
                        key={action.entity_id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {action.entity_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {action.policy_name_en} • {formatAction(action.action)}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {Math.abs(action.days_until_expiration)} days overdue
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t('pending.expiring', 'Expiring Soon')}
                </CardTitle>
                <CardDescription>
                  {t('pending.expiringDesc', 'Entities expiring within 30 days')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expiringLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : expiringEntities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t('pending.noExpiring', 'No entities expiring soon')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {expiringEntities.map((entity) => (
                      <div
                        key={entity.entity_id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {entity.entity_type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entity.policy_name_en} • {formatAction(entity.action)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                        >
                          {entity.days_until_expiration} days left
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('history.title', 'Execution History')}
              </CardTitle>
              <CardDescription>
                {t('history.description', 'Log of all retention processor executions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : executionLog.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {t('history.empty', 'No Execution History')}
                  </p>
                  <p className="text-muted-foreground">
                    {t('history.emptyDesc', 'Run the retention processor to see execution history')}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('history.date', 'Date')}</TableHead>
                      <TableHead>{t('history.type', 'Type')}</TableHead>
                      <TableHead>{t('history.processed', 'Processed')}</TableHead>
                      <TableHead>{t('history.archived', 'Archived')}</TableHead>
                      <TableHead>{t('history.deleted', 'Deleted')}</TableHead>
                      <TableHead>{t('history.warned', 'Warned')}</TableHead>
                      <TableHead>{t('history.errors', 'Errors')}</TableHead>
                      <TableHead>{t('history.status', 'Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.started_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={log.execution_type === 'dry_run' ? 'outline' : 'default'}>
                            {log.execution_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.items_processed}</TableCell>
                        <TableCell>{log.items_archived}</TableCell>
                        <TableCell>{log.items_deleted}</TableCell>
                        <TableCell>{log.items_warned}</TableCell>
                        <TableCell>
                          {log.errors.length > 0 ? (
                            <Badge variant="destructive">{log.errors.length}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.completed_at ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Policy Dialog */}
      <PolicyDialog
        open={showPolicyDialog}
        onOpenChange={(open) => {
          setShowPolicyDialog(open)
          if (!open) setSelectedPolicy(null)
        }}
        policy={selectedPolicy}
        onSave={(data) => {
          if (selectedPolicy) {
            updatePolicy.mutate({ id: selectedPolicy.id, updates: data })
          } else {
            createPolicy.mutate(data)
          }
          setShowPolicyDialog(false)
          setSelectedPolicy(null)
        }}
        isLoading={createPolicy.isPending || updatePolicy.isPending}
      />

      {/* Legal Hold Dialog */}
      <LegalHoldDialog
        open={showLegalHoldDialog}
        onOpenChange={setShowLegalHoldDialog}
        onSave={(data) => {
          createLegalHold.mutate(data)
          setShowLegalHoldDialog(false)
        }}
        isLoading={createLegalHold.isPending}
      />

      {/* Processor Dialog */}
      <ProcessorDialog
        open={showProcessorDialog}
        onOpenChange={setShowProcessorDialog}
        onRun={(config) => {
          runProcessor.mutate(config)
          setShowProcessorDialog(false)
        }}
        isLoading={runProcessor.isPending}
      />
    </div>
  )
}

// Policy Dialog Component
function PolicyDialog({
  open,
  onOpenChange,
  policy,
  onSave,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: RetentionPolicy | null
  onSave: (data: RetentionPolicyInput) => void
  isLoading: boolean
}) {
  const { t } = useTranslation('retention-policies')
  const [formData, setFormData] = useState<Partial<RetentionPolicyInput>>({})

  const handleSubmit = () => {
    if (!formData.code || !formData.name_en || !formData.name_ar || !formData.entity_type) {
      return
    }
    onSave({
      code: formData.code,
      name_en: formData.name_en,
      name_ar: formData.name_ar,
      description_en: formData.description_en,
      description_ar: formData.description_ar,
      entity_type: formData.entity_type,
      document_class: formData.document_class,
      sensitivity_level: formData.sensitivity_level,
      retention_days: formData.retention_days || 0,
      warning_days: formData.warning_days || 30,
      action: formData.action || 'archive',
      status: formData.status || 'active',
      priority: formData.priority || 100,
      regulatory_reference: formData.regulatory_reference,
      compliance_notes: formData.compliance_notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {policy
              ? t('dialog.editPolicy', 'Edit Policy')
              : t('dialog.newPolicy', 'New Retention Policy')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'dialog.policyDesc',
              'Configure how long data should be retained and what happens when it expires',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.code', 'Policy Code')}</Label>
              <Input
                placeholder="POL-DOC-3Y"
                value={formData.code || policy?.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.priority', 'Priority')}</Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.priority || policy?.priority || 100}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.nameEn', 'Name (English)')}</Label>
              <Input
                value={formData.name_en || policy?.name_en || ''}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.nameAr', 'Name (Arabic)')}</Label>
              <Input
                value={formData.name_ar || policy?.name_ar || ''}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.entityType', 'Entity Type')}</Label>
              <Select
                value={formData.entity_type || policy?.entity_type || ''}
                onValueChange={(v) =>
                  setFormData({ ...formData, entity_type: v as RetentionEntityType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.documentClass', 'Document Class (Optional)')}</Label>
              <Select
                value={formData.document_class || policy?.document_class || '__none__'}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    document_class: v === '__none__' ? undefined : (v as DocumentClass),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All Classes</SelectItem>
                  {DOCUMENT_CLASSES.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.retentionDays', 'Retention Days')}</Label>
              <Input
                type="number"
                placeholder="0 = Permanent"
                value={formData.retention_days ?? policy?.retention_days ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, retention_days: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">0 = Permanent</p>
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.warningDays', 'Warning Days')}</Label>
              <Input
                type="number"
                value={formData.warning_days ?? policy?.warning_days ?? 30}
                onChange={(e) =>
                  setFormData({ ...formData, warning_days: parseInt(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.action', 'Action')}</Label>
              <Select
                value={formData.action || policy?.action || 'archive'}
                onValueChange={(v) =>
                  setFormData({ ...formData, action: v as RetentionActionType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t('dialog.regulatoryReference', 'Regulatory Reference (Optional)')}</Label>
            <Input
              placeholder="ISO 27001, GDPR, etc."
              value={formData.regulatory_reference || policy?.regulatory_reference || ''}
              onChange={(e) => setFormData({ ...formData, regulatory_reference: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('dialog.complianceNotes', 'Compliance Notes')}</Label>
            <Textarea
              placeholder="Additional compliance information..."
              value={formData.compliance_notes || policy?.compliance_notes || ''}
              onChange={(e) => setFormData({ ...formData, compliance_notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('dialog.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t('dialog.saving', 'Saving...') : t('dialog.save', 'Save Policy')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Legal Hold Dialog Component
function LegalHoldDialog({
  open,
  onOpenChange,
  onSave,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: LegalHoldInput) => void
  isLoading: boolean
}) {
  const { t } = useTranslation('retention-policies')
  const [formData, setFormData] = useState<Partial<LegalHoldInput>>({
    status: 'active',
    notify_custodians: true,
  })

  const handleSubmit = () => {
    if (
      !formData.name_en ||
      !formData.name_ar ||
      !formData.reference_number ||
      !formData.reason_en ||
      !formData.reason_ar
    ) {
      return
    }
    onSave({
      name_en: formData.name_en,
      name_ar: formData.name_ar,
      description_en: formData.description_en,
      description_ar: formData.description_ar,
      reference_number: formData.reference_number,
      entity_type: formData.entity_type,
      status: 'active',
      reason_en: formData.reason_en,
      reason_ar: formData.reason_ar,
      legal_matter: formData.legal_matter,
      effective_date: formData.effective_date || new Date().toISOString(),
      expiry_date: formData.expiry_date,
      notify_custodians: formData.notify_custodians,
    })
    setFormData({ status: 'active', notify_custodians: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialog.newLegalHold', 'New Legal Hold')}</DialogTitle>
          <DialogDescription>
            {t(
              'dialog.legalHoldDesc',
              'Create a legal hold to prevent data from being archived or deleted',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>{t('dialog.reference', 'Reference Number')}</Label>
            <Input
              placeholder="LH-2026-001"
              value={formData.reference_number || ''}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.nameEn', 'Name (English)')}</Label>
              <Input
                value={formData.name_en || ''}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.nameAr', 'Name (Arabic)')}</Label>
              <Input
                value={formData.name_ar || ''}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('dialog.legalMatter', 'Legal Matter')}</Label>
            <Input
              placeholder="Case name or matter reference"
              value={formData.legal_matter || ''}
              onChange={(e) => setFormData({ ...formData, legal_matter: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('dialog.reasonEn', 'Reason (English)')}</Label>
              <Textarea
                value={formData.reason_en || ''}
                onChange={(e) => setFormData({ ...formData, reason_en: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog.reasonAr', 'Reason (Arabic)')}</Label>
              <Textarea
                value={formData.reason_ar || ''}
                onChange={(e) => setFormData({ ...formData, reason_ar: e.target.value })}
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('dialog.entityType', 'Entity Type (Optional)')}</Label>
            <Select
              value={formData.entity_type || '__all__'}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  entity_type: v === '__all__' ? undefined : (v as RetentionEntityType),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All entity types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="notify"
              checked={formData.notify_custodians}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notify_custodians: checked })
              }
            />
            <Label htmlFor="notify">{t('dialog.notifyCustodians', 'Notify custodians')}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('dialog.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? t('dialog.creating', 'Creating...')
              : t('dialog.createHold', 'Create Legal Hold')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Processor Dialog Component
function ProcessorDialog({
  open,
  onOpenChange,
  onRun,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRun: (config: ProcessorConfig) => void
  isLoading: boolean
}) {
  const { t } = useTranslation('retention-policies')
  const [config, setConfig] = useState<ProcessorConfig>({
    dry_run: true,
    batch_size: 100,
    send_warnings: true,
    warning_days: 30,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('processor.title', 'Run Retention Processor')}</DialogTitle>
          <DialogDescription>
            {t('processor.description', 'Execute retention policies on expired entities')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('processor.warning', 'Warning')}</AlertTitle>
            <AlertDescription>
              {t(
                'processor.warningDesc',
                'Running the processor will archive or delete expired data. Use dry run first to preview changes.',
              )}
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Switch
              id="dry-run"
              checked={config.dry_run}
              onCheckedChange={(checked) => setConfig({ ...config, dry_run: checked })}
            />
            <Label htmlFor="dry-run">{t('processor.dryRun', 'Dry Run (Preview Only)')}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="send-warnings"
              checked={config.send_warnings}
              onCheckedChange={(checked) => setConfig({ ...config, send_warnings: checked })}
            />
            <Label htmlFor="send-warnings">
              {t('processor.sendWarnings', 'Send expiration warnings')}
            </Label>
          </div>

          <div className="space-y-2">
            <Label>{t('processor.batchSize', 'Batch Size')}</Label>
            <Input
              type="number"
              value={config.batch_size}
              onChange={(e) =>
                setConfig({ ...config, batch_size: parseInt(e.target.value) || 100 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>{t('processor.entityType', 'Entity Type (Optional)')}</Label>
            <Select
              value={config.entity_type || '__all__'}
              onValueChange={(v) =>
                setConfig({
                  ...config,
                  entity_type: v === '__all__' ? undefined : (v as RetentionEntityType),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All entity types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('dialog.cancel', 'Cancel')}
          </Button>
          <Button onClick={() => onRun(config)} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                {t('processor.running', 'Running...')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 me-2" />
                {config.dry_run
                  ? t('processor.preview', 'Preview')
                  : t('processor.run', 'Run Processor')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DataRetentionPage
