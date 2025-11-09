import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Folder } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface LinkedEntity {
 type: 'dossier' | 'position' | 'ticket';
 id: string;
 name_en?: string;
 name_ar?: string;
 title_en?: string;
 title_ar?: string;
 ticket_number?: string;
 status?: string;
}

interface WorkItemPreviewProps {
 assignment: {
 id: string;
 work_item_type: string;
 work_item_id: string | null; // Nullable for unified tasks model
 work_item_title?: string;
 work_item_preview?: string;
 work_item_linked_entities?: LinkedEntity[];
 required_skills?: string[];
 };
 showViewButton?: boolean; // Optional prop to show/hide the "View Full Details" button
}

export function WorkItemPreview({ assignment, showViewButton = false }: WorkItemPreviewProps): JSX.Element {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const truncateContent = (content: string, maxLength: number = 200): string => {
 if (content.length <= maxLength) return content;
 return content.substring(0, maxLength) + '...';
 };

 const getTypeIcon = (): JSX.Element => {
 return <FileText className="h-5 w-5" />;
 };

 const getTypeColor = (): 'default' | 'secondary' | 'outline' | 'destructive' => {
 switch (assignment.work_item_type) {
 case 'task':
 return 'default';
 case 'dossier':
 return 'default';
 case 'ticket':
 return 'secondary';
 case 'engagement':
 return 'outline';
 case 'position':
 return 'destructive';
 default:
 return 'secondary';
 }
 };

 const getViewFullLink = (): string => {
 // For task-based assignments, link to the first linked entity if available
 if (assignment.work_item_type === 'task' && assignment.work_item_linked_entities && assignment.work_item_linked_entities.length > 0) {
 const firstEntity = assignment.work_item_linked_entities[0];
 if (firstEntity.type === 'dossier') {
 return `/dossiers/${firstEntity.id}`;
 } else if (firstEntity.type === 'position') {
 return `/positions/${firstEntity.id}`;
 } else if (firstEntity.type === 'ticket') {
 return `/intake-queue/${firstEntity.id}`;
 }
 }

 // Legacy fallback for direct work item links
 switch (assignment.work_item_type) {
 case 'dossier':
 return `/dossiers/${assignment.work_item_id}`;
 case 'position':
 return `/positions/${assignment.work_item_id}`;
 case 'ticket':
 return `/intake-queue/${assignment.work_item_id}`;
 default:
 return `/tasks/${assignment.id}`;
 }
 };

 return (
 <Card dir={isRTL ? 'rtl' : 'ltr'} className="w-full">
 <CardHeader className="pb-4">
 <CardTitle className="flex items-center gap-2 text-start">
 {getTypeIcon()}
 {t('assignments.workItem.title', 'Work Item')}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Work Item Type */}
 <div className="flex items-start gap-2">
 <Badge variant={getTypeColor()}>
 {t(`workItem.type_${assignment.work_item_type}`, assignment.work_item_type)}
 </Badge>
 </div>

 {/* Work Item Title */}
 {assignment.work_item_title && (
 <div className="space-y-1">
 <h3 className="text-lg font-semibold text-start">{assignment.work_item_title}</h3>
 </div>
 )}

 {/* Work Item ID */}
 <div className="flex items-center gap-2">
 <span className="text-sm text-muted-foreground">
 {t('workItem.id', 'ID')}:
 </span>
 <span className="font-mono text-sm font-medium">
 {assignment.work_item_id?.slice(0, 8) || assignment.id.slice(0, 8)}
 </span>
 </div>

 {/* Content Preview / Description */}
 {assignment.work_item_preview && (
 <div className="space-y-1">
 <span className="text-sm text-muted-foreground">
 {t('workItem.preview', 'Description')}:
 </span>
 <p className="text-sm text-muted-foreground leading-relaxed text-start">
 {truncateContent(assignment.work_item_preview)}
 </p>
 </div>
 )}

 {/* Linked Entities (for tasks) */}
 {assignment.work_item_linked_entities && assignment.work_item_linked_entities.length > 0 && (
 <div className="space-y-3">
 <span className="text-sm font-semibold text-muted-foreground uppercase">
 {t('workItem.linkedItems', 'Linked Items')}
 </span>
 <div className="space-y-2">
 {assignment.work_item_linked_entities.map((entity, index) => {
 const entityTitle = entity.type === 'dossier'
 ? (isRTL ? entity.name_ar : entity.name_en)
 : entity.type === 'position'
 ? (isRTL ? entity.title_ar : entity.title_en)
 : entity.ticket_number || (isRTL ? entity.title_ar : entity.title_en);

 const entityTypeLabel = t(`waitingQueue.entityType.${entity.type}`, entity.type);

 const entityLink = entity.type === 'dossier'
 ? `/dossiers/${entity.id}`
 : entity.type === 'position'
 ? `/positions/${entity.id}`
 : `/intake-queue/${entity.id}`;

 return (
 <Link
 key={`${entity.type}-${entity.id}-${index}`}
 to={entityLink}
 className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
 >
 <Folder className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
 <div className="flex-1 min-w-0">
 <p className="text-xs text-muted-foreground capitalize">
 {entityTypeLabel}
 </p>
 <p className="text-sm font-medium text-start">
 {entityTitle}
 </p>
 {entity.status && (
 <Badge variant="outline" className="text-xs mt-1">
 {entity.status}
 </Badge>
 )}
 </div>
 <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
 </Link>
 );
 })}
 </div>
 </div>
 )}

 {/* Required Skills */}
 {assignment.required_skills && assignment.required_skills.length > 0 && (
 <div className="space-y-2">
 <span className="text-sm text-muted-foreground">
 {t('workItem.requiredSkills', 'Required Skills')}:
 </span>
 <div className="flex flex-wrap gap-2">
 {assignment.required_skills.map((skill, index) => (
 <Badge key={index} variant="outline" className="text-xs">
 {skill}
 </Badge>
 ))}
 </div>
 </div>
 )}

 {/* View Full Link - only show if showViewButton is true */}
 {showViewButton && (
 <div className="pt-2">
 <Button asChild variant="outline" className="w-full h-11">
 <Link to={getViewFullLink()}>
 <ExternalLink className="h-4 w-4 me-2" />
 {t('workItem.viewFull', 'View Full Details')}
 </Link>
 </Button>
 </div>
 )}
 </CardContent>
 </Card>
 );
}
