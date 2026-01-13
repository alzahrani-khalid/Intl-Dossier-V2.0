/**
 * WorkflowAutomationPage
 * Main page for workflow automation management
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'

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
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <WorkflowBuilder rule={selectedRule} onSave={handleSave} onCancel={handleCancel} />
      </div>
    )
  }

  // Render list view with tabs
  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <TabsList>
            <TabsTrigger value="rules">{t('navigation.rules')}</TabsTrigger>
            <TabsTrigger value="executions">{t('navigation.executions')}</TabsTrigger>
          </TabsList>
        </div>

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
