/**
 * BriefingPackGenerator Component (T047)
 * Generate bilingual briefing packs with language selection
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenerateBriefingPack } from '@/hooks/useGenerateBriefingPack';
import { useBriefingPackStatus } from '@/hooks/useBriefingPackStatus';

export interface BriefingPackGeneratorProps {
 engagementId: string;
 attachedPositionCount: number;
 className?: string;
}

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'failed';

export const BriefingPackGenerator: React.FC<BriefingPackGeneratorProps> = ({
 engagementId,
 attachedPositionCount,
 className = '',
}) => {
 const { t } = useTranslation();

 // State
 const [language, setLanguage] = useState<'en' | 'ar'>('en');
 const [jobId, setJobId] = useState<string | null>(null);
 const [status, setStatus] = useState<GenerationStatus>('idle');
 const [fileUrl, setFileUrl] = useState<string | null>(null);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 // Mutations and queries
 const generateMutation = useGenerateBriefingPack(engagementId);
 const { data: jobStatus, isLoading: isPolling } = useBriefingPackStatus(jobId || '', {
 enabled: !!jobId && status === 'generating',
 refetchInterval: 2000, // Poll every 2 seconds
 });

 // Handle job status updates
 useEffect(() => {
 if (!jobStatus) return;

 if (jobStatus.status === 'completed') {
 setStatus('completed');
 setFileUrl(jobStatus.file_url);
 setJobId(null);
 } else if (jobStatus.status === 'failed') {
 setStatus('failed');
 setErrorMessage(jobStatus.error_message || t('positions.briefing.error'));
 setJobId(null);
 }
 }, [jobStatus, t]);

 // Handle generation
 const handleGenerate = async () => {
 if (attachedPositionCount === 0) {
 setErrorMessage(t('positions.briefing.noPositions'));
 return;
 }

 setStatus('generating');
 setErrorMessage(null);
 setFileUrl(null);

 try {
 const result = await generateMutation.mutateAsync({ language });
 setJobId(result.job_id);
 } catch (error: any) {
 setStatus('failed');
 setErrorMessage(error.message || t('positions.briefing.error'));
 }
 };

 // Handle download
 const handleDownload = () => {
 if (fileUrl) {
 window.open(fileUrl, '_blank');
 }
 };

 // Reset
 const handleReset = () => {
 setStatus('idle');
 setFileUrl(null);
 setErrorMessage(null);
 setJobId(null);
 };

 // Calculate estimated time (10s per 100 positions)
 const estimatedTime = Math.ceil((attachedPositionCount / 100) * 10);

 return (
 <Card className={className}>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 {t('positions.briefing.title')}
 </CardTitle>
 <CardDescription>
 {t('positions.briefing.description', { count: attachedPositionCount })}
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-4">
 {/* Language Selection */}
 {status === 'idle' && (
 <>
 <div className="space-y-3">
 <Label>{t('positions.briefing.selectLanguage')}</Label>
 <RadioGroup value={language} onValueChange={(val) => setLanguage(val as 'en' | 'ar')}>
 <div className="flex items-center space-x-2">
 <RadioGroupItem value="en" id="lang-en" />
 <Label htmlFor="lang-en" className="cursor-pointer">
 {t('positions.briefing.language.english')}
 </Label>
 </div>
 <div className="flex items-center space-x-2">
 <RadioGroupItem value="ar" id="lang-ar" />
 <Label htmlFor="lang-ar" className="cursor-pointer">
 {t('positions.briefing.language.arabic')}
 </Label>
 </div>
 </RadioGroup>
 </div>

 {/* Info */}
 <Alert>
 <AlertDescription>
 {t('positions.briefing.estimatedTime', { seconds: estimatedTime })}
 </AlertDescription>
 </Alert>

 {/* Generate Button */}
 <Button
 onClick={handleGenerate}
 disabled={attachedPositionCount === 0 || generateMutation.isPending}
 className="w-full"
 >
 {generateMutation.isPending ? (
 <>
 <Loader2 className="me-2 h-4 w-4 animate-spin" />
 {t('positions.briefing.initiating')}
 </>
 ) : (
 <>
 <FileText className="me-2 h-4 w-4" />
 {t('positions.briefing.generate')}
 </>
 )}
 </Button>
 </>
 )}

 {/* Generating */}
 {status === 'generating' && (
 <div className="space-y-4">
 <div className="flex items-center justify-center py-6">
 <Loader2 className="h-12 w-12 animate-spin text-primary" />
 </div>
 <div className="space-y-2">
 <p className="text-center text-sm font-medium">{t('positions.briefing.generating')}</p>
 <Progress value={undefined} className="h-2" />
 <p className="text-center text-xs text-muted-foreground">
 {t('positions.briefing.pleaseWait')}
 </p>
 </div>
 </div>
 )}

 {/* Completed */}
 {status === 'completed' && fileUrl && (
 <div className="space-y-4">
 <div className="flex flex-col items-center gap-2 rounded-lg border border-green-500 bg-green-50 p-6 dark:bg-green-950">
 <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
 <p className="font-medium text-green-900 dark:text-green-100">
 {t('positions.briefing.completed')}
 </p>
 </div>

 <Button onClick={handleDownload} className="w-full" >
 <Download className="me-2 h-5 w-5" />
 {t('positions.briefing.download')}
 </Button>

 <Button onClick={handleReset} variant="outline" className="w-full">
 {t('positions.briefing.generateAnother')}
 </Button>
 </div>
 )}

 {/* Failed */}
 {status === 'failed' && (
 <div className="space-y-4">
 <Alert variant="destructive">
 <XCircle className="h-4 w-4" />
 <AlertDescription>{errorMessage}</AlertDescription>
 </Alert>

 <Button onClick={handleReset} variant="outline" className="w-full">
 {t('positions.briefing.tryAgain')}
 </Button>
 </div>
 )}

 {/* Validation Error */}
 {attachedPositionCount === 0 && status === 'idle' && (
 <Alert>
 <AlertDescription>{t('positions.briefing.noPositions')}</AlertDescription>
 </Alert>
 )}
 </CardContent>
 </Card>
 );
};
