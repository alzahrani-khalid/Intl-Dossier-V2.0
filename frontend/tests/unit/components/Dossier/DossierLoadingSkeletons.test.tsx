import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../src/i18n';
import {
  CountryDossierSkeleton,
  EngagementDossierSkeleton,
  PersonDossierSkeleton,
  OrganizationDossierSkeleton,
  ForumDossierSkeleton,
  WorkingGroupDossierSkeleton,
  DossiersHubSkeleton,
} from '../../../../src/components/Dossier/DossierLoadingSkeletons';

describe('CountryDossierSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CountryDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading country dossier');
  });

  it('should render with LTR direction by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CountryDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'ltr');
  });

  it('should render with RTL direction for Arabic', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <CountryDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render mobile-first responsive container', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CountryDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('should render 2-column asymmetric grid layout', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <CountryDossierSkeleton />
      </I18nextProvider>
    );

    const grid = container.querySelector('.grid.lg\\:grid-cols-\\[2fr_1fr\\]');
    expect(grid).toBeInTheDocument();
  });
});

describe('EngagementDossierSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <EngagementDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading engagement details');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <EngagementDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render mobile-first responsive container', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <EngagementDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('should render 1-column vertical layout', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <EngagementDossierSkeleton />
      </I18nextProvider>
    );

    const grid = container.querySelector('.grid.grid-cols-1');
    expect(grid).toBeInTheDocument();
  });
});

describe('PersonDossierSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PersonDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading person dossier');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <PersonDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render mobile-first responsive container', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PersonDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('should render sidebar + main content layout', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <PersonDossierSkeleton />
      </I18nextProvider>
    );

    const grid = container.querySelector('.grid.md\\:grid-cols-\\[300px_1fr\\]');
    expect(grid).toBeInTheDocument();
  });

  it('should render profile photo skeleton', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <PersonDossierSkeleton />
      </I18nextProvider>
    );

    const photo = container.querySelector('.h-32.w-32.rounded-full');
    expect(photo).toBeInTheDocument();
  });
});

describe('OrganizationDossierSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <OrganizationDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading organization dossier');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <OrganizationDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render mobile-first responsive container', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <OrganizationDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('should render 3-column grid layout', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <OrganizationDossierSkeleton />
      </I18nextProvider>
    );

    const grid = container.querySelector('.grid.lg\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('should render org chart spanning 2 columns', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <OrganizationDossierSkeleton />
      </I18nextProvider>
    );

    const orgChart = container.querySelector('.lg\\:col-span-2');
    expect(orgChart).toBeInTheDocument();
  });
});

describe('ForumDossierSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ForumDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading forum dossier');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <ForumDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render mobile-first responsive container', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ForumDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('should render bento grid layout', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <ForumDossierSkeleton />
      </I18nextProvider>
    );

    const grid = container.querySelector('.grid.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });
});

describe('WorkingGroupDossierSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <WorkingGroupDossierSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading forum dossier');
  });

  it('should reuse ForumDossierSkeleton layout', () => {
    const { container: forumContainer } = render(
      <I18nextProvider i18n={i18n}>
        <ForumDossierSkeleton />
      </I18nextProvider>
    );

    const { container: workingGroupContainer } = render(
      <I18nextProvider i18n={i18n}>
        <WorkingGroupDossierSkeleton />
      </I18nextProvider>
    );

    // Both should have the same grid structure
    const forumGrid = forumContainer.querySelector('.grid.md\\:grid-cols-2.lg\\:grid-cols-3');
    const workingGroupGrid = workingGroupContainer.querySelector(
      '.grid.md\\:grid-cols-2.lg\\:grid-cols-3'
    );

    expect(forumGrid).toBeInTheDocument();
    expect(workingGroupGrid).toBeInTheDocument();
  });
});

describe('DossiersHubSkeleton Component', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render with accessibility attributes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossiersHubSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading dossiers hub');
  });

  it('should render with RTL support', async () => {
    await i18n.changeLanguage('ar');

    render(
      <I18nextProvider i18n={i18n}>
        <DossiersHubSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('dir', 'rtl');
  });

  it('should render mobile-first responsive container', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <DossiersHubSkeleton />
      </I18nextProvider>
    );

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('container', 'mx-auto', 'px-4');
  });

  it('should render bento grid layout', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <DossiersHubSkeleton />
      </I18nextProvider>
    );

    const grid = container.querySelector(
      '.grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4'
    );
    expect(grid).toBeInTheDocument();
  });

  it('should render P1 cards with 2x2 span', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <DossiersHubSkeleton />
      </I18nextProvider>
    );

    const p1Cards = container.querySelectorAll('.sm\\:col-span-2.md\\:row-span-2');
    expect(p1Cards.length).toBeGreaterThan(0);
  });

  it('should render multiple dossier type cards', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <DossiersHubSkeleton />
      </I18nextProvider>
    );

    const cards = container.querySelectorAll('.rounded-lg.border.border-border');
    expect(cards.length).toBeGreaterThan(4); // Should have multiple type cards
  });
});

describe('All Dossier Skeletons', () => {
  const skeletons = [
    { name: 'CountryDossierSkeleton', component: CountryDossierSkeleton },
    { name: 'EngagementDossierSkeleton', component: EngagementDossierSkeleton },
    { name: 'PersonDossierSkeleton', component: PersonDossierSkeleton },
    { name: 'OrganizationDossierSkeleton', component: OrganizationDossierSkeleton },
    { name: 'ForumDossierSkeleton', component: ForumDossierSkeleton },
    { name: 'WorkingGroupDossierSkeleton', component: WorkingGroupDossierSkeleton },
    { name: 'DossiersHubSkeleton', component: DossiersHubSkeleton },
  ];

  skeletons.forEach(({ name, component: Component }) => {
    describe(`${name} - General Accessibility`, () => {
      beforeEach(() => {
        i18n.changeLanguage('en');
      });

      it('should have role="status"', () => {
        render(
          <I18nextProvider i18n={i18n}>
            <Component />
          </I18nextProvider>
        );

        const skeleton = screen.getByRole('status');
        expect(skeleton).toBeInTheDocument();
      });

      it('should have aria-busy="true"', () => {
        render(
          <I18nextProvider i18n={i18n}>
            <Component />
          </I18nextProvider>
        );

        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveAttribute('aria-busy', 'true');
      });

      it('should have descriptive aria-label', () => {
        render(
          <I18nextProvider i18n={i18n}>
            <Component />
          </I18nextProvider>
        );

        const skeleton = screen.getByRole('status');
        const label = skeleton.getAttribute('aria-label');
        expect(label).toBeTruthy();
        expect(label).toMatch(/loading/i);
      });

      it('should support RTL layout', async () => {
        await i18n.changeLanguage('ar');

        render(
          <I18nextProvider i18n={i18n}>
            <Component />
          </I18nextProvider>
        );

        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveAttribute('dir', 'rtl');
      });
    });
  });
});
