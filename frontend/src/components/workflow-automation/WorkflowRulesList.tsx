/**
 * WorkflowRulesList Component
 * Displays a list of workflow rules with filtering and search
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Filter, Loader2, Workflow } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useWorkflowRules,
  useToggleWorkflowRule,
  useDeleteWorkflowRule,
  useDuplicateWorkflowRule,
} from '@/hooks/useWorkflowAutomation'
import type {
  WorkflowRule,
  WorkflowEntityType,
  WorkflowTriggerType,
  WorkflowRulesListParams,
} from '@/types/workflow-automation.types'
import { WorkflowRuleCard } from './WorkflowRuleCard'
import { entityTypes, triggerTypes } from './workflow-config'

interface WorkflowRulesListProps {
  onCreateNew: () => void
  onEdit: (rule: WorkflowRule) => void
  onViewExecutions: (rule: WorkflowRule) => void
  onTest: (rule: WorkflowRule) => void
}

export function WorkflowRulesList({
  onCreateNew,
  onEdit,
  onViewExecutions,
  onTest,
}: WorkflowRulesListProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'

  // Filter state
  const [filters, setFilters] = useState<WorkflowRulesListParams>({
    page: 1,
    limit: 20,
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Queries
  const { data, isLoading, isError, refetch } = useWorkflowRules({
    ...filters,
    search: searchQuery || undefined,
  })

  // Mutations
  const toggleMutation = useToggleWorkflowRule()
  const deleteMutation = useDeleteWorkflowRule()
  const duplicateMutation = useDuplicateWorkflowRule()

  const handleToggle = (rule: WorkflowRule) => {
    toggleMutation.mutate({ id: rule.id, is_active: !rule.is_active })
  }

  const handleDelete = (rule: WorkflowRule) => {
    if (window.confirm(t('messages.confirmDelete'))) {
      deleteMutation.mutate(rule.id)
    }
  }

  const handleDuplicate = (rule: WorkflowRule) => {
    duplicateMutation.mutate(rule)
  }

  const handleFilterChange = (key: keyof WorkflowRulesListParams, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1, // Reset to first page on filter change
    }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('headings.list')}</h1>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button onClick={onCreateNew} className="w-full sm:w-auto">
          <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
          {t('actions.create')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'end-3' : 'start-3'}`}
            />
            <Input
              type="search"
              placeholder={t('placeholders.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isRTL ? 'pe-10' : 'ps-10'}
            />
          </div>
        </form>

        {/* Entity Type Filter */}
        <Select
          value={filters.entity_type || 'all'}
          onValueChange={(value) => handleFilterChange('entity_type', value as WorkflowEntityType)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filters.byEntity')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            {entityTypes.map((entity) => (
              <SelectItem key={entity.value} value={entity.value}>
                {isRTL ? entity.label_ar : entity.label_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Trigger Type Filter */}
        <Select
          value={filters.trigger_type || 'all'}
          onValueChange={(value) =>
            handleFilterChange('trigger_type', value as WorkflowTriggerType)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filters.byTrigger')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            {triggerTypes.map((trigger) => (
              <SelectItem key={trigger.value} value={trigger.value}>
                {isRTL ? trigger.label_ar : trigger.label_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active Filter */}
        <Select
          value={filters.is_active === undefined ? 'all' : String(filters.is_active)}
          onValueChange={(value) =>
            handleFilterChange('is_active', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder={t('labels.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            <SelectItem value="true">{t('filters.active')}</SelectItem>
            <SelectItem value="false">{t('filters.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-destructive">{t('messages.error')}</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            {t('actions.retry')}
          </Button>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="text-center py-12">
          <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">{t('messages.noRules')}</h3>
          <p className="text-muted-foreground mt-1">{t('description')}</p>
          <Button onClick={onCreateNew} className="mt-4">
            <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('actions.create')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((rule) => (
              <WorkflowRuleCard
                key={rule.id}
                rule={rule}
                onEdit={onEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onToggle={handleToggle}
                onViewExecutions={onViewExecutions}
                onTest={onTest}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                {t('actions.back')}
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                {filters.page} / {data.pagination.total_pages}
              </span>
              <Button
                variant="outline"
                disabled={filters.page === data.pagination.total_pages}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              >
                {t('actions.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
