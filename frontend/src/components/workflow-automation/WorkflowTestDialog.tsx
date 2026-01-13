/**
 * WorkflowTestDialog Component
 * Dialog for testing workflow rules
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, PlayCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTestWorkflowRule } from '@/hooks/useWorkflowAutomation'
import type { WorkflowRule, WorkflowTestResponse } from '@/types/workflow-automation.types'
import { getActionTypeOption } from './workflow-config'

interface WorkflowTestDialogProps {
  rule: WorkflowRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkflowTestDialog({ rule, open, onOpenChange }: WorkflowTestDialogProps) {
  const { t, i18n } = useTranslation('workflow-automation')
  const isRTL = i18n.language === 'ar'

  const [entityId, setEntityId] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [testResult, setTestResult] = useState<WorkflowTestResponse['data'] | null>(null)

  const testMutation = useTestWorkflowRule()

  const handleTest = () => {
    if (!rule) return

    testMutation.mutate(
      {
        rule_id: rule.id,
        entity_id: entityId || undefined,
        dry_run: dryRun,
      },
      {
        onSuccess: (response) => {
          setTestResult(response.data)
        },
      },
    )
  }

  const handleClose = () => {
    setEntityId('')
    setTestResult(null)
    onOpenChange(false)
  }

  if (!rule) return null

  const ruleName = isRTL ? rule.name_ar : rule.name_en

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('test.title')}</DialogTitle>
          <DialogDescription>{ruleName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entity_id">{t('test.selectEntity')}</Label>
              <Input
                id="entity_id"
                placeholder="UUID (optional)"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dry_run">{t('test.dryRun')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('test.dryRunDescription', {
                    defaultValue: "If enabled, actions won't actually execute",
                  })}
                </p>
              </div>
              <Switch id="dry_run" checked={dryRun} onCheckedChange={setDryRun} />
            </div>

            <Button onClick={handleTest} disabled={testMutation.isPending} className="w-full">
              {testMutation.isPending ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
              ) : (
                <PlayCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
              )}
              {t('test.runTest')}
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.conditions_matched ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {t('test.results')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Would Execute */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('test.wouldExecute')}</span>
                  <Badge variant={testResult.would_execute ? 'default' : 'secondary'}>
                    {testResult.would_execute ? t('messages.testPassed') : t('messages.testFailed')}
                  </Badge>
                </div>

                {/* Conditions Result */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t('test.conditionsResult')}</h4>
                  <div className="space-y-2">
                    {testResult.conditions_details.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {detail.matched ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-mono">{detail.field}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{detail.reason}</span>
                      </div>
                    ))}
                    {testResult.conditions_details.length === 0 && (
                      <p className="text-sm text-muted-foreground">{t('builder.noConditions')}</p>
                    )}
                  </div>
                </div>

                {/* Actions to Execute */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t('test.actionsToExecute')}</h4>
                  <div className="space-y-2">
                    {testResult.actions_to_execute.map((action, index) => {
                      const actionOption = getActionTypeOption(action.type)
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span>{isRTL ? actionOption?.label_ar : actionOption?.label_en}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {testMutation.isError && (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">
                {testMutation.error instanceof Error ? testMutation.error.message : 'Test failed'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
