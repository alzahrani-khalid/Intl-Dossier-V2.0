/**
 * Interaction Note Form Component
 * Part of: 027-contact-directory Phase 7 implementation
 *
 * Mobile-first, RTL-aware dialog form for creating/editing interaction notes.
 * Includes date picker, type selector, details textarea, attendee multi-select, and file upload.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Upload, X, Loader2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useCreateNote, useUploadAttachment } from '@/hooks/useInteractions';
import { useSearchPersonDossiers } from '@/hooks/usePersonDossiers';
import type { InteractionNoteResponse } from '@/services/interaction-api';
import { cn } from '@/lib/utils';

interface InteractionNoteFormProps {
 contactId: string;
 note?: InteractionNoteResponse; // For editing existing notes
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

/**
 * Form Schema
 */
const formSchema = z.object({
 date: z.date({
 required_error: 'Date is required',
 }),
 type: z.enum(['meeting', 'email', 'call', 'conference', 'other'], {
 required_error: 'Type is required',
 }),
 details: z
 .string()
 .min(10, 'Details must be at least 10 characters')
 .max(5000, 'Details cannot exceed 5000 characters'),
 attendees: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Interaction Note Form Dialog
 */
export function InteractionNoteForm({
 contactId,
 note,
 open,
 onOpenChange,
}: InteractionNoteFormProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 const createNoteMutation = useCreateNote();
 const uploadAttachmentMutation = useUploadAttachment();

 const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
 const [uploadingFiles, setUploadingFiles] = useState(false);
 const [attendeeSearch, setAttendeeSearch] = useState('');
 const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

 // Search contacts for attendees
 const { data: contactsData } = useSearchContacts({
 search: attendeeSearch,
 limit: 10,
 });

 const form = useForm<FormValues>({
 resolver: zodResolver(formSchema),
 defaultValues: {
 date: note ? new Date(note.date) : new Date(),
 type: note?.type || 'meeting',
 details: note?.details || '',
 attendees: note?.attendees || [],
 },
 });

 // Update selected attendees when note changes
 useEffect(() => {
 if (note?.attendees) {
 setSelectedAttendees(note.attendees);
 }
 }, [note]);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files || []);

 // Validate files
 const validFiles = files.filter((file) => {
 // Check file size (max 10MB)
 if (file.size > 10 * 1024 * 1024) {
 return false;
 }
 return true;
 });

 setSelectedFiles((prev) => [...prev, ...validFiles]);
 };

 const removeFile = (index: number) => {
 setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
 };

 const addAttendee = (contactId: string) => {
 if (!selectedAttendees.includes(contactId)) {
 setSelectedAttendees([...selectedAttendees, contactId]);
 }
 setAttendeeSearch('');
 };

 const removeAttendee = (contactId: string) => {
 setSelectedAttendees(selectedAttendees.filter((id) => id !== contactId));
 };

 const onSubmit = async (values: FormValues) => {
 try {
 // Create the note first
 const noteData = await createNoteMutation.mutateAsync({
 contact_id: contactId,
 date: format(values.date, 'yyyy-MM-dd'),
 type: values.type,
 details: values.details,
 attendees: selectedAttendees.length > 0 ? selectedAttendees : undefined,
 });

 // Upload attachments if any
 if (selectedFiles.length > 0) {
 setUploadingFiles(true);
 const uploadPromises = selectedFiles.map((file) =>
 uploadAttachmentMutation.mutateAsync({
 contactId,
 noteId: noteData.id,
 file,
 })
 );

 await Promise.all(uploadPromises);
 setUploadingFiles(false);
 }

 // Reset form and close dialog
 form.reset();
 setSelectedFiles([]);
 setSelectedAttendees([]);
 onOpenChange(false);
 } catch (error) {
 console.error('Failed to create note:', error);
 setUploadingFiles(false);
 }
 };

 const isSubmitting = createNoteMutation.isPending || uploadingFiles;
 const maxDate = new Date(); // Cannot select future dates

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent
 className="max-w-2xl max-h-[90vh] overflow-y-auto px-4 sm:px-6"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <DialogHeader>
 <DialogTitle className="text-lg sm:text-xl">
 {note
 ? t('contactDirectory.interactions.form.edit_title')
 : t('contactDirectory.interactions.form.create_title')}
 </DialogTitle>
 <DialogDescription className="text-sm">
 {t('contactDirectory.interactions.form.description')}
 </DialogDescription>
 </DialogHeader>

 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
 {/* Date Field */}
 <FormField
 control={form.control}
 name="date"
 render={({ field }) => (
 <FormItem className="flex flex-col">
 <FormLabel>{t('contactDirectory.interactions.form.date')}</FormLabel>
 <Popover>
 <PopoverTrigger asChild>
 <FormControl>
 <Button
 variant="outline"
 className={cn(
 'w-full justify-start text-start font-normal',
 !field.value && 'text-muted-foreground'
 )}
 >
 <CalendarIcon className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
 {field.value ? (
 format(field.value, 'PPP')
 ) : (
 <span>{t('contactDirectory.interactions.form.select_date')}</span>
 )}
 </Button>
 </FormControl>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
 <Calendar
 mode="single"
 selected={field.value}
 onSelect={field.onChange}
 disabled={(date) => date > maxDate}
 initialFocus
 />
 </PopoverContent>
 </Popover>
 <FormDescription className="text-xs">
 {t('contactDirectory.interactions.form.date_description')}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Type Field */}
 <FormField
 control={form.control}
 name="type"
 render={({ field }) => (
 <FormItem>
 <FormLabel>{t('contactDirectory.interactions.form.type')}</FormLabel>
 <Select onValueChange={field.onChange} defaultValue={field.value}>
 <FormControl>
 <SelectTrigger>
 <SelectValue
 placeholder={t('contactDirectory.interactions.form.select_type')}
 />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="meeting">
 {t('contactDirectory.interactions.types.meeting')}
 </SelectItem>
 <SelectItem value="email">
 {t('contactDirectory.interactions.types.email')}
 </SelectItem>
 <SelectItem value="call">
 {t('contactDirectory.interactions.types.call')}
 </SelectItem>
 <SelectItem value="conference">
 {t('contactDirectory.interactions.types.conference')}
 </SelectItem>
 <SelectItem value="other">
 {t('contactDirectory.interactions.types.other')}
 </SelectItem>
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Details Field */}
 <FormField
 control={form.control}
 name="details"
 render={({ field }) => (
 <FormItem>
 <FormLabel>{t('contactDirectory.interactions.form.details')}</FormLabel>
 <FormControl>
 <Textarea
 placeholder={t('contactDirectory.interactions.form.details_placeholder')}
 className="min-h-[120px] resize-none"
 {...field}
 />
 </FormControl>
 <FormDescription className="text-xs">
 {field.value.length}/5000{' '}
 {t('contactDirectory.interactions.form.characters')}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Attendees Field */}
 <div className="space-y-2">
 <FormLabel className="flex items-center gap-2">
 <Users className="w-4 h-4" />
 {t('contactDirectory.interactions.form.attendees')}
 </FormLabel>
 <Input
 type="text"
 placeholder={t('contactDirectory.interactions.form.search_attendees')}
 value={attendeeSearch}
 onChange={(e) => setAttendeeSearch(e.target.value)}
 className="text-sm"
 />
 {attendeeSearch && contactsData && contactsData.contacts.length > 0 && (
 <div className="border rounded-md max-h-40 overflow-y-auto">
 {contactsData.contacts.map((contact) => (
 <button
 key={contact.id}
 type="button"
 onClick={() => addAttendee(contact.id)}
 className="w-full px-3 py-2 text-sm text-start hover:bg-accent transition-colors"
 >
 {contact.full_name}
 {contact.organization && (
 <span className="text-xs text-muted-foreground ms-2">
 ({contact.organization.name})
 </span>
 )}
 </button>
 ))}
 </div>
 )}
 {selectedAttendees.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {selectedAttendees.map((attendeeId) => {
 const attendee = contactsData?.contacts.find((c) => c.id === attendeeId);
 return (
 <Badge key={attendeeId} variant="secondary" className="gap-1">
 {attendee?.full_name || attendeeId}
 <button
 type="button"
 onClick={() => removeAttendee(attendeeId)}
 className="ms-1 hover:text-destructive"
 >
 <X className="w-3 h-3" />
 </button>
 </Badge>
 );
 })}
 </div>
 )}
 <FormDescription className="text-xs">
 {t('contactDirectory.interactions.form.attendees_description')}
 </FormDescription>
 </div>

 {/* File Upload */}
 <div className="space-y-2">
 <FormLabel>{t('contactDirectory.interactions.form.attachments')}</FormLabel>
 <div className="flex flex-col sm:flex-row gap-2">
 <Input
 type="file"
 id="file-upload"
 multiple
 onChange={handleFileChange}
 className="hidden"
 />
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => document.getElementById('file-upload')?.click()}
 className="w-full sm:w-auto"
 >
 <Upload className={cn('w-4 h-4', isRTL ? 'ms-2' : 'me-2')} />
 {t('contactDirectory.interactions.form.upload_files')}
 </Button>
 </div>
 {selectedFiles.length > 0 && (
 <div className="space-y-2">
 {selectedFiles.map((file, index) => (
 <div
 key={index}
 className="flex items-center justify-between p-2 border rounded-md text-sm"
 >
 <span className="truncate flex-1">{file.name}</span>
 <button
 type="button"
 onClick={() => removeFile(index)}
 className="ms-2 text-muted-foreground hover:text-destructive"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 )}
 <FormDescription className="text-xs">
 {t('contactDirectory.interactions.form.attachments_description')}
 </FormDescription>
 </div>

 <DialogFooter className="flex-col sm:flex-row gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => onOpenChange(false)}
 disabled={isSubmitting}
 className="w-full sm:w-auto"
 >
 {t('contactDirectory.interactions.form.cancel')}
 </Button>
 <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto gap-2">
 {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
 {note
 ? t('contactDirectory.interactions.form.save_changes')
 : t('contactDirectory.interactions.form.create_note')}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}
