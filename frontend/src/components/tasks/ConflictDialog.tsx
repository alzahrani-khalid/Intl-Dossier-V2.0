import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Save, X } from 'lucide-react';
import type { Task } from '@/types/database.types';

interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localChanges: Partial<Task>;
  serverData?: Task;
  onReload: () => void;
  onForceOverwrite: () => void;
  onCancel: () => void;
}

/**
 * Dialog for handling optimistic locking conflicts
 * Shown when user tries to save changes but the task was modified by another user
 *
 * Features:
 * - Shows what fields were changed locally vs server
 * - Three options: Reload, Force Save, Cancel
 * - Mobile-first responsive layout (stacked buttons on mobile)
 * - RTL compatible
 *
 * @example
 * <ConflictDialog
 *   open={hasConflict}
 *   onOpenChange={setHasConflict}
 *   localChanges={myChanges}
 *   serverData={latestServerData}
 *   onReload={() => refetch()}
 *   onForceOverwrite={() => saveWithForce()}
 *   onCancel={() => resetForm()}
 * />
 */
export function ConflictDialog({
  open,
  onOpenChange,
  localChanges,
  serverData,
  onReload,
  onForceOverwrite,
  onCancel,
}: ConflictDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Get list of conflicting fields
  const conflictingFields = Object.keys(localChanges).filter(
    (key) =>
      serverData &&
      localChanges[key as keyof Task] !== serverData[key as keyof Task]
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="w-full max-w-full sm:max-w-[540px] md:max-w-[640px]"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <div className="flex flex-col gap-1 text-start">
              <AlertDialogTitle className="text-xl sm:text-2xl">
                {t('tasks.conflictTitle', 'Task was modified by another user')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-start">
                {t(
                  'tasks.conflictDescription',
                  'Someone else made changes while you were editing. Choose how to proceed:'
                )}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Conflict details */}
        {conflictingFields.length > 0 && serverData && (
          <div className="my-4 rounded-lg border bg-muted/50 p-4">
            <h4 className="text-sm font-semibold mb-3 text-start">
              {t('tasks.conflictingFields', 'Conflicting fields:')}
            </h4>
            <div className="flex flex-col gap-2">
              {conflictingFields.map((field) => (
                <div
                  key={field}
                  className="flex flex-col gap-1 rounded-md bg-background p-3"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase text-start">
                    {t(`tasks.field.${field}`, field)}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground text-start block">
                        {t('tasks.yourChange', 'Your change:')}
                      </span>
                      <span className="text-sm font-medium text-start block truncate">
                        {formatFieldValue(localChanges[field as keyof Task])}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground text-start block">
                        {t('tasks.theirChange', 'Their change:')}
                      </span>
                      <span className="text-sm font-medium text-start block truncate">
                        {formatFieldValue(serverData[field as keyof Task])}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action descriptions */}
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-3 rounded-md border p-3">
            <RefreshCw className="size-5 mt-0.5 shrink-0 text-primary" />
            <div className="flex flex-col gap-1 text-start">
              <span className="font-medium">
                {t('tasks.reloadOption', 'Reload (Recommended)')}
              </span>
              <span className="text-muted-foreground text-xs">
                {t(
                  'tasks.reloadOptionDescription',
                  'Discard your changes and load the latest version. You can then re-apply your changes.'
                )}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Save className="size-5 mt-0.5 shrink-0 text-warning" />
            <div className="flex flex-col gap-1 text-start">
              <span className="font-medium">
                {t('tasks.forceSaveOption', 'Force Save')}
              </span>
              <span className="text-muted-foreground text-xs">
                {t(
                  'tasks.forceSaveOptionDescription',
                  "Overwrite their changes with yours. Use with caution - you'll lose their updates."
                )}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <X className="size-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-1 text-start">
              <span className="font-medium">{t('tasks.cancelOption', 'Cancel')}</span>
              <span className="text-muted-foreground text-xs">
                {t(
                  'tasks.cancelOptionDescription',
                  'Stay on this page and manually review the conflicts before deciding.'
                )}
              </span>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Mobile: stacked buttons, Desktop: horizontal */}
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            className="h-11 w-full sm:w-auto order-3 sm:order-1"
          >
            <X className="me-2 size-4" />
            {t('common.cancel', 'Cancel')}
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              onForceOverwrite();
              onOpenChange(false);
            }}
            className="h-11 w-full sm:w-auto order-2"
          >
            <Save className="me-2 size-4" />
            {t('tasks.forceSave', 'Force Save')}
          </Button>

          <AlertDialogAction
            onClick={() => {
              onReload();
              onOpenChange(false);
            }}
            className="h-11 w-full sm:w-auto order-1 sm:order-3"
          >
            <RefreshCw className="me-2 size-4" />
            {t('tasks.reload', 'Reload')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Format field value for display
 */
function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
