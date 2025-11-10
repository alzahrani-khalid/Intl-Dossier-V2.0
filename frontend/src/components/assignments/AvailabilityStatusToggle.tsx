/**
 * AvailabilityStatusToggle Component - Assignment Engine
 *
 * Allows staff to update their availability status with automatic reassignment logic.
 * Features:
 * - Dropdown selector for status: available, on_leave, unavailable
 * - Date picker for unavailable_until (when status is on_leave or unavailable)
 * - Textarea for reason
 * - Calls PUT /staff/availability
 * - Displays reassignment summary on success (urgent/high reassigned, normal/low flagged)
 * - Bilingual support (Arabic/English)
 *
 * @see specs/013-assignment-engine-sla/tasks.md#T057
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateAvailability } from '@/hooks/useUpdateAvailability';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface AvailabilityStatusToggleProps {
 staffId: string;
 currentStatus?: 'available' | 'on_leave' | 'unavailable';
 currentUnavailableUntil?: string | null;
 className?: string;
}

export function AvailabilityStatusToggle({
 currentStatus = 'available',
 currentUnavailableUntil,
 className,
}: AvailabilityStatusToggleProps) {
 const { t, i18n } = useTranslation(['assignments', 'common']);

 const [status, setStatus] = useState<'available' | 'on_leave' | 'unavailable'>(currentStatus);
 const [unavailableUntil, setUnavailableUntil] = useState<Date | undefined>(
 currentUnavailableUntil ? new Date(currentUnavailableUntil) : undefined
 );
 const [reason, setReason] = useState<string>('');
 const [validationError, setValidationError] = useState<string>('');
 const [showReassignmentSummary, setShowReassignmentSummary] = useState(false);
 const [reassignmentData, setReassignmentData] = useState<{
 reassigned_items: number;
 flagged_for_review: number;
 } | null>(null);

 const updateAvailabilityMutation = useUpdateAvailability();

 const handleSubmit = async () => {
 // Validation
 if (status !== 'available' && !unavailableUntil) {
 setValidationError(t('assignments:availability.validation.dateRequired'));
 return;
 }

 if (status !== 'available' && !reason.trim()) {
 setValidationError(t('assignments:availability.validation.reasonRequired'));
 return;
 }

 setValidationError('');

 // Call mutation
 updateAvailabilityMutation.mutate(
 {
 status,
 unavailable_until: unavailableUntil?.toISOString(),
 reason: reason.trim(),
 },
 {
 onSuccess: (data) => {
 // Show reassignment summary if applicable
 if (data.reassigned_items || data.flagged_for_review) {
 setReassignmentData({
 reassigned_items: data.reassigned_items?.length || 0,
 flagged_for_review: data.flagged_for_review?.length || 0,
 });
 setShowReassignmentSummary(true);
 }

 // Reset form if returning to available
 if (status === 'available') {
 setReason('');
 setUnavailableUntil(undefined);
 }
 },
 }
 );
 };

 const handleStatusChange = (newStatus: 'available' | 'on_leave' | 'unavailable') => {
 setStatus(newStatus);
 setValidationError('');

 // Clear unavailable_until and reason when returning to available
 if (newStatus === 'available') {
 setUnavailableUntil(undefined);
 setReason('');
 }
 };

 const getStatusBadgeVariant = (statusValue: string) => {
 switch (statusValue) {
 case 'available':
 return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
 case 'unavailable':
 return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
 case 'on_leave':
 return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
 default:
 return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
 }
 };

 return (
 <Card className={cn('availability-status-toggle', className)}>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <UserCheck className="w-5 h-5" />
 {t('assignments:availability.title')}
 </CardTitle>
 <CardDescription>{t('assignments:availability.description')}</CardDescription>
 </CardHeader>

 <CardContent className="space-y-4">
 {/* Current Status Display */}
 <div className="flex items-center gap-2 pb-2 border-b">
 <span className="text-sm text-gray-600 dark:text-gray-400">
 {t('assignments:availability.currentStatus')}:
 </span>
 <Badge className={getStatusBadgeVariant(currentStatus)}>
 {t(`assignments:availability.statuses.${currentStatus}`)}
 </Badge>
 </div>

 {/* Status Selector */}
 <div className="space-y-2">
 <Label htmlFor="status">{t('assignments:availability.newStatus')}</Label>
 <Select value={status} onValueChange={handleStatusChange}>
 <SelectTrigger id="status">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="available">
 {t('assignments:availability.statuses.available')}
 </SelectItem>
 <SelectItem value="on_leave">
 {t('assignments:availability.statuses.on_leave')}
 </SelectItem>
 <SelectItem value="unavailable">
 {t('assignments:availability.statuses.unavailable')}
 </SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Unavailable Until Date Picker */}
 {status !== 'available' && (
 <div className="space-y-2">
 <Label htmlFor="unavailable-until">
 {t('assignments:availability.unavailableUntil')} <span className="text-red-500">*</span>
 </Label>
 <Popover>
 <PopoverTrigger asChild>
 <Button
 id="unavailable-until"
 variant="outline"
 className={cn(
 'w-full justify-start text-start font-normal',
 !unavailableUntil && 'text-muted-foreground'
 )}
 >
 <CalendarIcon className="me-2 h-4 w-4" />
 {unavailableUntil ? (
 format(unavailableUntil, 'PPP', {
 locale: i18n.language === 'ar' ? undefined : undefined,
 })
 ) : (
 <span>{t('assignments:availability.selectDate')}</span>
 )}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="start">
 <Calendar
 mode="single"
 selected={unavailableUntil}
 onSelect={setUnavailableUntil}
 disabled={(date) => date < new Date()}
 initialFocus
 />
 </PopoverContent>
 </Popover>
 </div>
 )}

 {/* Reason Textarea */}
 {status !== 'available' && (
 <div className="space-y-2">
 <Label htmlFor="reason">
 {t('assignments:availability.reason')} <span className="text-red-500">*</span>
 </Label>
 <Textarea
 id="reason"
 placeholder={t('assignments:availability.reasonPlaceholder')}
 value={reason}
 onChange={(e) => {
 setReason(e.target.value);
 if (validationError) setValidationError('');
 }}
 rows={3}
 className={validationError ? 'border-red-500' : ''}
 />
 {validationError && (
 <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
 )}
 </div>
 )}

 {/* Reassignment Summary */}
 {showReassignmentSummary && reassignmentData && (
 <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
 <p className="font-medium text-blue-900 dark:text-blue-300">
 {t('assignments:availability.reassignmentSummary')}
 </p>
 <div className="grid grid-cols-2 gap-2 text-sm">
 <div>
 <span className="text-blue-700 dark:text-blue-400">
 {t('assignments:availability.reassignedCount')}:
 </span>{' '}
 <span className="font-semibold">{reassignmentData.reassigned_items}</span>
 </div>
 <div>
 <span className="text-blue-700 dark:text-blue-400">
 {t('assignments:availability.flaggedCount')}:
 </span>{' '}
 <span className="font-semibold">{reassignmentData.flagged_for_review}</span>
 </div>
 </div>
 <p className="text-xs text-blue-600 dark:text-blue-400">
 {t('assignments:availability.reassignmentNote')}
 </p>
 </div>
 )}

 {/* Submit Button */}
 <div className="flex gap-2 pt-4">
 <Button
 onClick={handleSubmit}
 disabled={updateAvailabilityMutation.isPending || status === currentStatus}
 className="flex-1"
 >
 {updateAvailabilityMutation.isPending && (
 <Loader2 className="w-4 h-4 animate-spin me-2" />
 )}
 {t('assignments:availability.updateStatus')}
 </Button>
 {status !== currentStatus && (
 <Button
 variant="outline"
 onClick={() => {
 setStatus(currentStatus);
 setUnavailableUntil(
 currentUnavailableUntil ? new Date(currentUnavailableUntil) : undefined
 );
 setReason('');
 setValidationError('');
 }}
 disabled={updateAvailabilityMutation.isPending}
 >
 {t('common:cancel')}
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 );
}
