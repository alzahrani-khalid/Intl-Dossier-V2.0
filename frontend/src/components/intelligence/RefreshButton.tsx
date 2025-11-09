/**
 * RefreshButton Component
 * Feature: 029-dynamic-country-intelligence
 *
 * Manual refresh button with loading states and intelligence type selection.
 * Supports selective refresh for individual intelligence types.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { IntelligenceType } from '@/types/intelligence-reports.types';

export interface RefreshButtonProps {
  /** Current intelligence types to refresh */
  intelligenceTypes?: IntelligenceType[];

  /** Callback when refresh is triggered */
  onRefresh: (types: IntelligenceType[]) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Show dropdown for selective refresh */
  showTypeSelection?: boolean;

  /** Additional CSS classes */
  className?: string;
}

const INTELLIGENCE_TYPE_LABELS: Record<IntelligenceType, { en: string; ar: string }> = {
  economic: { en: 'Economic', ar: 'اقتصادي' },
  political: { en: 'Political', ar: 'سياسي' },
  security: { en: 'Security', ar: 'أمني' },
  bilateral: { en: 'Bilateral', ar: 'ثنائي' },
  general: { en: 'General', ar: 'عام' },
};

export function RefreshButton({
  intelligenceTypes = ['economic', 'political', 'security', 'bilateral'],
  onRefresh,
  isLoading = false,
  disabled = false,
  showTypeSelection = true,
  className,
}: RefreshButtonProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const handleRefreshAll = () => {
    onRefresh(intelligenceTypes);
  };

  const handleRefreshType = (type: IntelligenceType) => {
    onRefresh([type]);
  };

  if (!showTypeSelection) {
    // Simple refresh button without dropdown
    return (
      <Button
        onClick={handleRefreshAll}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
        className={`min-h-11 min-w-11 gap-2 ${className || ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
        aria-label={t('intelligence.refreshButtonLabel', 'Refresh intelligence data')}
        aria-busy={isLoading}
      >
        <RefreshCw
          className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
        />
        <span className="text-sm sm:text-base">
          {isLoading ? t('intelligence.refreshing') : t('intelligence.refresh')}
        </span>
      </Button>
    );
  }

  return (
    <div className="flex flex-row gap-0" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main refresh button */}
      <Button
        onClick={handleRefreshAll}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
        className="min-h-11 gap-2 rounded-e-none border-e-0"
        aria-label={t('intelligence.refreshAllLabel', 'Refresh all intelligence types')}
        aria-busy={isLoading}
      >
        <RefreshCw
          className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
        />
        <span className="hidden text-sm sm:inline sm:text-base">
          {isLoading ? t('intelligence.refreshing') : t('intelligence.refreshAll')}
        </span>
        <span className="text-sm sm:hidden sm:text-base">
          {isLoading ? t('intelligence.refreshing') : t('intelligence.refresh')}
        </span>
      </Button>

      {/* Dropdown for selective refresh */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 min-w-11 rounded-s-none px-2"
            disabled={disabled || isLoading}
            aria-label={t('intelligence.selectType')}
          >
            <ChevronDown className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
          <DropdownMenuItem
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t('intelligence.refreshAll')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {intelligenceTypes.map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => handleRefreshType(type)}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>
                {isRTL
                  ? INTELLIGENCE_TYPE_LABELS[type].ar
                  : INTELLIGENCE_TYPE_LABELS[type].en}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
