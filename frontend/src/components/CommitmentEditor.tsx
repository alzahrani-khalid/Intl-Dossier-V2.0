import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Trash2, Plus, CalendarIcon, User, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Commitment {
  id?: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  owner_type: 'internal' | 'external';
  owner_user_id?: string;
  owner_contact_email?: string;
  owner_contact_name?: string;
  owner_contact_organization?: string;
  tracking_mode?: 'automatic' | 'manual';
  due_date: Date;
  ai_confidence?: number;
}

interface CommitmentEditorProps {
  commitments: Commitment[];
  onChange: (commitments: Commitment[]) => void;
  readOnly?: boolean;
  availableUsers?: Array<{ id: string; name: string }>;
}

const priorities: Commitment['priority'][] = ['low', 'medium', 'high', 'critical'];
const statuses: NonNullable<Commitment['status']>[] = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];

export function CommitmentEditor({
  commitments,
  onChange,
  readOnly = false,
  availableUsers = [],
}: CommitmentEditorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const addCommitment = () => {
    onChange([
      ...commitments,
      {
        description: '',
        priority: 'medium',
        status: 'pending',
        owner_type: 'internal',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    ]);
  };

  const removeCommitment = (index: number) => {
    onChange(commitments.filter((_, i) => i !== index));
  };

  const updateCommitment = (index: number, field: keyof Commitment, value: any) => {
    const updated = [...commitments];
    updated[index] = { ...updated[index], [field]: value };

    // Set tracking mode based on owner type
    if (field === 'owner_type') {
      updated[index].tracking_mode = value === 'internal' ? 'automatic' : 'manual';
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <h3 className="text-lg font-semibold">{t('afterActions.commitments.title')}</h3>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addCommitment}>
            <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('afterActions.commitments.add')}
          </Button>
        )}
      </div>

      {commitments.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('afterActions.commitments.empty')}</p>
      )}

      {commitments.map((commitment, index) => (
        <Card key={index}>
          <CardHeader>
            <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
              <CardTitle className="text-base">
                {t('afterActions.commitments.item', { number: index + 1 })}
              </CardTitle>
              <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                {commitment.tracking_mode && (
                  <Badge variant="outline">
                    {t(`afterActions.commitments.tracking.${commitment.tracking_mode}`)}
                  </Badge>
                )}
                {commitment.ai_confidence !== undefined && (
                  <Badge
                    variant={commitment.ai_confidence >= 0.8 ? 'default' : commitment.ai_confidence >= 0.5 ? 'secondary' : 'destructive'}
                  >
                    {t('afterActions.confidence', { value: Math.round(commitment.ai_confidence * 100) })}
                  </Badge>
                )}
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCommitment(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`commitment-description-${index}`}>
                {t('afterActions.commitments.description')} *
              </Label>
              <Textarea
                id={`commitment-description-${index}`}
                value={commitment.description}
                onChange={(e) => updateCommitment(index, 'description', e.target.value)}
                placeholder={t('afterActions.commitments.descriptionPlaceholder')}
                rows={2}
                maxLength={2000}
                disabled={readOnly}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
            </div>

            <div>
              <Label>{t('afterActions.commitments.ownerType')} *</Label>
              <RadioGroup
                value={commitment.owner_type}
                onValueChange={(value) => updateCommitment(index, 'owner_type', value as 'internal' | 'external')}
                disabled={readOnly}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="internal" id={`internal-${index}`} />
                  <Label htmlFor={`internal-${index}`} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('afterActions.commitments.internal')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external" id={`external-${index}`} />
                  <Label htmlFor={`external-${index}`} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('afterActions.commitments.external')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {commitment.owner_type === 'internal' ? (
              <div>
                <Label htmlFor={`owner-user-${index}`}>
                  {t('afterActions.commitments.assignedTo')} *
                </Label>
                <Select
                  value={commitment.owner_user_id}
                  onValueChange={(value) => updateCommitment(index, 'owner_user_id', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`owner-user-${index}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={t('afterActions.commitments.selectUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`contact-email-${index}`}>
                    {t('afterActions.commitments.contactEmail')} *
                  </Label>
                  <Input
                    id={`contact-email-${index}`}
                    type="email"
                    value={commitment.owner_contact_email || ''}
                    onChange={(e) => updateCommitment(index, 'owner_contact_email', e.target.value)}
                    placeholder={t('afterActions.commitments.emailPlaceholder')}
                    disabled={readOnly}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`contact-name-${index}`}>
                    {t('afterActions.commitments.contactName')} *
                  </Label>
                  <Input
                    id={`contact-name-${index}`}
                    value={commitment.owner_contact_name || ''}
                    onChange={(e) => updateCommitment(index, 'owner_contact_name', e.target.value)}
                    placeholder={t('afterActions.commitments.namePlaceholder')}
                    maxLength={200}
                    disabled={readOnly}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`contact-org-${index}`}>
                    {t('afterActions.commitments.organization')}
                  </Label>
                  <Input
                    id={`contact-org-${index}`}
                    value={commitment.owner_contact_organization || ''}
                    onChange={(e) => updateCommitment(index, 'owner_contact_organization', e.target.value)}
                    placeholder={t('afterActions.commitments.orgPlaceholder')}
                    maxLength={200}
                    disabled={readOnly}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`priority-${index}`}>{t('afterActions.commitments.priority')} *</Label>
                <Select
                  value={commitment.priority}
                  onValueChange={(value) => updateCommitment(index, 'priority', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`priority-${index}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {t(`afterActions.commitments.priorities.${priority}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {commitment.status && (
                <div>
                  <Label htmlFor={`status-${index}`}>{t('afterActions.commitments.status')}</Label>
                  <Select
                    value={commitment.status}
                    onValueChange={(value) => updateCommitment(index, 'status', value)}
                    disabled={readOnly || (commitment.owner_type === 'internal' && commitment.tracking_mode === 'automatic')}
                  >
                    <SelectTrigger id={`status-${index}`} dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`afterActions.commitments.statuses.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>{t('afterActions.commitments.dueDate')} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-start font-normal',
                        !commitment.due_date && 'text-muted-foreground',
                        isRTL && 'justify-end text-end'
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className={cn('h-4 w-4 opacity-50', isRTL ? 'ms-2' : 'me-2')} />
                      {commitment.due_date
                        ? format(commitment.due_date, 'PPP')
                        : t('common.selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={commitment.due_date}
                      onSelect={(date) => date && updateCommitment(index, 'due_date', date)}
                      disabled={(date) => date < new Date()}
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
