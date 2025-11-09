/**
 * User Profile Form Component
 * Form for creating new user accounts (admin only)
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support for Arabic
 * - Form validation with Zod
 * - Touch-friendly (44x44px targets)
 * - Guest account conditional fields
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useCreateUser } from '@/hooks/use-user-management';
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
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

// ============================================================================
// Form Schema
// ============================================================================

const userProfileSchema = z.object({
 email: z.string()
 .email('Invalid email format')
 .min(5, 'Email must be at least 5 characters'),
 username: z.string()
 .min(3, 'Username must be at least 3 characters')
 .max(50, 'Username must be at most 50 characters')
 .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens'),
 full_name: z.string()
 .min(2, 'Full name must be at least 2 characters')
 .max(100, 'Full name must be at most 100 characters'),
 role: z.enum(['admin', 'editor', 'viewer'], {
 required_error: 'Please select a role',
 }),
 user_type: z.enum(['employee', 'guest']).default('employee'),
 expires_at: z.date().optional(),
 allowed_resources: z.array(z.string()).optional(),
}).refine((data) => {
 // Guest accounts must have expiration date
 if (data.user_type === 'guest' && !data.expires_at) {
 return false;
 }
 return true;
}, {
 message: 'Guest accounts must have an expiration date',
 path: ['expires_at'],
}).refine((data) => {
 // Guest accounts must have at least one allowed resource
 if (data.user_type === 'guest' && (!data.allowed_resources || data.allowed_resources.length === 0)) {
 return false;
 }
 return true;
}, {
 message: 'Guest accounts must have at least one allowed resource',
 path: ['allowed_resources'],
});

type UserProfileFormData = z.infer<typeof userProfileSchema>;

// ============================================================================
// Component
// ============================================================================

interface UserProfileFormProps {
 onSuccess?: () => void;
}

export function UserProfileForm({ onSuccess }: UserProfileFormProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { mutate: createUser, isPending } = useCreateUser();
 const [showGuestFields, setShowGuestFields] = useState(false);

 const form = useForm<UserProfileFormData>({
 resolver: zodResolver(userProfileSchema),
 defaultValues: {
 email: '',
 username: '',
 full_name: '',
 role: 'viewer',
 user_type: 'employee',
 },
 });

 const onSubmit = (data: UserProfileFormData) => {
 createUser({
 email: data.email,
 username: data.username,
 full_name: data.full_name,
 role: data.role,
 user_type: data.user_type,
 expires_at: data.expires_at?.toISOString(),
 allowed_resources: data.allowed_resources,
 }, {
 onSuccess: () => {
 form.reset();
 onSuccess?.();
 },
 });
 };

 const handleUserTypeChange = (value: 'employee' | 'guest') => {
 form.setValue('user_type', value);
 setShowGuestFields(value === 'guest');
 };

 return (
 <div
 className="w-full max-w-2xl mx-auto px-4 sm:px-6"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <Form {...form}>
 <form
 onSubmit={form.handleSubmit(onSubmit)}
 className="space-y-4 sm:space-y-6"
 >
 {/* Email Field */}
 <FormField
 control={form.control}
 name="email"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.email', 'Email')}
 </FormLabel>
 <FormControl>
 <Input
 {...field}
 type="email"
 placeholder={t('user_management.email_placeholder', 'user@example.com')}
 className="h-11 sm:h-10 px-4 text-base sm:text-sm"
 disabled={isPending}
 />
 </FormControl>
 <FormDescription className="text-xs sm:text-sm">
 {t('user_management.email_description', 'User will receive activation email at this address')}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Username Field */}
 <FormField
 control={form.control}
 name="username"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.username', 'Username')}
 </FormLabel>
 <FormControl>
 <Input
 {...field}
 placeholder={t('user_management.username_placeholder', 'john_doe')}
 className="h-11 sm:h-10 px-4 text-base sm:text-sm"
 disabled={isPending}
 />
 </FormControl>
 <FormDescription className="text-xs sm:text-sm">
 {t('user_management.username_description', 'Lowercase letters, numbers, underscores, and hyphens only')}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Full Name Field */}
 <FormField
 control={form.control}
 name="full_name"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.full_name', 'Full Name')}
 </FormLabel>
 <FormControl>
 <Input
 {...field}
 placeholder={t('user_management.full_name_placeholder', 'John Doe')}
 className="h-11 sm:h-10 px-4 text-base sm:text-sm"
 disabled={isPending}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Role Field */}
 <FormField
 control={form.control}
 name="role"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.role', 'Role')}
 </FormLabel>
 <Select
 onValueChange={field.onChange}
 defaultValue={field.value}
 disabled={isPending}
 >
 <FormControl>
 <SelectTrigger className="h-11 sm:h-10 px-4 text-base sm:text-sm">
 <SelectValue placeholder={t('user_management.select_role', 'Select role')} />
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
 {t('user_management.role_description', 'User access level and permissions')}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* User Type Field */}
 <FormField
 control={form.control}
 name="user_type"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.user_type', 'Account Type')}
 </FormLabel>
 <Select
 onValueChange={handleUserTypeChange}
 defaultValue={field.value}
 disabled={isPending}
 >
 <FormControl>
 <SelectTrigger className="h-11 sm:h-10 px-4 text-base sm:text-sm">
 <SelectValue placeholder={t('user_management.select_user_type', 'Select account type')} />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="employee">
 {t('user_management.user_type_employee', 'Employee')}
 </SelectItem>
 <SelectItem value="guest">
 {t('user_management.user_type_guest', 'Guest')}
 </SelectItem>
 </SelectContent>
 </Select>
 <FormDescription className="text-xs sm:text-sm">
 {t('user_management.user_type_description', 'Employee accounts have permanent access, guest accounts expire')}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />

 {/* Guest Expiration Date (conditional) */}
 {showGuestFields && (
 <FormField
 control={form.control}
 name="expires_at"
 render={({ field }) => (
 <FormItem className="flex flex-col">
 <FormLabel className="text-sm sm:text-base">
 {t('user_management.expires_at', 'Expiration Date')}
 </FormLabel>
 <Popover>
 <PopoverTrigger asChild>
 <FormControl>
 <Button
 variant="outline"
 className={`h-11 sm:h-10 px-4 text-base sm:text-sm justify-start text-start font-normal ${!field.value && 'text-muted-foreground'}`}
 disabled={isPending}
 >
 <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {field.value ? (
 format(field.value, 'PPP')
 ) : (
 <span>{t('user_management.pick_date', 'Pick a date')}</span>
 )}
 </Button>
 </FormControl>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="start">
 <Calendar
 mode="single"
 selected={field.value}
 onSelect={field.onChange}
 disabled={(date) => date < new Date()}
 initialFocus
 />
 </PopoverContent>
 </Popover>
 <FormDescription className="text-xs sm:text-sm">
 {t('user_management.expires_at_description', 'Guest account will be automatically deactivated on this date')}
 </FormDescription>
 <FormMessage />
 </FormItem>
 )}
 />
 )}

 {/* Submit Button */}
 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
 <Button
 type="submit"
 className="h-11 sm:h-10 px-6 sm:px-8 text-base sm:text-sm w-full sm:w-auto"
 disabled={isPending}
 >
 {isPending
 ? t('user_management.creating', 'Creating...')
 : t('user_management.create_user', 'Create User')}
 </Button>
 <Button
 type="button"
 variant="outline"
 className="h-11 sm:h-10 px-6 sm:px-8 text-base sm:text-sm w-full sm:w-auto"
 onClick={() => form.reset()}
 disabled={isPending}
 >
 {t('user_management.reset', 'Reset')}
 </Button>
 </div>
 </form>
 </Form>
 </div>
 );
}
