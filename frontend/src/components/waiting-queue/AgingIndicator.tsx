import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

/**
 * Aging Indicator Component
 * Feature: Waiting Queue Actions (User Story 1)
 * Purpose: Display color-coded badge showing days waiting for assignment
 *
 * Color scheme (per spec):
 * - 0-2 days: OK (blue/default)
 * - 3-6 days: Warning (yellow/orange)
 * - 7+ days: Danger (red)
 *
 * Requirements:
 * - Mobile-first responsive
 * - RTL support
 * - Clear visual hierarchy
 */

interface AgingIndicatorProps {
 days: number;
 className?: string;
}

export function AgingIndicator({ days, className = '' }: AgingIndicatorProps) {
 const { t } = useTranslation();

 // Determine aging level and styling
 const getAgingLevel = () => {
 if (days <= 2) {
 return {
 level: 'ok',
 variant: 'default' as const,
 color: 'bg-blue-100 text-blue-800 border-blue-200',
 label: t('waitingQueue.aging.ok', 'Recent'),
 };
 } else if (days <= 6) {
 return {
 level: 'warning',
 variant: 'secondary' as const,
 color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
 label: t('waitingQueue.aging.warning', 'Needs Attention'),
 };
 } else {
 return {
 level: 'danger',
 variant: 'destructive' as const,
 color: 'bg-red-100 text-red-800 border-red-200',
 label: t('waitingQueue.aging.danger', 'Overdue'),
 };
 }
 };

 const aging = getAgingLevel();

 return (
 <Badge
 variant={aging.variant}
 className={`inline-flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1 ${aging.color} ${className}`}
 data-aging-level={aging.level}
 data-testid="aging-badge"
 >
 <Clock className="h-3 w-3 shrink-0" />
 <span className="font-medium">
 {days} {t('common.days', 'days')}
 </span>
 <span className="hidden sm:inline text-xs opacity-75 ms-1">
 ({aging.label})
 </span>
 </Badge>
 );
}
