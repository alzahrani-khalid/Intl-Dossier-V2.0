/**
 * Dossier Loading Skeletons (Feature 028 - T062)
 *
 * Type-specific loading skeletons matching each dossier layout structure.
 * Mobile-first responsive design with RTL support.
 */

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

/**
 * Country Dossier Skeleton
 * Layout: 2-column asymmetric grid (lg:grid-cols-[2fr_1fr])
 */
export function CountryDossierSkeleton() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 space-y-3">
        <Skeleton className="h-8 sm:h-10 w-2/3" />
        <Skeleton className="h-4 sm:h-5 w-1/2" />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8">
        {/* Main Column */}
        <div className="space-y-6">
          {/* World Map */}
          <div className="rounded-lg border border-border p-4 sm:p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-64 sm:h-80 lg:h-96 w-full" />
          </div>

          {/* Diplomatic Relations */}
          <div className="rounded-lg border border-border p-4 sm:p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Geographic Context */}
          <div className="rounded-lg border border-border p-4 sm:p-6">
            <Skeleton className="h-4 w-36 mb-4" />
            <SkeletonText lines={5} />
          </div>

          {/* Key Officials */}
          <div className="rounded-lg border border-border p-4 sm:p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <SkeletonCard />
            <div className="mt-4">
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Engagement Dossier Skeleton
 * Layout: 1-column vertical (grid-cols-1)
 */
export function EngagementDossierSkeleton() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 space-y-3">
        <Skeleton className="h-8 sm:h-10 w-2/3" />
        <Skeleton className="h-4 sm:h-5 w-1/2" />
      </div>

      {/* Vertical Stack */}
      <div className="grid grid-cols-1 gap-6">
        {/* Event Timeline */}
        <div className="rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>

        {/* Participants */}
        <div className="rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>

        {/* Outcomes */}
        <div className="rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-28 mb-4" />
          <SkeletonText lines={4} />
        </div>
      </div>
    </div>
  );
}

/**
 * Person Dossier Skeleton
 * Layout: Sidebar + main content (md:grid-cols-[300px_1fr])
 */
export function PersonDossierSkeleton() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 space-y-3">
        <Skeleton className="h-8 sm:h-10 w-2/3" />
        <Skeleton className="h-4 sm:h-5 w-1/2" />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 lg:gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="flex justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>

          {/* Bio */}
          <div className="rounded-lg border border-border p-4 sm:p-6">
            <SkeletonText lines={6} />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Positions Held */}
          <div className="rounded-lg border border-border p-4 sm:p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <SkeletonCard />
            <div className="mt-4">
              <SkeletonCard />
            </div>
          </div>

          {/* Organization Affiliations */}
          <div className="rounded-lg border border-border p-4 sm:p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Organization Dossier Skeleton
 * Layout: 3-column grid (lg:grid-cols-3)
 */
export function OrganizationDossierSkeleton() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 space-y-3">
        <Skeleton className="h-8 sm:h-10 w-2/3" />
        <Skeleton className="h-4 sm:h-5 w-1/2" />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Org Chart (spans 2 columns) */}
        <div className="lg:col-span-2 rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-36 mb-4" />
          <Skeleton className="h-64 sm:h-80 w-full" />
        </div>

        {/* Key Contacts */}
        <div className="rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>

        {/* Active MoUs (spans 3 columns) */}
        <div className="lg:col-span-3 rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Forum Dossier Skeleton
 * Layout: Bento grid (md:grid-cols-2 lg:grid-cols-3)
 */
export function ForumDossierSkeleton() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 space-y-3">
        <Skeleton className="h-8 sm:h-10 w-2/3" />
        <Skeleton className="h-4 sm:h-5 w-1/2" />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Member Organizations (spans 2 columns) */}
        <div className="md:col-span-2 rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>

        {/* Meeting Schedule */}
        <div className="rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <SkeletonText lines={4} />
        </div>

        {/* Deliverables (spans 3 columns) */}
        <div className="lg:col-span-3 rounded-lg border border-border p-4 sm:p-6">
          <Skeleton className="h-4 w-36 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Working Group Dossier Skeleton
 * Layout: Similar to Forum (md:grid-cols-2 lg:grid-cols-3)
 */
export function WorkingGroupDossierSkeleton() {
  // Reuse ForumDossierSkeleton as they have the same layout
  return <ForumDossierSkeleton />;
}

/**
 * Dossiers Hub Skeleton
 * Layout: BentoGrid with 6 type cards
 */
export function DossiersHubSkeleton() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 sm:h-10 w-1/2 mb-3" />
        <Skeleton className="h-4 sm:h-5 w-1/3" />
      </div>

      {/* Bento Grid - matches hub card layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* P1 Cards (2x2 grid span) */}
        <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 md:row-span-2">
          <div className="rounded-lg border border-border p-6 h-full">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 md:row-span-2">
          <div className="rounded-lg border border-border p-6 h-full">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* P2 Card */}
        <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
          <div className="rounded-lg border border-border p-6 h-full">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* P3 Cards */}
        <div className="sm:col-span-1 md:col-span-1 lg:col-span-1">
          <div className="rounded-lg border border-border p-6 h-full">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        <div className="sm:col-span-1 md:col-span-1 lg:col-span-1">
          <div className="rounded-lg border border-border p-6 h-full">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        <div className="sm:col-span-1 md:col-span-1 lg:col-span-1">
          <div className="rounded-lg border border-border p-6 h-full">
            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
