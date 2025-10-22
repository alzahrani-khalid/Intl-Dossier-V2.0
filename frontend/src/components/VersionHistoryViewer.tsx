import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { History, Eye, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import * as diff from 'deep-diff';

interface Version {
  id: string;
  version_number: number;
  content: Record<string, any>;
  change_summary?: string;
  changed_by: {
    id: string;
    name: string;
    email: string;
  };
  changed_at: Date;
}

interface VersionHistoryViewerProps {
  afterActionId: string;
  currentVersion?: number;
  disabled?: boolean;
  className?: string;
}

type DiffKind = 'N' | 'D' | 'E' | 'A';

interface DiffItem {
  kind: DiffKind;
  path: (string | number)[];
  lhs?: any;
  rhs?: any;
  index?: number;
  item?: any;
}

export function VersionHistoryViewer({
  afterActionId,
  currentVersion,
  disabled = false,
  className,
}: VersionHistoryViewerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/after-actions/${afterActionId}/versions`);

      if (!response.ok) {
        throw new Error(t('afterActions.versions.loadFailed'));
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('afterActions.versions.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiff = (version1: number, version2: number) => {
    setSelectedVersions([version1, version2]);
    setShowDiff(true);
  };

  const getDiffChanges = (): DiffItem[] => {
    if (!selectedVersions) return [];

    const [v1, v2] = selectedVersions;
    const version1 = versions.find((v) => v.version_number === v1);
    const version2 = versions.find((v) => v.version_number === v2);

    if (!version1 || !version2) return [];

    return (diff.diff(version1.content, version2.content) || []) as DiffItem[];
  };

  const renderDiffValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getDiffColor = (kind: DiffKind) => {
    switch (kind) {
      case 'N':
        return 'text-green-600 bg-green-50';
      case 'D':
        return 'text-red-600 bg-red-50';
      case 'E':
        return 'text-yellow-600 bg-yellow-50';
      case 'A':
        return 'text-blue-600 bg-blue-50';
      default:
        return '';
    }
  };

  const getDiffLabel = (kind: DiffKind) => {
    switch (kind) {
      case 'N':
        return t('afterActions.versions.added');
      case 'D':
        return t('afterActions.versions.deleted');
      case 'E':
        return t('afterActions.versions.modified');
      case 'A':
        return t('afterActions.versions.arrayChange');
      default:
        return '';
    }
  };

  const formatPath = (path: (string | number)[]): string => {
    return path.join(' � ');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && versions.length === 0) {
      loadVersions();
    }
    if (!isOpen) {
      setShowDiff(false);
      setSelectedVersions(null);
    }
  };

  if (showDiff && selectedVersions) {
    const changes = getDiffChanges();
    const [v1, v2] = selectedVersions;

    return (
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {t('afterActions.versions.diffTitle', { from: v1, to: v2 })}
            </DialogTitle>
            <DialogDescription>
              {t('afterActions.versions.diffDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {changes.length === 0 ? (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  {t('afterActions.versions.noChanges')}
                </AlertDescription>
              </Alert>
            ) : (
              changes.map((change, index) => (
                <Card key={index} className={cn('border-l-4', getDiffColor(change.kind))}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getDiffColor(change.kind)}>
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
                            {t('afterActions.versions.before')}:
                          </p>
                          <pre className="overflow-x-auto rounded bg-red-50 p-2 text-xs">
                            {renderDiffValue(change.lhs)}
                          </pre>
                        </div>
                      )}
                      {change.kind !== 'D' && (
                        <div>
                          <p className="mb-1 font-semibold text-green-600">
                            {t('afterActions.versions.after')}:
                          </p>
                          <pre className="overflow-x-auto rounded bg-green-50 p-2 text-xs">
                            {renderDiffValue(change.rhs)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
            <Button
              variant="outline"
              onClick={() => setShowDiff(false)}
              className="flex-1"
            >
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('gap-2', className)}
        >
          <History className="size-4" />
          {t('afterActions.versions.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5" />
            {t('afterActions.versions.title')}
          </DialogTitle>
          <DialogDescription>
            {t('afterActions.versions.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && versions.length === 0 && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                {t('afterActions.versions.noVersions')}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && versions.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('afterActions.versions.version')}</TableHead>
                    <TableHead>{t('afterActions.versions.changedBy')}</TableHead>
                    <TableHead>{t('afterActions.versions.changedAt')}</TableHead>
                    <TableHead>{t('afterActions.versions.summary')}</TableHead>
                    <TableHead className="text-end">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version, index) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">
                        v{version.version_number}
                        {version.version_number === currentVersion && (
                          <Badge variant="secondary" className="ms-2">
                            {t('afterActions.versions.current')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{version.changed_by.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {version.changed_by.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(version.changed_at), 'PPp')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {version.change_summary || t('afterActions.versions.noSummary')}
                      </TableCell>
                      <TableCell className="text-end">
                        {index < versions.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleViewDiff(
                                versions[index + 1].version_number,
                                version.version_number
                              )
                            }
                          >
                            <Eye className="me-1 size-4" />
                            {t('afterActions.versions.viewDiff')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1"
          >
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
