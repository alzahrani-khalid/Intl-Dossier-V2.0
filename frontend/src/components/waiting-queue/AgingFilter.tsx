/**
 * AgingFilter Component
 *
 * Compact multi-select filter for assignment aging with RTL support
 * Task: T083 [P] [US5]
 */

import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface AgingFilterProps {
  value?: ('0-2' | '3-6' | '7+')[];
  onChange: (value?: ('0-2' | '3-6' | '7+')[]) => void;
  disabled?: boolean;
}

interface AgingBucket {
  value: '0-2' | '3-6' | '7+';
  label: string;
  barColor: string;
}

const agingBuckets: AgingBucket[] = [
  { value: '0-2', label: '0-2 days', barColor: 'bg-green-500' },
  { value: '3-6', label: '3-6 days', barColor: 'bg-yellow-500' },
  { value: '7+', label: '7+ days', barColor: 'bg-red-500' }
];

export function AgingFilter({ value = [], onChange, disabled = false }: AgingFilterProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleToggle = (agingValue: '0-2' | '3-6' | '7+') => {
    const newValue = value.includes(agingValue)
      ? value.filter(v => v !== agingValue)
      : [...value, agingValue];
    onChange(newValue.length > 0 ? newValue : undefined);
  };

  return (
    <div className="space-y-1.5" role="group" aria-labelledby="aging-filter-label">
      {agingBuckets.map((bucket) => (
        <div
          key={bucket.value}
          className="flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <Checkbox
            id={`aging-${bucket.value}`}
            checked={value.includes(bucket.value)}
            onCheckedChange={() => handleToggle(bucket.value)}
            disabled={disabled}
            className="h-4 w-4"
          />
          <Label
            htmlFor={`aging-${bucket.value}`}
            className="flex-1 cursor-pointer text-start text-xs"
          >
            {t(`waitingQueue.filters.agingBuckets.${bucket.value}.label`)}
          </Label>
        </div>
      ))}
    </div>
  );
}
