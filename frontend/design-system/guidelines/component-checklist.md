# Component Implementation Checklist

Before implementing ANY new UI component, follow this checklist to ensure design system compliance.

## Pre-Implementation Checklist

### 1. Component Library Check

- [ ] **Searched Aceternity UI** (https://ui.aceternity.com/components)
  - Check all 18 categories
  - Review similar components
  - Consider composition of multiple components
- [ ] **Checked Aceternity Pro** (https://pro.aceternity.com/components) if free version insufficient
- [ ] **Checked Kibo-UI** (https://www.kibo-ui.com) if Aceternity doesn't have it
- [ ] **Checked shadcn/ui** (https://ui.shadcn.com) as last resort

**Rule**: Only build custom components if NONE of the above have a suitable option.

### 2. Design System Compliance

- [ ] **Colors**: Will use semantic tokens (`bg-background`, `text-foreground`, etc.)
- [ ] **Typography**: Will use Kibo UI scale (`text-sm`, `text-base`, etc.)
- [ ] **Spacing**: Will use consistent spacing scale
- [ ] **Breakpoints**: Will use custom breakpoints (xs:320px, sm:768px, md:1024px, lg:1440px)

### 3. Mobile-First Planning

- [ ] **Start with base styles** for 320px viewport
- [ ] **Plan responsive breakpoints**:
  - Base (320px+): Mobile layout
  - sm (768px+): Tablet layout
  - md (1024px+): Desktop layout
  - lg (1440px+): Large desktop
- [ ] **Touch targets**: Minimum 44x44px (`min-h-11 min-w-11`)
- [ ] **Touch-friendly spacing**: Minimum 8px between interactive elements

### 4. RTL Support Planning

- [ ] **Use logical properties**:
  - `ms-*` / `me-*` (NOT `ml-*` / `mr-*`)
  - `ps-*` / `pe-*` (NOT `pl-*` / `pr-*`)
  - `start-*` / `end-*` (NOT `left-*` / `right-*`)
  - `text-start` / `text-end` (NOT `text-left` / `text-right`)
- [ ] **Plan icon flipping**: Directional icons need `rotate-180` in RTL
- [ ] **Add `dir` attribute**: Use `dir={isRTL ? 'rtl' : 'ltr'}`

### 5. Accessibility Planning

- [ ] **Contrast ratios**: 4.5:1 for text, 3:1 for UI elements
- [ ] **Keyboard navigation**: Focusable elements have visible focus states
- [ ] **Screen readers**: Meaningful labels and ARIA attributes
- [ ] **Focus management**: Logical tab order
- [ ] **Error states**: Clear, accessible error messages

## Implementation Checklist

### 1. Component Structure

```tsx
import { useTranslation } from 'react-i18next'

export function MyComponent() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="container mx-auto px-4 sm:px-6 md:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Component content */}
    </div>
  )
}
```

### 2. Color Usage

- [ ] Uses `bg-background` and `bg-card` for backgrounds
- [ ] Uses `text-foreground` and `text-muted-foreground` for text
- [ ] Uses `border-border` for borders
- [ ] Uses `bg-primary` and `text-primary-foreground` for primary actions
- [ ] Uses semantic states (`destructive`, `success`, `warning`)
- [ ] NO hardcoded colors (`bg-slate-900`, `text-white`, `bg-blue-500`)

### 3. Typography

- [ ] Uses design system font scale (`text-sm`, `text-base`, etc.)
- [ ] Uses appropriate font weights (`font-normal`, `font-semibold`)
- [ ] NO arbitrary font sizes (`text-[14px]`, `text-[2rem]`)
- [ ] NO inline font styles

### 4. Spacing

- [ ] Uses consistent spacing scale (`gap-4`, `p-6`, `m-8`)
- [ ] Uses logical properties (`ms-*`, `ps-*`)
- [ ] Responsive spacing scales with breakpoints

### 5. Mobile-First Implementation

- [ ] Base styles defined first (320px+)
- [ ] `sm:` prefix for 768px+ styles
- [ ] `md:` prefix for 1024px+ styles
- [ ] `lg:` prefix for 1440px+ styles
- [ ] Touch targets meet 44x44px minimum

### 6. RTL Implementation

- [ ] Component wrapped with `dir={isRTL ? 'rtl' : 'ltr'}`
- [ ] All spacing uses logical properties
- [ ] All text alignment uses logical alignment
- [ ] Directional icons flip with `className={isRTL ? 'rotate-180' : ''}`
- [ ] Layout automatically adapts (no hardcoded directions)

### 7. Translations

- [ ] All user-facing text uses `t('key')`
- [ ] Translation keys added to both `en/` and `ar/` files
- [ ] Placeholders and labels translated
- [ ] Error messages translated

## Post-Implementation Checklist

### 1. Visual Testing

- [ ] Tested on **320px** viewport (iPhone SE)
- [ ] Tested on **375px** viewport (iPhone X)
- [ ] Tested on **768px** viewport (iPad portrait)
- [ ] Tested on **1024px** viewport (iPad landscape)
- [ ] Tested on **1440px** viewport (desktop)
- [ ] Tested on **1920px+** viewport (large monitors)

### 2. RTL Testing

- [ ] Switched to Arabic language
- [ ] Verified layout flips correctly
- [ ] Verified icons flip correctly
- [ ] Verified text alignment is correct
- [ ] Verified spacing is correct
- [ ] No layout breaks in RTL mode

### 3. Theme Testing

- [ ] Tested with **Natural** theme (light mode)
- [ ] Tested with **Natural** theme (dark mode)
- [ ] Tested with **Zinc** theme (light mode)
- [ ] Tested with **Zinc** theme (dark mode)
- [ ] All colors use semantic tokens (adapt correctly)

### 4. Accessibility Testing

- [ ] **Keyboard navigation** works correctly
- [ ] **Focus states** are visible
- [ ] **Screen reader** announces content correctly
- [ ] **Color contrast** meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] **Touch targets** meet 44x44px minimum
- [ ] **Error states** are announced

### 5. Performance Testing

- [ ] Component renders quickly (<100ms)
- [ ] No unnecessary re-renders
- [ ] Animations are smooth (60fps)
- [ ] Images are optimized and lazy-loaded
- [ ] No console errors or warnings

## Common Mistakes to Avoid

### ❌ Hardcoded Colors

```tsx
// WRONG
<div className="bg-white text-black">
<div className="bg-slate-900">
<Button className="bg-blue-500">
```

### ❌ Directional Properties

```tsx
// WRONG
<div className="ml-4 pl-6 text-left">
<div className="absolute left-4">
```

### ❌ Desktop-First

```tsx
// WRONG
<div className="px-12 md:px-8 sm:px-4">
<h1 className="text-5xl md:text-4xl">
```

### ❌ Arbitrary Values

```tsx
// WRONG
<div className="text-[18px] p-[24px]">
<div className="gap-[1.5rem]">
```

### ❌ Missing Translations

```tsx
// WRONG
<Button>Submit</Button>
<h1>Welcome to Dashboard</h1>
```

## Resources

- [Foundations: Colors](../foundations/colors.md)
- [Foundations: Typography](../foundations/typography.md)
- [Foundations: Breakpoints](../foundations/breakpoints.md)
- [Foundations: RTL](../foundations/rtl.md)
- [Aceternity Integration](./aceternity-integration.md)

## Questions?

If you're unsure about any aspect of component implementation:

1. Check the relevant foundation documentation
2. Review existing components in `src/components/`
3. Search Aceternity UI for similar patterns
4. Consult the design system team

---

**Remember**: The checklist exists to prevent common mistakes and ensure consistency. Following it saves time in the long run.
