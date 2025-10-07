# RTL & Mobile-First Quick Reference Card

## 🚫 NEVER Use → ✅ ALWAYS Use

### Margins
| ❌ Avoid | ✅ Use | Description |
|---------|--------|-------------|
| `ml-4` | `ms-4` | Margin start (left in LTR, right in RTL) |
| `mr-4` | `me-4` | Margin end (right in LTR, left in RTL) |
| `ml-auto` | `ms-auto` | Auto margin start |
| `mr-auto` | `me-auto` | Auto margin end |

### Padding
| ❌ Avoid | ✅ Use | Description |
|---------|--------|-------------|
| `pl-4` | `ps-4` | Padding start |
| `pr-4` | `pe-4` | Padding end |

### Text Alignment
| ❌ Avoid | ✅ Use | Description |
|---------|--------|-------------|
| `text-left` | `text-start` | Align text to start |
| `text-right` | `text-end` | Align text to end |

### Positioning
| ❌ Avoid | ✅ Use | Description |
|---------|--------|-------------|
| `left-0` | `start-0` | Position at start |
| `right-0` | `end-0` | Position at end |
| `left-4` | `start-4` | Start offset |
| `right-4` | `end-4` | End offset |

### Border Radius
| ❌ Avoid | ✅ Use | Description |
|---------|--------|-------------|
| `rounded-l-lg` | `rounded-s-lg` | Round start corners |
| `rounded-r-lg` | `rounded-e-lg` | Round end corners |
| `rounded-tl-lg` | `rounded-ss-lg` | Round top-start corner |
| `rounded-tr-lg` | `rounded-se-lg` | Round top-end corner |
| `rounded-bl-lg` | `rounded-es-lg` | Round bottom-start corner |
| `rounded-br-lg` | `rounded-ee-lg` | Round bottom-end corner |

## 📱 Mobile-First Breakpoints (In Order)

```tsx
// ✅ CORRECT ORDER: Mobile → Desktop
<div className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-14">

// ❌ WRONG ORDER: Desktop → Mobile (NEVER DO THIS)
<div className="p-14 2xl:p-12 xl:p-10 lg:p-8 md:p-6 sm:p-4">
```

| Breakpoint | Size | Description |
|-----------|------|-------------|
| **base** | 0-640px | Mobile (default, no prefix) |
| `sm:` | 640px+ | Large mobile / Small tablet |
| `md:` | 768px+ | Tablet |
| `lg:` | 1024px+ | Laptop |
| `xl:` | 1280px+ | Desktop |
| `2xl:` | 1536px+ | Large desktop |

## 🎨 Common Responsive Patterns

### Container
```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
```

### Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Flex Direction
```tsx
<div className="flex flex-col sm:flex-row gap-4">
```

### Typography
```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
<p className="text-sm sm:text-base md:text-lg">
```

### Spacing
```tsx
<div className="p-4 sm:p-6 md:p-8">         {/* Padding */}
<div className="mt-4 sm:mt-6 md:mt-8">       {/* Margin top */}
<div className="gap-2 sm:gap-4 lg:gap-6">   {/* Gap */}
```

## 🔄 RTL Component Setup

### 1. Import & Detect RTL
```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
const isRTL = i18n.language === 'ar';
```

### 2. Set Direction
```tsx
<div dir={isRTL ? 'rtl' : 'ltr'}>
```

### 3. Flip Icons
```tsx
import { ChevronRight, ArrowRight } from 'lucide-react';

<ChevronRight className={isRTL ? 'rotate-180' : ''} />
<ArrowRight className={isRTL ? 'rotate-180' : ''} />
```

### 4. Conditional Ordering
```tsx
<div className="flex gap-2">
  <span className={isRTL ? 'order-2' : 'order-1'}>{t('label')}</span>
  <Icon className={isRTL ? 'order-1' : 'order-2'} />
</div>
```

### 5. Conditional Transforms
```tsx
<div className={`transform transition ${
  isRTL ? '-translate-x-4' : 'translate-x-4'
}`}>
```

## ✅ Complete Component Template

```tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export function MyComponent() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Responsive heading */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl text-start mb-4">
        {t('title')}
      </h1>

      {/* Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Content */}
      </div>

      {/* RTL-aware button */}
      <Button className="h-11 px-4 sm:px-6">
        <span className={isRTL ? 'order-2' : 'order-1'}>
          {t('action')}
        </span>
        <ChevronRight
          className={`
            ${isRTL ? 'order-1 me-2 rotate-180' : 'order-2 ms-2'}
            h-4 w-4
          `}
        />
      </Button>
    </div>
  );
}
```

## 🔍 Finding RTL Issues

### Scan for Problems
```bash
# Find hard-coded directional classes
grep -r "ml-\|mr-\|pl-\|pr-\|text-left\|text-right" frontend/src
```

### Run Linter
```bash
cd frontend
npm run lint
```

ESLint will catch and report RTL violations:
```
⚠️ RTL: Use "ms-*" (margin-start) instead of "ml-*"
⚠️ RTL: Use "text-start" instead of "text-left"
```

## 📏 Touch Target Sizes

Minimum touch-friendly sizes:
```tsx
<Button className="min-h-11 min-w-11">  {/* 44x44px minimum */}
<Input className="h-11">                 {/* 44px height */}
```

## 🌍 Number & Date Formatting

### Numbers
```tsx
const formatted = new Intl.NumberFormat(i18n.language).format(12345);
// English: "12,345"
// Arabic: "١٢٬٣٤٥"
```

### Dates
```tsx
const formatted = new Intl.DateTimeFormat(i18n.language).format(new Date());
// Automatically formats for locale
```

---

**Pro Tip**: ESLint will now catch RTL violations automatically! Just run `npm run lint` to find issues.
