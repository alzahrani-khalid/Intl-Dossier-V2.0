/**
 * Activate Account Page
 * Handles user account activation with token validation and password setup
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support for Arabic
 * - Password strength validation
 * - Touch-friendly (44x44px targets)
 * - Auto-redirect to login on success
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useActivateAccount } from '@/hooks/use-user-management';
import { Button } from '@/components/ui/button';
import {
 Form,
 FormControl,
 FormDescription,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

// ============================================================================
// Password Strength Validation
// ============================================================================

const passwordSchema = z.string()
 .min(12, 'Password must be at least 12 characters')
 .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
 .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
 .regex(/[0-9]/, 'Password must contain at least one number')
 .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)')
 .refine((password) => {
 const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
 return !commonPasswords.includes(password.toLowerCase());
 }, 'Password is too common');

const activateAccountSchema = z.object({
 password: passwordSchema,
 confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
 message: 'Passwords do not match',
 path: ['confirm_password'],
});

type ActivateAccountFormData = z.infer<typeof activateAccountSchema>;

// ============================================================================
// Password Strength Indicator
// ============================================================================

interface PasswordRequirement {
 label: string;
 test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
 {
 label: 'At least 12 characters',
 test: (password) => password.length >= 12,
 },
 {
 label: 'One uppercase letter',
 test: (password) => /[A-Z]/.test(password),
 },
 {
 label: 'One lowercase letter',
 test: (password) => /[a-z]/.test(password),
 },
 {
 label: 'One number',
 test: (password) => /[0-9]/.test(password),
 },
 {
 label: 'One special character (@$!%*?&)',
 test: (password) => /[@$!%*?&]/.test(password),
 },
];

interface PasswordStrengthProps {
 password: string;
 isRTL: boolean;
}

function PasswordStrength({ password, isRTL }: PasswordStrengthProps) {
 const { t } = useTranslation();

 return (
 <div className="mt-2 space-y-2">
 <p className="text-xs sm:text-sm font-medium text-muted-foreground">
 {t('auth.password_requirements', 'Password requirements:')}
 </p>
 {passwordRequirements.map((req, index) => {
 const met = req.test(password);
 return (
 <div
 key={index}
 className={`flex items-center gap-2 text-xs sm:text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
 >
 {met ? (
 <CheckCircle className="h-4 w-4 text-green-500" />
 ) : (
 <XCircle className="h-4 w-4 text-muted-foreground" />
 )}
 <span className={met ? 'text-green-500' : 'text-muted-foreground'}>
 {req.label}
 </span>
 </div>
 );
 })}
 </div>
 );
}

// ============================================================================
// Component
// ============================================================================

export function ActivateAccountPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const [searchParams] = useSearchParams();
 const activationToken = searchParams.get('token');
 const { mutate: activateAccount, isPending } = useActivateAccount();
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);

 const form = useForm<ActivateAccountFormData>({
 resolver: zodResolver(activateAccountSchema),
 defaultValues: {
 password: '',
 confirm_password: '',
 },
 });

 const password = form.watch('password');

 // Redirect if no token
 useEffect(() => {
 if (!activationToken) {
 window.location.href = '/login';
 }
 }, [activationToken]);

 const onSubmit = (data: ActivateAccountFormData) => {
 if (!activationToken) return;

 activateAccount({
 activation_token: activationToken,
 password: data.password,
 });
 };

 if (!activationToken) {
 return null;
 }

 return (
 <div
 className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-muted/30"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <Card className="w-full max-w-md sm:max-w-lg">
 <CardHeader className="space-y-2 sm:space-y-3">
 <CardTitle className="text-2xl sm:text-3xl text-center">
 {t('auth.activate_account', 'Activate Your Account')}
 </CardTitle>
 <CardDescription className="text-center text-sm sm:text-base">
 {t('auth.activate_description', 'Set up your password to activate your account and get started')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <Form {...form}>
 <form
 onSubmit={form.handleSubmit(onSubmit)}
 className="space-y-4 sm:space-y-6"
 >
 {/* Password Field */}
 <FormField
 control={form.control}
 name="password"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('auth.password', 'Password')}
 </FormLabel>
 <FormControl>
 <div className="relative">
 <Input
 {...field}
 type={showPassword ? 'text' : 'password'}
 placeholder={t('auth.password_placeholder', 'Enter your password')}
 className={`h-11 sm:h-10 px-4 text-base sm:text-sm ${isRTL ? 'pe-12' : 'pr-12'}`}
 disabled={isPending}
 />
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className={`absolute top-0 ${isRTL ? 'start-0' : 'end-0'} h-11 sm:h-10 px-3`}
 onClick={() => setShowPassword(!showPassword)}
 >
 {showPassword ? (
 <EyeOff className="h-4 w-4" />
 ) : (
 <Eye className="h-4 w-4" />
 )}
 </Button>
 </div>
 </FormControl>
 <FormMessage />
 {password && <PasswordStrength password={password} isRTL={isRTL} />}
 </FormItem>
 )}
 />

 {/* Confirm Password Field */}
 <FormField
 control={form.control}
 name="confirm_password"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('auth.confirm_password', 'Confirm Password')}
 </FormLabel>
 <FormControl>
 <div className="relative">
 <Input
 {...field}
 type={showConfirmPassword ? 'text' : 'password'}
 placeholder={t('auth.confirm_password_placeholder', 'Re-enter your password')}
 className={`h-11 sm:h-10 px-4 text-base sm:text-sm ${isRTL ? 'pe-12' : 'pr-12'}`}
 disabled={isPending}
 />
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className={`absolute top-0 ${isRTL ? 'start-0' : 'end-0'} h-11 sm:h-10 px-3`}
 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
 >
 {showConfirmPassword ? (
 <EyeOff className="h-4 w-4" />
 ) : (
 <Eye className="h-4 w-4" />
 )}
 </Button>
 </div>
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Info Alert */}
 <Alert>
 <AlertTitle className="text-sm sm:text-base">
 {t('auth.security_notice', 'Security Notice')}
 </AlertTitle>
 <AlertDescription className="text-xs sm:text-sm">
 {t('auth.security_notice_description', 'Your password is encrypted and securely stored. Make sure to use a strong, unique password.')}
 </AlertDescription>
 </Alert>

 {/* Submit Button */}
 <Button
 type="submit"
 className="h-11 sm:h-10 px-6 sm:px-8 text-base sm:text-sm w-full"
 disabled={isPending}
 >
 {isPending
 ? t('auth.activating', 'Activating...')
 : t('auth.activate_account_button', 'Activate Account')}
 </Button>

 {/* Back to Login Link */}
 <p className="text-center text-xs sm:text-sm text-muted-foreground">
 {t('auth.already_activated', 'Already activated?')}{' '}
 <a
 href="/login"
 className="text-primary hover:underline font-medium"
 >
 {t('auth.sign_in', 'Sign in')}
 </a>
 </p>
 </form>
 </Form>
 </CardContent>
 </Card>
 </div>
 );
}
