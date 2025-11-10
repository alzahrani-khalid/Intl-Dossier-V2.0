import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface BulkActionToolbarProps {
 selectedCount: number;
 onSendReminders: () => void;
 onClearSelection: () => void;
 isProcessing?: boolean;
}

/**
 * BulkActionToolbar - Displays bulk action controls when items are selected
 *
 * Features:
 * - Shows selection count
 * - "Send Reminders" button for bulk operations
 * - "Clear Selection" button
 * - Mobile-first responsive design
 * - RTL support via logical properties
 * - Touch-friendly controls (44x44px minimum)
 *
 * @param selectedCount - Number of items currently selected
 * @param onSendReminders - Callback when "Send Reminders" is clicked
 * @param onClearSelection - Callback when "Clear Selection" is clicked
 * @param isProcessing - Whether bulk operation is in progress
 */
export function BulkActionToolbar({
 selectedCount,
 onSendReminders,
 onClearSelection,
 isProcessing = false,
}: BulkActionToolbarProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 if (selectedCount === 0) {
 return null;
 }

 return (
 <div
 className="sticky top-0 z-10 flex flex-col gap-2 p-4 bg-blue-50 border-b border-blue-200 dark:bg-blue-950 dark:border-blue-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
 dir={isRTL ? 'rtl' : 'ltr'}
 role="toolbar"
 aria-label={t('waitingQueue.bulkActions.toolbar')}
 >
 {/* Selection Count */}
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-blue-900 dark:text-blue-100 sm:text-base">
 {t('waitingQueue.bulkActions.selectedCount', { count: selectedCount })}
 </span>
 <span className="text-xs text-blue-700 dark:text-blue-300 sm:text-sm">
 {t('waitingQueue.bulkActions.maxItems', { max: 100 })}
 </span>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-2 sm:gap-3">
 <Button
 onClick={onSendReminders}
 disabled={isProcessing}
 className="flex-1 h-11 px-4 text-sm sm:flex-initial sm:px-6 sm:text-base"
 aria-label={t('waitingQueue.bulkActions.sendReminders')}
 >
 {isProcessing
 ? t('waitingQueue.bulkActions.sending')
 : t('waitingQueue.bulkActions.sendReminders')}
 </Button>

 <Button
 onClick={onClearSelection}
 variant="outline"
 disabled={isProcessing}
 className="h-11 px-3 sm:px-4"
 aria-label={t('waitingQueue.bulkActions.clearSelection')}
 >
 <X className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
 <span className="hidden sm:inline ms-2">
 {t('waitingQueue.bulkActions.clear')}
 </span>
 </Button>
 </div>

 {/* Warning for max items */}
 {selectedCount >= 100 && (
 <div className="text-xs text-orange-600 dark:text-orange-400 sm:text-sm">
 {t('waitingQueue.bulkActions.maxReached')}
 </div>
 )}
 </div>
 );
}
