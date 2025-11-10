import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreVertical, Edit, Archive, FileText, Globe } from 'lucide-react';
import type { Dossier } from '../types/dossier';
import { switchLanguage } from '../i18n';

interface DossierHeaderProps {
 dossier: Dossier;
 onEdit?: () => void;
 onArchive?: () => void;
 onGenerateBrief?: () => void;
}

export function DossierHeader({
 dossier,
 onEdit,
 onArchive,
 onGenerateBrief,
}: DossierHeaderProps) {
 const { t, i18n } = useTranslation('dossiers');
 const isRTL = i18n.language === 'ar';

 const name = isRTL ? dossier.name_ar : dossier.name_en;

 const handleLanguageToggle = async () => {
 const newLang = i18n.language === 'en' ? 'ar' : 'en';
 await switchLanguage(newLang);
 };

 // Get badge variant based on sensitivity
 const getSensitivityVariant = (level: string): 'default' | 'secondary' | 'destructive' => {
 switch (level) {
 case 'high':
 return 'destructive';
 case 'medium':
 return 'default';
 case 'low':
 default:
 return 'secondary';
 }
 };

 // Get type badge color
 const getTypeBadgeClass = (type: string): string => {
 switch (type) {
 case 'country':
 return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
 case 'organization':
 return 'bg-green-100 text-green-800 hover:bg-green-200';
 case 'forum':
 return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
 case 'theme':
 return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
 default:
 return '';
 }
 };

 return (
 <div className="border-b bg-background">
 <div className="flex flex-col gap-4 p-6">
 {/* Top Row: Title and Actions */}
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <h1 className="mb-2 truncate text-3xl font-bold tracking-tight">
 {name}
 </h1>
 <div className="flex flex-wrap gap-2">
 <Badge
 className={getTypeBadgeClass(dossier.type)}
 aria-label={`${t('fields.type')}: ${t(`types.${dossier.type}`)}`}
 >
 {t(`types.${dossier.type}`)}
 </Badge>
 <Badge
 variant="outline"
 aria-label={`${t('fields.status')}: ${t(`statuses.${dossier.status}`)}`}
 >
 {t(`statuses.${dossier.status}`)}
 </Badge>
 <Badge
 variant={getSensitivityVariant(dossier.sensitivity_level)}
 aria-label={`${t('fields.sensitivity')}: ${t(`sensitivity.${dossier.sensitivity_level}`)}`}
 >
 {t(`sensitivity.${dossier.sensitivity_level}`)}
 </Badge>
 <Badge
 variant="outline"
 className="text-xs"
 aria-label={`${t('fields.version')}: ${dossier.version}`}
 >
 v{dossier.version}
 </Badge>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex shrink-0 items-center gap-2">
 {/* Language Toggle */}
 <Button
 variant="outline"
 size="sm"
 onClick={handleLanguageToggle}
 className="gap-2"
 aria-label={t('languageToggle', { ns: 'translation' })}
 >
 <Globe className="size-4" />
 {i18n.language === 'en' ? 'عربي' : 'English'}
 </Button>

 {/* Generate Brief Button */}
 {onGenerateBrief && (
 <Button
 variant="default"
 size="sm"
 onClick={onGenerateBrief}
 className="gap-2"
 aria-label={t('generateBrief')}
 >
 <FileText className="size-4" />
 <span className="hidden sm:inline">{t('generateBrief')}</span>
 </Button>
 )}

 {/* More Actions Dropdown */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 aria-label={t('moreActions', { ns: 'translation' })}
 >
 <MoreVertical className="size-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
 {onEdit && (
 <DropdownMenuItem onClick={onEdit} className="gap-2">
 <Edit className="size-4" />
 {t('edit')}
 </DropdownMenuItem>
 )}
 {onArchive && (
 <DropdownMenuItem
 onClick={onArchive}
 className="gap-2 text-destructive focus:text-destructive"
 >
 <Archive className="size-4" />
 {t('archive')}
 </DropdownMenuItem>
 )}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>

 {/* Summary Section */}
 {(dossier.summary_en || dossier.summary_ar) && (
 <div className="border-t pt-4">
 <p className="text-sm leading-relaxed text-muted-foreground">
 {isRTL ? dossier.summary_ar : dossier.summary_en}
 </p>
 </div>
 )}

 {/* Metadata Row */}
 <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
 {dossier.tags && dossier.tags.length > 0 && (
 <div className="flex items-center gap-1">
 <span className="font-medium">{t('fields.tags')}:</span>
 <div className="flex flex-wrap gap-1">
 {dossier.tags.slice(0, 5).map((tag, index) => (
 <Badge key={index} variant="outline" className="text-xs">
 {tag}
 </Badge>
 ))}
 {dossier.tags.length > 5 && (
 <Badge variant="outline" className="text-xs">
 +{dossier.tags.length - 5}
 </Badge>
 )}
 </div>
 </div>
 )}
 <div className="flex items-center gap-1">
 <span className="font-medium">{t('fields.created')}:</span>
 <span>{new Date(dossier.created_at).toLocaleDateString(i18n.language)}</span>
 </div>
 <div className="flex items-center gap-1">
 <span className="font-medium">{t('fields.updated')}:</span>
 <span>{new Date(dossier.updated_at).toLocaleDateString(i18n.language)}</span>
 </div>
 {dossier.last_review_date && (
 <div className="flex items-center gap-1">
 <span className="font-medium">{t('fields.lastReview')}:</span>
 <span>{new Date(dossier.last_review_date).toLocaleDateString(i18n.language)}</span>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}