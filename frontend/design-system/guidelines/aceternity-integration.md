# Aceternity UI Integration Guide

## Overview

Aceternity UI is the **primary component library** for the GASTAT International Dossier System. This guide explains how to properly integrate Aceternity components while maintaining design system compliance.

## Component Library Hierarchy

When implementing any UI feature, follow this order:

1. **Aceternity UI** (Primary) - https://ui.aceternity.com/components
   - 130+ components in 18 categories
   - Check FIRST for any UI need
2. **Aceternity UI Pro** (Primary+) - https://pro.aceternity.com/components
   - 30+ component blocks, 7+ premium templates
   - Requires API key
3. **Kibo-UI** (Secondary) - https://www.kibo-ui.com
   - Use ONLY if Aceternity doesn't have equivalent
4. **shadcn/ui** (Last Resort) - https://ui.shadcn.com
   - Use ONLY if Aceternity AND Kibo-UI don't have equivalent

## Aceternity UI Categories

### Available Components (130+)

| Category | Count | Examples |
|----------|-------|----------|
| **Backgrounds & Effects** | 23 | Sparkles, Aurora, Gradient animations, Spotlight, Background Boxes |
| **Cards** | 14 | 3D card, Hoverable card, Expandable card, Animated card |
| **Scroll & Parallax** | 5 | Sticky scroll, Parallax effects, Container scroll |
| **Text Components** | 9 | Typewriter, Flip words, Text generation effects |
| **Buttons** | 4 | Animated buttons, Gradient borders, Moving borders |
| **Navigation** | 7 | Floating navbar, Sidebar, Floating dock, Tabs |
| **Inputs & Forms** | 3 | Signup forms, File upload, Vanish input |
| **Overlays & Modals** | 3 | Animated modals, Tooltips, Link preview |
| **Carousels & Sliders** | 4 | Image sliders, Testimonials |
| **Layout & Grid** | 3 | Bento grid, Layout grid, Timeline |
| **Data & Visualization** | 5 | GitHub globe, World map, Timeline, Charts |
| **3D Components** | 2 | 3D pins, Marquee effects |

Full catalog: https://ui.aceternity.com/components

## Installation

### Free Components

```bash
npx shadcn@latest add https://ui.aceternity.com/registry/[component].json --yes
```

**Examples:**

```bash
# Background Boxes (animated background pattern)
npx shadcn@latest add https://ui.aceternity.com/registry/background-boxes.json --yes

# Text Generate Effect (animated text reveal)
npx shadcn@latest add https://ui.aceternity.com/registry/text-generate-effect.json --yes

# Moving Border (animated button border)
npx shadcn@latest add https://ui.aceternity.com/registry/moving-border.json --yes

# Bento Grid (layout component)
npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json --yes

# Timeline (vertical timeline)
npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json --yes

# Floating Navbar
npx shadcn@latest add https://ui.aceternity.com/registry/floating-navbar.json --yes

# 3D Card
npx shadcn@latest add https://ui.aceternity.com/registry/3d-card.json --yes
```

### Pro Components

Aceternity Pro requires an API key. Store in `.env.local`:

```env
ACETERNITY_PRO_API_KEY=your_api_key_here
```

**IMPORTANT**: Never commit API keys to git. The `.env.local` file is in `.gitignore`.

## Design System Adaptation

The key principle: **Keep Aceternity animations, adapt colors to design system.**

### ✅ CORRECT Integration

```tsx
import { BackgroundBoxes } from '@/components/ui/background-boxes'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { useTranslation } from 'react-i18next'

export function LandingHero() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="relative min-h-screen bg-background"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Keep Aceternity animation */}
      <BackgroundBoxes />

      {/* Content with design system colors */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 md:px-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground text-center mb-6">
          <TextGenerateEffect words={t('welcome.title')} />
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground text-center max-w-2xl mb-8">
          {t('welcome.subtitle')}
        </p>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          {t('welcome.cta')}
        </Button>
      </div>
    </div>
  )
}
```

### ❌ WRONG Integration

```tsx
// DON'T override design system with hardcoded colors
import { BackgroundBoxes } from '@/components/ui/background-boxes'

export function LandingHero() {
  return (
    <div className="relative min-h-screen bg-slate-900">  {/* ❌ Hardcoded */}
      <BackgroundBoxes />
      <div className="relative z-10">
        <h1 className="text-white text-6xl">  {/* ❌ Hardcoded */}
          Welcome
        </h1>
        <Button className="bg-blue-500">  {/* ❌ Hardcoded */}
          Get Started
        </Button>
      </div>
    </div>
  )
}
```

## Common Integration Patterns

### Background Effects

```tsx
import { BackgroundBoxes } from '@/components/ui/background-boxes'
import { Sparkles } from '@/components/ui/sparkles'

// Use semantic colors for container
<div className="relative bg-background text-foreground">
  <BackgroundBoxes />  {/* Animation adapts to theme */}
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>
```

### Animated Cards

```tsx
import { HoverableCard } from '@/components/ui/hoverable-card'

<HoverableCard
  className="bg-card border-border"  // Design system colors
  title={
    <span className="text-card-foreground">{title}</span>
  }
  description={
    <span className="text-muted-foreground">{description}</span>
  }
>
  {/* Keep Aceternity hover animations */}
</HoverableCard>
```

### Text Effects

```tsx
import { TypewriterEffect } from '@/components/ui/typewriter-effect'
import { FlipWords } from '@/components/ui/flip-words'

// Text effects with design system typography
<div className="text-foreground">
  <TypewriterEffect
    words={words}
    className="text-3xl sm:text-4xl md:text-5xl font-semibold"
  />

  <FlipWords
    words={['modern', 'powerful', 'elegant']}
    className="text-primary"  // Use design system color
  />
</div>
```

### Navigation

```tsx
import { FloatingNavbar } from '@/components/ui/floating-navbar'

<FloatingNavbar
  navItems={navItems}
  className="bg-background/80 backdrop-blur-md border-border"
  activeClassName="text-primary"
  inactiveClassName="text-muted-foreground"
/>
```

## Mobile-First Aceternity

All Aceternity components should be responsive:

```tsx
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'

<BentoGrid
  className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
>
  <BentoGridItem
    title={<span className="text-base sm:text-lg">{title}</span>}
    description={<span className="text-sm">{description}</span>}
    className="bg-card border-border"
  />
</BentoGrid>
```

## RTL Support with Aceternity

Aceternity components need RTL adaptation:

```tsx
import { Timeline } from '@/components/ui/timeline'
import { useTranslation } from 'react-i18next'

export function EventTimeline() {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <Timeline
        data={events}
        className="text-start"  // Logical property
        iconClassName={isRTL ? 'rotate-180' : ''}  // Flip if needed
      />
    </div>
  )
}
```

## Color Adaptation Strategy

### Step 1: Identify Aceternity Colors

Look at the component's default styling:

```tsx
// Aceternity component might have:
<div className="bg-slate-900 text-white">
```

### Step 2: Map to Design System

Replace with semantic tokens:

```tsx
// Adapt to design system:
<div className="bg-background text-foreground">
```

### Common Mappings

| Aceternity | Design System | Token |
|------------|---------------|-------|
| `bg-slate-900` | `bg-background` | Dark backgrounds |
| `text-white` | `text-foreground` | Primary text |
| `text-gray-500` | `text-muted-foreground` | Secondary text |
| `bg-blue-500` | `bg-primary` | Primary actions |
| `border-gray-800` | `border-border` | Borders |

## Animation Customization

Aceternity animations can be customized via props:

```tsx
import { BackgroundBoxes } from '@/components/ui/background-boxes'

<BackgroundBoxes
  // Customize animation speed
  duration={3000}
  // Customize colors if needed (use CSS variables)
  className="[--box-color:hsl(var(--primary)/0.1)]"
/>
```

## Performance Considerations

### Lazy Loading

For heavy animation components:

```tsx
import { lazy, Suspense } from 'react'

const BackgroundBoxes = lazy(() =>
  import('@/components/ui/background-boxes').then(mod => ({
    default: mod.BackgroundBoxes
  }))
)

<Suspense fallback={<div className="min-h-screen bg-background" />}>
  <BackgroundBoxes />
</Suspense>
```

### Disable Animations on Mobile

```tsx
import { useMediaQuery } from '@/hooks/use-media-query'

function Hero() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="relative bg-background">
      {!isMobile && <BackgroundBoxes />}  {/* Skip on mobile */}
      <div className="relative z-10">
        {/* Content */}
      </div>
    </div>
  )
}
```

## Troubleshooting

### Component Not Working

1. **Check Installation**: Verify component is in `src/components/ui/`
2. **Check Dependencies**: Ensure `framer-motion` is installed
3. **Check Imports**: Use correct import path
4. **Check Props**: Review Aceternity docs for required props

### Colors Not Adapting

1. **Check Tailwind Config**: Ensure CSS variables are configured
2. **Check Theme Provider**: Verify `ThemeProvider` wraps app
3. **Check Theme Data**: Verify theme tokens are defined in `src/index.css`

### Animations Laggy

1. **Reduce Animation Complexity**: Simplify motion parameters
2. **Use `will-change`**: Add to animated elements
3. **Disable on Low-End Devices**: Use `@media (prefers-reduced-motion)`

## Resources

- [Aceternity UI Components](https://ui.aceternity.com/components)
- [Aceternity Pro](https://pro.aceternity.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [shadcn CLI](https://ui.shadcn.com/docs/cli)

---

**Previous**: [← Component Checklist](./component-checklist.md) | **Next**: [Design Tokens →](./design-tokens.md)
