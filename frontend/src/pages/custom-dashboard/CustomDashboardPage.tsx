/**
 * CustomDashboardPage
 *
 * A customizable dashboard with drag-and-drop widgets.
 * Users can add, remove, reorder, and configure widgets.
 * Layout is persisted to local storage.
 */

import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Plus, Settings, RotateCcw, Save, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  WidgetGrid,
  WidgetLibrary,
  WidgetSettingsDialog,
  BenchmarkPreview,
} from '@/components/dashboard-widgets'
import { useWidgetDashboard } from '@/hooks/useWidgetDashboard'
import { toast } from 'sonner'

/**
 * Page header component
 */
function DashboardHeader({
  isEditMode,
  onToggleEditMode,
  onAddWidget,
  onResetLayout,
  isRTL,
  t,
}: {
  isEditMode: boolean
  onToggleEditMode: () => void
  onAddWidget: () => void
  onResetLayout: () => void
  isRTL: boolean
  t: (key: string) => string
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('customDashboard')}</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {isEditMode ? t('widgetLibrary.description') : t('title')}
          </p>
        </div>
        {isEditMode && (
          <Badge variant="secondary" className="ms-2">
            {t('editMode')}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Add Widget Button - Only in edit mode */}
        {isEditMode && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onAddWidget} className="h-9">
                  <Plus className="h-4 w-4 me-1" />
                  <span className="hidden sm:inline">{t('addWidget')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('addWidget')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Reset Layout Button - Only in edit mode */}
        {isEditMode && (
          <AlertDialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <RotateCcw className="h-4 w-4 me-1" />
                      <span className="hidden sm:inline">{t('resetLayout')}</span>
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('resetLayout')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('resetLayout')}</AlertDialogTitle>
                <AlertDialogDescription>{t('confirmations.resetLayout')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onResetLayout}>{t('resetLayout')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Edit/Done Button */}
        <Button
          variant={isEditMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleEditMode}
          className="h-9"
        >
          {isEditMode ? (
            <>
              <Save className="h-4 w-4 me-1" />
              <span>{t('exitEditMode')}</span>
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 me-1" />
              <span className="hidden sm:inline">{t('editMode')}</span>
            </>
          )}
        </Button>
      </div>
    </header>
  )
}

/**
 * Empty state component
 */
function EmptyState({ onAddWidget, t }: { onAddWidget: () => void; t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <GripVertical className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{t('emptyStates.noWidgets')}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {t('emptyStates.addWidgetHint')}
      </p>
      <Button onClick={onAddWidget}>
        <Plus className="h-4 w-4 me-2" />
        {t('addWidget')}
      </Button>
    </div>
  )
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[150px] rounded-lg" />
      ))}
    </div>
  )
}

/**
 * Main CustomDashboard page component
 */
export function CustomDashboardPage() {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isRTL = i18n.language === 'ar'

  const {
    widgets,
    widgetData,
    isEditMode,
    selectedWidget,
    isLibraryOpen,
    isSettingsOpen,
    isInitialized,
    existingWidgetTypes,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    resetLayout,
    refreshWidget,
    openSettings,
    closeSettings,
    toggleEditMode,
    setIsLibraryOpen,
  } = useWidgetDashboard()

  // Handle add widget
  const handleAddWidget = (type: Parameters<typeof addWidget>[0]) => {
    addWidget(type)
    toast.success(t('layoutSaved'))
  }

  // Handle remove widget
  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(widgetId)
    toast.success(t('layoutSaved'))
  }

  // Handle reset layout
  const handleResetLayout = () => {
    resetLayout()
    toast.success(t('layoutReset'))
  }

  // Handle save settings
  const handleSaveSettings = (widget: Parameters<typeof updateWidget>[0]) => {
    updateWidget(widget)
    toast.success(t('layoutSaved'))
  }

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <DashboardHeader
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onAddWidget={() => setIsLibraryOpen(true)}
        onResetLayout={handleResetLayout}
        isRTL={isRTL}
        t={t}
      />

      {/* Benchmark Preview - Shows before customization */}
      {!isEditMode && (
        <BenchmarkPreview
          onCustomize={() => {
            toggleEditMode()
            setIsLibraryOpen(true)
          }}
          className="mb-6"
        />
      )}

      {/* Main Content */}
      {!isInitialized ? (
        <LoadingSkeleton />
      ) : widgets.length === 0 ? (
        <EmptyState onAddWidget={() => setIsLibraryOpen(true)} t={t} />
      ) : (
        <WidgetGrid
          widgets={widgets}
          widgetData={widgetData}
          isEditMode={isEditMode}
          onReorder={reorderWidgets}
          onRemove={handleRemoveWidget}
          onSettings={openSettings}
          onRefresh={refreshWidget}
        />
      )}

      {/* Widget Library Sheet */}
      <WidgetLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddWidget={handleAddWidget}
        existingWidgetTypes={existingWidgetTypes}
      />

      {/* Widget Settings Dialog */}
      <WidgetSettingsDialog
        widget={selectedWidget}
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        onSave={handleSaveSettings}
      />
    </div>
  )
}

export default CustomDashboardPage
