/**
 * AddMilestoneDialog Component
 *
 * Dialog for creating and editing planned milestones.
 * Mobile-first responsive design with RTL support.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  FileText,
  RefreshCw,
  FileCheck,
  ArrowRight,
  RotateCcw,
  Flag,
  Bell,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  PlannedMilestone,
  MilestoneType,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  ReminderConfig,
  ReminderFrequency,
  ReminderChannel,
} from '@/types/milestone-planning.types'
import type { TimelinePriority } from '@/types/timeline.types'

interface AddMilestoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dossierType: PlannedMilestone['dossier_type']
  dossierId: string
  editMilestone?: PlannedMilestone | null
  onSubmit: (data: CreateMilestoneRequest | UpdateMilestoneRequest) => Promise<void>
  isSubmitting?: boolean
}

// Icon mapping for milestone types
const typeIcons: Record<MilestoneType, typeof Users> = {
  engagement: Users,
  policy_deadline: FileText,
  relationship_review: RefreshCw,
  document_due: FileCheck,
  follow_up: ArrowRight,
  renewal: RotateCcw,
  custom: Flag,
}

const milestoneTypes: MilestoneType[] = [
  'engagement',
  'policy_deadline',
  'relationship_review',
  'document_due',
  'follow_up',
  'renewal',
  'custom',
]

const priorities: TimelinePriority[] = ['high', 'medium', 'low']

const frequencies: ReminderFrequency[] = ['once', 'daily', 'weekly']

const channels: ReminderChannel[] = ['in_app', 'email', 'push']

interface FormData {
  milestone_type: MilestoneType
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  target_date: string
  target_time: string
  end_date: string
  priority: TimelinePriority
  notes_en: string
  notes_ar: string
  expected_outcome_en: string
  expected_outcome_ar: string
  reminders: ReminderConfig[]
}

const initialFormData: FormData = {
  milestone_type: 'engagement',
  title_en: '',
  title_ar: '',
  description_en: '',
  description_ar: '',
  target_date: '',
  target_time: '',
  end_date: '',
  priority: 'medium',
  notes_en: '',
  notes_ar: '',
  expected_outcome_en: '',
  expected_outcome_ar: '',
  reminders: [],
}

export function AddMilestoneDialog({
  open,
  onOpenChange,
  dossierType,
  dossierId,
  editMilestone,
  onSubmit,
  isSubmitting = false,
}: AddMilestoneDialogProps) {
  const { t, i18n } = useTranslation('milestone-planning')
  const isRTL = i18n.language === 'ar'

  const [formData, setFormData] = useState<FormData>(initialFormData)

  // Reset or populate form when dialog opens or editMilestone changes
  useEffect(() => {
    if (open) {
      if (editMilestone) {
        setFormData({
          milestone_type: editMilestone.milestone_type,
          title_en: editMilestone.title_en,
          title_ar: editMilestone.title_ar,
          description_en: editMilestone.description_en || '',
          description_ar: editMilestone.description_ar || '',
          target_date: editMilestone.target_date,
          target_time: editMilestone.target_time || '',
          end_date: editMilestone.end_date || '',
          priority: editMilestone.priority,
          notes_en: editMilestone.notes_en || '',
          notes_ar: editMilestone.notes_ar || '',
          expected_outcome_en: editMilestone.expected_outcome_en || '',
          expected_outcome_ar: editMilestone.expected_outcome_ar || '',
          reminders: editMilestone.reminders || [],
        })
      } else {
        // Set default target date to tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setFormData({
          ...initialFormData,
          target_date: tomorrow.toISOString().split('T')[0],
        })
      }
    }
  }, [open, editMilestone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editMilestone) {
      const updateData: UpdateMilestoneRequest = {
        title_en: formData.title_en,
        title_ar: formData.title_ar,
        description_en: formData.description_en || undefined,
        description_ar: formData.description_ar || undefined,
        target_date: formData.target_date,
        target_time: formData.target_time || undefined,
        end_date: formData.end_date || undefined,
        priority: formData.priority,
        notes_en: formData.notes_en || undefined,
        notes_ar: formData.notes_ar || undefined,
        expected_outcome_en: formData.expected_outcome_en || undefined,
        expected_outcome_ar: formData.expected_outcome_ar || undefined,
        reminders: formData.reminders,
      }
      await onSubmit(updateData)
    } else {
      const createData: CreateMilestoneRequest = {
        dossier_id: dossierId,
        dossier_type: dossierType,
        milestone_type: formData.milestone_type,
        title_en: formData.title_en,
        title_ar: formData.title_ar,
        description_en: formData.description_en || undefined,
        description_ar: formData.description_ar || undefined,
        target_date: formData.target_date,
        target_time: formData.target_time || undefined,
        end_date: formData.end_date || undefined,
        priority: formData.priority,
        notes_en: formData.notes_en || undefined,
        notes_ar: formData.notes_ar || undefined,
        expected_outcome_en: formData.expected_outcome_en || undefined,
        expected_outcome_ar: formData.expected_outcome_ar || undefined,
        reminders: formData.reminders.map(
          ({ id, last_sent_at, next_reminder_at, ...rest }) => rest,
        ),
      }
      await onSubmit(createData)
    }

    onOpenChange(false)
  }

  const addReminder = () => {
    const newReminder: ReminderConfig = {
      id: crypto.randomUUID(),
      enabled: true,
      remind_before_days: 7,
      frequency: 'once',
      channels: ['in_app'],
    }
    setFormData({
      ...formData,
      reminders: [...formData.reminders, newReminder],
    })
  }

  const updateReminder = (index: number, updates: Partial<ReminderConfig>) => {
    const newReminders = [...formData.reminders]
    newReminders[index] = { ...newReminders[index], ...updates }
    setFormData({ ...formData, reminders: newReminders })
  }

  const removeReminder = (index: number) => {
    const newReminders = formData.reminders.filter((_, i) => i !== index)
    setFormData({ ...formData, reminders: newReminders })
  }

  const toggleReminderChannel = (reminderIndex: number, channel: ReminderChannel) => {
    const reminder = formData.reminders[reminderIndex]
    const hasChannel = reminder.channels.includes(channel)
    const newChannels = hasChannel
      ? reminder.channels.filter((c) => c !== channel)
      : [...reminder.channels, channel]
    updateReminder(reminderIndex, { channels: newChannels })
  }

  const TypeIcon = typeIcons[formData.milestone_type]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-lg sm:max-w-xl overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5" />
            {editMilestone ? t('form.editMilestone') : t('form.addMilestone')}
          </DialogTitle>
          <DialogDescription>
            {editMilestone
              ? t('form.editMilestoneDescription', 'Update the milestone details below.')
              : t('emptyState.hint')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Milestone Type */}
          {!editMilestone && (
            <div className="space-y-2">
              <Label htmlFor="milestone_type">
                {t('form.milestoneType')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.milestone_type}
                onValueChange={(value: MilestoneType) =>
                  setFormData({ ...formData, milestone_type: value })
                }
              >
                <SelectTrigger id="milestone_type">
                  <SelectValue placeholder={t('form.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {milestoneTypes.map((type) => {
                    const Icon = typeIcons[type]
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {t(`types.${type}`)}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t(`typeDescriptions.${formData.milestone_type}`)}
              </p>
            </div>
          )}

          {/* Title English */}
          <div className="space-y-2">
            <Label htmlFor="title_en">
              {t('form.titleEn')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title_en"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              placeholder={t('form.titleEnPlaceholder')}
              maxLength={200}
              required
            />
          </div>

          {/* Title Arabic */}
          <div className="space-y-2">
            <Label htmlFor="title_ar">
              {t('form.titleAr')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title_ar"
              dir="rtl"
              value={formData.title_ar}
              onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
              placeholder={t('form.titleArPlaceholder')}
              maxLength={200}
              required
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_date">
                {t('form.targetDate')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_time">{t('form.targetTime')}</Label>
              <Input
                id="target_time"
                type="time"
                value={formData.target_time}
                onChange={(e) => setFormData({ ...formData, target_time: e.target.value })}
              />
            </div>
          </div>

          {/* End Date (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="end_date">{t('form.endDate')}</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              min={formData.target_date}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">
              {t('form.priority')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value: TimelinePriority) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder={t('form.selectPriority')} />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(`priority.${priority}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description_en">{t('form.descriptionEn')}</Label>
            <Textarea
              id="description_en"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              placeholder={t('form.descriptionEnPlaceholder')}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_ar">{t('form.descriptionAr')}</Label>
            <Textarea
              id="description_ar"
              dir="rtl"
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              placeholder={t('form.descriptionArPlaceholder')}
              rows={2}
            />
          </div>

          {/* Expected Outcome */}
          <div className="space-y-2">
            <Label htmlFor="expected_outcome_en">{t('form.expectedOutcomeEn')}</Label>
            <Textarea
              id="expected_outcome_en"
              value={formData.expected_outcome_en}
              onChange={(e) => setFormData({ ...formData, expected_outcome_en: e.target.value })}
              placeholder={t('form.expectedOutcomePlaceholder')}
              rows={2}
            />
          </div>

          <Separator />

          {/* Reminders Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t('reminders.title')}
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addReminder}>
                <Plus className={cn('h-4 w-4', isRTL ? 'ms-1' : 'me-1')} />
                {t('reminders.addReminder')}
              </Button>
            </div>

            {formData.reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t(
                  'reminders.noReminders',
                  'No reminders set. Add a reminder to get notified before the milestone.',
                )}
              </p>
            ) : (
              <div className="space-y-4">
                {formData.reminders.map((reminder, index) => (
                  <div
                    key={reminder.id}
                    className="p-3 sm:p-4 border rounded-lg space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.enabled}
                          onCheckedChange={(checked) => updateReminder(index, { enabled: checked })}
                        />
                        <span className="text-sm">
                          {reminder.enabled ? t('reminders.enabled') : t('reminders.disabled')}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeReminder(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('reminders.daysBefore')}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={90}
                          value={reminder.remind_before_days}
                          onChange={(e) =>
                            updateReminder(index, {
                              remind_before_days: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('reminders.frequency')}</Label>
                        <Select
                          value={reminder.frequency}
                          onValueChange={(value: ReminderFrequency) =>
                            updateReminder(index, { frequency: value })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencies.map((freq) => (
                              <SelectItem key={freq} value={freq}>
                                {t(`reminders.frequencyOptions.${freq}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{t('reminders.channels')}</Label>
                      <div className="flex flex-wrap gap-2">
                        {channels.map((channel) => (
                          <Button
                            key={channel}
                            type="button"
                            variant={reminder.channels.includes(channel) ? 'default' : 'outline'}
                            size="sm"
                            className="h-8"
                            onClick={() => toggleReminderChannel(index, channel)}
                          >
                            {t(`reminders.channelOptions.${channel}`)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {t('form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t('common:saving', 'Saving...') : t('form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
