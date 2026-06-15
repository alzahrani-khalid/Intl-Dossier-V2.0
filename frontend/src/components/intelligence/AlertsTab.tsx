import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDirection } from '@/hooks/useDirection'
import {
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useUpdateAlertRule,
  type AlertRule,
} from '@/domains/signals/hooks/useAlertRules'
import { AlertRuleForm, type AlertRuleFormData } from './AlertRuleForm'
import { AlertRuleRow } from './AlertRuleRow'

interface AlertsTabProps {
  dossierId?: string
}

export function AlertsTab({ dossierId }: AlertsTabProps): React.ReactElement {
  const { t } = useTranslation('intelligence-alerts')
  const { isRTL } = useDirection()
  const { data: rules = [], isLoading, isError, refetch } = useAlertRules(dossierId)
  const createRule = useCreateAlertRule()
  const updateRule = useUpdateAlertRule()
  const deleteRule = useDeleteAlertRule()
  const [formOpen, setFormOpen] = useState(false)
  const [editRule, setEditRule] = useState<AlertRule | null>(null)

  const openCreate = (): void => {
    setEditRule(null)
    setFormOpen(true)
  }

  const openEdit = (rule: AlertRule): void => {
    setEditRule(rule)
    setFormOpen(true)
  }

  const handleSave = async (values: AlertRuleFormData): Promise<void> => {
    if (editRule) {
      await updateRule.mutateAsync({
        id: editRule.id,
        patch: {
          dossier_id: values.dossier_id,
          dossier_type: values.dossier_type,
          condition_config: values.condition_config,
          channels: values.channels,
          is_active: values.is_active,
        },
      })
      return
    }

    await createRule.mutateAsync({
      dossier_id: values.dossier_id,
      dossier_type: values.dossier_type,
      condition_type: values.condition_type,
      condition_config: values.condition_config,
      channels: values.channels,
      is_active: values.is_active,
    })
  }

  const handleToggle = (id: string, active: boolean): void => {
    updateRule.mutate({ id, patch: { is_active: active } })
  }

  const handleDelete = async (id: string): Promise<void> => {
    await deleteRule.mutateAsync(id)
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-start font-semibold text-ink [font-size:var(--t-page-title)]">
          {t('header')}
        </h2>
        <Button size="sm" className="ms-auto" onClick={openCreate}>
          <Plus className="h-4 w-4 me-2" aria-hidden="true" />
          {t('action.add')}
        </Button>
      </div>

      {isLoading && (
        <div className="rounded-sm border border-line bg-surface">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="animate-pulse border-b border-line ps-4 pe-4 pt-3 pb-3 last:border-0"
              style={{ minHeight: 'var(--row-h)' }}
            >
              <div className="h-5 w-2/3 rounded bg-line-soft" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <div
          className="rounded-sm border border-line bg-surface ps-4 pe-4 pt-4 pb-4 text-start"
          role="alert"
        >
          <p className="text-sm text-danger">{t('error.load')}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-accent-ink"
            onClick={() => void refetch()}
          >
            <RefreshCw className="h-4 w-4 me-2" aria-hidden="true" />
            {t('action.retry')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && rules.length === 0 && (
        <div className="rounded-sm border border-line bg-surface ps-4 pe-4 pt-8 pb-8 text-center">
          <p className="text-sm font-medium text-ink">{t('empty.heading')}</p>
          <p className="mt-1 text-sm text-ink-mute">{t('empty.body')}</p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 me-2" aria-hidden="true" />
            {t('action.add')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && rules.length > 0 && (
        <ul className="rounded-sm border border-line bg-surface">
          {rules.map((rule) => (
            <AlertRuleRow
              key={rule.id}
              rule={rule}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </ul>
      )}

      <AlertRuleForm
        isOpen={formOpen}
        initialValues={editRule}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
