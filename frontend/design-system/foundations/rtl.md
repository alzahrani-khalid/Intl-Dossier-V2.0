# RTL (Right-to-Left) Support

## Overview

The GASTAT International Dossier System provides full bilingual support for English (LTR) and Arabic (RTL) using CSS Logical Properties. This document outlines the patterns and requirements for RTL-compatible UI development.

## Core Principle

**Use logical properties, NEVER use directional properties.**

Logical properties automatically adapt to the text direction (`dir="ltr"` or `dir="rtl"`), ensuring consistent layout in both languages.

## Logical Properties Reference

### Margin

| ❌ Avoid | ✅ Use Instead | Meaning |
|---------|----------------|---------|
| `ml-*` | `ms-*` | margin-inline-start |
| `mr-*` | `me-*` | margin-inline-end |
| `mx-*` | `mx-*` | margin-inline (OK to use) |
| `mt-*` | `mt-*` | margin-top (OK to use) |
| `mb-*` | `mb-*` | margin-bottom (OK to use) |

### Padding

| ❌ Avoid | ✅ Use Instead | Meaning |
|---------|----------------|---------|
| `pl-*` | `ps-*` | padding-inline-start |
| `pr-*` | `pe-*` | padding-inline-end |
| `px-*` | `px-*` | padding-inline (OK to use) |
| `pt-*` | `pt-*` | padding-top (OK to use) |
| `pb-*` | `pb-*` | padding-bottom (OK to use) |

### Position

| ❌ Avoid | ✅ Use Instead | Meaning |
|---------|----------------|---------|
| `left-*` | `start-*` | inset-inline-start |
| `right-*` | `end-*` | inset-inline-end |
| `top-*` | `top-*` | top (OK to use) |
| `bottom-*` | `bottom-*` | bottom (OK to use) |

### Text Alignment

| ❌ Avoid | ✅ Use Instead | Meaning |
|---------|----------------|---------|
| `text-left` | `text-start` | Align to start (left in LTR, right in RTL) |
| `text-right` | `text-end` | Align to end (right in LTR, left in RTL) |
| `text-center` | `text-center` | Center (OK to use) |

### Border Radius

| ❌ Avoid | ✅ Use Instead | Meaning |
|---------|----------------|---------|
| `rounded-l-*` | `rounded-s-*` | border-start-radius |
| `rounded-r-*` | `rounded-e-*` | border-end-radius |
| `rounded-tl-*` | `rounded-ss-*` | border-start-start-radius |
| `rounded-tr-*` | `rounded-se-*` | border-start-end-radius |
| `rounded-bl-*` | `rounded-es-*` | border-end-start-radius |
| `rounded-br-*` | `rounded-ee-*` | border-end-end-radius |

## Implementation Patterns

### Detecting RTL

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Content automatically adapts to direction */}
    </div>
  );
}
```

### Basic Layout

```tsx
// ✅ CORRECT - Uses logical properties
<div className="ps-4 pe-6 text-start">
  <h1 className="ms-2 text-2xl">Title</h1>
  <p className="text-start">Content text</p>
</div>

// ❌ WRONG - Uses directional properties
<div className="pl-4 pr-6 text-left">
  <h1 className="ml-2 text-2xl">Title</h1>
  <p className="text-left">Content text</p>
</div>
```

### Navigation

```tsx
function Navigation() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <nav className="flex gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <a className="ps-4 pe-2">Home</a>
      <a className="ps-4 pe-2">About</a>
      <a className="ps-4 pe-2">Contact</a>
    </nav>
  );
}
```

### Sidebar Layout

```tsx
function Layout() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar automatically flips position */}
      <aside className="w-64 border-e border-border">
        <nav className="ps-4">Sidebar</nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 ps-8">
        <h1 className="text-start">Content</h1>
      </main>
    </div>
  );
}
```

### Cards and Containers

```tsx
<Card className="text-start" dir={isRTL ? 'rtl' : 'ltr'}>
  <CardHeader className="pb-4">
    <CardTitle className="text-start">Title</CardTitle>
    <CardDescription className="text-start">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent className="ps-6 pe-6">
    <p className="text-start">Content</p>
  </CardContent>
</Card>
```

### Icon Flipping

Some icons need to flip in RTL:

```tsx
import { ChevronRight, ArrowRight } from 'lucide-react';

function IconComponent() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div>
      {/* Directional icons should flip */}
      <ChevronRight className={isRTL ? 'rotate-180' : ''} />
      <ArrowRight className={isRTL ? 'rotate-180' : ''} />

      {/* Non-directional icons don't flip */}
      <Search />  {/* No rotation needed */}
      <Settings />  {/* No rotation needed */}
    </div>
  );
}
```

**Icons that should flip:**
- Chevrons (ChevronLeft, ChevronRight)
- Arrows (ArrowLeft, ArrowRight)
- Navigation icons (Menu with directional hint)
- Undo/Redo (when directional)

**Icons that should NOT flip:**
- Search, Settings, User
- Plus, Minus, X (Close)
- Check, Alert, Info
- Most circular icons

### Forms

```tsx
<form className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
  <div className="flex flex-col gap-2">
    <Label className="text-start">
      {t('email')}
    </Label>
    <Input
      type="email"
      className="text-start"
      placeholder={t('emailPlaceholder')}
    />
  </div>

  <div className="flex gap-2 justify-start">
    <Button type="submit">
      {t('submit')}
    </Button>
    <Button variant="outline">
      {t('cancel')}
    </Button>
  </div>
</form>
```

### Data Tables

```tsx
<Table dir={isRTL ? 'rtl' : 'ltr'}>
  <TableHeader>
    <TableRow>
      <TableHead className="text-start">{t('name')}</TableHead>
      <TableHead className="text-start">{t('email')}</TableHead>
      <TableHead className="text-end">{t('actions')}</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="text-start">John Doe</TableCell>
      <TableCell className="text-start">john@example.com</TableCell>
      <TableCell className="text-end">
        <Button size="sm">{t('edit')}</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Mobile-First RTL

Combine responsive breakpoints with logical properties:

```tsx
// ✅ CORRECT - Responsive RTL-safe spacing
<div className="ps-4 sm:ps-6 md:ps-8 lg:ps-12">
  Padding-inline-start scales with breakpoints
</div>

// ✅ CORRECT - Responsive RTL-safe flex
<div className="flex flex-col sm:flex-row gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
  <div className="w-full sm:w-1/2">Left</div>
  <div className="w-full sm:w-1/2">Right</div>
</div>
```

## Typography RTL

### Font Loading

Ensure the font supports Arabic characters. Geist includes international character sets.

### Line Height

Arabic text may require slightly different line heights. Test with actual content.

```tsx
<p className="leading-relaxed" lang={isRTL ? 'ar' : 'en'}>
  {t('content')}
</p>
```

## Common Pitfalls

### 1. Hardcoded Directions

```tsx
// ❌ WRONG
<div className="ml-4 text-left">

// ✅ CORRECT
<div className="ms-4 text-start">
```

### 2. Flexbox Direction

```tsx
// ❌ WRONG - Doesn't adapt to RTL
<div className="flex justify-start">
  <Button>First</Button>
  <Button>Second</Button>
</div>

// ✅ CORRECT - Adapts to RTL
<div className="flex justify-start" dir={isRTL ? 'rtl' : 'ltr'}>
  <Button>First</Button>
  <Button>Second</Button>
</div>
```

### 3. Absolute Positioning

```tsx
// ❌ WRONG
<div className="absolute left-4">

// ✅ CORRECT
<div className="absolute start-4">
```

### 4. Grid Template Columns

Grid layouts automatically flip with `dir="rtl"`, no additional changes needed:

```tsx
// ✅ Automatically flips in RTL
<div className="grid grid-cols-3 gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
```

## Testing RTL

### Manual Testing

1. Change language to Arabic in language selector
2. Verify all layouts flip correctly
3. Check icon directions
4. Test navigation flow
5. Verify form field alignment
6. Check table column alignment

### Automated Testing

```tsx
import { render } from '@testing-library/react';

describe('RTL Support', () => {
  it('should render correctly in RTL', () => {
    const { container } = render(
      <div dir="rtl" className="ps-4 text-start">
        Test content
      </div>
    );

    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });
});
```

## Accessibility

### Language Attribute

Always set the `lang` attribute:

```tsx
<html lang={i18n.language}>
  <body dir={isRTL ? 'rtl' : 'ltr'}>
    {/* Content */}
  </body>
</html>
```

### Screen Readers

Screen readers automatically adapt to `dir` and `lang` attributes. No additional work needed.

## Resources

- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [RTL Styling 101](https://rtlstyling.com/)
- [Tailwind Logical Properties](https://tailwindcss.com/docs/padding#logical-properties)
- [W3C: Structural Markup and RTL](https://www.w3.org/International/questions/qa-html-dir)

---

**Previous**: [← Breakpoints](./breakpoints.md) | **Next**: [Spacing →](./spacing.md)
