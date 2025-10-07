import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Download, Loader2, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepUpMFA } from './StepUpMFA';

interface PDFGeneratorButtonProps {
  afterActionId: string;
  isConfidential: boolean;
  disabled?: boolean;
  className?: string;
}

type PDFLanguage = 'en' | 'ar' | 'both';
type GenerationStatus = 'idle' | 'verifying' | 'generating' | 'completed' | 'failed';

export function PDFGeneratorButton({
  afterActionId,
  isConfidential,
  disabled = false,
  className,
}: PDFGeneratorButtonProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<PDFLanguage>('both');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const handleGenerate = async () => {
    // Check if confidential record requires step-up auth
    if (isConfidential && !mfaToken) {
      setShowMFA(true);
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      const response = await fetch(`/api/after-actions/${afterActionId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(mfaToken && { 'X-MFA-Token': mfaToken }),
        },
        body: JSON.stringify({ language }),
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 403 && data.error === 'step_up_required') {
          setShowMFA(true);
          setStatus('verifying');
          return;
        }

        throw new Error(data.error || t('afterActions.pdf.generationFailed'));
      }

      const data = await response.json();

      setStatus('completed');
      setPdfUrl(data.pdf_url);
      setExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours from now
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : t('afterActions.pdf.generationFailed'));
    }
  };

  const handleMFASuccess = (token: string) => {
    setMfaToken(token);
    setShowMFA(false);
    // Retry generation with MFA token
    handleGenerate();
  };

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const resetState = () => {
    setStatus('idle');
    setError(null);
    setPdfUrl(null);
    setExpiresAt(null);
    setMfaToken(null);
    setShowMFA(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return '';

    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return t('afterActions.pdf.expiresIn', { hours, minutes });
  };

  if (showMFA) {
    return (
      <StepUpMFA
        open={showMFA}
        onClose={() => {
          setShowMFA(false);
          setStatus('idle');
        }}
        onSuccess={handleMFASuccess}
        reason={t('afterActions.pdf.mfaReason')}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('gap-2', className)}
        >
          <FileText className="h-4 w-4" />
          {t('afterActions.pdf.generateButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('afterActions.pdf.title')}
            {isConfidential && (
              <Shield className="h-4 w-4 text-amber-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            {t('afterActions.pdf.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Confidential Warning */}
          {isConfidential && status === 'idle' && (
            <Alert className="border-amber-500">
              <Shield className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700">
                {t('afterActions.pdf.confidentialWarning')}
              </AlertDescription>
            </Alert>
          )}

          {/* Language Selection */}
          {status === 'idle' && (
            <div className="space-y-3">
              <Label>{t('afterActions.pdf.selectLanguage')}</Label>
              <RadioGroup value={language} onValueChange={(v) => setLanguage(v as PDFLanguage)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="lang-en" />
                  <Label htmlFor="lang-en" className="font-normal cursor-pointer">
                    {t('afterActions.pdf.englishOnly')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ar" id="lang-ar" />
                  <Label htmlFor="lang-ar" className="font-normal cursor-pointer">
                    {t('afterActions.pdf.arabicOnly')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="lang-both" />
                  <Label htmlFor="lang-both" className="font-normal cursor-pointer">
                    {t('afterActions.pdf.both')} {t('common.recommended')}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Status Display */}
          {status === 'verifying' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>{t('afterActions.pdf.verifying')}</AlertDescription>
            </Alert>
          )}

          {status === 'generating' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {t('afterActions.pdf.generating')}
                <span className="block text-xs text-muted-foreground mt-1">
                  {t('afterActions.pdf.estimatedTime')}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {status === 'completed' && pdfUrl && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                <div className="space-y-2">
                  <p>{t('afterActions.pdf.completed')}</p>
                  <p className="text-xs text-muted-foreground">
                    {getTimeRemaining()}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {status === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          {status === 'idle' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('afterActions.pdf.info')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
          {status === 'completed' && pdfUrl ? (
            <>
              <Button onClick={handleDownload} className="flex-1">
                <Download className="me-2 h-4 w-4" />
                {t('afterActions.pdf.download')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t('common.close')}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleGenerate}
                disabled={status === 'generating' || status === 'verifying'}
                className="flex-1"
              >
                {status === 'generating' || status === 'verifying' ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t('afterActions.pdf.generating')}
                  </>
                ) : (
                  <>
                    <FileText className="me-2 h-4 w-4" />
                    {t('afterActions.pdf.generate')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={status === 'generating' || status === 'verifying'}
              >
                {t('common.cancel')}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
