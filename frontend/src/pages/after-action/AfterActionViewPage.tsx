/**
 * After-Action View Page
 * Feature: 022-after-action-structured
 *
 * Page for viewing published after-action records in read-only mode
 * with linked tasks display.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useAfterActionDetail } from '@/hooks/useAfterAction';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
 AlertCircle,
 Loader2,
 Edit,
 FileText,
 Calendar,
 Users,
 CheckCircle,
 AlertTriangle,
 ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AfterActionViewPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const navigate = useNavigate();
 const { id } = useParams({ from: '/after-actions/$id' });

 // Fetch after-action details
 const {
 data: afterAction,
 isLoading,
 error,
 } = useAfterActionDetail(id);

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'draft':
 return 'bg-gray-100 text-gray-800';
 case 'published':
 return 'bg-green-100 text-green-800';
 case 'edit_pending':
 return 'bg-yellow-100 text-yellow-800';
 default:
 return 'bg-gray-100 text-gray-800';
 }
 };

 const getConfidentialityColor = (level: string) => {
 switch (level) {
 case 'public':
 return 'bg-blue-100 text-blue-800';
 case 'internal':
 return 'bg-gray-100 text-gray-800';
 case 'confidential':
 return 'bg-orange-100 text-orange-800';
 case 'secret':
 return 'bg-red-100 text-red-800';
 default:
 return 'bg-gray-100 text-gray-800';
 }
 };

 // Loading state
 if (isLoading) {
 return (
 <div
 className={cn(
 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl',
 isRTL && 'rtl'
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="flex min-h-[400px] items-center justify-center">
 <Loader2 className="size-8 animate-spin text-primary" />
 </div>
 </div>
 );
 }

 // Error state
 if (error || !afterAction) {
 return (
 <div
 className={cn(
 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl',
 isRTL && 'rtl'
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <Alert variant="destructive">
 <AlertCircle className="size-4" />
 <AlertDescription>
 {t('afterActions.view.notFound')}
 </AlertDescription>
 </Alert>
 </div>
 );
 }

 return (
 <div
 className={cn(
 'container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl',
 isRTL && 'rtl'
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {/* Page Header */}
 <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <div className="mb-2 flex items-center gap-2">
 <h1 className="text-start text-2xl font-bold sm:text-3xl md:text-4xl">
 {afterAction.title}
 </h1>
 </div>
 <div className="flex flex-wrap gap-2">
 <Badge className={getStatusColor(afterAction.status)}>
 {t(`afterActions.status.${afterAction.status}`)}
 </Badge>
 <Badge className={getConfidentialityColor(afterAction.confidentiality_level)}>
 {t(`afterActions.confidentiality.${afterAction.confidentiality_level}`)}
 </Badge>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-2">
 {afterAction.status === 'draft' && (
 <Button
 variant="default"
 onClick={() => navigate({ to: `/after-actions/${id}/edit` })}
 >
 <Edit className="me-2 size-4" />
 {t('afterActions.view.editDraft')}
 </Button>
 )}
 {afterAction.status === 'published' && (
 <Button
 variant="outline"
 onClick={() => navigate({ to: `/after-actions/${id}/request-edit` })}
 >
 <FileText className="me-2 size-4" />
 {t('afterActions.view.requestEdit')}
 </Button>
 )}
 </div>
 </div>

 {/* Metadata */}
 <Card className="mb-6">
 <CardHeader>
 <CardTitle>{t('afterActions.view.metadata')}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 text-sm">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <span className="font-semibold">{t('afterActions.view.createdBy')}:</span>{' '}
 {afterAction.created_by_name}
 </div>
 <div>
 <span className="font-semibold">{t('afterActions.view.createdAt')}:</span>{' '}
 {format(new Date(afterAction.created_at), 'PPp', { locale: i18n.language === 'ar' ? undefined : undefined })}
 </div>
 {afterAction.published_by && (
 <>
 <div>
 <span className="font-semibold">{t('afterActions.view.publishedBy')}:</span>{' '}
 {afterAction.published_by_name}
 </div>
 <div>
 <span className="font-semibold">{t('afterActions.view.publishedAt')}:</span>{' '}
 {format(new Date(afterAction.published_at!), 'PPp')}
 </div>
 </>
 )}
 </div>
 </CardContent>
 </Card>

 {/* Description */}
 {afterAction.description && (
 <Card className="mb-6">
 <CardHeader>
 <CardTitle>{t('afterActions.view.description')}</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="whitespace-pre-wrap text-start">{afterAction.description}</p>
 </CardContent>
 </Card>
 )}

 {/* Attendance */}
 {afterAction.attendance_list && afterAction.attendance_list.length > 0 && (
 <Card className="mb-6">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Users className="size-5" />
 {t('afterActions.view.attendance')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {afterAction.attendance_list.map((attendee: any, index: number) => (
 <div key={index} className="rounded-lg border p-3">
 <div className="font-semibold">{attendee.name}</div>
 <div className="text-sm text-muted-foreground">{attendee.role}</div>
 {attendee.organization && (
 <div className="mt-1 text-xs text-muted-foreground">{attendee.organization}</div>
 )}
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Decisions */}
 {afterAction.decisions && afterAction.decisions.length > 0 && (
 <Card className="mb-6">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <CheckCircle className="size-5" />
 {t('afterActions.view.decisions')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {afterAction.decisions.map((decision: any) => (
 <div key={decision.id} className="rounded-lg border p-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <p className="text-start font-medium">{decision.description}</p>
 {decision.rationale && (
 <p className="mt-2 text-start text-sm text-muted-foreground">{decision.rationale}</p>
 )}
 <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
 <span>{decision.decision_maker}</span>
 <span>•</span>
 <span>{format(new Date(decision.decided_at), 'PPp')}</span>
 </div>
 </div>
 {decision.ai_extracted && decision.confidence_score && (
 <Badge variant="secondary" className="text-xs">
 AI: {(decision.confidence_score * 100).toFixed(0)}%
 </Badge>
 )}
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Commitments */}
 {afterAction.commitments && afterAction.commitments.length > 0 && (
 <Card className="mb-6">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <ListTodo className="size-5" />
 {t('afterActions.view.commitments')} ({afterAction.commitments.length})
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {afterAction.commitments.map((commitment: any) => (
 <div key={commitment.id} className="rounded-lg border p-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <p className="text-start font-medium">{commitment.description}</p>
 <div className="mt-2 flex flex-wrap gap-2 text-sm">
 <Badge variant="outline">
 <Calendar className="me-1 size-3" />
 {format(new Date(commitment.due_date), 'PP')}
 </Badge>
 <Badge variant={commitment.status === 'completed' ? 'default' : 'secondary'}>
 {t(`afterActions.commitmentStatus.${commitment.status}`)}
 </Badge>
 <Badge variant="outline">
 {t(`afterActions.priority.${commitment.priority}`)}
 </Badge>
 </div>
 </div>
 {commitment.ai_extracted && commitment.confidence_score && (
 <Badge variant="secondary" className="text-xs">
 AI: {(commitment.confidence_score * 100).toFixed(0)}%
 </Badge>
 )}
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Risks */}
 {afterAction.risks && afterAction.risks.length > 0 && (
 <Card className="mb-6">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <AlertTriangle className="size-5" />
 {t('afterActions.view.risks')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {afterAction.risks.map((risk: any) => (
 <div key={risk.id} className="rounded-lg border p-4">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <p className="text-start font-medium">{risk.description}</p>
 {risk.mitigation_strategy && (
 <p className="mt-2 text-start text-sm text-muted-foreground">
 <strong>{t('afterActions.view.mitigation')}:</strong> {risk.mitigation_strategy}
 </p>
 )}
 <div className="mt-2 flex flex-wrap gap-2">
 <Badge variant="destructive">
 {t(`afterActions.severity.${risk.severity}`)}
 </Badge>
 <Badge variant="secondary">
 {t(`afterActions.likelihood.${risk.likelihood}`)}
 </Badge>
 </div>
 </div>
 {risk.ai_extracted && risk.confidence_score && (
 <Badge variant="secondary" className="text-xs">
 AI: {(risk.confidence_score * 100).toFixed(0)}%
 </Badge>
 )}
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Follow-up Actions */}
 {afterAction.follow_up_actions && afterAction.follow_up_actions.length > 0 && (
 <Card className="mb-6">
 <CardHeader>
 <CardTitle>{t('afterActions.view.followUpActions')}</CardTitle>
 </CardHeader>
 <CardContent>
 <ul className="space-y-2">
 {afterAction.follow_up_actions.map((action: any) => (
 <li key={action.id} className="flex items-start gap-2 text-start">
 <span className="text-muted-foreground">•</span>
 <span>{action.description}</span>
 </li>
 ))}
 </ul>
 </CardContent>
 </Card>
 )}

 {/* Linked Tasks */}
 {afterAction.linked_tasks && afterAction.linked_tasks.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <ListTodo className="size-5" />
 {t('afterActions.view.linkedTasks')} ({afterAction.linked_tasks.length})
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {afterAction.linked_tasks.map((task: any) => (
 <div
 key={task.id}
 className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent"
 onClick={() => navigate({ to: `/tasks/${task.id}` })}
 >
 <div className="flex items-center justify-between gap-4">
 <div className="flex-1">
 <p className="text-start font-medium">{task.title}</p>
 <p className="text-start text-sm text-muted-foreground">{task.owner_name}</p>
 </div>
 <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
 {task.status}
 </Badge>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 );
}

export default AfterActionViewPage;
