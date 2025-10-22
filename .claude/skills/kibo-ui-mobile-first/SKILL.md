---
name: Kibo UI Mobile-First Development
description: >
  Creates mobile-first, responsive React components with RTL/LTR support using Kibo UI patterns.
  Use when: building UI components, forms, cards, layouts, navigation, or when user mentions
  "mobile", "responsive", "RTL", "Arabic", "touch", "breakpoint", or "Kibo UI".
---

# Kibo UI Mobile-First Development

Build mobile-first, responsive, RTL-compatible components for GASTAT Dossier System.

## Core Rules

1. **Mobile-first ALWAYS** - Design starts at 320px, then enhance for larger screens
2. **Check existing first** - Use ResponsiveCard, ResponsiveWrapper before creating new
3. **RTL/LTR required** - Every component must support English (LTR) and Arabic (RTL)
4. **44px touch targets** - Minimum on mobile (can be smaller on desktop)
5. **No directional CSS** - Use logical properties (ms-, pe-, not ml-, pr-)

## Required Hooks

Every component needs these three hooks:

```typescript
import { useResponsive } from '@/hooks/use-responsive'
import { useDirection } from '@/hooks/use-theme'
import { useTranslation } from 'react-i18next'

const { isMobile, isTablet, isDesktop } = useResponsive()
const { isRTL } = useDirection()
const { t } = useTranslation()
```

## Before Creating Components

Check these in order:
1. `frontend/src/components/responsive/` - ResponsiveCard, ResponsiveWrapper, ResponsiveCardGrid
2. `frontend/src/components/ui/` - Button, Card, Input, Dialog, etc. (28+ primitives)
3. `frontend/COMPONENT_INVENTORY.md` - Full list of existing components

## Component Template

```typescript
import { ResponsiveCard } from '@/components/responsive/responsive-card'
import { Button } from '@/components/ui/button'
import { useResponsive } from '@/hooks/use-responsive'
import { useDirection } from '@/hooks/use-theme'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  className?: string
  showOnMobile?: boolean
}

export function MyComponent({ title, className, showOnMobile = true }: MyComponentProps) {
  const { isMobile } = useResponsive()
  const { isRTL } = useDirection()
  const { t } = useTranslation()
  
  if (isMobile && !showOnMobile) return null
  
  return (
    <ResponsiveCard
      title={title}
      collapsible={isMobile}
      className={className}
    >
      <div className={cn(
        'p-3 text-sm',       // Mobile
        'sm:p-4 sm:text-base' // Tablet+
      )}>
        <Button className="min-h-[44px] sm:min-h-[40px]">
          {t('actions.submit')}
        </Button>
      </div>
    </ResponsiveCard>
  )
}
```

## Styling Patterns

```typescript
// ✅ Mobile-first Tailwind
'p-3 sm:p-4 md:p-6'

// ✅ Logical properties for RTL
'ms-4 pe-6 text-start'

// ✅ Touch targets
'min-h-[44px] sm:min-h-[40px]'

// ❌ Desktop-first
'p-8 md:p-6 sm:p-4'

// ❌ Directional
'ml-4 pr-6 text-left'
```

## Common Patterns

### Progressive Disclosure
Show less on mobile, more on desktop:

```typescript
<div>
  <p>{summary}</p>
  {!isMobile && <p>{details}</p>}
  {isDesktop && <div>{moreDetails}</div>}
</div>
```

### Responsive Navigation
Drawer on mobile, horizontal on desktop:

```typescript
const { isMobile } = useResponsive()
return isMobile ? <Sheet>...</Sheet> : <nav>...</nav>
```

### Mobile Forms
Full-width buttons on mobile:

```typescript
<Button className={cn('min-h-[44px]', isMobile && 'w-full')}>
  {t('submit')}
</Button>
```

## Data Fetching

Fetch less data on mobile:

```typescript
const { isMobile } = useResponsive()
const fields = isMobile ? 'id, title' : '*'
const limit = isMobile ? 20 : 100
```

## Testing Checklist

- [ ] Works at 320px, 768px, 1024px
- [ ] Tested in English (LTR) and Arabic (RTL)
- [ ] Touch targets ≥ 44px on mobile
- [ ] Uses useResponsive() hook
- [ ] Uses logical CSS properties

## Reference Files

For detailed examples, see:
- `templates/component-template.tsx` - Full component example
- `templates/form-template.tsx` - Form example
- `frontend/DESIGN_SYSTEM.md` - Complete design system
- `frontend/MOBILE_FIRST_EXAMPLES.md` - Code examples

## Project Context

**Stack**: Vite + React 19 + TypeScript + Kibo UI (shadcn/ui) + TanStack Router + Supabase  
**i18n**: English (LTR) + Arabic (RTL) via i18next  
**Breakpoints**: xs(320px) → sm(768px) → md(1024px) → lg(1440px)
