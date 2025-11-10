import React, { useState } from 'react';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '../ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { useResponsive } from '../../hooks/use-responsive';
import { useDirection } from '../../hooks/use-theme';
import { cn } from '../../lib/utils';
import { Menu, X } from 'lucide-react';

export interface NavItem {
 id: string;
 label: string;
 href?: string;
 onClick?: () => void;
 icon?: React.ReactNode;
 badge?: string | number;
 children?: NavItem[];
 priority?: 'high' | 'medium' | 'low';
 hideOnMobile?: boolean;
}

export interface ResponsiveNavProps {
 items: NavItem[];
 logo?: React.ReactNode;
 actions?: React.ReactNode;
 className?: string;
 mobileBreakpoint?: 'sm' | 'md' | 'lg';
 position?: 'top' | 'bottom';
}

export function ResponsiveNav({
 items,
 logo,
 actions,
 className,
 mobileBreakpoint = 'md',
 position = 'top',
}: ResponsiveNavProps) {
 const { viewport, isMobile, isTablet } = useResponsive();
 const { isRTL } = useDirection();
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 
 const showMobileNav = (mobileBreakpoint === 'sm' && isMobile) ||
 (mobileBreakpoint === 'md' && (isMobile || isTablet)) ||
 (mobileBreakpoint === 'lg' && viewport !== 'wide');
 
 const visibleItems = items.filter(item => 
 !item.hideOnMobile || !isMobile
 );
 
 const highPriorityItems = visibleItems.filter(item => item.priority === 'high');
 const regularItems = visibleItems.filter(item => item.priority !== 'high');
 
 if (showMobileNav) {
 return (
 <nav className={cn(
 'flex items-center justify-between p-4',
 position === 'bottom' && 'fixed bottom-0 left-0 right-0 bg-background border-t',
 position === 'top' && 'sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
 className
 )}>
 {logo && <div className="flex-shrink-0">{logo}</div>}
 
 <div className="flex items-center gap-2">
 {highPriorityItems.slice(0, 2).map(item => (
 <Button
 key={item.id}
 variant="ghost"
 size="sm"
 onClick={item.onClick}
 className="gap-2"
 >
 {item.icon}
 <span className="hidden xs:inline">{item.label}</span>
 {item.badge && (
 <span className="ms-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
 {item.badge}
 </span>
 )}
 </Button>
 ))}
 
 <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
 <SheetTrigger asChild>
 <Button variant="ghost" size="icon" aria-label="Menu">
 <Menu className="h-5 w-5" />
 </Button>
 </SheetTrigger>
 <SheetContent side={isRTL ? 'left' : 'right'} className="w-[280px]">
 <SheetHeader>
 <SheetTitle>Navigation</SheetTitle>
 </SheetHeader>
 <nav className="mt-6 space-y-1">
 {visibleItems.map(item => (
 <MobileNavItem
 key={item.id}
 item={item}
 onItemClick={() => setMobileMenuOpen(false)}
 />
 ))}
 </nav>
 {actions && (
 <div className="mt-6 pt-6 border-t">
 {actions}
 </div>
 )}
 </SheetContent>
 </Sheet>
 </div>
 </nav>
 );
 }
 
 return (
 <nav className={cn(
 'flex items-center justify-between px-6 py-3',
 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
 className
 )}>
 {logo && <div className="flex-shrink-0">{logo}</div>}
 
 <NavigationMenu>
 <NavigationMenuList>
 {visibleItems.map(item => (
 <NavigationMenuItem key={item.id}>
 <NavigationMenuLink
 className={cn(
 'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2',
 'text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
 'focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
 item.priority === 'high' && 'font-semibold'
 )}
 href={item.href}
 onClick={item.onClick}
 >
 {item.icon && <span className="me-2">{item.icon}</span>}
 {item.label}
 {item.badge && (
 <span className="ms-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
 {item.badge}
 </span>
 )}
 </NavigationMenuLink>
 </NavigationMenuItem>
 ))}
 </NavigationMenuList>
 </NavigationMenu>
 
 {actions && <div className="flex items-center gap-2">{actions}</div>}
 </nav>
 );
}

interface MobileNavItemProps {
 item: NavItem;
 depth?: number;
 onItemClick?: () => void;
}

function MobileNavItem({ item, depth = 0, onItemClick }: MobileNavItemProps) {
 const [expanded, setExpanded] = useState(false);
 const hasChildren = item.children && item.children.length > 0;
 
 return (
 <div>
 <button
 className={cn(
 'w-full flex items-center justify-between px-3 py-2 rounded-md',
 'text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
 item.priority === 'high' && 'font-semibold',
 depth > 0 && 'ms-4'
 )}
 onClick={() => {
 if (hasChildren) {
 setExpanded(!expanded);
 } else {
 item.onClick?.();
 onItemClick?.();
 }
 }}
 >
 <div className="flex items-center gap-2">
 {item.icon}
 <span>{item.label}</span>
 {item.badge && (
 <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
 {item.badge}
 </span>
 )}
 </div>
 {hasChildren && (
 <span className={cn(
 'transition-transform duration-200',
 expanded && 'rotate-180'
 )}>
 ▼
 </span>
 )}
 </button>
 
 {hasChildren && expanded && (
 <div className="mt-1 space-y-1">
 {item.children!.map(child => (
 <MobileNavItem
 key={child.id}
 item={child}
 depth={depth + 1}
 onItemClick={onItemClick}
 />
 ))}
 </div>
 )}
 </div>
 );
}