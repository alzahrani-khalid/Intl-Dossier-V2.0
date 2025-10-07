import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import { DossierCard } from '../../src/components/DossierCard';
import { DossierTimeline } from '../../src/components/DossierTimeline';
import { ConflictDialog } from '../../src/components/ConflictDialog';
import { FilterPanel } from '../../src/components/FilterPanel';
import type { Dossier, DossierFilters } from '../../src/types/dossier';

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock TanStack Query
const mockFetchNextPage = vi.fn();
const mockTimelineData = {
  pages: [
    {
      data: [
        {
          event_type: 'engagement',
          source_id: '1',
          event_date: '2025-09-01T10:00:00Z',
          event_title_en: 'Ministerial Meeting',
          event_title_ar: 'اجتماع وزاري',
          event_description_en: 'Discussion on bilateral relations',
          event_description_ar: 'مناقشة حول العلاقات الثنائية',
          metadata: {},
        },
      ],
      pagination: {
        next_cursor: 'cursor1',
        has_more: true,
      },
    },
  ],
  pageParams: [null],
};

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: vi.fn(() => ({
    data: mockTimelineData,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: true,
    isFetchingNextPage: false,
    isLoading: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

// Mock useInView hook
const mockInView = vi.fn();
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: vi.fn(),
    inView: mockInView(),
  }),
}));

// Test data
const mockDossier: Dossier = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name_en: 'Saudi Arabia Relations',
  name_ar: 'العلاقات مع المملكة العربية السعودية',
  type: 'country',
  status: 'active',
  sensitivity_level: 'high',
  summary_en:
    'Bilateral relations and diplomatic engagement with Saudi Arabia covering trade, security, and cultural cooperation.',
  summary_ar: 'العلاقات الثنائية والمشاركة الدبلوماسية مع المملكة العربية السعودية',
  tags: ['bilateral', 'strategic', 'trade'],
  review_cadence: 'P90D',
  last_review_date: '2025-08-01T00:00:00Z',
  version: 3,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-09-15T14:30:00Z',
  archived: false,
};

describe('DossierCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
  });

  it('should render dossier card with English fields', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    expect(screen.getByText('Saudi Arabia Relations')).toBeInTheDocument();
    expect(screen.getByText(/Bilateral relations and diplomatic/)).toBeInTheDocument();
  });

  it('should render dossier card with Arabic fields when language is AR', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    expect(screen.getByText(/العلاقات مع المملكة العربية السعودية/)).toBeInTheDocument();
    expect(screen.getByText(/العلاقات الثنائية والمشاركة الدبلوماسية/)).toBeInTheDocument();
  });

  it('should display type, status, and sensitivity badges', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    // Check for badges using aria-labels
    expect(screen.getByLabelText(/Type: Country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status: Active/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sensitivity: High/i)).toBeInTheDocument();
  });

  it('should truncate summary to 100 characters', () => {
    const longSummaryDossier = {
      ...mockDossier,
      summary_en:
        'This is a very long summary that should be truncated to exactly one hundred characters maximum length to ensure proper display in the card component without breaking the layout.',
    };

    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={longSummaryDossier} />
      </I18nextProvider>
    );

    const summaryText = screen.getByText(/This is a very long summary/);
    expect(summaryText.textContent).toHaveLength(103); // 100 chars + "..."
  });

  it('should display first 3 tags and show count for remaining', () => {
    const manyTagsDossier = {
      ...mockDossier,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };

    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={manyTagsDossier} />
      </I18nextProvider>
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
  });

  it('should navigate to dossier detail on click', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: `/dossiers/${mockDossier.id}`,
    });
  });

  it('should handle keyboard navigation (Enter key)', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith({
      to: `/dossiers/${mockDossier.id}`,
    });
  });

  it('should handle keyboard navigation (Space key)', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(mockNavigate).toHaveBeenCalledWith({
      to: `/dossiers/${mockDossier.id}`,
    });
  });

  it('should have proper ARIA labels', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('should display version number', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossierCard dossier={mockDossier} />
      </I18nextProvider>
    );

    expect(screen.getByText(/3/)).toBeInTheDocument(); // Version 3
  });
});

describe('DossierTimeline Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInView.mockReturnValue(false);
  });

  it('should render timeline events', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossierTimeline dossierId={mockDossier.id} />
      </I18nextProvider>
    );

    expect(screen.getByText('Ministerial Meeting')).toBeInTheDocument();
    expect(screen.getByText(/Discussion on bilateral relations/)).toBeInTheDocument();
  });

  it('should trigger fetchNextPage when scrolling into view', async () => {
    mockInView.mockReturnValue(true);

    render(
      <I18nextProvider i18n={i18n}>
        <DossierTimeline dossierId={mockDossier.id} />
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(mockFetchNextPage).toHaveBeenCalled();
    });
  });

  it('should not trigger fetchNextPage when not in view', () => {
    mockInView.mockReturnValue(false);

    render(
      <I18nextProvider i18n={i18n}>
        <DossierTimeline dossierId={mockDossier.id} />
      </I18nextProvider>
    );

    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it('should display bilingual event titles based on language', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <DossierTimeline dossierId={mockDossier.id} />
      </I18nextProvider>
    );

    expect(screen.getByText('اجتماع وزاري')).toBeInTheDocument();
    expect(screen.getByText(/مناقشة حول العلاقات الثنائية/)).toBeInTheDocument();
  });

  it('should format event dates correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossierTimeline dossierId={mockDossier.id} />
      </I18nextProvider>
    );

    // Check for date formatting (should display in locale format)
    const dateElement = screen.getByText(/2025|09|Sep/i);
    expect(dateElement).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossierTimeline dossierId={mockDossier.id} />
      </I18nextProvider>
    );

    // Timeline should have proper ARIA roles
    const timeline = screen.getByRole('list');
    expect(timeline).toBeInTheDocument();
  });
});

describe('ConflictDialog Component', () => {
  const currentData = {
    ...mockDossier,
    summary_en: 'Current summary version',
    tags: ['tag1', 'tag2'],
    version: 3,
  };

  const remoteData = {
    ...mockDossier,
    summary_en: 'Remote summary version (modified by another user)',
    tags: ['tag1', 'tag3', 'tag4'],
    version: 4,
  };

  const mockOnResolve = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display current and remote data side by side', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ConflictDialog
          currentData={currentData}
          remoteData={remoteData}
          onResolve={mockOnResolve}
          open={true}
        />
      </I18nextProvider>
    );

    expect(screen.getByText(/Current summary version/)).toBeInTheDocument();
    expect(screen.getByText(/Remote summary version/)).toBeInTheDocument();
  });

  it('should highlight conflicting fields', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ConflictDialog
          currentData={currentData}
          remoteData={remoteData}
          onResolve={mockOnResolve}
          open={true}
        />
      </I18nextProvider>
    );

    // Should show differences in summary and tags
    const diffElements = screen.getAllByRole('cell');
    expect(diffElements.length).toBeGreaterThan(0);
  });

  it('should call onResolve with "keep" when Keep My Changes is clicked', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <ConflictDialog
          currentData={currentData}
          remoteData={remoteData}
          onResolve={mockOnResolve}
          open={true}
        />
      </I18nextProvider>
    );

    const keepButton = screen.getByRole('button', { name: /keep.*my.*changes/i });
    await user.click(keepButton);

    expect(mockOnResolve).toHaveBeenCalledWith('keep', currentData);
  });

  it('should call onResolve with "discard" when Use Their Changes is clicked', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <ConflictDialog
          currentData={currentData}
          remoteData={remoteData}
          onResolve={mockOnResolve}
          open={true}
        />
      </I18nextProvider>
    );

    const discardButton = screen.getByRole('button', { name: /use.*their.*changes/i });
    await user.click(discardButton);

    expect(mockOnResolve).toHaveBeenCalledWith('discard', remoteData);
  });

  it('should call onResolve with "cancel" when Cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <ConflictDialog
          currentData={currentData}
          remoteData={remoteData}
          onResolve={mockOnResolve}
          open={true}
        />
      </I18nextProvider>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnResolve).toHaveBeenCalledWith('cancel', null);
  });

  it('should close dialog on Escape key', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <ConflictDialog
          currentData={currentData}
          remoteData={remoteData}
          onResolve={mockOnResolve}
          open={true}
        />
      </I18nextProvider>
    );

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(mockOnResolve).toHaveBeenCalledWith('cancel', null);
    });
  });

  it('should have proper dialog accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ConflictDialog
          currentData={currentData}
          remoteData={remoteData}
          onResolve={mockOnResolve}
          open={true}
        />
      </I18nextProvider>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

describe('FilterPanel Component', () => {
  const mockFilters: DossierFilters = {
    type: undefined,
    status: undefined,
    sensitivity: undefined,
    owner_id: undefined,
    tags: [],
    search: '',
  };

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all filter facets', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    // Check for filter labels
    expect(screen.getByText(/type/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/sensitivity/i)).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
  });

  it('should call onFilterChange when type filter is selected', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    const countryCheckbox = screen.getByRole('checkbox', { name: /country/i });
    await user.click(countryCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...mockFilters,
      type: 'country',
    });
  });

  it('should call onFilterChange when search input changes', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'Saudi');

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...mockFilters,
        search: 'Saudi',
      });
    });
  });

  it('should debounce search input changes', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();

    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'Saudi');

    // Should not call immediately
    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('should reset all filters when Reset button is clicked', async () => {
    const user = userEvent.setup();
    const filtersWithValues: DossierFilters = {
      type: 'country',
      status: 'active',
      sensitivity: 'high',
      search: 'Saudi',
      tags: ['bilateral'],
    };

    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={filtersWithValues} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    const resetButton = screen.getByRole('button', { name: /reset|clear/i });
    await user.click(resetButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      type: undefined,
      status: undefined,
      sensitivity: undefined,
      owner_id: undefined,
      tags: [],
      search: '',
    });
  });

  it('should apply multiple filters simultaneously', async () => {
    const user = userEvent.setup();

    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    const countryCheckbox = screen.getByRole('checkbox', { name: /country/i });
    const activeCheckbox = screen.getByRole('checkbox', { name: /active/i });

    await user.click(countryCheckbox);
    await user.click(activeCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledTimes(2);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FilterPanel filters={mockFilters} onFilterChange={mockOnFilterChange} />
      </I18nextProvider>
    );

    // All checkboxes should have labels
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAccessibleName();
    });

    // Search input should have label
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAccessibleName();
  });
});