/**
 * DossierAceternityCard Component
 * Aceternity UI-inspired card with background image and overlay effect
 *
 * Features:
 * - Background image with hover overlay effect
 * - Avatar/Icon display
 * - Type badge and metadata
 * - Mobile-first and RTL-compatible
 * - Touch-friendly interactions
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DossierWithExtension, DossierType, DossierStatus } from '@/services/dossier-api';
import { Link } from '@tanstack/react-router';
import { getCountryCode } from '@/lib/country-codes';
import { CountryMapImage } from './CountryMapImage';

interface DossierAceternityCardProps {
  dossier: DossierWithExtension;
  onView?: (id: string) => void;
  className?: string;
}

/**
 * Get type-specific icon component
 */
function getTypeIcon(type: DossierType) {
  const iconProps = { className: 'h-4 w-4 sm:h-5 sm:w-5 text-white' };

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
 * CountryFlag Component
 * Displays country flag from local SVG assets
 */
interface CountryFlagProps {
  countryName: string | null | undefined;
  className?: string;
}

function CountryFlag({ countryName, className }: CountryFlagProps) {
  const countryCode = getCountryCode(countryName);

  if (!countryCode) {
    // Fallback to Globe icon if country code not found
    return (
      <div className={cn("rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg", className)}>
        <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
    );
  }

  // Use local SVG flag from public/assets/flags
  const flagPath = `/assets/flags/${countryCode}.svg`;

  return (
    <div className={cn("overflow-hidden rounded-full border-2 border-white/30 shadow-lg", className)}>
      <img
        src={flagPath}
        alt={countryName || 'Country flag'}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to Globe icon if flag image fails to load
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
    case 'theme':
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

export function DossierAceternityCard({
  dossier,
  onView,
  className,
}: DossierAceternityCardProps) {
  const { t, i18n } = useTranslation('dossiers');
  const isRTL = i18n.language === 'ar';

  const displayName = isRTL ? dossier.name_ar : dossier.name_en;
  const displayDescription = isRTL ? dossier.description_ar : dossier.description_en;
  const relativeTime = formatRelativeTime(dossier.updated_at, t);

  const handleClick = () => {
    if (onView) {
      onView(dossier.id);
    }
  };

  // Get country code for world map highlighting
  const countryCode = dossier.type === 'country' ? getCountryCode(displayName) : null;

  return (
    <div className={cn("w-full group/card", className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer overflow-hidden relative card h-80 sm:h-96 rounded-2xl shadow-xl",
          "flex flex-col justify-between p-4 sm:p-6",
          "bg-gradient-to-br",
          getTypeGradient(dossier.type)
        )}
      >
        {/* Isolated country map (for country dossiers only) */}
        {countryCode && (
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
          {/* Avatar or Icon with name */}
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

            {/* Type and Status Badges */}
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

            {/* Status Badge */}
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
          <h1 className="font-bold text-xl sm:text-2xl md:text-3xl text-white relative line-clamp-2 text-start mb-2 sm:mb-3">
            {displayName || t('untitled')}
          </h1>
          {displayDescription && (
            <p className="font-normal text-sm sm:text-base text-white/90 relative line-clamp-3 text-start">
              {displayDescription}
            </p>
          )}

          {/* Tags */}
          {dossier.tags && dossier.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {dossier.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm"
                >
                  {tag}
                </Badge>
              ))}
              {dossier.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-sm"
                >
                  +{dossier.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
