/**
 * Link Card Component
 * Feature: 024-intake-entity-linking
 * Task: T046
 *
 * Mobile-first, RTL-compatible card for displaying entity links
 * with 44x44px touch targets and inline note editing
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, RotateCcw, Edit2, Check, X, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LinkTypeBadge } from './LinkTypeBadge';
import { cn } from '@/lib/utils';
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { EntityLink } from '../../../../backend/src/types/intake-entity-links.types';

export interface LinkCardProps {
 /** Entity link data */
 link: EntityLink;
 /** Whether the link is deleted (soft delete) */
 isDeleted?: boolean;
 /** Whether user can restore deleted links (steward+ role) */
 canRestore?: boolean;
 /** Whether drag-and-drop is enabled */
 isDraggable?: boolean;
 /** Callback when delete is requested */
 onDelete?: (linkId: string) => void;
 /** Callback when restore is requested */
 onRestore?: (linkId: string) => void;
 /** Callback when notes are updated */
 onUpdateNotes?: (linkId: string, notes: string) => void;
 /** Additional CSS classes */
 className?: string;
}

/**
 * LinkCard Component
 *
 * Displays an individual entity link with actions.
 * Supports mobile-first responsive design, RTL layouts, and touch interactions.
 *
 * @example
 * ```tsx
 * <LinkCard
 * link={entityLink}
 * onDelete={(id) => deleteMutation.mutate(id)}
 * onUpdateNotes={(id, notes) => updateMutation.mutate({ notes })}
 * />
 * ```
 */
export function LinkCard({
 link,
 isDeleted = false,
 canRestore = false,
 isDraggable = false,
 onDelete,
 onRestore,
 onUpdateNotes,
 className,
}: LinkCardProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [isEditing, setIsEditing] = useState(false);
 const [notesValue, setNotesValue] = useState(link.notes || '');
 const [showDeleteDialog, setShowDeleteDialog] = useState(false);

 // Handle save notes
 const handleSaveNotes = () => {
 if (onUpdateNotes && notesValue !== link.notes) {
 onUpdateNotes(link.id, notesValue);
 }
 setIsEditing(false);
 };

 // Handle cancel edit
 const handleCancelEdit = () => {
 setNotesValue(link.notes || '');
 setIsEditing(false);
 };

 // Handle delete confirmation
 const handleDelete = () => {
 if (onDelete) {
 onDelete(link.id);
 }
 setShowDeleteDialog(false);
 };

 return (
 <>
 <Card
 className={cn(
 // Base styles (mobile-first)
 'w-full',
 'transition-all duration-200',

 // Deleted state styling
 isDeleted && 'opacity-60 bg-slate-50 dark:bg-slate-900',

 // Hover effects (desktop only)
 !isDeleted && 'hover:shadow-md',

 // Custom classes
 className
 )}
 // Accessibility
 role="article"
 aria-label={t('entityLinks.linkCard', { entity: link.entity_id })}
 >
 <CardHeader
 className={cn(
 // Mobile-first padding
 'px-3 py-3 sm:px-4 sm:py-4',
 'flex flex-row items-center gap-2 sm:gap-3',

 // RTL support
 isRTL && 'flex-row-reverse'
 )}
 >
 {/* Drag handle (if draggable) - 44x44px touch target */}
 {isDraggable && !isDeleted && (
 <button
 className={cn(
 'flex items-center justify-center',
 'min-h-11 min-w-11', // 44px minimum touch target
 'touch-manipulation', // Optimize for touch
 'cursor-grab active:cursor-grabbing',
 'text-slate-400 hover:text-slate-600',
 'transition-colors duration-200',
 '-my-2', // Compensate for card padding

 // RTL support
 isRTL ? '-me-1' : '-ms-1'
 )}
 aria-label={t('entityLinks.dragHandle')}
 // Drag handle functionality will be added by parent (LinkList)
 >
 <GripVertical className="h-5 w-5" />
 </button>
 )}

 {/* Entity info */}
 <div className="flex-1 min-w-0">
 {/* First line: Entity name (full width for more space) */}
 <h3
 className={cn(
 'text-sm sm:text-base font-medium',
 'truncate',
 'text-start',
 'mb-1',
 isDeleted && 'line-through'
 )}
 >
 {/* Display entity name from enriched link data */}
 {(link as any).entity_name || link.entity_id}
 </h3>

 {/* Second line: Badge + Entity type (same line, same size) */}
 <div className={cn(
 'flex items-center gap-2',
 isRTL && 'flex-row-reverse'
 )}>
 <LinkTypeBadge
 linkType={link.link_type}
 size="sm"
 />
 <p className={cn(
 'text-xs sm:text-sm text-slate-500 dark:text-slate-400',
 'text-start'
 )}>
 {t(`entityLinks.entityTypes.${link.entity_type}`)}
 </p>
 </div>
 </div>

 {/* Action buttons - 44x44px touch targets */}
 <div className={cn(
 'flex items-center gap-1 sm:gap-2',

 // RTL support
 isRTL && 'flex-row-reverse'
 )}>
 {!isDeleted && (
 <>
 {/* Edit notes button */}
 {onUpdateNotes && (
 <Button
 variant="ghost"
 size="icon"
 className={cn(
 'min-h-11 min-w-11', // 44px touch target
 'touch-manipulation'
 )}
 onClick={() => setIsEditing(!isEditing)}
 aria-label={t('entityLinks.editNotes')}
 >
 <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
 </Button>
 )}

 {/* Delete button */}
 {onDelete && (
 <Button
 variant="ghost"
 size="icon"
 className={cn(
 'min-h-11 min-w-11', // 44px touch target
 'touch-manipulation',
 'text-red-600 hover:text-red-700 hover:bg-red-50'
 )}
 onClick={() => setShowDeleteDialog(true)}
 aria-label={t('entityLinks.deleteLink')}
 >
 <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
 </Button>
 )}
 </>
 )}

 {/* Restore button (deleted links, steward+ only) */}
 {isDeleted && canRestore && onRestore && (
 <Button
 variant="outline"
 size="sm"
 className={cn(
 'min-h-11 px-3 sm:px-4', // 44px height touch target
 'touch-manipulation',
 'text-blue-600 border-blue-300 hover:bg-blue-50'
 )}
 onClick={() => onRestore(link.id)}
 aria-label={t('entityLinks.restoreLink')}
 >
 <RotateCcw className={cn(
 'h-4 w-4',
 isRTL ? 'ms-2' : 'me-2'
 )} />
 <span className="text-xs sm:text-sm">
 {t('entityLinks.restore')}
 </span>
 </Button>
 )}
 </div>
 </CardHeader>

 {/* Notes section (always visible or editable) */}
 {(link.notes || isEditing) && (
 <CardContent className={cn(
 'px-3 py-0 pb-3 sm:px-4 sm:pb-4',
 'pt-0'
 )}>
 {isEditing ? (
 <div className="space-y-2">
 <Textarea
 value={notesValue}
 onChange={(e) => setNotesValue(e.target.value)}
 placeholder={t('entityLinks.notesPlaceholder')}
 className={cn(
 'text-sm resize-none',
 'min-h-20 sm:min-h-24',
 'text-start',
 isRTL && 'text-end'
 )}
 maxLength={1000}
 dir={isRTL ? 'rtl' : 'ltr'}
 aria-label={t('entityLinks.notesInput')}
 />

 {/* Character count */}
 <div className={cn(
 'flex items-center justify-between gap-2',
 'text-xs text-slate-500',
 isRTL && 'flex-row-reverse'
 )}>
 <span className="text-start">
 {notesValue.length}/1000
 </span>

 {/* Save/Cancel buttons - 44px touch targets */}
 <div className={cn(
 'flex gap-2',
 isRTL && 'flex-row-reverse'
 )}>
 <Button
 variant="ghost"
 size="sm"
 className={cn(
 'min-h-11 px-3', // 44px touch target
 'touch-manipulation'
 )}
 onClick={handleCancelEdit}
 aria-label={t('common.cancel')}
 >
 <X className={cn(
 'h-4 w-4',
 isRTL ? 'ms-1' : 'me-1'
 )} />
 <span className="text-xs sm:text-sm">
 {t('common.cancel')}
 </span>
 </Button>

 <Button
 variant="default"
 size="sm"
 className={cn(
 'min-h-11 px-3', // 44px touch target
 'touch-manipulation'
 )}
 onClick={handleSaveNotes}
 aria-label={t('common.save')}
 >
 <Check className={cn(
 'h-4 w-4',
 isRTL ? 'ms-1' : 'me-1'
 )} />
 <span className="text-xs sm:text-sm">
 {t('common.save')}
 </span>
 </Button>
 </div>
 </div>
 </div>
 ) : (
 <p className={cn(
 'text-sm text-slate-600 dark:text-slate-300',
 'whitespace-pre-wrap',
 'text-start',
 isRTL && 'text-end'
 )}>
 {link.notes}
 </p>
 )}
 </CardContent>
 )}
 </Card>

 {/* Delete confirmation dialog */}
 <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
 <AlertDialogContent className={cn(
 'max-w-md mx-4 sm:mx-auto',
 isRTL && 'text-end'
 )}>
 <AlertDialogHeader>
 <AlertDialogTitle className="text-start">
 {t('entityLinks.deleteConfirmTitle')}
 </AlertDialogTitle>
 <AlertDialogDescription className="text-start">
 {t('entityLinks.deleteConfirmDescription')}
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter className={cn(
 isRTL && 'flex-row-reverse'
 )}>
 <AlertDialogCancel className=" touch-manipulation">
 {t('common.cancel')}
 </AlertDialogCancel>
 <AlertDialogAction
 className=" touch-manipulation bg-red-600 hover:bg-red-700"
 onClick={handleDelete}
 >
 {t('common.delete')}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </>
 );
}

export default LinkCard;
