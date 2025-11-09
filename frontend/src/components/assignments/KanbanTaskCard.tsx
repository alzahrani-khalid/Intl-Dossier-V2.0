import { KanbanAssignment } from '@/hooks/useEngagementKanban';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface KanbanTaskCardProps {
 assignment: KanbanAssignment;
}

export function KanbanTaskCard({ assignment }: KanbanTaskCardProps) {
 const { t } = useTranslation('assignments');

 const getSLAStatus = () => {
 if (!assignment.current_stage_sla_deadline) return null;

 const deadline = new Date(assignment.current_stage_sla_deadline);
 const now = new Date();
 const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

 if (hoursRemaining < 0) return 'overdue';
 if (hoursRemaining < 4) return 'urgent';
 if (hoursRemaining < 24) return 'warning';
 return 'normal';
 };

 const slaStatus = getSLAStatus();
 const slaColors: Record<string, string> = {
 overdue: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
 urgent: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
 warning: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950',
 normal: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
 };

 const priorityVariants: Record<string, 'destructive' | 'default' | 'secondary'> = {
 high: 'destructive',
 medium: 'default',
 low: 'secondary',
 };

 // Generate a short title from work_item_type and truncated ID
 const shortId = assignment.work_item_id.split('-')[0];
 const workItemTitle = `${assignment.work_item_type.toUpperCase()} ${shortId}`;

 return (
 <div className="space-y-3">
 {/* Title */}
 <div className="flex items-start gap-2">
 <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
 <p className="text-sm font-medium line-clamp-2 text-start">
 {workItemTitle}
 </p>
 </div>

 {/* Priority Badge */}
 <div className="flex items-center gap-2">
 <Badge
 variant={priorityVariants[assignment.priority] || 'default'}
 className="text-xs capitalize"
 >
 {assignment.priority}
 </Badge>
 <span className="text-xs text-muted-foreground capitalize">
 {assignment.work_item_type}
 </span>
 </div>

 {/* Footer: Assignee and SLA */}
 <div className="flex items-center justify-between gap-2 pt-2 border-t">
 {assignment.assignee && (
 <div className="flex items-center gap-2">
 <Avatar className="h-6 w-6">
 <AvatarImage src={assignment.assignee.avatar_url} />
 <AvatarFallback className="text-xs">
 {assignment.assignee.full_name?.charAt(0) || 'S'}
 </AvatarFallback>
 </Avatar>
 <span className="text-xs truncate max-w-[120px]">
 {assignment.assignee.full_name || 'Staff Member'}
 </span>
 </div>
 )}

 {slaStatus && (
 <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${slaColors[slaStatus]}`}>
 <Clock className="h-3 w-3" />
 <span className="capitalize">{slaStatus}</span>
 </div>
 )}
 </div>
 </div>
 );
}
