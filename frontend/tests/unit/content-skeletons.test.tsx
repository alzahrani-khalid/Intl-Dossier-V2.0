import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import {
  WorkItemSkeleton,
  WorkItemListSkeleton,
  PersonCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  MetricCardSkeleton,
  MetricsGridSkeleton,
  ChartSkeleton,
  TimelineItemSkeleton,
  TimelineSkeleton,
  FormFieldSkeleton,
  FormSkeleton,
  DetailHeaderSkeleton,
  TabbedContentSkeleton,
  KanbanCardSkeleton,
  KanbanColumnSkeleton,
  KanbanBoardSkeleton,
  CalendarSkeleton,
  NetworkGraphSkeleton,
} from '../../src/components/ui/content-skeletons';

describe('WorkItemSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkItemSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading work item');
  });

  it('should render with LTR direction by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkItemSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'ltr');
  });

  it('should render with RTL direction for Arabic', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <WorkItemSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('WorkItemListSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkItemListSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading work items');
  });

  it('should render 5 items by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <WorkItemListSkeleton />
      </I18nextProvider>
    );

    // Count WorkItemSkeleton instances (each has role="status")
    const items = container.querySelectorAll('[role="status"][aria-label="Loading work item"]');
    expect(items).toHaveLength(5);
  });

  it('should render custom number of items', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <WorkItemListSkeleton count={3} />
      </I18nextProvider>
    );

    const items = container.querySelectorAll('[role="status"][aria-label="Loading work item"]');
    expect(items).toHaveLength(3);
  });
});

describe('PersonCardSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PersonCardSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading person card');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <PersonCardSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('TableRowSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TableRowSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading table row');
  });

  it('should render default 5 columns', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <TableRowSkeleton />
      </I18nextProvider>
    );

    const row = container.querySelector('[role="status"]');
    const skeletons = row?.querySelectorAll('.animate-pulse');
    // 1 checkbox + 5 columns
    expect(skeletons?.length).toBe(6);
  });

  it('should render custom number of columns', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <TableRowSkeleton columns={3} />
      </I18nextProvider>
    );

    const row = container.querySelector('[role="status"]');
    const skeletons = row?.querySelectorAll('.animate-pulse');
    // 1 checkbox + 3 columns
    expect(skeletons?.length).toBe(4);
  });
});

describe('TableSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TableSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading table data');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <TableSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should show header by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <TableSkeleton />
      </I18nextProvider>
    );

    const header = container.querySelector('.bg-muted\\/50');
    expect(header).toBeInTheDocument();
  });

  it('should hide header when showHeader is false', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <TableSkeleton showHeader={false} />
      </I18nextProvider>
    );

    const header = container.querySelector('.bg-muted\\/50');
    expect(header).not.toBeInTheDocument();
  });
});

describe('MetricCardSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MetricCardSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading metric');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <MetricCardSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('MetricsGridSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MetricsGridSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading metrics');
  });

  it('should render 4 metric cards by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MetricsGridSkeleton />
      </I18nextProvider>
    );

    const metrics = container.querySelectorAll('[role="status"][aria-label="Loading metric"]');
    expect(metrics).toHaveLength(4);
  });

  it('should render custom number of metrics', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MetricsGridSkeleton count={6} />
      </I18nextProvider>
    );

    const metrics = container.querySelectorAll('[role="status"][aria-label="Loading metric"]');
    expect(metrics).toHaveLength(6);
  });
});

describe('ChartSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ChartSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading chart');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <ChartSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('TimelineItemSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TimelineItemSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading timeline item');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <TimelineItemSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('TimelineSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TimelineSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading timeline');
  });

  it('should render 5 timeline items by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <TimelineSkeleton />
      </I18nextProvider>
    );

    const items = container.querySelectorAll('[role="status"][aria-label="Loading timeline item"]');
    expect(items).toHaveLength(5);
  });
});

describe('FormFieldSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FormFieldSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading form field');
  });
});

describe('FormSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <FormSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading form');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <FormSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render 4 form fields by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <FormSkeleton />
      </I18nextProvider>
    );

    const fields = container.querySelectorAll('[role="status"][aria-label="Loading form field"]');
    expect(fields).toHaveLength(4);
  });

  it('should show submit buttons by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <FormSkeleton />
      </I18nextProvider>
    );

    const submitArea = container.querySelector('.border-t');
    expect(submitArea).toBeInTheDocument();
  });

  it('should hide submit buttons when showSubmit is false', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <FormSkeleton showSubmit={false} />
      </I18nextProvider>
    );

    const submitArea = container.querySelector('.border-t');
    expect(submitArea).not.toBeInTheDocument();
  });
});

describe('DetailHeaderSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DetailHeaderSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading page header');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <DetailHeaderSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('TabbedContentSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <TabbedContentSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading tabbed content');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <TabbedContentSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('KanbanCardSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <KanbanCardSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading kanban card');
  });
});

describe('KanbanColumnSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <KanbanColumnSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading kanban column');
  });

  it('should render 4 cards by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <KanbanColumnSkeleton />
      </I18nextProvider>
    );

    const cards = container.querySelectorAll('[role="status"][aria-label="Loading kanban card"]');
    expect(cards).toHaveLength(4);
  });
});

describe('KanbanBoardSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <KanbanBoardSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading kanban board');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <KanbanBoardSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render 4 columns by default', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <KanbanBoardSkeleton />
      </I18nextProvider>
    );

    const columns = container.querySelectorAll('[role="status"][aria-label="Loading kanban column"]');
    expect(columns).toHaveLength(4);
  });
});

describe('CalendarSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CalendarSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading calendar');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <CalendarSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});

describe('NetworkGraphSkeleton Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <NetworkGraphSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading network graph');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <NetworkGraphSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });
});
