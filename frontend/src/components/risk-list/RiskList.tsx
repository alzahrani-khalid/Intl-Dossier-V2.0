import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'
import { ConfirmRemoveButton } from '@/components/ui/confirm-remove-button'

export interface Risk {
  id?: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain'
  mitigation_strategy?: string
  owner?: string
  ai_confidence?: number
}

interface RiskListProps {
  risks: Risk[]
  onChange: (risks: Risk[]) => void
  readOnly?: boolean
}

const severities: Risk['severity'][] = ['low', 'medium', 'high', 'critical']
const likelihoods: Risk['likelihood'][] = ['unlikely', 'possible', 'likely', 'certain']

// 4-tier severity collapse onto 3 status tokens: high uses danger/80 opacity step
// to remain distinguishable from critical/danger while sharing the "alarm" family.
// (Same pattern as Wave-1 NotificationPreviewTimeline opacity-step palette.)
const severityColors = {
  low: 'bg-success hover:bg-success/80 text-success-foreground',
  medium: 'bg-warning hover:bg-warning/80 text-warning-foreground',
  high: 'bg-danger/80 hover:bg-danger/70 text-danger-foreground',
  critical: 'bg-danger hover:bg-danger/80 text-danger-foreground',
}

export function RiskList({ risks, onChange, readOnly = false }: RiskListProps) {
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const addRisk = () => {
    onChange([
      ...risks,
      {
        description: '',
        severity: 'medium',
        likelihood: 'possible',
      },
    ])
  }

  const removeRisk = (index: number) => {
    onChange(risks.filter((_, i) => i !== index))
  }

  const updateRisk = (index: number, field: keyof Risk, value: any) => {
    const updated = [...risks]
    updated[index] = { ...updated[index]!, [field]: value } as Risk
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="size-5" />
          {t('afterActions.risks.title')}
        </h3>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addRisk}>
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('afterActions.risks.add')}
          </Button>
        )}
      </div>

      {risks.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('afterActions.risks.empty')}</p>
      )}

      {risks.map((risk, index) => (
        <Card
          key={index}
          className={cn(
            'border-s-4',
            risk.severity === 'low' && 'border-s-success',
            risk.severity === 'medium' && 'border-s-warning',
            risk.severity === 'high' && 'border-s-danger/80',
            risk.severity === 'critical' && 'border-s-danger',
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {t('afterActions.risks.item', { number: index + 1 })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={severityColors[risk.severity]}>
                  {t(`afterActions.risks.severities.${risk.severity}`)}
                </Badge>
                {risk.ai_confidence !== undefined && (
                  <Badge
                    variant={
                      risk.ai_confidence >= 0.8
                        ? 'default'
                        : risk.ai_confidence >= 0.5
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {t('afterActions.confidence', { value: Math.round(risk.ai_confidence * 100) })}
                  </Badge>
                )}
                {!readOnly && (
                  <ConfirmRemoveButton
                    onConfirm={() => removeRisk(index)}
                    title={t('afterActions.risks.delete')}
                    description={t('afterActions.risks.deleteConfirm')}
                    confirmLabel={t('common.delete')}
                    cancelLabel={t('common.cancel')}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`risk-description-${index}`}>
                {t('afterActions.risks.description')} *
              </Label>
              <Textarea
                id={`risk-description-${index}`}
                value={risk.description}
                onChange={(e) => updateRisk(index, 'description', e.target.value)}
                placeholder={t('afterActions.risks.descriptionPlaceholder')}
                rows={2}
                maxLength={2000}
                disabled={readOnly}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`severity-${index}`}>{t('afterActions.risks.severity')} *</Label>
                <Select
                  value={risk.severity}
                  onValueChange={(value) => updateRisk(index, 'severity', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`severity-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severities.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        {t(`afterActions.risks.severities.${severity}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`likelihood-${index}`}>
                  {t('afterActions.risks.likelihood')} *
                </Label>
                <Select
                  value={risk.likelihood}
                  onValueChange={(value) => updateRisk(index, 'likelihood', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`likelihood-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {likelihoods.map((likelihood) => (
                      <SelectItem key={likelihood} value={likelihood}>
                        {t(`afterActions.risks.likelihoods.${likelihood}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor={`mitigation-${index}`}>
                {t('afterActions.risks.mitigationStrategy')}
              </Label>
              <Textarea
                id={`mitigation-${index}`}
                value={risk.mitigation_strategy || ''}
                onChange={(e) => updateRisk(index, 'mitigation_strategy', e.target.value)}
                placeholder={t('afterActions.risks.mitigationPlaceholder')}
                rows={2}
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor={`risk-owner-${index}`}>{t('afterActions.risks.owner')}</Label>
              <Input
                id={`risk-owner-${index}`}
                value={risk.owner || ''}
                onChange={(e) => updateRisk(index, 'owner', e.target.value)}
                placeholder={t('afterActions.risks.ownerPlaceholder')}
                maxLength={200}
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
