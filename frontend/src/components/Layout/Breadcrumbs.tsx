/**
 * Breadcrumb Navigation (T057)
 *
 * Auto-generates breadcrumbs from TanStack Router hierarchy
 * Features: Dynamic breadcrumbs, current location context, click navigation
 * Integration: Used in page headers across positions routes
 */

import { Link, useMatches } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

interface BreadcrumbSegment {
 label: string;
 to?: string;
 params?: Record<string, string>;
 isActive: boolean;
}

export function Breadcrumbs() {
 const { t, i18n } = useTranslation(['common', 'positions', 'dossiers', 'engagements']);
 const matches = useMatches();
 const isRTL = i18n.language === 'ar';

 // Generate breadcrumb segments from route matches
 const breadcrumbs: BreadcrumbSegment[] = [];

 // Always start with home
 breadcrumbs.push({
 label: t('common:nav.home'),
 to: '/dashboard',
 isActive: false,
 });

 // Process route matches to build breadcrumbs
 matches.forEach((match, index) => {
 const isLast = index === matches.length - 1;
 const pathname = match.pathname;

 // Skip _protected and root routes
 if (pathname === '/' || pathname === '/_protected') {
 return;
 }

 // Parse route segments
 const segments = pathname.split('/').filter(Boolean);

 // Handle different route patterns
 if (segments.includes('positions')) {
 // Positions routes
 if (segments.length === 1 && segments[0] === 'positions') {
 // /positions - Standalone library
 breadcrumbs.push({
 label: t('positions:library.title'),
 to: '/positions',
 isActive: isLast,
 });
 } else if (segments.length === 2 && segments[0] === 'positions') {
 // /positions/$positionId - Position detail
 breadcrumbs.push({
 label: t('positions:library.title'),
 to: '/positions',
 isActive: false,
 });
 breadcrumbs.push({
 label: t('positions:detail.title'),
 to: `/positions/${segments[1]}`,
 isActive: isLast,
 });
 }
 } else if (segments.includes('dossiers')) {
 // Dossiers routes
 if (segments.length === 1 && segments[0] === 'dossiers') {
 // /dossiers - Dossiers hub
 breadcrumbs.push({
 label: t('dossiers:hub.title'),
 to: '/dossiers',
 isActive: isLast,
 });
 } else if (segments.length === 2 && segments[0] === 'dossiers') {
 // /dossiers/$id - Dossier detail
 breadcrumbs.push({
 label: t('dossiers:hub.title'),
 to: '/dossiers',
 isActive: false,
 });
 breadcrumbs.push({
 label: t('dossiers:detail.title'),
 to: `/dossiers/${segments[1]}`,
 isActive: isLast,
 });
 }
 } else if (segments.includes('engagements')) {
 // Engagements routes
 if (segments.length === 1 && segments[0] === 'engagements') {
 // /engagements - Engagements list
 breadcrumbs.push({
 label: t('engagements:list.title'),
 to: '/engagements',
 isActive: isLast,
 });
 } else if (segments.length === 2 && segments[0] === 'engagements') {
 // /engagements/$id - Engagement detail
 breadcrumbs.push({
 label: t('engagements:list.title'),
 to: '/engagements',
 isActive: false,
 });
 breadcrumbs.push({
 label: t('engagements:detail.title'),
 to: `/engagements/${segments[1]}`,
 isActive: isLast,
 });
 }
 }
 });

 // Don't render breadcrumbs if only home is present
 if (breadcrumbs.length <= 1) {
 return null;
 }

 return (
 <nav
 aria-label={t('common:breadcrumbs.label')}
 className={`flex items-center space-x-1 text-sm ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}
 >
 {breadcrumbs.map((crumb, index) => (
 <Fragment key={index}>
 {index > 0 && (
 <ChevronRight
 className={`h-4 w-4 text-gray-400 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`}
 aria-hidden="true"
 />
 )}
 {crumb.isActive ? (
 <span
 className="font-medium text-gray-900 dark:text-gray-100"
 aria-current="page"
 >
 {crumb.label}
 </span>
 ) : (
 <Link
 to={crumb.to as any}
 params={crumb.params}
 className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
 >
 {index === 0 ? (
 <span className="flex items-center gap-1">
 <Home className="h-4 w-4" aria-hidden="true" />
 <span className="sr-only">{crumb.label}</span>
 </span>
 ) : (
 crumb.label
 )}
 </Link>
 )}
 </Fragment>
 ))}
 </nav>
 );
}

// Export a version with custom breadcrumbs for complex pages
interface CustomBreadcrumbsProps {
 segments: Array<{
 label: string;
 to?: string;
 params?: Record<string, string>;
 }>;
}

export function CustomBreadcrumbs({ segments }: CustomBreadcrumbsProps) {
 const { t, i18n } = useTranslation('common');
 const isRTL = i18n.language === 'ar';

 const breadcrumbs: BreadcrumbSegment[] = [
 {
 label: t('nav.home'),
 to: '/dashboard',
 isActive: false,
 },
 ...segments.map((seg, index) => ({
 ...seg,
 isActive: index === segments.length - 1,
 })),
 ];

 return (
 <nav
 aria-label={t('breadcrumbs.label')}
 className={`flex items-center space-x-1 text-sm ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}
 >
 {breadcrumbs.map((crumb, index) => (
 <Fragment key={index}>
 {index > 0 && (
 <ChevronRight
 className={`h-4 w-4 text-gray-400 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`}
 aria-hidden="true"
 />
 )}
 {crumb.isActive ? (
 <span
 className="font-medium text-gray-900 dark:text-gray-100"
 aria-current="page"
 >
 {crumb.label}
 </span>
 ) : (
 <Link
 to={crumb.to as any}
 params={crumb.params}
 className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
 >
 {index === 0 ? (
 <span className="flex items-center gap-1">
 <Home className="h-4 w-4" aria-hidden="true" />
 <span className="sr-only">{crumb.label}</span>
 </span>
 ) : (
 crumb.label
 )}
 </Link>
 )}
 </Fragment>
 ))}
 </nav>
 );
}
