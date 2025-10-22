/**
 * Link List Component
 * Feature: 024-intake-entity-linking
 * Task: T048
 *
 * Mobile-first list of entity links with drag-and-drop reordering
 * Vertical stacking on mobile, optimized for touch interactions
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LinkCard } from './LinkCard';
import { useReorderEntityLinks } from '@/hooks/use-entity-links';
import type { EntityLink } from '../../../../backend/src/types/intake-entity-links.types';

export interface LinkListProps {
  /** Intake ID for this list */
  intakeId: string;
  /** Array of entity links to display */
  links: EntityLink[];
  /** Whether the list shows deleted links */
  showDeleted?: boolean;
  /** Whether user can restore deleted links (steward+ role) */
  canRestore?: boolean;
  /** Enable drag-and-drop reordering */
  enableReorder?: boolean;
  /** Callback when delete is requested */
  onDelete?: (linkId: string) => void;
  /** Callback when restore is requested */
  onRestore?: (linkId: string) => void;
  /** Callback when notes are updated */
  onUpdateNotes?: (linkId: string, notes: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LinkList Component
 *
 * Displays a vertical list of entity links with optional drag-and-drop reordering.
 * Optimized for mobile-first design with touch-friendly interactions.
 *
 * @example
 * ```tsx
 * <LinkList
 *   intakeId={intakeId}
 *   links={links}
 *   enableReorder={true}
 *   onDelete={(id) => deleteMutation.mutate(id)}
 *   onUpdateNotes={(id, notes) => updateMutation.mutate({ notes })}
 * />
 * ```
 */
export function LinkList({
  intakeId,
  links,
  showDeleted = false,
  canRestore = false,
  enableReorder = false,
  onDelete,
  onRestore,
  onUpdateNotes,
  className,
}: LinkListProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const reorderMutation = useReorderEntityLinks(intakeId);

  // Filter links based on showDeleted flag
  const filteredLinks = showDeleted
    ? links.filter((link) => link.deleted_at !== null)
    : links.filter((link) => link.deleted_at === null);

  // Sort links by link_order
  const sortedLinks = [...filteredLinks].sort((a, b) => a.link_order - b.link_order);

  // Handle drag start (basic implementation - full @dnd-kit implementation in T116)
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, linkId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', linkId);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop (basic implementation - full @dnd-kit implementation in T116)
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetLinkId: string) => {
      e.preventDefault();
      const draggedLinkId = e.dataTransfer.getData('text/plain');

      if (draggedLinkId === targetLinkId) return;

      const draggedIndex = sortedLinks.findIndex((link) => link.id === draggedLinkId);
      const targetIndex = sortedLinks.findIndex((link) => link.id === targetLinkId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Create new order array
      const newLinks = [...sortedLinks];
      const [draggedLink] = newLinks.splice(draggedIndex, 1);
      newLinks.splice(targetIndex, 0, draggedLink);

      // Update link orders
      const linkOrders = newLinks.map((link, index) => ({
        link_id: link.id,
        link_order: index + 1,
      }));

      // Call mutation
      reorderMutation.mutate(linkOrders);
    },
    [sortedLinks, reorderMutation]
  );

  // Empty state
  if (sortedLinks.length === 0) {
    return (
      <div className={cn(
        'text-center py-8 sm:py-12',
        className
      )}>
        <p className="text-sm sm:text-base text-slate-500">
          {showDeleted
            ? t('entityLinks.noDeletedLinks')
            : t('entityLinks.noLinks')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Mobile-first vertical stacking with gap
        'flex flex-col gap-3 sm:gap-4',
        'w-full',
        className
      )}
      role="list"
      aria-label={t('entityLinks.linkList')}
    >
      {sortedLinks.map((link) => (
        <div
          key={link.id}
          draggable={enableReorder && !showDeleted}
          onDragStart={(e) => enableReorder && handleDragStart(e, link.id)}
          onDragOver={enableReorder ? handleDragOver : undefined}
          onDrop={(e) => enableReorder && handleDrop(e, link.id)}
          className={cn(
            enableReorder && !showDeleted && 'cursor-move'
          )}
          role="listitem"
        >
          <LinkCard
            link={link}
            isDeleted={showDeleted}
            canRestore={canRestore}
            isDraggable={enableReorder && !showDeleted}
            onDelete={onDelete}
            onRestore={onRestore}
            onUpdateNotes={onUpdateNotes}
          />
        </div>
      ))}

      {/* Reordering hint */}
      {enableReorder && !showDeleted && sortedLinks.length > 1 && (
        <p className={cn(
          'text-xs text-slate-500 text-center',
          'mt-2',
          'hidden sm:block' // Only show on desktop
        )}>
          {t('entityLinks.reorderHint')}
        </p>
      )}
    </div>
  );
}

export default LinkList;
