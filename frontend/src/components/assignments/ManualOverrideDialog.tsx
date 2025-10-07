/**
 * ManualOverrideDialog Component - Assignment Engine
 *
 * Dialog for manually overriding automatic assignment decisions.
 * Features:
 * - Staff selector for choosing assignee
 * - Override reason textarea with validation (min 10 chars)
 * - Calls POST /assignments/manual-override
 * - Toast notifications for success/error
 * - Bilingual support (Arabic/English)
 *
 * @see specs/013-assignment-engine-sla/tasks.md#T055
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck } from 'lucide-react';

const supabase = createClient();

export interface ManualOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workItemId: string;
  workItemType: 'ticket' | 'dossier';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  requiredSkills?: string[];
  onSuccess?: () => void;
}

interface StaffMember {
  id: string;
  user_id: string;
  name_en: string;
  name_ar: string;
  current_assignment_count: number;
  individual_wip_limit: number;
  availability_status: string;
}

export function ManualOverrideDialog({
  open,
  onOpenChange,
  workItemId,
  workItemType,
  priority,
  requiredSkills = [],
  onSuccess,
}: ManualOverrideDialogProps) {
  const { t, i18n } = useTranslation(['assignments', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // Fetch available staff members
  const { data: staffMembers, isLoading: loadingStaff } = useQuery({
    queryKey: ['available-staff', requiredSkills],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('id, user_id, name_en, name_ar, current_assignment_count, individual_wip_limit, availability_status')
        .eq('availability_status', 'available')
        .order('current_assignment_count', { ascending: true });

      if (error) throw error;
      return data as StaffMember[];
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Manual override mutation
  const manualOverrideMutation = useMutation({
    mutationFn: async (params: { assignee_id: string; override_reason: string }) => {
      const { data, error } = await supabase.functions.invoke('assignments-manual-override', {
        body: {
          work_item_id: workItemId,
          work_item_type: workItemType,
          priority,
          required_skills: requiredSkills,
          assignee_id: params.assignee_id,
          override_reason: params.override_reason,
        },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: t('assignments:manualOverride.success.title'),
        description: t('assignments:manualOverride.success.description', {
          workItemId,
          assigneeName: getStaffName(data.assignee_id),
        }),
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-queue'] });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('assignments:manualOverride.error.title'),
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setSelectedAssigneeId('');
    setOverrideReason('');
    setValidationError('');
  };

  const handleSubmit = () => {
    // Validate override reason
    if (overrideReason.trim().length < 10) {
      setValidationError(t('assignments:manualOverride.validation.reasonTooShort'));
      return;
    }

    if (!selectedAssigneeId) {
      setValidationError(t('assignments:manualOverride.validation.selectAssignee'));
      return;
    }

    setValidationError('');
    manualOverrideMutation.mutate({
      assignee_id: selectedAssigneeId,
      override_reason: overrideReason.trim(),
    });
  };

  const getStaffName = (staffId: string): string => {
    const staff = staffMembers?.find((s) => s.id === staffId);
    if (!staff) return staffId;
    return i18n.language === 'ar' ? staff.name_ar : staff.name_en;
  };

  const getCapacityStatus = (staff: StaffMember): string => {
    const utilization = (staff.current_assignment_count / staff.individual_wip_limit) * 100;
    if (utilization >= 90) return 'at-capacity';
    if (utilization >= 75) return 'near-capacity';
    return 'available';
  };

  const getCapacityColor = (status: string): string => {
    switch (status) {
      case 'available':
        return 'text-green-600 dark:text-green-400';
      case 'near-capacity':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'at-capacity':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            {t('assignments:manualOverride.title')}
          </DialogTitle>
          <DialogDescription>
            {t('assignments:manualOverride.description', { workItemId })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Staff Selector */}
          <div className="space-y-2">
            <Label htmlFor="assignee">
              {t('assignments:manualOverride.selectAssignee')} <span className="text-red-500">*</span>
            </Label>
            {loadingStaff ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common:loading')}...
              </div>
            ) : (
              <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder={t('assignments:manualOverride.selectStaffPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers?.map((staff) => {
                    const capacityStatus = getCapacityStatus(staff);
                    return (
                      <SelectItem key={staff.id} value={staff.id}>
                        <div className="flex items-center justify-between gap-2">
                          <span>{getStaffName(staff.id)}</span>
                          <span className={`text-xs ${getCapacityColor(capacityStatus)}`}>
                            {staff.current_assignment_count}/{staff.individual_wip_limit}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  {staffMembers?.length === 0 && (
                    <SelectItem value="none" disabled>
                      {t('assignments:manualOverride.noStaffAvailable')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Override Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {t('assignments:manualOverride.overrideReason')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder={t('assignments:manualOverride.reasonPlaceholder')}
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                if (validationError) setValidationError('');
              }}
              rows={4}
              className={validationError ? 'border-red-500' : ''}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('assignments:manualOverride.reasonHint')} ({overrideReason.length}/10 {t('common:minChars')})
            </p>
            {validationError && (
              <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={manualOverrideMutation.isPending}
          >
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={manualOverrideMutation.isPending || !selectedAssigneeId || overrideReason.length < 10}
          >
            {manualOverrideMutation.isPending && <Loader2 className="w-4 h-4 animate-spin me-2" />}
            {t('assignments:manualOverride.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
