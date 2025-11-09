/**
 * Role Assignment Dialog Component
 * Dialog for assigning or changing user roles (admin only)
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support for Arabic
 * - Form validation with Zod
 * - Touch-friendly (44x44px targets)
 * - Dual approval workflow notification for admin roles
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useRoleAssignment } from '@/hooks/use-role-assignment';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
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
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, UserCog } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ============================================================================
// Form Schema
// ============================================================================

const roleAssignmentSchema = z.object({
 user_id: z.string().uuid('Invalid user ID'),
 new_role: z.enum(['admin', 'editor', 'viewer'], {
 required_error: 'Please select a role',
 }),
 reason: z.string()
 .min(10, 'Reason must be at least 10 characters')
 .max(500, 'Reason must be at most 500 characters')
 .optional(),
});

type RoleAssignmentFormData = z.infer<typeof roleAssignmentSchema>;

// ============================================================================
// Component
// ============================================================================

interface RoleAssignmentDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 userId: string;
 currentRole: 'admin' | 'editor' | 'viewer';
 userEmail: string;
}

export function RoleAssignmentDialog({
 open,
 onOpenChange,
 userId,
 currentRole,
 userEmail,
}: RoleAssignmentDialogProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { mutate: assignRole, isPending } = useRoleAssignment();

 const form = useForm<RoleAssignmentFormData>({
 resolver: zodResolver(roleAssignmentSchema),
 defaultValues: {
 user_id: userId,
 new_role: currentRole,
 reason: '',
 },
 });

 const selectedRole = form.watch('new_role');
 const isAdminRole = selectedRole === 'admin';
 const isRoleChanged = selectedRole !== currentRole;

 const onSubmit = (data: RoleAssignmentFormData) => {
 assignRole(
 {
 user_id: data.user_id,
 new_role: data.new_role,
 reason: data.reason,
 },
 {
 onSuccess: () => {
 form.reset();
 onOpenChange(false);
 },
 }
 );
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent
 className="w-[95vw] max-w-md sm:max-w-lg px-4 sm:px-6"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
 <UserCog className="h-5 w-5 sm:h-6 sm:w-6" />
 {t('user_management.assign_role', 'Assign Role')}
 </DialogTitle>
 <DialogDescription className="text-sm sm:text-base">
 {t('user_management.assign_role_description', 'Change user role and permissions')}
 </DialogDescription>
 </DialogHeader>

 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
 {/* User Email Display */}
 <div className="rounded-lg bg-muted p-3 sm:p-4">
 <p className="text-xs sm:text-sm text-muted-foreground">
 {t('user_management.user', 'User')}
 </p>
 <p className="text-sm sm:text-base font-medium text-start">{userEmail}</p>
 </div>

 {/* Current Role Display */}
 <div className="flex items-center gap-2 text-sm sm:text-base">
 <span className="text-muted-foreground">
 {t('user_management.current_role', 'Current role')}:
 </span>
 <span className="font-medium capitalize">{currentRole}</span>
 </div>

 {/* New Role Selection */}
 <FormField
 control={form.control}
 name="new_role"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.new_role', 'New Role')}
 </FormLabel>
 <Select
 onValueChange={field.onChange}
 defaultValue={field.value}
 disabled={isPending}
 >
 <FormControl>
 <SelectTrigger className="h-11 sm:h-10 px-4 text-base sm:text-sm">
 <SelectValue
 placeholder={t('user_management.select_role', 'Select role')}
 />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="viewer">
 {t('user_management.role_viewer', 'Viewer')}
 </SelectItem>
 <SelectItem value="editor">
 {t('user_management.role_editor', 'Editor')}
 </SelectItem>
 <SelectItem value="admin">
 {t('user_management.role_admin', 'Admin')}
 </SelectItem>
 </SelectContent>
 </Select>
 <FormDescription className="text-xs sm:text-sm">
 {t(
 'user_management.role_change_description',
 'User access level will be updated immediately (admin roles require dual approval)'
 )}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Reason Field */}
 <FormField
 control={form.control}
 name="reason"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.reason', 'Reason')}
 {isAdminRole && (
 <span className="text-destructive ms-1">*</span>
 )}
 </FormLabel>
 <FormControl>
 <Textarea
 {...field}
 placeholder={t(
 'user_management.reason_placeholder',
 'Explain why this role change is needed'
 )}
 className="min-h-20 sm:min-h-24 px-4 py-3 text-base sm:text-sm resize-none"
 disabled={isPending}
 />
 </FormControl>
 <FormDescription className="text-xs sm:text-sm">
 {isAdminRole
 ? t(
 'user_management.reason_required_admin',
 'Reason is required for admin role assignments (for audit trail)'
 )
 : t(
 'user_management.reason_optional',
 'Optional: Provide context for this role change'
 )}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Admin Role Warning */}
 {isAdminRole && isRoleChanged && (
 <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
 <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
 <AlertTitle className="text-sm sm:text-base text-yellow-800 dark:text-yellow-200">
 {t('user_management.dual_approval_required', 'Dual Approval Required')}
 </AlertTitle>
 <AlertDescription className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
 {t(
 'user_management.dual_approval_description',
 'Admin role assignments require approval from two distinct administrators. This request will be pending until approved.'
 )}
 </AlertDescription>
 </Alert>
 )}

 {/* Session Termination Warning */}
 {!isAdminRole && isRoleChanged && (
 <Alert variant="default">
 <AlertCircle className="h-4 w-4" />
 <AlertTitle className="text-sm sm:text-base">
 {t('user_management.session_termination', 'Active Sessions Will Be Terminated')}
 </AlertTitle>
 <AlertDescription className="text-xs sm:text-sm">
 {t(
 'user_management.session_termination_description',
 "All user's active sessions will be terminated and they will need to log in again with new permissions."
 )}
 </AlertDescription>
 </Alert>
 )}

 <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => onOpenChange(false)}
 disabled={isPending}
 className="h-11 sm:h-10 px-6 text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
 >
 {t('common.cancel', 'Cancel')}
 </Button>
 <Button
 type="submit"
 disabled={isPending || !isRoleChanged}
 className="h-11 sm:h-10 px-6 text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2"
 >
 {isPending
 ? t('user_management.assigning', 'Assigning...')
 : isAdminRole
 ? t('user_management.request_approval', 'Request Approval')
 : t('user_management.assign_role_button', 'Assign Role')}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}
