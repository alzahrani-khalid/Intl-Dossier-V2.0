/**
 * StakeholderInteractionDialog Component
 *
 * Dialog for creating new stakeholder interactions:
 * - Interaction type selection
 * - Bilingual title and content
 * - Date, time, and duration
 * - Participants management
 * - Sentiment and direction
 * - Mobile-first responsive design
 * - RTL support
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mail,
  Users,
  Phone,
  FileText,
  MessageSquare,
  MessageCircle,
  MapPin,
  Video,
  Presentation,
  Handshake,
  Activity,
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
import type {
  CreateInteractionRequest,
  StakeholderInteractionType,
  InteractionDirection,
  InteractionSentiment,
  InteractionPriority,
} from '@/types/stakeholder-interaction.types'

interface StakeholderInteractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateInteractionRequest) => void
  stakeholderType: string
  stakeholderId: string
  isLoading?: boolean
}

// Interaction type icons
const interactionTypeIcons: Record<string, React.ElementType> = {
  email: Mail,
  meeting: Users,
  phone_call: Phone,
  document_exchange: FileText,
  comment: MessageSquare,
  message: MessageCircle,
  visit: MapPin,
  conference: Video,
  workshop: Presentation,
  negotiation: Handshake,
  other: Activity,
}

export function StakeholderInteractionDialog({
  open,
  onOpenChange,
  onSubmit,
  stakeholderType,
  stakeholderId,
  isLoading = false,
}: StakeholderInteractionDialogProps) {
  const { t, i18n } = useTranslation('stakeholder-interactions')
  const isRTL = i18n.language === 'ar'

  // Form state
  const [interactionType, setInteractionType] = useState<StakeholderInteractionType>('meeting')
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [summaryEn, setSummaryEn] = useState('')
  const [summaryAr, setSummaryAr] = useState('')
  const [contentEn, setContentEn] = useState('')
  const [contentAr, setContentAr] = useState('')
  const [interactionDate, setInteractionDate] = useState(new Date().toISOString().split('T')[0])
  const [interactionTime, setInteractionTime] = useState(new Date().toTimeString().slice(0, 5))
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>()
  const [locationEn, setLocationEn] = useState('')
  const [locationAr, setLocationAr] = useState('')
  const [isVirtual, setIsVirtual] = useState(false)
  const [virtualLink, setVirtualLink] = useState('')
  const [direction, setDirection] = useState<InteractionDirection>('bidirectional')
  const [sentiment, setSentiment] = useState<InteractionSentiment>('neutral')
  const [priority, setPriority] = useState<InteractionPriority>('medium')
  const [requiresFollowup, setRequiresFollowup] = useState(false)
  const [followupDate, setFollowupDate] = useState('')
  const [outcomeEn, setOutcomeEn] = useState('')
  const [outcomeAr, setOutcomeAr] = useState('')
  const [impactScore, setImpactScore] = useState<number | undefined>()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setInteractionType('meeting')
      setTitleEn('')
      setTitleAr('')
      setSummaryEn('')
      setSummaryAr('')
      setContentEn('')
      setContentAr('')
      setInteractionDate(new Date().toISOString().split('T')[0])
      setInteractionTime(new Date().toTimeString().slice(0, 5))
      setDurationMinutes(undefined)
      setLocationEn('')
      setLocationAr('')
      setIsVirtual(false)
      setVirtualLink('')
      setDirection('bidirectional')
      setSentiment('neutral')
      setPriority('medium')
      setRequiresFollowup(false)
      setFollowupDate('')
      setOutcomeEn('')
      setOutcomeAr('')
      setImpactScore(undefined)
    }
  }, [open])

  const handleSubmit = () => {
    if (!titleEn.trim()) return

    const dateTime = `${interactionDate}T${interactionTime}:00`

    onSubmit({
      stakeholder_type: stakeholderType,
      stakeholder_id: stakeholderId,
      interaction_type: interactionType,
      title_en: titleEn,
      title_ar: titleAr || undefined,
      summary_en: summaryEn || undefined,
      summary_ar: summaryAr || undefined,
      content_en: contentEn || undefined,
      content_ar: contentAr || undefined,
      interaction_date: dateTime,
      duration_minutes: durationMinutes,
      location_en: locationEn || undefined,
      location_ar: locationAr || undefined,
      is_virtual: isVirtual,
      virtual_link: isVirtual ? virtualLink : undefined,
      direction,
      sentiment,
      priority,
      requires_followup: requiresFollowup,
      followup_date: requiresFollowup ? followupDate : undefined,
      outcome_en: outcomeEn || undefined,
      outcome_ar: outcomeAr || undefined,
      impact_score: impactScore,
    })
  }

  const interactionTypes: StakeholderInteractionType[] = [
    'email',
    'meeting',
    'phone_call',
    'document_exchange',
    'comment',
    'message',
    'visit',
    'conference',
    'workshop',
    'negotiation',
    'other',
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-start">{t('dialog.create_title')}</DialogTitle>
          <DialogDescription className="text-start">
            {t('dialog.create_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Interaction Type Selection */}
          <div className="space-y-3">
            <Label className="text-start block font-medium">{t('dialog.interaction_type')}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {interactionTypes.map((type) => {
                const Icon = interactionTypeIcons[type] || Activity
                return (
                  <Button
                    key={type}
                    type="button"
                    variant={interactionType === type ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-1 h-auto py-3 min-h-16"
                    onClick={() => setInteractionType(type)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{t(`types.${type}`)}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title-en" className="text-start block">
                {t('dialog.title_en')}
                <span className="text-destructive ms-1">*</span>
              </Label>
              <Input
                id="title-en"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder={t('dialog.title_en_placeholder')}
                className="min-h-11 sm:min-h-10"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-ar" className="text-start block">
                {t('dialog.title_ar')}
              </Label>
              <Input
                id="title-ar"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={t('dialog.title_ar_placeholder')}
                className="min-h-11 sm:min-h-10"
                dir="rtl"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="summary-en" className="text-start block">
                {t('dialog.summary_en')}
              </Label>
              <Textarea
                id="summary-en"
                value={summaryEn}
                onChange={(e) => setSummaryEn(e.target.value)}
                placeholder={t('dialog.summary_en_placeholder')}
                className="min-h-20 resize-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary-ar" className="text-start block">
                {t('dialog.summary_ar')}
              </Label>
              <Textarea
                id="summary-ar"
                value={summaryAr}
                onChange={(e) => setSummaryAr(e.target.value)}
                placeholder={t('dialog.summary_ar_placeholder')}
                className="min-h-20 resize-none"
                dir="rtl"
              />
            </div>
          </div>

          <Separator />

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-start block">
                {t('dialog.date')}
              </Label>
              <Input
                id="date"
                type="date"
                value={interactionDate}
                onChange={(e) => setInteractionDate(e.target.value)}
                className="min-h-11 sm:min-h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-start block">
                {t('dialog.time')}
              </Label>
              <Input
                id="time"
                type="time"
                value={interactionTime}
                onChange={(e) => setInteractionTime(e.target.value)}
                className="min-h-11 sm:min-h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-start block">
                {t('dialog.duration')}
              </Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={durationMinutes || ''}
                onChange={(e) =>
                  setDurationMinutes(e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder={t('dialog.duration_placeholder')}
                className="min-h-11 sm:min-h-10"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-start">{t('dialog.is_virtual')}</Label>
              <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
            </div>

            {isVirtual ? (
              <div className="space-y-2">
                <Label htmlFor="virtual-link" className="text-start block">
                  {t('dialog.virtual_link')}
                </Label>
                <Input
                  id="virtual-link"
                  type="url"
                  value={virtualLink}
                  onChange={(e) => setVirtualLink(e.target.value)}
                  placeholder={t('dialog.virtual_link_placeholder')}
                  className="min-h-11 sm:min-h-10"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location-en" className="text-start block">
                    {t('dialog.location_en')}
                  </Label>
                  <Input
                    id="location-en"
                    value={locationEn}
                    onChange={(e) => setLocationEn(e.target.value)}
                    placeholder={t('dialog.location_en_placeholder')}
                    className="min-h-11 sm:min-h-10"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-ar" className="text-start block">
                    {t('dialog.location_ar')}
                  </Label>
                  <Input
                    id="location-ar"
                    value={locationAr}
                    onChange={(e) => setLocationAr(e.target.value)}
                    placeholder={t('dialog.location_ar_placeholder')}
                    className="min-h-11 sm:min-h-10"
                    dir="rtl"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Direction, Sentiment, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-start block">{t('dialog.direction')}</Label>
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as InteractionDirection)}
              >
                <SelectTrigger className="min-h-11 sm:min-h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">{t('direction.inbound')}</SelectItem>
                  <SelectItem value="outbound">{t('direction.outbound')}</SelectItem>
                  <SelectItem value="bidirectional">{t('direction.bidirectional')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-start block">{t('dialog.sentiment')}</Label>
              <Select
                value={sentiment}
                onValueChange={(v) => setSentiment(v as InteractionSentiment)}
              >
                <SelectTrigger className="min-h-11 sm:min-h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">{t('sentiment.positive')}</SelectItem>
                  <SelectItem value="neutral">{t('sentiment.neutral')}</SelectItem>
                  <SelectItem value="negative">{t('sentiment.negative')}</SelectItem>
                  <SelectItem value="mixed">{t('sentiment.mixed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-start block">{t('dialog.priority')}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as InteractionPriority)}>
                <SelectTrigger className="min-h-11 sm:min-h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('priority.high')}</SelectItem>
                  <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Follow-up */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-start">{t('dialog.requires_followup')}</Label>
              <Switch checked={requiresFollowup} onCheckedChange={setRequiresFollowup} />
            </div>

            {requiresFollowup && (
              <div className="space-y-2">
                <Label htmlFor="followup-date" className="text-start block">
                  {t('dialog.followup_date')}
                </Label>
                <Input
                  id="followup-date"
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="min-h-11 sm:min-h-10"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Outcome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outcome-en" className="text-start block">
                {t('dialog.outcome_en')}
              </Label>
              <Textarea
                id="outcome-en"
                value={outcomeEn}
                onChange={(e) => setOutcomeEn(e.target.value)}
                placeholder={t('dialog.outcome_en_placeholder')}
                className="min-h-20 resize-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome-ar" className="text-start block">
                {t('dialog.outcome_ar')}
              </Label>
              <Textarea
                id="outcome-ar"
                value={outcomeAr}
                onChange={(e) => setOutcomeAr(e.target.value)}
                placeholder={t('dialog.outcome_ar_placeholder')}
                className="min-h-20 resize-none"
                dir="rtl"
              />
            </div>
          </div>

          {/* Impact Score */}
          <div className="space-y-2">
            <Label className="text-start block">{t('dialog.impact_score')}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <Button
                  key={score}
                  type="button"
                  variant={impactScore === score ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImpactScore(score)}
                  className="min-h-11 min-w-11 sm:min-h-10 sm:min-w-10"
                >
                  {score}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-start">
              {t('dialog.impact_score_hint')}
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11 sm:min-h-10"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!titleEn.trim() || isLoading}
            className="min-h-11 sm:min-h-10"
          >
            {isLoading ? t('common.saving') : t('dialog.create_interaction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
