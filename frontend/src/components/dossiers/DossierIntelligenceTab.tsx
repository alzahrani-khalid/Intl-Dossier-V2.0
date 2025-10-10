/**
 * DossierIntelligenceTab Component (T056)
 *
 * Displays intelligence signals linked to a specific dossier
 * Features: Signal type filtering, confidence badges, source reliability
 * Mobile-first responsive design with RTL support
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
  Newspaper,
  FileText,
  MessageCircle,
  Lightbulb,
  BarChart,
  AlertTriangle,
  Filter,
  Star,
  StarOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IntelligenceSignal {
  id: string;
  dossier_id: string;
  signal_type: 'news' | 'report' | 'rumor' | 'tip' | 'analysis' | 'alert';
  source: string;
  source_reliability: number; // 1-5
  source_url?: string;
  title_en: string;
  title_ar?: string;
  content_en: string;
  content_ar?: string;
  confidence_level: 'confirmed' | 'probable' | 'possible' | 'unconfirmed';
  logged_at: string;
  logged_by: string;
  validated_at?: string;
  validated_by?: string;
  tags: string[];
  impact_assessment?: string;
}

interface DossierIntelligenceTabProps {
  dossierId: string;
}

export function DossierIntelligenceTab({ dossierId }: DossierIntelligenceTabProps) {
  const { t, i18n } = useTranslation('dossiers');
  const isRTL = i18n.language === 'ar';

  // Filter state
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch intelligence signals for this dossier
  const { data: signals, isLoading, error } = useQuery({
    queryKey: ['dossier-intelligence', dossierId, filterType],
    queryFn: async () => {
      let query = supabase
        .from('intelligence_signals')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('logged_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('signal_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as IntelligenceSignal[];
    },
  });

  // Signal type icon mapping
  const getSignalTypeIcon = (type: IntelligenceSignal['signal_type']) => {
    const iconClass = 'h-5 w-5';
    switch (type) {
      case 'news':
        return <Newspaper className={iconClass} />;
      case 'report':
        return <FileText className={iconClass} />;
      case 'rumor':
        return <MessageCircle className={iconClass} />;
      case 'tip':
        return <Lightbulb className={iconClass} />;
      case 'analysis':
        return <BarChart className={iconClass} />;
      case 'alert':
        return <AlertTriangle className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  // Confidence badge color mapping
  const getConfidenceColor = (confidence: IntelligenceSignal['confidence_level']) => {
    switch (confidence) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'probable':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'possible':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'unconfirmed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Source reliability stars
  const renderReliabilityStars = (reliability: number) => {
    return (
      <div className="flex items-center gap-0.5" title={`Reliability: ${reliability}/5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          star <= reliability ? (
            <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff key={star} className="h-3 w-3 text-gray-300 dark:text-gray-600" />
          )
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
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
          {t('intelligence.error_loading')}
        </p>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : t('intelligence.error_generic')}
        </p>
      </div>
    );
  }

  // Empty state
  if (!signals || signals.length === 0) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {filterType === 'all' ? t('intelligence.no_signals') : t('intelligence.no_signals_filtered')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('intelligence.no_signals_description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Dropdown */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('intelligence.filter')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t('intelligence.filter_by_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('intelligence.all_types')}</SelectItem>
              <SelectItem value="news">{t('intelligence.type.news')}</SelectItem>
              <SelectItem value="report">{t('intelligence.type.report')}</SelectItem>
              <SelectItem value="rumor">{t('intelligence.type.rumor')}</SelectItem>
              <SelectItem value="tip">{t('intelligence.type.tip')}</SelectItem>
              <SelectItem value="analysis">{t('intelligence.type.analysis')}</SelectItem>
              <SelectItem value="alert">{t('intelligence.type.alert')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Intelligence Signals List */}
      {signals.map((signal) => (
        <Card
          key={signal.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => {
            // TODO: Navigate to signal detail page or open modal
          }}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Icon & Type */}
              <div className="flex items-start gap-3 sm:flex-shrink-0">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {getSignalTypeIcon(signal.signal_type)}
                </div>
                <div className="flex-1 sm:hidden">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t(`intelligence.type.${signal.signal_type}`)}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Title & Confidence */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <h4
                    className={`text-base font-medium text-gray-900 dark:text-white ${
                      isRTL ? 'text-end' : 'text-start'
                    }`}
                  >
                    {isRTL && signal.title_ar ? signal.title_ar : signal.title_en}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(
                      signal.confidence_level
                    )}`}
                  >
                    {t(`intelligence.confidence.${signal.confidence_level}`)}
                  </span>
                </div>

                {/* Content Preview */}
                <p
                  className={`text-sm text-gray-600 dark:text-gray-400 line-clamp-2 ${
                    isRTL ? 'text-end' : 'text-start'
                  }`}
                >
                  {isRTL && signal.content_ar ? signal.content_ar : signal.content_en}
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                  {/* Source */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{t('intelligence.source')}:</span>
                    <span>{signal.source}</span>
                    {renderReliabilityStars(signal.source_reliability)}
                  </div>

                  {/* Date */}
                  <div>
                    <span className="font-medium">{t('intelligence.logged_at')}:</span>{' '}
                    {format(new Date(signal.logged_at), 'dd MMM yyyy')}
                  </div>

                  {/* Validation Status */}
                  {signal.validated_at && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <span>✓ {t('intelligence.validated')}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {signal.tags && signal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {signal.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {signal.tags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{signal.tags.length - 3} {t('intelligence.more_tags')}
                      </span>
                    )}
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
