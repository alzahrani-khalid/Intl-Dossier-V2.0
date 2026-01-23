import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanTaskCard } from './KanbanTaskCard';
import { KanbanAssignment } from '@/hooks/useEngagementKanban';
import { useTranslation } from 'react-i18next';

interface KanbanColumnProps {
 id: string;
 title: string;
 assignments: KanbanAssignment[];
}

export function KanbanColumn({ id, title, assignments }: KanbanColumnProps) {
 const { t } = useTranslation('assignments');
 const { setNodeRef, isOver } = useDroppable({ id });

 const stageColors: Record<string, string> = {
 todo: 'bg-slate-100 dark:bg-slate-800',
 in_progress: 'bg-blue-100 dark:bg-blue-900',
 review: 'bg-yellow-100 dark:bg-yellow-900',
 done: 'bg-green-100 dark:bg-green-900',
 cancelled: 'bg-red-100 dark:bg-red-900',
 };

 const bgClass = stageColors[id] || 'bg-gray-100 dark:bg-gray-800';
 const ringClass = isOver ? 'ring-2 ring-primary ring-offset-2' : '';

 return (
 <div
 ref={setNodeRef}
 className={`flex min-w-[280px] flex-1 flex-col gap-2 rounded-lg p-4 sm:min-w-[300px] ${bgClass} ${ringClass} transition-all`}
 >
 <div className="mb-2 flex items-center justify-between">
 <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
 <span className="text-xs text-muted-foreground sm:text-sm">
 {assignments.length}
 </span>
 </div>

 <SortableContext items={assignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
 <div className="flex min-h-[200px] flex-col gap-2">
 {assignments.length === 0 ? (
 <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
 {t('kanban.no_assignments')}
 </div>
 ) : (
 assignments.map((assignment) => (
 <KanbanTaskCard key={assignment.id} assignment={assignment} />
 ))
 )}
 </div>
 </SortableContext>
 </div>
 );
}
