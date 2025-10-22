import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { Dossier } from '../types/dossier';

interface ConflictDialogProps {
  open: boolean;
  currentData: Partial<Dossier>;
  remoteData: Partial<Dossier>;
  onResolve: (resolution: 'keep-mine' | 'use-theirs' | 'cancel') => void;
}

export function ConflictDialog({
  open,
  currentData,
  remoteData,
  onResolve,
}: ConflictDialogProps) {
  const { t, i18n } = useTranslation('dossiers');
  const isRTL = i18n.language === 'ar';

  // Find conflicting fields
  const getConflictingFields = (): Array<{
    field: string;
    currentValue: any;
    remoteValue: any;
  }> => {
    const conflicts: Array<{ field: string; currentValue: any; remoteValue: any }> = [];
    const allKeys = new Set([...Object.keys(currentData), ...Object.keys(remoteData)]);

    allKeys.forEach((key) => {
      const currentValue = currentData[key as keyof Dossier];
      const remoteValue = remoteData[key as keyof Dossier];

      // Skip system fields
      if (['id', 'created_at', 'updated_at', 'archived'].includes(key)) {
        return;
      }

      // Compare values (handle arrays and objects)
      const isDifferent =
        JSON.stringify(currentValue) !== JSON.stringify(remoteValue) &&
        currentValue !== undefined &&
        remoteValue !== undefined;

      if (isDifferent) {
        conflicts.push({
          field: key,
          currentValue,
          remoteValue,
        });
      }
    });

    return conflicts;
  };

  const conflicts = getConflictingFields();

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return t('none', { ns: 'translation' }) || 'None';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? t('yes', { ns: 'translation' }) || 'Yes' : t('no', { ns: 'translation' }) || 'No';
    }
    return String(value);
  };

  // Get field label
  const getFieldLabel = (field: string): string => {
    return t(`fields.${field}`) || field;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onResolve('cancel')}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            {t('conflict.title')}
          </DialogTitle>
          <DialogDescription>{t('conflict.message')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Version Info */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                {t('conflict.currentVersion')}
              </p>
              <Badge variant="outline">v{currentData.version || 'unknown'}</Badge>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                {t('conflict.remoteVersion')}
              </p>
              <Badge variant="default">v{remoteData.version || 'unknown'}</Badge>
            </div>
          </div>

          {/* Conflicts Table */}
          {conflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">{t('conflict.changes')}</h3>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-start font-medium">{t('conflict.field')}</th>
                      <th className="p-3 text-start font-medium">{t('conflict.yourChange')}</th>
                      <th className="p-3 text-start font-medium">{t('conflict.theirChange')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflicts.map((conflict, index) => (
                      <tr key={conflict.field} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                        <td className="p-3 align-top font-medium">
                          {getFieldLabel(conflict.field)}
                        </td>
                        <td className="p-3 align-top">
                          <div className="rounded border border-blue-200 bg-blue-50 p-2">
                            <pre className="whitespace-pre-wrap text-xs">
                              {formatValue(conflict.currentValue)}
                            </pre>
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="rounded border border-amber-200 bg-amber-50 p-2">
                            <pre className="whitespace-pre-wrap text-xs">
                              {formatValue(conflict.remoteValue)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              {t('conflict.warning', { ns: 'translation' }) ||
                'Choosing "Keep My Changes" will overwrite the remote changes. This action cannot be undone.'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onResolve('cancel')}
            className="w-full sm:w-auto"
          >
            {t('conflict.cancel')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onResolve('use-theirs')}
            className="w-full sm:w-auto"
          >
            {t('conflict.useTheirs')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onResolve('keep-mine')}
            className="w-full sm:w-auto"
          >
            {t('conflict.keepMine')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}