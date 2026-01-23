import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ExecutionsTabsProps {
 /** Title for the card */
 title?: string;
 /** Custom class name */
 className?: string;
}

/**
 * ExecutionsTabs Component
 *
 * Tabbed interface for viewing executions
 * From reference design showing "Workflows | Permissions | Members"
 *
 * Features:
 * - Tab navigation
 * - Search input
 * - Active tab indicator (underline)
 * - Smooth transitions
 * - RTL support
 *
 * @example
 * ```tsx
 * <ExecutionsTabs title="Executions" />
 * ```
 */
export function ExecutionsTabs({ title, className }: ExecutionsTabsProps) {
 const { t } = useTranslation();
 const [searchQuery, setSearchQuery] = useState('');
 const [activeTab, setActiveTab] = useState('workflows');

 return (
 <Card className={cn('overflow-hidden', className)}>
 <CardHeader className="border-content-border border-b pb-0">
 <CardTitle className="text-content-text mb-4 text-base font-semibold">
 {title || t('navigation.executions', 'Executions')}
 </CardTitle>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid h-auto w-full grid-cols-3 border-b-0 bg-transparent p-0">
 <TabsTrigger
 value="workflows"
 className={cn(
 'relative rounded-none border-b-2 border-transparent',
 'data-[state=active]:border-icon-rail-active-indicator',
 'data-[state=active]:bg-transparent',
 'data-[state=active]:text-content-text',
 'data-[state=active]:shadow-none',
 'hover:text-content-text',
 'transition-all duration-200',
 'pb-3 text-sm font-medium'
 )}
 >
 {t('navigation.workflows', 'Workflows')}
 </TabsTrigger>
 <TabsTrigger
 value="permissions"
 className={cn(
 'relative rounded-none border-b-2 border-transparent',
 'data-[state=active]:border-icon-rail-active-indicator',
 'data-[state=active]:bg-transparent',
 'data-[state=active]:text-content-text',
 'data-[state=active]:shadow-none',
 'hover:text-content-text',
 'transition-all duration-200',
 'pb-3 text-sm font-medium'
 )}
 >
 {t('navigation.permissions', 'Permissions')}
 </TabsTrigger>
 <TabsTrigger
 value="members"
 className={cn(
 'relative rounded-none border-b-2 border-transparent',
 'data-[state=active]:border-icon-rail-active-indicator',
 'data-[state=active]:bg-transparent',
 'data-[state=active]:text-content-text',
 'data-[state=active]:shadow-none',
 'hover:text-content-text',
 'transition-all duration-200',
 'pb-3 text-sm font-medium'
 )}
 >
 {t('navigation.members', 'Members')}
 </TabsTrigger>
 </TabsList>
 </Tabs>
 </CardHeader>

 <CardContent className="p-6">
 {/* Search Input */}
 <div className="relative mb-4">
 <Search className="text-content-text-muted absolute start-3 top-1/2 size-4 -translate-y-1/2" />
 <Input
 type="search"
 placeholder={t('common.search', 'Search')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className={cn(
 'h-10 w-full ps-10 pe-4',
 'bg-background border-content-border',
 'text-sm placeholder:text-content-text-muted',
 'focus-visible:ring-icon-rail-active-indicator'
 )}
 />
 </div>

 {/* Tab Content */}
 <Tabs value={activeTab}>
 <TabsContent value="workflows" className="mt-0">
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <p className="text-content-text-muted text-sm">
 {t('executions.noWorkflows', 'No workflows found')}
 </p>
 <p className="text-content-text-muted mt-1 text-xs">
 {t('executions.tryDifferentSearch', 'Try a different search term')}
 </p>
 </div>
 </TabsContent>

 <TabsContent value="permissions" className="mt-0">
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <p className="text-content-text-muted text-sm">
 {t('executions.noPermissions', 'No permissions found')}
 </p>
 <p className="text-content-text-muted mt-1 text-xs">
 {t('executions.tryDifferentSearch', 'Try a different search term')}
 </p>
 </div>
 </TabsContent>

 <TabsContent value="members" className="mt-0">
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <p className="text-content-text-muted text-sm">
 {t('executions.noMembers', 'No members found')}
 </p>
 <p className="text-content-text-muted mt-1 text-xs">
 {t('executions.tryDifferentSearch', 'Try a different search term')}
 </p>
 </div>
 </TabsContent>
 </Tabs>
 </CardContent>
 </Card>
 );
}

ExecutionsTabs.displayName = 'ExecutionsTabs';
