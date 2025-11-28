/**
 * CommitmentForm Component v1.1
 * Feature: 031-commitments-management
 * Tasks: T024, T027, T029
 *
 * Form for creating and editing commitments with:
 * - Mobile-first, RTL-compatible layout
 * - Zod validation schema
 * - Pre-populated values for edit mode
 * - 44x44px touch targets
 */

import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type {
  Commitment,
  CommitmentPriority,
  CommitmentOwnerType,
  CommitmentTrackingMode,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from '@/types/commitment.types';
import { useCreateCommitment, useUpdateCommitment } from '@/hooks/useCommitments';

// T029: Zod validation schema
const commitmentFormSchema = z.object({
  title: z
    .string()
    .min(1, 'validation.titleRequired')
    .max(200, 'validation.titleMaxLength'),
  description: z.string().min(1, 'validation.descriptionRequired'),
  due_date: z.date({
    required_error: 'validation.dueDateRequired',
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical'] as const),
  owner_type: z.enum(['internal', 'external'] as const),
  owner_user_id: z.string().optional().nullable(),
  owner_contact_id: z.string().optional().nullable(),
  tracking_mode: z.enum(['manual', 'automatic'] as const),
  proof_required: z.boolean(),
});

type CommitmentFormValues = z.infer<typeof commitmentFormSchema>;

export interface CommitmentFormProps {
  dossierId: string;
  afterActionId?: string;
  commitment?: Commitment; // If provided, form is in edit mode
  onSuccess?: (commitment: Commitment) => void;
  onCancel?: () => void;
}

export function CommitmentForm({
  dossierId,
  afterActionId,
  commitment,
  onSuccess,
  onCancel,
}: CommitmentFormProps) {
  const { t, i18n } = useTranslation('commitments');
  const isRTL = i18n.language === 'ar';
  const isEditMode = !!commitment;

  const createMutation = useCreateCommitment();
  const updateMutation = useUpdateCommitment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // T027: Pre-populated values for edit mode
  const defaultValues: CommitmentFormValues = {
    title: commitment?.title ?? '',
    description: commitment?.description ?? '',
    due_date: commitment?.due_date ? new Date(commitment.due_date) : new Date(),
    priority: (commitment?.priority as CommitmentPriority) ?? 'medium',
    owner_type: (commitment?.owner_type as CommitmentOwnerType) ?? 'internal',
    owner_user_id: commitment?.owner_user_id ?? null,
    owner_contact_id: commitment?.owner_contact_id ?? null,
    tracking_mode: (commitment?.tracking_mode as CommitmentTrackingMode) ?? 'manual',
    proof_required: commitment?.proof_required ?? false,
  };

  const form = useForm<CommitmentFormValues>({
    resolver: zodResolver(commitmentFormSchema),
    defaultValues,
  });

  const watchOwnerType = form.watch('owner_type');

  const onSubmit = (values: CommitmentFormValues) => {
    if (isEditMode && commitment) {
      // Update existing commitment
      const updateInput: UpdateCommitmentInput = {
        title: values.title,
        description: values.description,
        due_date: values.due_date.toISOString().split('T')[0],
        priority: values.priority,
        owner_type: values.owner_type,
        owner_user_id: values.owner_type === 'internal' ? values.owner_user_id : null,
        owner_contact_id: values.owner_type === 'external' ? values.owner_contact_id : null,
        tracking_mode: values.tracking_mode,
        proof_required: values.proof_required,
      };

      updateMutation.mutate(
        { commitmentId: commitment.id, input: updateInput },
        {
          onSuccess: (data) => {
            onSuccess?.(data);
          },
        }
      );
    } else {
      // Create new commitment
      const createInput: CreateCommitmentInput = {
        dossier_id: dossierId,
        after_action_id: afterActionId ?? null,
        title: values.title,
        description: values.description,
        due_date: values.due_date.toISOString().split('T')[0],
        priority: values.priority,
        owner_type: values.owner_type,
        owner_user_id: values.owner_type === 'internal' ? values.owner_user_id : null,
        owner_contact_id: values.owner_type === 'external' ? values.owner_contact_id : null,
        tracking_mode: values.tracking_mode,
        proof_required: values.proof_required,
      };

      createMutation.mutate(createInput, {
        onSuccess: (data) => {
          form.reset();
          onSuccess?.(data);
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('form.title')} *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('form.titlePlaceholder')}
                  className="min-h-11"
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.title?.message &&
                  t(form.formState.errors.title.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('form.description')} *
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('form.descriptionPlaceholder')}
                  className="min-h-24"
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.description?.message &&
                  t(form.formState.errors.description.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* Due Date */}
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-start">
                {t('form.dueDate')} *
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'min-h-11 w-full justify-start text-start font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {field.value ? (
                        format(field.value, 'PPP', {
                          locale: isRTL ? ar : enUS,
                        })
                      ) : (
                        <span>{t('form.dueDate')}</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                    locale={isRTL ? ar : enUS}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage>
                {form.formState.errors.due_date?.message &&
                  t(form.formState.errors.due_date.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* Priority and Owner Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start block">
                  {t('form.priority')}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder={t('priority.label')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">{t('priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('priority.high')}</SelectItem>
                    <SelectItem value="critical">{t('priority.critical')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Owner Type */}
          <FormField
            control={form.control}
            name="owner_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start block">
                  {t('form.ownerType')}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder={t('ownerType.label')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="internal">{t('ownerType.internal')}</SelectItem>
                    <SelectItem value="external">{t('ownerType.external')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Owner Selection - TODO: Replace with actual user/contact picker */}
        <FormField
          control={form.control}
          name={watchOwnerType === 'internal' ? 'owner_user_id' : 'owner_contact_id'}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('form.owner')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder={t('form.selectOwner')}
                  className="min-h-11"
                />
              </FormControl>
              <FormDescription className="text-start">
                {watchOwnerType === 'internal'
                  ? 'Enter internal user ID'
                  : 'Enter external contact ID'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tracking Mode */}
        <FormField
          control={form.control}
          name="tracking_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-start block">
                {t('form.trackingMode')}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder={t('form.trackingMode')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="manual">{t('form.manual')}</SelectItem>
                  <SelectItem value="automatic">{t('form.automatic')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Proof Required Toggle */}
        <FormField
          control={form.control}
          name="proof_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <FormLabel className="text-base text-start block">
                  {t('form.proofRequired')}
                </FormLabel>
                <FormDescription className="text-start">
                  {t('form.proofRequiredDescription')}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="ms-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="min-h-11 w-full sm:w-auto"
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="min-h-11 w-full sm:flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className={`size-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('list.loading')}
              </>
            ) : isEditMode ? (
              t('actions.save')
            ) : (
              t('actions.create')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
