/**
 * FilterPanel Component
 *
 * Popover-based filter panel with full RTL support
 * Attaches to the Filters button
 *
 * Task: T081 [P] [US5]
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlidersHorizontal, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PriorityFilter } from './PriorityFilter';
import { AgingFilter } from './AgingFilter';
import { TypeFilter } from './TypeFilter';
import { AssigneeFilter } from './AssigneeFilter';
import type { FilterCriteria } from '@/hooks/useQueueFilters';

interface FilterPanelProps {
 filters: FilterCriteria;
 onFiltersChange: (filters: FilterCriteria) => void;
 onClearFilters: () => void;
 isOpen: boolean;
 onOpenChange: (open: boolean) => void;
 resultCount?: number;
 isLoading?: boolean;
 isApplying?: boolean;
 hasFilters?: boolean;
 filterCount?: number;
}

export default function FilterPanel({
 filters,
 onFiltersChange,
 onClearFilters,
 isOpen,
 onOpenChange,
 resultCount,
 isLoading = false,
 isApplying = false,
 hasFilters = false,
 filterCount = 0
}: FilterPanelProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 return (
 <Popover open={isOpen} onOpenChange={onOpenChange}>
 <PopoverTrigger asChild>
 <Button
 variant={hasFilters ? 'default' : 'outline'}
 size="sm"
 className="h-9"
 aria-label={t('waitingQueue.filters.openFilters')}
 >
 <SlidersHorizontal className="me-2 size-4" />
 {hasFilters ? `${filterCount} ${t('waitingQueue.filters.active')}` : t('waitingQueue.filters.title')}
 </Button>
 </PopoverTrigger>
 <PopoverContent
 className="w-[240px] p-0"
 align={isRTL ? 'end' : 'start'}
 side="bottom"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="flex max-h-[520px] flex-col">
 {/* Compact Header */}
 <div className="flex items-center justify-between border-b px-3 py-2.5">
 <div className="flex items-center gap-2">
 <SlidersHorizontal className="size-4 text-muted-foreground" />
 <h2 className="text-sm font-semibold">{t('waitingQueue.filters.title')}</h2>
 {hasFilters && (
 <span className="text-xs text-muted-foreground">({filterCount})</span>
 )}
 </div>
 {hasFilters && (
 <Button
 variant="ghost"
 size="sm"
 onClick={onClearFilters}
 disabled={isApplying}
 className="h-7 px-2 text-xs"
 >
 <X className="me-1 size-3" />
 {t('waitingQueue.filters.clearAll')}
 </Button>
 )}
 </div>

 {/* Result count */}
 {resultCount !== undefined && (
 <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
 {t('waitingQueue.filters.showingResults', { count: resultCount })}
 </div>
 )}

 {/* Filter sections with Accordion */}
 {isLoading ? (
 // Loading skeletons
 <div className="space-y-3 p-3">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="space-y-1.5" data-testid="filter-skeleton">
 <div className="h-4 w-16 animate-pulse rounded bg-muted" />
 <div className="h-7 animate-pulse rounded bg-muted" />
 </div>
 ))}
 </div>
 ) : (
 <ScrollArea className="flex-1">
 <Accordion type="multiple" defaultValue={["priority", "aging", "type", "assignee"]} className="w-full">
 <AccordionItem value="priority" className="border-b-0">
 <AccordionTrigger className="px-3 py-2 hover:bg-accent/50 hover:no-underline">
 <span className="text-xs font-medium">{t('waitingQueue.filters.priority')}</span>
 </AccordionTrigger>
 <AccordionContent className="px-3 pb-3">
 <PriorityFilter
 value={filters.priority}
 onChange={(value) => onFiltersChange({ ...filters, priority: value, page: 1 })}
 disabled={isApplying}
 />
 </AccordionContent>
 </AccordionItem>

 <Separator />

 <AccordionItem value="aging" className="border-b-0">
 <AccordionTrigger className="px-3 py-2 hover:bg-accent/50 hover:no-underline">
 <span className="text-xs font-medium">{t('waitingQueue.filters.aging')}</span>
 </AccordionTrigger>
 <AccordionContent className="px-3 pb-3">
 <AgingFilter
 value={filters.aging}
 onChange={(value) => onFiltersChange({ ...filters, aging: value, page: 1 })}
 disabled={isApplying}
 />
 </AccordionContent>
 </AccordionItem>

 <Separator />

 <AccordionItem value="type" className="border-b-0">
 <AccordionTrigger className="px-3 py-2 hover:bg-accent/50 hover:no-underline">
 <span className="text-xs font-medium">{t('waitingQueue.filters.type')}</span>
 </AccordionTrigger>
 <AccordionContent className="px-3 pb-3">
 <TypeFilter
 value={filters.type}
 onChange={(value) => onFiltersChange({ ...filters, type: value, page: 1 })}
 disabled={isApplying}
 />
 </AccordionContent>
 </AccordionItem>

 <Separator />

 <AccordionItem value="assignee" className="border-b-0">
 <AccordionTrigger className="px-3 py-2 hover:bg-accent/50 hover:no-underline">
 <span className="text-xs font-medium">{t('waitingQueue.filters.assignee')}</span>
 </AccordionTrigger>
 <AccordionContent className="px-3 pb-3">
 <AssigneeFilter
 value={filters.assignee}
 onChange={(value) => onFiltersChange({ ...filters, assignee: value, page: 1 })}
 disabled={isApplying}
 />
 </AccordionContent>
 </AccordionItem>
 </Accordion>
 </ScrollArea>
 )}
 </div>
 </PopoverContent>
 </Popover>
 );
}
