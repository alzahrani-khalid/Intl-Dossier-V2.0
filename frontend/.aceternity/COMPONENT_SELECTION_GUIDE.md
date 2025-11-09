# Aceternity UI Component Selection Guide

## Quick Reference: Component Mappings

This guide helps you find the right Aceternity component for your needs and provides fallback options.

### Navigation Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Top Navigation Bar | `floating-navbar` | Premium navbar blocks | `@kibo-ui/navbar` |
| Sidebar Menu | `sidebar` | Enhanced sidebar templates | `shadcn/sheet` |
| Mobile Menu | `floating-dock` | Mobile nav blocks | `shadcn/sheet` |
| Tabs | `tabs` | Advanced tab blocks | `shadcn/tabs` |
| Breadcrumbs | Custom with `link-preview` | - | `shadcn/breadcrumb` |
| Command Palette | - | - | `shadcn/command` |

**Installation Examples**:
```bash
# Floating navbar
npx shadcn@latest add https://ui.aceternity.com/registry/floating-navbar.json --yes

# Sidebar
npx shadcn@latest add https://ui.aceternity.com/registry/sidebar.json --yes

# Floating dock (mobile)
npx shadcn@latest add https://ui.aceternity.com/registry/floating-dock.json --yes
```

### Card Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Basic Card | `3d-card` | Advanced card blocks | `shadcn/card` |
| Hoverable Card | `hover-card` | - | `shadcn/hover-card` |
| Expandable Card | `expandable-card` | - | Custom |
| Card with Effects | `evervault-card`, `comet-card` | Premium effect cards | Custom |
| Card Grid | `bento-grid` | Dashboard card grids | Custom grid |

**Installation Examples**:
```bash
# 3D Card
npx shadcn@latest add https://ui.aceternity.com/registry/3d-card.json --yes

# Hover Card
npx shadcn@latest add https://ui.aceternity.com/registry/hover-card.json --yes

# Bento Grid
npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json --yes
```

### Form Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Text Input | `vanish-input` | Enhanced input blocks | `shadcn/input` |
| File Upload | `file-upload` | Advanced upload blocks | `shadcn/file-upload` |
| Signup Form | `signup-form` | Multi-step form blocks | `shadcn/form` |
| Search Input | - | - | `shadcn/input` + custom |
| Select/Dropdown | - | - | `shadcn/select` |
| Checkbox/Radio | - | - | `shadcn/checkbox` |

**Installation Examples**:
```bash
# Vanish Input
npx shadcn@latest add https://ui.aceternity.com/registry/vanish-input.json --yes

# File Upload
npx shadcn@latest add https://ui.aceternity.com/registry/file-upload.json --yes
```

### Data Display Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Data Table | - | Data table blocks | `@kibo-ui/table` or `shadcn/table` |
| Timeline | `timeline` | Enhanced timeline | Custom |
| List | Use grid + cards | List blocks | `shadcn/list` |
| Badge | - | - | `shadcn/badge` |
| Avatar | - | - | `shadcn/avatar` |
| Skeleton Loader | - | - | `shadcn/skeleton` |

**Installation Examples**:
```bash
# Timeline
npx shadcn@latest add https://ui.aceternity.com/registry/timeline.json --yes
```

### Layout Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Grid Layout | `bento-grid`, `layout-grid` | Dashboard templates | Custom grid |
| Container | `container-cover` | - | Custom |
| Separator | - | - | `shadcn/separator` |
| Scroll Area | - | - | `shadcn/scroll-area` |

**Installation Examples**:
```bash
# Bento Grid
npx shadcn@latest add https://ui.aceternity.com/registry/bento-grid.json --yes

# Layout Grid
npx shadcn@latest add https://ui.aceternity.com/registry/layout-grid.json --yes
```

### Modal & Overlay Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Modal/Dialog | `animated-modal` | Enhanced modal blocks | `shadcn/dialog` |
| Tooltip | `animated-tooltip` | - | `shadcn/tooltip` |
| Popover | - | - | `shadcn/popover` |
| Alert Dialog | - | - | `shadcn/alert-dialog` |

**Installation Examples**:
```bash
# Animated Modal
npx shadcn@latest add https://ui.aceternity.com/registry/animated-modal.json --yes

# Animated Tooltip
npx shadcn@latest add https://ui.aceternity.com/registry/animated-tooltip.json --yes
```

### Button Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Animated Button | `moving-border-button` | Premium button blocks | `shadcn/button` |
| Gradient Button | `hover-border-gradient` | - | Custom |
| Icon Button | Use with icons | - | `shadcn/button` |

**Installation Examples**:
```bash
# Moving Border Button
npx shadcn@latest add https://ui.aceternity.com/registry/moving-border-button.json --yes
```

### Visualization Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Network Graph | `github-globe` | - | React Flow + custom |
| World Map | `world-map` | - | Custom |
| Charts | - | Chart blocks | Recharts + Aceternity wrapper |
| Progress Bar | - | - | `shadcn/progress` |

**Installation Examples**:
```bash
# GitHub Globe
npx shadcn@latest add https://ui.aceternity.com/registry/github-globe.json --yes

# World Map
npx shadcn@latest add https://ui.aceternity.com/registry/world-map.json --yes
```

### Background & Effect Components

| Need | Aceternity UI (Free) | Aceternity Pro | Fallback |
|------|---------------------|----------------|----------|
| Animated Background | `aurora-background`, `sparkles` | Premium backgrounds | Custom |
| Spotlight Effect | `spotlight` | - | Custom |
| Gradient Animation | `gradient-animation` | - | Custom |
| Ripple Effect | `ripple-effect` | - | Custom |

**Installation Examples**:
```bash
# Aurora Background
npx shadcn@latest add https://ui.aceternity.com/registry/aurora-background.json --yes

# Sparkles
npx shadcn@latest add https://ui.aceternity.com/registry/sparkles.json --yes
```

## Decision Tree

```
Need a UI Component?
│
├─ 1. Search Aceternity UI (130+ components)
│   https://ui.aceternity.com/components
│   │
│   ├─ Found? → Install via:
│   │   npx shadcn@latest add https://ui.aceternity.com/registry/[name].json --yes
│   │
│   └─ Not found? → Go to step 2
│
├─ 2. Check Aceternity Pro (30+ blocks, 7+ templates)
│   https://pro.aceternity.com/components
│   │
│   ├─ Found? → Check Pro docs for installation
│   │   (Requires API key in .env.local)
│   │
│   └─ Not found? → Go to step 3
│
├─ 3. Check Kibo-UI (Secondary fallback)
│   https://www.kibo-ui.com
│   │
│   ├─ Found? → Install via:
│   │   npx shadcn@latest add @kibo-ui/[name]
│   │
│   └─ Not found? → Go to step 4
│
└─ 4. Use shadcn/ui OR build custom
    https://ui.shadcn.com
    │
    ├─ Found in shadcn? → Install via:
    │   npx shadcn@latest add [name]
    │
    └─ Not found? → Build custom component
        Use Aceternity styling and Framer Motion
```

## RTL Adaptation Checklist

After installing any component, ensure RTL support:

- [ ] Replace `ml-*`, `mr-*` with `ms-*`, `me-*`
- [ ] Replace `pl-*`, `pr-*` with `ps-*`, `pe-*`
- [ ] Replace `text-left`, `text-right` with `text-start`, `text-end`
- [ ] Replace `left-*`, `right-*` with `start-*`, `end-*`
- [ ] Add `dir={isRTL ? 'rtl' : 'ltr'}` to container
- [ ] Flip directional icons: `className={isRTL ? 'rotate-180' : ''}`
- [ ] Test in Arabic mode (`i18n.language = 'ar'`)

## Mobile-First Checklist

After installing any component, ensure mobile-first design:

- [ ] Start with base styles (no breakpoint prefix)
- [ ] Add `sm:` for 640px+ changes
- [ ] Add `md:` for 768px+ changes
- [ ] Add `lg:` for 1024px+ changes
- [ ] Add `xl:` for 1280px+ changes
- [ ] Ensure touch targets are 44x44px minimum
- [ ] Test on 375px viewport (iPhone SE)
- [ ] Test on 768px viewport (tablet)
- [ ] Test on 1920px viewport (desktop)

## Example Usage

### Navigation Sidebar

```tsx
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/ui/sidebar';

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Sidebar
      className="w-64 sm:w-72 lg:w-80"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Sidebar content with logical properties */}
      <div className="ps-4 pe-4 sm:ps-6 sm:pe-6">
        {/* Menu items */}
      </div>
    </Sidebar>
  );
}
```

### 3D Card

```tsx
import { useTranslation } from 'react-i18next';
import { Card3D } from '@/components/ui/3d-card';

export function DossierCard({ dossier }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Card3D
      className="p-4 sm:p-6 lg:p-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <h3 className="text-lg sm:text-xl lg:text-2xl text-start">
        {dossier.title}
      </h3>
      <p className="mt-2 text-sm sm:text-base text-start">
        {dossier.description}
      </p>
    </Card3D>
  );
}
```

## Troubleshooting

### Component Not Found
1. Check exact component name at https://ui.aceternity.com/components
2. Verify kebab-case naming (e.g., `bento-grid`, not `BentoGrid`)
3. Check if it's a Pro component requiring API key
4. Try alternative components from the same category

### Installation Fails
1. Ensure you're in `/frontend` directory
2. Verify `components.json` exists and is valid
3. Check internet connection
4. Try with `--yes` flag for auto-confirm

### Component Doesn't Work
1. Verify `framer-motion` is installed
2. Check component dependencies in installation output
3. Verify imports are correct: `@/components/ui/[name]`
4. Check console for errors

### RTL Issues
1. Verify logical properties are used throughout
2. Check `dir` attribute is set on container
3. Test with `i18n.language = 'ar'` in dev tools
4. Flip icons with `rotate-180` class

## Next Steps

1. Browse Aceternity catalog: https://ui.aceternity.com/components
2. Check component demos and code examples
3. Install components needed for current feature
4. Adapt for mobile-first and RTL
5. Test thoroughly before committing

## Quick Commands

```bash
# Search for component
# Visit https://ui.aceternity.com/components

# Install free component
npx shadcn@latest add https://ui.aceternity.com/registry/[component].json --yes

# Install Pro component (verify in Pro docs)
# Check https://pro.aceternity.com/docs

# Install Kibo-UI fallback
npx shadcn@latest add @kibo-ui/[component]

# Install shadcn fallback
npx shadcn@latest add [component]
```

## Helpful Resources

- **Aceternity UI**: https://ui.aceternity.com
- **Aceternity Pro**: https://pro.aceternity.com
- **Kibo-UI**: https://www.kibo-ui.com
- **shadcn/ui**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion
- **Tailwind CSS**: https://tailwindcss.com
