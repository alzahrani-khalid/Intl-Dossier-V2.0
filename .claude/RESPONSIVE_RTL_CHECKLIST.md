# Mobile-First & RTL Development Checklist

## ✅ Mobile-First Design Checklist

### Before Writing Any Component
- [ ] Start with mobile layout (320-640px base)
- [ ] Use Tailwind's mobile-first breakpoints (base → sm: → md: → lg: → xl: → 2xl:)
- [ ] Test on mobile viewport first (375px minimum width)

### Layout & Spacing
- [ ] Container uses responsive padding: `px-4 sm:px-6 lg:px-8`
- [ ] Grids adapt to screen size: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [ ] Flexbox switches direction: `flex-col sm:flex-row`
- [ ] Touch targets minimum 44x44px: `min-h-11 min-w-11`
- [ ] Adequate spacing between elements: `gap-2 sm:gap-4 lg:gap-6`

### Typography
- [ ] Text scales responsively: `text-sm sm:text-base md:text-lg`
- [ ] Headings scale: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
- [ ] Line height adjusts: `leading-tight sm:leading-normal`

### Interactive Elements
- [ ] Buttons are touch-friendly: `h-11 px-4 sm:h-10 sm:px-6 md:h-12 md:px-8`
- [ ] Forms use responsive layout
- [ ] Modals/dialogs work on mobile (fullscreen on small screens)

### Images & Media
- [ ] Images are responsive: `w-full h-auto`
- [ ] Aspect ratios defined: `aspect-square sm:aspect-video`
- [ ] Lazy loading implemented for performance

---

## ✅ Arabic RTL Support Checklist

### Component Setup
- [ ] Import `useTranslation` hook
- [ ] Detect RTL: `const isRTL = i18n.language === 'ar'`
- [ ] Set `dir` attribute: `dir={isRTL ? 'rtl' : 'ltr'}`

### Logical Properties (REQUIRED)
- [ ] Replace `ml-*` with `ms-*` (margin-start)
- [ ] Replace `mr-*` with `me-*` (margin-end)
- [ ] Replace `pl-*` with `ps-*` (padding-start)
- [ ] Replace `pr-*` with `pe-*` (padding-end)
- [ ] Replace `left-*` with `start-*` (position-start)
- [ ] Replace `right-*` with `end-*` (position-end)
- [ ] Replace `text-left` with `text-start`
- [ ] Replace `text-right` with `text-end`
- [ ] Replace `rounded-l-*` with `rounded-s-*`
- [ ] Replace `rounded-r-*` with `rounded-e-*`

### Flexbox & Grid
- [ ] Flex direction aware of RTL: `flex-row` (auto-reverses) or explicit `${isRTL ? 'flex-row-reverse' : 'flex-row'}`
- [ ] Grid columns work in RTL context
- [ ] Order of elements makes sense in RTL

### Icons & Visual Elements
- [ ] Directional icons flip in RTL: `className={isRTL ? 'rotate-180' : ''}`
- [ ] Chevrons point correct direction
- [ ] Arrows reverse in RTL
- [ ] Images with directional context adjust

### Forms
- [ ] Input text alignment: `text-start`
- [ ] Placeholders translated: `placeholder={t('key')}`
- [ ] Labels positioned correctly in RTL
- [ ] Form validation messages align properly

### Typography in Arabic
- [ ] Arabic font family used: `font-arabic`
- [ ] Text renders correctly right-to-left
- [ ] Line breaks work properly
- [ ] Numbers formatted: `new Intl.NumberFormat(i18n.language).format()`
- [ ] Dates formatted: `new Intl.DateTimeFormat(i18n.language).format()`

### Animations & Transitions
- [ ] Slide animations reverse in RTL
- [ ] Transformations account for direction: `${isRTL ? '-translate-x-4' : 'translate-x-4'}`
- [ ] Hover effects work in RTL

### Navigation
- [ ] Breadcrumbs reverse in RTL
- [ ] Menus open on correct side
- [ ] Sidebar slides from correct direction
- [ ] Pagination arrows point correctly

### Testing
- [ ] Component tested in English (LTR)
- [ ] Component tested in Arabic (RTL)
- [ ] Visual hierarchy correct in both languages
- [ ] No layout breaks when switching languages
- [ ] Interactive elements accessible in both directions
- [ ] Text truncation works in both languages

---

## 🚫 Common Mistakes to Avoid

### ❌ Hard-coded Directions
```tsx
// WRONG
<div className="ml-4 text-left">

// CORRECT
<div className="ms-4 text-start">
```

### ❌ Desktop-First CSS
```tsx
// WRONG
<div className="p-8 sm:p-4">

// CORRECT
<div className="p-4 sm:p-6 md:p-8">
```

### ❌ Fixed Widths on Mobile
```tsx
// WRONG
<div className="w-96">

// CORRECT
<div className="w-full sm:w-96">
```

### ❌ Non-Translated Content
```tsx
// WRONG
<button>Submit</button>

// CORRECT
<button>{t('form.submit')}</button>
```

### ❌ Icons Not Flipping
```tsx
// WRONG
<ChevronRight />

// CORRECT
<ChevronRight className={isRTL ? 'rotate-180' : ''} />
```

---

## 📝 Component Template

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export function ResponsiveRTLComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className="
        container mx-auto
        px-4 sm:px-6 lg:px-8
        py-4 sm:py-6 lg:py-8
      "
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Responsive heading */}
      <h1 className="
        text-2xl sm:text-3xl md:text-4xl lg:text-5xl
        font-bold text-start
        mb-4 sm:mb-6 lg:mb-8
      ">
        {t('page.title')}
      </h1>

      {/* Responsive grid */}
      <div className="
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
        gap-4 sm:gap-6 lg:gap-8
      ">
        {/* Card with RTL support */}
        <div className="
          p-4 sm:p-6
          rounded-lg border
          bg-card text-card-foreground
        ">
          <h2 className="
            text-lg sm:text-xl
            font-semibold text-start
            mb-2 sm:mb-4
          ">
            {t('card.title')}
          </h2>

          <p className="
            text-sm sm:text-base
            text-muted-foreground text-start
            mb-4
          ">
            {t('card.description')}
          </p>

          {/* RTL-aware button with icon */}
          <Button className="
            h-11 min-w-11
            px-4 sm:px-6
            w-full sm:w-auto
          ">
            <span className={isRTL ? 'order-2' : 'order-1'}>
              {t('card.action')}
            </span>
            <ChevronRight
              className={`
                ${isRTL ? 'order-1 me-2 rotate-180' : 'order-2 ms-2'}
                h-4 w-4
              `}
            />
          </Button>
        </div>
      </div>

      {/* Responsive flex layout */}
      <div className="
        flex flex-col sm:flex-row
        items-start sm:items-center
        gap-4 sm:gap-6
        mt-8
      ">
        <input
          type="text"
          placeholder={t('form.search')}
          className="
            w-full sm:w-64
            h-11
            px-4
            text-start
            rounded-lg border
          "
        />

        <Button className="
          h-11 px-6
          w-full sm:w-auto
        ">
          {t('form.submit')}
        </Button>
      </div>
    </div>
  );
}
```

---

## 🔧 Quick Fixes for Existing Components

### Fix Hard-coded Margins/Padding
```bash
# Find all instances
grep -r "ml-\|mr-\|pl-\|pr-" frontend/src

# Replace with logical properties
ml-4 → ms-4
mr-4 → me-4
pl-4 → ps-4
pr-4 → pe-4
```

### Fix Text Alignment
```bash
# Find all instances
grep -r "text-left\|text-right" frontend/src

# Replace with logical properties
text-left → text-start
text-right → text-end
```

### Fix Desktop-First Responsive
```bash
# Look for reverse breakpoint patterns (large to small)
grep -r 'className="[^"]*lg:[^"]*sm:' frontend/src
```

---

## 📚 Resources

- [Tailwind CSS RTL Support](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [React i18next](https://react.i18next.com/)
- [Mobile-First Design Principles](https://web.dev/responsive-web-design-basics/)
