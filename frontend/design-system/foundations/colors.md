# Color System

## Overview

The GASTAT International Dossier System uses a semantic color token system that supports theme switching. All themes share the same token structure, ensuring consistent component behavior across themes.

## Available Themes

| Theme | Description | Primary Color | Status |
|-------|-------------|---------------|--------|
| **Natural** ⭐ | Neutral gray scale (shadcn default) | `#343434` (Dark Gray) | Default |
| **GASTAT** | GASTAT-specific branding | TBD | Available |
| **Zinc** | shadcn/ui Zinc theme | `#18181B` (Deep Zinc) | Available |

⭐ **Default Theme**: Natural (Light Mode)

**Note:** Blue Sky theme has been removed from the system.

## Semantic Color Tokens

### Core Principle

**ALWAYS use semantic tokens. NEVER use hardcoded colors.**

This ensures:
- Consistent theming across the application
- Easy theme switching
- Maintainable codebase
- Proper dark mode support

### Token Reference

```css
/* Core Brand Colors */
--primary                    /* Primary actions, brand color */
--primary-foreground         /* Text on primary */
--secondary                  /* Secondary actions */
--secondary-foreground       /* Text on secondary */

/* Neutral Colors */
--background                 /* Page background */
--foreground                 /* Primary text */
--muted                      /* Muted backgrounds */
--muted-foreground           /* Secondary text */

/* UI Elements */
--card                       /* Card backgrounds */
--card-foreground            /* Text on cards */
--popover                    /* Popover/dropdown backgrounds */
--popover-foreground         /* Text in popovers */
--border                     /* Border color */
--input                      /* Input borders */
--ring                       /* Focus ring color */

/* Semantic States */
--destructive                /* Delete, error actions */
--destructive-foreground
--success                    /* Success states */
--success-foreground
--warning                    /* Warning states */
--warning-foreground
--info                       /* Informational messages */
--info-foreground

/* Sidebar (Navigation) */
--sidebar                    /* Sidebar background */
--sidebar-foreground         /* Sidebar text */
--sidebar-primary            /* Sidebar active item */
--sidebar-primary-foreground
--sidebar-accent             /* Sidebar hover state */
--sidebar-accent-foreground
--sidebar-border             /* Sidebar borders */
--sidebar-ring               /* Sidebar focus ring */

/* Charts */
--chart-1, --chart-2, --chart-3, --chart-4, --chart-5
```

## Usage Examples

### ✅ CORRECT Usage

```tsx
// Background and text
<div className="bg-background text-foreground">
  <h1 className="text-2xl font-semibold">Welcome</h1>
</div>

// Primary button
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit
</Button>

// Card component
<Card className="bg-card border-border">
  <CardHeader>
    <CardTitle className="text-card-foreground">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Secondary information</p>
  </CardContent>
</Card>

// Semantic states
<div className="bg-destructive text-destructive-foreground">Error</div>
<div className="bg-success text-success-foreground">Success</div>
<div className="bg-warning text-warning-foreground">Warning</div>

// Sidebar
<aside className="bg-sidebar border-sidebar-border">
  <nav className="text-sidebar-foreground">
    <a className="bg-sidebar-primary text-sidebar-primary-foreground">
      Active Link
    </a>
  </nav>
</aside>
```

### ❌ WRONG Usage

```tsx
// DON'T use hardcoded colors
<div className="bg-white text-black">                     ❌
<div className="bg-slate-900 text-white">                 ❌
<Button className="bg-blue-500">                          ❌
<Card className="bg-[#FFFFFF] border-[#E5E5E5]">         ❌
<p className="text-gray-500">                             ❌
<div className="bg-red-500">                              ❌
```

## Natural Theme Colors (Default)

### Light Mode
```css
:root[data-theme="natural"][data-color-mode="light"] {
  --primary: 0 0% 20.5%;              /* #343434 - Dark gray */
  --primary-foreground: 0 0% 98%;      /* White text */
  --background: 0 0% 100%;             /* White */
  --foreground: 0 0% 20%;              /* Dark text */
  --muted: 0 0% 96%;                   /* Very light gray */
  --muted-foreground: 0 0% 45%;        /* Medium gray */
  --border: 0 0% 90%;                  /* Light border */
  /* ... additional tokens */
}
```

### Dark Mode
```css
:root[data-theme="natural"][data-color-mode="dark"] {
  --primary: 0 0% 80%;                 /* Light gray */
  --primary-foreground: 0 0% 10%;      /* Dark text */
  --background: 0 0% 10%;              /* Dark background */
  --foreground: 0 0% 95%;              /* Light text */
  --muted: 0 0% 20%;                   /* Dark gray */
  --muted-foreground: 0 0% 65%;        /* Medium gray */
  --border: 0 0% 25%;                  /* Dark border */
  /* ... additional tokens */
}
```

## Accessibility Requirements

### Contrast Ratios (WCAG AA)

- **Text**: 4.5:1 minimum contrast ratio
- **Large Text (18pt+)**: 3:1 minimum
- **UI Elements**: 3:1 minimum (borders, icons, states)

### Testing Colors

Before adding custom color combinations, verify contrast:

1. Use browser DevTools or contrast checker
2. Test both light and dark modes
3. Test with actual content (not Lorem Ipsum)
4. Verify semantic states (error, success, warning) are distinguishable

## Aceternity UI Integration

When using Aceternity UI components, adapt colors to the design system:

### ✅ CORRECT

```tsx
import { BackgroundBoxes } from '@/components/ui/background-boxes'

// Keep Aceternity animations, use design system colors
<div className="relative bg-background text-foreground">
  <BackgroundBoxes />
  <div className="relative z-10">
    <h1 className="text-primary text-4xl font-bold">
      {t('welcome')}
    </h1>
  </div>
</div>
```

### ❌ WRONG

```tsx
// DON'T override with hardcoded colors
<div className="relative bg-slate-900 text-white">  ❌
  <BackgroundBoxes />
  <h1 className="text-blue-500">                    ❌
</div>
```

## Implementation Notes

1. **Theme Provider**: Themes are managed by `ThemeProvider` component
2. **CSS Variables**: All colors are CSS custom properties
3. **Tailwind Integration**: Use Tailwind utility classes with semantic tokens
4. **Color Mode**: System supports light/dark/system preference
5. **Theme Storage**: User preferences are persisted to localStorage and Supabase

## Resources

- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)

---

**Next**: [Typography →](./typography.md)
