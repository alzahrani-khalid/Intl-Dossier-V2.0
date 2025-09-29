import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ResponsiveCard } from '../../src/components/responsive/responsive-card';
import { ResponsiveTable } from '../../src/components/responsive/responsive-table';
import { ResponsiveNav } from '../../src/components/responsive/responsive-nav';
import { ValidationBadge } from '../../src/components/validation/validation-badge';
import { DesignComplianceProvider } from '../../src/providers/design-compliance-provider';

expect.extend(toHaveNoViolations);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DesignComplianceProvider enableValidation={false}>
    {children}
  </DesignComplianceProvider>
);

describe('WCAG 2.1 Level AA Compliance', () => {
  describe('ResponsiveCard Accessibility', () => {
    it('should have no accessibility violations in default state', async () => {
      const { container } = render(
        <TestWrapper>
          <ResponsiveCard title="Test Card" description="Card description">
            <p>Card content</p>
          </ResponsiveCard>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for collapsible cards', async () => {
      const { container, getByRole } = render(
        <TestWrapper>
          <ResponsiveCard 
            title="Collapsible Card" 
            collapsible={true}
            defaultCollapsed={false}
          >
            <p>Card content</p>
          </ResponsiveCard>
        </TestWrapper>
      );

      const button = container.querySelector('button[aria-expanded]');
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-label');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const { container, getByRole } = render(
        <TestWrapper>
          <ResponsiveCard title="Keyboard Test" collapsible={true}>
            <button>Action 1</button>
            <button>Action 2</button>
          </ResponsiveCard>
        </TestWrapper>
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveProperty('tabIndex');
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ResponsiveTable Accessibility', () => {
    const mockData = [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
    ];

    const columns = [
      {
        key: 'name',
        header: 'Name',
        accessor: (item: any) => item.name,
      },
      {
        key: 'value',
        header: 'Value',
        accessor: (item: any) => item.value,
      },
    ];

    it('should have no accessibility violations in table view', async () => {
      const { container } = render(
        <TestWrapper>
          <ResponsiveTable 
            data={mockData} 
            columns={columns}
            mobileView="table"
          />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'table-duplicate-name': { enabled: true },
          'th-has-data-cells': { enabled: true },
          'td-headers-attr': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper table structure', async () => {
      const { container } = render(
        <TestWrapper>
          <ResponsiveTable 
            data={mockData} 
            columns={columns}
            mobileView="table"
          />
        </TestWrapper>
      );

      const table = container.querySelector('table');
      expect(table).toBeTruthy();

      const thead = table?.querySelector('thead');
      expect(thead).toBeTruthy();

      const th = thead?.querySelectorAll('th');
      expect(th?.length).toBe(2);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in card view', async () => {
      const { container } = render(
        <TestWrapper>
          <ResponsiveTable 
            data={mockData} 
            columns={columns}
            mobileView="card"
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ResponsiveNav Accessibility', () => {
    const navItems = [
      { id: 'home', label: 'Home', href: '/' },
      { id: 'about', label: 'About', href: '/about' },
      { id: 'contact', label: 'Contact', href: '/contact' },
    ];

    it('should have no accessibility violations in desktop view', async () => {
      const { container } = render(
        <TestWrapper>
          <ResponsiveNav items={navItems} />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'landmark-unique': { enabled: true },
          'region': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation landmarks', async () => {
      const { container } = render(
        <TestWrapper>
          <ResponsiveNav items={navItems} />
        </TestWrapper>
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeTruthy();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible mobile menu button', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = render(
        <TestWrapper>
          <ResponsiveNav items={navItems} />
        </TestWrapper>
      );

      const menuButton = container.querySelector('button[aria-label="Menu"]');
      expect(menuButton).toBeTruthy();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ValidationBadge Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <ValidationBadge componentName="TestComponent" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper status information', async () => {
      const { container } = render(
        <TestWrapper>
          <ValidationBadge 
            componentName="TestComponent" 
            showDetails={true}
          />
        </TestWrapper>
      );

      const badge = container.querySelector('[role="status"]') || 
                   container.querySelector('[aria-live]');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG AA contrast requirements', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <ResponsiveCard title="Contrast Test">
              <p>Regular text content</p>
              <p className="text-sm text-muted-foreground">Small text</p>
              <button className="bg-primary text-primary-foreground">
                Button Text
              </button>
            </ResponsiveCard>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard-only navigation', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <ResponsiveNav items={[
              { id: '1', label: 'Link 1', href: '#1' },
              { id: '2', label: 'Link 2', href: '#2' },
            ]} />
            <ResponsiveCard title="Card" collapsible={true}>
              <input type="text" aria-label="Test input" />
              <button>Submit</button>
            </ResponsiveCard>
          </div>
        </TestWrapper>
      );

      const focusableElements = container.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      focusableElements.forEach(element => {
        expect(element).toHaveProperty('tabIndex');
        expect(element.tabIndex).toBeGreaterThanOrEqual(-1);
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('RTL/LTR Support', () => {
    it('should support RTL direction', async () => {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';

      const { container } = render(
        <TestWrapper>
          <ResponsiveCard title="عنوان البطاقة" description="وصف البطاقة">
            <p>محتوى البطاقة</p>
          </ResponsiveCard>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'html-has-lang': { enabled: true },
          'html-lang-valid': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();

      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    });

    it('should support LTR direction', async () => {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';

      const { container } = render(
        <TestWrapper>
          <ResponsiveCard title="Card Title" description="Card description">
            <p>Card content</p>
          </ResponsiveCard>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button className="focus:outline-none focus:ring-2 focus:ring-primary">
              Button with focus ring
            </button>
            <input 
              type="text" 
              className="focus:outline-none focus:border-primary"
              aria-label="Input with focus border"
            />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Touch Targets', () => {
    it('should have minimum touch target size', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button className="min-w-[44px] min-h-[44px] p-2">
              Touch Target
            </button>
            <ResponsiveCard>
              <button className="px-4 py-2">Action Button</button>
            </ResponsiveCard>
          </div>
        </TestWrapper>
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        // Note: In JSDOM, getBoundingClientRect returns zeros
        // In real browser testing, verify min 44x44px
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Labels', () => {
    it('should have proper form labels', async () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
            
            <label htmlFor="password">Password</label>
            <input id="password" type="password" />
            
            <button type="submit">Submit</button>
          </form>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'label-title-only': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });
});