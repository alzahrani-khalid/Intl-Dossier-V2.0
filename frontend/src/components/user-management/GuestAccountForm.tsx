import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useCreateUser } from '@/hooks/use-user-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type FormData = {
 email: string;
 full_name: string;
 username: string;
 expires_at: Date;
 allowed_resources: string[];
};

type Resource = {
 id: string;
 name: string;
 type: 'dossier' | 'forum' | 'organization';
};

interface GuestAccountFormProps {
 availableResources?: Resource[];
 onSuccess?: () => void;
}

/**
 * GuestAccountForm Component
 *
 * Specialized form for creating guest user accounts with:
 * - Expiration date picker (required for guests)
 * - Resource selector (multi-select with visual list)
 * - Email, full name, username fields
 * - Mobile-first responsive design with RTL support
 *
 * @param availableResources - List of resources guest can be granted access to
 * @param onSuccess - Callback when guest account is successfully created
 */
export function GuestAccountForm({ availableResources = [], onSuccess }: GuestAccountFormProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const {
 register,
 handleSubmit,
 formState: { errors },
 setValue,
 watch,
 } = useForm<FormData>();

 const [expirationDate, setExpirationDate] = useState<Date>();
 const [selectedResources, setSelectedResources] = useState<string[]>([]);
 const [calendarOpen, setCalendarOpen] = useState(false);

 const { mutate: createUser, isPending } = useCreateUser();

 const handleResourceToggle = (resourceId: string) => {
 setSelectedResources((prev) =>
 prev.includes(resourceId)
 ? prev.filter((id) => id !== resourceId)
 : [...prev, resourceId]
 );
 };

 const handleRemoveResource = (resourceId: string) => {
 setSelectedResources((prev) => prev.filter((id) => id !== resourceId));
 };

 const onSubmit = (data: FormData) => {
 if (!expirationDate) {
 return; // Validation will show error
 }

 if (selectedResources.length === 0) {
 return; // Validation will show error
 }

 createUser(
 {
 email: data.email,
 full_name: data.full_name,
 username: data.username,
 role: 'viewer', // Guests are always viewers
 user_type: 'guest',
 expires_at: expirationDate.toISOString(),
 allowed_resources: selectedResources,
 },
 {
 onSuccess: () => {
 onSuccess?.();
 },
 }
 );
 };

 const minExpirationDate = new Date();
 minExpirationDate.setDate(minExpirationDate.getDate() + 1); // Min 1 day from now

 const maxExpirationDate = new Date();
 maxExpirationDate.setFullYear(maxExpirationDate.getFullYear() + 1); // Max 1 year

 return (
 <Card className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
 <CardHeader>
 <CardTitle className="text-start text-xl sm:text-2xl">
 {t('user_management.create_guest_account')}
 </CardTitle>
 <CardDescription className="text-start">
 {t('user_management.guest_account_description')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
 {/* Email Field */}
 <div className="space-y-2">
 <Label htmlFor="email" className="text-start">
 {t('user_management.email')} *
 </Label>
 <Input
 id="email"
 type="email"
 {...register('email', {
 required: t('user_management.email_required'),
 pattern: {
 value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
 message: t('user_management.email_invalid'),
 },
 })}
 placeholder={t('user_management.email_placeholder')}
 className=""
 />
 {errors.email && (
 <p className="text-sm text-destructive text-start">{errors.email.message}</p>
 )}
 </div>

 {/* Full Name Field */}
 <div className="space-y-2">
 <Label htmlFor="full_name" className="text-start">
 {t('user_management.full_name')} *
 </Label>
 <Input
 id="full_name"
 {...register('full_name', {
 required: t('user_management.full_name_required'),
 minLength: {
 value: 2,
 message: t('user_management.full_name_min_length'),
 },
 })}
 placeholder={t('user_management.full_name_placeholder')}
 className=""
 />
 {errors.full_name && (
 <p className="text-sm text-destructive text-start">{errors.full_name.message}</p>
 )}
 </div>

 {/* Username Field */}
 <div className="space-y-2">
 <Label htmlFor="username" className="text-start">
 {t('user_management.username')} *
 </Label>
 <Input
 id="username"
 {...register('username', {
 required: t('user_management.username_required'),
 pattern: {
 value: /^[a-z0-9_-]{3,50}$/,
 message: t('user_management.username_invalid'),
 },
 })}
 placeholder={t('user_management.username_placeholder')}
 className=""
 />
 {errors.username && (
 <p className="text-sm text-destructive text-start">{errors.username.message}</p>
 )}
 </div>

 {/* Expiration Date Picker */}
 <div className="space-y-2">
 <Label htmlFor="expires_at" className="text-start">
 {t('user_management.expiration_date')} *
 </Label>
 <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
 <PopoverTrigger asChild>
 <Button
 id="expires_at"
 variant="outline"
 className={cn(
 'w-full justify-start text-start font-normal min-h-11',
 !expirationDate && 'text-muted-foreground'
 )}
 >
 <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {expirationDate ? (
 format(expirationDate, 'PPP')
 ) : (
 <span>{t('user_management.select_date')}</span>
 )}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
 <Calendar
 mode="single"
 selected={expirationDate}
 onSelect={(date) => {
 setExpirationDate(date);
 setCalendarOpen(false);
 }}
 disabled={(date) =>
 date < minExpirationDate || date > maxExpirationDate
 }
 initialFocus
 />
 </PopoverContent>
 </Popover>
 {!expirationDate && (
 <p className="text-xs text-muted-foreground text-start">
 {t('user_management.guest_expiration_required')}
 </p>
 )}
 </div>

 {/* Resource Selector */}
 <div className="space-y-2">
 <Label className="text-start">
 {t('user_management.allowed_resources')} *
 </Label>
 <p className="text-xs text-muted-foreground text-start">
 {t('user_management.select_resources_description')}
 </p>

 {/* Selected Resources Display */}
 {selectedResources.length > 0 && (
 <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50">
 {selectedResources.map((resourceId) => {
 const resource = availableResources.find((r) => r.id === resourceId);
 if (!resource) return null;

 return (
 <Badge
 key={resourceId}
 variant="secondary"
 className="gap-1 ps-3 pe-2"
 >
 <span>{resource.name}</span>
 <button
 type="button"
 onClick={() => handleRemoveResource(resourceId)}
 className="hover:bg-muted rounded-sm p-0.5"
 >
 <X className="h-3 w-3" />
 </button>
 </Badge>
 );
 })}
 </div>
 )}

 {/* Resource Checkboxes */}
 <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-3">
 {availableResources.length === 0 ? (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 {t('user_management.no_resources_available')}
 </AlertDescription>
 </Alert>
 ) : (
 availableResources.map((resource) => (
 <div key={resource.id} className="flex flex-row items-center gap-3">
 <Checkbox
 id={`resource-${resource.id}`}
 checked={selectedResources.includes(resource.id)}
 onCheckedChange={() => handleResourceToggle(resource.id)}
 />
 <Label
 htmlFor={`resource-${resource.id}`}
 className="flex-1 cursor-pointer text-start"
 >
 <div>
 <p className="font-medium">{resource.name}</p>
 <p className="text-xs text-muted-foreground">
 {t(`user_management.resource_type_${resource.type}`)}
 </p>
 </div>
 </Label>
 </div>
 ))
 )}
 </div>

 {selectedResources.length === 0 && (
 <p className="text-sm text-destructive text-start">
 {t('user_management.select_at_least_one_resource')}
 </p>
 )}
 </div>

 {/* Info Alert */}
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription className="text-start">
 {t('user_management.guest_account_info')}
 </AlertDescription>
 </Alert>

 {/* Submit Button */}
 <Button
 type="submit"
 className="w-full "
 disabled={isPending || !expirationDate || selectedResources.length === 0}
 >
 {isPending
 ? t('user_management.creating_guest_account')
 : t('user_management.create_guest_account')}
 </Button>
 </form>
 </CardContent>
 </Card>
 );
}
