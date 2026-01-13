/**
 * WidgetLibrary Component
 *
 * A sidebar or modal for browsing and adding widgets to the dashboard.
 * Displays available widget types with previews and descriptions.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart2,
  Bell,
  Calendar,
  ListTodo,
  Activity,
  Zap,
  PieChart,
  TrendingUp,
  Plus,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { WidgetType, WidgetRegistryEntry } from '@/types/dashboard-widget.types'

interface WidgetLibraryProps {
  isOpen: boolean
  onClose: () => void
  onAddWidget: (type: WidgetType) => void
  existingWidgetTypes?: WidgetType[]
}

/**
 * Widget registry with all available widgets
 */
const WIDGET_REGISTRY: Record<WidgetType, WidgetRegistryEntry> = {
  'kpi-card': {
    type: 'kpi-card',
    name: 'KPI Card',
    nameAr: 'بطاقة مؤشر الأداء',
    description: 'Display key performance indicators with trends',
    descriptionAr: 'عرض مؤشرات الأداء الرئيسية مع الاتجاهات',
    icon: 'TrendingUp',
    defaultSize: 'small',
    minSize: 'small',
    maxSize: 'medium',
    supportedSizes: ['small', 'medium'],
    defaultConfig: {
      settings: {
        metric: 'active-dossiers',
        showTrend: true,
        showSparkline: false,
        comparisonPeriod: 'week',
      },
    },
  },
  chart: {
    type: 'chart',
    name: 'Chart',
    nameAr: 'رسم بياني',
    description: 'Visualize data with various chart types',
    descriptionAr: 'تصور البيانات بأنواع مختلفة من الرسوم البيانية',
    icon: 'BarChart2',
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'full',
    supportedSizes: ['medium', 'large', 'full'],
    defaultConfig: {
      settings: {
        chartType: 'bar',
        dataSource: 'work-items-by-status',
        showLegend: true,
        showGrid: true,
        dateRange: 'week',
      },
    },
  },
  'upcoming-events': {
    type: 'upcoming-events',
    name: 'Upcoming Events',
    nameAr: 'الأحداث القادمة',
    description: 'Show upcoming deadlines and events',
    descriptionAr: 'عرض المواعيد النهائية والأحداث القادمة',
    icon: 'Calendar',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    supportedSizes: ['small', 'medium', 'large'],
    defaultConfig: {
      settings: {
        maxItems: 5,
        showPastEvents: false,
        eventTypes: ['all'],
        dateRange: 'week',
      },
    },
  },
  'task-list': {
    type: 'task-list',
    name: 'Task List',
    nameAr: 'قائمة المهام',
    description: 'Display your tasks and work items',
    descriptionAr: 'عرض المهام وبنود العمل',
    icon: 'ListTodo',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    supportedSizes: ['small', 'medium', 'large'],
    defaultConfig: {
      settings: {
        maxItems: 10,
        showCompleted: false,
        groupBy: 'none',
        sortBy: 'deadline',
        filterSource: 'all',
      },
    },
  },
  notifications: {
    type: 'notifications',
    name: 'Notifications',
    nameAr: 'الإشعارات',
    description: 'Show recent notifications and alerts',
    descriptionAr: 'عرض الإشعارات والتنبيهات الأخيرة',
    icon: 'Bell',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'large',
    supportedSizes: ['small', 'medium', 'large'],
    defaultConfig: {
      settings: {
        maxItems: 10,
        showRead: false,
        categories: ['all'],
      },
    },
  },
  'activity-feed': {
    type: 'activity-feed',
    name: 'Activity Feed',
    nameAr: 'سجل النشاط',
    description: 'Track recent activity and changes',
    descriptionAr: 'تتبع النشاط والتغييرات الأخيرة',
    icon: 'Activity',
    defaultSize: 'medium',
    minSize: 'medium',
    maxSize: 'large',
    supportedSizes: ['medium', 'large'],
    defaultConfig: {
      settings: {
        maxItems: 10,
        activityTypes: ['all'],
        showTimestamps: true,
      },
    },
  },
  'quick-actions': {
    type: 'quick-actions',
    name: 'Quick Actions',
    nameAr: 'الإجراءات السريعة',
    description: 'Access frequently used actions',
    descriptionAr: 'الوصول إلى الإجراءات المستخدمة بشكل متكرر',
    icon: 'Zap',
    defaultSize: 'medium',
    minSize: 'small',
    maxSize: 'full',
    supportedSizes: ['small', 'medium', 'large', 'full'],
    defaultConfig: {
      settings: {
        actions: [],
      },
    },
  },
  'stats-summary': {
    type: 'stats-summary',
    name: 'Stats Summary',
    nameAr: 'ملخص الإحصائيات',
    description: 'Overview of key statistics',
    descriptionAr: 'نظرة عامة على الإحصائيات الرئيسية',
    icon: 'PieChart',
    defaultSize: 'large',
    minSize: 'medium',
    maxSize: 'full',
    supportedSizes: ['medium', 'large', 'full'],
    defaultConfig: {
      settings: {
        metrics: ['active-dossiers', 'pending-tasks', 'overdue-items'],
        layout: 'grid',
        showTrends: true,
      },
    },
  },
}

/**
 * Get icon component by name
 */
function getIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    TrendingUp,
    BarChart2,
    Calendar,
    ListTodo,
    Bell,
    Activity,
    Zap,
    PieChart,
  }
  return icons[iconName] || BarChart2
}

/**
 * Widget categories for filtering
 */
type WidgetCategory = 'all' | 'metrics' | 'data' | 'lists' | 'other'

const WIDGET_CATEGORIES: Record<WidgetType, WidgetCategory> = {
  'kpi-card': 'metrics',
  chart: 'data',
  'upcoming-events': 'lists',
  'task-list': 'lists',
  notifications: 'lists',
  'activity-feed': 'lists',
  'quick-actions': 'other',
  'stats-summary': 'metrics',
}

/**
 * Single widget card in the library
 */
function WidgetCard({
  entry,
  isRTL,
  isAdded,
  onAdd,
}: {
  entry: WidgetRegistryEntry
  isRTL: boolean
  isAdded: boolean
  onAdd: () => void
}) {
  const { t } = useTranslation('dashboard-widgets')
  const Icon = getIcon(entry.icon)

  const name = isRTL ? entry.nameAr : entry.name
  const description = isRTL ? entry.descriptionAr : entry.description

  return (
    <div
      className={cn(
        'p-3 sm:p-4 rounded-lg border bg-card',
        'hover:border-primary/50 hover:shadow-sm transition-all',
        isAdded && 'opacity-50',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{name}</h4>
            {isAdded && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {t('actions.added', 'Added')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {t(`settings.sizes.${entry.defaultSize}`)}
            </Badge>
          </div>
        </div>

        {/* Add Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onAdd}
          disabled={isAdded}
          className="shrink-0 h-8 w-8"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">{t('addWidget')}</span>
        </Button>
      </div>
    </div>
  )
}

export function WidgetLibrary({
  isOpen,
  onClose,
  onAddWidget,
  existingWidgetTypes = [],
}: WidgetLibraryProps) {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory>('all')

  // Filter widgets by search and category
  const filteredWidgets = useMemo(() => {
    const entries = Object.values(WIDGET_REGISTRY)

    return entries.filter((entry) => {
      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const name = isRTL ? entry.nameAr : entry.name
        const description = isRTL ? entry.descriptionAr : entry.description
        if (!name.toLowerCase().includes(query) && !description.toLowerCase().includes(query)) {
          return false
        }
      }

      // Filter by category
      if (selectedCategory !== 'all' && WIDGET_CATEGORIES[entry.type] !== selectedCategory) {
        return false
      }

      return true
    })
  }, [searchQuery, selectedCategory, isRTL])

  const categories: { value: WidgetCategory; label: string }[] = [
    { value: 'all', label: t('widgetLibrary.categories.all') },
    { value: 'metrics', label: t('widgetLibrary.categories.metrics') },
    { value: 'data', label: t('widgetLibrary.categories.data') },
    { value: 'lists', label: t('widgetLibrary.categories.lists') },
    { value: 'other', label: t('widgetLibrary.categories.other') },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isRTL ? 'left' : 'right'}
        className="w-full sm:max-w-md"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <SheetHeader className="mb-4">
          <SheetTitle>{t('widgetLibrary.title')}</SheetTitle>
          <SheetDescription>{t('widgetLibrary.description')}</SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('widgetLibrary.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="text-xs h-7"
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Widget List */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3 pe-4">
            {filteredWidgets.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t('emptyStates.noWidgets')}
              </div>
            ) : (
              filteredWidgets.map((entry) => (
                <WidgetCard
                  key={entry.type}
                  entry={entry}
                  isRTL={isRTL}
                  isAdded={existingWidgetTypes.includes(entry.type)}
                  onAdd={() => {
                    onAddWidget(entry.type)
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// Export registry for use in other components
export { WIDGET_REGISTRY }

export default WidgetLibrary
