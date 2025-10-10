/**
 * DossierMoUsTab Component (T055)
 *
 * Displays MoUs linked to a specific dossier
 * Features: Status badges, expiry alerts, click to view details
 * Mobile-first responsive design with RTL support
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FileText, Clock, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';

interface MoU {
  id: string;
  country_id?: string;
  organization_id?: string;
  title: string;
  title_ar: string;
  description?: string;
  dates: {
    signed?: string;
    effective?: string;
    expiry?: string;
    renewal_required?: string;
  };
  effective_date?: string;
  expiry_date?: string;
  lifecycle_state: 'draft' | 'pending' | 'active' | 'expired' | 'cancelled' | 'renewed';
  document_path?: string;
  created_at: string;
}

interface DossierMoUsTabProps {
  dossierId: string;
}

export function DossierMoUsTab({ dossierId }: DossierMoUsTabProps) {
  const { t, i18n } = useTranslation('dossiers');
  const isRTL = i18n.language === 'ar';

  // Fetch MoUs for this dossier using reference_id pattern
  const { data: mous, isLoading, error } = useQuery({
    queryKey: ['dossier-mous', dossierId],
    queryFn: async () => {
      // First fetch dossier to get reference_type and reference_id
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select('reference_type, reference_id')
        .eq('id', dossierId)
        .single();

      if (dossierError) throw dossierError;
      if (!dossier || !dossier.reference_id) return [];

      // Determine which column to query based on reference_type
      const referenceColumn =
        dossier.reference_type === 'country' ? 'country_id' :
        dossier.reference_type === 'organization' ? 'organization_id' : null;

      if (!referenceColumn) return [];

      // Query MoUs using the appropriate reference column
      const { data, error } = await supabase
        .from('mous')
        .select('*')
        .eq(referenceColumn, dossier.reference_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MoU[];
    },
  });

  // Status color mapping
  const getStatusColor = (status: MoU['lifecycle_state']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'renewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Check if MoU is approaching renewal
  const isApproachingRenewal = (mou: MoU): boolean => {
    const renewalDate = mou.dates?.renewal_required;
    if (!renewalDate || mou.lifecycle_state !== 'active') return false;
    const daysUntilRenewal = Math.floor(
      (new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilRenewal <= 90 && daysUntilRenewal > 0;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
        role="alert"
      >
        <p className="text-red-800 dark:text-red-200">
          {t('mous.error_loading')}
        </p>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : t('mous.error_generic')}
        </p>
      </div>
    );
  }

  // Empty state
  if (!mous || mous.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('mous.no_mous')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('mous.no_mous_description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MoUs List */}
      {mous.map((mou) => (
        <Card
          key={mou.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => {
            // TODO: Navigate to MoU detail page or open modal
          }}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* MoU Info */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h4
                  className={`text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate ${
                    isRTL ? 'text-end' : 'text-start'
                  }`}
                >
                  {isRTL ? mou.title_ar : mou.title}
                </h4>

                {/* Summary */}
                {mou.description && (
                  <p
                    className={`mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 ${
                      isRTL ? 'text-end' : 'text-start'
                    }`}
                  >
                    {mou.description}
                  </p>
                )}

                {/* Dates */}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                  {/* Signed Date */}
                  {mou.dates?.signed && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>
                        {t('mous.signed')}: {format(new Date(mou.dates.signed), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}

                  {/* Expiry Date */}
                  {(mou.expiry_date || mou.dates?.expiry) && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {t('mous.expires')}: {format(new Date(mou.expiry_date || mou.dates?.expiry!), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}

                  {/* Effective Date */}
                  {(mou.effective_date || mou.dates?.effective) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {t('mous.effective')}: {format(new Date(mou.effective_date || mou.dates?.effective!), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Alerts */}
              <div className="flex flex-col gap-2 items-start sm:items-end">
                {/* Status Badge */}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    mou.lifecycle_state
                  )}`}
                >
                  {t(`mous.status.${mou.lifecycle_state}`)}
                </span>

                {/* Renewal Alert */}
                {isApproachingRenewal(mou) && (
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{t('mous.renewal_required')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
