import React from 'react';
import { Clock, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface HistoryItem {
 id: string;
 label: string;
 icon: React.ReactNode;
 path?: string;
}

export interface HistoryListProps {
 /** List of history items */
 items?: HistoryItem[];
 /** Currently active history ID */
 activeId?: string;
 /** Callback when history item is clicked */
 onHistoryClick?: (history: HistoryItem) => void;
 /** Custom class name */
 className?: string;
}

/**
 * HistoryList Component
 *
 * Displays history navigation items
 * From reference design "History" section
 *
 * Features:
 * - Recently Edited
 * - Archive
 * - Hover states
 * - Active state highlighting
 * - RTL support
 */
export function HistoryList({
 items,
 activeId,
 onHistoryClick,
 className,
}: HistoryListProps) {
 const { t } = useTranslation();

 // Default history items from reference design
 const defaultItems: HistoryItem[] = [
 {
 id: 'recently-edited',
 label: t('navigation.recentlyEdited', 'Recently Edited'),
 icon: <Clock className="h-4 w-4" />,
 path: '/history/recent',
 },
 {
 id: 'archive',
 label: t('navigation.archive', 'Archive'),
 icon: <Archive className="h-4 w-4" />,
 path: '/history/archive',
 },
 ];

 const historyItems = items || defaultItems;

 const handleClick = (history: HistoryItem) => {
 if (onHistoryClick) {
 onHistoryClick(history);
 }
 };

 return (
 <div className={cn('flex flex-col', className)}>
 {/* Section Header */}
 <h3 className="section-header px-4 py-2">
 {t('navigation.history', 'History')}
 </h3>

 {/* History Items */}
 <nav className="flex flex-col px-2" role="navigation" aria-label={t('navigation.history', 'History')}>
 {historyItems.map((history) => {
 const isActive = activeId === history.id;

 return (
 <button
 key={history.id}
 onClick={() => handleClick(history)}
 className={cn(
 'panel-item',
 'flex w-full items-center gap-3 py-2 px-4',
 'rounded-lg',
 'text-sm font-medium text-start text-panel-text',
 'hover:bg-panel-hover',
 isActive && ['bg-white/80', 'active'],
 'transition-colors duration-150',
 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-icon-rail-active-indicator'
 )}
 aria-current={isActive ? 'page' : undefined}
 >
 <span className="shrink-0" aria-hidden="true">
 {history.icon}
 </span>
 <span className="flex-1 truncate">{history.label}</span>
 </button>
 );
 })}
 </nav>
 </div>
 );
}

HistoryList.displayName = 'HistoryList';
