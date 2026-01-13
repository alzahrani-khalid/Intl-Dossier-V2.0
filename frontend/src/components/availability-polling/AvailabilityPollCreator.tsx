/**
 * Availability Poll Creator Component
 * Feature: participant-availability-polling
 *
 * Form for creating Doodle-style availability polls
 * Mobile-first, RTL-compatible
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useFieldArray } from 'react-hook-form'
import { format, addDays, addHours, setHours, setMinutes } from 'date-fns'
import { Plus, Trash2, Calendar, Users, Clock, MapPin, Video, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCreatePoll, useAddParticipants } from '@/hooks/useAvailabilityPolling'
import type {
  CreatePollRequest,
  VotingRule,
  CreatePollSlotRequest,
  CreatePollParticipantRequest,
} from '@/types/availability-polling.types'
import { DEFAULT_DURATION_OPTIONS, DEFAULT_TIMEZONE } from '@/types/availability-polling.types'

interface AvailabilityPollCreatorProps {
  onSuccess?: (pollId: string) => void
  onCancel?: () => void
  dossierId?: string
}

interface FormSlot {
  date: string
  startTime: string
  endTime: string
  venueEn?: string
  venueAr?: string
  preference: number
}

interface FormValues {
  meeting_title_en: string
  meeting_title_ar: string
  description_en: string
  description_ar: string
  deadline: string
  voting_rule: VotingRule
  min_participants_required: number
  meeting_duration_minutes: number
  location_en: string
  location_ar: string
  is_virtual: boolean
  virtual_link: string
  organizer_notes: string
  slots: FormSlot[]
}

export function AvailabilityPollCreator({
  onSuccess,
  onCancel,
  dossierId,
}: AvailabilityPollCreatorProps) {
  const { t, i18n } = useTranslation('availability-polling')
  const isRTL = i18n.language === 'ar'

  const createPoll = useCreatePoll()

  // Default values
  const defaultDeadline = format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      meeting_title_en: '',
      meeting_title_ar: '',
      description_en: '',
      description_ar: '',
      deadline: defaultDeadline,
      voting_rule: 'simple_majority',
      min_participants_required: 1,
      meeting_duration_minutes: 60,
      location_en: '',
      location_ar: '',
      is_virtual: false,
      virtual_link: '',
      organizer_notes: '',
      slots: [
        {
          date: tomorrow,
          startTime: '09:00',
          endTime: '10:00',
          venueEn: '',
          venueAr: '',
          preference: 0.5,
        },
      ],
    },
  })

  const {
    fields: slots,
    append: appendSlot,
    remove: removeSlot,
  } = useFieldArray({
    control,
    name: 'slots',
  })

  const isVirtual = watch('is_virtual')
  const duration = watch('meeting_duration_minutes')

  // Add slot handler
  const handleAddSlot = useCallback(() => {
    const lastSlot = slots[slots.length - 1]
    let newDate = tomorrow
    let newStartTime = '09:00'

    if (lastSlot) {
      // Try to add a slot 2 hours after the last one
      const lastHour = parseInt(lastSlot.startTime.split(':')[0])
      if (lastHour < 16) {
        newDate = lastSlot.date
        newStartTime = `${String(lastHour + 2).padStart(2, '0')}:00`
      } else {
        // Move to next day
        newDate = format(addDays(new Date(lastSlot.date), 1), 'yyyy-MM-dd')
        newStartTime = '09:00'
      }
    }

    const endHour = parseInt(newStartTime.split(':')[0]) + Math.ceil(duration / 60)
    const newEndTime = `${String(Math.min(endHour, 23)).padStart(2, '0')}:00`

    appendSlot({
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      venueEn: '',
      venueAr: '',
      preference: 0.5,
    })
  }, [slots, appendSlot, duration, tomorrow])

  // Submit handler
  const onSubmit = async (data: FormValues) => {
    try {
      // Transform slots to API format
      const apiSlots: CreatePollSlotRequest[] = data.slots.map((slot, idx) => {
        const startDate = new Date(`${slot.date}T${slot.startTime}`)
        const endDate = new Date(`${slot.date}T${slot.endTime}`)

        return {
          slot_start: startDate.toISOString(),
          slot_end: endDate.toISOString(),
          timezone: DEFAULT_TIMEZONE,
          venue_suggestion_en: slot.venueEn || undefined,
          venue_suggestion_ar: slot.venueAr || undefined,
          organizer_preference_score: slot.preference,
          position: idx,
        }
      })

      const request: CreatePollRequest = {
        meeting_title_en: data.meeting_title_en,
        meeting_title_ar: data.meeting_title_ar || undefined,
        description_en: data.description_en || undefined,
        description_ar: data.description_ar || undefined,
        deadline: new Date(data.deadline).toISOString(),
        voting_rule: data.voting_rule,
        min_participants_required: data.min_participants_required,
        meeting_duration_minutes: data.meeting_duration_minutes,
        location_en: data.location_en || undefined,
        location_ar: data.location_ar || undefined,
        is_virtual: data.is_virtual,
        virtual_link: data.virtual_link || undefined,
        organizer_notes: data.organizer_notes || undefined,
        dossier_id: dossierId,
        slots: apiSlots,
      }

      const poll = await createPoll.mutateAsync(request)
      onSuccess?.(poll.id)
    } catch (error) {
      console.error('Failed to create poll:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Meeting Title */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meeting_title_en">{t('form.meetingTitleEn')}</Label>
          <Input
            id="meeting_title_en"
            {...register('meeting_title_en', { required: true })}
            placeholder={t('form.meetingTitlePlaceholder')}
            className={errors.meeting_title_en ? 'border-red-500' : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting_title_ar">{t('form.meetingTitleAr')}</Label>
          <Input
            id="meeting_title_ar"
            {...register('meeting_title_ar')}
            placeholder={t('form.meetingTitlePlaceholder')}
            dir="rtl"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description_en">{t('form.descriptionEn')}</Label>
          <Textarea
            id="description_en"
            {...register('description_en')}
            placeholder={t('form.descriptionPlaceholder')}
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description_ar">{t('form.descriptionAr')}</Label>
          <Textarea
            id="description_ar"
            {...register('description_ar')}
            placeholder={t('form.descriptionPlaceholder')}
            rows={2}
            dir="rtl"
          />
        </div>
      </div>

      <Separator />

      {/* Poll Settings Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Deadline */}
        <div className="space-y-2">
          <Label htmlFor="deadline">{t('form.deadline')}</Label>
          <Input
            id="deadline"
            type="datetime-local"
            {...register('deadline', { required: true })}
          />
          <p className="text-xs text-muted-foreground">{t('form.deadlineHelp')}</p>
        </div>

        {/* Voting Rule */}
        <div className="space-y-2">
          <Label>{t('form.votingRule')}</Label>
          <Select
            defaultValue="simple_majority"
            onValueChange={(value) => setValue('voting_rule', value as VotingRule)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple_majority">{t('votingRules.simple_majority')}</SelectItem>
              <SelectItem value="consensus">{t('votingRules.consensus')}</SelectItem>
              <SelectItem value="unanimous">{t('votingRules.unanimous')}</SelectItem>
              <SelectItem value="organizer_decides">
                {t('votingRules.organizer_decides')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Duration */}
        <div className="space-y-2">
          <Label>{t('form.duration')}</Label>
          <Select
            defaultValue="60"
            onValueChange={(value) => setValue('meeting_duration_minutes', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_DURATION_OPTIONS.map((mins) => (
                <SelectItem key={mins} value={String(mins)}>
                  {t('form.durationMinutes', { count: mins })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Participants */}
        <div className="space-y-2">
          <Label htmlFor="min_participants">{t('form.minParticipants')}</Label>
          <Input
            id="min_participants"
            type="number"
            min={1}
            {...register('min_participants_required', { valueAsNumber: true, min: 1 })}
          />
        </div>
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            {t('form.isVirtual')}
          </Label>
          <Switch
            checked={isVirtual}
            onCheckedChange={(checked) => setValue('is_virtual', checked)}
          />
        </div>

        {isVirtual ? (
          <div className="space-y-2">
            <Label htmlFor="virtual_link">{t('form.virtualLink')}</Label>
            <Input
              id="virtual_link"
              {...register('virtual_link')}
              placeholder={t('form.virtualLinkPlaceholder')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location_en">{t('form.locationEn')}</Label>
              <Input
                id="location_en"
                {...register('location_en')}
                placeholder={t('form.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_ar">{t('form.locationAr')}</Label>
              <Input
                id="location_ar"
                {...register('location_ar')}
                placeholder={t('form.locationPlaceholder')}
                dir="rtl"
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Time Slots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{t('slots.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {slots.length === 0 ? t('slots.noSlotsDescription') : `${slots.length} slots`}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddSlot}>
            <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('slots.addSlot')}
          </Button>
        </div>

        <div className="space-y-3">
          {slots.map((slot, index) => (
            <Card key={slot.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <Label className="text-xs">{t('slots.startTime')}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="date"
                        {...register(`slots.${index}.date` as const)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">&nbsp;</Label>
                    <Input
                      type="time"
                      {...register(`slots.${index}.startTime` as const)}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('slots.endTime')}</Label>
                    <Input
                      type="time"
                      {...register(`slots.${index}.endTime` as const)}
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('slots.preference')}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        defaultValue={[0.5]}
                        max={1}
                        step={0.1}
                        className="flex-1"
                        onValueChange={(value) => setValue(`slots.${index}.preference`, value[0])}
                      />
                      <span className="text-xs w-8">
                        {Math.round((watch(`slots.${index}.preference`) || 0.5) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  onClick={() => removeSlot(index)}
                  disabled={slots.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Organizer Notes */}
      <div className="space-y-2">
        <Label htmlFor="organizer_notes">{t('form.organizerNotes')}</Label>
        <Textarea
          id="organizer_notes"
          {...register('organizer_notes')}
          placeholder={t('form.organizerNotesPlaceholder')}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || createPoll.isPending}>
          {createPoll.isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">...</span>
              Creating...
            </span>
          ) : (
            t('createPoll')
          )}
        </Button>
      </div>
    </form>
  )
}
