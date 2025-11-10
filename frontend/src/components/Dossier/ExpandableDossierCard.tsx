/**
 * ExpandableDossierCard Component
 * Combines DossierAceternityCard design (map/flag) with Aceternity expandable card behavior
 *
 * Features:
 * - Clickable collapsed state showing map/flag, name, and brief info
 * - Expandable overlay showing full details
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Smooth animations with Framer Motion
 * - Keyboard navigation (ESC to close)
 * - Outside click to close
 */

import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useOutsideClick } from '@/hooks/use-outside-click';
import {
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  Clock,
  Eye,
  Edit,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DossierWithExtension, DossierType, DossierStatus } from '@/services/dossier-api';
import { getCountryCode } from '@/lib/country-codes';
import { CountryMapImage } from './CountryMapImage';

interface ExpandableDossierCardProps {
  dossier: DossierWithExtension;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onView?: (id: string, type?: DossierType) => void;
  onEdit?: (id: string) => void;
  onMouseEnter?: () => void;
  className?: string;
}

/**
 * Get type-specific icon component
 */
function getTypeIcon(type: DossierType, className?: string) {
  const iconProps = { className: className || 'h-4 w-4 sm:h-5 sm:w-5 text-white' };

  switch (type) {
    case 'country':
      return <Globe {...iconProps} />;
    case 'organization':
      return <Building2 {...iconProps} />;
    case 'forum':
      return <Users {...iconProps} />;
    case 'engagement':
      return <Calendar {...iconProps} />;
    case 'topic':
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
 * CountryFlag Component
 */
function CountryFlag({ countryName, className }: { countryName: string | null | undefined; className?: string }) {
  const countryCode = getCountryCode(countryName);

  if (!countryCode) {
    return (
      <div className={cn("rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg", className)}>
        <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
    );
  }

  const flagPath = `/assets/flags/${countryCode}.svg`;

  return (
    <div className={cn("overflow-hidden rounded-full border-2 border-white/30 shadow-lg", className)}>
      <img
        src={flagPath}
        alt={countryName || 'Country flag'}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.className = cn("rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg", className);
            const icon = document.createElement('div');
            icon.innerHTML = '<svg class="h-5 w-5 sm:h-6 sm:w-6 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';
            parent.appendChild(icon);
          }
        }}
      />
    </div>
  );
}

/**
 * Get type-specific gradient background
 */
function getTypeGradient(type: DossierType): string {
  switch (type) {
    case 'country':
      return 'from-blue-500/90 via-blue-600/80 to-blue-700/70';
    case 'organization':
      return 'from-purple-500/90 via-purple-600/80 to-purple-700/70';
    case 'forum':
      return 'from-green-500/90 via-green-600/80 to-green-700/70';
    case 'engagement':
      return 'from-orange-500/90 via-orange-600/80 to-orange-700/70';
    case 'topic':
      return 'from-pink-500/90 via-pink-600/80 to-pink-700/70';
    case 'working_group':
      return 'from-indigo-500/90 via-indigo-600/80 to-indigo-700/70';
    case 'person':
      return 'from-teal-500/90 via-teal-600/80 to-teal-700/70';
    default:
      return 'from-gray-500/90 via-gray-600/80 to-gray-700/70';
  }
}

/**
 * Get status badge color
 */
function getStatusColor(status: DossierStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/90 text-white';
    case 'inactive':
      return 'bg-yellow-500/90 text-white';
    case 'archived':
      return 'bg-gray-500/90 text-white';
    default:
      return 'bg-gray-500/90 text-white';
  }
}

/**
 * Extract initials from name
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format date to relative time
 */
function formatRelativeTime(date: string, t: any): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('time.today');
  if (diffDays === 1) return t('time.yesterday');
  if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
  if (diffDays < 30) return t('time.weeksAgo', { count: Math.floor(diffDays / 7) });
  if (diffDays < 365) return t('time.monthsAgo', { count: Math.floor(diffDays / 30) });
  return t('time.yearsAgo', { count: Math.floor(diffDays / 365) });
}

export function ExpandableDossierCard({
  dossier,
  isActive,
  onActivate,
  onDeactivate,
  onView,
  onEdit,
  onMouseEnter,
  className,
}: ExpandableDossierCardProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  const displayName = isRTL ? dossier.name_ar : dossier.name_en;
  const displayDescription = isRTL ? dossier.description_ar : dossier.description_en;
  const relativeTime = formatRelativeTime(dossier.updated_at, t);
  const countryCode = dossier.type === 'country' ? getCountryCode(displayName) : null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isActive) {
        onDeactivate();
      }
    }

    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, onDeactivate]);

  useOutsideClick(ref, () => {
    if (isActive) onDeactivate();
  });

  return (
    <div
      className={cn("w-full", className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      onMouseEnter={onMouseEnter}
    >
      {/* Collapsed State - Clickable Card */}
      <motion.div
        layoutId={`card-${dossier.id}-${id}`}
        onClick={onActivate}
        className={cn(
          "cursor-pointer overflow-hidden relative group/card",
          "h-72 sm:h-80 rounded-2xl shadow-xl",
          "flex flex-col justify-between p-4 sm:p-6",
          "bg-gradient-to-br",
          getTypeGradient(dossier.type),
          "transition-transform duration-200",
          "hover:scale-[1.02]"
        )}
      >
        {/* Isolated country map (for country dossiers only) */}
        {dossier.type === 'country' && countryCode && (
          <CountryMapImage
            countryCode={countryCode}
            size="lg"
            showLoading={false}
            className="absolute inset-0 opacity-20 group-hover/card:opacity-30 transition-opacity duration-300"
          />
        )}

        {/* Hover overlay effect */}
        <div className="absolute w-full h-full top-0 start-0 transition duration-300 group-hover/card:bg-black/20 opacity-0 group-hover/card:opacity-100"></div>

        {/* Header section with avatar/icon and metadata */}
        <div className="flex flex-col gap-3 sm:gap-4 z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            {dossier.type === 'person' && (dossier.extension as any)?.photo_url ? (
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white/30 shadow-lg">
                <AvatarImage src={(dossier.extension as any).photo_url} alt={displayName || ''} />
                <AvatarFallback className="bg-white/20 text-white text-sm sm:text-base font-bold backdrop-blur-sm">
                  {displayName ? getInitials(displayName) : 'VIP'}
                </AvatarFallback>
              </Avatar>
            ) : dossier.type === 'country' ? (
              <CountryFlag
                countryName={displayName}
                className="h-12 w-12 sm:h-14 sm:w-14"
              />
            ) : (
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                {getTypeIcon(dossier.type)}
              </div>
            )}

            <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0">
              <Badge
                variant="secondary"
                className="w-fit text-xs sm:text-sm bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                {t(`type.${dossier.type}`)}
              </Badge>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{relativeTime}</span>
              </div>
            </div>

            <Badge
              className={cn(
                'text-xs sm:text-sm shrink-0 border-0',
                getStatusColor(dossier.status)
              )}
            >
              {t(`status.${dossier.status}`)}
            </Badge>
          </div>
        </div>

        {/* Content section */}
        <div className="text-content z-10">
          <motion.h1
            layoutId={`title-${dossier.id}-${id}`}
            className="font-bold text-xl sm:text-2xl md:text-3xl text-white relative line-clamp-2 text-start mb-2"
          >
            {displayName || t('untitled')}
          </motion.h1>
          {displayDescription && (
            <motion.p
              layoutId={`description-${dossier.id}-${id}`}
              className="font-normal text-sm sm:text-base text-white/90 relative line-clamp-2 text-start"
            >
              {displayDescription}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Expanded State - Full Overlay */}
      <AnimatePresence>
        {isActive && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm h-full w-full z-[100]"
            />

            {/* Expanded Card */}
            <div className="fixed inset-0 grid place-items-center z-[101] p-4">
              <motion.div
                ref={ref}
                layoutId={`card-${dossier.id}-${id}`}
                className="w-full max-w-2xl h-full md:h-fit md:max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* Close Button */}
                <motion.button
                  key={`button-${dossier.id}-${id}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  className={cn(
                    "absolute top-4 z-10",
                    "flex items-center justify-center",
                    "bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm",
                    "rounded-full h-8 w-8 sm:h-10 sm:w-10",
                    "shadow-lg",
                    "hover:bg-white dark:hover:bg-neutral-800",
                    "transition-colors duration-200",
                    isRTL ? 'start-4' : 'end-4'
                  )}
                  onClick={onDeactivate}
                  aria-label={t('action.close')}
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-700 dark:text-neutral-200" />
                </motion.button>

                {/* Header Image/Map */}
                <motion.div
                  layoutId={`image-${dossier.id}-${id}`}
                  className={cn(
                    "relative w-full h-48 sm:h-64 md:h-72",
                    "bg-gradient-to-br",
                    getTypeGradient(dossier.type),
                    "flex items-center justify-center"
                  )}
                >
                  {dossier.type === 'country' && countryCode && (
                    <CountryMapImage
                      countryCode={countryCode}
                      size="xl"
                      showLoading={false}
                      className="absolute inset-0 opacity-30"
                    />
                  )}

                  {/* Large Avatar/Icon/Flag */}
                  <div className="relative z-10">
                    {dossier.type === 'person' && (dossier.extension as any)?.photo_url ? (
                      <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white/30 shadow-2xl">
                        <AvatarImage src={(dossier.extension as any).photo_url} alt={displayName || ''} />
                        <AvatarFallback className="bg-white/20 text-white text-3xl font-bold backdrop-blur-sm">
                          {displayName ? getInitials(displayName) : 'VIP'}
                        </AvatarFallback>
                      </Avatar>
                    ) : dossier.type === 'country' ? (
                      <CountryFlag
                        countryName={displayName}
                        className="h-24 w-24 sm:h-32 sm:w-32"
                      />
                    ) : (
                      <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                        {getTypeIcon(dossier.type, 'h-12 w-12 sm:h-16 sm:w-16')}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      {/* Title and Badges */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge
                            variant="secondary"
                            className="text-xs sm:text-sm"
                          >
                            {t(`type.${dossier.type}`)}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-xs sm:text-sm border-0',
                              getStatusColor(dossier.status)
                            )}
                          >
                            {t(`status.${dossier.status}`)}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{relativeTime}</span>
                          </div>
                        </div>

                        <motion.h3
                          layoutId={`title-${dossier.id}-${id}`}
                          className="font-bold text-2xl sm:text-3xl md:text-4xl text-start mb-2"
                        >
                          {displayName || t('untitled')}
                        </motion.h3>

                        <motion.p
                          layoutId={`description-${dossier.id}-${id}`}
                          className="text-sm sm:text-base text-muted-foreground text-start"
                        >
                          {displayDescription}
                        </motion.p>
                      </div>

                      {/* Tags */}
                      {dossier.tags && dossier.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {dossier.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground text-start">
                            {t('detail.id')}
                          </span>
                          <span className="text-sm font-mono text-start">
                            {dossier.id}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground text-start">
                            {t('detail.updated')}
                          </span>
                          <span className="text-sm text-start">
                            {new Date(dossier.updated_at).toLocaleDateString(
                              i18n.language,
                              { year: 'numeric', month: 'long', day: 'numeric' }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4"
                      >
                        {onView && (
                          <Button
                            onClick={() => onView(dossier.id, dossier.type)}
                            className="flex-1"
                          >
                            <Eye className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {t('action.viewDetails')}
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="outline"
                            onClick={() => onEdit(dossier.id)}
                            className="flex-1"
                          >
                            <Edit className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                            {t('action.edit')}
                          </Button>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
