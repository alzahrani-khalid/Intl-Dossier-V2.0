import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useResponsive } from '../../hooks/use-responsive';
import { useDirection } from '../../hooks/use-theme';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface ResponsiveCardProps {
 title?: React.ReactNode;
 description?: React.ReactNode;
 children: React.ReactNode;
 footer?: React.ReactNode;
 className?: string;
 collapsible?: boolean;
 defaultCollapsed?: boolean;
 priority?: 'high' | 'medium' | 'low';
 showOnMobile?: boolean;
 mobileLayout?: 'stack' | 'inline';
}

export function ResponsiveCard({
 title,
 description,
 children,
 footer,
 className,
 collapsible = false,
 defaultCollapsed = false,
 priority = 'medium',
 showOnMobile = true,
 mobileLayout = 'stack',
}: ResponsiveCardProps) {
 const { viewport, isMobile, isTablet } = useResponsive();
 const { isRTL } = useDirection();
 const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
 
 const shouldEnableCollapse = collapsible && (isMobile || isTablet);
 const isCurrentlyCollapsed = shouldEnableCollapse && isCollapsed;
 
 if (isMobile && !showOnMobile) {
 return null;
 }
 
 const priorityClasses = {
 high: 'border-primary',
 medium: '',
 low: 'opacity-90',
 };
 
 const responsivePadding = {
 mobile: 'p-3',
 tablet: 'p-4',
 desktop: 'p-6',
 wide: 'p-8',
 };
 
 return (
 <Card
 className={cn(
 'transition-all duration-200',
 'border-[0.5px]',
 responsivePadding[viewport],
 priorityClasses[priority],
 isMobile && mobileLayout === 'stack' && 'space-y-2',
 className
 )}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {(title || description) && (
 <CardHeader 
 className={cn(
 'space-y-1.5',
 isMobile && 'p-3',
 shouldEnableCollapse && 'cursor-pointer select-none'
 )}
 onClick={shouldEnableCollapse ? () => setIsCollapsed(!isCollapsed) : undefined}
 >
 <div className="flex items-center justify-between">
 {title && (
 <CardTitle className={cn(
 'text-base sm:text-lg md:text-xl',
 isMobile && 'text-sm'
 )}>
 {title}
 </CardTitle>
 )}
 {shouldEnableCollapse && (
 <button
 className="p-1 hover:bg-accent rounded-md transition-colors"
 aria-expanded={!isCollapsed}
 aria-label={isCollapsed ? 'Expand' : 'Collapse'}
 >
 {isCollapsed ? (
 <ChevronDown className="h-4 w-4" />
 ) : (
 <ChevronUp className="h-4 w-4" />
 )}
 </button>
 )}
 </div>
 {description && !isCurrentlyCollapsed && (
 <CardDescription className={cn(
 'text-xs sm:text-sm',
 isMobile && 'text-xs'
 )}>
 {description}
 </CardDescription>
 )}
 </CardHeader>
 )}
 
 {!isCurrentlyCollapsed && (
 <CardContent className={cn(
 'space-y-2',
 isMobile && 'p-3',
 isMobile && mobileLayout === 'inline' && 'flex flex-wrap gap-2'
 )}>
 {children}
 </CardContent>
 )}
 
 {footer && !isCurrentlyCollapsed && (
 <CardFooter className={cn(
 'pt-4',
 isMobile && 'p-3 pt-2'
 )}>
 {footer}
 </CardFooter>
 )}
 </Card>
 );
}

export interface ResponsiveCardGridProps {
 children: React.ReactNode;
 columns?: {
 mobile?: number;
 tablet?: number;
 desktop?: number;
 wide?: number;
 };
 gap?: 'sm' | 'md' | 'lg';
 className?: string;
}

export function ResponsiveCardGrid({
 children,
 columns = {
 mobile: 1,
 tablet: 2,
 desktop: 3,
 wide: 4,
 },
 gap = 'md',
 className,
}: ResponsiveCardGridProps) {
 const { viewport } = useResponsive();
 
 const columnCount = columns[viewport] || 1;
 
 const gapClasses = {
 sm: 'gap-2',
 md: 'gap-4',
 lg: 'gap-6',
 };
 
 return (
 <div
 className={cn(
 'grid',
 gapClasses[gap],
 className
 )}
 style={{
 gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
 }}
 >
 {children}
 </div>
 );
}