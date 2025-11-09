/**
 * RelationshipForm Component
 * Part of: 027-contact-directory Phase 6
 *
 * Form for creating/editing relationships between contacts.
 * Mobile-first, RTL-aware.
 */

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateRelationship } from '@/hooks/useContactRelationships';
import type { CreateRelationshipInput, RelationshipType } from '@/services/contact-relationship-api';

/**
 * RelationshipForm Props
 */
interface RelationshipFormProps {
 /** Source contact ID (from) */
 fromContactId: string;
 /** Target contact ID (to) - optional for new relationships */
 toContactId?: string;
 /** Available contacts for selection */
 availableContacts?: Array<{ id: string; full_name: string }>;
 /** Callback on successful creation */
 onSuccess?: () => void;
 /** Callback on cancel */
 onCancel?: () => void;
}

/**
 * Form values
 */
interface RelationshipFormValues {
 to_contact_id: string;
 relationship_type: RelationshipType;
 notes?: string;
 start_date?: string;
 end_date?: string;
}

/**
 * RelationshipForm Component
 */
export function RelationshipForm({
 fromContactId,
 toContactId,
 availableContacts = [],
 onSuccess,
 onCancel,
}: RelationshipFormProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 const {
 register,
 handleSubmit,
 setValue,
 watch,
 formState: { errors },
 } = useForm<RelationshipFormValues>({
 defaultValues: {
 to_contact_id: toContactId || '',
 relationship_type: 'colleague',
 },
 });

 const createMutation = useCreateRelationship();

 const selectedRelationType = watch('relationship_type');

 /**
 * Handle form submission
 */
 const onSubmit = (data: RelationshipFormValues) => {
 const input: CreateRelationshipInput = {
 from_contact_id: fromContactId,
 to_contact_id: data.to_contact_id,
 relationship_type: data.relationship_type,
 notes: data.notes || undefined,
 start_date: data.start_date || undefined,
 end_date: data.end_date || undefined,
 };

 createMutation.mutate(input, {
 onSuccess: () => {
 onSuccess?.();
 },
 });
 };

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Contact Selection (if not pre-selected) */}
 {!toContactId && (
 <div className="space-y-2">
 <Label htmlFor="to_contact_id">
 {t('contactDirectory.relationships.form.select_contact')}
 <span className="text-destructive ms-1">*</span>
 </Label>
 <Select
 value={watch('to_contact_id')}
 onValueChange={(value) => setValue('to_contact_id', value)}
 >
 <SelectTrigger id="to_contact_id" className="h-11 sm:h-10">
 <SelectValue placeholder={t('contactDirectory.relationships.form.select_contact_placeholder')} />
 </SelectTrigger>
 <SelectContent>
 {availableContacts.map((contact) => (
 <SelectItem key={contact.id} value={contact.id}>
 {contact.full_name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {errors.to_contact_id && (
 <p className="text-sm text-destructive text-start">
 {t('contactDirectory.relationships.form.contact_required')}
 </p>
 )}
 </div>
 )}

 {/* Relationship Type */}
 <div className="space-y-2">
 <Label htmlFor="relationship_type">
 {t('contactDirectory.relationships.form.relationship_type')}
 <span className="text-destructive ms-1">*</span>
 </Label>
 <Select
 value={selectedRelationType}
 onValueChange={(value) => setValue('relationship_type', value as RelationshipType)}
 >
 <SelectTrigger id="relationship_type" className="h-11 sm:h-10">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="reports_to">
 {t('contactDirectory.relationshipTypes.reports_to')}
 </SelectItem>
 <SelectItem value="collaborates_with">
 {t('contactDirectory.relationshipTypes.collaborates_with')}
 </SelectItem>
 <SelectItem value="partner">
 {t('contactDirectory.relationshipTypes.partner')}
 </SelectItem>
 <SelectItem value="colleague">
 {t('contactDirectory.relationshipTypes.colleague')}
 </SelectItem>
 <SelectItem value="other">
 {t('contactDirectory.relationshipTypes.other')}
 </SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Start Date */}
 <div className="space-y-2">
 <Label htmlFor="start_date">
 {t('contactDirectory.relationships.form.start_date')}
 </Label>
 <Input
 id="start_date"
 type="date"
 {...register('start_date')}
 className="h-11 sm:h-10"
 />
 </div>

 {/* End Date */}
 <div className="space-y-2">
 <Label htmlFor="end_date">
 {t('contactDirectory.relationships.form.end_date')}
 </Label>
 <Input
 id="end_date"
 type="date"
 {...register('end_date')}
 className="h-11 sm:h-10"
 />
 </div>

 {/* Notes */}
 <div className="space-y-2">
 <Label htmlFor="notes">
 {t('contactDirectory.relationships.form.notes')}
 </Label>
 <Textarea
 id="notes"
 {...register('notes')}
 placeholder={t('contactDirectory.relationships.form.notes_placeholder')}
 rows={3}
 className="resize-none"
 />
 </div>

 {/* Actions */}
 <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
 {onCancel && (
 <Button
 type="button"
 variant="outline"
 onClick={onCancel}
 disabled={createMutation.isPending}
 className="flex-1 sm:flex-initial h-11 sm:h-10"
 >
 {t('contactDirectory.form.cancel')}
 </Button>
 )}
 <Button
 type="submit"
 disabled={createMutation.isPending}
 className="flex-1 sm:flex-initial h-11 sm:h-10"
 >
 {createMutation.isPending && (
 <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
 )}
 {t('contactDirectory.relationships.form.create_relationship')}
 </Button>
 </div>
 </form>
 );
}
