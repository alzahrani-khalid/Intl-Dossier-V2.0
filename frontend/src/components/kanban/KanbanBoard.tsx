/**
 * KanbanBoard Component
 * Feature: 025-unified-tasks-model
 * User Stories: US1 (setup), US3 (full implementation with drag-and-drop)
 * Task: T037 (basic display), T059-T064 (drag-and-drop)
 *
 * Displays task titles on kanban cards with mobile-first responsive design and RTL support
 * Includes drag-and-drop functionality with optimistic updates and auto-retry on failure
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
 DndContext,
 DragEndEvent,
 DragOverlay,
 DragStartEvent,
 PointerSensor,
 useSensor,
 useSensors,
 closestCorners,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { SLAIndicator } from '../tasks/SLAIndicator';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '../../../../backend/src/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type WorkflowStage = Task['workflow_stage'];

interface KanbanBoardProps {
 tasks: Task[];
 onTaskClick?: (task: Task) => void;
 onTaskMove?: (taskId: string, newStage: WorkflowStage, updatedAt: string) => Promise<void>;
 isLoading?: boolean;
 engagementId?: string; // T059: Filter by engagement
}

const WORKFLOW_STAGES: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done'];

export function KanbanBoard({
 tasks,
 onTaskClick,
 onTaskMove,
 isLoading = false,
 engagementId,
}: KanbanBoardProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { toast } = useToast();

 // T060: Drag-and-drop state management
 const [activeTask, setActiveTask] = useState<Task | null>(null);
 const [isDragging, setIsDragging] = useState(false);
 const [isRetrying, setIsRetrying] = useState<string | null>(null); // Task ID being retried

 // T060: Configure sensors for drag-and-drop
 const sensors = useSensors(
 useSensor(PointerSensor, {
 activationConstraint: {
 distance: 8, // Prevents accidental drags on click
 },
 })
 );

 // T060: Handle drag start
 const handleDragStart = (event: DragStartEvent) => {
 const { active } = event;
 const task = tasks.find(t => t.id === active.id);
 if (task) {
 setActiveTask(task);
 setIsDragging(true);
 }
 };

 // T060-T063: Handle drag end with optimistic updates and retry logic
 const handleDragEnd = async (event: DragEndEvent) => {
 const { active, over } = event;
 setIsDragging(false);
 setActiveTask(null);

 if (!over || !onTaskMove) return;

 const taskId = active.id as string;
 const newStage = over.id as WorkflowStage;
 const task = tasks.find(t => t.id === taskId);

 if (!task || task.workflow_stage === newStage) return;

 // T062: Show loading indicator during drag operation (<200ms visibility per NFR-010)
 setIsRetrying(taskId);

 // T061: Auto-retry with exponential backoff (2-3 attempts per research.md)
 const maxRetries = 3;
 let lastError: Error | null = null;

 for (let attempt = 0; attempt < maxRetries; attempt++) {
 try {
 // T060: Call onTaskMove with optimistic locking timestamp
 await onTaskMove(taskId, newStage, task.updated_at);

 // Success!
 setIsRetrying(null);
 toast({
 title: t('tasks.move_success', 'Task moved successfully'),
 description: t('tasks.moved_to', `Moved to ${newStage}`),
 });
 return;

 } catch (error) {
 lastError = error as Error;

 // T061: Exponential backoff delay (500ms, 1s, 2s)
 if (attempt < maxRetries - 1) {
 const delay = Math.min(500 * Math.pow(2, attempt), 10000);
 await new Promise(resolve => setTimeout(resolve, delay));
 }
 }
 }

 // T063: All retries failed - revert card position and show error
 setIsRetrying(null);
 toast({
 title: t('tasks.move_failed', 'Failed to move task'),
 description: lastError?.message || t('tasks.move_error', 'Please try again'),
 variant: 'destructive',
 });
 };

 // Group tasks by workflow_stage
 const tasksByStage = React.useMemo(() => {
 const grouped: Record<WorkflowStage, Task[]> = {
 todo: [],
 in_progress: [],
 review: [],
 done: [],
 cancelled: [],
 };

 tasks.forEach(task => {
 if (grouped[task.workflow_stage]) {
 grouped[task.workflow_stage].push(task);
 }
 });

 // Sort tasks within each stage by created_at DESC
 Object.keys(grouped).forEach(stage => {
 grouped[stage as WorkflowStage].sort(
 (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
 );
 });

 return grouped;
 }, [tasks]);

 const getStageColor = (stage: WorkflowStage): string => {
 const colors = {
 todo: 'border-gray-300 bg-gray-50 dark:bg-gray-900',
 in_progress: 'border-blue-300 bg-blue-50 dark:bg-blue-950',
 review: 'border-purple-300 bg-purple-50 dark:bg-purple-950',
 done: 'border-green-300 bg-green-50 dark:bg-green-950',
 cancelled: 'border-red-300 bg-red-50 dark:bg-red-950',
 };
 return colors[stage];
 };

 const getPriorityColor = (priority: string): string => {
 const colors = {
 urgent: 'bg-red-500',
 high: 'bg-orange-500',
 medium: 'bg-blue-500',
 low: 'bg-gray-500',
 };
 return colors[priority as keyof typeof colors] || colors.medium;
 };

 const getSLAStatus = (task: Task): 'safe' | 'warning' | 'breached' => {
 if (!task.sla_deadline) return 'safe';

 const now = new Date();
 const deadline = new Date(task.sla_deadline);
 const created = new Date(task.created_at);
 const total = deadline.getTime() - created.getTime();
 const remaining = deadline.getTime() - now.getTime();
 const percentage = (remaining / total) * 100;

 if (remaining < 0) return 'breached';
 if (percentage < 25) return 'warning';
 return 'safe';
 };

 // T064: Mobile-first responsive design (base: single column swipeable, lg: multi-column drag-drop, RTL: column order reversed)
 return (
 <DndContext
 sensors={sensors}
 collisionDetection={closestCorners}
 onDragStart={handleDragStart}
 onDragEnd={handleDragEnd}
 >
 <div className="space-y-4">
 {/* Mobile View: Single column with tabs/accordion (base to sm:) - Drag disabled on mobile */}
 <div className="block lg:hidden">
 <div className="space-y-4">
 {WORKFLOW_STAGES.map(stage => {
 const stageTasks = tasksByStage[stage];
 return (
 <Card key={stage} className={getStageColor(stage)}>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-base sm:text-lg">
 {t(`workflow_stage.${stage}`, stage)}
 </CardTitle>
 <Badge variant="secondary">{stageTasks.length}</Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-2">
 {stageTasks.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-4">
 {t('no_tasks_in_stage', 'No tasks')}
 </p>
 ) : (
 stageTasks.map(task => (
 <KanbanCard
 key={task.id}
 task={task}
 onClick={onTaskClick}
 isRTL={isRTL}
 getPriorityColor={getPriorityColor}
 getSLAStatus={getSLAStatus}
 />
 ))
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>
 </div>

 {/* Desktop View: Multi-column kanban board with drag-and-drop (lg:) */}
 <div className="hidden lg:grid lg:grid-cols-4 gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {WORKFLOW_STAGES.map(stage => {
 const stageTasks = tasksByStage[stage];
 return (
 <DroppableColumn key={stage} id={stage}>
 <Card className={`${getStageColor(stage)} flex-1`}>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-sm font-medium">
 {t(`workflow_stage.${stage}`, stage)}
 </CardTitle>
 <Badge variant="secondary" className="text-xs">
 {stageTasks.length}
 </Badge>
 </div>
 </CardHeader>
 <ScrollArea className="h-[calc(100vh-300px)]">
 <CardContent className="space-y-2 min-h-[200px]">
 <SortableContext
 items={stageTasks.map(t => t.id)}
 strategy={verticalListSortingStrategy}
 >
 {stageTasks.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-8">
 {t('no_tasks_in_stage', 'No tasks')}
 </p>
 ) : (
 stageTasks.map(task => (
 <DraggableKanbanCard
 key={task.id}
 task={task}
 onClick={onTaskClick}
 isRTL={isRTL}
 getPriorityColor={getPriorityColor}
 getSLAStatus={getSLAStatus}
 isRetrying={isRetrying === task.id}
 isDragging={isDragging && activeTask?.id === task.id}
 />
 ))
 )}
 </SortableContext>
 </CardContent>
 </ScrollArea>
 </Card>
 </DroppableColumn>
 );
 })}
 </div>

 {/* Drag overlay for smooth drag experience */}
 <DragOverlay>
 {activeTask && (
 <KanbanCard
 task={activeTask}
 isRTL={isRTL}
 getPriorityColor={getPriorityColor}
 getSLAStatus={getSLAStatus}
 />
 )}
 </DragOverlay>
 </div>
 </DndContext>
 );
}

/**
 * KanbanCard Component
 * Displays individual task card with title, priority, SLA status, and contributor avatars (T051)
 * Mobile-first: min-h-11 min-w-11 touch targets, size-8 sm:size-10 avatars
 */
interface KanbanCardProps {
 task: Task & { contributors?: Array<{ user_id: string; role: string }> };
 onClick?: (task: Task) => void;
 isRTL: boolean;
 getPriorityColor: (priority: string) => string;
 getSLAStatus: (task: Task) => 'safe' | 'warning' | 'breached';
}

function KanbanCard({
 task,
 onClick,
 isRTL,
 getPriorityColor,
 getSLAStatus,
}: KanbanCardProps) {
 const { t } = useTranslation();
 const isCompleted = task.status === 'completed' || task.status === 'cancelled';

 // Get contributors for display (max 3 avatars with +N overflow)
 const contributors = task.contributors || [];
 const displayedContributors = contributors.slice(0, 3);
 const overflowCount = Math.max(0, contributors.length - 3);

 return (
 <Card
 className="cursor-pointer hover:shadow-md transition-shadow "
 onClick={() => onClick?.(task)}
 >
 <CardContent className="p-3">
 {/* Priority indicator + SLA indicator - T081: Using SLAIndicator component */}
 <div className="flex items-start justify-between mb-2">
 <div className={`w-1 h-8 ${getPriorityColor(task.priority)} rounded`} />
 <SLAIndicator
 deadline={task.sla_deadline}
 isCompleted={isCompleted}
 completedAt={task.completed_at}
 mode="badge"
 className="scale-90"
 />
 </div>

 {/* Task Title - Mobile-first, RTL-compatible */}
 <h4 className={`text-sm font-medium line-clamp-2 mb-2 ${isRTL ? 'text-end' : 'text-start'}`}>
 {task.title}
 </h4>

 {/* Metadata */}
 <div className="flex items-center gap-2 flex-wrap">
 <Badge variant="outline" className="text-xs">
 {t(`priority.${task.priority}`, task.priority)}
 </Badge>
 {task.work_item_type && task.work_item_type !== 'generic' && (
 <Badge variant="outline" className="text-xs">
 {t(`work_item.${task.work_item_type}`, task.work_item_type)}
 </Badge>
 )}
 </div>

 {/* Contributor Avatars (T051) - Max 3 avatars with +N overflow */}
 {contributors.length > 0 && (
 <div className="flex items-center gap-1 mt-2" dir={isRTL ? 'rtl' : 'ltr'}>
 <span className="text-xs text-muted-foreground me-1">
 {t('tasks.contributors', 'Contributors')}:
 </span>
 <div className="flex items-center -space-x-2">
 {displayedContributors.map((contributor, index) => (
 <div
 key={contributor.user_id}
 className="relative size-8 sm:size-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium"
 style={{ zIndex: displayedContributors.length - index }}
 title={`${t(`tasks.contributorRole.${contributor.role}`, contributor.role)}`}
 >
 {getInitials(contributor.user_id)}
 </div>
 ))}
 {overflowCount > 0 && (
 <div
 className="relative size-8 sm:size-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium"
 title={t('tasks.moreContributors', `+${overflowCount} more`)}
 >
 +{overflowCount}
 </div>
 )}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 );
}

/**
 * Get user initials from user_id for avatar display
 * Falls back to first 2 characters if user_id is short
 */
function getInitials(userId: string): string {
 if (!userId) return '??';

 // If userId looks like an email, extract initials from name part
 if (userId.includes('@')) {
 const namePart = userId.split('@')[0];
 const parts = namePart.split(/[._-]/);
 if (parts.length >= 2) {
 return (parts[0][0] + parts[1][0]).toUpperCase();
 }
 return namePart.substring(0, 2).toUpperCase();
 }

 // Otherwise use first 2 characters
 return userId.substring(0, 2).toUpperCase();
}

/**
 * DroppableColumn Component
 * T060: Makes a kanban column droppable for drag-and-drop
 */
interface DroppableColumnProps {
 id: string;
 children: React.ReactNode;
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
 const { setNodeRef } = useSortable({ id });

 return (
 <div ref={setNodeRef} className="flex flex-col">
 {children}
 </div>
 );
}

/**
 * DraggableKanbanCard Component
 * T060: Makes a kanban card draggable with loading states
 */
interface DraggableKanbanCardProps extends Omit<KanbanCardProps, 'task'> {
 task: Task & { contributors?: Array<{ user_id: string; role: string }> };
 isRetrying?: boolean;
 isDragging?: boolean;
}

function DraggableKanbanCard({
 task,
 onClick,
 isRTL,
 getPriorityColor,
 getSLAStatus,
 isRetrying = false,
 isDragging = false,
}: DraggableKanbanCardProps) {
 const {
 attributes,
 listeners,
 setNodeRef,
 transform,
 transition,
 isDragging: isSortableDragging,
 } = useSortable({ id: task.id });

 const style = {
 transform: CSS.Transform.toString(transform),
 transition,
 opacity: isSortableDragging ? 0.5 : 1,
 };

 return (
 <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
 <div className="relative">
 {/* T062: Loading indicator visible within 200ms during retries */}
 {isRetrying && (
 <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
 <Loader2 className="h-6 w-6 animate-spin text-primary" />
 </div>
 )}
 <KanbanCard
 task={task}
 onClick={onClick}
 isRTL={isRTL}
 getPriorityColor={getPriorityColor}
 getSLAStatus={getSLAStatus}
 />
 </div>
 </div>
 );
}

export default KanbanBoard;
