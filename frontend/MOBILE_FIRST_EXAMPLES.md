# Mobile-First Component Examples
**International Dossier Management System v2.0**

This document provides practical examples of mobile-first components using Kibo UI patterns.

---

## Example 1: Responsive Stat Card

A KPI card that adapts from mobile to desktop:

```typescript
// src/components/kibo-ui/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useResponsive } from '@/hooks/use-responsive'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  className
}: StatCardProps) {
  const { isMobile } = useResponsive()
  const { t } = useTranslation()
  
  const isPositive = trend === 'up'
  
  return (
    <Card className={cn('theme-transition', className)}>
      <CardHeader className={cn(
        'flex flex-row items-center justify-between pb-2',
        'space-y-0',
        isMobile ? 'p-3' : 'p-6'
      )}>
        <CardTitle className={cn(
          'font-medium text-muted-foreground',
          isMobile ? 'text-xs' : 'text-sm'
        )}>
          {title}
        </CardTitle>
        {icon && (
          <div className={cn(
            'text-muted-foreground',
            isMobile ? 'h-4 w-4' : 'h-5 w-5'
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn(isMobile ? 'p-3 pt-0' : 'p-6 pt-0')}>
        <div className="flex items-baseline gap-2">
          <div className={cn(
            'font-bold',
            isMobile ? 'text-xl' : 'text-2xl md:text-3xl'
          )}>
            {value}
          </div>
          {change !== undefined && (
            <Badge
              variant={isPositive ? 'success' : 'destructive'}
              className={cn(
                'flex items-center gap-1',
                isMobile ? 'text-xs px-1.5 py-0.5' : 'text-sm'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        {change !== undefined && (
          <p className={cn(
            'text-muted-foreground mt-1',
            isMobile ? 'text-xs' : 'text-sm'
          )}>
            {isPositive ? t('stats.increase') : t('stats.decrease')} {t('stats.from_last_month')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

**Usage:**

```typescript
import { StatCard } from '@/components/kibo-ui/StatCard'
import { FileText } from 'lucide-react'

<StatCard
  title="Total Dossiers"
  value="2,345"
  change={12}
  trend="up"
  icon={<FileText />}
/>
```

---

## Example 2: Responsive Data Grid

A grid that automatically adjusts columns based on viewport:

```typescript
// src/components/kibo-ui/ResponsiveGrid.tsx
import { useResponsive } from '@/hooks/use-responsive'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: React.ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function ResponsiveGrid({
  children,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4
  },
  gap = 'md',
  className
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }
  
  return (
    <div
      className={cn(
        'grid',
        gapClasses[gap],
        // Mobile first approach
        `grid-cols-${columns.mobile}`,
        `sm:grid-cols-${columns.tablet}`,
        `md:grid-cols-${columns.desktop}`,
        `lg:grid-cols-${columns.wide}`,
        className
      )}
    >
      {children}
    </div>
  )
}
```

**Usage:**

```typescript
import { ResponsiveGrid } from '@/components/kibo-ui/ResponsiveGrid'
import { StatCard } from '@/components/kibo-ui/StatCard'

<ResponsiveGrid
  columns={{
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4
  }}
  gap="lg"
>
  <StatCard title="Dossiers" value="123" />
  <StatCard title="Engagements" value="456" />
  <StatCard title="Positions" value="789" />
</ResponsiveGrid>
```

---

## Example 3: Mobile-Optimized Form

A form that adapts layout and validation for mobile:

```typescript
// src/components/kibo-ui/ResponsiveForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useResponsive } from '@/hooks/use-responsive'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { z } from 'zod'

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'])
})

type FormValues = z.infer<typeof formSchema>

interface ResponsiveFormProps {
  onSubmit: (values: FormValues) => void
  defaultValues?: Partial<FormValues>
}

export function ResponsiveForm({ onSubmit, defaultValues }: ResponsiveFormProps) {
  const { isMobile } = useResponsive()
  const { t } = useTranslation()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      ...defaultValues
    }
  })
  
  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          'space-y-4',
          isMobile && 'space-y-3'
        )}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(isMobile ? 'text-sm' : 'text-base')}>
                {t('forms.title')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t('forms.title_placeholder')}
                  className={cn(
                    'min-h-[44px]',
                    'sm:min-h-[40px]'
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(isMobile ? 'text-sm' : 'text-base')}>
                {t('forms.description')}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t('forms.description_placeholder')}
                  rows={isMobile ? 3 : 5}
                  className={cn(
                    'min-h-[88px]',
                    'sm:min-h-[100px]'
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className={cn(
          'flex gap-2',
          isMobile ? 'flex-col' : 'flex-row justify-end'
        )}>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'min-h-[44px]',
              'sm:min-h-[40px]',
              isMobile && 'w-full'
            )}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            className={cn(
              'min-h-[44px]',
              'sm:min-h-[40px]',
              isMobile && 'w-full'
            )}
          >
            {t('actions.submit')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

## Example 4: Progressive Disclosure List

A list that shows more details on larger screens:

```typescript
// src/components/kibo-ui/DossierListItem.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useResponsive } from '@/hooks/use-responsive'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface DossierListItemProps {
  dossier: {
    id: string
    title: string
    status: string
    country: string
    priority: 'low' | 'medium' | 'high'
    engagementCount: number
    lastUpdated: string
    description?: string
  }
  onClick?: () => void
}

export function DossierListItem({ dossier, onClick }: DossierListItemProps) {
  const { isMobile, isTablet } = useResponsive()
  const { t } = useTranslation()
  
  const priorityColors = {
    low: 'secondary',
    medium: 'warning',
    high: 'destructive'
  } as const
  
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isMobile ? 'p-3' : 'p-4'
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(
        'flex flex-row items-start justify-between p-0 pb-2',
        isMobile && 'pb-1'
      )}>
        <div className="flex-1 space-y-1">
          <CardTitle className={cn(
            'font-semibold',
            isMobile ? 'text-sm' : 'text-base md:text-lg'
          )}>
            {dossier.title}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={priorityColors[dossier.priority]}
              className={cn(isMobile ? 'text-xs px-1.5 py-0.5' : 'text-sm')}
            >
              {t(`priority.${dossier.priority}`)}
            </Badge>
            <Badge variant="outline" className={cn(isMobile && 'text-xs')}>
              {dossier.status}
            </Badge>
            {!isMobile && (
              <span className="text-xs text-muted-foreground">
                {dossier.country}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={cn(
          'text-muted-foreground flex-shrink-0',
          isMobile ? 'h-4 w-4' : 'h-5 w-5'
        )} />
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Mobile: Show minimal info */}
        {isMobile && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>{dossier.engagementCount} {t('dossiers.engagements')}</span>
            <span>{new Date(dossier.lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
        
        {/* Tablet: Show more info */}
        {isTablet && !isMobile && dossier.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {dossier.description}
          </p>
        )}
        
        {/* Desktop: Show full details */}
        {!isMobile && !isTablet && (
          <div className="mt-3 space-y-2">
            {dossier.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {dossier.description}
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {dossier.engagementCount} {t('dossiers.engagements')}
                </span>
                <span className="text-muted-foreground">
                  {dossier.country}
                </span>
              </div>
              <span className="text-muted-foreground">
                {t('common.last_updated')}: {new Date(dossier.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Example 5: Responsive Navigation Bar

Navigation that transforms from hamburger menu to full navbar:

```typescript
// src/components/kibo-ui/ResponsiveNav.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useResponsive } from '@/hooks/use-responsive'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Menu, X, Home, FileText, Users, Settings } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'nav.home', href: '/' },
  { icon: FileText, label: 'nav.dossiers', href: '/dossiers' },
  { icon: Users, label: 'nav.entities', href: '/entities' },
  { icon: Settings, label: 'nav.settings', href: '/settings' }
]

export function ResponsiveNav() {
  const { isMobile, isTablet } = useResponsive()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  
  // Mobile: Hamburger menu with Sheet
  if (isMobile || isTablet) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            aria-label={t('nav.open_menu')}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <nav className="flex flex-col gap-2 mt-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    'justify-start min-h-[44px] text-base',
                    'hover:bg-accent'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5 me-3" />
                  {t(item.label)}
                </Button>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    )
  }
  
  // Desktop: Horizontal nav bar
  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              'flex items-center gap-2',
              'hover:bg-accent'
            )}
          >
            <Icon className="h-4 w-4" />
            {t(item.label)}
          </Button>
        )
      })}
    </nav>
  )
}
```

---

## Example 6: Responsive Dialog

A dialog that adapts its size and position for mobile:

```typescript
// src/components/kibo-ui/ResponsiveDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useResponsive } from '@/hooks/use-responsive'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md'
}: ResponsiveDialogProps) {
  const { isMobile } = useResponsive()
  const { t } = useTranslation()
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }
  
  // Mobile: Use Sheet (bottom drawer)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
          {footer && (
            <div className="pt-4 border-t">
              {footer}
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }
  
  // Desktop: Use Dialog (center modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:' + sizeClasses[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Usage:**

```typescript
import { ResponsiveDialog } from '@/components/kibo-ui/ResponsiveDialog'
import { Button } from '@/components/ui/button'

const [open, setOpen] = useState(false)

<ResponsiveDialog
  open={open}
  onOpenChange={setOpen}
  title="Create New Dossier"
  description="Enter the details for the new dossier"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Create
      </Button>
    </>
  }
>
  <ResponsiveForm onSubmit={handleSubmit} />
</ResponsiveDialog>
```

---

## Testing These Components

### Manual Testing Checklist

For each example component:

- [ ] Test on mobile (320px, 375px, 414px widths)
- [ ] Test on tablet (768px, 834px widths)
- [ ] Test on desktop (1024px, 1280px, 1440px widths)
- [ ] Test in portrait and landscape
- [ ] Test in English (LTR)
- [ ] Test in Arabic (RTL)
- [ ] Verify touch targets (44x44px minimum)
- [ ] Test keyboard navigation
- [ ] Test with screen reader (if critical)
- [ ] Verify smooth animations
- [ ] Check performance on slow devices

### Automated Testing Example

```typescript
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/kibo-ui/StatCard'
import { useResponsive } from '@/hooks/use-responsive'

// Mock the responsive hook
jest.mock('@/hooks/use-responsive')

describe('StatCard', () => {
  it('renders with mobile layout', () => {
    (useResponsive as jest.Mock).mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    })
    
    render(<StatCard title="Test" value="100" />)
    
    const card = screen.getByText('Test')
    expect(card).toHaveClass('text-xs') // Mobile text size
  })
  
  it('renders with desktop layout', () => {
    (useResponsive as jest.Mock).mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    })
    
    render(<StatCard title="Test" value="100" />)
    
    const card = screen.getByText('Test')
    expect(card).toHaveClass('text-sm') // Desktop text size
  })
})
```

---

**Last Updated**: 2025-01-22  
**Examples**: 6  
**Pattern**: Mobile-First + Progressive Enhancement
