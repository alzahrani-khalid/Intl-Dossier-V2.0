/**
 * Activity Page
 *
 * Main activity feed page with:
 * - Tab navigation (All Activity / Following)
 * - Collapsible statistics panel
 * - Settings sheet on mobile
 * - Full RTL/mobile-first support
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, BarChart3, RefreshCcw, Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { EnhancedActivityFeed } from '@/components/ActivityFeed/EnhancedActivityFeed'
import { useEntityFollow } from '@/hooks/useActivityFeed'
import { ActivityStatistics } from './components/ActivityStatistics'
import { ActivitySettingsSheet } from './components/ActivitySettingsSheet'

// =============================================
// COMPONENT
// =============================================

export function ActivityPage() {
  const { t, i18n } = useTranslation('activity-feed')
  const isRTL = i18n.language === 'ar'

  const [showStatistics, setShowStatistics] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get following count for statistics
  const { following } = useEntityFollow()

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // The feed will auto-refresh, we just show the loading state
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [])

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Statistics Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatistics(!showStatistics)}
            className="gap-2 min-h-11 sm:min-h-9"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('statistics.title')}</span>
          </Button>

          {/* Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="gap-2 min-h-11 sm:min-h-9"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('buttons.settings')}</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="min-h-11 sm:min-h-9"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Panel (Collapsible) */}
      <Collapsible open={showStatistics} onOpenChange={setShowStatistics}>
        <CollapsibleContent>
          <ActivityStatistics followingCount={following.length} className="mb-6" />
        </CollapsibleContent>
      </Collapsible>

      {/* Main Content with Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'all' | 'following')}
        className="w-full"
      >
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex mb-4">
          <TabsTrigger value="all" className="min-h-11 sm:min-h-9 px-4 sm:px-6">
            {t('tabs.all')}
          </TabsTrigger>
          <TabsTrigger value="following" className="min-h-11 sm:min-h-9 px-4 sm:px-6">
            {t('tabs.following')}
            {following.length > 0 && (
              <span className="ms-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {following.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <EnhancedActivityFeed
            showFilters={true}
            showSearch={true}
            maxHeight="calc(100vh - 400px)"
            emptyMessage={t('emptyState.all.description')}
          />
        </TabsContent>

        <TabsContent value="following" className="mt-0">
          <EnhancedActivityFeed
            filters={{ followed_only: true }}
            showFilters={true}
            showSearch={true}
            maxHeight="calc(100vh - 400px)"
            emptyMessage={t('emptyState.following.description')}
          />
        </TabsContent>
      </Tabs>

      {/* Settings Sheet */}
      <ActivitySettingsSheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}

export default ActivityPage
