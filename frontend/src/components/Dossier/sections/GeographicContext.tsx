/**
 * Geographic Context Section (Feature 028 + 029 - User Story 1 + 4 - T021, T058, T060)
 *
 * Displays country extension fields:
 * - ISO Code, Region, Capital
 * - Population, GDP
 * - Languages, Government Type
 *
 * Includes inline intelligence widgets:
 * - Economic intelligence (Feature 029 - User Story 4 - T058)
 * - Security intelligence (Feature 029 - User Story 4 - T060)
 *
 * Mobile-first layout with responsive grid
 * RTL text alignment with logical properties
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Globe2, MapPin, Users, DollarSign, Languages, Building2, Shield } from 'lucide-react';
import { IntelligenceInsight } from '@/components/intelligence/IntelligenceInsight';
import { useIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence';
import { Skeleton } from '@/components/ui/skeleton';
import type { CountryDossier } from '@/lib/dossier-type-guards';

interface GeographicContextProps {
  dossier: CountryDossier;
}

interface ContextField {
  icon: typeof Globe2;
  label: string;
  value: string | number | null | undefined;
  format?: 'number' | 'currency' | 'text';
}

export function GeographicContext({ dossier }: GeographicContextProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const extension = dossier.extension;

  // Guard: Check if extension data exists
  if (!extension) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Globe2 className="mb-4 size-12 text-muted-foreground sm:size-16" />
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('section.geographicContextEmpty')}
        </p>
      </div>
    );
  }

  // Format number with locale-aware separators
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return t('common.notAvailable');
    return new Intl.NumberFormat(i18n.language).format(num);
  };

  // Format currency (GDP)
  const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return t('common.notAvailable');
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Define all context fields matching database schema
  const fields: ContextField[] = [
    {
      icon: Globe2,
      label: t('field.isoCode'),
      value: extension.iso_code_2 || extension.iso_code_3,
      format: 'text',
    },
    {
      icon: MapPin,
      label: t('field.region'),
      value: extension.region || extension.subregion,
      format: 'text',
    },
    {
      icon: MapPin,
      label: t('field.capital'),
      value: isRTL ? extension.capital_ar : extension.capital_en,
      format: 'text',
    },
    {
      icon: Users,
      label: t('field.population'),
      value: extension.population,
      format: 'number',
    },
    {
      icon: MapPin,
      label: t('field.area'),
      value: extension.area_sq_km,
      format: 'number',
    },
  ];

  // Format value based on type
  const formatValue = (field: ContextField): string => {
    if (field.value === null || field.value === undefined) {
      return t('common.notAvailable');
    }

    if (field.format === 'number' && typeof field.value === 'number') {
      return formatNumber(field.value);
    }

    if (field.format === 'currency' && typeof field.value === 'number') {
      return formatCurrency(field.value);
    }

    return String(field.value);
  };

  // Check if extension has any data
  const hasData = fields.some((field) => field.value !== null && field.value !== undefined);

  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center sm:py-12"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Globe2 className="mb-4 size-12 text-muted-foreground sm:size-16" />
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('section.geographicContextEmpty')}
        </p>
      </div>
    );
  }

  // Fetch economic intelligence for inline widget (Feature 029 - User Story 4 - T058)
  const {
    data: economicIntelligence,
    isLoading: isLoadingEconomic,
    error: economicError,
  } = useIntelligence({
    entity_id: dossier.id,
    intelligence_type: 'economic',
  });

  // Refresh mutation for economic intelligence
  const { mutate: refreshEconomic, isPending: isRefreshingEconomic } = useRefreshIntelligence();

  const handleEconomicRefresh = () => {
    refreshEconomic({
      entity_id: dossier.id,
      intelligence_types: ['economic'],
    });
  };

  // Fetch security intelligence for inline widget (Feature 029 - User Story 4 - T060)
  const {
    data: securityIntelligence,
    isLoading: isLoadingSecurity,
    error: securityError,
  } = useIntelligence({
    entity_id: dossier.id,
    intelligence_type: 'security',
  });

  // Refresh mutation for security intelligence
  const { mutate: refreshSecurity, isPending: isRefreshingSecurity } = useRefreshIntelligence();

  const handleSecurityRefresh = () => {
    refreshSecurity({
      entity_id: dossier.id,
      intelligence_types: ['security'],
    });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Geographic Context Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {fields.map((field, index) => {
          const Icon = field.icon;
          const value = formatValue(field);
          const hasValue = field.value !== null && field.value !== undefined;

          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 sm:p-4"
            >
              <div className="mt-0.5 shrink-0">
                <Icon className="size-4 text-primary sm:size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">
                  {field.label}
                </p>
                {hasValue ? (
                  <p className="break-words text-sm font-semibold text-foreground sm:text-base">
                    {value}
                  </p>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {t('common.notAvailable')}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Economic Intelligence Widget (Feature 029 - User Story 4 - T058) */}
      <div className="w-full">
        <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">
          {t('intelligence.economic_insights', 'Economic Insights')}
        </h3>
        {isLoadingEconomic ? (
          <Skeleton className="h-48 w-full" />
        ) : economicIntelligence && economicIntelligence.data.length > 0 ? (
          <IntelligenceInsight
            intelligence={economicIntelligence.data[0]}
            onRefresh={handleEconomicRefresh}
            isRefreshing={isRefreshingEconomic}
            dossierType="countries"
            dossierId={dossier.id}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-8">
            <DollarSign className="mb-2 size-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {economicError
                ? t('intelligence.error_loading', 'Error loading intelligence')
                : t('intelligence.no_economic_data', 'No economic intelligence available')}
            </p>
          </div>
        )}
      </div>

      {/* Security Intelligence Widget (Feature 029 - User Story 4 - T060) */}
      <div className="w-full">
        <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">
          {t('intelligence.security_assessment', 'Security Assessment')}
        </h3>
        {isLoadingSecurity ? (
          <Skeleton className="h-48 w-full" />
        ) : securityIntelligence && securityIntelligence.data.length > 0 ? (
          <IntelligenceInsight
            intelligence={securityIntelligence.data[0]}
            onRefresh={handleSecurityRefresh}
            isRefreshing={isRefreshingSecurity}
            dossierType="countries"
            dossierId={dossier.id}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-8">
            <Shield className="mb-2 size-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              {securityError
                ? t('intelligence.error_loading', 'Error loading intelligence')
                : t('intelligence.no_security_data', 'No security intelligence available')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
