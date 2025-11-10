import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MfaSetupDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 userId: string;
}

interface MfaSetupResponse {
 success: boolean;
 secret?: string;
 qrCodeUrl?: string;
 backupCodes?: string[];
 error?: string;
}

interface MfaVerifyResponse {
 success: boolean;
 mfaEnabled?: boolean;
 error?: string;
}

/**
 * MFA Setup Dialog Component
 *
 * Mobile-first, RTL-compatible dialog for setting up Multi-Factor Authentication
 * Features:
 * - QR code display for authenticator app scanning
 * - Manual secret key entry option
 * - TOTP code verification
 * - Backup codes display and download
 * - Responsive layout with proper touch targets
 */
export function MfaSetupDialog({ open, onOpenChange, userId }: MfaSetupDialogProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const queryClient = useQueryClient();

 const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
 const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
 const [totpCode, setTotpCode] = useState('');
 const [error, setError] = useState<string | null>(null);

 // Setup MFA mutation
 const setupMutation = useMutation({
 mutationFn: async () => {
 const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-mfa`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
 },
 body: JSON.stringify({ userId }),
 });

 if (!response.ok) {
 const error = await response.json();
 throw new Error(error.error || 'Failed to setup MFA');
 }

 return response.json() as Promise<MfaSetupResponse>;
 },
 onSuccess: (data) => {
 setSetupData(data);
 setStep('verify');
 setError(null);
 },
 onError: (error) => {
 setError(error instanceof Error ? error.message : 'Failed to setup MFA');
 },
 });

 // Verify MFA mutation
 const verifyMutation = useMutation({
 mutationFn: async () => {
 const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-mfa-setup`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
 },
 body: JSON.stringify({ userId, totpCode }),
 });

 if (!response.ok) {
 const error = await response.json();
 throw new Error(error.error || 'Failed to verify MFA');
 }

 return response.json() as Promise<MfaVerifyResponse>;
 },
 onSuccess: () => {
 setStep('backup');
 setError(null);
 queryClient.invalidateQueries({ queryKey: ['user', userId] });
 toast.success(t('userManagement.mfa.setupSuccess'));
 },
 onError: (error) => {
 setError(error instanceof Error ? error.message : 'Invalid verification code');
 setTotpCode('');
 },
 });

 const handleSetupMfa = () => {
 setupMutation.mutate();
 };

 const handleVerifyCode = () => {
 if (totpCode.length !== 6) {
 setError('Please enter a 6-digit code');
 return;
 }
 verifyMutation.mutate();
 };

 const handleCopySecret = () => {
 if (setupData?.secret) {
 navigator.clipboard.writeText(setupData.secret);
 toast.success(t('userManagement.mfa.secretCopied'));
 }
 };

 const handleDownloadBackupCodes = () => {
 if (setupData?.backupCodes) {
 const blob = new Blob(
 [setupData.backupCodes.join('\n')],
 { type: 'text/plain' }
 );
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `mfa-backup-codes-${userId}.txt`;
 a.click();
 URL.revokeObjectURL(url);
 toast.success(t('userManagement.mfa.backupCodesDownloaded'));
 }
 };

 const handleClose = () => {
 setStep('setup');
 setSetupData(null);
 setTotpCode('');
 setError(null);
 onOpenChange(false);
 };

 return (
 <Dialog open={open} onOpenChange={handleClose}>
 <DialogContent
 className="max-w-[95vw] sm:max-w-md md:max-w-lg"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <DialogHeader>
 <DialogTitle className="text-start text-lg sm:text-xl">
 {step === 'setup' && t('userManagement.mfa.setupTitle')}
 {step === 'verify' && t('userManagement.mfa.verifyTitle')}
 {step === 'backup' && t('userManagement.mfa.backupTitle')}
 </DialogTitle>
 <DialogDescription className="text-start text-sm sm:text-base">
 {step === 'setup' && t('userManagement.mfa.setupDescription')}
 {step === 'verify' && t('userManagement.mfa.verifyDescription')}
 {step === 'backup' && t('userManagement.mfa.backupDescription')}
 </DialogDescription>
 </DialogHeader>

 {error && (
 <Alert variant="destructive" className="my-2 sm:my-4">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription className="text-sm">{error}</AlertDescription>
 </Alert>
 )}

 {/* Step 1: Setup - Show QR Code */}
 {step === 'setup' && (
 <div className="flex flex-col gap-4 py-2 sm:py-4">
 <p className="text-sm text-muted-foreground text-start">
 {t('userManagement.mfa.scanInstructions')}
 </p>
 <Button
 onClick={handleSetupMfa}
 disabled={setupMutation.isPending}
 className="w-full "
 >
 {setupMutation.isPending ? t('common.loading') : t('userManagement.mfa.generateQR')}
 </Button>
 </div>
 )}

 {/* Step 2: Verify - Show QR and verification input */}
 {step === 'verify' && setupData && (
 <div className="flex flex-col gap-4 py-2 sm:py-4">
 {/* QR Code */}
 <div className="flex justify-center py-2 sm:py-4">
 <img
 src={setupData.qrCodeUrl}
 alt="MFA QR Code"
 className="w-48 h-48 sm:w-56 sm:h-56"
 />
 </div>

 {/* Manual Secret Key */}
 <div className="flex flex-col gap-2">
 <Label className="text-start text-sm">
 {t('userManagement.mfa.manualEntry')}
 </Label>
 <div className="flex gap-2">
 <Input
 value={setupData.secret}
 readOnly
 className="font-mono text-xs sm:text-sm"
 />
 <Button
 variant="outline"
 size="icon"
 onClick={handleCopySecret}
 className=" "
 >
 <Copy className="h-4 w-4" />
 </Button>
 </div>
 </div>

 {/* Verification Code Input */}
 <div className="flex flex-col gap-2">
 <Label htmlFor="totp-code" className="text-start text-sm">
 {t('userManagement.mfa.verificationCode')}
 </Label>
 <Input
 id="totp-code"
 type="text"
 placeholder="000000"
 value={totpCode}
 onChange={(e) => {
 const value = e.target.value.replace(/\D/g, '').slice(0, 6);
 setTotpCode(value);
 setError(null);
 }}
 className="font-mono text-center text-lg sm:text-xl tracking-widest"
 maxLength={6}
 />
 </div>

 <Button
 onClick={handleVerifyCode}
 disabled={verifyMutation.isPending || totpCode.length !== 6}
 className="w-full "
 >
 {verifyMutation.isPending ? t('common.verifying') : t('common.verify')}
 </Button>
 </div>
 )}

 {/* Step 3: Backup Codes */}
 {step === 'backup' && setupData?.backupCodes && (
 <div className="flex flex-col gap-4 py-2 sm:py-4">
 <Alert className="bg-green-50 border-green-200">
 <CheckCircle2 className="h-4 w-4 text-green-600" />
 <AlertDescription className="text-sm text-green-800">
 {t('userManagement.mfa.mfaEnabled')}
 </AlertDescription>
 </Alert>

 <div className="flex flex-col gap-2">
 <Label className="text-start text-sm font-semibold">
 {t('userManagement.mfa.backupCodesLabel')}
 </Label>
 <p className="text-xs sm:text-sm text-muted-foreground text-start">
 {t('userManagement.mfa.backupCodesWarning')}
 </p>

 <div className="grid grid-cols-2 gap-2 p-3 sm:p-4 bg-muted rounded-lg font-mono text-xs sm:text-sm">
 {setupData.backupCodes.map((code, index) => (
 <div key={index} className="text-center">
 {code}
 </div>
 ))}
 </div>

 <Button
 onClick={handleDownloadBackupCodes}
 variant="outline"
 className="w-full gap-2"
 >
 <Download className="h-4 w-4" />
 {t('userManagement.mfa.downloadBackupCodes')}
 </Button>
 </div>
 </div>
 )}

 <DialogFooter className="gap-2 sm:gap-0">
 {step === 'backup' && (
 <Button
 onClick={handleClose}
 className="w-full sm:w-auto "
 >
 {t('common.close')}
 </Button>
 )}
 {step !== 'backup' && (
 <Button
 variant="outline"
 onClick={handleClose}
 className="w-full sm:w-auto "
 >
 {t('common.cancel')}
 </Button>
 )}
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
