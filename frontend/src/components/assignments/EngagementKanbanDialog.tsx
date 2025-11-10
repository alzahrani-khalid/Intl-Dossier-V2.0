import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DragEndEvent } from '@dnd-kit/core';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, LayoutGrid } from 'lucide-react';
import { KanbanColumns, KanbanAssignment, WorkflowStage } from '@/hooks/useEngagementKanban';
import {
 KanbanProvider,
 KanbanBoard,
 KanbanHeader,
 KanbanCards,
 KanbanCard,
} from '@/components/kibo-ui/kanban';
import { KanbanTaskCard } from './KanbanTaskCard';

interface KanbanStats {
 total: number;
 todo: number;
 in_progress: number;
 review: number;
 done: number;
 progressPercentage: number;
}

interface EngagementKanbanDialogProps {
 open: boolean;
 onClose: () => void;
 engagementTitle: string;
 columns?: KanbanColumns;
 stats: KanbanStats;
 onDragEnd?: (assignmentId: string, newStage: WorkflowStage) => void;
}

export function EngagementKanbanDialog({
 open,
 onClose,
 engagementTitle,
 columns,
 stats,
 onDragEnd,
}: EngagementKanbanDialogProps): JSX.Element {
 const { t, i18n } = useTranslation('assignments');
 const isRTL = i18n.language === 'ar';

 // Transform columns to kibo-ui format
 const kanbanColumns = useMemo(
 () => [
 { id: 'todo', name: t('kanban.todo', 'To Do') },
 { id: 'in_progress', name: t('kanban.in_progress', 'In Progress') },
 { id: 'review', name: t('kanban.review', 'Review') },
 { id: 'done', name: t('kanban.done', 'Done') },
 { id: 'cancelled', name: t('kanban.cancelled', 'Cancelled') },
 ],
 [t]
 );

 // Transform assignments to kibo-ui format
 const kanbanData = useMemo(() => {
 if (!columns) return [];

 const allAssignments: Array<KanbanAssignment & { column: string }> = [];

 (columns.todo || []).forEach((a) => allAssignments.push({ ...a, column: 'todo' }));
 (columns.in_progress || []).forEach((a) => allAssignments.push({ ...a, column: 'in_progress' }));
 (columns.review || []).forEach((a) => allAssignments.push({ ...a, column: 'review' }));
 (columns.done || []).forEach((a) => allAssignments.push({ ...a, column: 'done' }));
 (columns.cancelled || []).forEach((a) => allAssignments.push({ ...a, column: 'cancelled' }));

 return allAssignments;
 }, [columns]);

 const handleDragEnd = (event: DragEndEvent) => {
 const { active, over } = event;

 if (!over || !onDragEnd) return;

 const assignmentId = active.id as string;
 const assignment = kanbanData.find((a) => a.id === assignmentId);

 if (!assignment) return;

 // Check if dropped on a column
 const newStage = over.id as WorkflowStage;
 const validStages: WorkflowStage[] = ['todo', 'in_progress', 'review', 'done', 'cancelled'];

 if (validStages.includes(newStage) && assignment.column !== newStage) {
 onDragEnd(assignmentId, newStage);
 }
 };

 return (
 <Dialog open={open} onOpenChange={onClose}>
 <DialogContent
 dir={isRTL ? 'rtl' : 'ltr'}
 className="max-w-[95vw] max-h-[90vh] p-0"
 >
 <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 space-y-2">
 <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
 <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
 {engagementTitle}
 </DialogTitle>
 <DialogDescription className="sr-only">
 {t('kanban.description', 'Drag and drop tasks between columns to update their workflow stage')}
 </DialogDescription>

 {/* Progress Bar */}
 <div className="space-y-1">
 <div className="flex items-center justify-between text-xs sm:text-sm">
 <span className="text-muted-foreground">
 {t('kanban.overallProgress', 'Overall Progress')}:
 </span>
 <span className="font-medium">
 {Math.round(stats.progressPercentage)}% ({stats.done}/{stats.total} {t('kanban.completed', 'completed')})
 </span>
 </div>
 <Progress value={stats.progressPercentage} className="h-2" />
 </div>
 </div>

 <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
 <X className="h-4 w-4" />
 </Button>
 </div>
 </DialogHeader>

 {/* Kanban Board */}
 <div className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-x-auto">
 <KanbanProvider
 columns={kanbanColumns}
 data={kanbanData}
 onDragEnd={handleDragEnd}
 className="min-w-[1200px] pb-2 gap-3"
 >
 {(column) => (
 <KanbanBoard
 key={column.id}
 id={column.id}
 className="bg-muted/30 border-muted"
 >
 <KanbanHeader className="bg-muted/50 font-semibold text-sm px-4 py-3 border-b">
 <div className="flex items-center justify-between">
 <span>{column.name}</span>
 <span className="ms-2 px-2 py-0.5 bg-background rounded-full text-xs font-normal">
 {kanbanData.filter((a) => a.column === column.id).length}
 </span>
 </div>
 </KanbanHeader>
 <KanbanCards id={column.id} className="p-3 gap-3 min-h-[400px]">
 {(assignment) => (
 <KanbanCard
 key={assignment.id}
 id={assignment.id}
 name={assignment.work_item_id}
 column={assignment.column}
 className="bg-background hover:shadow-md transition-shadow border-border"
 >
 <KanbanTaskCard assignment={assignment} />
 </KanbanCard>
 )}
 </KanbanCards>
 </KanbanBoard>
 )}
 </KanbanProvider>
 </div>

 {/* Keyboard Hint */}
 <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-xs text-muted-foreground">
 {t('kanban.keyboardHint', 'Drag tasks between columns to update their status')}
 </div>
 </DialogContent>
 </Dialog>
 );
}
