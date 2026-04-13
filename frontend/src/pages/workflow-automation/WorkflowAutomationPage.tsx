/**
 * WorkflowAutomationPage
 * Main page for workflow automation management
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Workflow } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  WorkflowRulesList,
  WorkflowBuilder,
  WorkflowExecutionsList,
  WorkflowTestDialog,
} from '@/components/workflow-automation'
import type { WorkflowRule } from '@/types/workflow-automation.types'

type ViewMode = 'list' | 'create' | 'edit'
type TabValue = 'rules' | 'executions'

export function WorkflowAutomationPage() {
  const { t } = useTranslation('workflow-automation')
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>('rules')
  const [testDialogOpen, setTestDialogOpen] = useState(false)

  const handleCreateNew = () => {
    setSelectedRule(null)
    setViewMode('create')
  }

  const handleEdit = (rule: WorkflowRule) => {
    setSelectedRule(rule)
    setViewMode('edit')
  }

  const handleViewExecutions = (rule: WorkflowRule) => {
    setSelectedRule(rule)
    setActiveTab('executions')
  }

  const handleTest = (rule: WorkflowRule) => {
    setSelectedRule(rule)
    setTestDialogOpen(true)
  }

  const handleSave = () => {
    setViewMode('list')
    setSelectedRule(null)
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedRule(null)
  }

  // Render builder view
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <WorkflowBuilder rule={selectedRule} onSave={handleSave} onCancel={handleCancel} />
      </div>
    )
  }

  // Render list view with tabs
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <PageHeader
          icon={<Workflow className="h-6 w-6" />}
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <TabsList>
              <TabsTrigger value="rules">{t('navigation.rules')}</TabsTrigger>
              <TabsTrigger value="executions">{t('navigation.executions')}</TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent value="rules" className="mt-0">
          <WorkflowRulesList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onViewExecutions={handleViewExecutions}
            onTest={handleTest}
          />
        </TabsContent>

        <TabsContent value="executions" className="mt-0">
          <WorkflowExecutionsList ruleId={selectedRule?.id} />
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      <WorkflowTestDialog
        rule={selectedRule}
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
      />
    </div>
  )
}
