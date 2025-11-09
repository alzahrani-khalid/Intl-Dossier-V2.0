import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
 useAccessReviewDetail,
 useCertifyUserAccess,
 useCompleteAccessReview,
 useAccessReviewSummary,
} from '@/hooks/use-access-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, Clock, Shield } from 'lucide-react';

type Finding = {
 user_id: string;
 email: string;
 full_name: string;
 role: string;
 issues: string[];
 recommendations: string[];
 certified_by?: string;
 certified_at?: string;
};

/**
 * AccessReviewPage Component
 *
 * Detailed view for conducting access reviews:
 * - Displays all findings with user details
 * - Allows certification or access change requests
 * - Filter findings by type (inactive, excessive permissions, etc.)
 * - Complete review workflow
 *
 * Mobile-responsive with RTL support
 */
export function AccessReviewPage() {
 const { reviewId } = useParams({ strict: false });
 const navigate = useNavigate();
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [findingTypeFilter, setFindingTypeFilter] = useState<string>('all');
 const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
 const [certifyDialogOpen, setCertifyDialogOpen] = useState(false);
 const [changeRequestReason, setChangeRequestReason] = useState('');
 const [recommendedAction, setRecommendedAction] = useState<string>('');

 const { data: reviewDetail, isLoading } = useAccessReviewDetail(reviewId || null, findingTypeFilter === 'all' ? undefined : findingTypeFilter);
 const summary = useAccessReviewSummary(reviewId || null);
 const { mutate: certifyAccess, isPending: isCertifying } = useCertifyUserAccess();
 const { mutate: completeReview, isPending: isCompleting } = useCompleteAccessReview();

 const handleCertifyUser = (approved: boolean) => {
 if (!selectedUserId || !reviewId) return;

 certifyAccess(
 {
 review_id: reviewId,
 user_id: selectedUserId,
 approved,
 change_request_reason: approved ? undefined : changeRequestReason,
 recommended_action: approved ? undefined : recommendedAction,
 },
 {
 onSuccess: () => {
 setCertifyDialogOpen(false);
 setSelectedUserId(null);
 setChangeRequestReason('');
 setRecommendedAction('');
 },
 }
 );
 };

 const handleCompleteReview = () => {
 if (!reviewId) return;

 completeReview(
 { review_id: reviewId },
 {
 onSuccess: () => {
 navigate({ to: '/users/access-reviews' });
 },
 }
 );
 };

 const getIssueBadgeVariant = (issue: string): 'destructive' | 'warning' | 'secondary' => {
 if (issue.includes('inactive')) return 'destructive';
 if (issue.includes('excessive')) return 'warning';
 return 'secondary';
 };

 if (isLoading) {
 return (
 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
 <div className="text-center py-12 text-muted-foreground">
 {t('common.loading')}
 </div>
 </div>
 );
 }

 return (
 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Header */}
 <div className="flex flex-col gap-4 mb-6">
 <Button
 variant="ghost"
 onClick={() => navigate({ to: '/users/access-reviews' })}
 className={`w-fit ${isRTL ? 'flex-row-reverse' : ''}`}
 >
 <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
 {t('common.back')}
 </Button>

 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-start">
 {reviewDetail?.review_name}
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground text-start mt-1">
 {t('user_management.review_scope')}: {t(`user_management.scope_${reviewDetail?.review_scope}`)}
 </p>
 </div>

 {reviewDetail?.status === 'in_progress' && (
 <Button
 onClick={handleCompleteReview}
 disabled={isCompleting || summary.certifiedUsers < summary.totalFindings}
 className="w-full sm:w-auto "
 >
 <CheckCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('user_management.complete_review')}
 </Button>
 )}
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
 <Card>
 <CardHeader className="pb-2 sm:pb-3">
 <CardTitle className="text-xs sm:text-sm font-medium">
 {t('user_management.total_findings')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-xl sm:text-2xl font-bold">{summary.totalFindings}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2 sm:pb-3">
 <CardTitle className="text-xs sm:text-sm font-medium">
 {t('user_management.certified')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-xl sm:text-2xl font-bold text-green-600">
 {summary.certifiedUsers}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2 sm:pb-3">
 <CardTitle className="text-xs sm:text-sm font-medium">
 {t('user_management.inactive')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-xl sm:text-2xl font-bold text-orange-600">
 {summary.inactiveUsers}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2 sm:pb-3">
 <CardTitle className="text-xs sm:text-sm font-medium">
 {t('user_management.excessive')}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="text-xl sm:text-2xl font-bold text-red-600">
 {summary.excessivePermissions}
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Filter */}
 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
 <div className="w-full sm:w-64">
 <Label htmlFor="finding-filter" className="text-start block mb-2">
 {t('user_management.filter_by_finding')}
 </Label>
 <Select value={findingTypeFilter} onValueChange={setFindingTypeFilter}>
 <SelectTrigger id="finding-filter" className="">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{t('user_management.all_findings')}</SelectItem>
 <SelectItem value="inactive_90_days">{t('user_management.inactive_users')}</SelectItem>
 <SelectItem value="excessive_permissions">{t('user_management.excessive_permissions')}</SelectItem>
 <SelectItem value="guest_expiring_soon">{t('user_management.expiring_guests')}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* Findings Table - Desktop */}
 <div className="hidden md:block">
 <Card>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className="text-start">{t('user_management.user')}</TableHead>
 <TableHead className="text-start">{t('user_management.role')}</TableHead>
 <TableHead className="text-start">{t('user_management.issues')}</TableHead>
 <TableHead className="text-start">{t('user_management.recommendations')}</TableHead>
 <TableHead className="text-start">{t('user_management.status')}</TableHead>
 <TableHead className="text-end">{t('common.actions')}</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {reviewDetail?.findings?.map((finding: Finding) => (
 <TableRow key={finding.user_id}>
 <TableCell>
 <div className="flex flex-col">
 <span className="font-medium">{finding.full_name}</span>
 <span className="text-sm text-muted-foreground">{finding.email}</span>
 </div>
 </TableCell>
 <TableCell>
 <Badge variant="outline">{finding.role}</Badge>
 </TableCell>
 <TableCell>
 <div className="flex flex-wrap gap-1">
 {finding.issues?.map((issue) => (
 <Badge key={issue} variant={getIssueBadgeVariant(issue)} className="text-xs">
 {t(`user_management.issue_${issue}`)}
 </Badge>
 ))}
 </div>
 </TableCell>
 <TableCell>
 <div className="flex flex-wrap gap-1">
 {finding.recommendations?.map((rec) => (
 <span key={rec} className="text-sm text-muted-foreground">
 {t(`user_management.rec_${rec}`)}
 </span>
 ))}
 </div>
 </TableCell>
 <TableCell>
 {finding.certified_by ? (
 <Badge variant="secondary" className="gap-1">
 <CheckCircle className="h-3 w-3" />
 {t('user_management.certified')}
 </Badge>
 ) : (
 <Badge variant="outline" className="gap-1">
 <Clock className="h-3 w-3" />
 {t('user_management.pending')}
 </Badge>
 )}
 </TableCell>
 <TableCell className="text-end">
 {!finding.certified_by && (
 <Button
 size="sm"
 onClick={() => {
 setSelectedUserId(finding.user_id);
 setCertifyDialogOpen(true);
 }}
 >
 {t('user_management.certify')}
 </Button>
 )}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </Card>
 </div>

 {/* Findings Cards - Mobile */}
 <div className="md:hidden space-y-4">
 {reviewDetail?.findings?.map((finding: Finding) => (
 <Card key={finding.user_id}>
 <CardHeader className="pb-3">
 <div className="flex flex-row items-start justify-between">
 <div className="flex-1">
 <CardTitle className="text-base">{finding.full_name}</CardTitle>
 <CardDescription className="text-sm">{finding.email}</CardDescription>
 </div>
 <Badge variant="outline" className="ms-2">{finding.role}</Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-3">
 {/* Issues */}
 <div>
 <Label className="text-xs text-muted-foreground">{t('user_management.issues')}</Label>
 <div className="flex flex-wrap gap-1 mt-1">
 {finding.issues?.map((issue) => (
 <Badge key={issue} variant={getIssueBadgeVariant(issue)} className="text-xs">
 {t(`user_management.issue_${issue}`)}
 </Badge>
 ))}
 </div>
 </div>

 {/* Recommendations */}
 <div>
 <Label className="text-xs text-muted-foreground">{t('user_management.recommendations')}</Label>
 <div className="mt-1 text-sm">
 {finding.recommendations?.map((rec) => (
 <div key={rec}>• {t(`user_management.rec_${rec}`)}</div>
 ))}
 </div>
 </div>

 {/* Status & Actions */}
 <div className="flex flex-row items-center justify-between pt-2 border-t">
 {finding.certified_by ? (
 <Badge variant="secondary" className="gap-1">
 <CheckCircle className="h-3 w-3" />
 {t('user_management.certified')}
 </Badge>
 ) : (
 <Badge variant="outline" className="gap-1">
 <Clock className="h-3 w-3" />
 {t('user_management.pending')}
 </Badge>
 )}
 {!finding.certified_by && (
 <Button
 size="sm"
 className="min-h-9"
 onClick={() => {
 setSelectedUserId(finding.user_id);
 setCertifyDialogOpen(true);
 }}
 >
 {t('user_management.certify')}
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {/* Certification Dialog */}
 <Dialog open={certifyDialogOpen} onOpenChange={setCertifyDialogOpen}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <DialogTitle className="text-start">{t('user_management.certify_user_access')}</DialogTitle>
 <DialogDescription className="text-start">
 {t('user_management.certify_description')}
 </DialogDescription>
 </DialogHeader>

 <Tabs defaultValue="approve" className="w-full">
 <TabsList className="grid w-full grid-cols-2">
 <TabsTrigger value="approve">{t('user_management.approve_access')}</TabsTrigger>
 <TabsTrigger value="request_change">{t('user_management.request_change')}</TabsTrigger>
 </TabsList>

 <TabsContent value="approve" className="mt-4">
 <p className="text-sm text-muted-foreground mb-4">
 {t('user_management.approve_access_description')}
 </p>
 <Button
 onClick={() => handleCertifyUser(true)}
 disabled={isCertifying}
 className="w-full "
 >
 <CheckCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('user_management.confirm_approval')}
 </Button>
 </TabsContent>

 <TabsContent value="request_change" className="mt-4 space-y-4">
 <div className="space-y-2">
 <Label htmlFor="recommended-action">{t('user_management.recommended_action')}</Label>
 <Select value={recommendedAction} onValueChange={setRecommendedAction}>
 <SelectTrigger id="recommended-action" className="">
 <SelectValue placeholder={t('user_management.select_action')} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="deactivate">{t('user_management.deactivate_user')}</SelectItem>
 <SelectItem value="reduce_role">{t('user_management.reduce_role')}</SelectItem>
 <SelectItem value="revoke_delegations">{t('user_management.revoke_delegations')}</SelectItem>
 <SelectItem value="other">{t('common.other')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="change-reason">{t('user_management.reason')}</Label>
 <Textarea
 id="change-reason"
 value={changeRequestReason}
 onChange={(e) => setChangeRequestReason(e.target.value)}
 placeholder={t('user_management.reason_placeholder')}
 rows={3}
 className="resize-none"
 />
 </div>

 <Button
 onClick={() => handleCertifyUser(false)}
 disabled={!recommendedAction || !changeRequestReason || isCertifying}
 variant="destructive"
 className="w-full "
 >
 <XCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('user_management.submit_change_request')}
 </Button>
 </TabsContent>
 </Tabs>
 </DialogContent>
 </Dialog>
 </div>
 );
}
