/**
 * Route: /admin/system
 * Admin system utilities and maintenance
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  Settings, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Database,
  Download
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_protected/admin/system')({
  component: AdminSystemPage,
  beforeLoad: async () => {
    // Check admin role
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const isAdmin = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';

    if (!isAdmin) {
      throw new Error('Admin access required');
    }
  },
});

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

interface PopulateCountriesResponse {
  success: boolean;
  progress_id?: string;
  summary: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  errors?: string[];
  message_en: string;
  message_ar: string;
  error?: string;
}

interface ProgressData {
  id: string;
  operation_type: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  status: 'running' | 'completed' | 'failed';
  percentage: number;
  is_complete: boolean;
}

async function populateCountries(): Promise<PopulateCountriesResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`${API_BASE_URL}/populate-countries-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message_en || error.error || 'Failed to populate countries');
  }

  return response.json();
}

async function fetchProgress(progressId: string): Promise<ProgressData> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`${API_BASE_URL}/operation-progress?id=${progressId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }

  const data = await response.json();
  return data.progress;
}

function AdminSystemPage() {
  const { t, i18n } = useTranslation('admin');
  const isRTL = i18n.language === 'ar';
  const [result, setResult] = useState<PopulateCountriesResponse | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const populateMutation = useMutation({
    mutationFn: populateCountries,
    onSuccess: (data) => {
      if (data.progress_id) {
        setProgressId(data.progress_id);
        // Start polling for progress
        startProgressPolling(data.progress_id);
      } else {
        // If no progress_id, operation completed immediately
        setResult(data);
      }
    },
    onError: (error: Error) => {
      setResult({
        success: false,
        summary: { total: 0, processed: 0, successful: 0, failed: 1 },
        message_en: error.message,
        message_ar: 'فشل في تحديث بيانات الدول',
        error: error.message,
      });
      stopProgressPolling();
    },
  });

  // Poll for progress updates
  const startProgressPolling = (id: string) => {
    // Clear any existing interval
    stopProgressPolling();

    // Poll immediately
    pollProgress(id);

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      pollProgress(id);
    }, 2000);
  };

  const stopProgressPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const pollProgress = async (id: string) => {
    try {
      const progressData = await fetchProgress(id);
      setProgress(progressData);

      // If completed, stop polling and show final result
      if (progressData.is_complete) {
        stopProgressPolling();
        setResult({
          success: progressData.status === 'completed',
          summary: {
            total: progressData.total_items,
            processed: progressData.processed_items,
            successful: progressData.successful_items,
            failed: progressData.failed_items,
          },
          message_en: `Successfully processed ${progressData.successful_items} countries`,
          message_ar: `تم معالجة ${progressData.successful_items} دولة بنجاح`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      // Don't stop polling on error, might be temporary
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopProgressPolling();
    };
  }, []);

  const handlePopulateCountries = () => {
    setResult(null);
    setProgress(null);
    setProgressId(null);
    populateMutation.mutate();
  };

  return (
    <div className="container mx-auto py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {t('system.title', 'System Utilities')}
          </h1>
          <p className="text-muted-foreground">
            {t('system.subtitle', 'Maintenance and data management tools')}
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <p className="font-medium">
            {t('system.warning', 'Admin Privileges Active')}
          </p>
          <p className="text-sm mt-1">
            {t('system.warningText', 'These operations modify system data. Use with caution.')}
          </p>
        </AlertDescription>
      </Alert>

      {/* Countries Population Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {t('system.populateCountries.title', 'Populate Country Data')}
                </CardTitle>
                <CardDescription>
                  {t('system.populateCountries.description', 'Fetch and update geographic data for all countries from REST Countries API')}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {t('system.populateCountries.whatIsIncluded', 'What will be updated:')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t('system.populateCountries.isoCodes', 'ISO Codes (2 & 3 letter)')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t('system.populateCountries.capitals', 'Capital Cities')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t('system.populateCountries.regions', 'Regions & Subregions')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t('system.populateCountries.population', 'Population Data')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t('system.populateCountries.area', 'Area (km²)')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t('system.populateCountries.flags', 'Flag URLs')}</span>
              </div>
            </div>
          </div>

          {/* Data Source Badge */}
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t('system.populateCountries.dataSource', 'Data Source:')}
            </span>
            <Badge variant="secondary" className="gap-1">
              <Download className="h-3 w-3" />
              REST Countries API
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({t('system.populateCountries.countriesCount', '~250 countries')})
            </span>
          </div>

          {/* Action Button */}
          <Button
            onClick={handlePopulateCountries}
            disabled={populateMutation.isPending}
            size="lg"
            className="w-full sm:w-auto"
          >
            {populateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t('system.populateCountries.processing', 'Processing...')}</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>{t('system.populateCountries.updateButton', 'Update Country Data')}</span>
              </>
            )}
          </Button>

          {/* Progress Indicator with Real-time Updates */}
          {(populateMutation.isPending || progress) && !result && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  {progress && progress.processed_items > 0 ? (
                    <>
                      {t('system.populateCountries.processing', 'Processing')}:{' '}
                      <span className="font-bold text-foreground">
                        {progress.processed_items}/{progress.total_items}
                      </span>
                      {' '}
                      {t('system.populateCountries.countries', 'countries')}
                    </>
                  ) : (
                    t('system.populateCountries.fetching', 'Fetching and updating countries...')
                  )}
                </span>
                {progress && (
                  <span className="text-lg font-bold text-emerald-600">
                    {progress.percentage}%
                  </span>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="relative">
                <Progress 
                  value={progress?.percentage || 0} 
                  className="w-full h-3"
                />
              </div>

              {/* Progress Details */}
              {progress && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-bold text-blue-600">{progress.successful_items}</div>
                    <div className="text-muted-foreground">{t('system.populateCountries.successful', 'Successful')}</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-bold text-yellow-600">{progress.processed_items - progress.successful_items - progress.failed_items}</div>
                    <div className="text-muted-foreground">{t('system.populateCountries.pending', 'Pending')}</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded">
                    <div className="font-bold text-red-600">{progress.failed_items}</div>
                    <div className="text-muted-foreground">{t('system.populateCountries.failed', 'Failed')}</div>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {!progress && t('system.populateCountries.estimatedTime', 'This may take 2-3 minutes')}
                {progress && progress.percentage < 100 && (
                  <span className="flex items-center justify-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin inline" />
                    {t('system.populateCountries.inProgress', 'Operation in progress...')}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <Alert
              variant={result.success ? 'default' : 'destructive'}
              className={result.success ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}
            >
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <AlertDescription>
                <div className="space-y-3">
                  {/* Message */}
                  <p className={result.success ? 'text-emerald-800 dark:text-emerald-200 font-medium' : 'font-medium'}>
                    {isRTL ? result.message_ar : result.message_en}
                  </p>

                  {/* Summary Stats */}
                  {result.success && result.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="text-center p-2 bg-background rounded">
                        <div className="text-2xl font-bold text-emerald-600">
                          {result.summary.total}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('system.populateCountries.total', 'Total')}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.summary.processed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('system.populateCountries.processed', 'Processed')}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {result.summary.successful}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('system.populateCountries.successful', 'Successful')}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <div className={`text-2xl font-bold ${result.summary.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {result.summary.failed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('system.populateCountries.failed', 'Failed')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {result.errors && result.errors.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        {t('system.populateCountries.viewErrors', 'View error details')} ({result.errors.length})
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs max-h-40 overflow-y-auto">
                        {result.errors.map((error, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-500" />
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>
              💡 {t('system.populateCountries.tip1', 'This operation is safe to run multiple times - it will update existing countries.')}
            </p>
            <p>
              💡 {t('system.populateCountries.tip2', 'Run this annually to keep population and area data up to date.')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

