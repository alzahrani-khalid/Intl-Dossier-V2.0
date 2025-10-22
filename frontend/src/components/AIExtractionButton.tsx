import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Decision } from './DecisionList';
import type { Commitment } from './CommitmentEditor';
import type { Risk } from './RiskList';

interface ExtractionResult {
  decisions?: Decision[];
  commitments?: Commitment[];
  risks?: Risk[];
  follow_ups?: Array<{
    description: string;
    assigned_to?: string;
    target_date?: Date;
  }>;
}

interface AIExtractionButtonProps {
  onExtract: (result: ExtractionResult) => void;
  disabled?: boolean;
  className?: string;
}

type ExtractionMode = 'sync' | 'async' | 'auto';
type ExtractionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

export function AIExtractionButton({
  onExtract,
  disabled = false,
  className,
}: AIExtractionButtonProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [mode, setMode] = useState<ExtractionMode>('auto');
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  const estimateProcessingTime = useCallback((fileSize: number, lang: string): number => {
    // Estimation: 100KB/sec baseline
    const baseTime = fileSize / (1024 * 100);
    // Arabic is ~30% slower to process
    const langMultiplier = lang === 'ar' ? 1.3 : 1.0;
    return Math.ceil(baseTime * langMultiplier);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(t('afterActions.ai.invalidFileType'));
      return;
    }

    // Validate file size (max 10MB for extraction)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t('afterActions.ai.fileTooLarge'));
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Estimate processing time
    const estimated = estimateProcessingTime(selectedFile.size, language);
    setEstimatedTime(estimated);
  };

  const handleExtract = async () => {
    if (!file) return;

    setStatus('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('mode', mode);

      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t('afterActions.ai.extractionFailed'));
      }

      const data = await response.json();

      // Check if sync or async
      if (data.job_id) {
        // Async mode
        setJobId(data.job_id);
        setEstimatedTime(data.estimated_time);
        setStatus('processing');
        pollJobStatus(data.job_id);
      } else {
        // Sync mode - immediate result
        setStatus('completed');
        onExtract(data.result);
        setTimeout(() => {
          setOpen(false);
          resetState();
        }, 1500);
      }
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : t('afterActions.ai.extractionFailed'));
    }
  };

  const pollJobStatus = async (id: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/extract/${id}`);
        const data = await response.json();

        if (data.status === 'completed') {
          setStatus('completed');
          setProgress(100);
          onExtract(data.result);
          setTimeout(() => {
            setOpen(false);
            resetState();
          }, 1500);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError(data.error || t('afterActions.ai.extractionFailed'));
        } else if (data.status === 'processing') {
          setProgress(data.progress || 0);
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (err) {
        setStatus('failed');
        setError(t('afterActions.ai.extractionFailed'));
      }
    };

    poll();
  };

  const resetState = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
    setError(null);
    setJobId(null);
    setEstimatedTime(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('gap-2', className)}
        >
          <Sparkles className="size-4" />
          {t('afterActions.ai.extractButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            {t('afterActions.ai.title')}
          </DialogTitle>
          <DialogDescription>
            {t('afterActions.ai.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('afterActions.ai.uploadFile')}</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileChange}
              disabled={status === 'processing' || status === 'uploading'}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                {estimatedTime && (
                  <span className="ms-2">
                    " {t('afterActions.ai.estimatedTime')}: {estimatedTime}s
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">{t('afterActions.ai.language')}</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'ar')}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('common.english')}</SelectItem>
                <SelectItem value="ar">{t('common.arabic')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Processing Mode */}
          <div className="space-y-2">
            <Label htmlFor="mode">{t('afterActions.ai.mode')}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as ExtractionMode)}>
              <SelectTrigger id="mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t('afterActions.ai.modeAuto')}</SelectItem>
                <SelectItem value="sync">{t('afterActions.ai.modeSync')}</SelectItem>
                <SelectItem value="async">{t('afterActions.ai.modeAsync')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === 'auto' && t('afterActions.ai.modeAutoDesc')}
              {mode === 'sync' && t('afterActions.ai.modeSyncDesc')}
              {mode === 'async' && t('afterActions.ai.modeAsyncDesc')}
            </p>
          </div>

          {/* Status Display */}
          {status !== 'idle' && (
            <div className="space-y-2">
              {status === 'uploading' && (
                <Alert>
                  <Loader2 className="size-4 animate-spin" />
                  <AlertDescription>{t('afterActions.ai.uploading')}</AlertDescription>
                </Alert>
              )}

              {status === 'processing' && (
                <Alert>
                  <Loader2 className="size-4 animate-spin" />
                  <AlertDescription>
                    {t('afterActions.ai.processing')} ({progress}%)
                    {jobId && (
                      <Badge variant="secondary" className="ms-2">
                        Job: {jobId.substring(0, 8)}
                      </Badge>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {status === 'completed' && (
                <Alert className="border-green-500">
                  <CheckCircle className="size-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    {t('afterActions.ai.completed')}
                  </AlertDescription>
                </Alert>
              )}

              {status === 'failed' && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Info Alert */}
          {status === 'idle' && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                {t('afterActions.ai.info')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
          <Button
            onClick={handleExtract}
            disabled={!file || status === 'processing' || status === 'uploading'}
            className="flex-1"
          >
            {status === 'uploading' || status === 'processing' ? (
              <>
                <Loader2 className="me-2 size-4 animate-spin" />
                {t('afterActions.ai.extracting')}
              </>
            ) : (
              <>
                <Upload className="me-2 size-4" />
                {t('afterActions.ai.extract')}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={status === 'processing' || status === 'uploading'}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
