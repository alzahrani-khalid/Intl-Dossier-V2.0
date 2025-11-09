import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Tag } from 'lucide-react';
import type { Dossier } from '../types/dossier';
import { getCountryCode } from '../lib/country-codes';

interface DossierCardProps {
 dossier: Dossier;
}

export function DossierCard({ dossier }: DossierCardProps) {
 const { t, i18n } = useTranslation('dossiers');
 const navigate = useNavigate();
 const isRTL = i18n.language === 'ar';

 const handleClick = () => {
 navigate({ to: `/dossiers/${dossier.id}` });
 };

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 handleClick();
 }
 };

 // Get bilingual name
 const name = isRTL ? dossier.name_ar : dossier.name_en;

 // Get country code for flag display (only for country type)
 const countryCode = dossier.type === 'country' ? getCountryCode(name) : null;

 // Get summary preview (first 100 chars)
 const summary = isRTL ? dossier.summary_ar : dossier.summary_en;
 const summaryPreview = summary
 ? summary.length > 100
 ? `${summary.substring(0, 100)}...`
 : summary
 : null;

 // Convert sensitivity level to string for translation lookup
 const sensitivityKey = String(dossier.sensitivity_level);

 // Get custom badge classes based on sensitivity level
 const getSensitivityBadgeClass = (level: string | number): string => {
 const levelStr = String(level);
 // Handle numeric sensitivity levels (0-5)
 if (['5'].includes(levelStr)) {
 // Restricted - Deep Purple/Black (highest security)
 return 'bg-purple-950 text-white border-0';
 } else if (['4'].includes(levelStr)) {
 // Top Secret - Dark Red
 return 'bg-red-900 text-white border-0';
 } else if (['3'].includes(levelStr)) {
 // Secret - Red
 return 'bg-red-600 text-white border-0';
 } else if (['2'].includes(levelStr)) {
 // Confidential - Orange/Amber
 return 'bg-orange-500 text-white border-0';
 } else if (['1'].includes(levelStr)) {
 // Internal - Blue
 return 'bg-blue-500 text-white border-0';
 } else if (['0'].includes(levelStr)) {
 // Public - Green
 return 'bg-green-500 text-white border-0';
 }
 // Handle string sensitivity levels (legacy)
 switch (levelStr) {
 case 'high':
 return 'bg-red-600 text-white border-0';
 case 'medium':
 return 'bg-orange-500 text-white border-0';
 case 'low':
 default:
 return 'bg-green-500 text-white border-0';
 }
 };

 // Get type badge color - Analogous color scheme (extra light)
 const getTypeBadgeClass = (type: string): string => {
 switch (type) {
 case 'country':
 return 'bg-blue-50 text-blue-700 border-blue-200';
 case 'organization':
 return 'bg-emerald-50 text-emerald-700 border-emerald-200';
 case 'forum':
 return 'bg-violet-50 text-violet-700 border-violet-200';
 case 'theme':
 return 'bg-amber-50 text-amber-700 border-amber-200';
 default:
 return 'bg-gray-50 text-gray-700 border-gray-200';
 }
 };


 return (
 <Card
 role="button"
 tabIndex={0}
 onClick={handleClick}
 onKeyDown={handleKeyDown}
 className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
 aria-label={t('viewDetails') + ': ' + name}
 >
 <CardHeader className="pb-3">
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 space-y-2">
 <CardTitle className="flex items-center text-base sm:text-lg">
 {countryCode && (
 <span
 className={`fi fi-${countryCode} shrink-0 rounded-sm`}
 style={{
 width: '2em',
 height: '1.5em',
 display: 'inline-block',
 backgroundSize: 'contain',
 boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1)',
 border: '1px solid rgba(0, 0, 0, 0.1)',
 marginInlineEnd: '1rem',
 flexShrink: 0
 }}
 aria-hidden="true"
 />
 )}
 <span className="line-clamp-2 leading-tight">{name}</span>
 </CardTitle>
 <div className="flex flex-wrap items-center gap-2">
 <Badge
 variant="outline"
 className={`${getTypeBadgeClass(dossier.type)} text-xs`}
 aria-label={`${t('fields.type')}: ${t(`types.${dossier.type}`)}`}
 >
 {t(`types.${dossier.type}`)}
 </Badge>
 </div>
 </div>
 <div className="flex flex-col items-end gap-2 shrink-0">
 <Badge
 variant="none"
 className={`whitespace-nowrap text-xs font-semibold ${getSensitivityBadgeClass(sensitivityKey)}`}
 aria-label={`${t('fields.sensitivity')}: ${t(`sensitivity.${sensitivityKey}`)}`}
 >
 {t(`sensitivity.${sensitivityKey}`)}
 </Badge>
 <Badge
 variant="secondary"
 className="text-xs"
 aria-label={`${t('fields.status')}: ${t(`statuses.${dossier.status}`)}`}
 >
 {t(`statuses.${dossier.status}`)}
 </Badge>
 </div>
 </div>
 </CardHeader>

 {summaryPreview && (
 <CardContent className="pb-4">
 <CardDescription className="line-clamp-2 text-sm leading-relaxed">
 {summaryPreview}
 </CardDescription>
 </CardContent>
 )}

 <CardFooter className="flex flex-col items-start gap-3 pt-0">
 {/* Tags */}
 {dossier.tags && dossier.tags.length > 0 && (
 <div className="flex flex-wrap items-center gap-1.5 w-full">
 <Tag className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
 {dossier.tags.slice(0, 3).map((tag, index) => (
 <Badge
 key={index}
 variant="outline"
 className="text-xs"
 aria-label={`${t('fields.tags')}: ${tag}`}
 >
 {tag}
 </Badge>
 ))}
 {dossier.tags.length > 3 && (
 <Badge variant="secondary" className="text-xs">
 +{dossier.tags.length - 3}
 </Badge>
 )}
 </div>
 )}

 {/* Metadata */}
 <div className="flex items-center justify-between gap-2 w-full text-xs text-muted-foreground">
 <span className="font-medium">
 {t('fields.version')} {dossier.version}
 </span>
 <div className="flex items-center gap-1.5">
 <Calendar className="size-3.5" aria-hidden="true" />
 <time dateTime={dossier.updated_at}>
 {new Date(dossier.updated_at).toLocaleDateString(i18n.language, {
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })}
 </time>
 </div>
 </div>
 </CardFooter>
 </Card>
 );
}
