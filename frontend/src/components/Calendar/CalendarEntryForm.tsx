// T053: CalendarEntryForm component
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateCalendarEvent } from '@/hooks/useCreateCalendarEvent';
import { useUpdateCalendarEvent } from '@/hooks/useUpdateCalendarEvent';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock } from 'lucide-react';

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
  };
  linkedItemType?: string;
  linkedItemId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
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

  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();

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
