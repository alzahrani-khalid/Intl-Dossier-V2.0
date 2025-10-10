import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, HelpCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ConfidenceLevel = 'unconfirmed' | 'possible' | 'probable' | 'confirmed';

interface SignalValidationPanelProps {
  signalId: string;
  currentConfidence: ConfidenceLevel;
  onValidationComplete?: () => void;
}

const confidenceLevels: ConfidenceLevel[] = ['unconfirmed', 'possible', 'probable', 'confirmed'];

const confidenceConfig: Record<ConfidenceLevel, { color: string; icon: typeof HelpCircle; textColor: string }> = {
  unconfirmed: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100', icon: HelpCircle, textColor: 'text-gray-600' },
  possible: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100', icon: AlertCircle, textColor: 'text-orange-600' },
  probable: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100', icon: Info, textColor: 'text-yellow-600' },
  confirmed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', icon: CheckCircle2, textColor: 'text-green-600' },
};

export function SignalValidationPanel({ signalId, currentConfidence, onValidationComplete }: SignalValidationPanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [validationNotes, setValidationNotes] = useState('');
  const [sourceDetails, setSourceDetails] = useState('');

  const currentIndex = confidenceLevels.indexOf(currentConfidence);
  const canUpgrade = currentIndex < confidenceLevels.length - 1;
  const nextConfidence = canUpgrade ? confidenceLevels[currentIndex + 1] : null;

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!nextConfidence) throw new Error('Cannot upgrade confidence level');

      const response = await fetch(`/api/intelligence-signals/${signalId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence_level: nextConfidence,
          validation_notes: validationNotes,
          source_verification: sourceDetails,
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-signals', signalId] });
      queryClient.invalidateQueries({ queryKey: ['dossier-intelligence'] });

      toast({
        title: t('dossiers.intelligence.validation.success_title'),
        description: t('dossiers.intelligence.validation.success_description', { level: nextConfidence }),
      });

      setValidationNotes('');
      setSourceDetails('');
      onValidationComplete?.();
    },
    onError: (error) => {
      toast({
        title: t('dossiers.intelligence.validation.error_title'),
        description: error instanceof Error ? error.message : t('common.error.unknown'),
        variant: 'destructive',
      });
    },
  });

  const CurrentIcon = confidenceConfig[currentConfidence].icon;
  const NextIcon = nextConfidence ? confidenceConfig[nextConfidence].icon : null;

  return (
    <Card className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg text-start">
          {t('dossiers.intelligence.validation.title')}
        </CardTitle>
        <CardDescription className="text-start">
          {t('dossiers.intelligence.validation.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Confidence Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-start block">
            {t('dossiers.intelligence.validation.current_level')}
          </Label>
          <Badge className={`${confidenceConfig[currentConfidence].color} flex items-center gap-2 w-fit`}>
            <CurrentIcon className="h-4 w-4" />
            {t(`dossiers.intelligence.confidence.${currentConfidence}`)}
          </Badge>
        </div>

        {/* Upgrade Path */}
        {canUpgrade && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-start block">
              {t('dossiers.intelligence.validation.upgrade_path')}
            </Label>
            <div className="flex items-center gap-2 flex-wrap">
              {confidenceLevels.map((level, idx) => {
                const Icon = confidenceConfig[level].icon;
                const isCurrent = idx === currentIndex;
                const isPast = idx < currentIndex;
                const isNext = idx === currentIndex + 1;

                return (
                  <div key={level} className="flex items-center gap-2">
                    <Badge
                      variant={isPast || isCurrent ? 'default' : 'outline'}
                      className={`${
                        isCurrent
                          ? confidenceConfig[level].color
                          : isPast
                          ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          : isNext
                          ? 'border-2 border-primary'
                          : ''
                      } flex items-center gap-1.5 text-xs sm:text-sm`}
                    >
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      {t(`dossiers.intelligence.confidence.${level}`)}
                    </Badge>
                    {idx < confidenceLevels.length - 1 && (
                      <span className={`text-gray-400 ${isRTL ? 'rotate-180' : ''}`}>→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Validation Form */}
        {canUpgrade && nextConfidence && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="validation-notes" className="text-sm font-medium text-start block">
                {t('dossiers.intelligence.validation.notes_label')} *
              </Label>
              <Textarea
                id="validation-notes"
                placeholder={t('dossiers.intelligence.validation.notes_placeholder')}
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                className="min-h-20 resize-none text-start"
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
              <p className="text-xs text-gray-500 text-start">
                {t('dossiers.intelligence.validation.notes_hint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-details" className="text-sm font-medium text-start block">
                {t('dossiers.intelligence.validation.source_label')}
              </Label>
              <Textarea
                id="source-details"
                placeholder={t('dossiers.intelligence.validation.source_placeholder')}
                value={sourceDetails}
                onChange={(e) => setSourceDetails(e.target.value)}
                className="min-h-20 resize-none text-start"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Upgrade Button */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => validateMutation.mutate()}
                disabled={!validationNotes.trim() || validateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {validateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {t('common.loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {NextIcon && <NextIcon className="h-4 w-4" />}
                    {t('dossiers.intelligence.validation.upgrade_button', {
                      level: t(`dossiers.intelligence.confidence.${nextConfidence}`),
                    })}
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Already Confirmed */}
        {!canUpgrade && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200 text-start">
              {t('dossiers.intelligence.validation.already_confirmed')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
