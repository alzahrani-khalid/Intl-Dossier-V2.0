import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface IconButtonProps {
 /** Lucide icon component */
 icon: LucideIcon;
 /** Unique identifier for the button */
 id: string;
 /** Tooltip text to display on hover */
 tooltip: string;
 /** Whether this button is currently active */
 active?: boolean;
 /** Click handler */
 onClick?: () => void;
 /** Additional CSS classes */
 className?: string;
 /** Badge count to display (optional) */
 badge?: number;
}

/**
 * IconButton Component
 *
 * A modern icon button for the navigation rail with:
 * - Hover states
 * - Active indicator (vertical green bar)
 * - Tooltip support
 * - RTL support
 * - Touch-friendly (44x44px min target)
 * - Optional badge
 *
 * Based on Material Design 3 Navigation Rail pattern
 */
export function IconButton({
 icon: Icon,
 id,
 tooltip,
 active = false,
 onClick,
 className,
 badge,
}: IconButtonProps) {
 const { i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 return (
 <TooltipProvider delayDuration={200}>
 <Tooltip>
 <TooltipTrigger asChild>
 <button
 id={id}
 onClick={onClick}
 aria-label={tooltip}
 aria-current={active ? 'page' : undefined}
 className={cn(
 // Use icon-button utility class from modern-nav-tokens.css
 'icon-button',

 // Base styles
 'relative flex items-center justify-center',
 'rounded-lg',

 // Active state class (defined in CSS with proper ::before pseudo-element)
 active && 'active',

 // Focus visible for keyboard navigation
 'focus-visible:outline-none',
 'focus-visible:ring-2',
 'focus-visible:ring-[var(--icon-rail-active-indicator)]',
 'focus-visible:ring-offset-2',
 'focus-visible:ring-offset-[var(--icon-rail-bg)]',

 // Custom classes
 className
 )}
 >
 {/* Icon */}
 <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />

 {/* Optional Badge */}
 {badge !== undefined && badge > 0 && (
 <span
 className={cn(
 'absolute -top-1 flex items-center justify-center',
 'h-4 min-w-4 px-1',
 'bg-[var(--icon-rail-active-indicator)] text-white',
 'text-[10px] font-semibold leading-none',
 'rounded-full',
 // Position based on text direction
 isRTL ? '-start-1' : '-end-1'
 )}
 aria-label={`${badge} notifications`}
 >
 {badge > 99 ? '99+' : badge}
 </span>
 )}
 </button>
 </TooltipTrigger>

 <TooltipContent
 side={isRTL ? 'left' : 'right'}
 sideOffset={8}
 className="bg-gray-900 text-white border-gray-800"
 >
 <p className="text-sm font-medium">{tooltip}</p>
 </TooltipContent>
 </Tooltip>
 </TooltipProvider>
 );
}

IconButton.displayName = 'IconButton';
