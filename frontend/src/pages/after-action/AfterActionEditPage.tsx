/**
 * After-Action Edit Page
 * Feature: 022-after-action-structured
 *
 * Page for editing draft after-action records with auto-save
 * functionality and unsaved changes warning.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AfterActionForm, type AfterActionFormData } from '@/components/after-action/AfterActionForm';
import {
  useAfterActionDetail,
  useUpdateAfterAction,
  usePublishAfterAction,
} from '@/hooks/use-after-action';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AfterActionEditPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { id } = useParams({ from: '/after-actions/$id/edit' });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch existing draft
  const {
    data: afterAction,
    isLoading,
    error,
  } = useAfterActionDetail(id);

  const { mutateAsync: updateAfterAction, isPending: isUpdating } = useUpdateAfterAction();
  const { mutateAsync: publishAfterAction, isPending: isPublishing } = usePublishAfterAction();

  // Redirect if not a draft
  useEffect(() => {
    if (afterAction && afterAction.status !== 'draft') {
      navigate({ to: `/after-actions/${id}` });
    }
  }, [afterAction, id, navigate]);

  // Warn user about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (afterAction?.status === 'draft') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [afterAction?.status]);

  /**
   * Handle save draft (update)
   */
  const handleSaveDraft = async (data: AfterActionFormData, isDraft: boolean) => {
    try {
      setSaveError(null);

      await updateAfterAction({
        id,
        data: {
          ...data,
          _version: afterAction?._version || 1,
        },
      });

      setLastSaved(new Date());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('afterActions.edit.saveFailed'));
      throw error;
    }
  };

  /**
   * Handle publish
   */
  const handlePublish = async (data: AfterActionFormData) => {
    try {
      setSaveError(null);

      // First save any pending changes
      await updateAfterAction({
        id,
        data: {
          ...data,
          _version: afterAction?._version || 1,
        },
      });

      // Then publish
      await publishAfterAction(id);

      // Navigate to view page
      navigate({
        to: `/after-actions/${id}`,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('afterActions.edit.publishFailed'));
      throw error;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl',
          isRTL && 'rtl'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !afterAction) {
    return (
      <div
        className={cn(
          'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl',
          isRTL && 'rtl'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('afterActions.edit.notFound')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl',
        isRTL && 'rtl'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-start">
          {t('afterActions.edit.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 text-start">
          {t('afterActions.edit.subtitle')}
        </p>
      </div>

      {/* Auto-save Status */}
      {lastSaved && (
        <Alert className="mb-6 border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>
            {t('afterActions.edit.lastSaved', {
              time: lastSaved.toLocaleTimeString(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
              }),
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {saveError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <AfterActionForm
        engagementId={afterAction.engagement_id}
        dossierId={afterAction.dossier_id}
        initialData={afterAction}
        onSave={handleSaveDraft}
        onPublish={handlePublish}
        canPublish={true}
      />
    </div>
  );
}

export default AfterActionEditPage;
