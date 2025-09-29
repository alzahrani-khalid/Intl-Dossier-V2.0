# Quick Start: Responsive Design Compliance

**Feature**: Responsive Design Compliance and Assurance
**Time to Complete**: 15 minutes
**Prerequisites**: Node.js 18+, npm, existing Intl-Dossier project

## Overview
This guide will help you set up and use the responsive design compliance system with shadcn components in your application.

## 1. Installation (2 minutes)

### Install Required Dependencies
```bash
# Core responsive design dependencies
npm install @shadcn/ui tailwindcss @headlessui/react clsx tailwind-merge

# Development dependencies
npm install -D eslint-plugin-tailwindcss @types/node
```

### Update Tailwind Configuration
```javascript
// tailwind.config.ts
export default {
  content: [
    './frontend/src/**/*.{ts,tsx}',
    './node_modules/@shadcn/**/*.js'
  ],
  theme: {
    screens: {
      'xs': '320px',    // Mobile minimum
      'sm': '768px',    // Tablet
      'md': '1024px',   // Desktop
      'lg': '1440px',   // Wide screen
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            fontSize: {
              'xs': '12px',
              'sm': '14px',
              'base': '16px',
              'lg': '20px',
              'xl': '24px',
              '2xl': '32px',
            }
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-rtl'),
  ],
}
```

## 2. Component Registry Setup (3 minutes)

### Initialize Registry
```bash
# Create components.json if not exists
npx shadcn@latest init

# Add essential responsive components
npx shadcn@latest add card button dialog sheet
```

### Configure components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "frontend/src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## 3. Design Tokens Implementation (3 minutes)

### Create Token System
```css
/* frontend/src/styles/globals.css */
@layer base {
  :root {
    /* Responsive breakpoints */
    --breakpoint-xs: 320px;
    --breakpoint-sm: 768px;
    --breakpoint-md: 1024px;
    --breakpoint-lg: 1440px;

    /* Typography scale */
    --text-xs: 12px;
    --text-sm: 14px;
    --text-base: 16px;
    --text-lg: 20px;
    --text-xl: 24px;
    --text-2xl: 32px;

    /* Spacing scale (ultra-thin) */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 0.75rem;
    --spacing-lg: 1rem;
    --spacing-xl: 1.5rem;
  }

  /* RTL support */
  [dir="rtl"] {
    direction: rtl;
  }
}
```

### Create Responsive Hook
```typescript
// frontend/src/hooks/use-responsive.ts
import { useEffect, useState } from 'react';

const BREAKPOINTS = {
  xs: 320,
  sm: 768,
  md: 1024,
  lg: 1440,
};

export function useResponsive() {
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop');
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWidth(w);

      if (w < BREAKPOINTS.sm) setViewport('mobile');
      else if (w < BREAKPOINTS.md) setViewport('tablet');
      else if (w < BREAKPOINTS.lg) setViewport('desktop');
      else setViewport('wide');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { viewport, width, breakpoints: BREAKPOINTS };
}
```

## 4. Component Validation Setup (3 minutes)

### Create Validation Provider
```typescript
// frontend/src/providers/design-compliance-provider.tsx
import React, { createContext, useContext, useEffect } from 'react';

interface ComplianceContext {
  validateComponent: (name: string) => Promise<boolean>;
  isValidating: boolean;
}

const ComplianceContext = createContext<ComplianceContext | null>(null);

export function DesignComplianceProvider({ children }: { children: React.ReactNode }) {
  const validateComponent = async (name: string) => {
    // In development, validate against registry
    if (process.env.NODE_ENV === 'development') {
      const response = await fetch('/api/validation/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: name,
          viewport: window.innerWidth,
          theme: document.documentElement.getAttribute('data-theme'),
          language: document.documentElement.lang,
        }),
      });

      const result = await response.json();
      if (!result.passed && result.duration > 500) {
        console.warn(`Validation took ${result.duration}ms (limit: 500ms)`);
      }
      return result.passed;
    }
    return true;
  };

  return (
    <ComplianceContext.Provider value={{ validateComponent, isValidating: false }}>
      {children}
    </ComplianceContext.Provider>
  );
}

export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (!context) throw new Error('useCompliance must be used within DesignComplianceProvider');
  return context;
};
```

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: ['plugin:tailwindcss/recommended'],
  rules: {
    'tailwindcss/no-custom-classname': 'warn',
    'tailwindcss/classnames-order': 'warn',
    'tailwindcss/enforces-negative-arbitrary-values': 'warn',
  },
};
```

## 5. Responsive Component Example (2 minutes)

### Create Responsive Card
```typescript
// frontend/src/components/responsive/responsive-card.tsx
import { Card } from '@/components/ui/card';
import { useResponsive } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
}

export function ResponsiveCard({ children, className, collapsible }: ResponsiveCardProps) {
  const { viewport } = useResponsive();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Progressive disclosure for mobile
  const showCollapsed = collapsible && viewport === 'mobile';

  return (
    <Card
      className={cn(
        // Base styles
        'transition-all duration-200',
        // Responsive padding
        'p-2 sm:p-4 md:p-6',
        // Typography scale
        'text-sm sm:text-base',
        // Ultra-thin borders
        'border-[0.5px]',
        className
      )}
    >
      {showCollapsed ? (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-start"
          aria-expanded={!isCollapsed}
        >
          <div className="flex justify-between items-center">
            <span>{/* Summary content */}</span>
            <span>{isCollapsed ? '▼' : '▶'}</span>
          </div>
        </button>
      ) : null}

      <div className={cn(
        showCollapsed && isCollapsed && 'hidden'
      )}>
        {children}
      </div>
    </Card>
  );
}
```

## 6. Testing Responsive Behavior (2 minutes)

### Create Test Suite
```typescript
// frontend/tests/responsive.test.tsx
import { render, screen } from '@testing-library/react';
import { ResponsiveCard } from '@/components/responsive/responsive-card';

describe('Responsive Design Compliance', () => {
  it('renders at mobile viewport (320px)', () => {
    window.innerWidth = 320;
    render(<ResponsiveCard>Content</ResponsiveCard>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders at tablet viewport (768px)', () => {
    window.innerWidth = 768;
    render(<ResponsiveCard>Content</ResponsiveCard>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders at desktop viewport (1024px)', () => {
    window.innerWidth = 1024;
    render(<ResponsiveCard>Content</ResponsiveCard>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('supports RTL direction', () => {
    document.documentElement.dir = 'rtl';
    render(<ResponsiveCard>محتوى</ResponsiveCard>);
    expect(screen.getByText('محتوى')).toBeInTheDocument();
  });
});
```

### Run Tests
```bash
npm run test:responsive
```

## 7. Quick Verification (2 minutes)

### Browser Testing
1. Open application in Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these viewports:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1024px)
   - Wide (1440px)

### Validation Check
```bash
# Run design compliance validation
curl -X POST http://localhost:3000/api/validation/check \
  -H "Content-Type: application/json" \
  -d '{
    "componentName": "Card",
    "viewport": 320,
    "theme": "light",
    "language": "en"
  }'
```

Expected response:
```json
{
  "passed": true,
  "duration": 245,
  "results": []
}
```

## Common Issues & Solutions

### Issue 1: Components not responsive
**Solution**: Ensure Tailwind responsive prefixes are used (sm:, md:, lg:)

### Issue 2: RTL layout broken
**Solution**: Use logical properties (ps- instead of pl-, me- instead of mr-)

### Issue 3: Validation exceeds 500ms
**Solution**: Check for inefficient selectors or heavy computations

### Issue 4: Typography too small on mobile
**Solution**: Use responsive text utilities (text-sm sm:text-base)

## Next Steps

1. **Extend Registry**: Add more shadcn components
2. **Custom Themes**: Create organization-specific themes
3. **Performance Monitoring**: Set up metrics collection
4. **Accessibility Testing**: Run automated WCAG audits
5. **Documentation**: Document custom component patterns

## Support Resources

- [Shadcn Documentation](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- Internal Slack: #responsive-design

---
*Quick start complete! Your application now has responsive design compliance.*