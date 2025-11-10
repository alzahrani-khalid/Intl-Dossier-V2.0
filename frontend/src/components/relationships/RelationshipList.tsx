// T070: RelationshipList Component - User Story 2
// Mobile-first, RTL-compliant component for displaying bidirectional relationships
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
 ArrowRight,
 ArrowLeft,
 Calendar,
 FileText,
 Trash2,
 Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RelationshipWithDossiers {
 id: string;
 source_dossier_id: string;
 target_dossier_id: string;
 relationship_type: string;
 relationship_metadata?: Record<string, unknown>;
 notes_en?: string;
 notes_ar?: string;
 effective_from?: string;
 effective_to?: string;
 status: 'active' | 'historical' | 'terminated';
 created_at: string;
 updated_at: string;
 direction?: 'outgoing' | 'incoming';
 related_dossier?: {
 id: string;
 type: string;
 name_en: string;
 name_ar: string;
 status: string;
 };
 source?: {
 id: string;
 type: string;
 name_en: string;
 name_ar: string;
 status: string;
 };
 target?: {
 id: string;
 type: string;
 name_en: string;
 name_ar: string;
 status: string;
 };
}

interface RelationshipListProps {
 dossierId: string;
 relationships: RelationshipWithDossiers[];
 onEdit?: (relationship: RelationshipWithDossiers) => void;
 onDelete?: (relationshipId: string) => Promise<void>;
 isLoading?: boolean;
 showActions?: boolean;
}

const DOSSIER_TYPE_COLORS: Record<string, string> = {
 country: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
 organization: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
 forum: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
 engagement: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
 theme: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
 working_group: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
 person: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

/**
 * RelationshipList - Mobile-first, RTL-compliant list component
 * Follows mobile-first design principles:
 * - Base styles for 320-640px (mobile)
 * - Progressive enhancement via Tailwind breakpoints
 * - Touch-friendly targets (min 44x44px)
 * - Logical properties for RTL support (ms-*, me-*, ps-*, pe-*)
 */
export function RelationshipList({
 relationships,
 onEdit,
 onDelete,
 isLoading = false,
 showActions = true,
}: RelationshipListProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const dateLocale = isRTL ? ar : enUS;

 if (isLoading) {
 return (
 <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {[1, 2, 3].map((i) => (
 <Card key={i} className="p-4 sm:p-6 animate-pulse">
 <div className="h-6 bg-muted rounded w-3/4 mb-4" />
 <div className="h-4 bg-muted rounded w-1/2" />
 </Card>
 ))}
 </div>
 );
 }

 if (!relationships || relationships.length === 0) {
 return (
 <Card
 className="p-6 sm:p-8 text-center"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
 <h3 className="text-base sm:text-lg font-medium mb-2">
 {t('relationship.list.empty.title')}
 </h3>
 <p className="text-sm text-muted-foreground">
 {t('relationship.list.empty.description')}
 </p>
 </Card>
 );
 }

 const formatDate = (dateString?: string) => {
 if (!dateString) return null;
 try {
 return format(new Date(dateString), 'PPP', { locale: dateLocale });
 } catch {
 return dateString;
 }
 };

 return (
 <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {relationships.map((relationship) => {
 const relatedDossier = relationship.related_dossier ||
 (relationship.direction === 'outgoing' ? relationship.target : relationship.source);

 const DirectionIcon = relationship.direction === 'outgoing'
 ? (isRTL ? ArrowLeft : ArrowRight)
 : (isRTL ? ArrowRight : ArrowLeft);

 return (
 <Card
 key={relationship.id}
 className="p-4 sm:p-6 hover:shadow-md transition-shadow"
 >
 {/* Header: Type badge + Direction indicator + Related dossier */}
 <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
 <div className="flex items-start gap-3 flex-1 min-w-0">
 {/* Direction indicator */}
 <div className="flex-shrink-0 mt-1">
 <DirectionIcon
 className={`h-5 w-5 sm:h-6 sm:w-6 ${
 relationship.direction === 'outgoing'
 ? 'text-blue-600 dark:text-blue-400'
 : 'text-green-600 dark:text-green-400'
 }`}
 />
 </div>

 {/* Related dossier info */}
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <Badge
 variant="outline"
 className={`text-xs ${
 relatedDossier
 ? DOSSIER_TYPE_COLORS[relatedDossier.type] || 'bg-gray-100'
 : 'bg-gray-100'
 }`}
 >
 {relatedDossier
 ? t(`dossier.types.${relatedDossier.type}`)
 : t('common.unknown')}
 </Badge>
 <Badge variant="secondary" className="text-xs">
 {t(`relationship.types.${relationship.relationship_type}`)}
 </Badge>
 </div>

 <h3 className="text-base sm:text-lg font-semibold text-start truncate">
 {relatedDossier
 ? isRTL
 ? relatedDossier.name_ar || relatedDossier.name_en
 : relatedDossier.name_en || relatedDossier.name_ar
 : t('common.unknown')}
 </h3>

 <p className="text-xs sm:text-sm text-muted-foreground text-start mt-1">
 {relationship.direction === 'outgoing'
 ? t('relationship.direction.outgoing')
 : t('relationship.direction.incoming')}
 </p>
 </div>
 </div>

 {/* Actions */}
 {showActions && (
 <div className="flex items-center gap-2 flex-shrink-0">
 {onEdit && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => onEdit(relationship)}
 className="h-9 w-9 p-0 sm:h-10 sm:w-10"
 aria-label={t('common.edit')}
 >
 <Edit className="h-4 w-4" />
 </Button>
 )}

 {onDelete && (
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-9 w-9 p-0 sm:h-10 sm:w-10 text-destructive hover:text-destructive"
 aria-label={t('common.delete')}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
 <AlertDialogHeader>
 <AlertDialogTitle className="text-start">
 {t('relationship.delete.confirm.title')}
 </AlertDialogTitle>
 <AlertDialogDescription className="text-start">
 {t('relationship.delete.confirm.description')}
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter className="flex-col sm:flex-row gap-2">
 <AlertDialogCancel className="mt-0">
 {t('common.cancel')}
 </AlertDialogCancel>
 <AlertDialogAction
 onClick={() => onDelete(relationship.id)}
 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
 >
 {t('common.delete')}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 )}
 </div>
 )}
 </div>

 {/* Notes section */}
 {(relationship.notes_en || relationship.notes_ar) && (
 <>
 <Separator className="my-3 sm:my-4" />
 <div className="text-sm text-muted-foreground text-start">
 <p className="whitespace-pre-wrap">
 {isRTL
 ? relationship.notes_ar || relationship.notes_en
 : relationship.notes_en || relationship.notes_ar}
 </p>
 </div>
 </>
 )}

 {/* Temporal info */}
 {(relationship.effective_from || relationship.effective_to) && (
 <>
 <Separator className="my-3 sm:my-4" />
 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
 {relationship.effective_from && (
 <div className="flex items-center gap-2">
 <Calendar className="h-4 w-4 flex-shrink-0" />
 <span>
 {t('relationship.effectiveFrom')}:{' '}
 {formatDate(relationship.effective_from)}
 </span>
 </div>
 )}
 {relationship.effective_to && (
 <div className="flex items-center gap-2">
 <Calendar className="h-4 w-4 flex-shrink-0" />
 <span>
 {t('relationship.effectiveTo')}:{' '}
 {formatDate(relationship.effective_to)}
 </span>
 </div>
 )}
 </div>
 </>
 )}

 {/* Status badge */}
 {relationship.status !== 'active' && (
 <div className="mt-3">
 <Badge
 variant={relationship.status === 'terminated' ? 'destructive' : 'secondary'}
 className="text-xs"
 >
 {t(`relationship.status.${relationship.status}`)}
 </Badge>
 </div>
 )}
 </Card>
 );
 })}
 </div>
 );
}
