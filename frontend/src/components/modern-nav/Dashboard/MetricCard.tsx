import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TrendData {
  /** Trend value (percentage) */
  value: number;
  /** Direction: 'up' (positive), 'down' (negative), or 'neutral' */
  direction: 'up' | 'down' | 'neutral';
}

export interface MetricCardProps {
  /** Metric label */
  label: string;
  /** Current value to display */
  value: number;
  /** Trend data (optional) */
  trend?: TrendData;
  /** Link text (e.g., "See Report") */
  linkText?: string;
  /** Link href */
  linkHref?: string;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Custom class name */
  className?: string;
  /** Callback when link is clicked */
  onLinkClick?: () => void;
}

/**
 * MetricCard Component
 *
 * Large metric display with animated counter and trend indicator
 * From reference design showing "340" with "+23%" green arrow
 *
 * Features:
 * - Animated counter (0 → target value)
 * - Trend indicator with arrow
 * - "See Report" link
 * - Responsive sizing
 * - RTL support
 *
 * @example
 * ```tsx
 * <MetricCard
 *   label="Executions"
 *   value={340}
 *   trend={{ value: 23, direction: 'up' }}
 *   linkText="See Report"
 *   linkHref="/reports"
 * />
 * ```
 */
export function MetricCard({
  label,
  value,
  trend,
  linkText,
  linkHref,
  animationDuration = 1500,
  className,
  onLinkClick,
}: MetricCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animated counter effect
  useEffect(() => {
    if (hasAnimated) return;

    const startTime = Date.now();
    const endValue = value;
    const duration = animationDuration;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * endValue);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };

    animate();
  }, [value, animationDuration, hasAnimated]);

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />;
      case 'down':
        return <ArrowDown className="h-4 w-4" />;
      case 'neutral':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-success-indicator';
      case 'down':
        return 'text-warning-indicator';
      case 'neutral':
        return 'text-panel-text-muted';
      default:
        return '';
    }
  };

  return (
    <Card className={cn('metric-card glass-highlight overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-content-text">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Large Metric Value */}
        <div className="flex items-baseline gap-3">
          <span className="metric-value">
            {displayValue.toLocaleString()}
          </span>

          {/* Trend Indicator */}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1',
                'text-sm font-semibold',
                getTrendColor()
              )}
            >
              {getTrendIcon()}
              <span className="tabular-nums">
                {trend.direction === 'up' && '+'}
                {trend.value}%
              </span>
            </div>
          )}
        </div>

        {/* Link */}
        {linkText && (
          <button
            onClick={onLinkClick}
            className={cn(
              'inline-flex items-center gap-2',
              'text-sm font-medium',
              'text-panel-active-text hover:text-icon-rail-active-indicator',
              'transition-colors duration-150',
              'focus-visible:outline-none',
              'focus-visible:ring-2',
              'focus-visible:ring-icon-rail-active-indicator',
              'focus-visible:ring-offset-2',
              'rounded-sm'
            )}
          >
            {linkText}
            <ArrowRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

MetricCard.displayName = 'MetricCard';
