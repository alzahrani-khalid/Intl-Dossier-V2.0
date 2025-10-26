/**
 * Modern Navigation System
 *
 * Complete navigation design system with:
 * - Material Design 3 Navigation Rail (56px)
 * - Expanded Panel (280px)
 * - Dashboard Components
 * - 3-column responsive layout
 */

// Navigation Shell
export { NavigationShell } from './NavigationShell';
export type { NavigationShellProps } from './NavigationShell';

// Icon Rail
export { IconRail, IconButton } from './IconRail';
export type { IconRailProps, IconRailItem, IconButtonProps } from './IconRail';

// Expanded Panel
export {
  ExpandedPanel,
  UserProfile,
  ProjectList,
  StatusList,
  HistoryList,
  DocumentTree,
} from './ExpandedPanel';
export type {
  ExpandedPanelProps,
  UserProfileProps,
  ProjectListProps,
  ProjectItem,
  StatusListProps,
  StatusItem,
  HistoryListProps,
  HistoryItem,
  DocumentTreeProps,
  DocumentFolder,
} from './ExpandedPanel';

// Dashboard
export { MetricCard, ExecutionsTabs } from './Dashboard';
export type {
  MetricCardProps,
  TrendData,
  ExecutionsTabsProps,
} from './Dashboard';
