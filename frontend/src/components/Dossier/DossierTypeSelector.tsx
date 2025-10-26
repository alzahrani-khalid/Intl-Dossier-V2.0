/**
 * DossierTypeSelector Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T054)
 *
 * Mobile-first, RTL-compatible type selection component for creating dossiers.
 * Displays all 7 dossier types as selectable cards with icons and descriptions.
 *
 * Features:
 * - Responsive grid (1 col mobile → 2 cols tablet → 3 cols desktop)
 * - RTL support via logical properties
 * - Touch-friendly card buttons (min 44x44px height)
 * - Keyboard accessible
 * - Visual feedback for selection state
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  Check,
} from 'lucide-react';
import type { DossierType } from '@/services/dossier-api';

interface DossierTypeSelectorProps {
  value?: DossierType;
  onChange: (type: DossierType) => void;
  className?: string;
  disabled?: boolean;
}

interface DossierTypeOption {
  type: DossierType;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  descriptionKey: string;
}

const dossierTypeOptions: DossierTypeOption[] = [
  {
    type: 'country',
    icon: Globe,
    colorClass: 'text-blue-600 dark:text-blue-400',
    descriptionKey: 'typeDescription.country',
  },
  {
    type: 'organization',
    icon: Building2,
    colorClass: 'text-purple-600 dark:text-purple-400',
    descriptionKey: 'typeDescription.organization',
  },
  {
    type: 'forum',
    icon: Users,
    colorClass: 'text-green-600 dark:text-green-400',
    descriptionKey: 'typeDescription.forum',
  },
  {
    type: 'engagement',
    icon: Calendar,
    colorClass: 'text-orange-600 dark:text-orange-400',
    descriptionKey: 'typeDescription.engagement',
  },
  {
    type: 'theme',
    icon: Target,
    colorClass: 'text-pink-600 dark:text-pink-400',
    descriptionKey: 'typeDescription.theme',
  },
  {
    type: 'working_group',
    icon: Briefcase,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    descriptionKey: 'typeDescription.working_group',
  },
  {
    type: 'person',
    icon: User,
    colorClass: 'text-teal-600 dark:text-teal-400',
    descriptionKey: 'typeDescription.person',
  },
];

export function DossierTypeSelector({
  value,
  onChange,
  className,
  disabled = false,
}: DossierTypeSelectorProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {dossierTypeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.type;

        return (
          <Card
            key={option.type}
            className={cn(
              'relative cursor-pointer transition-all',
              'hover:shadow-md hover:border-primary',
              'min-h-[120px] sm:min-h-[140px]',
              isSelected && 'border-primary ring-2 ring-primary ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !disabled && onChange(option.type)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onChange(option.type);
              }
            }}
            aria-pressed={isSelected}
            aria-disabled={disabled}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div
                className={cn(
                  'absolute top-2 end-2 bg-primary text-primary-foreground rounded-full p-1',
                  'animate-in zoom-in duration-200'
                )}
              >
                <Check className="h-4 w-4" />
              </div>
            )}

            <CardHeader className="flex flex-col items-center gap-2 p-4 sm:p-6">
              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center',
                  'h-12 w-12 sm:h-14 sm:w-14',
                  'rounded-lg bg-muted',
                  isSelected && 'bg-primary/10'
                )}
              >
                <Icon className={cn('h-6 w-6 sm:h-7 sm:w-7', option.colorClass)} />
              </div>

              {/* Type name */}
              <CardTitle className="text-base sm:text-lg text-center">
                {t(`type.${option.type}`)}
              </CardTitle>
            </CardHeader>

            {/* Description */}
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <CardDescription className="text-xs sm:text-sm text-center line-clamp-3">
                {t(option.descriptionKey)}
              </CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Compact variant for inline use (e.g., filters)
 */
export function DossierTypeSelectorCompact({
  value,
  onChange,
  className,
  disabled = false,
  showAllOption = false,
}: DossierTypeSelectorProps & { showAllOption?: boolean }) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="radiogroup"
    >
      {showAllOption && (
        <button
          onClick={() => onChange(undefined as any)}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-md',
            'text-sm font-medium transition-colors',
            'min-h-11 min-w-11',
            'border border-input bg-background hover:bg-accent',
            value === undefined && 'bg-primary text-primary-foreground hover:bg-primary/90',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          role="radio"
          aria-checked={value === undefined}
        >
          {t('filter.all')}
        </button>
      )}

      {dossierTypeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.type;

        return (
          <button
            key={option.type}
            onClick={() => onChange(option.type)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-md',
              'text-sm font-medium transition-colors',
              'min-h-11 min-w-11',
              'border border-input bg-background hover:bg-accent',
              isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            role="radio"
            aria-checked={isSelected}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t(`type.${option.type}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
