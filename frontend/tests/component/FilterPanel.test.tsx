/**
 * Component Tests: FilterPanel
 *
 * Tests mobile Sheet vs desktop sidebar, filter selection, clear filters
 *
 * Task: T074 [P] [US5]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import FilterPanel from '../../src/components/waiting-queue/FilterPanel';

// Mock resize observer
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

describe('FilterPanel Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderFilterPanel = (props = {}) => {
    const defaultProps = {
      filters: {},
      onFiltersChange: vi.fn(),
      onClearFilters: vi.fn(),
      isOpen: true,
      onClose: vi.fn(),
      ...props
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <FilterPanel {...defaultProps} />
        </I18nextProvider>
      </QueryClientProvider>
    );
  };

  describe('Responsive Behavior', () => {
    it('should render as Sheet on mobile viewport (< 640px)', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderFilterPanel();

      // Sheet component should have mobile-specific attributes
      const container = screen.getByRole('dialog');
      expect(container).toBeInTheDocument();
    });

    it('should render as sidebar on desktop viewport (>= 640px)', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      renderFilterPanel();

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
    });

    it('should show close button on mobile', () => {
      global.innerWidth = 375;
      renderFilterPanel();

      const closeButton = screen.getByLabelText(/close/i);
      expect(closeButton).toBeInTheDocument();
    });

    it('should not show close button on desktop', () => {
      global.innerWidth = 1024;
      renderFilterPanel();

      const closeButton = screen.queryByLabelText(/close/i);
      expect(closeButton).toBeNull();
    });
  });

  describe('Filter Selection', () => {
    it('should render all filter sections', () => {
      renderFilterPanel();

      expect(screen.getByText(/priority/i)).toBeInTheDocument();
      expect(screen.getByText(/aging/i)).toBeInTheDocument();
      expect(screen.getByText(/type/i)).toBeInTheDocument();
      expect(screen.getByText(/assignee/i)).toBeInTheDocument();
    });

    it('should call onFiltersChange when priority is selected', async () => {
      const onFiltersChange = vi.fn();
      renderFilterPanel({ onFiltersChange });

      const highPriorityCheckbox = screen.getByLabelText(/high/i);
      fireEvent.click(highPriorityCheckbox);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ priority: 'high' })
        );
      });
    });

    it('should call onFiltersChange when aging is selected', async () => {
      const onFiltersChange = vi.fn();
      renderFilterPanel({ onFiltersChange });

      const aging7Plus = screen.getByLabelText(/7\+ days/i);
      fireEvent.click(aging7Plus);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ aging: '7+' })
        );
      });
    });

    it('should call onFiltersChange when type is selected', async () => {
      const onFiltersChange = vi.fn();
      renderFilterPanel({ onFiltersChange });

      const dossierCheckbox = screen.getByLabelText(/dossier/i);
      fireEvent.click(dossierCheckbox);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'dossier' })
        );
      });
    });

    it('should allow multiple filter selections', async () => {
      const onFiltersChange = vi.fn();
      renderFilterPanel({ onFiltersChange });

      const highPriority = screen.getByLabelText(/high/i);
      const aging7Plus = screen.getByLabelText(/7\+ days/i);

      fireEvent.click(highPriority);
      fireEvent.click(aging7Plus);

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            priority: 'high',
            aging: '7+'
          })
        );
      });
    });

    it('should show selected filter count', () => {
      renderFilterPanel({
        filters: { priority: 'high', aging: '7+' }
      });

      expect(screen.getByText(/2 filters applied/i)).toBeInTheDocument();
    });

    it('should update visual state when filters are selected', () => {
      renderFilterPanel({
        filters: { priority: 'high' }
      });

      const highPriorityCheckbox = screen.getByLabelText(/high/i) as HTMLInputElement;
      expect(highPriorityCheckbox.checked).toBe(true);
    });
  });

  describe('Clear Filters', () => {
    it('should show Clear Filters button when filters are applied', () => {
      renderFilterPanel({
        filters: { priority: 'high' }
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should not show Clear Filters button when no filters are applied', () => {
      renderFilterPanel({ filters: {} });

      const clearButton = screen.queryByRole('button', { name: /clear filters/i });
      expect(clearButton).toBeNull();
    });

    it('should call onClearFilters when Clear Filters button is clicked', async () => {
      const onClearFilters = vi.fn();
      renderFilterPanel({
        filters: { priority: 'high', aging: '7+' },
        onClearFilters
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(onClearFilters).toHaveBeenCalled();
      });
    });

    it('should reset all filter selections when cleared', async () => {
      const onClearFilters = vi.fn();
      const { rerender } = renderFilterPanel({
        filters: { priority: 'high', aging: '7+' },
        onClearFilters
      });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(onClearFilters).toHaveBeenCalled();
      });

      // Simulate parent component updating filters to {}
      rerender(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <FilterPanel
              filters={{}}
              onFiltersChange={vi.fn()}
              onClearFilters={onClearFilters}
              isOpen={true}
              onClose={vi.fn()}
            />
          </I18nextProvider>
        </QueryClientProvider>
      );

      const highPriorityCheckbox = screen.getByLabelText(/high/i) as HTMLInputElement;
      expect(highPriorityCheckbox.checked).toBe(false);
    });
  });

  describe('RTL Support', () => {
    beforeEach(() => {
      i18n.changeLanguage('ar');
    });

    it('should apply RTL direction when Arabic locale is active', () => {
      renderFilterPanel();

      const container = screen.getByRole('dialog') || screen.getByRole('complementary');
      expect(container).toHaveAttribute('dir', 'rtl');
    });

    it('should use logical properties for spacing', () => {
      renderFilterPanel();

      // Verify component uses ms-* and me-* classes (not ml-*, mr-*)
      const container = screen.getByRole('dialog') || screen.getByRole('complementary');
      const classes = container.className;

      expect(classes).not.toMatch(/\bm[lr]-/); // No ml- or mr-
      expect(classes).not.toMatch(/\bp[lr]-/); // No pl- or pr-
    });

    it('should render Arabic translation for filter labels', () => {
      renderFilterPanel();

      // Check for Arabic translations
      expect(screen.getByText(/الأولوية/i) || screen.getByText(/priority/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for filter sections', () => {
      renderFilterPanel();

      const filterSections = screen.getAllByRole('group');
      expect(filterSections.length).toBeGreaterThan(0);

      filterSections.forEach(section => {
        expect(section).toHaveAttribute('aria-labelledby');
      });
    });

    it('should support keyboard navigation', () => {
      renderFilterPanel();

      const firstCheckbox = screen.getByLabelText(/high/i);
      firstCheckbox.focus();

      expect(document.activeElement).toBe(firstCheckbox);
    });

    it('should have touch-friendly controls (min 44x44px)', () => {
      global.innerWidth = 375;
      renderFilterPanel();

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        const styles = window.getComputedStyle(checkbox);
        const minSize = parseInt(styles.minWidth) || parseInt(styles.minHeight);
        expect(minSize).toBeGreaterThanOrEqual(44);
      });
    });

    it('should announce filter count changes to screen readers', () => {
      const { rerender } = renderFilterPanel({
        filters: {}
      });

      const ariaLive = screen.getByRole('status');
      expect(ariaLive).toHaveTextContent(/0 filters/i);

      rerender(
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <FilterPanel
              filters={{ priority: 'high', aging: '7+' }}
              onFiltersChange={vi.fn()}
              onClearFilters={vi.fn()}
              isOpen={true}
              onClose={vi.fn()}
            />
          </I18nextProvider>
        </QueryClientProvider>
      );

      expect(ariaLive).toHaveTextContent(/2 filters/i);
    });
  });

  describe('Filter Persistence', () => {
    it('should save filters to localStorage on change', async () => {
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const onFiltersChange = vi.fn((filters) => {
        localStorage.setItem('waiting-queue-filters', JSON.stringify(filters));
      });

      renderFilterPanel({ onFiltersChange });

      const highPriority = screen.getByLabelText(/high/i);
      fireEvent.click(highPriority);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'waiting-queue-filters',
          expect.stringContaining('high')
        );
      });
    });

    it('should load filters from localStorage on mount', () => {
      const savedFilters = { priority: 'high', aging: '7+' };
      localStorage.setItem('waiting-queue-filters', JSON.stringify(savedFilters));

      renderFilterPanel();

      const highPriorityCheckbox = screen.getByLabelText(/high/i) as HTMLInputElement;
      const aging7Plus = screen.getByLabelText(/7\+ days/i) as HTMLInputElement;

      expect(highPriorityCheckbox.checked).toBe(true);
      expect(aging7Plus.checked).toBe(true);
    });

    it('should expire saved filters after 7 days', () => {
      const expiredDate = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      const savedData = {
        filters: { priority: 'high' },
        timestamp: expiredDate
      };

      localStorage.setItem('waiting-queue-filters', JSON.stringify(savedData));

      renderFilterPanel();

      // Expired filters should not be applied
      const highPriorityCheckbox = screen.getByLabelText(/high/i) as HTMLInputElement;
      expect(highPriorityCheckbox.checked).toBe(false);
    });
  });

  describe('Empty State', () => {
    it('should show helpful message when no filters are applied', () => {
      renderFilterPanel({ filters: {} });

      expect(screen.getByText(/select filters to narrow down results/i)).toBeInTheDocument();
    });

    it('should show result count when filters are applied', () => {
      renderFilterPanel({
        filters: { priority: 'high' },
        resultCount: 15
      });

      expect(screen.getByText(/showing 15 results/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loaders while filters are loading', () => {
      renderFilterPanel({ isLoading: true });

      const skeletons = screen.getAllByTestId('filter-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should disable filter controls while applying filters', () => {
      renderFilterPanel({ isApplying: true });

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeDisabled();
      });
    });
  });
});
