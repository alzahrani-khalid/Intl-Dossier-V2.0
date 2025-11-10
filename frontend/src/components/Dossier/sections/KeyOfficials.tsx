/**
 * Key Officials Section (Feature 028 + 029 - User Story 1 + 4 - T025, T061)
 *
 * Displays person dossiers related to country via dossier_relationships.
 * Includes inline political intelligence widget (Feature 029 - User Story 4 - T061)
 * Card grid layout with person details.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { Users, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from '@tanstack/react-router';
import { IntelligenceInsight } from '@/components/intelligence/IntelligenceInsight';
import { useIntelligence, useRefreshIntelligence } from '@/hooks/useIntelligence';
import { useKeyOfficials } from '@/hooks/useKeyOfficials';
import { PersonCard } from '@/components/Dossier/PersonCard';
import { Skeleton } from '@/components/ui/skeleton';

interface KeyOfficialsProps {
  dossierId: string;
}

export function KeyOfficials({ dossierId }: KeyOfficialsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Fetch political intelligence for inline widget (Feature 029 - User Story 4 - T061)
  const {
    data: politicalIntelligence,
    isLoading: isLoadingPolitical,
    error: politicalError,
  } = useIntelligence({
    entity_id: dossierId,
    intelligence_type: 'political',
  });

  // Refresh mutation for political intelligence
  const { mutate: refreshPolitical, isPending: isRefreshingPolitical } = useRefreshIntelligence();

  const handlePoliticalRefresh = () => {
    refreshPolitical({
      entity_id: dossierId,
      intelligence_types: ['political'],
    });
  };

  // Fetch person dossiers related to this country (T083)
  const {
    data: keyOfficials,
    isLoading: isLoadingOfficials,
    error: officialsError,
  } = useKeyOfficials({ countryId: dossierId });

  // Extract AI profile summary from political intelligence (T086)
  const aiProfileSummary =
    politicalIntelligence?.data?.[0]?.analysis_en ||
    politicalIntelligence?.data?.[0]?.analysis_ar;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Political Intelligence Widget (Feature 029 - User Story 4 - T061) */}
      <div className="w-full">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3">
          {t('intelligence.political_analysis', 'Political Analysis')}
        </h3>
        {isLoadingPolitical ? (
          <Skeleton className="h-48 w-full" />
        ) : politicalIntelligence && politicalIntelligence.data.length > 0 ? (
          <IntelligenceInsight
            intelligence={politicalIntelligence.data[0]}
            onRefresh={handlePoliticalRefresh}
            isRefreshing={isRefreshingPolitical}
            dossierType="countries"
            dossierId={dossierId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg bg-muted/30">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              {politicalError
                ? t('intelligence.error_loading', 'Error loading intelligence')
                : t('intelligence.no_political_data', 'No political intelligence available')}
            </p>
          </div>
        )}
      </div>

      {/* Key Officials Section (T083-T086) */}
      <div className="w-full">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3">
          {t('sections.country.keyOfficials', 'Key Officials')}
        </h3>

        {/* Loading State */}
        {isLoadingOfficials && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Error State */}
        {officialsError && (
          <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg bg-muted/30">
            <Users className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-destructive text-center">
              {t('common.error', 'Error loading data')}: {officialsError.message}
            </p>
          </div>
        )}

        {/* Empty State with AI Suggestions (T089) */}
        {!isLoadingOfficials && !officialsError && (!keyOfficials || keyOfficials.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center border border-dashed rounded-lg bg-muted/30">
            <div className="mb-4 sm:mb-6">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              {t('sections.country.keyOfficialsEmpty', 'No Key Officials')}
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
              {t('sections.country.keyOfficialsEmptyDescription', 'No key officials have been linked to this country yet.')}
            </p>

            {aiProfileSummary && (
              <div className="max-w-lg px-4 mb-6">
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">✨</span>
                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 text-start">
                      {t('intelligence.political_context', 'Political Context')}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 text-start line-clamp-3">
                    {aiProfileSummary}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display Key Officials (T084-T085) */}
        {!isLoadingOfficials && !officialsError && keyOfficials && keyOfficials.length > 0 && (
          <div className="space-y-4">
            {/* AI Context Banner (T086) */}
            {aiProfileSummary && (
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">✨</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1 text-start">
                      {t('intelligence.political_context', 'Political Context')}
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 text-start line-clamp-4">
                      {aiProfileSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Person Cards Grid (T084) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {keyOfficials.map((person) => (
                <PersonCard
                  key={person.id}
                  dossier={{
                    ...person,
                    type: 'person' as const,
                    status: (person.status || 'active') as any,
                    dossier_type: 'person',
                  }}
                  onView={() => {
                    // Navigate to person detail
                    window.location.href = `/dossiers/persons/${person.id}`;
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
