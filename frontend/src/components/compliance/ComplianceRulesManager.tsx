/**
 * ComplianceRulesManager Component
 * Feature: compliance-rules-management
 *
 * Main component for managing compliance rules, viewing violations,
 * and handling sign-offs. Includes tabbed interface for rules,
 * violations, exemptions, and templates.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Shield,
  FileText,
  AlertTriangle,
  FileCheck,
  BookTemplate,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  ComplianceRule,
  ComplianceViolation,
  ComplianceRuleType,
  ComplianceSeverity,
} from '@/types/compliance.types'
import {
  RULE_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  VIOLATION_STATUS_LABELS,
  VIOLATION_STATUS_COLORS,
} from '@/types/compliance.types'
import {
  useComplianceRules,
  useComplianceViolations,
  useComplianceTemplates,
  useAcknowledgeViolation,
} from '@/hooks/useComplianceRules'
import { ComplianceViolationAlert } from './ComplianceViolationAlert'
import { ComplianceSignoffDialog } from './ComplianceSignoffDialog'
import { toast } from 'sonner'

interface ComplianceRulesManagerProps {
  entityType?: string
  entityId?: string
}

export function ComplianceRulesManager({ entityType, entityId }: ComplianceRulesManagerProps) {
  const { t, i18n } = useTranslation('compliance')
  const isRTL = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState('violations')
  const [searchQuery, setSearchQuery] = useState('')
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null)
  const [signoffDialogOpen, setSignoffDialogOpen] = useState(false)

  // Queries
  const { data: rulesData, isLoading: rulesLoading } = useComplianceRules({
    is_active: true,
    rule_type: ruleTypeFilter !== 'all' ? ruleTypeFilter : undefined,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    page: 1,
    limit: 50,
  })

  const {
    data: violationsData,
    isLoading: violationsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComplianceViolations(
    {
      entity_type: entityType as any,
      entity_id: entityId,
      status: statusFilter !== 'all' ? [statusFilter as any] : undefined,
    },
    20,
  )

  const { data: templates, isLoading: templatesLoading } = useComplianceTemplates()

  const acknowledgeMutation = useAcknowledgeViolation()

  // Handlers
  const handleSignOff = (violation: ComplianceViolation) => {
    setSelectedViolation(violation)
    setSignoffDialogOpen(true)
  }

  const handleAcknowledge = async (violation: ComplianceViolation) => {
    try {
      await acknowledgeMutation.mutateAsync(violation.id)
      toast.success(t('messages.violationAcknowledged'))
    } catch {
      toast.error(t('messages.error'))
    }
  }

  const getName = (rule: ComplianceRule) => {
    return isRTL ? rule.name_ar : rule.name_en
  }

  const getDescription = (rule: ComplianceRule) => {
    return isRTL ? rule.description_ar : rule.description_en
  }

  // Flatten violations from infinite query
  const allViolations = violationsData?.pages.flatMap((page) => page.violations) || []

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Shield className="size-7" />
            {t('title')}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="violations" className="gap-2 py-2">
            <AlertTriangle className="size-4" />
            <span className="hidden sm:inline">{t('tabs.violations')}</span>
            {allViolations.length > 0 && (
              <Badge variant="secondary" className="ms-1">
                {allViolations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2 py-2">
            <FileText className="size-4" />
            <span className="hidden sm:inline">{t('tabs.rules')}</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 py-2">
            <BookTemplate className="size-4" />
            <span className="hidden sm:inline">{t('tabs.templates')}</span>
          </TabsTrigger>
          <TabsTrigger value="exemptions" className="gap-2 py-2">
            <FileCheck className="size-4" />
            <span className="hidden sm:inline">{t('tabs.exemptions')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Violations Tab */}
        <TabsContent value="violations" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <CardTitle className="text-lg">{t('violations.title')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('violations.allViolations')}</SelectItem>
                      <SelectItem value="pending">{t('violations.pendingViolations')}</SelectItem>
                      <SelectItem value="acknowledged">
                        {t('violations.acknowledgedViolations')}
                      </SelectItem>
                      <SelectItem value="signed_off">
                        {t('violations.resolvedViolations')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {violationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : allViolations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="mb-4 size-16 text-green-500" />
                  <h3 className="text-lg font-medium">{t('violations.noViolations')}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {t('violations.noViolationsDescription')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allViolations.map((violation) => (
                    <ComplianceViolationAlert
                      key={violation.id}
                      violation={violation}
                      onSignOff={handleSignOff}
                      onAcknowledge={handleAcknowledge}
                    />
                  ))}
                  {hasNextPage && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage && <Loader2 className="me-2 size-4 animate-spin" />}
                        {t('common:loadMore', 'Load More')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <CardTitle className="text-lg">{t('rules.title')}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('rules.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full ps-9 sm:w-[200px]"
                    />
                  </div>
                  <Select value={ruleTypeFilter} onValueChange={setRuleTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={t('rules.filterByType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('rules.allRules')}</SelectItem>
                      {Object.keys(RULE_TYPE_LABELS).map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`ruleTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={t('rules.filterBySeverity')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('rules.allRules')}</SelectItem>
                      {Object.keys(SEVERITY_LABELS).map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          {t(`severity.${severity}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : !rulesData?.rules.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 size-16 text-muted-foreground" />
                  <h3 className="text-lg font-medium">{t('rules.noRules')}</h3>
                  <p className="mt-1 text-muted-foreground">{t('rules.noRulesDescription')}</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('ruleForm.ruleCode')}</TableHead>
                        <TableHead>{t('ruleForm.nameEn')}</TableHead>
                        <TableHead>{t('ruleForm.ruleType')}</TableHead>
                        <TableHead>{t('ruleForm.severity')}</TableHead>
                        <TableHead>{t('ruleForm.requiresSignoff')}</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rulesData.rules
                        .filter(
                          (rule) =>
                            !searchQuery ||
                            rule.rule_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            rule.name_en.toLowerCase().includes(searchQuery.toLowerCase()),
                        )
                        .map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-mono text-sm">{rule.rule_code}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{getName(rule)}</p>
                                {getDescription(rule) && (
                                  <p className="line-clamp-1 text-xs text-muted-foreground">
                                    {getDescription(rule)}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{t(`ruleTypes.${rule.rule_type}`)}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${SEVERITY_COLORS[rule.severity].bg} ${SEVERITY_COLORS[rule.severity].text} border-0`}
                              >
                                {t(`severity.${rule.severity}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {rule.requires_signoff ? (
                                <Badge variant="secondary">
                                  <FileCheck className="me-1 size-3" />
                                  {t('ruleForm.requiresSignoff')}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="size-8 p-0">
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="me-2 size-4" />
                                    {t('rules.viewRule')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="me-2 size-4" />
                                    {t('rules.editRule')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="me-2 size-4" />
                                    {t('rules.deleteRule')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('templates.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('templates.subtitle')}</p>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : !templates?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookTemplate className="mb-4 size-16 text-muted-foreground" />
                  <h3 className="text-lg font-medium">{t('templates.noTemplates')}</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card key={template.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm">
                              {isRTL ? template.name_ar : template.name_en}
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {template.template_code}
                            </p>
                          </div>
                          <Badge
                            className={`${SEVERITY_COLORS[template.default_severity].bg} ${SEVERITY_COLORS[template.default_severity].text} border-0`}
                          >
                            {t(`severity.${template.default_severity}`)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {isRTL
                            ? template.description_ar || template.description_en
                            : template.description_en || template.description_ar}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{t(`ruleTypes.${template.rule_type}`)}</Badge>
                          {template.category && (
                            <Badge variant="secondary">{template.category}</Badge>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          <Plus className="me-2 size-4" />
                          {t('templates.useTemplate')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exemptions Tab */}
        <TabsContent value="exemptions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('exemptions.title')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('exemptions.subtitle')}</p>
                </div>
                <Button>
                  <Plus className="me-2 size-4" />
                  {t('exemptions.createExemption')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileCheck className="mb-4 size-16 text-muted-foreground" />
                <h3 className="text-lg font-medium">{t('exemptions.noExemptions')}</h3>
                <p className="mt-1 text-muted-foreground">
                  {t('exemptions.noExemptionsDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sign-off Dialog */}
      <ComplianceSignoffDialog
        violation={selectedViolation}
        open={signoffDialogOpen}
        onOpenChange={setSignoffDialogOpen}
        onSuccess={() => {
          setSelectedViolation(null)
        }}
      />
    </div>
  )
}

export default ComplianceRulesManager
