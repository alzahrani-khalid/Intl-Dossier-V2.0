import {
  Bell,
  Building2,
  CalendarDays,
  FileText,
  Globe,
  Mail,
  Target,
  Trash2,
  Users,
  Webhook,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDirection } from '@/hooks/useDirection'
import type { AlertChannel, AlertRule } from '@/domains/signals/hooks/useAlertRules'

const DOSSIER_ICONS: Record<string, typeof Globe> = {
  country: Globe,
  organization: Building2,
  forum: Users,
  engagement: CalendarDays,
  topic: Target,
  working_group: Users,
  person: FileText,
}

const CHANNEL_ICONS: Record<AlertChannel, typeof Bell> = {
  in_app: Bell,
  smtp: Mail,
  webhook: Webhook,
}

function dossierName(rule: AlertRule, isRTL: boolean, fallback: string): string {
  const localized = isRTL ? rule.dossier_name_ar : rule.dossier_name_en
  return localized ?? rule.dossier_name_en ?? rule.dossier_name_ar ?? fallback
}

function DossierGlyph({ type }: { type: string }): React.ReactElement {
  const Icon = DOSSIER_ICONS[type] ?? FileText
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink-mute">
      <Icon className="h-3 w-3" aria-hidden="true" />
    </span>
  )
}

interface AlertRuleRowProps {
  rule: AlertRule
  onEdit: (rule: AlertRule) => void
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

export function AlertRuleRow({
  rule,
  onEdit,
  onToggle,
  onDelete,
}: AlertRuleRowProps): React.ReactElement {
  const { t } = useTranslation('intelligence-alerts')
  const { isRTL } = useDirection()
  const severities = rule.condition_config.severity_filter ?? []
  const deleteLabel = t('action.delete')

  return (
    <li
      className="flex flex-wrap items-center gap-3 border-b border-line ps-4 pe-4 pt-2 pb-2 transition-colors duration-[var(--dur-fast)] ease-out last:border-0 hover:bg-line-soft"
      style={{ minHeight: 'var(--row-h)' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-start focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        onClick={() => onEdit(rule)}
      >
        <DossierGlyph type={rule.dossier_type} />
        <bdi
          className={[
            'min-w-0 truncate [font-size:var(--t-body)] font-semibold',
            rule.is_active ? 'text-ink' : 'text-ink-faint',
          ].join(' ')}
        >
          {dossierName(rule, isRTL, t('rule.untitledDossier'))}
        </bdi>
      </button>

      <span className="rounded-full bg-[var(--info-soft)] ps-2 pe-2 pt-0.5 pb-0.5 font-mono text-xs uppercase text-[var(--info)]">
        {t('chip.newSignal')}
      </span>

      {severities.length > 0 && (
        <span className="rounded-full bg-[var(--danger-soft)] ps-2 pe-2 pt-0.5 pb-0.5 font-mono text-xs uppercase text-danger">
          {severities.map((severity) => t(`chip.${severity}`)).join(' / ')}
        </span>
      )}

      <div className="flex items-center gap-1 text-ink-mute" aria-label={t('form.channels')}>
        {rule.channels.map((channel) => {
          const Icon = CHANNEL_ICONS[channel] ?? Bell
          return <Icon key={channel} className="h-4 w-4" aria-label={t(`channel.${channel}`)} />
        })}
      </div>

      <div className="flex items-center gap-2">
        <span className="[font-size:var(--t-meta)] text-ink-mute">
          {rule.is_active ? t('toggle.active') : t('toggle.inactive')}
        </span>
        <Switch
          checked={rule.is_active}
          onCheckedChange={(checked) => onToggle(rule.id, checked)}
          aria-label={t('form.active')}
        />
      </div>

      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={deleteLabel}
                className="text-ink-faint"
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{deleteLabel}</TooltipContent>
        </Tooltip>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">
              {t('confirm.delete.heading')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start">
              {t('confirm.delete.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(rule.id)}
              className="bg-danger text-[var(--danger-fg)] hover:bg-danger"
            >
              {t('confirm.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
