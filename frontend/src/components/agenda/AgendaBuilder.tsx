/**
 * AgendaBuilder Component
 * Feature: meeting-agenda-builder
 *
 * Main component for building and managing meeting agendas with:
 * - Time-boxed agenda items with drag-and-drop reordering
 * - Presenter assignment
 * - Entity linking (dossiers, commitments)
 * - Document attachments
 * - Real-time timing during meetings
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Clock,
  Plus,
  Play,
  Square,
  FileText,
  Users,
  Settings,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useAgenda,
  useAgendaTiming,
  useStartMeeting,
  useEndMeeting,
  useReorderAgendaItems,
} from '@/hooks/useMeetingAgenda'
import { AgendaItemCard } from './AgendaItemCard'
import { AgendaItemForm } from './AgendaItemForm'
import { AgendaTimingTracker } from './AgendaTimingTracker'
import { AgendaParticipantsList } from './AgendaParticipantsList'
import { AgendaDocumentsList } from './AgendaDocumentsList'
import type { AgendaItem, AgendaFull, AgendaStatus } from '@/types/meeting-agenda.types'
import {
  AGENDA_STATUS_COLORS,
  formatDuration,
  calculateItemTimes,
} from '@/types/meeting-agenda.types'

interface AgendaBuilderProps {
  agendaId: string
  onClose?: () => void
}

export function AgendaBuilder({ agendaId, onClose }: AgendaBuilderProps) {
  const { t, i18n } = useTranslation('agenda')
  const isRTL = i18n.language === 'ar'

  const [activeTab, setActiveTab] = useState('items')
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null)
  const [expandedView, setExpandedView] = useState(true)

  // Fetch agenda data
  const { data: agendaData, isLoading } = useAgenda(agendaId)
  const { data: timingData } = useAgendaTiming(agendaId)

  // Mutations
  const startMeeting = useStartMeeting()
  const endMeeting = useEndMeeting()
  const reorderItems = useReorderAgendaItems()

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Memoized calculations
  const agenda = agendaData?.agenda
  const items = agendaData?.items || []
  const participants = agendaData?.participants || []
  const documents = agendaData?.documents || []
  const stats = agendaData?.stats

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.sort_order - b.sort_order), [items])

  const totalDuration = useMemo(
    () => items.reduce((sum, item) => sum + item.planned_duration_minutes, 0),
    [items],
  )

  const itemsWithTiming = useMemo(() => {
    if (!agenda?.planned_start_time) return sortedItems
    return calculateItemTimes(sortedItems, agenda.planned_start_time)
  }, [sortedItems, agenda?.planned_start_time])

  const inMeeting = agenda?.status === 'in_meeting'
  const isCompleted = agenda?.status === 'completed'
  const canEdit = agenda?.status === 'draft' || agenda?.status === 'finalized'

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedItems.findIndex((item) => item.id === active.id)
    const newIndex = sortedItems.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(sortedItems, oldIndex, newIndex)
    const itemOrders = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }))

    await reorderItems.mutateAsync({ agendaId, itemOrders })
  }

  // Handle meeting control
  const handleStartMeeting = async () => {
    await startMeeting.mutateAsync(agendaId)
  }

  const handleEndMeeting = async () => {
    await endMeeting.mutateAsync(agendaId)
  }

  // Get status badge styling
  const getStatusBadge = (status: AgendaStatus) => {
    const colors = AGENDA_STATUS_COLORS[status]
    return (
      <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
        {t(`status.${status}`)}
      </Badge>
    )
  }

  if (isLoading || !agenda) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg sm:text-xl">
                  {isRTL ? agenda.title_ar || agenda.title_en : agenda.title_en}
                </CardTitle>
                {getStatusBadge(agenda.status)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(agenda.meeting_date).toLocaleDateString(i18n.language)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(totalDuration)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {stats?.participant_count || 0} {t('participants')}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowItemForm(true)}
                  className="min-h-11 sm:min-h-10"
                >
                  <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('addItem')}
                </Button>
              )}

              {(agenda.status === 'draft' || agenda.status === 'finalized') && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartMeeting}
                  disabled={startMeeting.isPending}
                  className="min-h-11 bg-green-600 hover:bg-green-700 sm:min-h-10"
                >
                  <Play className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('startMeeting')}
                </Button>
              )}

              {inMeeting && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndMeeting}
                  disabled={endMeeting.isPending}
                  className="min-h-11 sm:min-h-10"
                >
                  <Square className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('endMeeting')}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-h-11 sm:min-h-10">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  <DropdownMenuItem>
                    <Download className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('exportPdf')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('saveAsTemplate')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timing Tracker (visible during meeting) */}
      {(inMeeting || isCompleted) && timingData && (
        <AgendaTimingTracker
          timing={timingData}
          currentItemId={items.find((i) => i.status === 'in_progress')?.id}
          inMeeting={inMeeting}
        />
      )}

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:gap-2">
          <TabsTrigger value="items" className="min-h-11 sm:min-h-10">
            <FileText className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span className="hidden sm:inline">{t('agendaItems')}</span>
            <Badge variant="secondary" className="ms-2">
              {items.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="participants" className="min-h-11 sm:min-h-10">
            <Users className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span className="hidden sm:inline">{t('participants')}</span>
            <Badge variant="secondary" className="ms-2">
              {participants.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="min-h-11 sm:min-h-10">
            <FileText className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            <span className="hidden sm:inline">{t('documents')}</span>
            <Badge variant="secondary" className="ms-2">
              {documents.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Agenda Items Tab */}
        <TabsContent value="items" className="mt-4 flex-1">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('agendaItems')}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setExpandedView(!expandedView)}>
                  {expandedView ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">{t('noItems')}</p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      className="mt-4 min-h-11"
                      onClick={() => setShowItemForm(true)}
                    >
                      <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {t('addFirstItem')}
                    </Button>
                  )}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedItems.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                    disabled={!canEdit}
                  >
                    <div className="space-y-2">
                      {itemsWithTiming.map((item, index) => (
                        <AgendaItemCard
                          key={item.id}
                          item={item}
                          index={index}
                          agendaId={agendaId}
                          expanded={expandedView}
                          canEdit={canEdit}
                          inMeeting={inMeeting}
                          calculatedStart={
                            'calculated_start' in item ? item.calculated_start : undefined
                          }
                          calculatedEnd={'calculated_end' in item ? item.calculated_end : undefined}
                          onEdit={() => {
                            setEditingItem(item)
                            setShowItemForm(true)
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="mt-4">
          <AgendaParticipantsList
            agendaId={agendaId}
            participants={participants}
            canEdit={canEdit}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <AgendaDocumentsList
            agendaId={agendaId}
            documents={documents}
            items={items}
            canEdit={canEdit}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Form Modal */}
      {showItemForm && (
        <AgendaItemForm
          agendaId={agendaId}
          item={editingItem}
          onClose={() => {
            setShowItemForm(false)
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}

export default AgendaBuilder
