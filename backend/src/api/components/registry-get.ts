import { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ComponentRegistry {
  name: string;
  version: string;
  source: 'shadcn' | 'custom';
  category: 'layout' | 'form' | 'display' | 'feedback' | 'navigation' | 'overlay';
  path: string;
  dependencies: string[];
  variants?: ComponentVariant[];
  validation?: ValidationRule[];
  documentation?: string;
  examples?: CodeExample[];
  createdAt: Date;
  updatedAt: Date;
}

interface ComponentVariant {
  id: string;
  componentName: string;
  variant: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  props: Record<string, any>;
  className?: string;
  rtlSupport: boolean;
}

interface ValidationRule {
  id: string;
  ruleType: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface CodeExample {
  title: string;
  code: string;
  language: string;
}

const MOCK_REGISTRY: ComponentRegistry[] = [
  {
    name: 'button',
    version: '1.0.0',
    source: 'shadcn',
    category: 'form',
    path: '@/components/ui/button',
    dependencies: ['clsx', 'tailwind-merge'],
    variants: [
      {
        id: 'button-primary',
        componentName: 'button',
        variant: 'primary',
        props: {},
        className: 'bg-primary text-primary-foreground hover:bg-primary/90',
        rtlSupport: true,
      },
      {
        id: 'button-secondary',
        componentName: 'button',
        variant: 'secondary',
        props: {},
        className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        rtlSupport: true,
      },
      {
        id: 'button-ghost',
        componentName: 'button',
        variant: 'ghost',
        props: {},
        className: 'hover:bg-accent hover:text-accent-foreground',
        rtlSupport: true,
      }
    ],
    validation: [
      {
        id: 'button-min-size',
        ruleType: 'accessibility',
        severity: 'error',
        message: 'Button must have minimum touch target of 44x44px',
      },
      {
        id: 'button-aria-label',
        ruleType: 'accessibility',
        severity: 'warning',
        message: 'Icon-only buttons must have aria-label',
      }
    ],
    documentation: 'https://ui.shadcn.com/docs/components/button',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'card',
    version: '1.0.0',
    source: 'shadcn',
    category: 'layout',
    path: '@/components/ui/card',
    dependencies: ['clsx', 'tailwind-merge'],
    variants: [
      {
        id: 'card-default',
        componentName: 'card',
        variant: 'default',
        props: {},
        className: 'rounded-lg border bg-card text-card-foreground shadow-sm',
        rtlSupport: true,
      }
    ],
    validation: [
      {
        id: 'card-responsive',
        ruleType: 'responsive',
        severity: 'info',
        message: 'Card should adapt padding based on viewport',
      }
    ],
    documentation: 'https://ui.shadcn.com/docs/components/card',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'dialog',
    version: '1.0.0',
    source: 'shadcn',
    category: 'overlay',
    path: '@/components/ui/dialog',
    dependencies: ['@radix-ui/react-dialog', 'clsx', 'tailwind-merge'],
    variants: [
      {
        id: 'dialog-default',
        componentName: 'dialog',
        variant: 'default',
        props: {},
        className: 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
        rtlSupport: true,
      }
    ],
    validation: [
      {
        id: 'dialog-focus-trap',
        ruleType: 'accessibility',
        severity: 'error',
        message: 'Dialog must trap focus when open',
      },
      {
        id: 'dialog-escape-key',
        ruleType: 'accessibility',
        severity: 'error',
        message: 'Dialog must close on ESC key',
      }
    ],
    documentation: 'https://ui.shadcn.com/docs/components/dialog',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'input',
    version: '1.0.0',
    source: 'shadcn',
    category: 'form',
    path: '@/components/ui/input',
    dependencies: ['clsx', 'tailwind-merge'],
    variants: [
      {
        id: 'input-default',
        componentName: 'input',
        variant: 'default',
        props: {},
        className: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
        rtlSupport: true,
      }
    ],
    validation: [
      {
        id: 'input-label',
        ruleType: 'accessibility',
        severity: 'error',
        message: 'Input must have associated label',
      }
    ],
    documentation: 'https://ui.shadcn.com/docs/components/input',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'table',
    version: '1.0.0',
    source: 'shadcn',
    category: 'display',
    path: '@/components/ui/table',
    dependencies: ['clsx', 'tailwind-merge'],
    variants: [
      {
        id: 'table-default',
        componentName: 'table',
        variant: 'default',
        props: {},
        className: 'w-full caption-bottom text-sm',
        rtlSupport: true,
      }
    ],
    validation: [
      {
        id: 'table-responsive',
        ruleType: 'responsive',
        severity: 'error',
        message: 'Table must be horizontally scrollable on mobile',
      },
      {
        id: 'table-headers',
        ruleType: 'accessibility',
        severity: 'error',
        message: 'Table must have proper th elements',
      }
    ],
    documentation: 'https://ui.shadcn.com/docs/components/table',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export async function getComponentRegistry(req: Request, res: Response) {
  try {
    const { category, source } = req.query;
    
    let components = [...MOCK_REGISTRY];
    
    if (category && typeof category === 'string') {
      components = components.filter(c => c.category === category);
    }
    
    if (source && typeof source === 'string') {
      components = components.filter(c => c.source === source);
    }
    
    try {
      const componentsJsonPath = path.join(process.cwd(), 'frontend', 'components.json');
      const componentsJson = await fs.readFile(componentsJsonPath, 'utf-8');
      const config = JSON.parse(componentsJson);
      
      if (config.aliases?.components) {
        components.forEach(component => {
          component.path = config.aliases.components + '/' + component.name;
        });
      }
    } catch (error) {
      console.log('components.json not found, using default paths');
    }
    
    return res.json({
      components,
      count: components.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching component registry:', error);
    return res.status(500).json({
      error: 'Failed to fetch component registry'
    });
  }
}