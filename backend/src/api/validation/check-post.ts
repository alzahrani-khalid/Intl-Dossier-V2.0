import { Request, Response } from 'express';

interface ValidationRequest {
  componentName: string;
  html?: string;
  viewport: number;
  theme: string;
  language: 'ar' | 'en';
  direction?: 'ltr' | 'rtl';
}

interface ValidationResult {
  id: string;
  ruleId: string;
  componentName: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  context?: any;
  suggestion?: string;
  autoFixed?: boolean;
}

const VALIDATION_RULES = {
  responsive: [
    {
      id: 'min-viewport',
      check: (viewport: number) => viewport >= 320,
      severity: 'error' as const,
      message: 'Component must support minimum viewport of 320px',
    },
    {
      id: 'breakpoint-compliance',
      check: (viewport: number) => [320, 768, 1024, 1440].some(bp => Math.abs(viewport - bp) < 50),
      severity: 'info' as const,
      message: 'Component should be tested at standard breakpoints',
    },
  ],
  accessibility: [
    {
      id: 'aria-labels',
      check: (html: string, language: string) => {
        if (!html) return true;
        const hasButtons = html.includes('<button');
        const hasAriaLabel = html.includes('aria-label');
        return !hasButtons || hasAriaLabel;
      },
      severity: 'warning' as const,
      message: 'Interactive elements should have ARIA labels',
    },
    {
      id: 'focus-visible',
      check: (html: string) => {
        if (!html) return true;
        const hasInteractive = /<(button|input|select|textarea|a)/i.test(html);
        const hasFocusStyles = /focus:|focus-visible:/i.test(html);
        return !hasInteractive || hasFocusStyles;
      },
      severity: 'warning' as const,
      message: 'Interactive elements should have visible focus styles',
    },
  ],
  rtl: [
    {
      id: 'logical-properties',
      check: (html: string, direction: string) => {
        if (!html || direction !== 'rtl') return true;
        const hasPhysical = /(margin-left|margin-right|padding-left|padding-right|left:|right:)/i.test(html);
        const hasLogical = /(ms-|me-|ps-|pe-|start|end)/i.test(html);
        return !hasPhysical || hasLogical;
      },
      severity: 'info' as const,
      message: 'Use logical properties for RTL support',
    },
  ],
  performance: [
    {
      id: 'validation-speed',
      check: (duration: number) => duration < 500,
      severity: 'warning' as const,
      message: 'Validation should complete within 500ms',
    },
  ],
};

export async function validateComponent(req: Request, res: Response) {
  const startTime = performance.now();
  
  try {
    const { 
      componentName, 
      html, 
      viewport, 
      theme, 
      language,
      direction = language === 'ar' ? 'rtl' : 'ltr'
    }: ValidationRequest = req.body;
    
    if (!componentName) {
      return res.status(400).json({
        error: 'Component name is required'
      });
    }
    
    const results: ValidationResult[] = [];
    
    // Run responsive validation
    VALIDATION_RULES.responsive.forEach(rule => {
      const passed = rule.check(viewport);
      if (!passed) {
        results.push({
          id: `resp-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          componentName,
          passed: false,
          severity: rule.severity,
          message: rule.message,
          context: { viewport },
        });
      }
    });
    
    // Run accessibility validation
    VALIDATION_RULES.accessibility.forEach(rule => {
      const passed = rule.check(html || '', language);
      if (!passed) {
        results.push({
          id: `a11y-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          componentName,
          passed: false,
          severity: rule.severity,
          message: rule.message,
          context: { language },
        });
      }
    });
    
    // Run RTL validation
    VALIDATION_RULES.rtl.forEach(rule => {
      const passed = rule.check(html || '', direction);
      if (!passed) {
        results.push({
          id: `rtl-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          componentName,
          passed: false,
          severity: rule.severity,
          message: rule.message,
          context: { direction },
          suggestion: 'Replace margin-left/right with ms-/me-, padding-left/right with ps-/pe-',
        });
      }
    });
    
    const duration = performance.now() - startTime;
    
    // Check validation performance
    VALIDATION_RULES.performance.forEach(rule => {
      const passed = rule.check(duration);
      if (!passed) {
        results.push({
          id: `perf-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          componentName,
          passed: false,
          severity: rule.severity,
          message: `${rule.message} (took ${duration.toFixed(0)}ms)`,
          context: { duration },
        });
      }
    });
    
    const hasErrors = results.some(r => r.severity === 'error');
    const passed = !hasErrors;
    
    return res.json({
      passed,
      duration: Math.round(duration),
      results,
      summary: {
        errors: results.filter(r => r.severity === 'error').length,
        warnings: results.filter(r => r.severity === 'warning').length,
        info: results.filter(r => r.severity === 'info').length,
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: 'Validation failed',
      duration: performance.now() - startTime,
    });
  }
}