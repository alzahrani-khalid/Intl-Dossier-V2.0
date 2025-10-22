import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Brief, BriefTemplate } from '../types/dossier';

interface BriefGeneratorProps {
  dossierId: string;
  isGenerating?: boolean;
  progress?: number;
  brief?: Brief | null;
  error?: string | null;
  fallbackTemplate?: BriefTemplate | null;
  onGenerate: (dateRangeStart?: string, dateRangeEnd?: string) => void;
  onSubmitManual?: (content: { en: any; ar: any }) => void;
}

type GenerationState = 'idle' | 'generating' | 'success' | 'error' | 'fallback' | 'timeout';

export function BriefGenerator({
  dossierId,
  isGenerating = false,
  progress = 0,
  brief,
  error,
  fallbackTemplate,
  onGenerate,
  onSubmitManual,
}: BriefGeneratorProps) {
  const { t, i18n } = useTranslation('dossiers');
  const isRTL = i18n.language === 'ar';

  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [manualContent, setManualContent] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<number | null>(null);

  // Determine generation state
  const getState = (): GenerationState => {
    if (isGenerating) return 'generating';
    if (brief) return 'success';
    if (fallbackTemplate) return 'fallback';
    if (error && error.includes('timeout')) return 'timeout';
    if (error) return 'error';
    return 'idle';
  };

  const state = getState();

  // Start countdown when generating
  useState(() => {
    if (isGenerating && countdown === null) {
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  });

  const handleGenerate = () => {
    setCountdown(60);
    onGenerate(dateRangeStart || undefined, dateRangeEnd || undefined);
  };

  const handleManualSubmit = () => {
    if (!onSubmitManual || !fallbackTemplate) return;

    const contentEn = {
      summary: manualContent['summary_en'] || '',
      sections: fallbackTemplate.sections.map((section) => ({
        title: section.title_en,
        content: manualContent[`${section.id}_en`] || '',
      })),
    };

    const contentAr = {
      summary: manualContent['summary_ar'] || '',
      sections: fallbackTemplate.sections.map((section) => ({
        title: section.title_ar,
        content: manualContent[`${section.id}_ar`] || '',
      })),
    };

    onSubmitManual({ en: contentEn, ar: contentAr });
  };

  // Render date range inputs
  const renderDateInputs = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="date-start">{t('brief.startDate')}</Label>
        <Input
          id="date-start"
          type="date"
          value={dateRangeStart}
          onChange={(e) => setDateRangeStart(e.target.value)}
          disabled={isGenerating}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date-end">{t('brief.endDate')}</Label>
        <Input
          id="date-end"
          type="date"
          value={dateRangeEnd}
          onChange={(e) => setDateRangeEnd(e.target.value)}
          disabled={isGenerating}
        />
      </div>
    </div>
  );

  // Render based on state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          {t('brief.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Idle State - Date Selection */}
        {state === 'idle' && (
          <>
            {renderDateInputs()}
            <Button onClick={handleGenerate} className="w-full" disabled={isGenerating}>
              {t('generateBrief')}
            </Button>
          </>
        )}

        {/* Generating State - Loading with Progress */}
        {state === 'generating' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('brief.generating')}</span>
              {countdown !== null && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="size-3" />
                  {countdown}s
                </Badge>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">
              {t('brief.pleaseWait', { ns: 'translation' }) ||
                'Please wait while we generate your brief...'}
            </p>
          </div>
        )}

        {/* Success State - Display Brief */}
        {state === 'success' && brief && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-5" />
              <span className="font-medium">{t('success.briefGenerated')}</span>
            </div>

            <div className="space-y-4 rounded-lg bg-muted/50 p-4">
              {/* Brief Metadata */}
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {t('brief.generatedBy')}: {t(`brief.${brief.generated_by}`)}
                </Badge>
                <Badge variant="outline">
                  {t('brief.generatedAt')}:{' '}
                  {new Date(brief.generated_at).toLocaleString(i18n.language)}
                </Badge>
              </div>

              {/* Brief Content */}
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium">
                    {t('brief.summary', { ns: 'translation' }) || 'Summary'}
                  </h4>
                  <p className="text-sm">
                    {isRTL ? brief.content_ar.summary : brief.content_en.summary}
                  </p>
                </div>

                {(isRTL ? brief.content_ar.sections : brief.content_en.sections).map(
                  (section, index) => (
                    <div key={index}>
                      <h4 className="mb-2 font-medium">{section.title}</h4>
                      <p className="whitespace-pre-wrap text-sm">{section.content}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            <Button variant="outline" onClick={() => window.print()} className="w-full">
              {t('print', { ns: 'translation' }) || 'Print Brief'}
            </Button>
          </div>
        )}

        {/* Error/Timeout State */}
        {(state === 'error' || state === 'timeout') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <span className="font-medium">
                {state === 'timeout' ? t('brief.timeout') : t('errors.loadFailed')}
              </span>
            </div>
            {error && <p className="text-sm text-muted-foreground">{error}</p>}
            <Button variant="outline" onClick={handleGenerate} className="w-full">
              {t('retry', { ns: 'translation' }) || 'Try Again'}
            </Button>
          </div>
        )}

        {/* Fallback State - Manual Template */}
        {state === 'fallback' && fallbackTemplate && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="size-5" />
              <span className="font-medium">{t('brief.fallback')}</span>
            </div>

            <p className="text-sm text-muted-foreground">
              {t('brief.fallbackMessage', { ns: 'translation' }) ||
                'AI service is unavailable. Please fill in the brief manually.'}
            </p>

            <div className="space-y-4">
              {/* Summary Fields */}
              <div className="space-y-2">
                <Label htmlFor="summary-en">
                  {t('brief.summary', { ns: 'translation' })} (English)
                </Label>
                <textarea
                  id="summary-en"
                  className="min-h-[100px] w-full rounded-md border p-2"
                  value={manualContent['summary_en'] || ''}
                  onChange={(e) =>
                    setManualContent({ ...manualContent, summary_en: e.target.value })
                  }
                  placeholder={t('brief.summaryPlaceholder', { ns: 'translation' })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary-ar">
                  {t('brief.summary', { ns: 'translation' })} (العربية)
                </Label>
                <textarea
                  id="summary-ar"
                  className="min-h-[100px] w-full rounded-md border p-2"
                  dir="rtl"
                  value={manualContent['summary_ar'] || ''}
                  onChange={(e) =>
                    setManualContent({ ...manualContent, summary_ar: e.target.value })
                  }
                  placeholder={t('brief.summaryPlaceholder', { ns: 'translation' })}
                />
              </div>

              {/* Section Fields */}
              {fallbackTemplate.sections.map((section) => (
                <div key={section.id} className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-medium">{isRTL ? section.title_ar : section.title_en}</h4>

                  <div className="space-y-2">
                    <Label htmlFor={`${section.id}-en`}>{section.title_en}</Label>
                    <textarea
                      id={`${section.id}-en`}
                      className="min-h-[80px] w-full rounded-md border p-2 text-sm"
                      value={manualContent[`${section.id}_en`] || ''}
                      onChange={(e) =>
                        setManualContent({
                          ...manualContent,
                          [`${section.id}_en`]: e.target.value,
                        })
                      }
                      placeholder={section.placeholder_en}
                      required={section.required}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${section.id}-ar`}>{section.title_ar}</Label>
                    <textarea
                      id={`${section.id}-ar`}
                      className="min-h-[80px] w-full rounded-md border p-2 text-sm"
                      dir="rtl"
                      value={manualContent[`${section.id}_ar`] || ''}
                      onChange={(e) =>
                        setManualContent({
                          ...manualContent,
                          [`${section.id}_ar`]: e.target.value,
                        })
                      }
                      placeholder={section.placeholder_ar}
                      required={section.required}
                    />
                  </div>
                </div>
              ))}

              <Button onClick={handleManualSubmit} className="w-full">
                {t('submit', { ns: 'translation' }) || 'Submit Brief'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}