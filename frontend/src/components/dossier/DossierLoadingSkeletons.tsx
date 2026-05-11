/**
 * Dossier Loading Skeletons (Feature 028 - T062)
 *
 * Type-specific loading skeletons matching each dossier layout structure.
 * Mobile-first responsive design with RTL support.
 */

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

/**
 * Country Dossier Skeleton
 * Layout: 2-column asymmetric grid (lg:grid-cols-[2fr_1fr])
 */
export function CountryDossierSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
  )
}




/**
 * Forum Dossier Skeleton
 * Layout: Bento grid (md:grid-cols-2 lg:grid-cols-3)
 */
export function ForumDossierSkeleton() {

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
  )
}


