import { createFileRoute, Link } from '@tanstack/react-router';
import { useAfterAction } from '@/hooks/useAfterAction';
import { usePublishAfterAction } from '@/hooks/usePublishAfterAction';
import { useRequestEdit } from '@/hooks/useEditWorkflow';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PDFGeneratorButton } from '@/components/PDFGeneratorButton';
import { EditApprovalFlow } from '@/components/EditApprovalFlow';
import {
 Calendar,
 FileText,
 Users,
 ArrowLeft,
 CheckCircle,
 AlertCircle,
 Lock,
 Edit,
 History
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/_protected/after-actions/$afterActionId')({
 component: AfterActionDetailPage,
});

function AfterActionDetailPage() {
 const { afterActionId } = Route.useParams();
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const locale = isRTL ? ar : enUS;
 const { user } = useAuth();

 const { data: afterAction, isLoading, error } = useAfterAction(afterActionId);
 const publishMutation = usePublishAfterAction();
 const requestEditMutation = useRequestEdit();

 if (isLoading) {
 return (
 <div className="container mx-auto p-6 space-y-6">
 <Skeleton className="h-8 w-64" />
 <Skeleton className="h-screen w-full" />
 </div>
 );
 }

 if (error) {
 return (
 <div className="container mx-auto p-6">
 <Card className="border-destructive">
 <CardHeader>
 <CardTitle className="text-destructive">{t('common.error')}</CardTitle>
 <CardDescription>{t('afterActions.loadError')}</CardDescription>
 </CardHeader>
 </Card>
 </div>
 );
 }

 if (!afterAction) {
 return (
 <div className="container mx-auto p-6">
 <Card>
 <CardHeader>
 <CardTitle>{t('afterActions.notFound')}</CardTitle>
 <CardDescription>{t('afterActions.notFoundDescription')}</CardDescription>
 </CardHeader>
 </Card>
 </div>
 );
 }

 const canPublish = ['supervisor', 'admin'].includes(user?.role || '');
 const canEdit = afterAction.publication_status === 'draft' ||
 (afterAction.publication_status === 'published' &&
 (user?.id === afterAction.created_by || canPublish));

 const isReadOnly = afterAction.publication_status === 'published';
 const isEditRequested = afterAction.publication_status === 'edit_requested';

 const handlePublish = async () => {
 try {
 await publishMutation.mutateAsync({
 afterActionId,
 isConfidential: afterAction.is_confidential,
 });
 toast.success(t('afterActions.publishSuccess'));
 } catch (error: any) {
 toast.error(error.message || t('afterActions.publishFailed'));
 }
 };

 const handleRequestEdit = async () => {
 // This will open a modal in practice
 toast.info(t('afterActions.editRequestFeature'));
 };

 const statusMap: Record<string, { label: string; variant: any }> = {
 draft: { label: t('afterActions.status.draft'), variant: 'secondary' },
 published: { label: t('afterActions.status.published'), variant: 'default' },
 edit_requested: { label: t('afterActions.status.editRequested'), variant: 'warning' },
 };

 const statusConfig = statusMap[afterAction.publication_status] || {
 label: afterAction.publication_status,
 variant: 'secondary'
 };

 return (
 <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="icon" asChild>
 <Link
 to="/dossiers/$dossierId"
 params={{ dossierId: afterAction.dossier_id }}
 >
 <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
 </Link>
 </Button>
 <div>
 <h1 className="text-3xl font-bold">{t('afterActions.detail')}</h1>
 <p className="text-muted-foreground">
 {format(new Date(afterAction.created_at), 'PPP', { locale })}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={statusConfig.variant as any}>
 {statusConfig.label}
 </Badge>
 {afterAction.is_confidential && (
 <Badge variant="destructive">
 <Lock className="h-3 w-3 me-1" />
 {t('afterActions.confidential')}
 </Badge>
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 justify-end flex-wrap">
 {afterAction.publication_status === 'draft' && canPublish && (
 <Button
 onClick={handlePublish}
 disabled={publishMutation.isPending}
 >
 <CheckCircle className="h-4 w-4 me-2" />
 {t('afterActions.publish')}
 </Button>
 )}

 {isReadOnly && canEdit && (
 <Button
 variant="outline"
 onClick={handleRequestEdit}
 disabled={requestEditMutation.isPending}
 >
 <Edit className="h-4 w-4 me-2" />
 {t('afterActions.requestEdit')}
 </Button>
 )}

 <Button variant="outline" asChild>
 <Link
 to="/after-actions/$afterActionId/versions"
 params={{ afterActionId }}
 >
 <History className="h-4 w-4 me-2" />
 {t('afterActions.versionHistory')}
 </Link>
 </Button>

 <PDFGeneratorButton
 afterActionId={afterActionId}
 isConfidential={afterAction.is_confidential}
 />
 </div>

 {/* Edit Approval Flow (for supervisors) */}
 {isEditRequested && canPublish && (
 <EditApprovalFlow afterActionId={afterActionId} />
 )}

 {/* Main Content */}
 <div className="grid gap-6">
 {/* Attendees */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Users className="h-5 w-5" />
 {t('afterActions.attendees')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-2">
 {afterAction.attendees && afterAction.attendees.length > 0 ? (
 afterAction.attendees.map((attendee, index) => (
 <Badge key={index} variant="outline">
 {attendee}
 </Badge>
 ))
 ) : (
 <p className="text-sm text-muted-foreground">
 {t('afterActions.noAttendees')}
 </p>
 )}
 </div>
 </CardContent>
 </Card>

 {/* Decisions */}
 {afterAction.decisions && afterAction.decisions.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle>{t('afterActions.decisions')}</CardTitle>
 <CardDescription>
 {t('afterActions.decisionsCount', { count: afterAction.decisions.length })}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {afterAction.decisions.map((decision, index) => (
 <div key={decision.id} className="space-y-2">
 {index > 0 && <Separator />}
 <div className="pt-2">
 <p className="font-medium">{decision.description}</p>
 {decision.rationale && (
 <p className="text-sm text-muted-foreground mt-1">
 {t('afterActions.rationale')}: {decision.rationale}
 </p>
 )}
 <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
 <span>{t('afterActions.decisionMaker')}: {decision.decision_maker}</span>
 <span>
 {format(new Date(decision.decision_date), 'PP', { locale })}
 </span>
 </div>
 </div>
 </div>
 ))}
 </CardContent>
 </Card>
 )}

 {/* Commitments */}
 {afterAction.commitments && afterAction.commitments.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle>{t('afterActions.commitments')}</CardTitle>
 <CardDescription>
 {t('afterActions.commitmentsCount', { count: afterAction.commitments.length })}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {afterAction.commitments.map((commitment, index) => (
 <div key={commitment.id} className="space-y-2">
 {index > 0 && <Separator />}
 <div className="pt-2">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1">
 <p className="font-medium">{commitment.description}</p>
 <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
 <span>
 {t('afterActions.owner')}: {
 commitment.owner_type === 'internal'
 ? commitment.owner_user_id
 : commitment.owner_contact_id
 }
 </span>
 <span>
 {t('afterActions.dueDate')}: {format(new Date(commitment.due_date), 'PP', { locale })}
 </span>
 <Badge variant="outline">{commitment.priority}</Badge>
 <Badge>{commitment.status}</Badge>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </CardContent>
 </Card>
 )}

 {/* Risks */}
 {afterAction.risks && afterAction.risks.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <AlertCircle className="h-5 w-5" />
 {t('afterActions.risks')}
 </CardTitle>
 <CardDescription>
 {t('afterActions.risksCount', { count: afterAction.risks.length })}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {afterAction.risks.map((risk, index) => (
 <div key={risk.id} className="space-y-2">
 {index > 0 && <Separator />}
 <div className="pt-2">
 <p className="font-medium">{risk.description}</p>
 <div className="flex items-center gap-2 mt-2 flex-wrap">
 <Badge variant={risk.severity === 'critical' || risk.severity === 'high' ? 'destructive' : 'outline'}>
 {t('afterActions.severity')}: {risk.severity}
 </Badge>
 <Badge variant="outline">
 {t('afterActions.likelihood')}: {risk.likelihood}
 </Badge>
 </div>
 {risk.mitigation_strategy && (
 <p className="text-sm text-muted-foreground mt-2">
 {t('afterActions.mitigation')}: {risk.mitigation_strategy}
 </p>
 )}
 </div>
 </div>
 ))}
 </CardContent>
 </Card>
 )}

 {/* Follow-up Actions */}
 {afterAction.follow_up_actions && afterAction.follow_up_actions.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle>{t('afterActions.followUps')}</CardTitle>
 <CardDescription>
 {t('afterActions.followUpsCount', { count: afterAction.follow_up_actions.length })}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {afterAction.follow_up_actions.map((action, index) => (
 <div key={action.id} className="space-y-2">
 {index > 0 && <Separator />}
 <div className="pt-2">
 <div className="flex items-start gap-2">
 {action.completed ? (
 <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
 ) : (
 <div className="h-5 w-5 rounded-full border-2 border-muted-foreground mt-0.5" />
 )}
 <div className="flex-1">
 <p className={action.completed ? 'line-through text-muted-foreground' : ''}>
 {action.description}
 </p>
 {action.assigned_to || action.target_date ? (
 <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
 {action.assigned_to && <span>{action.assigned_to}</span>}
 {action.target_date && (
 <span>{format(new Date(action.target_date), 'PP', { locale })}</span>
 )}
 </div>
 ) : null}
 </div>
 </div>
 </div>
 </div>
 ))}
 </CardContent>
 </Card>
 )}

 {/* Notes */}
 {afterAction.notes && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 {t('afterActions.notes')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm whitespace-pre-wrap">{afterAction.notes}</p>
 </CardContent>
 </Card>
 )}

 {/* Metadata */}
 <Card>
 <CardHeader>
 <CardTitle>{t('afterActions.metadata')}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-2 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">{t('afterActions.createdAt')}</span>
 <span>{format(new Date(afterAction.created_at), 'PPp', { locale })}</span>
 </div>
 {afterAction.updated_at && (
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">{t('afterActions.updatedAt')}</span>
 <span>{format(new Date(afterAction.updated_at), 'PPp', { locale })}</span>
 </div>
 )}
 {afterAction.published_at && (
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">{t('afterActions.publishedAt')}</span>
 <span>{format(new Date(afterAction.published_at), 'PPp', { locale })}</span>
 </div>
 )}
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">{t('afterActions.version')}</span>
 <span>v{afterAction.version}</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
