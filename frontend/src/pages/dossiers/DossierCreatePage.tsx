/**
 * DossierCreatePage Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T058)
 *
 * Page for creating new dossiers with type selection.
 * Mobile-first, RTL-compatible, with step-by-step creation flow.
 *
 * Features:
 * - Responsive layout (320px mobile → desktop)
 * - RTL support via logical properties
 * - Type selection step
 * - Form validation and error handling
 * - Success redirect to detail page
 * - Touch-friendly UI (44x44px min)
 * - Accessibility compliant (WCAG AA)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useCreateDossier } from '@/hooks/useDossier';
import { DossierTypeSelector } from '@/components/Dossier/DossierTypeSelector';
import { DossierForm } from '@/components/Dossier/DossierForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { DossierType, CreateDossierRequest } from '@/services/dossier-api';

export function DossierCreatePage() {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const createMutation = useCreateDossier();

  const [selectedType, setSelectedType] = useState<DossierType | null>(null);
  const [step, setStep] = useState<'select-type' | 'fill-form'>('select-type');

  const handleBack = () => {
    if (step === 'fill-form') {
      setStep('select-type');
      setSelectedType(null);
    } else {
      navigate({ to: '/dossiers' });
    }
  };

  const handleTypeSelect = (type: DossierType) => {
    setSelectedType(type);
    setStep('fill-form');
  };

  const handleSubmit = async (data: CreateDossierRequest) => {
    try {
      const newDossier = await createMutation.mutateAsync(data);
      toast.success(t('create.success'));
      navigate({ to: `/dossiers/${newDossier.id}` });
    } catch (error: any) {
      toast.error(error?.message || t('create.error'));
    }
  };

  const handleCancel = () => {
    navigate({ to: '/dossiers' });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start">
            {t('create.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-start mt-1 sm:mt-2">
            {step === 'select-type'
              ? t('create.subtitleSelectType')
              : t('create.subtitleFillForm', { type: selectedType ? t(`type.${selectedType}`) : '' })}
          </p>
        </div>
        <Button onClick={handleBack} variant="ghost" size="sm" className="min-h-11 self-start sm:self-center">
          <ArrowLeft className={cn('h-4 w-4', isRTL ? 'ms-2 rotate-180' : 'me-2')} />
          {step === 'fill-form' ? t('create.changeType') : t('create.cancel')}
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-full text-xs sm:text-sm font-semibold',
              step === 'select-type'
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/20 text-primary'
            )}
          >
            1
          </div>
          <span className={cn(
            'text-xs sm:text-sm font-medium',
            step === 'select-type' ? 'text-primary' : 'text-muted-foreground'
          )}>
            {t('create.step1')}
          </span>
        </div>
        <div className="h-px w-8 sm:w-16 bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-full text-xs sm:text-sm font-semibold',
              step === 'fill-form'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            2
          </div>
          <span className={cn(
            'text-xs sm:text-sm font-medium',
            step === 'fill-form' ? 'text-primary' : 'text-muted-foreground'
          )}>
            {t('create.step2')}
          </span>
        </div>
      </div>

      {/* Content */}
      <Card className="max-w-4xl mx-auto">
        {step === 'select-type' && (
          <>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl text-start">
                {t('create.selectTypeTitle')}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-start">
                {t('create.selectTypeDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <DossierTypeSelector onTypeSelect={handleTypeSelect} />
            </CardContent>
          </>
        )}

        {step === 'fill-form' && selectedType && (
          <>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl text-start">
                {t('create.fillFormTitle', { type: t(`type.${selectedType}`) })}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-start">
                {t('create.fillFormDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <DossierForm
                type={selectedType}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={createMutation.isPending}
              />
            </CardContent>
          </>
        )}
      </Card>

      {/* Help Text */}
      <div className="max-w-4xl mx-auto mt-4 sm:mt-6 p-4 bg-muted rounded-lg">
        <p className="text-xs sm:text-sm text-muted-foreground text-start">
          <strong>{t('create.helpTitle')}:</strong> {t('create.helpText')}
        </p>
      </div>
    </div>
  );
}
