import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { AlertTriangle, Shield, Bell, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface EmergencyCorrectionDialogProps {
 open: boolean;
 positionId: string;
 positionTitle: string;
 onClose: () => void;
 onSuccess: (correctedPosition: any, newVersion: any) => void;
 correctedContent?: {
 title_en?: string;
 title_ar?: string;
 content_en?: string;
 content_ar?: string;
 rationale_en?: string;
 rationale_ar?: string;
 };
}

export function EmergencyCorrectionDialog({
 open,
 positionId,
 positionTitle,
 onClose,
 onSuccess,
 correctedContent = {},
}: EmergencyCorrectionDialogProps) {
 const { t, i18n } = useTranslation('positions');
 const { user } = useAuthStore();
 const isRTL = i18n.language === 'ar';

 const [reason, setReason] = useState('');
 const [adminPassword, setAdminPassword] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Admin role check
 const isAdmin = user?.role === 'admin';

 const handleClose = () => {
 if (!isSubmitting) {
 setReason('');
 setAdminPassword('');
 setError(null);
 onClose();
 }
 };

 const handleSubmit = async () => {
 // Validation
 if (!isAdmin) {
 setError(t('emergencyCorrection.adminRequired'));
 return;
 }

 if (!reason.trim() || reason.trim().length < 10) {
 setError(t('emergencyCorrection.reasonRequired'));
 return;
 }

 if (!adminPassword.trim()) {
 setError(
 isRTL
 ? 'يرجى إدخال كلمة مرور المسؤول للتأكيد'
 : 'Please enter admin password to confirm'
 );
 return;
 }

 setIsSubmitting(true);
 setError(null);

 try {
 // Re-authenticate admin to verify password
 const { data: authData, error: authError } = await useAuthStore
 .getState()
 .supabase.auth.signInWithPassword({
 email: user?.email || '',
 password: adminPassword,
 });

 if (authError) {
 throw new Error(t('emergencyCorrection.invalidPassword'));
 }

 // Call emergency correction endpoint
 const { data: session } = await useAuthStore.getState().supabase.auth.getSession();
 const response = await fetch(
 `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/positions-emergency-correct`,
 {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${session?.session?.access_token}`,
 },
 body: JSON.stringify({
 position_id: positionId,
 correction_reason: reason,
 ...correctedContent,
 }),
 }
 );

 if (!response.ok) {
 const errorData = await response.json();
 throw new Error(errorData.error || errorData.error_ar || 'Emergency correction failed');
 }

 const result = await response.json();

 // Success
 onSuccess(result.position, result.new_version);
 handleClose();
 } catch (err) {
 console.error('Emergency correction error:', err);
 setError(err instanceof Error ? err.message : 'An unexpected error occurred');
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={handleClose}>
 <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <AlertTriangle className="size-5 text-red-600" />
 {isRTL ? 'تصحيح طارئ' : 'Emergency Correction'}
 </DialogTitle>
 <DialogDescription>
 {isRTL
 ? 'تصحيح موقف منشور بعد النشر. هذا إجراء حساس يتطلب صلاحيات المسؤول.'
 : 'Correct a published position after publication. This is a sensitive action requiring admin privileges.'}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-6">
 {/* Admin Check Warning */}
 {!isAdmin && (
 <div className="rounded-lg border border-red-200 bg-red-50 p-4">
 <div className="flex items-start gap-3">
 <Shield className="mt-0.5 size-5 text-red-600" />
 <div>
 <h4 className="mb-1 font-semibold text-red-900">
 {isRTL ? 'وصول مقيد' : 'Restricted Access'}
 </h4>
 <p className="text-sm text-red-800">
 {isRTL
 ? 'هذه الميزة متاحة فقط لمسؤولي النظام. يرجى الاتصال بالمسؤول إذا كنت بحاجة إلى إجراء تصحيح طارئ.'
 : 'This feature is only available to system administrators. Please contact an administrator if you need to perform an emergency correction.'}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Position Info */}
 <div className="rounded-lg bg-muted/50 p-4">
 <h4 className="mb-2 text-sm font-medium text-muted-foreground">
 {isRTL ? 'الموقف المراد تصحيحه' : 'Position to Correct'}
 </h4>
 <p className="text-sm font-medium">{positionTitle}</p>
 <p className="mt-1 text-xs text-muted-foreground">
 {isRTL ? 'معرف الموقف' : 'Position ID'}: {positionId.slice(0, 8)}...
 </p>
 </div>

 {/* Warning Message */}
 <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
 <div className="flex items-start gap-3">
 <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
 <div>
 <h4 className="mb-1 font-semibold text-amber-900">
 {isRTL ? 'تحذير: تصحيح بعد النشر' : 'Warning: Post-Publication Correction'}
 </h4>
 <p className="text-sm text-amber-800">
 {isRTL
 ? 'سيتم وضع علامة "تصحيح طارئ" على هذا الموقف بشكل دائم. سيتم إنشاء نسخة جديدة وإشعار جميع المجموعات المستهدفة بالتغيير.'
 : 'This position will be permanently marked with an "Emergency Correction" badge. A new version will be created and all audience groups will be notified of the change.'}
 </p>
 </div>
 </div>
 </div>

 {/* Emergency Correction Badge Preview */}
 <div className="rounded-lg bg-muted/50 p-4">
 <h4 className="mb-3 text-sm font-medium text-muted-foreground">
 {isRTL ? 'معاينة الشارة' : 'Badge Preview'}
 </h4>
 <div className="flex items-center gap-2">
 <Badge variant="destructive" className="flex items-center gap-1.5">
 <AlertTriangle className="size-3" />
 {isRTL ? 'تصحيح طارئ' : 'Emergency Correction'}
 </Badge>
 <span className="text-xs text-muted-foreground">
 {isRTL
 ? 'سيظهر على الموقف المصحح'
 : 'Will appear on corrected position'}
 </span>
 </div>
 </div>

 {/* Correction Reason */}
 <div className="space-y-2">
 <Label htmlFor="reason" className="text-sm font-medium">
 {isRTL ? 'سبب التصحيح الطارئ' : 'Emergency Correction Reason'}{' '}
 <span className="text-red-600">*</span>
 </Label>
 <textarea
 id="reason"
 className="min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
 placeholder={
 isRTL
 ? 'اشرح سبب الحاجة إلى هذا التصحيح الطارئ (10 أحرف على الأقل)...'
 : 'Explain why this emergency correction is needed (minimum 10 characters)...'
 }
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 disabled={!isAdmin || isSubmitting}
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 <p className="text-xs text-muted-foreground">
 {reason.length}/10 {isRTL ? 'أحرف كحد أدنى' : 'characters minimum'}
 </p>
 </div>

 {/* Admin Password Confirmation */}
 {isAdmin && (
 <div className="space-y-2">
 <Label htmlFor="adminPassword" className="text-sm font-medium">
 {isRTL ? 'أعد إدخال كلمة مرور المسؤول' : 'Re-enter Admin Password'}{' '}
 <span className="text-red-600">*</span>
 </Label>
 <Input
 id="adminPassword"
 type="password"
 placeholder={
 isRTL
 ? 'أدخل كلمة مرور المسؤول للتأكيد'
 : 'Enter your admin password to confirm'
 }
 value={adminPassword}
 onChange={(e) => setAdminPassword(e.target.value)}
 disabled={isSubmitting}
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 <p className="text-xs text-muted-foreground">
 {isRTL
 ? 'التحقق من صلاحيات المسؤول مطلوب لإجراء التصحيحات الطارئة'
 : 'Admin verification required to perform emergency corrections'}
 </p>
 </div>
 )}

 {/* Notification Warning */}
 <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
 <div className="flex items-start gap-3">
 <Bell className="mt-0.5 size-5 text-blue-600" />
 <div>
 <h4 className="mb-1 font-semibold text-blue-900">
 {isRTL ? 'إشعارات المجموعات المستهدفة' : 'Audience Group Notifications'}
 </h4>
 <p className="text-sm text-blue-800">
 {isRTL
 ? 'سيتم إرسال إشعارات تلقائية إلى جميع المجموعات المستهدفة المرتبطة بهذا الموقف لإعلامهم بالتصحيح الطارئ.'
 : 'Automatic notifications will be sent to all audience groups associated with this position to inform them of the emergency correction.'}
 </p>
 </div>
 </div>
 </div>

 {/* Error Message */}
 {error && (
 <div className="rounded-lg border border-red-200 bg-red-50 p-4">
 <p className="text-sm text-red-800">{error}</p>
 </div>
 )}
 </div>

 <DialogFooter className="flex-col gap-2 sm:flex-row">
 <Button
 variant="outline"
 onClick={handleClose}
 disabled={isSubmitting}
 className="w-full sm:w-auto"
 >
 {isRTL ? 'إلغاء' : 'Cancel'}
 </Button>
 <Button
 variant="destructive"
 onClick={handleSubmit}
 disabled={!isAdmin || isSubmitting || !reason.trim() || reason.trim().length < 10}
 className="w-full sm:w-auto"
 >
 {isSubmitting ? (
 <>
 <Loader2 className="me-2 size-4 animate-spin" />
 {isRTL ? 'جاري التصحيح...' : 'Correcting...'}
 </>
 ) : (
 <>
 <Shield className="me-2 size-4" />
 {isRTL ? 'تأكيد التصحيح الطارئ' : 'Confirm Emergency Correction'}
 </>
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
