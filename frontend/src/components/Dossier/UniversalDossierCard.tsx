/**
 * UniversalDossierCard Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T053)
 *
 * Mobile-first, RTL-compatible card component for displaying any dossier type
 * with type badge, status indicator, and quick actions.
 *
 * Features:
 * - Responsive layout (320px mobile → desktop)
 * - RTL support via logical properties
 * - Type-specific icons and colors
 * - Touch-friendly action buttons (44x44px min)
 * - Accessibility compliant (WCAG AA)
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
 Globe,
 Building2,
 Users,
 Calendar,
 Target,
 Briefcase,
 User,
 Eye,
 Edit,
 Trash2,
 MoreVertical,
} from 'lucide-react';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DossierWithExtension, DossierType, DossierStatus } from '@/services/dossier-api';
import { Link } from '@tanstack/react-router';
import { WorldMapHighlight } from '@/components/Dossier/WorldMapHighlight';

interface UniversalDossierCardProps {
 dossier: DossierWithExtension;
 onView?: (id: string) => void;
 onEdit?: (id: string) => void;
 onDelete?: (id: string) => void;
 className?: string;
}

/**
 * Get type-specific icon component
 */
function getTypeIcon(type: DossierType) {
 const iconProps = { className: 'h-5 w-5 sm:h-6 sm:w-6' };

 switch (type) {
 case 'country':
 return <Globe {...iconProps} />;
 case 'organization':
 return <Building2 {...iconProps} />;
 case 'forum':
 return <Users {...iconProps} />;
 case 'engagement':
 return <Calendar {...iconProps} />;
 case 'theme':
 return <Target {...iconProps} />;
 case 'working_group':
 return <Briefcase {...iconProps} />;
 case 'person':
 return <User {...iconProps} />;
 default:
 return <Globe {...iconProps} />;
 }
}

/**
 * Get type-specific color classes
 */
function getTypeColor(type: DossierType): string {
 switch (type) {
 case 'country':
 return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
 case 'organization':
 return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
 case 'forum':
 return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
 case 'engagement':
 return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
 case 'theme':
 return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
 case 'working_group':
 return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
 case 'person':
 return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
 default:
 return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
 }
}

/**
 * Get status color classes
 */
function getStatusColor(status: DossierStatus): string {
 switch (status) {
 case 'active':
 return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
 case 'inactive':
 return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
 case 'archived':
 return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
 case 'deleted':
 return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
 default:
 return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
 }
}

/**
 * Extract initials from name (handles both English and Arabic)
 */
function getInitials(name: string): string {
 const words = name.trim().split(/\s+/);
 if (words.length === 1) {
 return words[0].slice(0, 2).toUpperCase();
 }
 return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export function UniversalDossierCard({
 dossier,
 onView,
 onEdit,
 onDelete,
 className,
}: UniversalDossierCardProps) {
 const { t, i18n } = useTranslation('dossier');
 const isRTL = i18n.language === 'ar';

 const displayName = isRTL ? dossier.name_ar : dossier.name_en;
 const displayDescription = isRTL ? dossier.description_ar : dossier.description_en;

 return (
 <Card
 className={cn(
 'flex flex-col gap-2 sm:gap-4',
 'transition-shadow hover:shadow-lg',
 'relative overflow-hidden',
 className
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {/* Country type: Show map as background */}
 {dossier.type === 'country' && (dossier.extension as any)?.iso_code_2 && (
 <div className="absolute inset-0 pointer-events-none opacity-10">
 <WorldMapHighlight
 countryCode={(dossier.extension as any).iso_code_2}
 className="h-full"
 />
 </div>
 )}

 <CardHeader className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-6 relative z-10">
 {/* Person type: Show avatar with info */}
 {dossier.type === 'person' && (dossier.extension as any)?.photo_url ? (
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
 {/* Avatar */}
 <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
 <AvatarImage src={(dossier.extension as any).photo_url} alt={displayName || ''} />
 <AvatarFallback className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 text-base font-semibold">
 {displayName ? getInitials(displayName) : 'VIP'}
 </AvatarFallback>
 </Avatar>

 {/* Name, title, and status */}
 <div className="flex-1 flex flex-col gap-1 min-w-0">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
 <CardTitle className="text-lg sm:text-xl md:text-2xl line-clamp-2 text-start">
 {displayName || t('untitled')}
 </CardTitle>
 <Badge
 variant="outline"
 className={cn('text-xs sm:text-sm w-fit', getStatusColor(dossier.status))}
 >
 {t(`status.${dossier.status}`)}
 </Badge>
 </div>

 {/* Title and organization for person type */}
 {(dossier.extension as any)?.title && (
 <CardDescription className="text-xs sm:text-sm text-start">
 {(dossier.extension as any).title}
 {(dossier.extension as any)?.organization_name &&
 ` • ${(dossier.extension as any).organization_name}`}
 </CardDescription>
 )}

 <CardDescription className="text-xs sm:text-sm text-start font-mono">
 {t('id')}: {dossier.id.slice(0, 8)}...
 </CardDescription>
 </div>
 </div>
 ) : (
 <>
 {/* Non-person types: Original layout */}
 <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-2">
 <div className={cn('p-2 rounded-md', getTypeColor(dossier.type))}>
 {getTypeIcon(dossier.type)}
 </div>
 <Badge variant="outline" className={cn('text-xs sm:text-sm', getTypeColor(dossier.type))}>
 {t(`type.${dossier.type}`)}
 </Badge>
 </div>

 <Badge
 variant="outline"
 className={cn('text-xs sm:text-sm w-fit', getStatusColor(dossier.status))}
 >
 {t(`status.${dossier.status}`)}
 </Badge>
 </div>

 {/* Title and ID */}
 <div className="flex flex-col gap-1">
 <CardTitle className="text-lg sm:text-xl md:text-2xl line-clamp-2 text-start">
 {displayName || t('untitled')}
 </CardTitle>
 <CardDescription className="text-xs sm:text-sm text-start font-mono">
 {t('id')}: {dossier.id.slice(0, 8)}...
 </CardDescription>
 </div>
 </>
 )}
 </CardHeader>

 {/* Description */}
 {displayDescription && (
 <CardContent className="px-4 sm:px-6 py-0">
 <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 text-start">
 {displayDescription}
 </p>
 </CardContent>
 )}

 {/* Tags */}
 {dossier.tags && dossier.tags.length > 0 && (
 <CardContent className="px-4 sm:px-6 py-0">
 <div className="flex flex-wrap gap-2">
 {dossier.tags.slice(0, 3).map((tag, index) => (
 <Badge key={index} variant="secondary" className="text-xs">
 {tag}
 </Badge>
 ))}
 {dossier.tags.length > 3 && (
 <Badge variant="secondary" className="text-xs">
 +{dossier.tags.length - 3}
 </Badge>
 )}
 </div>
 </CardContent>
 )}

 {/* Actions */}
 <CardFooter className="flex items-center justify-between gap-2 p-4 sm:p-6 pt-2 sm:pt-4">
 {/* Primary actions - touch-friendly */}
 <div className="flex gap-2">
 {onView && (
 <Button
 variant="default"
 size="sm"
 onClick={() => onView(dossier.id)}
 className=" px-3 sm:px-4"
 >
 <Eye className={cn('h-4 w-4', isRTL && 'rotate-180')} />
 <span className="hidden sm:inline ms-2">{t('action.view')}</span>
 </Button>
 )}

 {onEdit && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => onEdit(dossier.id)}
 className=" px-3 sm:px-4"
 >
 <Edit className="h-4 w-4" />
 <span className="hidden sm:inline ms-2">{t('action.edit')}</span>
 </Button>
 )}
 </div>

 {/* More actions dropdown */}
 {onDelete && (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className=" "
 aria-label={t('action.more')}
 >
 <MoreVertical className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
 <DropdownMenuItem
 onClick={() => onDelete(dossier.id)}
 className="text-destructive focus:text-destructive"
 >
 <Trash2 className="h-4 w-4 me-2" />
 {t('action.delete')}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 )}
 </CardFooter>
 </Card>
 );
}

/**
 * Compact variant for list views
 */
export function UniversalDossierCardCompact({
 dossier,
 onView,
 className,
}: Omit<UniversalDossierCardProps, 'onEdit' | 'onDelete'>) {
 const { t, i18n } = useTranslation('dossier');
 const isRTL = i18n.language === 'ar';
 const displayName = isRTL ? dossier.name_ar : dossier.name_en;

 return (
 <Link
 to="/dossiers/$dossierId"
 params={{ dossierId: dossier.id }}
 className={cn(
 'flex items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent transition-colors',
 'min-h-16 sm:min-h-20',
 className
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {/* Icon or Avatar for person type */}
 {dossier.type === 'person' ? (
 <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
 <AvatarImage src={(dossier.extension as any)?.photo_url} alt={displayName || ''} />
 <AvatarFallback className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 text-sm font-semibold">
 {displayName ? getInitials(displayName) : 'VIP'}
 </AvatarFallback>
 </Avatar>
 ) : (
 <div className={cn('p-2 rounded-md shrink-0', getTypeColor(dossier.type))}>
 {getTypeIcon(dossier.type)}
 </div>
 )}

 {/* Content */}
 <div className="flex-1 min-w-0 flex flex-col gap-1">
 <div className="flex items-center gap-2">
 <span className="text-sm sm:text-base font-medium truncate text-start">
 {displayName || t('untitled')}
 </span>
 <Badge variant="outline" className={cn('text-xs shrink-0', getStatusColor(dossier.status))}>
 {t(`status.${dossier.status}`)}
 </Badge>
 </div>
 <span className="text-xs sm:text-sm text-muted-foreground text-start">
 {dossier.type === 'person' && (dossier.extension as any)?.title
 ? `${(dossier.extension as any).title} • ${dossier.id.slice(0, 8)}`
 : `${t(`type.${dossier.type}`)} • ${dossier.id.slice(0, 8)}`}
 </span>
 </div>

 {/* Action indicator */}
 <Eye className={cn('h-5 w-5 shrink-0 text-muted-foreground', isRTL && 'rotate-180')} />
 </Link>
 );
}
