import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Trash2, Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Decision {
  id?: string;
  description: string;
  rationale?: string;
  decision_maker: string;
  decision_date: Date;
  ai_confidence?: number;
}

interface DecisionListProps {
  decisions: Decision[];
  onChange: (decisions: Decision[]) => void;
  readOnly?: boolean;
}

export function DecisionList({ decisions, onChange, readOnly = false }: DecisionListProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const addDecision = () => {
    onChange([
      ...decisions,
      {
        description: '',
        decision_maker: '',
        decision_date: new Date(),
      },
    ]);
  };

  const removeDecision = (index: number) => {
    onChange(decisions.filter((_, i) => i !== index));
  };

  const updateDecision = (index: number, field: keyof Decision, value: any) => {
    const updated = [...decisions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <h3 className="text-lg font-semibold">{t('afterActions.decisions.title')}</h3>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addDecision}>
            <Plus className="me-2 size-4" />
            {t('afterActions.decisions.add')}
          </Button>
        )}
      </div>

      {decisions.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('afterActions.decisions.empty')}</p>
      )}

      {decisions.map((decision, index) => (
        <Card key={index}>
          <CardHeader>
            <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
              <CardTitle className="text-base">
                {t('afterActions.decisions.item', { number: index + 1 })}
              </CardTitle>
              <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                {decision.ai_confidence !== undefined && (
                  <Badge
                    variant={decision.ai_confidence >= 0.8 ? 'default' : decision.ai_confidence >= 0.5 ? 'secondary' : 'destructive'}
                  >
                    {t('afterActions.confidence', { value: Math.round(decision.ai_confidence * 100) })}
                  </Badge>
                )}
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDecision(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`decision-description-${index}`}>
                {t('afterActions.decisions.description')} *
              </Label>
              <Textarea
                id={`decision-description-${index}`}
                value={decision.description}
                onChange={(e) => updateDecision(index, 'description', e.target.value)}
                placeholder={t('afterActions.decisions.descriptionPlaceholder')}
                rows={3}
                maxLength={2000}
                disabled={readOnly}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {decision.description.length}/2000
              </p>
            </div>

            <div>
              <Label htmlFor={`decision-rationale-${index}`}>
                {t('afterActions.decisions.rationale')}
              </Label>
              <Textarea
                id={`decision-rationale-${index}`}
                value={decision.rationale || ''}
                onChange={(e) => updateDecision(index, 'rationale', e.target.value)}
                placeholder={t('afterActions.decisions.rationalePlaceholder')}
                rows={2}
                disabled={readOnly}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`decision-maker-${index}`}>
                  {t('afterActions.decisions.decisionMaker')} *
                </Label>
                <Input
                  id={`decision-maker-${index}`}
                  value={decision.decision_maker}
                  onChange={(e) => updateDecision(index, 'decision_maker', e.target.value)}
                  placeholder={t('afterActions.decisions.decisionMakerPlaceholder')}
                  maxLength={200}
                  disabled={readOnly}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  required
                />
              </div>

              <div>
                <Label>{t('afterActions.decisions.decisionDate')} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-start font-normal',
                        !decision.decision_date && 'text-muted-foreground'
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className="me-2 size-4 opacity-50" />
                      {decision.decision_date
                        ? format(decision.decision_date, 'PPP')
                        : t('common.selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={decision.decision_date}
                      onSelect={(date) => date && updateDecision(index, 'decision_date', date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
