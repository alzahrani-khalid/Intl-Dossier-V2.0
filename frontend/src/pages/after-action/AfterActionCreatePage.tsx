/**
 * After-Action Create Page
 * Feature: 022-after-action-structured
 *
 * Page for creating new after-action records with multi-step form,
 * auto-save functionality, and unsaved changes warning.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from '@tanstack/react-router';
import { AfterActionForm, type AfterActionFormData } from '@/components/after-action/AfterActionForm';
import { useCreateAfterAction, useUpdateAfterAction } from '@/hooks/use-after-action';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AfterActionCreatePage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();

 // Get engagement_id and dossier_id from URL params
 const engagementId = searchParams.get('engagement_id');
 const dossierId = searchParams.get('dossier_id');

 const [draftId, setDraftId] = useState<string | null>(null);
 const [lastSaved, setLastSaved] = useState<Date | null>(null);
 const [saveError, setSaveError] = useState<string | null>(null);

 const { mutateAsync: createAfterAction, isPending: isCreating } = useCreateAfterAction();
 const { mutateAsync: updateAfterAction, isPending: isUpdating } = useUpdateAfterAction();

 // Validate required params
 useEffect(() => {
 if (!engagementId || !dossierId) {
 navigate({ to: '/dossiers' });
 }
 }, [engagementId, dossierId, navigate]);

 // Warn user about unsaved changes before leaving
 useEffect(() => {
 const handleBeforeUnload = (e: BeforeUnloadEvent) => {
 if (draftId) {
 e.preventDefault();
 e.returnValue = '';
 }
 };

 window.addEventListener('beforeunload', handleBeforeUnload);
 return () => window.removeEventListener('beforeunload', handleBeforeUnload);
 }, [draftId]);

 /**
 * Handle save draft
 */
 const handleSaveDraft = async (data: AfterActionFormData, isDraft: boolean) => {
 try {
 setSaveError(null);

 if (draftId) {
 // Update existing draft
 await updateAfterAction({
 id: draftId,
 data: {
 ...data,
 _version: data.version || 1,
 },
 });
 } else {
 // Create new draft
 const result = await createAfterAction({
 ...data,
 engagement_id: engagementId!,
 dossier_id: dossierId!,
 });
 setDraftId(result.id!);
 }

 setLastSaved(new Date());
 } catch (error) {
 setSaveError(error instanceof Error ? error.message : t('afterActions.create.saveFailed'));
 throw error;
 }
 };

 /**
 * Handle publish
 */
 const handlePublish = async (data: AfterActionFormData) => {
 try {
 setSaveError(null);

 // First save as draft if not already saved
 if (!draftId) {
 const result = await createAfterAction({
 ...data,
 engagement_id: engagementId!,
 dossier_id: dossierId!,
 });
 setDraftId(result.id!);
 }

 // Navigate to publish confirmation (or handle publish directly)
 navigate({
 to: '/after-actions/$id/publish',
 params: { id: draftId! },
 });
 } catch (error) {
 setSaveError(error instanceof Error ? error.message : t('afterActions.create.publishFailed'));
 throw error;
 }
 };

 if (!engagementId || !dossierId) {
 return null;
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
 {t('afterActions.create.title')}
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground mt-2 text-start">
 {t('afterActions.create.subtitle')}
 </p>
 </div>

 {/* Auto-save Status */}
 {lastSaved && (
 <Alert className="mb-6 border-green-500">
 <CheckCircle2 className="h-4 w-4 text-green-500" />
 <AlertDescription>
 {t('afterActions.create.lastSaved', {
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
 engagementId={engagementId}
 dossierId={dossierId}
 onSave={handleSaveDraft}
 onPublish={handlePublish}
 canPublish={true}
 />
 </div>
 );
}

export default AfterActionCreatePage;
