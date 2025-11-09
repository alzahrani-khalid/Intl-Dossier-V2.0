# Typography System

## Overview

The GASTAT International Dossier System uses the Geist font family (Vercel's design system font) with a Kibo UI scale (14px base instead of 16px).

## Font Families

### Primary Font: Geist

```css
--font-sans: 'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-serif: 'Georgia', 'Times New Roman', serif;
--font-mono: 'Geist Mono', 'Consolas', 'Courier New', monospace;
```

**Why Geist?**
- Modern, professional design font from Vercel
- Excellent readability at small sizes
- Wide character set with international support
- Optimized for digital interfaces

## Font Size Scale (Kibo UI)

**Base Font Size: 14px** (not standard 16px)

| Token | Rem | Pixels | Usage |
|-------|-----|--------|-------|
| `text-xs` | 0.75rem | 12px | Tiny labels, captions |
| `text-sm` | 0.875rem | 14px | Small text, table data |
| `text-base` | 0.875rem | 14px | **Body text (default)** |
| `text-lg` | 1rem | 16px | Large body text |
| `text-xl` | 1.125rem | 18px | Subheadings |
| `text-2xl` | 1.5rem | 24px | Section headers |
| `text-3xl` | 1.875rem | 30px | Page titles |
| `text-4xl` | 2.25rem | 36px | Hero text |
| `text-5xl` | 3rem | 48px | Display text |

**Important**: The base font size is 14px, not 16px. This matches Kibo UI's scale.

## Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-thin` | 100 | Decorative only |
| `font-extralight` | 200 | Decorative only |
| `font-light` | 300 | Light emphasis |
| `font-normal` | 400 | **Body text (default)** |
| `font-medium` | 500 | Slight emphasis |
| `font-semibold` | 600 | **Headings** |
| `font-bold` | 700 | Strong emphasis, buttons |
| `font-extrabold` | 800 | Very strong emphasis |
| `font-black` | 900 | Maximum weight |

## Typography Hierarchy

### Page Title
```tsx
<h1 className="text-3xl font-semibold text-foreground">
  Dossiers
</h1>
```

### Section Header
```tsx
<h2 className="text-2xl font-semibold text-foreground">
  Recent Activity
</h2>
```

### Subheading
```tsx
<h3 className="text-xl font-medium text-foreground">
  Details
</h3>
```

### Body Text
```tsx
<p className="text-base font-normal text-foreground">
  This is the main content text.
</p>
```

### Secondary Text
```tsx
<p className="text-sm text-muted-foreground">
  Additional information or metadata
</p>
```

### Caption
```tsx
<span className="text-xs text-muted-foreground">
  Last updated 2 hours ago
</span>
```

## Line Height

Use Tailwind's default line heights:

| Class | Value | Usage |
|-------|-------|-------|
| `leading-none` | 1 | Tight headings |
| `leading-tight` | 1.25 | Headings |
| `leading-snug` | 1.375 | Dense text |
| `leading-normal` | 1.5 | **Body text (default)** |
| `leading-relaxed` | 1.625 | Comfortable reading |
| `leading-loose` | 2 | Very spaced text |

## Letter Spacing

| Class | Value | Usage |
|-------|-------|-------|
| `tracking-tighter` | -0.05em | Tight headings |
| `tracking-tight` | -0.025em | Compact text |
| `tracking-normal` | 0 | **Default** |
| `tracking-wide` | 0.025em | Buttons, labels |
| `tracking-wider` | 0.05em | All-caps text |
| `tracking-widest` | 0.1em | Wide all-caps |

## Usage Examples

### ✅ CORRECT

```tsx
// Page header
<header>
  <h1 className="text-3xl font-semibold text-foreground">
    International Dossiers
  </h1>
  <p className="text-sm text-muted-foreground">
    Manage diplomatic relationships and international engagements
  </p>
</header>

// Card with typography hierarchy
<Card>
  <CardHeader>
    <CardTitle className="text-2xl font-semibold">
      Saudi Arabia
    </CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Kingdom of Saudi Arabia
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-base">
      Main content goes here with default body text styling.
    </p>
    <span className="text-xs text-muted-foreground">
      Last updated: 2025-10-29
    </span>
  </CardContent>
</Card>

// Button with proper typography
<Button className="font-medium">
  Submit Application
</Button>
```

### ❌ WRONG

```tsx
// DON'T mix arbitrary font sizes
<h1 className="text-[32px]">Title</h1>        ❌

// DON'T use system fonts directly
<p style={{ fontFamily: 'Arial' }}>Text</p>   ❌

// DON'T use inline styles
<span style={{ fontSize: '14px' }}>Text</span> ❌

// DON'T ignore the design system scale
<h2 className="text-7xl">Too large</h2>       ❌
```

## RTL Typography Considerations

### Text Alignment

**Always use logical alignment:**

```tsx
// ✅ CORRECT - Logical alignment
<p className="text-start">    // Adapts to LTR/RTL
<p className="text-end">      // Adapts to LTR/RTL
<p className="text-center">   // Same in both

// ❌ WRONG - Fixed alignment
<p className="text-left">     // Always left
<p className="text-right">    // Always right
```

### Font Loading

Arabic requires proper font support. Geist includes international character sets, but verify Arabic glyphs render correctly.

## Responsive Typography

### Mobile-First Approach

```tsx
// Scale up from mobile to desktop
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>

<p className="text-sm sm:text-base md:text-lg">
  Responsive body text
</p>
```

### Breakpoint Guidelines

| Screen Size | Headings | Body Text |
|-------------|----------|-----------|
| Mobile (320-767px) | `text-2xl` | `text-sm` |
| Tablet (768-1023px) | `text-3xl` | `text-base` |
| Desktop (1024px+) | `text-4xl` | `text-base` or `text-lg` |

## Accessibility

### Readability

1. **Minimum text size**: 14px (text-sm) for body content
2. **Maximum line length**: 65-75 characters for optimal reading
3. **Contrast**: Use `text-foreground` for primary text (4.5:1 minimum)
4. **Secondary text**: Use `text-muted-foreground` (4.5:1 minimum)

### Font Smoothing

```css
/* Already applied globally in index.css */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

## Implementation Notes

1. **Font Loading**: Geist is loaded via `@fontsource/geist` in `index.css`
2. **Base Size**: Set to 14px in Tailwind config via `--text-base` CSS variable
3. **Custom Fonts**: To add new fonts, update `tailwind.config.ts` and `index.css`
4. **Font Display**: Uses `font-display: swap` for better performance

## Resources

- [Geist Font Documentation](https://vercel.com/font)
- [Tailwind Typography Plugin](https://tailwindcss.com/docs/typography-plugin)
- [Web Typography Best Practices](https://www.smashingmagazine.com/2020/07/css-techniques-legibility/)

---

**Previous**: [← Colors](./colors.md) | **Next**: [Spacing →](./spacing.md)
