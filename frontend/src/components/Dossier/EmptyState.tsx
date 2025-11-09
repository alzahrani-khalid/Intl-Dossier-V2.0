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
      className={`flex flex-col items-center justify-center py-12 px-4 sm:py-16 sm:px-6 text-center ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Icon */}
      <div className="mb-4 sm:mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2 sm:mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6 sm:mb-8">
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
