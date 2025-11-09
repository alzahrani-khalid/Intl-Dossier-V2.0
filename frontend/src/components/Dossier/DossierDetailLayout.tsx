/**
 * DossierDetailLayout - Shared layout wrapper for all type-specific dossier detail pages
 * Provides consistent header, breadcrumbs, and sidebar while allowing type-specific main content
 * Feature: 028-type-specific-dossier-pages
 */

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import type { Dossier } from '@/lib/dossier-type-guards';
import { ChevronRight, Home } from 'lucide-react';

interface DossierDetailLayoutProps {
  /**
   * The dossier entity being displayed
   */
  dossier: Dossier;

  /**
   * Type-specific content (sections, visualizations, etc.)
   */
  children: ReactNode;

  /**
   * Custom grid layout classes for type-specific layouts
   * Example: "grid-cols-1 lg:grid-cols-[2fr_1fr]" for Country
   */
  gridClassName?: string;

  /**
   * Optional custom header actions (edit, delete, etc.)
   */
  headerActions?: ReactNode;
}

/**
 * DossierDetailLayout component
 * Provides shared chrome (header, breadcrumbs, sidebar) for all dossier types
 */
export function DossierDetailLayout({
  dossier,
  children,
  gridClassName = 'grid-cols-1',
  headerActions,
}: DossierDetailLayoutProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Breadcrumbs */}
      <nav
        className="flex items-center gap-2 text-sm sm:text-base mb-4 sm:mb-6"
        aria-label="Breadcrumb"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Link
          to="/dossiers"
          className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>{t('hub.title')}</span>
        </Link>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground ${isRTL ? 'rotate-180' : ''}`}
        />
        <span className="text-foreground font-medium">
          {isRTL ? dossier.name_ar : dossier.name_en}
        </span>
      </nav>

      {/* Header */}
      <header
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            {isRTL ? dossier.name_ar : dossier.name_en}
          </h1>
          {(dossier.description_en || dossier.description_ar) && (
            <p className="text-muted-foreground text-sm sm:text-base">
              {isRTL ? dossier.description_ar : dossier.description_en}
            </p>
          )}
        </div>

        {/* Header Actions */}
        {headerActions && (
          <div className="flex items-center gap-2 sm:gap-3">{headerActions}</div>
        )}
      </header>

      {/* Main Content - Type-Specific Grid Layout */}
      <main
        className={`grid ${gridClassName} gap-4 sm:gap-6 lg:gap-8`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {children}
      </main>
    </div>
  );
}
