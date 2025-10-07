import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Send, Loader2, AlertCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DecisionList, type Decision } from './DecisionList';
import { CommitmentEditor, type Commitment } from './CommitmentEditor';
import { RiskList, type Risk } from './RiskList';
import { FollowUpList } from './FollowUpList';
import { AttachmentUploader } from './AttachmentUploader';
import { AIExtractionButton } from './AIExtractionButton';

interface FollowUpAction {
  id?: string;
  description: string;
  assigned_to?: string;
  target_date?: Date;
  completed: boolean;
}

export interface AfterActionFormData {
  id?: string;
  engagement_id: string;
  dossier_id: string;
  is_confidential: boolean;
  attendees: string[];
  decisions: Decision[];
  commitments: Commitment[];
  risks: Risk[];
  follow_ups: FollowUpAction[];
  notes?: string;
  version?: number;
}

interface AfterActionFormProps {
  initialData?: Partial<AfterActionFormData>;
  engagementId: string;
  dossierId: string;
  onSave: (data: AfterActionFormData, isDraft: boolean) => Promise<void>;
  onPublish?: (data: AfterActionFormData) => Promise<void>;
  readOnly?: boolean;
  canPublish?: boolean;
  availableUsers?: Array<{ id: string; name: string }>;
  className?: string;
}

export function AfterActionForm({
  initialData,
  engagementId,
  dossierId,
  onSave,
  onPublish,
  readOnly = false,
  canPublish = false,
  availableUsers = [],
  className,
}: AfterActionFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Form state
  const [formData, setFormData] = useState<AfterActionFormData>({
    engagement_id: engagementId,
    dossier_id: dossierId,
    is_confidential: initialData?.is_confidential || false,
    attendees: initialData?.attendees || [],
    decisions: initialData?.decisions || [],
    commitments: initialData?.commitments || [],
    risks: initialData?.risks || [],
    follow_ups: initialData?.follow_ups || [],
    notes: initialData?.notes || '',
    version: initialData?.version,
    ...(initialData?.id && { id: initialData.id }),
  });

  const [attendeesInput, setAttendeesInput] = useState(
    initialData?.attendees?.join(', ') || ''
  );
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Update attendees array when input changes
  useEffect(() => {
    const attendeesList = attendeesInput
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    setFormData((prev) => ({ ...prev, attendees: attendeesList }));
  }, [attendeesInput]);

  // Mark form as dirty when changes occur
  useEffect(() => {
    if (!initialData) return;
    setIsDirty(true);
  }, [formData, initialData]);

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);

    try {
      await onSave(formData, true);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('afterActions.form.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!onPublish) return;

    // Validate form
    if (formData.attendees.length === 0) {
      setError(t('afterActions.form.attendeesRequired'));
      return;
    }

    if (formData.attendees.length > 100) {
      setError(t('afterActions.form.attendeesMax'));
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      await onPublish(formData);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('afterActions.form.publishFailed'));
    } finally {
      setPublishing(false);
    }
  };

  const handleAIExtraction = (extractedData: {
    decisions?: Decision[];
    commitments?: Commitment[];
    risks?: Risk[];
    follow_ups?: FollowUpAction[];
  }) => {
    // Merge extracted data with existing form data
    setFormData((prev) => ({
      ...prev,
      decisions: [
        ...prev.decisions,
        ...(extractedData.decisions?.filter((d) => (d.ai_confidence || 0) >= 0.5) || []),
      ],
      commitments: [
        ...prev.commitments,
        ...(extractedData.commitments?.filter((c) => (c.ai_confidence || 0) >= 0.5) || []),
      ],
      risks: [
        ...prev.risks,
        ...(extractedData.risks?.filter((r) => (r.ai_confidence || 0) >= 0.5) || []),
      ],
      follow_ups: [...prev.follow_ups, ...(extractedData.follow_ups || [])],
    }));
  };

  const isFormValid = () => {
    return (
      formData.attendees.length > 0 &&
      formData.attendees.length <= 100 &&
      (formData.decisions.length > 0 ||
        formData.commitments.length > 0 ||
        formData.risks.length > 0 ||
        formData.follow_ups.length > 0)
    );
  };

  return (
    <form
      className={cn('space-y-6', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      onSubmit={(e) => {
        e.preventDefault();
        handleSaveDraft();
      }}
    >
      {/* Header with AI Extraction */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {t('afterActions.form.title')}
              {formData.is_confidential && (
                <Shield className="h-5 w-5 text-amber-500" />
              )}
            </CardTitle>
            {!readOnly && <AIExtractionButton onExtract={handleAIExtraction} />}
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('afterActions.form.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">
              {t('afterActions.form.attendees')} *
            </Label>
            <Input
              id="attendees"
              type="text"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              placeholder={t('afterActions.form.attendeesPlaceholder')}
              disabled={readOnly}
              dir={isRTL ? 'rtl' : 'ltr'}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('afterActions.form.attendeesHelp')} ({formData.attendees.length}/100)
            </p>
          </div>

          {/* Confidential Flag */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confidential"
              checked={formData.is_confidential}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_confidential: !!checked }))
              }
              disabled={readOnly}
            />
            <Label
              htmlFor="confidential"
              className="text-sm font-normal cursor-pointer flex items-center gap-2"
            >
              {formData.is_confidential && <Shield className="h-4 w-4 text-amber-500" />}
              {t('afterActions.form.confidential')}
            </Label>
          </div>
          {formData.is_confidential && (
            <Alert className="border-amber-500">
              <Shield className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700">
                {t('afterActions.form.confidentialWarning')}
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('afterActions.form.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder={t('afterActions.form.notesPlaceholder')}
              rows={4}
              disabled={readOnly}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Decisions */}
      <DecisionList
        decisions={formData.decisions}
        onChange={(decisions) => setFormData((prev) => ({ ...prev, decisions }))}
        readOnly={readOnly}
      />

      <Separator />

      {/* Commitments */}
      <CommitmentEditor
        commitments={formData.commitments}
        onChange={(commitments) => setFormData((prev) => ({ ...prev, commitments }))}
        readOnly={readOnly}
        availableUsers={availableUsers}
      />

      <Separator />

      {/* Risks */}
      <RiskList
        risks={formData.risks}
        onChange={(risks) => setFormData((prev) => ({ ...prev, risks }))}
        readOnly={readOnly}
      />

      <Separator />

      {/* Follow-up Actions */}
      <FollowUpList
        followUpActions={formData.follow_ups}
        onChange={(follow_ups) => setFormData((prev) => ({ ...prev, follow_ups }))}
        readOnly={readOnly}
      />

      <Separator />

      {/* Attachments */}
      <AttachmentUploader
        attachmentIds={[]}
        onChange={() => {}}
        maxFiles={10}
        maxFileSize={100 * 1024 * 1024} // 100MB
      />

      {/* Action Buttons */}
      {!readOnly && (
        <Card>
          <CardContent className="pt-6">
            <div className={cn('flex gap-4', isRTL && 'flex-row-reverse')}>
              <Button
                type="submit"
                disabled={saving || publishing || !isDirty}
                className="flex-1"
                variant="outline"
              >
                {saving ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('afterActions.form.saving')}
                  </>
                ) : (
                  <>
                    <Save className="me-2 h-4 w-4" />
                    {t('afterActions.form.saveDraft')}
                  </>
                )}
              </Button>

              {canPublish && onPublish && (
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || publishing || !isFormValid()}
                  className="flex-1"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {t('afterActions.form.publishing')}
                    </>
                  ) : (
                    <>
                      <Send className="me-2 h-4 w-4" />
                      {t('afterActions.form.publish')}
                    </>
                  )}
                </Button>
              )}
            </div>

            {!isFormValid() && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                {t('afterActions.form.publishRequirements')}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </form>
  );
}
