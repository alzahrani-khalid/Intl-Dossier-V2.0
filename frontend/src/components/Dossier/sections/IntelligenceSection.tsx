/**
 * Intelligence Section Component (Feature 029 - User Story 1 - T023)
 *
 * Displays AI-generated intelligence insights for country dossiers
 * Shows economic, political, security, and bilateral intelligence types
 * Mobile-first, RTL-compatible, with loading/error states
 */

import { useTranslation } from 'react-i18next';
import { useIntelligenceByType } from '@/hooks/useIntelligence';
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface IntelligenceSectionProps {
  entityId: string;
  intelligenceType: 'economic' | 'political' | 'security' | 'bilateral';
}

export function IntelligenceSection({
  entityId,
  intelligenceType,
}: IntelligenceSectionProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const {
    data: intelligence,
    isLoading,
    isError,
    error,
  } = useIntelligenceByType(entityId, intelligenceType);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : t('intelligence.error', 'Failed to load intelligence')}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!intelligence) {
    return (
      <div
        className="py-8 text-center text-sm text-muted-foreground"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <p>{t('intelligence.empty', 'No intelligence available for this entity')}</p>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <IntelligenceCard intelligence={intelligence} />
    </div>
  );
}
