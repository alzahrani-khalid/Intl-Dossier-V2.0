import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Empty state component for displaying guidance when a section has no data.
 * Provides visual feedback and optional action button to add content.
 *
 * @param icon - Lucide icon component to display
 * @param title - Main heading for empty state
 * @param description - Supporting text explaining why section is empty
 * @param actionLabel - Optional button label (if onAction is provided)
 * @param onAction - Optional callback when action button is clicked
 * @param className - Additional CSS classes for container
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Icon */}
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted sm:mb-6 sm:size-20">
        <Icon className="size-8 text-muted-foreground sm:size-10" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-foreground sm:mb-3 sm:text-xl md:text-2xl">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-sm text-muted-foreground sm:mb-8 sm:text-base">
        {description}
      </p>

      {/* Action Button (optional) */}
      {onAction && actionLabel && (
        <Button
          onClick={onAction}
          variant="default"
          size="lg"
          className="min-h-11 min-w-11 px-6 sm:px-8"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
