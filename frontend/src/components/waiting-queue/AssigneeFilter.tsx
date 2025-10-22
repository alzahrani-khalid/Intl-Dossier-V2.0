/**
 * AssigneeFilter Component
 *
 * Mobile-first filter for assignee with RTL support
 * Task: T083 [P] [US5]
 */

import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface AssigneeFilterProps {
  value?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
}

export function AssigneeFilter({ value, onChange, disabled = false }: AssigneeFilterProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Quick filter for "My assignments"
  const isMyAssignments = value === currentUser?.id;

  return (
    <div className="space-y-1.5" role="group" aria-labelledby="assignee-filter-label">
      <div
        className="flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Checkbox
          id="assignee-me"
          checked={isMyAssignments}
          onCheckedChange={(checked) => {
            onChange(checked ? currentUser?.id : undefined);
          }}
          disabled={disabled}
          className="h-4 w-4"
        />
        <Label
          htmlFor="assignee-me"
          className="flex-1 cursor-pointer text-start text-xs"
        >
          {t('waitingQueue.filters.myAssignments')}
        </Label>
      </div>

      {/* Future enhancement: Add searchable user list */}
      {/* For now, just "My assignments" filter is sufficient */}
    </div>
  );
}
