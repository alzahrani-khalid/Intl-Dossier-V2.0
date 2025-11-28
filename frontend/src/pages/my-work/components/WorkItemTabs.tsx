/**
 * Work Item Tabs Component
 * Tabs for: All, Commitments, Tasks, Intake
 * Mobile-first, RTL-compatible
 */
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileCheck, ListChecks, Inbox, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkItemTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: {
    all: number;
    commitments: number;
    tasks: number;
    intake: number;
  };
}

export function WorkItemTabs({ activeTab, onTabChange, counts }: WorkItemTabsProps) {
  const { t, i18n } = useTranslation('my-work');
  const isRTL = i18n.language === 'ar';

  const tabs = [
    {
      id: 'all',
      label: t('tabs.all', 'All'),
      icon: LayoutList,
      count: counts.all,
    },
    {
      id: 'commitments',
      label: t('tabs.commitments', 'Commitments'),
      icon: FileCheck,
      count: counts.commitments,
    },
    {
      id: 'tasks',
      label: t('tabs.tasks', 'Tasks'),
      icon: ListChecks,
      count: counts.tasks,
    },
    {
      id: 'intake',
      label: t('tabs.intake', 'Intake'),
      icon: Inbox,
      count: counts.intake,
    },
  ];

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="mb-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 min-h-10',
                'data-[state=active]:bg-background data-[state=active]:shadow-sm'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className="ms-1 h-5 min-w-5 px-1.5 text-xs"
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
