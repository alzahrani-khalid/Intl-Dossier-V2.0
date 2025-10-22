/**
 * PriorityFilter Component
 *
 * Compact multi-select filter for assignment priority with RTL support
 * Task: T083 [P] [US5]
 */

import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PriorityFilterProps {
  value?: ('low' | 'medium' | 'high' | 'urgent')[];
  onChange: (value?: ('low' | 'medium' | 'high' | 'urgent')[]) => void;
  disabled?: boolean;
}

interface Priority {
  value: 'low' | 'medium' | 'high' | 'urgent';
  label: string;
  dotColor: string;
}

const priorities: Priority[] = [
  { value: 'low', label: 'Low', dotColor: 'bg-gray-500' },
  { value: 'medium', label: 'Medium', dotColor: 'bg-blue-500' },
  { value: 'high', label: 'High', dotColor: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', dotColor: 'bg-red-500' }
];

export function PriorityFilter({ value = [], onChange, disabled = false }: PriorityFilterProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleToggle = (priorityValue: 'low' | 'medium' | 'high' | 'urgent') => {
    const newValue = value.includes(priorityValue)
      ? value.filter(v => v !== priorityValue)
      : [...value, priorityValue];
    onChange(newValue.length > 0 ? newValue : undefined);
  };

  return (
    <div className="space-y-1.5" role="group" aria-labelledby="priority-filter-label">
      {priorities.map((priority) => (
        <div
          key={priority.value}
          className="flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Checkbox
            id={`priority-${priority.value}`}
            checked={value.includes(priority.value)}
            onCheckedChange={() => handleToggle(priority.value)}
            disabled={disabled}
            className="h-4 w-4"
          />
          <Label
            htmlFor={`priority-${priority.value}`}
            className="flex-1 cursor-pointer text-start text-xs"
          >
            {t(`waitingQueue.filters.priorities.${priority.value}`)}
          </Label>
        </div>
      ))}
    </div>
  );
}
