# Breakpoints and Responsive Design

## Overview

The GASTAT International Dossier System uses **custom breakpoints** that differ from Tailwind CSS defaults. This is a critical distinction to understand when implementing responsive designs.

## Custom Breakpoints

### Configured Values

| Breakpoint | Size | Default Tailwind | Our Custom | Difference |
|------------|------|------------------|------------|------------|
| `xs` | Extra Small | N/A | **320px** | Custom addition |
| `sm` | Small | 640px | **768px** | +128px |
| `md` | Medium | 768px | **1024px** | +256px |
| `lg` | Large | 1024px | **1440px** | +416px |
| `xl` | Extra Large | 1280px | **1280px** | Same |
| `2xl` | 2X Large | 1536px | **1536px** | Same |

### Configuration

Located in `tailwind.config.ts`:

```typescript
screens: {
  xs: '320px',   // Extra small (mobile)
  sm: '768px',   // Small (tablet portrait)
  md: '1024px',  // Medium (tablet landscape)
  lg: '1440px',  // Large (desktop)
  xl: '1280px',  // Extra large
  '2xl': '1536px', // 2X large
}
```

## Mobile-First Principle

**ALWAYS start with mobile (base) styles, then scale up.**

### ✅ CORRECT - Mobile First

```tsx
// Start with mobile (320px+), add larger screens
<div className="px-4 sm:px-6 md:px-8 lg:px-12">
  Mobile: 16px padding
  Tablet: 24px padding
  Desktop: 32px padding
  Large: 48px padding
</div>

<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Mobile: 24px
  Tablet: 30px
  Desktop: 36px
  Large: 48px
</h1>
```

### ❌ WRONG - Desktop First

```tsx
// DON'T start with desktop and work down
<div className="px-12 lg:px-8 md:px-6 sm:px-4">  ❌
<h1 className="text-5xl lg:text-4xl md:text-3xl">  ❌
```

## Breakpoint Usage Guide

### Extra Small (xs: 320px)

**Target**: Small mobile phones (iPhone SE, Android compacts)

```tsx
// Base styles already apply here, use xs: for specific targeting
<div className="grid grid-cols-1 xs:grid-cols-2">
  1 column default, 2 columns on very small screens
</div>
```

### Small (sm: 768px)

**Target**: Tablet portrait, large phones

```tsx
<div className="flex-col sm:flex-row">
  Vertical stack → Horizontal row at 768px+
</div>

<Button className="h-11 sm:h-10">
  Larger touch target on mobile
</Button>
```

### Medium (md: 1024px)

**Target**: Tablet landscape, small desktops

```tsx
<div className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
  1 column → 2 columns → 3 columns
</div>

<aside className="hidden md:block">
  Hide sidebar on mobile, show on desktop
</aside>
```

### Large (lg: 1440px)

**Target**: Large desktops, high-resolution displays

```tsx
<div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
  Increase spacing on large screens
</div>

<div className="gap-4 sm:gap-6 md:gap-8 lg:gap-12">
  Progressive spacing increase
</div>
```

## Common Responsive Patterns

### Container Padding

```tsx
// Standard container with responsive padding
<div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
  {children}
</div>
```

### Grid Layouts

```tsx
// Responsive grid: 1 → 2 → 3 → 4 columns
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Flexbox Layouts

```tsx
// Stack vertically on mobile, horizontal on tablet+
<div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
  <div className="w-full sm:w-1/2">Left</div>
  <div className="w-full sm:w-1/2">Right</div>
</div>
```

### Typography Scaling

```tsx
// Responsive heading
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
  Responsive Title
</h1>

// Responsive body text
<p className="text-sm sm:text-base md:text-lg">
  Readable at all sizes
</p>
```

### Visibility

```tsx
// Hide on mobile, show on tablet+
<div className="hidden sm:block">Desktop Nav</div>

// Show on mobile, hide on tablet+
<div className="block sm:hidden">Mobile Menu</div>

// Show only on specific ranges
<div className="hidden md:block lg:hidden">Tablet Only</div>
```

### Touch Targets

```tsx
// Minimum 44x44px on mobile (WCAG requirement)
<Button className="min-h-11 min-w-11 sm:min-h-10 sm:min-w-10">
  Tap Target
</Button>
```

## RTL-Safe Responsive Design

Combine breakpoints with logical properties:

```tsx
// ✅ CORRECT - RTL-safe responsive spacing
<div className="ms-4 sm:ms-6 md:ms-8 lg:ms-12">
  Margin-inline-start adapts to direction
</div>

// ❌ WRONG - Fixed direction
<div className="ml-4 sm:ml-6 md:ml-8">
  Always left margin, ignores RTL
</div>
```

## Testing Breakpoints

### Browser DevTools

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test these key widths:
   - 320px (xs - smallest phones)
   - 768px (sm - tablets)
   - 1024px (md - small desktops)
   - 1440px (lg - large desktops)

### Test Checklist

- [ ] 320px (iPhone SE, small Android)
- [ ] 375px (iPhone X, modern phones)
- [ ] 768px (iPad Portrait)
- [ ] 1024px (iPad Landscape, small laptops)
- [ ] 1440px (Desktop, common monitor size)
- [ ] 1920px+ (Large monitors, 4K)

## Performance Considerations

### Avoid Breakpoint Overuse

```tsx
// ❌ BAD - Too many breakpoints
<div className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">

// ✅ GOOD - Strategic breakpoints
<div className="text-sm sm:text-base lg:text-lg">
```

### CSS Custom Properties

For complex responsive values, consider CSS variables:

```css
/* Define responsive values */
:root {
  --spacing-container: 1rem;  /* 16px */
}

@media (min-width: 768px) {
  :root {
    --spacing-container: 1.5rem;  /* 24px */
  }
}

@media (min-width: 1024px) {
  :root {
    --spacing-container: 2rem;  /* 32px */
  }
}
```

## Common Pitfalls

### 1. Wrong Breakpoint Values

```tsx
// ❌ WRONG - Using default Tailwind values
// Our sm: is 768px, not 640px!
<div className="block sm:hidden">  // Breaks at 768px, not 640px
```

### 2. Desktop-First Thinking

```tsx
// ❌ WRONG
<div className="px-12 md:px-8 sm:px-4">

// ✅ CORRECT
<div className="px-4 sm:px-8 md:px-12">
```

### 3. Ignoring xs: Breakpoint

```tsx
// ❌ Missing xs: consideration
<div className="grid-cols-1 sm:grid-cols-2">

// ✅ Better - Explicitly handle xs:
<div className="grid-cols-1 xs:grid-cols-2 sm:grid-cols-3">
```

## Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN: Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [WCAG 2.1: Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)

---

**Previous**: [← Typography](./typography.md) | **Next**: [RTL Support →](./rtl.md)
