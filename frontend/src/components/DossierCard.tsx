import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Dossier } from '../types/dossier';

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
      return 'bg-purple-950 text-white border-0 shadow-md';
    } else if (['4'].includes(levelStr)) {
      // Top Secret - Dark Red
      return 'bg-red-900 text-white border-0 shadow-md';
    } else if (['3'].includes(levelStr)) {
      // Secret - Red
      return 'bg-red-600 text-white border-0 shadow-md';
    } else if (['2'].includes(levelStr)) {
      // Confidential - Orange/Amber
      return 'bg-orange-500 text-white border-0 shadow-md';
    } else if (['1'].includes(levelStr)) {
      // Internal - Blue
      return 'bg-blue-500 text-white border-0 shadow-sm';
    } else if (['0'].includes(levelStr)) {
      // Public - Green
      return 'bg-green-500 text-white border-0 shadow-sm';
    }
    // Handle string sensitivity levels (legacy)
    switch (levelStr) {
      case 'high':
        return 'bg-red-600 text-white border-0 shadow-md';
      case 'medium':
        return 'bg-orange-500 text-white border-0 shadow-md';
      case 'low':
      default:
        return 'bg-green-500 text-white border-0 shadow-sm';
    }
  };

  // Get type badge color - Analogous color scheme (extra light)
  const getTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'country':
        return 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm';
      case 'organization':
        return 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm';
      case 'forum':
        return 'bg-violet-50 text-violet-600 hover:bg-violet-100 shadow-sm';
      case 'theme':
        return 'bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-sm';
      default:
        return 'bg-gray-50 text-gray-600 hover:bg-gray-100 shadow-sm';
    }
  };

  // Get tag color based on tag content hash for consistency (extra light)
  const getTagColor = (tag: string, index: number): string => {
    const colors = [
      'bg-cyan-50 text-cyan-600',
      'bg-teal-50 text-teal-600',
      'bg-sky-50 text-sky-600',
      'bg-indigo-50 text-indigo-600',
      'bg-purple-50 text-purple-600',
      'bg-fuchsia-50 text-fuchsia-600',
      'bg-pink-50 text-pink-600',
      'bg-rose-50 text-rose-600',
      'bg-orange-50 text-orange-600',
      'bg-lime-50 text-lime-600',
    ];

    // Use tag hash to consistently assign colors
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="isolate group cursor-pointer transition-all duration-300 bg-white/70 backdrop-blur-xl shadow-lg ring-1 ring-white/30 hover:shadow-2xl hover:bg-white/80 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-2xl overflow-hidden border-0"
      aria-label={t('viewDetails') + ': ' + name}
    >
      <CardHeader className="pb-3 sm:pb-4 relative z-10">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <CardTitle className="line-clamp-2 text-lg sm:text-xl font-bold text-gray-900 leading-tight">
            {name}
          </CardTitle>
          <div className="flex shrink-0">
            <Badge
              variant="none"
              className={`whitespace-nowrap text-xs font-semibold ${getSensitivityBadgeClass(sensitivityKey)}`}
              aria-label={`${t('fields.sensitivity')}: ${t(`sensitivity.${sensitivityKey}`)}`}
            >
              {t(`sensitivity.${sensitivityKey}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        <div className="space-y-3 sm:space-y-4">
          {/* Type and Status */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="none"
              className={`${getTypeBadgeClass(dossier.type)} text-xs font-semibold`}
              aria-label={`${t('fields.type')}: ${t(`types.${dossier.type}`)}`}
            >
              {t(`types.${dossier.type}`)}
            </Badge>
            <Badge
              variant="none"
              className="bg-slate-50 text-slate-700 border-0 shadow-sm text-xs font-medium"
              aria-label={`${t('fields.status')}: ${t(`statuses.${dossier.status}`)}`}
            >
              {t(`statuses.${dossier.status}`)}
            </Badge>
          </div>

          {/* Summary Preview */}
          {summaryPreview && (
            <p className="line-clamp-2 text-sm text-gray-700 leading-relaxed">
              {summaryPreview}
            </p>
          )}

          {/* Tags */}
          {dossier.tags && dossier.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {dossier.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="none"
                  className={`text-xs border-0 shadow-sm font-medium ${getTagColor(tag, index)}`}
                  aria-label={`${t('fields.tags')}: ${tag}`}
                >
                  {tag}
                </Badge>
              ))}
              {dossier.tags.length > 3 && (
                <Badge variant="none" className="text-xs border-0 bg-gray-100 text-gray-700 shadow-sm font-medium">
                  +{dossier.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200/50 pt-3 text-xs text-gray-600">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold">
                {t('fields.version')} {dossier.version}
              </span>
              <span className="text-end font-medium">
                {new Date(dossier.updated_at).toLocaleDateString(i18n.language, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}