/**
 * ContactForm Component
 * Part of: 027-contact-directory implementation
 *
 * Mobile-first, RTL-ready contact creation/edit form with validation.
 * Supports manual entry with all contact fields.
 */

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
 Form,
 FormControl,
 FormDescription,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Plus, Loader2, Sparkles } from 'lucide-react';
import { getConfidenceColor } from '@/hooks/useOCR';
import type { PersonMetadata } from '@/hooks/usePersonDossiers';

type Organization = {
 id: string;
 name_en: string;
 name_ar: string;
};

/**
 * OCR confidence scores for individual fields
 */
export interface OCRFieldConfidence {
 full_name?: number;
 organization?: number;
 position?: number;
 email_addresses?: number;
 phone_numbers?: number;
}

export interface PersonFormData {
 name_en: string;
 name_ar: string;
 description_en?: string;
 description_ar?: string;
 metadata: PersonMetadata;
 tags?: string[];
}

interface ContactFormProps {
 defaultValues?: Partial<PersonFormData>;
 organizations?: Organization[];
 tags?: Array<{ id: string; name: string; color?: string }>;
 onSubmit: (data: PersonFormData) => void;
 onCancel?: () => void;
 isSubmitting?: boolean;
 mode?: 'create' | 'edit';
 ocrConfidence?: OCRFieldConfidence; // OCR confidence scores for extracted fields
 ocrRawText?: string; // Raw OCR text for reference
}

interface FormValues {
 full_name: string;
 organization_id: string;
 position: string;
 email_addresses: string[];
 phone_numbers: string[];
 notes: string;
 tags: string[];
 source_type: 'manual' | 'business_card' | 'document';
}

export function ContactForm({
 defaultValues,
 organizations = [],
 tags = [],
 onSubmit,
 onCancel,
 isSubmitting = false,
 mode = 'create',
 ocrConfidence,
 ocrRawText,
}: ContactFormProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 // Render OCR confidence badge
 const renderConfidenceBadge = (fieldName: keyof OCRFieldConfidence) => {
 if (!ocrConfidence || ocrConfidence[fieldName] === undefined) return null;

 const confidence = ocrConfidence[fieldName]!;
 const colorClass = getConfidenceColor(confidence);

 return (
 <TooltipProvider>
 <Tooltip>
 <TooltipTrigger asChild>
 <Badge
 variant="outline"
 className={`${colorClass} text-xs gap-1 ${isRTL ? 'mr-2' : 'ml-2'}`}
 >
 <Sparkles className="h-3 w-3" />
 {Math.round(confidence)}%
 </Badge>
 </TooltipTrigger>
 <TooltipContent>
 <p>{t('contactDirectory.ocr.confidence_tooltip', { confidence: Math.round(confidence) })}</p>
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 );
 };

 const form = useForm<FormValues>({
 defaultValues: {
 full_name: defaultValues?.name_en || '',
 organization_id: defaultValues?.metadata?.organization_id || '',
 position: defaultValues?.metadata?.title_en || '',
 email_addresses: defaultValues?.metadata?.email || [''],
 phone_numbers: defaultValues?.metadata?.phone || [''],
 notes: defaultValues?.metadata?.notes || '',
 tags: defaultValues?.tags || [],
 source_type: (defaultValues?.metadata?.source_type as 'manual' | 'business_card' | 'document') || 'manual',
 },
 });

 const handleSubmit = (data: FormValues) => {
 // Filter out empty email/phone entries
 const emails = data.email_addresses.filter((e) => e.trim() !== '');
 const phones = data.phone_numbers.filter((p) => p.trim() !== '');

 // Find organization name for metadata
 const org = organizations.find(o => o.id === data.organization_id);

 // Transform form data to person dossier format
 const personData: PersonFormData = {
 name_en: data.full_name,
 name_ar: data.full_name, // TODO: Add Arabic name field
 metadata: {
 title_en: data.position,
 organization_id: data.organization_id || undefined,
 organization_name_en: org?.name_en,
 organization_name_ar: org?.name_ar,
 email: emails.length > 0 ? emails : undefined,
 phone: phones.length > 0 ? phones : undefined,
 notes: data.notes || undefined,
 source_type: data.source_type,
 },
 tags: data.tags,
 };

 onSubmit(personData);
 };

 const addEmailField = () => {
 const current = form.getValues('email_addresses');
 form.setValue('email_addresses', [...current, '']);
 };

 const removeEmailField = (index: number) => {
 const current = form.getValues('email_addresses');
 form.setValue(
 'email_addresses',
 current.filter((_, i) => i !== index)
 );
 };

 const addPhoneField = () => {
 const current = form.getValues('phone_numbers');
 form.setValue('phone_numbers', [...current, '']);
 };

 const removePhoneField = (index: number) => {
 const current = form.getValues('phone_numbers');
 form.setValue(
 'phone_numbers',
 current.filter((_, i) => i !== index)
 );
 };

 const toggleTag = (tagId: string) => {
 const current = form.getValues('tags');
 if (current.includes(tagId)) {
 form.setValue(
 'tags',
 current.filter((id) => id !== tagId)
 );
 } else {
 form.setValue('tags', [...current, tagId]);
 }
 };

 return (
 <Form {...form}>
 <form
 onSubmit={form.handleSubmit(handleSubmit)}
 className="space-y-4 sm:space-y-6"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {/* Full Name - Required */}
 <FormField
 control={form.control}
 name="full_name"
 rules={{
 required: t('contactDirectory.form.full_name_required'),
 minLength: { value: 2, message: t('contactDirectory.form.full_name_min_length') },
 maxLength: { value: 200, message: t('contactDirectory.form.full_name_max_length') },
 }}
 render={({ field }) => (
 <FormItem>
 <div className="flex items-center">
 <FormLabel className="text-sm sm:text-base">{t('contactDirectory.form.full_name')}</FormLabel>
 {renderConfidenceBadge('full_name')}
 </div>
 <FormControl>
 <Input
 {...field}
 placeholder={t('contactDirectory.form.full_name_placeholder')}
 className="h-11 px-4 text-base sm:h-10"
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Organization - Optional */}
 <FormField
 control={form.control}
 name="organization_id"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">{t('contactDirectory.form.organization')}</FormLabel>
 <Select onValueChange={field.onChange} defaultValue={field.value}>
 <FormControl>
 <SelectTrigger className="h-11 px-4 text-base sm:h-10">
 <SelectValue placeholder={t('contactDirectory.form.select_organization')} />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 {organizations.map((org) => (
 <SelectItem key={org.id} value={org.id}>
 {org.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Position/Title - Optional */}
 <FormField
 control={form.control}
 name="position"
 render={({ field }) => (
 <FormItem>
 <div className="flex items-center">
 <FormLabel className="text-sm sm:text-base">{t('contactDirectory.form.position')}</FormLabel>
 {renderConfidenceBadge('position')}
 </div>
 <FormControl>
 <Input
 {...field}
 placeholder={t('contactDirectory.form.position_placeholder')}
 className="h-11 px-4 text-base sm:h-10"
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Email Addresses - Dynamic Array */}
 <div className="space-y-2">
 <div className="flex items-center">
 <FormLabel className="text-sm sm:text-base">{t('contactDirectory.form.email_addresses')}</FormLabel>
 {renderConfidenceBadge('email_addresses')}
 </div>
 {form.watch('email_addresses').map((_, index) => (
 <div key={index} className="flex gap-2">
 <FormField
 control={form.control}
 name={`email_addresses.${index}`}
 rules={{
 pattern: {
 value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 message: t('contactDirectory.form.email_invalid'),
 },
 }}
 render={({ field }) => (
 <FormItem className="flex-1">
 <FormControl>
 <Input
 {...field}
 type="email"
 placeholder={t('contactDirectory.form.email_placeholder')}
 className="h-11 px-4 text-base sm:h-10"
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 {form.watch('email_addresses').length > 1 && (
 <Button
 type="button"
 variant="outline"
 size="icon"
 onClick={() => removeEmailField(index)}
 className=" sm:h-10 sm:w-10"
 >
 <X className="h-4 w-4" />
 </Button>
 )}
 </div>
 ))}
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={addEmailField}
 className="h-9 gap-2"
 >
 <Plus className="h-4 w-4" />
 {t('contactDirectory.form.add_email')}
 </Button>
 </div>

 {/* Phone Numbers - Dynamic Array */}
 <div className="space-y-2">
 <div className="flex items-center">
 <FormLabel className="text-sm sm:text-base">{t('contactDirectory.form.phone_numbers')}</FormLabel>
 {renderConfidenceBadge('phone_numbers')}
 </div>
 {form.watch('phone_numbers').map((_, index) => (
 <div key={index} className="flex gap-2">
 <FormField
 control={form.control}
 name={`phone_numbers.${index}`}
 render={({ field }) => (
 <FormItem className="flex-1">
 <FormControl>
 <Input
 {...field}
 type="tel"
 placeholder={t('contactDirectory.form.phone_placeholder')}
 className="h-11 px-4 text-base sm:h-10"
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 {form.watch('phone_numbers').length > 1 && (
 <Button
 type="button"
 variant="outline"
 size="icon"
 onClick={() => removePhoneField(index)}
 className=" sm:h-10 sm:w-10"
 >
 <X className="h-4 w-4" />
 </Button>
 )}
 </div>
 ))}
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={addPhoneField}
 className="h-9 gap-2"
 >
 <Plus className="h-4 w-4" />
 {t('contactDirectory.form.add_phone')}
 </Button>
 </div>

 {/* Tags - Multi-select */}
 {tags.length > 0 && (
 <div className="space-y-2">
 <FormLabel className="text-sm sm:text-base">{t('contactDirectory.form.tags')}</FormLabel>
 <div className="flex flex-wrap gap-2">
 {tags.map((tag) => {
 const isSelected = form.watch('tags').includes(tag.id);
 return (
 <Badge
 key={tag.id}
 variant={isSelected ? 'default' : 'outline'}
 className="cursor-pointer px-3 py-1.5 text-sm"
 onClick={() => toggleTag(tag.id)}
 style={
 isSelected && tag.color
 ? { backgroundColor: tag.color, borderColor: tag.color }
 : undefined
 }
 >
 {tag.name}
 </Badge>
 );
 })}
 </div>
 </div>
 )}

 {/* Notes - Optional */}
 <FormField
 control={form.control}
 name="notes"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">{t('contactDirectory.form.notes')}</FormLabel>
 <FormControl>
 <Textarea
 {...field}
 placeholder={t('contactDirectory.form.notes_placeholder')}
 className="min-h-[100px] px-4 py-3 text-base resize-y"
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 </FormControl>
 <FormDescription>{t('contactDirectory.form.notes_description')}</FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Form Actions */}
 <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
 {onCancel && (
 <Button
 type="button"
 variant="outline"
 onClick={onCancel}
 disabled={isSubmitting}
 className="h-11 px-6 sm:h-10"
 >
 {t('contactDirectory.form.cancel')}
 </Button>
 )}
 <Button
 type="submit"
 disabled={isSubmitting}
 className="h-11 px-6 sm:h-10"
 >
 {isSubmitting && <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />}
 {mode === 'create' ? t('contactDirectory.form.create_contact') : t('contactDirectory.form.save_changes')}
 </Button>
 </div>
 </form>
 </Form>
 );
}
