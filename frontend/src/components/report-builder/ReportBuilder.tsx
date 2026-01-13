/**
 * Report Builder Component
 *
 * Main drag-and-drop report builder interface.
 * Combines entity selection, field management, filtering, and visualization.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  Share2,
  Calendar,
  Download,
  RotateCcw,
  Play,
  Settings2,
  LayoutDashboard,
  List,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { EntitySelector } from './EntitySelector'
import { FieldList } from './FieldList'
import { ColumnBuilder } from './ColumnBuilder'
import { FilterBuilder } from './FilterBuilder'
import { GroupingBuilder } from './GroupingBuilder'
import { SortingBuilder } from './SortingBuilder'
import { VisualizationSelector } from './VisualizationSelector'
import { ReportPreview } from './ReportPreview'
import { SaveReportDialog } from './SaveReportDialog'
import { ScheduleReportDialog } from './ScheduleReportDialog'
import { SavedReportsList } from './SavedReportsList'

import {
  useReportBuilderState,
  useReports,
  useCreateReport,
  useUpdateReport,
  useDeleteReport,
  useToggleFavorite,
  useReportPreview,
  useCreateSchedule,
} from '@/hooks/useReportBuilder'

import type { ReportField, SavedReport } from '@/types/report-builder.types'

interface ReportBuilderProps {
  initialReportId?: string
}

export function ReportBuilder({ initialReportId }: ReportBuilderProps) {
  const { t, i18n } = useTranslation('report-builder')
  const isRTL = i18n.language === 'ar'

  // Report builder state
  const {
    configuration,
    selectedEntities,
    availableFields,
    isDirty,
    savedReportId,
    toggleEntity,
    addColumn,
    removeColumn,
    updateColumn,
    reorderColumns,
    addFilter,
    removeFilter,
    updateFilter,
    setFilterLogic,
    addGrouping,
    removeGrouping,
    addAggregation,
    removeAggregation,
    addSort,
    removeSort,
    updateSort,
    setVisualization,
    updateVisualization,
    resetConfiguration,
    loadConfiguration,
    markAsSaved,
  } = useReportBuilderState(initialReportId)

  // API hooks
  const { data: reportsData, isLoading: isLoadingReports } = useReports({ limit: 50 })
  const createReportMutation = useCreateReport()
  const updateReportMutation = useUpdateReport()
  const deleteReportMutation = useDeleteReport()
  const toggleFavoriteMutation = useToggleFavorite()
  const previewMutation = useReportPreview()
  const createScheduleMutation = useCreateSchedule()

  // UI state
  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'saved'>('builder')
  const [activeDragField, setActiveDragField] = useState<ReportField | null>(null)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedSavedReport, setSelectedSavedReport] = useState<SavedReport | null>(null)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'field') {
      setActiveDragField(active.data.current.field)
    }
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveDragField(null)

      if (!over) return

      const activeData = active.data.current
      const overData = over.data.current

      // Handle field drop onto columns zone
      if (activeData?.type === 'field' && overData?.type === 'columns') {
        addColumn(activeData.field)
      }

      // Handle field drop onto groupings zone
      if (activeData?.type === 'field' && overData?.type === 'groupings') {
        addGrouping(activeData.field)
      }
    },
    [addColumn, addGrouping],
  )

  // Preview report
  const handlePreview = useCallback(() => {
    if (configuration.entities.length === 0) {
      toast.error(t('errors.noEntity'))
      return
    }

    previewMutation.mutate({ configuration, limit: 100 })
    setActiveTab('preview')
  }, [configuration, previewMutation, t])

  // Save report
  const handleSave = useCallback(
    async (data: {
      name: string
      nameAr?: string
      description?: string
      descriptionAr?: string
      accessLevel: 'private' | 'team' | 'organization' | 'public'
      tags: string[]
    }) => {
      if (savedReportId) {
        await updateReportMutation.mutateAsync({
          id: savedReportId,
          ...data,
          configuration,
        })
      } else {
        const result = await createReportMutation.mutateAsync({
          ...data,
          configuration,
        })
        markAsSaved(result.id)
      }
      setIsSaveDialogOpen(false)
    },
    [savedReportId, configuration, createReportMutation, updateReportMutation, markAsSaved],
  )

  // Schedule report
  const handleSchedule = useCallback(
    async (data: {
      name: string
      nameAr?: string
      frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
      dayOfWeek?: number
      dayOfMonth?: number
      time: string
      timezone: string
      exportFormat: 'pdf' | 'excel' | 'csv' | 'json'
      recipients: string[]
    }) => {
      if (!savedReportId) {
        toast.error(t('errors.saveFailed'))
        return
      }

      await createScheduleMutation.mutateAsync({
        reportId: savedReportId,
        ...data,
      })
      setIsScheduleDialogOpen(false)
    },
    [savedReportId, createScheduleMutation, t],
  )

  // Select saved report
  const handleSelectReport = useCallback(
    (report: SavedReport) => {
      loadConfiguration(report)
      setSelectedSavedReport(report)
      setActiveTab('builder')
      toast.success(t('savedReports.actions.open'))
    },
    [loadConfiguration, t],
  )

  // Delete report
  const handleDeleteReport = useCallback(
    (reportId: string) => {
      deleteReportMutation.mutate(reportId)
    },
    [deleteReportMutation],
  )

  // Toggle favorite
  const handleToggleFavorite = useCallback(
    (reportId: string, isFavorite: boolean) => {
      toggleFavoriteMutation.mutate({ reportId, isFavorite })
    },
    [toggleFavoriteMutation],
  )

  return (
    <div className="flex flex-col h-full min-h-0" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isDirty && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {t('common:unsaved')}
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={resetConfiguration}>
            <RotateCcw className="h-4 w-4 me-2" />
            {t('actions.reset')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={configuration.entities.length === 0}
          >
            <Play className="h-4 w-4 me-2" />
            {t('actions.preview')}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={configuration.entities.length === 0}
          >
            <Save className="h-4 w-4 me-2" />
            {t('actions.save')}
          </Button>

          {savedReportId && (
            <Button variant="outline" size="sm" onClick={() => setIsScheduleDialogOpen(true)}>
              <Calendar className="h-4 w-4 me-2" />
              {t('actions.schedule')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-grid sm:grid-cols-3">
          <TabsTrigger value="builder" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.builder')}</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.preview')}</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('tabs.saved')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="flex-1 mt-4 min-h-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              {/* Left Panel - Entity & Field Selection */}
              <div className="lg:col-span-3 space-y-4">
                <EntitySelector selectedEntities={selectedEntities} onToggleEntity={toggleEntity} />
                <div className="h-[400px]">
                  <FieldList fields={availableFields} onAddColumn={addColumn} />
                </div>
              </div>

              {/* Middle Panel - Configuration */}
              <div className="lg:col-span-5 space-y-4">
                <div className="h-[300px]">
                  <ColumnBuilder
                    columns={configuration.columns}
                    onRemoveColumn={removeColumn}
                    onUpdateColumn={updateColumn}
                    onReorderColumns={reorderColumns}
                  />
                </div>

                <FilterBuilder
                  filters={configuration.filters}
                  availableFields={availableFields}
                  onAddFilter={addFilter}
                  onRemoveFilter={removeFilter}
                  onUpdateFilter={updateFilter}
                  onSetFilterLogic={setFilterLogic}
                />
              </div>

              {/* Right Panel - Grouping, Sorting, Visualization */}
              <div className="lg:col-span-4 space-y-4">
                <GroupingBuilder
                  groupings={configuration.groupings}
                  aggregations={configuration.aggregations}
                  availableFields={availableFields}
                  onAddGrouping={addGrouping}
                  onRemoveGrouping={removeGrouping}
                  onAddAggregation={addAggregation}
                  onRemoveAggregation={removeAggregation}
                />

                <SortingBuilder
                  sorting={configuration.sorting}
                  availableFields={availableFields}
                  onAddSort={addSort}
                  onRemoveSort={removeSort}
                  onUpdateSort={updateSort}
                />

                <VisualizationSelector
                  visualization={configuration.visualization}
                  availableFields={availableFields}
                  onSetVisualization={setVisualization}
                  onUpdateVisualization={updateVisualization}
                />
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeDragField && (
                <div className="p-2 rounded-md border bg-background shadow-lg">
                  <p className="text-sm font-medium">
                    {isRTL ? activeDragField.nameAr : activeDragField.name}
                  </p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 mt-4 min-h-0">
          <ReportPreview
            configuration={configuration}
            previewData={previewMutation.data || null}
            isLoading={previewMutation.isPending}
            error={previewMutation.error?.message || null}
            onRefresh={handlePreview}
          />
        </TabsContent>

        {/* Saved Reports Tab */}
        <TabsContent value="saved" className="flex-1 mt-4 min-h-0">
          <SavedReportsList
            reports={reportsData?.data || []}
            isLoading={isLoadingReports}
            selectedReportId={savedReportId}
            onSelectReport={handleSelectReport}
            onDeleteReport={handleDeleteReport}
            onToggleFavorite={handleToggleFavorite}
            onScheduleReport={(report) => {
              loadConfiguration(report)
              setIsScheduleDialogOpen(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Save Dialog */}
      <SaveReportDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        configuration={configuration}
        existingReport={selectedSavedReport}
        onSave={handleSave}
        isSaving={createReportMutation.isPending || updateReportMutation.isPending}
      />

      {/* Schedule Dialog */}
      {savedReportId && (
        <ScheduleReportDialog
          open={isScheduleDialogOpen}
          onOpenChange={setIsScheduleDialogOpen}
          reportId={savedReportId}
          onSave={handleSchedule}
          isSaving={createScheduleMutation.isPending}
        />
      )}
    </div>
  )
}
