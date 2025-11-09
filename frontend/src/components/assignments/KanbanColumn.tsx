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
 className={`flex flex-col gap-2 p-4 rounded-lg min-w-[280px] sm:min-w-[300px] flex-1 ${bgClass} ${ringClass} transition-all`}
 >
 <div className="flex items-center justify-between mb-2">
 <h3 className="text-sm sm:text-base font-semibold">{title}</h3>
 <span className="text-xs sm:text-sm text-muted-foreground">
 {assignments.length}
 </span>
 </div>

 <SortableContext items={assignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
 <div className="flex flex-col gap-2 min-h-[200px]">
 {assignments.length === 0 ? (
 <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
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
