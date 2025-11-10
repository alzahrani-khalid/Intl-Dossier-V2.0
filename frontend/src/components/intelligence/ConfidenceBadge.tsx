import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info, ShieldCheck } from 'lucide-react';

interface ConfidenceBadgeProps {
  level: 'low' | 'medium' | 'high' | 'verified';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const confidenceConfig = {
  low: {
    icon: Info,
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
  medium: {
    icon: AlertCircle,
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-600',
  },
  high: {
    icon: CheckCircle2,
    bgColor: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-300 dark:border-green-600',
  },
  verified: {
    icon: ShieldCheck,
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-600',
  },
} as const;

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
} as const;

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
} as const;

export function ConfidenceBadge({
  level,
  showIcon = true,
  size = 'sm',
}: ConfidenceBadgeProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  const config = confidenceConfig[level];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${sizeClasses[size]}
        font-medium
        inline-flex
        items-center
        gap-1
        ${isRTL ? 'flex-row-reverse' : 'flex-row'}
      `}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{t(`intelligence.confidence.${level}`, level)}</span>
    </Badge>
  );
}
