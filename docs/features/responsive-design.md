# Responsive Design System

## Overview

The GASTAT International Dossier System implements a comprehensive responsive design compliance system that ensures consistent ultra-thin design language across all devices from 320px to 1440px viewports. The system enforces component validation, responsive breakpoints, and progressive disclosure patterns while maintaining WCAG 2.1 Level AA accessibility and bilingual (Arabic/English) support.

## Core Features

### 🎯 Design Compliance
- Real-time component validation during development
- Automated compliance checking against design system rules
- Performance monitoring to ensure <500ms validation times
- Visual indicators for non-compliant components

### 📱 Responsive Breakpoints
- **Mobile (xs)**: 320px - 767px
- **Tablet (sm)**: 768px - 1023px  
- **Desktop (md)**: 1024px - 1439px
- **Wide (lg)**: 1440px+

### 🌍 Internationalization
- Full RTL/LTR support with CSS logical properties
- Arabic and English language support
- Direction-aware components and layouts
- Bilingual validation messages

### ♿ Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Minimum 44x44px touch targets
- High contrast mode support

## Architecture

### Component Registry
The system uses shadcn/ui components as a foundation with a centralized registry for tracking and validating components:

```typescript
interface ComponentRegistry {
  name: string;
  version: string;
  source: 'shadcn' | 'custom';
  category: ComponentCategory;
  variants: ComponentVariant[];
  validation: ValidationRule[];
}
```

### Design Tokens
Design tokens provide a single source of truth for visual properties:

```typescript
interface DesignToken {
  id: string;
  category: TokenCategory;
  value: string;
  cssVariable: string;
  fallback?: string;
}
```

### Validation System
Components are validated against a set of rules for responsive behavior, accessibility, and design compliance:

```typescript
interface ValidationRule {
  ruleType: 'responsive' | 'accessibility' | 'rtl' | 'performance';
  severity: 'error' | 'warning' | 'info';
  message: string;
  autoFix?: boolean;
}
```

## Implementation Guide

### 1. Setting Up Responsive Hooks

#### useResponsive Hook
Detects current viewport and provides responsive utilities:

```typescript
import { useResponsive } from '@/hooks/use-responsive';

function MyComponent() {
  const { viewport, isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  
  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  );
}
```

#### useBreakpoint Hook
Check if viewport meets minimum breakpoint:

```typescript
import { useBreakpoint } from '@/hooks/use-responsive';

function MyComponent() {
  const isLargeScreen = useBreakpoint('lg');
  
  return isLargeScreen ? <WideView /> : <StandardView />;
}
```

### 2. Design Compliance Provider

Wrap your application with the DesignComplianceProvider:

```typescript
import { DesignComplianceProvider } from '@/providers/design-compliance-provider';

function App() {
  return (
    <DesignComplianceProvider 
      enableValidation={process.env.NODE_ENV === 'development'}
      cacheTimeout={5 * 60 * 1000}
    >
      <YourApp />
    </DesignComplianceProvider>
  );
}
```

### 3. Using Responsive Components

#### ResponsiveCard
Adaptive card with progressive disclosure:

```typescript
import { ResponsiveCard } from '@/components/responsive/responsive-card';

<ResponsiveCard
  title="Dashboard Metrics"
  description="Key performance indicators"
  collapsible={true}
  priority="high"
  mobileLayout="stack"
>
  <MetricsContent />
</ResponsiveCard>
```

#### ResponsiveTable
Table that transforms to cards on mobile:

```typescript
import { ResponsiveTable } from '@/components/responsive/responsive-table';

<ResponsiveTable
  data={tableData}
  columns={[
    {
      key: 'name',
      header: 'Name',
      accessor: item => item.name,
      priority: 'high',
      hideOnMobile: false
    }
  ]}
  mobileView="card"
/>
```

#### ResponsiveNav
Navigation with mobile menu:

```typescript
import { ResponsiveNav } from '@/components/responsive/responsive-nav';

<ResponsiveNav
  items={[
    { id: 'home', label: 'Home', href: '/', priority: 'high' },
    { id: 'about', label: 'About', href: '/about' }
  ]}
  logo={<Logo />}
  mobileBreakpoint="md"
/>
```

### 4. Design Tokens Usage

#### Loading Tokens
```typescript
import { useDesignTokens } from '@/hooks/use-design-tokens';

function ThemedComponent() {
  const { tokens, getTokenValue, applyTokens } = useDesignTokens('color');
  
  useEffect(() => {
    applyTokens(); // Apply to document root
  }, [tokens]);
  
  return (
    <div style={{ 
      color: `var(${getTokenValue('color-primary')})` 
    }}>
      Themed Content
    </div>
  );
}
```

#### Typography Scale
```typescript
import { useTypographyScale } from '@/hooks/use-design-tokens';

function TextComponent() {
  const scale = useTypographyScale();
  
  return (
    <p style={{ fontSize: scale.base }}>
      Base text size
    </p>
  );
}
```

### 5. RTL/LTR Support

#### Direction Hook
```typescript
import { useDirection } from '@/hooks/use-theme';

function BilingualComponent() {
  const { direction, isRTL, toggleDirection } = useDirection();
  
  return (
    <div dir={direction}>
      <button onClick={toggleDirection}>
        {isRTL ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
      </button>
    </div>
  );
}
```

#### CSS Logical Properties
Use logical properties for direction-aware spacing:

```css
/* Instead of margin-left/margin-right */
.component {
  margin-inline-start: 1rem; /* ms- in Tailwind */
  margin-inline-end: 1rem;   /* me- in Tailwind */
}

/* Instead of padding-left/padding-right */
.component {
  padding-inline-start: 1rem; /* ps- in Tailwind */
  padding-inline-end: 1rem;   /* pe- in Tailwind */
}
```

### 6. Component Validation

#### Manual Validation
```typescript
import { useComponentCompliance } from '@/hooks/use-compliance';

function ValidatedComponent() {
  const { ref, validate, isValid } = useComponentCompliance({
    componentName: 'MyComponent',
    validateOnMount: true
  });
  
  return (
    <div ref={ref}>
      {!isValid && <ValidationBadge componentName="MyComponent" />}
      <ComponentContent />
    </div>
  );
}
```

#### Validation Badge
Display compliance status:

```typescript
import { ValidationBadge } from '@/components/validation/validation-badge';

<ValidationBadge
  componentName="DataTable"
  showDetails={true}
  size="sm"
  position="floating"
/>
```

## API Endpoints

### Design Tokens
- `GET /api/design/tokens` - Fetch design tokens
- `POST /api/design/tokens` - Create/update token

### Component Registry
- `GET /api/components/registry` - Get registered components

### Validation
- `POST /api/validation/check` - Validate component compliance

### User Preferences
- `GET /api/preferences/responsive` - Get user preferences
- `PUT /api/preferences/responsive` - Update preferences

### Metrics
- `POST /api/metrics/performance` - Record performance metrics

## Performance Guidelines

### Validation Performance
- Target: <500ms for full page validation
- Use caching for repeated validations
- Validate in development only by default

### Render Performance
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load below-the-fold content

### Responsive Performance
- Debounce resize events
- Use CSS-based responsive solutions when possible
- Minimize JavaScript-based layout calculations

## Testing

### Unit Tests
```bash
npm run test:unit
```

Tests for:
- Responsive hooks
- Validation logic
- Token management
- Direction switching

### Accessibility Tests
```bash
npm run test:a11y
```

Validates:
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast

### Performance Tests
```bash
npm run test:performance
```

Benchmarks:
- Validation speed (<500ms)
- Component render time
- Theme switching performance
- Memory management

## Best Practices

### Mobile-First Development
1. Start with mobile styles
2. Enhance for larger screens
3. Test at all breakpoints
4. Use progressive disclosure

### Accessibility
1. Always provide ARIA labels
2. Ensure keyboard navigation
3. Test with screen readers
4. Maintain focus management

### Performance
1. Lazy load heavy components
2. Use React.memo strategically
3. Implement virtual scrolling
4. Cache validation results

### Internationalization
1. Use logical properties for spacing
2. Test both RTL and LTR layouts
3. Provide bilingual content
4. Validate in both directions

## Troubleshooting

### Common Issues

#### Components not responsive
- Check breakpoint configuration
- Verify useResponsive hook is imported
- Ensure responsive classes are applied

#### Validation failing
- Check component is registered
- Verify validation rules
- Review error messages for specifics

#### RTL layout issues
- Use logical properties instead of physical
- Test with Arabic content
- Check direction attribute on HTML element

#### Performance problems
- Enable caching
- Reduce validation frequency
- Profile with React DevTools
- Check for memory leaks

## Migration Guide

### From Static Components
1. Wrap with ResponsiveWrapper HOC
2. Add breakpoint-specific styles
3. Implement progressive disclosure
4. Add validation compliance

### From Custom Responsive System
1. Replace custom hooks with useResponsive
2. Update breakpoint values
3. Convert to design tokens
4. Add compliance validation

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)

---

*Last updated: 2025-09-29*