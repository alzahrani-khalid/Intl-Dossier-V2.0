// T053: CalendarEntryForm component
// T128: Added support for person_dossier participants (User Story 7)
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateCalendarEvent } from '@/hooks/useCreateCalendarEvent';
import { useUpdateCalendarEvent } from '@/hooks/useUpdateCalendarEvent';
import { useDossiers } from '@/hooks/useDossier';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Clock, Users, X, Building2, Check } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CalendarEntryFormProps {
  entryId?: string;
  initialData?: {
    entry_type?: string;
    title_en?: string;
    title_ar?: string;
    description_en?: string;
    description_ar?: string;
    start_datetime?: string;
    end_datetime?: string;
    all_day?: boolean;
    location?: string;
    recurrence_pattern?: string;
    reminder_minutes?: number;
    participants?: Array<{
      participant_type: 'person_dossier' | 'organization_dossier';
      participant_id: string;
      participant_name?: string;
      participant_photo?: string;
    }>;
  };
  linkedItemType?: string;
  linkedItemId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Extract initials from name (handles both English and Arabic)
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '??';
  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }
  return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase();
}

export function CalendarEntryForm({
  entryId,
  initialData,
  linkedItemType,
  linkedItemId,
  onSuccess,
  onCancel,
}: CalendarEntryFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [entryType, setEntryType] = useState(initialData?.entry_type || 'internal_meeting');
  const [titleEn, setTitleEn] = useState(initialData?.title_en || '');
  const [titleAr, setTitleAr] = useState(initialData?.title_ar || '');
  const [descriptionEn, setDescriptionEn] = useState(initialData?.description_en || '');
  const [descriptionAr, setDescriptionAr] = useState(initialData?.description_ar || '');
  const [startDatetime, setStartDatetime] = useState(initialData?.start_datetime || '');
  const [endDatetime, setEndDatetime] = useState(initialData?.end_datetime || '');
  const [allDay, setAllDay] = useState(initialData?.all_day || false);
  const [location, setLocation] = useState(initialData?.location || '');
  const [reminderMinutes, setReminderMinutes] = useState(initialData?.reminder_minutes?.toString() || '15');
  const [participants, setParticipants] = useState<Array<{
    participant_type: 'person_dossier' | 'organization_dossier';
    participant_id: string;
    participant_name?: string;
    participant_photo?: string;
  }>>(initialData?.participants || []);
  const [participantPopoverOpen, setParticipantPopoverOpen] = useState(false);

  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();

  // Query for person and organization dossiers for participant selection
  const { data: personDossiers } = useDossiers({ type: 'person', status: 'active' });
  const { data: orgDossiers } = useDossiers({ type: 'organization', status: 'active' });

  const isEditing = !!entryId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDatetime) {
      alert(t('calendar.form.start_datetime_required'));
      return;
    }

    const eventData = {
      entry_type: entryType as any,
      title_en: titleEn || undefined,
      title_ar: titleAr || undefined,
      description_en: descriptionEn || undefined,
      description_ar: descriptionAr || undefined,
      start_datetime: startDatetime,
      end_datetime: endDatetime || undefined,
      all_day: allDay,
      location: location || undefined,
      linked_item_type: linkedItemType,
      linked_item_id: linkedItemId,
      reminder_minutes: parseInt(reminderMinutes) || 15,
      participants: participants.map(p => ({
        participant_type: p.participant_type,
        participant_id: p.participant_id,
      })),
    };

    try {
      if (isEditing) {
        await updateEvent.mutateAsync({
          entryId,
          ...eventData,
        });
      } else {
        await createEvent.mutateAsync(eventData);
      }

      onSuccess?.();
    } catch (err) {
      console.error('Failed to save calendar entry:', err);
      alert(t('calendar.form.save_failed'));
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <Card className="p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2 mb-6">
        <CalendarIcon className="h-5 w-5" />
        <h2 className="text-lg sm:text-xl font-semibold">
          {isEditing ? t('calendar.form.edit_event') : t('calendar.form.create_event')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Event Type */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-type">{t('calendar.form.entry_type')}</Label>
          <Select value={entryType} onValueChange={setEntryType} disabled={isPending}>
            <SelectTrigger id="entry-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal_meeting">{t('calendar.types.internal_meeting')}</SelectItem>
              <SelectItem value="deadline">{t('calendar.types.deadline')}</SelectItem>
              <SelectItem value="reminder">{t('calendar.types.reminder')}</SelectItem>
              <SelectItem value="holiday">{t('calendar.types.holiday')}</SelectItem>
              <SelectItem value="training">{t('calendar.types.training')}</SelectItem>
              <SelectItem value="review">{t('calendar.types.review')}</SelectItem>
              <SelectItem value="other">{t('calendar.types.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Titles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title-en">{t('calendar.form.title_en')}</Label>
            <Input
              id="title-en"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder={t('calendar.form.title_en_placeholder')}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title-ar">{t('calendar.form.title_ar')}</Label>
            <Input
              id="title-ar"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder={t('calendar.form.title_ar_placeholder')}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="desc-en">{t('calendar.form.description_en')}</Label>
            <Textarea
              id="desc-en"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder={t('calendar.form.description_en_placeholder')}
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="desc-ar">{t('calendar.form.description_ar')}</Label>
            <Textarea
              id="desc-ar"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder={t('calendar.form.description_ar_placeholder')}
              rows={3}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="start-datetime" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t('calendar.form.start_datetime')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="start-datetime"
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="end-datetime">{t('calendar.form.end_datetime')}</Label>
            <Input
              id="end-datetime"
              type="datetime-local"
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        {/* All Day & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="all-day" className="cursor-pointer">
              {t('calendar.form.all_day')}
            </Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">{t('calendar.form.location')}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('calendar.form.location_placeholder')}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Participants (T128: Support for person_dossier and organization_dossier) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <Label>{t('calendar.form.participants')}</Label>
          </div>

          {/* Selected participants */}
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {participants.map((participant) => (
                <Badge
                  key={participant.participant_id}
                  variant="secondary"
                  className="flex items-center gap-2 ps-2 pe-1 py-1"
                >
                  {participant.participant_type === 'person_dossier' && participant.participant_photo ? (
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={participant.participant_photo} alt={participant.participant_name || ''} />
                      <AvatarFallback className="text-xs">
                        {getInitials(participant.participant_name || participant.participant_id)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      {participant.participant_type === 'person_dossier' ? (
                        <Users className="h-3 w-3" />
                      ) : (
                        <Building2 className="h-3 w-3" />
                      )}
                    </div>
                  )}
                  <span className="text-xs">{participant.participant_name || participant.participant_id}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-transparent"
                    onClick={() => {
                      setParticipants(participants.filter(p => p.participant_id !== participant.participant_id));
                    }}
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add participant popover */}
          <Popover open={participantPopoverOpen} onOpenChange={setParticipantPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={isPending}
              >
                <Users className="h-4 w-4 me-2" />
                {t('calendar.form.add_participant')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full sm:w-80 p-0" align={isRTL ? 'end' : 'start'}>
              <Command>
                <CommandInput placeholder={t('calendar.form.search_participants')} />
                <CommandEmpty>{t('calendar.form.no_participants_found')}</CommandEmpty>

                {/* Person dossiers */}
                {personDossiers && personDossiers.length > 0 && (
                  <CommandGroup heading={t('calendar.form.people')}>
                    {personDossiers.map((person) => {
                      const displayName = isRTL ? person.name_ar : person.name_en;
                      const isSelected = participants.some(p => p.participant_id === person.id);

                      return (
                        <CommandItem
                          key={person.id}
                          value={displayName || person.id}
                          onSelect={() => {
                            if (!isSelected) {
                              setParticipants([
                                ...participants,
                                {
                                  participant_type: 'person_dossier',
                                  participant_id: person.id,
                                  participant_name: displayName || person.id,
                                  participant_photo: (person.extension as any)?.photo_url,
                                },
                              ]);
                            }
                            setParticipantPopoverOpen(false);
                          }}
                          disabled={isSelected}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {(person.extension as any)?.photo_url ? (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={(person.extension as any).photo_url} alt={displayName || ''} />
                                <AvatarFallback className="text-xs">
                                  {displayName ? getInitials(displayName) : 'VIP'}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                                <Users className="h-3 w-3 text-teal-800 dark:text-teal-300" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm">{displayName}</span>
                              {(person.extension as any)?.title && (
                                <span className="text-xs text-muted-foreground">
                                  {(person.extension as any).title}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {/* Organization dossiers */}
                {orgDossiers && orgDossiers.length > 0 && (
                  <CommandGroup heading={t('calendar.form.organizations')}>
                    {orgDossiers.map((org) => {
                      const displayName = isRTL ? org.name_ar : org.name_en;
                      const isSelected = participants.some(p => p.participant_id === org.id);

                      return (
                        <CommandItem
                          key={org.id}
                          value={displayName || org.id}
                          onSelect={() => {
                            if (!isSelected) {
                              setParticipants([
                                ...participants,
                                {
                                  participant_type: 'organization_dossier',
                                  participant_id: org.id,
                                  participant_name: displayName || org.id,
                                },
                              ]);
                            }
                            setParticipantPopoverOpen(false);
                          }}
                          disabled={isSelected}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <Building2 className="h-3 w-3 text-purple-800 dark:text-purple-300" />
                            </div>
                            <span className="text-sm">{displayName}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Reminder */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder">{t('calendar.form.reminder')}</Label>
          <Select value={reminderMinutes} onValueChange={setReminderMinutes} disabled={isPending}>
            <SelectTrigger id="reminder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('calendar.form.no_reminder')}</SelectItem>
              <SelectItem value="5">5 {t('calendar.form.minutes_before')}</SelectItem>
              <SelectItem value="15">15 {t('calendar.form.minutes_before')}</SelectItem>
              <SelectItem value="30">30 {t('calendar.form.minutes_before')}</SelectItem>
              <SelectItem value="60">1 {t('calendar.form.hour_before')}</SelectItem>
              <SelectItem value="1440">1 {t('calendar.form.day_before')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending
              ? t('common.saving')
              : isEditing
              ? t('calendar.form.update_event')
              : t('calendar.form.create_event')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
