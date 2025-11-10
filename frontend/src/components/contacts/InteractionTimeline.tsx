/**
 * Interaction Timeline Component
 * Part of: 027-contact-directory Phase 7 implementation
 *
 * Mobile-first, RTL-aware component displaying chronological list of interaction notes.
 * Shows date, type icon, details preview, and attachments with expand/collapse functionality.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
 Calendar,
 Mail,
 Phone,
 Users,
 FileText,
 ChevronDown,
 ChevronUp,
 Download,
 ExternalLink,
 Paperclip,
 MoreVertical,
 Trash2,
 Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInteractionNotes, useDeleteNote, useDownloadAttachment } from '@/hooks/useInteractions';
import type { InteractionNoteResponse } from '@/services/interaction-api';
import { cn } from '@/lib/utils';

interface InteractionTimelineProps {
 contactId: string;
 onEditNote?: (note: InteractionNoteResponse) => void;
 className?: string;
}

/**
 * Get icon component for interaction type
 */
function getTypeIcon(type: string) {
 switch (type) {
 case 'meeting':
 return Calendar;
 case 'email':
 return Mail;
 case 'call':
 return Phone;
 case 'conference':
 return Users;
 default:
 return FileText;
 }
}

/**
 * Get color for interaction type badge
 */
function getTypeColor(type: string): string {
 switch (type) {
 case 'meeting':
 return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
 case 'email':
 return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
 case 'call':
 return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
 case 'conference':
 return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
 default:
 return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
 }
}

/**
 * Individual Interaction Note Item
 */
interface InteractionNoteItemProps {
 note: InteractionNoteResponse;
 isRTL: boolean;
 locale: typeof ar | typeof enUS;
 onEdit?: (note: InteractionNoteResponse) => void;
 onDelete: (id: string, contactId: string) => void;
 onDownload: (path: string, filename: string) => void;
}

function InteractionNoteItem({
 note,
 isRTL,
 locale,
 onEdit,
 onDelete,
 onDownload,
}: InteractionNoteItemProps) {
 const { t } = useTranslation('contacts');
 const [isExpanded, setIsExpanded] = useState(false);

 const TypeIcon = getTypeIcon(note.type);
 const formattedDate = format(new Date(note.date), 'PPP', { locale });

 // Extract filename from attachment path
 const getFilename = (path: string) => {
 const parts = path.split('/');
 const filename = parts[parts.length - 1];
 // Remove timestamp prefix if present (e.g., "1234567890_document.pdf" -> "document.pdf")
 return filename.replace(/^\d+_/, '');
 };

 const hasAttachments = note.attachments && note.attachments.length > 0;
 const hasAttendees = note.attendees && note.attendees.length > 0;
 const detailsPreview =
 note.details.length > 150 ? `${note.details.substring(0, 150)}...` : note.details;

 return (
 <Card
 className={cn(
 'p-4 hover:shadow-md transition-shadow',
 'border border-border',
 isRTL && 'text-end'
 )}
 >
 <div className="flex flex-col gap-3 sm:gap-4">
 {/* Header: Icon, Type, Date, Actions */}
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 {/* Icon */}
 <div
 className={cn(
 'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
 'bg-primary/10 text-primary'
 )}
 >
 <TypeIcon className="w-5 h-5" />
 </div>

 {/* Type, Date */}
 <div className="flex-1 min-w-0">
 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
 <Badge variant="secondary" className={cn('w-fit text-xs', getTypeColor(note.type))}>
 {t(`contactDirectory.interactions.types.${note.type}`)}
 </Badge>
 <span className="text-xs sm:text-sm text-muted-foreground">{formattedDate}</span>
 </div>

 {/* Attendees */}
 {hasAttendees && (
 <div className="flex items-center gap-1 mt-1">
 <Users className="w-3 h-3 text-muted-foreground" />
 <span className="text-xs text-muted-foreground">
 {t('contactDirectory.interactions.attendees_count', {
 count: note.attendees!.length,
 })}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* Actions Menu */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 <MoreVertical className="h-4 w-4" />
 <span className="sr-only">{t('contactDirectory.interactions.actions')}</span>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
 {onEdit && (
 <DropdownMenuItem onClick={() => onEdit(note)}>
 <Edit className="w-4 h-4 me-2" />
 {t('contactDirectory.interactions.edit')}
 </DropdownMenuItem>
 )}
 <DropdownMenuItem
 onClick={() => onDelete(note.id, note.contact_id)}
 className="text-destructive"
 >
 <Trash2 className="w-4 h-4 me-2" />
 {t('contactDirectory.interactions.delete')}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 {/* Details Preview/Full */}
 <div className="text-sm text-foreground">
 {isExpanded ? note.details : detailsPreview}
 </div>

 {/* Attachments */}
 {hasAttachments && (
 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 <Paperclip className="w-3 h-3" />
 <span>
 {t('contactDirectory.interactions.attachments_count', {
 count: note.attachments!.length,
 })}
 </span>
 </div>
 <div className="flex flex-wrap gap-2">
 {note.attachments!.map((path, index) => {
 const filename = getFilename(path);
 return (
 <Button
 key={index}
 variant="outline"
 size="sm"
 className="h-8 text-xs gap-2"
 onClick={() => onDownload(path, filename)}
 >
 <Download className="w-3 h-3" />
 <span className="truncate max-w-[150px] sm:max-w-[200px]">{filename}</span>
 </Button>
 );
 })}
 </div>
 </div>
 )}

 {/* Expand/Collapse Button (only if details are long) */}
 {note.details.length > 150 && (
 <Button
 variant="ghost"
 size="sm"
 className="h-8 w-full sm:w-auto text-xs gap-1"
 onClick={() => setIsExpanded(!isExpanded)}
 >
 {isExpanded ? (
 <>
 <ChevronUp className="w-4 h-4" />
 {t('contactDirectory.interactions.show_less')}
 </>
 ) : (
 <>
 <ChevronDown className="w-4 h-4" />
 {t('contactDirectory.interactions.show_more')}
 </>
 )}
 </Button>
 )}
 </div>
 </Card>
 );
}

/**
 * Interaction Timeline Component
 */
export function InteractionTimeline({
 contactId,
 onEditNote,
 className,
}: InteractionTimelineProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';
 const locale = isRTL ? ar : enUS;

 const { data: notes, isLoading, error } = useInteractionNotes(contactId);
 const deleteNoteMutation = useDeleteNote();
 const downloadAttachmentMutation = useDownloadAttachment();

 const handleDelete = (noteId: string, contactId: string) => {
 if (window.confirm(t('contactDirectory.interactions.delete_confirm'))) {
 deleteNoteMutation.mutate({ id: noteId, contactId });
 }
 };

 const handleDownload = (path: string, filename: string) => {
 downloadAttachmentMutation.mutate({ path, filename });
 };

 if (isLoading) {
 return (
 <div className={cn('flex items-center justify-center py-8', className)} dir={isRTL ? 'rtl' : 'ltr'}>
 <div className="flex flex-col items-center gap-2">
 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
 <p className="text-sm text-muted-foreground">
 {t('contactDirectory.interactions.loading')}
 </p>
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className={cn('p-4 text-center', className)} dir={isRTL ? 'rtl' : 'ltr'}>
 <p className="text-sm text-destructive">
 {t('contactDirectory.interactions.error')}: {error.message}
 </p>
 </div>
 );
 }

 if (!notes || notes.length === 0) {
 return (
 <div
 className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
 <h3 className="text-base font-medium mb-2">
 {t('contactDirectory.interactions.no_notes_title')}
 </h3>
 <p className="text-sm text-muted-foreground max-w-sm">
 {t('contactDirectory.interactions.no_notes_description')}
 </p>
 </div>
 );
 }

 return (
 <div className={cn('space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Timeline Header */}
 <div className="flex items-center justify-between">
 <h3 className="text-base sm:text-lg font-semibold">
 {t('contactDirectory.interactions.timeline_title')}
 </h3>
 <Badge variant="secondary" className="text-xs">
 {t('contactDirectory.interactions.notes_count', { count: notes.length })}
 </Badge>
 </div>

 <Separator />

 {/* Timeline Items */}
 <div className="space-y-3 sm:space-y-4">
 {notes.map((note) => (
 <InteractionNoteItem
 key={note.id}
 note={note}
 isRTL={isRTL}
 locale={locale}
 onEdit={onEditNote}
 onDelete={handleDelete}
 onDownload={handleDownload}
 />
 ))}
 </div>
 </div>
 );
}
