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
