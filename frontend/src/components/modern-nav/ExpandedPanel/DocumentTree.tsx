import React, { useState } from 'react';
import { Folder, ChevronRight, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface DocumentFolder {
  id: string;
  label: string;
  count?: number;
  children?: DocumentFolder[];
  path?: string;
}

export interface DocumentTreeProps {
  /** Tree of document folders */
  folders?: DocumentFolder[];
  /** Currently active folder ID */
  activeId?: string;
  /** Callback when folder is clicked */
  onFolderClick?: (folder: DocumentFolder) => void;
  /** Callback when add button is clicked */
  onAddClick?: () => void;
  /** Show search input */
  showSearch?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * DocumentTree Component
 *
 * Displays hierarchical document folder structure
 * From reference design "Documents" section
 *
 * Features:
 * - Nested collapsible folders
 * - Search input
 * - Add button
 * - Badge counts
 * - Smooth animations
 * - RTL support
 *
 * @example
 * ```tsx
 * <DocumentTree
 *   folders={documentFolders}
 *   activeId="hiring-process"
 *   onFolderClick={handleClick}
 *   showSearch
 * />
 * ```
 */
export function DocumentTree({
  folders,
  activeId,
  onFolderClick,
  onAddClick,
  showSearch = true,
  className,
}: DocumentTreeProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['system-management', '2025-updates']));

  // Default folder structure from reference design
  const defaultFolders: DocumentFolder[] = [
    {
      id: 'system-management',
      label: "System Management's",
      count: 12,
      children: [
        {
          id: '2025-updates',
          label: "2025 Update's",
          count: 2,
          children: [
            {
              id: 'hiring-process',
              label: 'Hiring Process',
              count: 4,
            },
            {
              id: 'billing-process',
              label: 'Billing Process',
              count: 3,
            },
          ],
        },
      ],
    },
    {
      id: 'fundamentals',
      label: 'Fundamentals',
      count: 4,
    },
    {
      id: 'off-grid-servers',
      label: 'Off Grid Servers',
      count: 5,
    },
  ];

  const documentFolders = folders || defaultFolders;

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleFolderClick = (folder: DocumentFolder) => {
    if (onFolderClick) {
      onFolderClick(folder);
    }
  };

  const renderFolder = (folder: DocumentFolder, level: number = 0) => {
    const isActive = activeId === folder.id;
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const indent = level * 16; // 16px per level

    return (
      <Collapsible
        key={folder.id}
        open={isExpanded}
        onOpenChange={() => hasChildren && toggleFolder(folder.id)}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            'hover:bg-panel-hover',
            'transition-colors duration-150',
            isActive && 'bg-panel-active'
          )}
          style={{ paddingInlineStart: `${16 + indent}px` }}
        >
          {/* Chevron for expandable folders */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'p-0.5 rounded hover:bg-panel-hover',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icon-rail-active-indicator'
                )}
                aria-label={isExpanded ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 text-panel-text-muted transition-transform duration-200',
                    isExpanded && 'rotate-90',
                    isRTL && !isExpanded && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-5" /> // Spacer for alignment
          )}

          {/* Folder button */}
          <button
            onClick={() => handleFolderClick(folder)}
            className={cn(
              'panel-item',
              'flex flex-1 items-center gap-2 py-1.5 pe-4',
              'rounded-lg',
              'text-sm font-medium text-start text-panel-text',
              'hover:bg-panel-hover',
              isActive && ['bg-white/80', 'active'],
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-icon-rail-active-indicator'
            )}
          >
            <Folder className="h-4 w-4 shrink-0 text-panel-text-muted" />
            <span className="flex-1 truncate">{folder.label}</span>
            {folder.count !== undefined && (
              <span className="text-xs text-panel-text-muted tabular-nums">
                {folder.count}
              </span>
            )}
          </button>
        </div>

        {/* Children */}
        {hasChildren && (
          <CollapsibleContent className="animate-accordion-down">
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Section Header with Add Button */}
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="section-header">
          {t('navigation.documents', 'Documents')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-panel-hover"
          onClick={onAddClick}
          aria-label={t('common.add', 'Add document')}
        >
          <Plus className="h-4 w-4 text-panel-text-muted" />
        </Button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div className="px-2 pb-3">
          <div className="relative mx-2">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-panel-text-muted opacity-50" />
            <Input
              type="search"
              placeholder={t('common.search', 'Search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'h-11 w-full ps-10 pe-3',
                'bg-white/30 border border-black/5',
                'rounded-2xl',
                'text-sm placeholder:text-panel-text-muted placeholder:opacity-40',
                'shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]',
                'focus-visible:bg-white/40 focus-visible:border-black/10',
                'focus-visible:shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)]',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'transition-all duration-150'
              )}
            />
          </div>
        </div>
      )}

      {/* Top Separator */}
      <div className="border-t border-panel-border mx-2 mb-2" />

      {/* Document Tree */}
      <nav
        className="flex flex-col px-2 overflow-y-auto"
        role="navigation"
        aria-label={t('navigation.documents', 'Documents')}
      >
        {documentFolders.map((folder) => renderFolder(folder))}
      </nav>

      {/* Bottom Separator */}
      <div className="border-t border-panel-border mx-2 mt-2" />

      {/* More Button */}
      <button
        className={cn(
          'flex items-center gap-3 px-4 py-2 mt-1',
          'text-sm font-medium text-panel-text-muted',
          'hover:bg-panel-hover hover:text-panel-text',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-icon-rail-active-indicator'
        )}
      >
        <Plus className="h-4 w-4" />
        <span>{t('common.more', 'More')}</span>
      </button>
    </div>
  );
}

DocumentTree.displayName = 'DocumentTree';
