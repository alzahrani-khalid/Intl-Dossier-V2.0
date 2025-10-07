import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const engagementTypes = [
  'meeting',
  'consultation',
  'coordination',
  'workshop',
  'conference',
  'site_visit',
  'other',
] as const;

const engagementSchema = z.object({
  dossier_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  engagement_type: z.enum(engagementTypes),
  engagement_date: z.date(),
  location: z.string().max(500).optional(),
  description: z.string().optional(),
});

export type EngagementFormData = z.infer<typeof engagementSchema>;

interface EngagementFormProps {
  dossierId?: string;
  defaultValues?: Partial<EngagementFormData>;
  onSubmit: (data: EngagementFormData) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function EngagementForm({
  dossierId,
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel,
}: EngagementFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const form = useForm<EngagementFormData>({
    resolver: zodResolver(engagementSchema),
    defaultValues: {
      dossier_id: dossierId || defaultValues?.dossier_id || '',
      title: defaultValues?.title || '',
      engagement_type: defaultValues?.engagement_type || 'meeting',
      engagement_date: defaultValues?.engagement_date || new Date(),
      location: defaultValues?.location || '',
      description: defaultValues?.description || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('engagements.form.title')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('engagements.form.titlePlaceholder')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="engagement_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('engagements.form.type')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger dir={isRTL ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={t('engagements.form.typePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {engagementTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`engagements.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="engagement_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('engagements.form.date')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full ps-3 text-start font-normal',
                        !field.value && 'text-muted-foreground',
                        isRTL && 'pe-3 text-end'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>{t('engagements.form.datePlaceholder')}</span>
                      )}
                      <CalendarIcon className={cn('ms-auto h-4 w-4 opacity-50', isRTL && 'me-auto ms-0')} />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('engagements.form.location')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('engagements.form.locationPlaceholder')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('engagements.form.description')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('engagements.form.descriptionPlaceholder')}
                  rows={4}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={cn('flex gap-4', isRTL && 'flex-row-reverse')}>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : submitLabel || t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
