import React from 'react';
import { LayoutDashboard, Library, Share2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ProjectItem {
 id: string;
 label: string;
 icon: React.ReactNode;
 count?: number;
 path?: string;
}

export interface ProjectListProps {
 /** List of projects */
 projects?: ProjectItem[];
 /** Currently active project ID */
 activeId?: string;
 /** Callback when project is clicked */
 onProjectClick?: (project: ProjectItem) => void;
 /** Custom class name */
 className?: string;
}

/**
 * ProjectList Component
 *
 * Displays project navigation items with badges
 * From reference design "Projects" section
 *
 * Features:
 * - Icon + label + badge layout
 * - Hover states
 * - Active state highlighting
 * - RTL support
 *
 * @example
 * ```tsx
 * <ProjectList
 * projects={projects}
 * activeId="dashboard"
 * onProjectClick={handleClick}
 * />
 * ```
 */
export function ProjectList({
 projects,
 activeId,
 onProjectClick,
 className,
}: ProjectListProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 // Default projects from reference design
 const defaultProjects: ProjectItem[] = [
 {
 id: 'dashboard',
 label: t('navigation.dashboard', 'Dashboard'),
 icon: <LayoutDashboard className="h-4 w-4" />,
 count: 0,
 path: '/dashboard',
 },
 {
 id: 'library',
 label: t('navigation.library', 'Library'),
 icon: <Library className="h-4 w-4" />,
 path: '/data-library',
 },
 {
 id: 'shared-projects',
 label: t('navigation.sharedProjects', 'Shared Projects'),
 icon: <Share2 className="h-4 w-4" />,
 path: '/shared',
 },
 ];

 const items = projects || defaultProjects;

 const handleClick = (project: ProjectItem) => {
 if (onProjectClick) {
 onProjectClick(project);
 }
 };

 return (
 <div className={cn('flex flex-col', className)}>
 {/* Section Header */}
 <h3 className="section-header px-4 py-2">
 {t('navigation.projects', 'Projects')}
 </h3>

 {/* Project Items */}
 <nav className="flex flex-col px-2" role="navigation" aria-label={t('navigation.projects', 'Projects')}>
 {items.map((project) => {
 const isActive = activeId === project.id;

 return (
 <button
 key={project.id}
 onClick={() => handleClick(project)}
 className={cn(
 // Apply glass effect utility class
 'panel-item',

 // Layout
 'flex w-full items-center gap-3 py-2 px-4',

 // Rounded corners for all sides
 'rounded-lg',

 // Typography
 'text-sm font-medium text-start',

 // Colors
 'text-panel-text',

 // Hover state
 'hover:bg-panel-hover',

 // Active state
 isActive && [
 'bg-white/80',
 'active',
 ],

 // Transition
 'transition-colors duration-150',

 // Focus
 'focus-visible:outline-none',
 'focus-visible:ring-2',
 'focus-visible:ring-inset',
 'focus-visible:ring-icon-rail-active-indicator'
 )}
 aria-current={isActive ? 'page' : undefined}
 >
 {/* Icon */}
 <span className="shrink-0" aria-hidden="true">
 {project.icon}
 </span>

 {/* Label */}
 <span className="flex-1 truncate">
 {project.label}
 </span>

 {/* Badge Count */}
 {project.count !== undefined && (
 <Badge
 variant="secondary"
 className={cn(
 'h-5 min-w-5 px-2',
 'bg-badge text-badge-text',
 'text-xs font-medium',
 'rounded-full',
 'flex items-center justify-center'
 )}
 >
 {project.count}
 </Badge>
 )}
 </button>
 );
 })}
 </nav>
 </div>
 );
}

ProjectList.displayName = 'ProjectList';
