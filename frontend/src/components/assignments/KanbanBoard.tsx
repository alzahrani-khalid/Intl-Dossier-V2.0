import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';
import { useEngagementKanban, SortOption, KanbanAssignment } from '@/hooks/useEngagementKanban';
import { useStageTransition } from '@/hooks/useStageTransition';
import { useKanbanRealtime } from '@/hooks/useKanbanRealtime';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardProps {
 engagementId: string;
}

export function KanbanBoard({ engagementId }: KanbanBoardProps) {
 const { t, i18n } = useTranslation('assignments');
 const isRTL = i18n.language === 'ar';
 const { user } = useAuth();
 const { toast } = useToast();
 
 const [sortBy, setSortBy] = useState<SortOption>('created_at');
 const [activeId, setActiveId] = useState<string | null>(null);
 
 const { data: columns, isLoading } = useEngagementKanban(engagementId, sortBy);
 const stageTransition = useStageTransition();
 
 // Enable realtime updates
 useKanbanRealtime(engagementId);

 // Configure sensors for touch and mouse
 const sensors = useSensors(
 useSensor(PointerSensor, {
 activationConstraint: {
 distance: 8, // 8px movement before drag starts
 },
 })
 );

 const handleDragStart = (event: DragStartEvent) => {
 setActiveId(event.active.id as string);
 };

 const handleDragEnd = (event: DragEndEvent) => {
 const { active, over } = event;
 setActiveId(null);

 if (!over || !user) return;

 const assignmentId = active.id as string;
 const newStage = over.id as string;

 // Find the assignment being moved
 let assignment: KanbanAssignment | undefined;
 if (columns) {
 for (const stage of Object.keys(columns)) {
 assignment = columns[stage as keyof typeof columns].find((a) => a.id === assignmentId);
 if (assignment) break;
 }
 }

 if (!assignment || assignment.workflow_stage === newStage) return;

 // Optimistic update
 stageTransition.mutate(
 {
 assignmentId,
 newStage,
 userId: user.id,
 },
 {
 onError: (error: Error) => {
 toast({
 title: t('kanban.stage_transition_error'),
 description: error.message,
 variant: 'destructive',
 });
 },
 }
 );
 };

 const stageOrder = isRTL
 ? ['cancelled', 'done', 'review', 'in_progress', 'todo']
 : ['todo', 'in_progress', 'review', 'done', 'cancelled'];

 if (isLoading) {
 return <div className="flex items-center justify-center h-96">{t('kanban.loading')}</div>;
 }

 if (!columns) {
 return <div className="flex items-center justify-center h-96">{t('kanban.error_loading')}</div>;
 }

 // Get active assignment for drag overlay
 let activeAssignment: KanbanAssignment | undefined;
 if (activeId && columns) {
 for (const stage of Object.keys(columns)) {
 activeAssignment = columns[stage as keyof typeof columns].find((a) => a.id === activeId);
 if (activeAssignment) break;
 }
 }

 return (
 <div className="flex flex-col gap-4 h-full" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Sort dropdown */}
 <div className="flex items-center gap-4 px-4 sm:px-6">
 <label htmlFor="sort-select" className="text-sm sm:text-base font-medium">
 {t('kanban.sort_by')}
 </label>
 <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
 <SelectTrigger id="sort-select" className="w-[180px] sm:w-[200px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="created_at">{t('kanban.sort_created')}</SelectItem>
 <SelectItem value="sla_deadline">{t('kanban.sort_sla')}</SelectItem>
 <SelectItem value="priority">{t('kanban.sort_priority')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Kanban columns */}
 <DndContext
 sensors={sensors}
 collisionDetection={closestCorners}
 onDragStart={handleDragStart}
 onDragEnd={handleDragEnd}
 >
 <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto px-4 sm:px-6 pb-4">
 {stageOrder.map((stage) => (
 <KanbanColumn
 key={stage}
 id={stage}
 title={t(`kanban.stage_${stage}`)}
 assignments={columns[stage as keyof typeof columns] || []}
 />
 ))}
 </div>

 <DragOverlay>
 {activeAssignment && <KanbanTaskCard assignment={activeAssignment} isDragging />}
 </DragOverlay>
 </DndContext>
 </div>
 );
}
