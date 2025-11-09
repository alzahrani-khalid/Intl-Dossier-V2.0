/**
 * Bilateral Agreements Section (Feature 029 - User Story 6 - T079-T082)
 *
 * Displays bilateral agreements (MoUs) for a country dossier.
 * Grid layout with agreement cards including AI-generated significance summaries.
 * Mobile-first layout with RTL support.
 */

import { useTranslation } from 'react-i18next';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { BilateralAgreementCard } from '@/components/dossiers/BilateralAgreementCard';
import { useBilateralAgreements } from '@/hooks/useBilateralAgreements';
import { useIntelligence } from '@/hooks/useIntelligence';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

interface BilateralAgreementsProps {
  dossierId: string;
}

export function BilateralAgreements({ dossierId }: BilateralAgreementsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Fetch bilateral agreements from mous table (T079)
  const {
    data: agreements,
    isLoading: isLoadingAgreements,
    error: agreementsError,
  } = useBilateralAgreements({ countryId: dossierId });

  // Fetch bilateral intelligence for AI summaries (T082)
  const {
    data: bilateralIntelligence,
    isLoading: isLoadingIntelligence,
  } = useIntelligence({
    entity_id: dossierId,
    intelligence_type: 'bilateral',
  });

  // Extract AI summary if available
  const aiSummary = bilateralIntelligence?.data?.[0]?.executive_summary_en || bilateralIntelligence?.data?.[0]?.executive_summary_ar;

  // Loading state
  if (isLoadingAgreements) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Error state
  if (agreementsError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('common.error', 'Error loading data')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md px-4">
          {agreementsError.message}
        </p>
      </div>
    );
  }

  // Empty state with AI-suggested opportunities (T087-T088)
  if (!agreements || agreements.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="mb-4 sm:mb-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          {t('sections.country.bilateralAgreementsEmpty', 'No Bilateral Agreements')}
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 px-4">
          {t('sections.country.bilateralAgreementsEmptyDescription', 'No bilateral agreements or MoUs have been recorded for this country yet.')}
        </p>

        {/* AI-Suggested Opportunities (T088) */}
        {aiSummary && (
          <div className="max-w-lg px-4 mb-6">
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">✨</span>
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 text-start">
                  {t('intelligence.suggested_opportunities', 'AI-Suggested Opportunities')}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 text-start">
                {aiSummary}
              </p>
            </div>
          </div>
        )}

        <Button asChild variant="outline" size="sm">
          <Link to="/mous">
            {t('common.view_all_agreements', 'View All Agreements')}
          </Link>
        </Button>
      </div>
    );
  }

  // Display agreements grid (T081)
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          {t('sections.country.bilateralAgreements', 'Bilateral Agreements')} ({agreements.length})
        </h3>
        <Button asChild variant="outline" size="sm">
          <Link to="/mous" search={{ country_id: dossierId }}>
            {t('common.view_all', 'View All')}
          </Link>
        </Button>
      </div>

      {/* Agreements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agreements.map((agreement) => (
          <BilateralAgreementCard
            key={agreement.id}
            agreement={agreement}
            aiSummary={aiSummary} // Share same AI summary across cards (T082)
            onClick={() => {
              // Navigate to agreement detail (T090)
              window.location.href = `/mous?id=${agreement.id}`;
            }}
          />
        ))}
      </div>
    </div>
  );
}
