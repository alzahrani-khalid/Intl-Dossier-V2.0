import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Trash2, Plus, CalendarIcon, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface FollowUpAction {
  id?: string;
  description: string;
  assigned_to?: string;
  target_date?: Date;
  completed: boolean;
}

interface FollowUpListProps {
  followUpActions: FollowUpAction[];
  onChange: (followUpActions: FollowUpAction[]) => void;
  readOnly?: boolean;
}

export function FollowUpList({ followUpActions, onChange, readOnly = false }: FollowUpListProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const addFollowUp = () => {
    onChange([
      ...followUpActions,
      {
        description: '',
        completed: false,
      },
    ]);
  };

  const removeFollowUp = (index: number) => {
    onChange(followUpActions.filter((_, i) => i !== index));
  };

  const updateFollowUp = (index: number, field: keyof FollowUpAction, value: any) => {
    const updated = [...followUpActions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <ListTodo className="size-5" />
          {t('afterActions.followUps.title')}
        </h3>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addFollowUp}>
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('afterActions.followUps.add')}
          </Button>
        )}
      </div>

      {followUpActions.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('afterActions.followUps.empty')}</p>
      )}

      {followUpActions.map((action, index) => (
        <Card key={index} className={cn(action.completed && 'opacity-60')}>
          <CardHeader>
            <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
              <CardTitle className="flex items-center gap-2 text-base">
                <Checkbox
                  checked={action.completed}
                  onCheckedChange={(checked) => updateFollowUp(index, 'completed', checked)}
                  disabled={readOnly}
                />
                {t('afterActions.followUps.item', { number: index + 1 })}
              </CardTitle>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFollowUp(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`followup-description-${index}`}>
                {t('afterActions.followUps.description')} *
              </Label>
              <Textarea
                id={`followup-description-${index}`}
                value={action.description}
                onChange={(e) => updateFollowUp(index, 'description', e.target.value)}
                placeholder={t('afterActions.followUps.descriptionPlaceholder')}
                rows={2}
                maxLength={2000}
                disabled={readOnly}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
                className={cn(action.completed && 'line-through')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`followup-assigned-${index}`}>
                  {t('afterActions.followUps.assignedTo')}
                  <span className="ms-1 text-xs text-muted-foreground">
                    {t('common.optional')}
                  </span>
                </Label>
                <Input
                  id={`followup-assigned-${index}`}
                  value={action.assigned_to || ''}
                  onChange={(e) => updateFollowUp(index, 'assigned_to', e.target.value)}
                  placeholder={t('afterActions.followUps.assignedPlaceholder')}
                  maxLength={200}
                  disabled={readOnly}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <Label>
                  {t('afterActions.followUps.targetDate')}
                  <span className="ms-1 text-xs text-muted-foreground">
                    {t('common.optional')}
                  </span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-start font-normal',
                        !action.target_date && 'text-muted-foreground',
                        isRTL && 'justify-end text-end'
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className={cn('h-4 w-4 opacity-50', isRTL ? 'ms-2' : 'me-2')} />
                      {action.target_date
                        ? format(action.target_date, 'PPP')
                        : t('afterActions.followUps.selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={action.target_date}
                      onSelect={(date) => updateFollowUp(index, 'target_date', date || undefined)}
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
