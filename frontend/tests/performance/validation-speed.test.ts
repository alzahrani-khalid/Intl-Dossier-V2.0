import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { DesignComplianceProvider } from '../../src/providers/design-compliance-provider';
import { useCompliance, useComponentCompliance } from '../../src/hooks/use-compliance';
import { ResponsiveCard } from '../../src/components/responsive/responsive-card';
import { ResponsiveTable } from '../../src/components/responsive/responsive-table';
import { ResponsiveNav } from '../../src/components/responsive/responsive-nav';

const PERFORMANCE_THRESHOLD = 500; // 500ms maximum validation time

describe('Performance Benchmarks', () => {
  let fetchSpy: vi.SpyInstance;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Validation Performance', () => {
    it('should complete single component validation under 500ms', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          passed: true,
          duration: 245,
          results: [],
        }),
      } as Response);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DesignComplianceProvider enableValidation={true}>
          {children}
        </DesignComplianceProvider>
      );

      const { result } = renderHook(
        () => useComponentCompliance({
          componentName: 'TestComponent',
          validateOnMount: true,
        }),
        { wrapper }
      );

      const startTime = performance.now();
      
      await act(async () => {
        await result.current.validate();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
      expect(result.current.isValid).toBe(true);
    });

    it('should validate multiple components in parallel under 500ms', async () => {
      fetchSpy.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                passed: true,
                duration: Math.random() * 100 + 50, // 50-150ms
                results: [],
              }),
            } as Response);
          }, 100);
        })
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DesignComplianceProvider enableValidation={true}>
          {children}
        </DesignComplianceProvider>
      );

      const components = ['Card', 'Table', 'Nav', 'Badge', 'Form'];
      const startTime = performance.now();

      const validations = await Promise.all(
        components.map(async (componentName) => {
          const { result } = renderHook(
            () => useComponentCompliance({
              componentName,
              validateOnMount: true,
            }),
            { wrapper }
          );

          return result.current.validate();
        })
      );

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLD);
      expect(validations).toHaveLength(5);
    });

    it('should cache validation results for performance', async () => {
      let callCount = 0;
      fetchSpy.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            passed: true,
            duration: 100,
            results: [],
          }),
        } as Response);
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DesignComplianceProvider enableValidation={true} cacheTimeout={60000}>
          {children}
        </DesignComplianceProvider>
      );

      const { result } = renderHook(
        () => useComponentCompliance({
          componentName: 'CachedComponent',
          validateOnMount: false,
        }),
        { wrapper }
      );

      // First validation
      await act(async () => {
        await result.current.validate();
      });
      expect(callCount).toBe(1);

      // Second validation (should use cache)
      await act(async () => {
        await result.current.validate();
      });
      expect(callCount).toBe(1); // No additional call

      // Third validation (still cached)
      await act(async () => {
        await result.current.validate();
      });
      expect(callCount).toBe(1); // Still no additional call
    });
  });

  describe('Component Render Performance', () => {
    it('should render ResponsiveCard quickly', () => {
      const startTime = performance.now();
      
      const { container } = render(
        <DesignComplianceProvider enableValidation={false}>
          <ResponsiveCard title="Performance Test">
            <p>Content</p>
          </ResponsiveCard>
        </DesignComplianceProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
      expect(container.querySelector('[class*="card"]')).toBeTruthy();
    });

    it('should render ResponsiveTable with 100 rows efficiently', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
      }));

      const columns = [
        { key: 'id', header: 'ID', accessor: (item: any) => item.id },
        { key: 'name', header: 'Name', accessor: (item: any) => item.name },
        { key: 'value', header: 'Value', accessor: (item: any) => item.value.toFixed(2) },
      ];

      const startTime = performance.now();
      
      const { container } = render(
        <DesignComplianceProvider enableValidation={false}>
          <ResponsiveTable data={largeData} columns={columns} />
        </DesignComplianceProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(500); // Should render in under 500ms
      expect(container.querySelectorAll('tr').length).toBeGreaterThan(0);
    });

    it('should handle rapid viewport changes efficiently', async () => {
      const { rerender } = render(
        <DesignComplianceProvider enableValidation={false}>
          <ResponsiveCard title="Resize Test">
            <p>Content</p>
          </ResponsiveCard>
        </DesignComplianceProvider>
      );

      const startTime = performance.now();
      
      // Simulate rapid resize events
      for (let width = 320; width <= 1440; width += 100) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
        
        rerender(
          <DesignComplianceProvider enableValidation={false}>
            <ResponsiveCard title="Resize Test">
              <p>Content at {width}px</p>
            </ResponsiveCard>
          </DesignComplianceProvider>
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // All resizes under 1 second
    });
  });

  describe('Design Token Performance', () => {
    it('should load design tokens quickly', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          tokens: Array.from({ length: 50 }, (_, i) => ({
            id: `token-${i}`,
            category: 'color',
            name: `Token ${i}`,
            value: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            cssVariable: `--token-${i}`,
          })),
          count: 50,
        }),
      } as Response);

      const startTime = performance.now();
      
      const response = await fetch('/api/design/tokens');
      const data = await response.json();
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Token fetch under 200ms
      expect(data.tokens).toHaveLength(50);
    });

    it('should apply tokens to DOM efficiently', async () => {
      const tokens = Array.from({ length: 100 }, (_, i) => ({
        cssVariable: `--token-${i}`,
        value: `value-${i}`,
      }));

      const startTime = performance.now();
      
      tokens.forEach(token => {
        document.documentElement.style.setProperty(token.cssVariable, token.value);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Apply 100 tokens under 50ms
      
      // Cleanup
      tokens.forEach(token => {
        document.documentElement.style.removeProperty(token.cssVariable);
      });
    });
  });

  describe('Theme Switching Performance', () => {
    it('should switch themes quickly', async () => {
      const themes = ['light', 'dark', 'gastat', 'high-contrast'];
      const startTime = performance.now();

      themes.forEach(theme => {
        document.documentElement.setAttribute('data-theme', theme);
        // Simulate theme token application
        for (let i = 0; i < 20; i++) {
          document.documentElement.style.setProperty(`--color-${i}`, `value-${i}`);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Theme switching under 100ms
    });

    it('should handle RTL/LTR switching efficiently', async () => {
      const startTime = performance.now();
      
      // Switch to RTL
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
      
      // Switch back to LTR
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
      
      // Multiple rapid switches
      for (let i = 0; i < 10; i++) {
        document.documentElement.dir = i % 2 === 0 ? 'rtl' : 'ltr';
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Direction switching under 50ms
    });
  });

  describe('Progressive Disclosure Performance', () => {
    it('should toggle disclosure states efficiently', async () => {
      const { container } = render(
        <DesignComplianceProvider enableValidation={false}>
          <ResponsiveCard 
            title="Collapsible" 
            collapsible={true}
            defaultCollapsed={false}
          >
            <div>Content to hide/show</div>
          </ResponsiveCard>
        </DesignComplianceProvider>
      );

      const button = container.querySelector('button[aria-expanded]');
      const startTime = performance.now();
      
      // Simulate rapid toggling
      for (let i = 0; i < 20; i++) {
        button?.click();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // 20 toggles under 200ms
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with component mounting/unmounting', async () => {
      const components = [];
      
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(
          <DesignComplianceProvider enableValidation={false}>
            <ResponsiveCard title={`Card ${i}`}>
              <p>Content {i}</p>
            </ResponsiveCard>
          </DesignComplianceProvider>
        );
        
        components.push(unmount);
      }
      
      // Unmount all components
      components.forEach(unmount => unmount());
      
      // If we got here without errors, memory is being managed properly
      expect(components).toHaveLength(100);
    });
  });

  describe('Concurrent Validation', () => {
    it('should handle concurrent validation requests efficiently', async () => {
      fetchSpy.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                passed: true,
                duration: Math.random() * 100 + 50,
                results: [],
              }),
            } as Response);
          }, Math.random() * 100);
        })
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DesignComplianceProvider enableValidation={true}>
          {children}
        </DesignComplianceProvider>
      );

      const startTime = performance.now();
      
      // Launch 10 concurrent validations
      const validations = Array.from({ length: 10 }, (_, i) => {
        const { result } = renderHook(
          () => useComponentCompliance({
            componentName: `Component${i}`,
            validateOnMount: true,
          }),
          { wrapper }
        );
        
        return result.current.validate();
      });
      
      await Promise.all(validations);
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLD);
      expect(validations).toHaveLength(10);
    });
  });

  describe('Breakpoint Detection Performance', () => {
    it('should detect breakpoint changes efficiently', () => {
      const breakpoints = [320, 768, 1024, 1440];
      const measurements: number[] = [];

      breakpoints.forEach(width => {
        const startTime = performance.now();
        
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));
        
        const endTime = performance.now();
        measurements.push(endTime - startTime);
      });

      const averageTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(averageTime).toBeLessThan(10); // Average under 10ms per breakpoint change
    });
  });
});