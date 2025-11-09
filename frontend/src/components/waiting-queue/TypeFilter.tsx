/**
 * TypeFilter Component
 *
 * Compact multi-select filter for work item type with RTL support
 * Task: T083 [P] [US5]
 */

import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Folder, Ticket, User, CheckSquare, LucideIcon } from 'lucide-react';

interface TypeFilterProps {
 value?: ('dossier' | 'ticket' | 'position' | 'task')[];
 onChange: (value?: ('dossier' | 'ticket' | 'position' | 'task')[]) => void;
 disabled?: boolean;
}

interface WorkItemType {
 value: 'dossier' | 'ticket' | 'position' | 'task';
 label: string;
 Icon: LucideIcon;
 color: string;
}

const workItemTypes: WorkItemType[] = [
 { value: 'dossier', label: 'Dossier', Icon: Folder, color: 'text-blue-600' },
 { value: 'ticket', label: 'Ticket', Icon: Ticket, color: 'text-purple-600' },
 { value: 'position', label: 'Position', Icon: User, color: 'text-green-600' },
 { value: 'task', label: 'Task', Icon: CheckSquare, color: 'text-orange-600' }
];

export function TypeFilter({ value = [], onChange, disabled = false }: TypeFilterProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const handleToggle = (typeValue: 'dossier' | 'ticket' | 'position' | 'task') => {
 const newValue = value.includes(typeValue)
 ? value.filter(v => v !== typeValue)
 : [...value, typeValue];
 onChange(newValue.length > 0 ? newValue : undefined);
 };

 return (
 <div className="space-y-1.5" role="group" aria-labelledby="type-filter-label">
 {workItemTypes.map((type) => {
 const Icon = type.Icon;
 return (
 <div
 key={type.value}
 className="flex items-center gap-2 rounded-sm hover:bg-accent/50 transition-colors px-1 py-1"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <Checkbox
 id={`type-${type.value}`}
 checked={value.includes(type.value)}
 onCheckedChange={() => handleToggle(type.value)}
 disabled={disabled}
 className="h-4 w-4"
 />
 <Label
 htmlFor={`type-${type.value}`}
 className="flex-1 cursor-pointer text-start text-xs"
 >
 {t(`waitingQueue.filters.types.${type.value}`)}
 </Label>
 </div>
 );
 })}
 </div>
 );
}
