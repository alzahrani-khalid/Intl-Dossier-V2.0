# International Dossier Management System - Design System
**Powered by Kibo UI** — A shadcn/ui-based component system adapted for GASTAT

## Overview
This project uses **Kibo UI** as its foundational design system, customized for GASTAT's International Dossier Management System. Kibo UI provides production-ready, accessible components built on Radix UI primitives and styled with Tailwind CSS.

**Critical Requirements:**
- ✅ Full RTL/LTR support (Arabic + English)
- ✅ GASTAT brand compliance (green primary, blue secondary)
- ✅ Mobile-first responsive design
- ✅ Progressive enhancement
- ✅ WCAG AA accessibility standards
- ✅ Offline-first mobile compatibility

---

## 🎯 Progressive & Mobile-First Design

### Core Principle
**Every component must be designed for mobile first, then progressively enhanced for larger screens.**

This is not optional - it's a fundamental requirement of the project.

---

### Mobile-First Methodology

#### 1. The Progressive Design Hook

Your project provides a powerful `useResponsive()` hook that MUST be used:

```typescript
import { useResponsive } from '@/hooks/use-responsive'

function MyComponent() {
  const {
    // Viewport dimensions
    width,              // Current width in px
    height,             // Current height in px
    orientation,        // 'portrait' | 'landscape'
    
    // Breakpoint info
    alias,              // 'xs' | 'sm' | 'md' | 'lg'
    deviceType,         // 'mobile' | 'tablet' | 'desktop' | 'wide'
    
    // Boolean helpers
    isMobile,           // true if mobile (xs)
    isTablet,           // true if tablet (sm)
    isDesktop,          // true if desktop (md)
    isWide,             // true if wide (lg)
    
    // Comparison helpers
    up,                 // up('sm') -> width >= 768px
    down,               // down('md') -> width < 1024px
    between,            // between('sm', 'md') -> 768px <= width < 1024px
    
    // Modern features
    containerQueries    // Recommend container queries at this size
  } = useResponsive()
  
  // Use these values to adapt your component
}
```

#### 2. Responsive Component Patterns

**Pattern A: Responsive Card (Recommended)**

```typescript
import { ResponsiveCard } from '@/components/responsive/responsive-card'

<ResponsiveCard
  title="Dossier Details"
  description="View and manage dossier information"
  collapsible={true}           // Auto-collapse on mobile
  showOnMobile={true}           // Control visibility
  mobileLayout="stack"          // 'stack' or 'inline'
  priority="high"               // Visual priority
>
  {content}
</ResponsiveCard>
```

**Pattern B: Responsive Grid**

```typescript
import { ResponsiveCardGrid } from '@/components/responsive/responsive-card'

<ResponsiveCardGrid
  columns={{
    mobile: 1,      // Stack on mobile
    tablet: 2,      // Two columns on tablet
    desktop: 3,     // Three columns on desktop
    wide: 4         // Four columns on wide screens
  }}
  gap="md"
>
  {cards.map(card => <Card key={card.id} {...card} />)}
</ResponsiveCardGrid>
```

**Pattern C: Viewport-Specific Rendering**

```typescript
function Dashboard() {
  const { isMobile, isTablet, deviceType } = useResponsive()
  
  // Different UI per device type
  if (isMobile) {
    return <MobileDashboard />    // Single column, essential info
  }
  
  if (isTablet) {
    return <TabletDashboard />    // Two columns, more info
  }
  
  return <DesktopDashboard />     // Full grid, all info
}
```

**Pattern D: Progressive Disclosure**

```typescript
function DossierCard({ dossier }) {
  const { isMobile, isTablet } = useResponsive()
  
  return (
    <Card>
      {/* Always show essential info */}
      <CardHeader>
        <CardTitle>{dossier.title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Mobile: Only critical info */}
        <p className="text-sm">{dossier.summary}</p>
        
        {/* Tablet+: Add metadata */}
        {!isMobile && (
          <div className="mt-2 text-xs text-muted-foreground">
            Created {dossier.created_at}
          </div>
        )}
        
        {/* Desktop+: Full details */}
        {!isMobile && !isTablet && (
          <div className="mt-4 space-y-2">
            <DetailedMetrics {...dossier} />
            <RelatedEntities {...dossier} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 3. Mobile-First Tailwind Classes

**ALWAYS write CSS classes mobile-first:**

```tsx
// ✅ CORRECT: Base styles for mobile, then enhance
<div className={cn(
  // Base (mobile): 320px-640px
  'p-3 text-sm flex flex-col gap-2',
  
  // sm: (tablet): 640px-768px
  'sm:p-4 sm:text-base sm:flex-row sm:gap-4',
  
  // md: (desktop): 768px-1024px
  'md:p-6 md:text-lg md:gap-6',
  
  // lg: (wide): 1024px+
  'lg:p-8 lg:text-xl lg:gap-8'
)}>

// ❌ WRONG: Desktop-first (don't do this)
<div className="p-8 md:p-6 sm:p-4 p-3">
```

**Common Mobile-First Patterns:**

```tsx
// Responsive grid
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

// Responsive spacing
className="space-y-2 sm:space-y-4 md:space-y-6"

// Responsive text
className="text-sm sm:text-base md:text-lg lg:text-xl"

// Show/hide based on screen size
className="block sm:hidden"  // Show only on mobile
className="hidden sm:block"  // Hide on mobile
```

#### 4. Container Queries (Modern Approach)

Your project supports CSS Container Queries for component-level responsiveness:

```typescript
import { ResponsiveWrapper } from '@/components/responsive/responsive-wrapper'

<ResponsiveWrapper enableContainer={true}>
  {/* Component responds to its container size, not viewport */}
  <div className="@container">
    <div className={cn(
      'p-2',
      '@sm:p-4',      // Container breakpoint
      '@md:p-6',      // Not viewport breakpoint
      '@lg:p-8'
    )}>
      Intrinsically responsive!
    </div>
  </div>
</ResponsiveWrapper>
```

#### 5. Performance Optimization for Mobile

**Lazy Load Heavy Components:**

```typescript
import { lazy, Suspense } from 'react'
import { useResponsive } from '@/hooks/use-responsive'

const HeavyDesktopComponent = lazy(() => import('./HeavyDesktopComponent'))

function MyPage() {
  const { isMobile } = useResponsive()
  
  return (
    <div>
      {/* Mobile: Lightweight version */}
      {isMobile && <LightweightMobileView />}
      
      {/* Desktop: Full featured */}
      {!isMobile && (
        <Suspense fallback={<Skeleton />}>
          <HeavyDesktopComponent />
        </Suspense>
      )}
    </div>
  )
}
```

**Optimize Data Fetching:**

```typescript
function useMobileOptimizedQuery() {
  const { isMobile } = useResponsive()
  
  return useQuery({
    queryKey: ['data', isMobile ? 'mobile' : 'desktop'],
    queryFn: async () => {
      // Fetch less data on mobile
      const limit = isMobile ? 20 : 100
      const fields = isMobile 
        ? 'id, title, status'                    // Minimal
        : 'id, title, status, *, relations(*)'   // Full
      
      return fetchData({ limit, fields })
    },
    // Cache longer on mobile to save battery
    staleTime: isMobile ? 5 * 60 * 1000 : 2 * 60 * 1000
  })
}
```

#### 6. Touch-Friendly Design

**Minimum Touch Target Size: 44x44px (WCAG AA)**

```tsx
// Mobile-optimized button
<Button className={cn(
  'min-h-[44px] min-w-[44px]',    // Mobile touch target
  'sm:min-h-[40px] sm:min-w-[40px]'  // Desktop can be smaller
)}>
  Click me
</Button>

// Mobile-friendly spacing between interactive elements
<div className="space-y-3 sm:space-y-2">  {/* More space on mobile */}
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
</div>
```

#### 7. Testing Checklist

**Before committing any component:**

- [ ] Test on mobile (320px width minimum)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1024px)
- [ ] Test on wide screen (1440px+)
- [ ] Test in portrait and landscape orientations
- [ ] Test with English (LTR) text
- [ ] Test with Arabic (RTL) text
- [ ] Verify touch targets are 44x44px minimum
- [ ] Check that text is readable at all sizes
- [ ] Verify images load appropriately for screen size
- [ ] Test with slow network (throttled)

---

### Breakpoint Reference

```typescript
// Your project's breakpoints
xs: 320px   → 'mobile'   (alias: 'xs', deviceType: 'mobile')
sm: 768px   → 'tablet'   (alias: 'sm', deviceType: 'tablet')
md: 1024px  → 'desktop'  (alias: 'md', deviceType: 'desktop')
lg: 1440px  → 'wide'     (alias: 'lg', deviceType: 'wide')
```

**Tailwind breakpoint prefixes:**
- No prefix = base (mobile)
- `sm:` = 640px+ (tablet)
- `md:` = 768px+ (desktop)
- `lg:` = 1024px+ (large desktop)
- `xl:` = 1280px+ (extra large)
- `2xl:` = 1536px+ (ultra wide)

---

### Quick Reference Card

```typescript
// MOBILE-FIRST COMPONENT TEMPLATE
import { useResponsive } from '@/hooks/use-responsive'
import { ResponsiveCard } from '@/components/responsive/responsive-card'
import { useDirection } from '@/hooks/use-theme'

function MyComponent() {
  const { isMobile, isTablet, deviceType } = useResponsive()
  const { isRTL } = useDirection()
  
  return (
    <ResponsiveCard
      title="My Component"
      collapsible={isMobile}
      mobileLayout="stack"
    >
      <div className={cn(
        // Base (mobile)
        'p-3 text-sm flex flex-col gap-2',
        // Tablet
        'sm:p-4 sm:text-base sm:flex-row',
        // Desktop
        'md:p-6 md:text-lg'
      )}>
        {/* Progressive content */}
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>
    </ResponsiveCard>
  )
}
```

---

## Design Tokens

### GASTAT Theme Colors (CSS Variables)

#### Light Mode (Default)
```css
/* Core brand colors */
--primary: 139.6552 52.7273% 43.1373%;        /* GASTAT Green #3C8956 */
--primary-foreground: 0 0% 100%;              /* White */
--secondary: 218.5401 79.1908% 66.0784%;      /* GASTAT Blue */
--secondary-foreground: 0 0% 100%;            /* White */
--accent: 189.635 81.0651% 66.8627%;          /* Accent Cyan */
--accent-foreground: 0 0% 20%;                /* Dark text */

/* Neutral colors */
--background: 240 9.0909% 97.8431%;           /* Off-white */
--foreground: 0 0% 20%;                       /* Dark text */
--card: 0 0% 100%;                            /* White cards */
--card-foreground: 0 0% 20%;                  /* Dark text */

/* UI colors */
--muted: 50.4 26.8817% 81.7647%;              /* Beige muted */
--muted-foreground: 0 0% 43.1373%;            /* Gray text */
--border: 0 0% 83.1373%;                      /* Light gray */
--input: 0 0% 83.1373%;                       /* Input border */
--ring: 139.6552 52.7273% 43.1373%;           /* Focus ring (green) */

/* Semantic colors */
--destructive: 0 84.2365% 60.1961%;           /* Red */
--destructive-foreground: 0 0% 100%;          /* White */
--success: 138.871 70.4545% 34.5098%;         /* Green */
--success-foreground: 0 0% 100%;              /* White */
--warning: 37.4286 91.3043% 54.902%;          /* Orange */
--warning-foreground: 0 0% 20%;               /* Dark */
--info: 218.5401 79.1908% 66.0784%;           /* Blue */
--info-foreground: 0 0% 100%;                 /* White */
```

#### Dark Mode
```css
/* Core brand colors (adjusted for dark) */
--primary: 139.6552 52.7273% 43.1373%;        /* Keep green vibrant */
--secondary: 220.1351 59.2% 49.0196%;         /* Darker blue */
--background: 220 14.7541% 11.9608%;          /* Dark background */
--foreground: 0 0% 89.8039%;                  /* Light text */
```

**Note**: See `frontend/src/index.css` for complete dark theme implementation.

### Typography

#### Font Families
```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],          // LTR (English)
  arabic: ['Tajawal', 'system-ui', 'sans-serif'],      // RTL (Arabic)
  mono: ['Consolas', 'Courier New', 'monospace'],
}
```

#### Font Sizes (CSS Variables)
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

#### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Scale
Use Tailwind's default spacing (4px base unit):
- `p-2` = 8px padding
- `gap-4` = 16px gap
- `space-y-6` = 24px vertical spacing
- `m-8` = 32px margin

### Border Radius
```javascript
borderRadius: {
  lg: 'var(--radius)',                 // 0.5rem (8px)
  md: 'calc(var(--radius) - 2px)',     // 6px
  sm: 'calc(var(--radius) - 4px)',     // 4px
}
```

---

## Component Library

### Primitives (in `src/components/ui/`)
Your project already has these shadcn/ui components installed:

#### Layout
- **Card** — Container with elevation (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`)
- **Separator** — Horizontal/vertical divider
- **Skeleton** — Loading placeholders
- **Scroll Area** — Custom scrollbar styling
- **Sheet** — Slide-out panel (mobile-friendly)
- **Sidebar** — App navigation sidebar

#### Forms
- **Button** — Primary, secondary, destructive, outline, ghost, link variants
- **Input** — Text input with validation states
- **Label** — Form field labels
- **Textarea** — Multi-line text input
- **Select** — Dropdown selection
- **Checkbox** — Boolean input
- **Radio Group** — Single selection from options
- **Switch** — Toggle control
- **Form** — Form wrapper with react-hook-form integration

#### Feedback
- **Alert** — Informational messages (info, warning, error, success)
- **Badge** — Status indicators
- **Toast** — Temporary notifications (via Sonner)
- **Progress** — Loading/progress indicator
- **Skeleton** — Loading placeholders

#### Overlays
- **Dialog** — Modal dialogs
- **Alert Dialog** — Confirmation dialogs
- **Sheet** — Slide-out panels
- **Popover** — Floating content
- **Tooltip** — Contextual hints
- **Dropdown Menu** — Contextual actions

#### Navigation
- **Tabs** — Content switching
- **Navigation Menu** — Header navigation
- **Sidebar** — App sidebar navigation

#### Data Display
- **Table** — Tabular data
- **Avatar** — User images with fallback
- **Accordion** — Collapsible content
- **Calendar** — Date picker (react-day-picker)

### Responsive Components (in `src/components/responsive/`)
**These are critical for mobile-first design:**

- **ResponsiveCard** — Auto-collapsing cards with mobile layouts
- **ResponsiveWrapper** — Container query support
- **ResponsiveCardGrid** — Adaptive grid layouts
- **responsive-nav.tsx** — Mobile navigation patterns
- **responsive-table.tsx** — Mobile-friendly tables

### Domain-Specific Blocks (in `src/components/`)
Your project has these custom blocks built on Kibo primitives:

#### Dossier Management
- **DossierCard** — Dossier preview card
- **DossierHeader** — Dossier page header
- **DossierTimeline** — Timeline view of dossier events
- **DossierStats** — Statistics dashboard
- **DossierActions** — Action buttons

#### Assignment Workflow
- **AssignmentEngine** — Assignment processing logic
- **WaitingQueueActions** — Queue management UI
- **TriagePanel** — Assignment triage interface
- **SLACountdown** — SLA timer display

#### Entity Management
- **EntityTypeTabs** — Entity type filtering
- **EntityDocumentsTab** — Document management
- **EntityRelationships** — React Flow graph
- **KeyContactsPanel** — Contact management

#### Forms
- **IntakeForm** — Front door intake
- **EngagementForm** — Engagement creation
- **AfterActionForm** — After-action reporting
- **TypeSpecificFields** — Dynamic form fields

#### Kanban
- **Kanban** — Drag-and-drop kanban board (DnD Kit)

#### Search
- **GlobalSearchInput** — Global search bar
- **SearchResultsList** — Search results display
- **SearchSuggestions** — Search autocomplete

#### Other UI Components
- **LanguageSwitcher** — Language toggle (en/ar)
- **OfflineIndicator** — Offline status badge
- **RealtimeStatus** — Real-time connection status
- **QuickSwitcher** — Command palette (Cmd+K)
- **FilterPanel** — Advanced filtering UI
- **VersionHistoryViewer** — Document version history
- **ApprovalChain** — Approval workflow visualization

---

## RTL/LTR Support

### Critical Implementation

#### Font Assignment
```css
/* Automatic font switching based on direction */
html[dir="rtl"] * {
  font-family: 'Tajawal', system-ui, sans-serif !important;
}

html[dir="ltr"] * {
  font-family: 'Inter', system-ui, sans-serif !important;
}
```

#### Logical CSS Properties
Always use **logical properties** for RTL support:

```tsx
// ✅ Correct: Uses logical properties
<div className="ms-4 pe-6">  {/* margin-start, padding-end */}

// ❌ Wrong: Hard-coded direction
<div className="ml-4 pr-6">  {/* margin-left, padding-right */}
```

#### Component Direction
```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="text-start">
      {/* Content automatically flows correctly */}
    </div>
  )
}
```

---

## Component Usage Patterns

### Dossier Card Example
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { useResponsive } from '@/hooks/use-responsive'

export function DossierCard({ dossier }: { dossier: Dossier }) {
  const { t } = useTranslation()
  const { isMobile } = useResponsive()
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className={cn(
          'text-base',
          'sm:text-lg',
          'md:text-xl'
        )}>
          {dossier.title}
        </CardTitle>
        <Badge variant="success">{t('status.active')}</Badge>
      </CardHeader>
      <CardContent>
        <p className={cn(
          'text-2xl font-bold',
          'sm:text-3xl'
        )}>
          {dossier.engagement_count}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('dossiers.engagements')}
        </p>
        <Button className={cn(
          'mt-4 w-full min-h-[44px]',
          'sm:min-h-[40px]'
        )}>
          {t('actions.view_details')}
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Form with i18n
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { useResponsive } from '@/hooks/use-responsive'
import { z } from 'zod'

const formSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
})

export function DossierForm() {
  const { t } = useTranslation()
  const { isMobile } = useResponsive()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('forms.title')}</FormLabel>
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
        <Button 
          type="submit" 
          className={cn(
            'w-full min-h-[44px]',
            'sm:min-h-[40px]'
          )}
        >
          {t('actions.submit')}
        </Button>
      </form>
    </Form>
  )
}
```

### Data Table with TanStack Query
```tsx
import { useQuery } from '@tanstack/react-query'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useResponsive } from '@/hooks/use-responsive'

export function DossiersTable() {
  const { isMobile } = useResponsive()
  
  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers', isMobile ? 'mobile' : 'desktop'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(isMobile ? 'id, title, status' : '*')
        .order('created_at', { ascending: false })
        .limit(isMobile ? 20 : 100)
      if (error) throw error
      return data
    }
  })
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          {!isMobile && <TableHead>Created</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dossiers?.map((dossier) => (
          <TableRow key={dossier.id}>
            <TableCell className={cn(
              'text-sm',
              'sm:text-base'
            )}>
              {dossier.title}
            </TableCell>
            <TableCell>
              <Badge>{dossier.status}</Badge>
            </TableCell>
            {!isMobile && (
              <TableCell>
                {new Date(dossier.created_at).toLocaleDateString()}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## Accessibility Guidelines

1. **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, `<article>` appropriately
2. **Keyboard Navigation**: All interactive elements must be keyboard accessible
3. **ARIA Labels**: Icon-only buttons need `aria-label`
4. **Focus Indicators**: Never remove focus outlines (Kibo handles this)
5. **Color Contrast**: Minimum 4.5:1 for text (automatically handled by theme)
6. **Screen Reader Support**: Test with VoiceOver (iOS), TalkBack (Android), NVDA (Windows), JAWS
7. **Form Labels**: Every input must have an associated label
8. **Touch Targets**: Minimum 44x44px on mobile (WCAG AA)

---

## Adding New Components

### When to add from shadcn/ui:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### When to create custom:
Build custom components when you need:
- Domain-specific compositions (e.g., `AssignmentCard`, `EscalationPanel`)
- Complex stateful blocks (e.g., `KanbanBoard`, `EntityGraph`)
- Application-specific patterns (e.g., `DossierWizard`, `ApprovalFlow`)

**Always** build on top of Kibo primitives from `src/components/ui/` and wrap with responsive components.

---

## Resources

- **Kibo UI Docs**: https://kibo-ui.com
- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com
- **TanStack Query**: https://tanstack.com/query
- **TanStack Router**: https://tanstack.com/router
- **i18next**: https://www.i18next.com
- **React Hook Form**: https://react-hook-form.com

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-22  
**GASTAT Branding**: Compliant  
**Mobile-First**: Required  
**RTL Support**: Required
