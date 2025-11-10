import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import * as diff from 'deep-diff';

interface EditRequest {
 id: string;
 after_action_id: string;
 requested_by: {
 id: string;
 name: string;
 email: string;
 };
 requested_at: Date;
 reason: string;
 proposed_changes: Record<string, any>;
 current_content: Record<string, any>;
}

interface EditApprovalFlowProps {
 editRequest: EditRequest;
 onApprove: (approvalNotes?: string) => Promise<void>;
 onReject: (rejectionReason: string) => Promise<void>;
 disabled?: boolean;
 className?: string;
}

type DiffKind = 'N' | 'D' | 'E' | 'A';

interface DiffItem {
 kind: DiffKind;
 path: (string | number)[];
 lhs?: any;
 rhs?: any;
}

export function EditApprovalFlow({
 editRequest,
 onApprove,
 onReject,
 disabled = false,
 className,
}: EditApprovalFlowProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [action, setAction] = useState<'approve' | 'reject' | null>(null);
 const [approvalNotes, setApprovalNotes] = useState('');
 const [rejectionReason, setRejectionReason] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [showDiff, setShowDiff] = useState(true);

 const changes = (diff.diff(
 editRequest.current_content,
 editRequest.proposed_changes
 ) || []) as DiffItem[];

 const handleApprove = async () => {
 setLoading(true);
 setError(null);

 try {
 await onApprove(approvalNotes || undefined);
 } catch (err) {
 setError(err instanceof Error ? err.message : t('afterActions.editFlow.approveFailed'));
 } finally {
 setLoading(false);
 }
 };

 const handleReject = async () => {
 if (rejectionReason.length < 10) {
 setError(t('afterActions.editFlow.rejectionReasonTooShort'));
 return;
 }

 if (rejectionReason.length > 500) {
 setError(t('afterActions.editFlow.rejectionReasonTooLong'));
 return;
 }

 setLoading(true);
 setError(null);

 try {
 await onReject(rejectionReason);
 } catch (err) {
 setError(err instanceof Error ? err.message : t('afterActions.editFlow.rejectFailed'));
 } finally {
 setLoading(false);
 }
 };

 const renderDiffValue = (value: any): string => {
 if (value === null || value === undefined) return 'null';
 if (typeof value === 'object') return JSON.stringify(value, null, 2);
 return String(value);
 };

 const getDiffColor = (kind: DiffKind) => {
 switch (kind) {
 case 'N':
 return 'border-green-500 bg-green-50';
 case 'D':
 return 'border-red-500 bg-red-50';
 case 'E':
 return 'border-yellow-500 bg-yellow-50';
 case 'A':
 return 'border-blue-500 bg-blue-50';
 default:
 return '';
 }
 };

 const getDiffLabel = (kind: DiffKind) => {
 switch (kind) {
 case 'N':
 return t('afterActions.editFlow.added');
 case 'D':
 return t('afterActions.editFlow.deleted');
 case 'E':
 return t('afterActions.editFlow.modified');
 case 'A':
 return t('afterActions.editFlow.arrayChange');
 default:
 return '';
 }
 };

 const getDiffBadgeVariant = (kind: DiffKind) => {
 switch (kind) {
 case 'N':
 return 'default';
 case 'D':
 return 'destructive';
 case 'E':
 return 'secondary';
 case 'A':
 return 'outline';
 default:
 return 'outline';
 }
 };

 const formatPath = (path: (string | number)[]): string => {
 return path.join(' � ');
 };

 return (
 <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Edit Request Info */}
 <Card>
 <CardHeader>
 <CardTitle>{t('afterActions.editFlow.title')}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <div>
 <Label>{t('afterActions.editFlow.requestedBy')}</Label>
 <div className="mt-1">
 <p className="font-medium">{editRequest.requested_by.name}</p>
 <p className="text-sm text-muted-foreground">{editRequest.requested_by.email}</p>
 </div>
 </div>

 <div>
 <Label>{t('afterActions.editFlow.requestedAt')}</Label>
 <p className="mt-1">{format(new Date(editRequest.requested_at), 'PPp')}</p>
 </div>

 <div>
 <Label>{t('afterActions.editFlow.reason')}</Label>
 <Card className="mt-1 border-l-4 border-l-blue-500">
 <CardContent className="pt-4">
 <p className="text-sm">{editRequest.reason}</p>
 </CardContent>
 </Card>
 </div>
 </CardContent>
 </Card>

 {/* Changes Diff */}
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>{t('afterActions.editFlow.proposedChanges')}</CardTitle>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setShowDiff(!showDiff)}
 >
 <Eye className="me-2 size-4" />
 {showDiff ? t('common.hide') : t('common.show')}
 </Button>
 </div>
 </CardHeader>
 {showDiff && (
 <CardContent className="space-y-3">
 {changes.length === 0 ? (
 <Alert>
 <AlertCircle className="size-4" />
 <AlertDescription>
 {t('afterActions.editFlow.noChanges')}
 </AlertDescription>
 </Alert>
 ) : (
 changes.map((change, index) => (
 <Card key={index} className={cn('border-l-4', getDiffColor(change.kind))}>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <Badge variant={getDiffBadgeVariant(change.kind)}>
 {getDiffLabel(change.kind)}
 </Badge>
 <code className="text-xs text-muted-foreground">
 {formatPath(change.path)}
 </code>
 </div>
 </CardHeader>
 <CardContent className="text-sm">
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {change.kind !== 'N' && (
 <div>
 <p className="mb-1 font-semibold text-red-600">
 {t('afterActions.editFlow.currentVersion')}:
 </p>
 <pre className="overflow-x-auto rounded border border-red-200 bg-red-50 p-2 text-xs">
 {renderDiffValue(change.lhs)}
 </pre>
 </div>
 )}
 {change.kind !== 'D' && (
 <div>
 <p className="mb-1 font-semibold text-green-600">
 {t('afterActions.editFlow.proposedVersion')}:
 </p>
 <pre className="overflow-x-auto rounded border border-green-200 bg-green-50 p-2 text-xs">
 {renderDiffValue(change.rhs)}
 </pre>
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 ))
 )}
 </CardContent>
 )}
 </Card>

 {/* Error Display */}
 {error && (
 <Alert variant="destructive">
 <AlertCircle className="size-4" />
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 )}

 {/* Action Selection */}
 {!action && (
 <Card>
 <CardContent className="pt-6">
 <div className={cn('flex gap-4', isRTL && 'flex-row-reverse')}>
 <Button
 onClick={() => setAction('approve')}
 disabled={disabled || loading}
 className="flex-1"
 variant="default"
 >
 <CheckCircle className="me-2 size-4" />
 {t('afterActions.editFlow.approve')}
 </Button>
 <Button
 onClick={() => setAction('reject')}
 disabled={disabled || loading}
 className="flex-1"
 variant="destructive"
 >
 <XCircle className="me-2 size-4" />
 {t('afterActions.editFlow.reject')}
 </Button>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Approval Form */}
 {action === 'approve' && (
 <Card className="border-green-500">
 <CardHeader>
 <CardTitle className="text-green-700">
 {t('afterActions.editFlow.approveTitle')}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="approval-notes">
 {t('afterActions.editFlow.approvalNotes')} ({t('common.optional')})
 </Label>
 <Textarea
 id="approval-notes"
 value={approvalNotes}
 onChange={(e) => setApprovalNotes(e.target.value)}
 placeholder={t('afterActions.editFlow.approvalNotesPlaceholder')}
 rows={3}
 disabled={loading}
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 </div>

 <Alert>
 <AlertCircle className="size-4" />
 <AlertDescription>
 {t('afterActions.editFlow.approvalWarning')}
 </AlertDescription>
 </Alert>

 <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
 <Button
 onClick={handleApprove}
 disabled={loading}
 className="flex-1"
 >
 {loading ? (
 <>
 <Loader2 className="me-2 size-4 animate-spin" />
 {t('afterActions.editFlow.approving')}
 </>
 ) : (
 <>
 <CheckCircle className="me-2 size-4" />
 {t('afterActions.editFlow.confirmApprove')}
 </>
 )}
 </Button>
 <Button
 variant="outline"
 onClick={() => setAction(null)}
 disabled={loading}
 >
 {t('common.cancel')}
 </Button>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Rejection Form */}
 {action === 'reject' && (
 <Card className="border-red-500">
 <CardHeader>
 <CardTitle className="text-red-700">
 {t('afterActions.editFlow.rejectTitle')}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="rejection-reason">
 {t('afterActions.editFlow.rejectionReason')} *
 </Label>
 <Textarea
 id="rejection-reason"
 value={rejectionReason}
 onChange={(e) => setRejectionReason(e.target.value)}
 placeholder={t('afterActions.editFlow.rejectionReasonPlaceholder')}
 rows={4}
 maxLength={500}
 required
 disabled={loading}
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 <p className="text-xs text-muted-foreground">
 {rejectionReason.length} / 500 ({t('afterActions.editFlow.minChars', { count: 10 })})
 </p>
 </div>

 <Alert variant="destructive">
 <AlertCircle className="size-4" />
 <AlertDescription>
 {t('afterActions.editFlow.rejectionWarning')}
 </AlertDescription>
 </Alert>

 <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
 <Button
 onClick={handleReject}
 disabled={loading || rejectionReason.length < 10}
 variant="destructive"
 className="flex-1"
 >
 {loading ? (
 <>
 <Loader2 className="me-2 size-4 animate-spin" />
 {t('afterActions.editFlow.rejecting')}
 </>
 ) : (
 <>
 <XCircle className="me-2 size-4" />
 {t('afterActions.editFlow.confirmReject')}
 </>
 )}
 </Button>
 <Button
 variant="outline"
 onClick={() => setAction(null)}
 disabled={loading}
 >
 {t('common.cancel')}
 </Button>
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 );
}
