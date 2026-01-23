import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';
import {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonTable,
  SkeletonAvatar,
  SkeletonButton,
} from '../../src/components/ui/skeleton';

describe('Skeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Skeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading');
  });

  it('should apply custom className', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Skeleton className="h-10 w-20" />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('h-10', 'w-20', 'animate-pulse', 'rounded-md', 'bg-muted');
  });

  it('should have animate-pulse animation', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Skeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('animate-pulse');
  });
});

describe('SkeletonCard Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonCard />
      </I18nextProvider>
    );

    const card = screen.getByRole('status');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-busy', 'true');
    expect(card).toHaveAttribute('aria-label', 'Loading');
  });

  it('should render nested skeleton elements', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonCard />
      </I18nextProvider>
    );

    const card = screen.getByRole('status');
    const skeletons = card.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have card styling', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonCard />
      </I18nextProvider>
    );

    const card = screen.getByRole('status');
    expect(card).toHaveClass('border', 'border-border', 'bg-card');
  });
});

describe('SkeletonText Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonText />
      </I18nextProvider>
    );

    const textSkeleton = screen.getByRole('status');
    expect(textSkeleton).toBeInTheDocument();
    expect(textSkeleton).toHaveAttribute('aria-busy', 'true');
    expect(textSkeleton).toHaveAttribute('aria-label', 'Loading');
  });

  it('should render default 3 lines', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonText />
      </I18nextProvider>
    );

    const textSkeleton = screen.getByRole('status');
    const lines = textSkeleton.querySelectorAll('.animate-pulse');
    expect(lines).toHaveLength(3);
  });

  it('should render custom number of lines', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonText lines={5} />
      </I18nextProvider>
    );

    const textSkeleton = screen.getByRole('status');
    const lines = textSkeleton.querySelectorAll('.animate-pulse');
    expect(lines).toHaveLength(5);
  });

  it('should style last line differently', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonText lines={3} />
      </I18nextProvider>
    );

    const textSkeleton = screen.getByRole('status');
    const lines = textSkeleton.querySelectorAll('.animate-pulse');
    const lastLine = lines[lines.length - 1];
    expect(lastLine).toHaveClass('w-2/3');
  });
});

describe('SkeletonTable Component', () => {
  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonTable />
      </I18nextProvider>
    );

    const table = screen.getByRole('status');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(table).toHaveAttribute('aria-label', 'Loading');
  });

  it('should render default 5 rows and 4 columns', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonTable />
      </I18nextProvider>
    );

    const table = screen.getByRole('status');
    // Header row + 5 data rows
    const rows = table.querySelectorAll('.flex.gap-4');
    expect(rows.length).toBe(6); // 1 header + 5 rows
  });

  it('should render custom rows and columns', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonTable rows={3} columns={6} />
      </I18nextProvider>
    );

    const table = screen.getByRole('status');
    const rows = table.querySelectorAll('.flex.gap-4');
    expect(rows.length).toBe(4); // 1 header + 3 rows
  });

  it('should render header row with border', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonTable />
      </I18nextProvider>
    );

    const table = screen.getByRole('status');
    const header = table.querySelector('.border-b');
    expect(header).toBeInTheDocument();
  });
});

describe('SkeletonAvatar Component', () => {
  it('should render with rounded-full class', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonAvatar />
      </I18nextProvider>
    );

    const avatar = screen.getByRole('status');
    expect(avatar).toHaveClass('rounded-full');
  });

  it('should render medium size by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonAvatar />
      </I18nextProvider>
    );

    const avatar = screen.getByRole('status');
    expect(avatar).toHaveClass('h-10', 'w-10');
  });

  it('should render small size', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonAvatar size="sm" />
      </I18nextProvider>
    );

    const avatar = screen.getByRole('status');
    expect(avatar).toHaveClass('h-8', 'w-8');
  });

  it('should render large size', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonAvatar size="lg" />
      </I18nextProvider>
    );

    const avatar = screen.getByRole('status');
    expect(avatar).toHaveClass('h-12', 'w-12');
  });
});

describe('SkeletonButton Component', () => {
  it('should render with rounded-md class', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonButton />
      </I18nextProvider>
    );

    const button = screen.getByRole('status');
    expect(button).toHaveClass('rounded-md');
  });

  it('should render medium size by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonButton />
      </I18nextProvider>
    );

    const button = screen.getByRole('status');
    expect(button).toHaveClass('h-10', 'w-24');
  });

  it('should render small size', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonButton size="sm" />
      </I18nextProvider>
    );

    const button = screen.getByRole('status');
    expect(button).toHaveClass('h-9', 'w-20');
  });

  it('should render large size', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SkeletonButton size="lg" />
      </I18nextProvider>
    );

    const button = screen.getByRole('status');
    expect(button).toHaveClass('h-11', 'w-28');
  });
});
