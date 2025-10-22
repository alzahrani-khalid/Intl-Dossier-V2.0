/**
 * EntityTypeTabs Component
 * Feature: 015-search-retrieval-spec
 * Task: T044
 *
 * Tabs for result filtering:
 * - All, Dossiers, People, Engagements, Positions, MoUs, Documents
 * - Count badges per tab
 * - Keyboard navigation (Tab, Arrow keys)
 * - ARIA accessibility
 */

import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type EntityType =
  | 'all'
  | 'dossiers'
  | 'people'
  | 'engagements'
  | 'positions'
  | 'mous'
  | 'documents';

interface EntityTypeCounts {
  all: number;
  dossiers: number;
  people: number;
  engagements: number;
  positions: number;
  mous: number;
  documents: number;
}

interface EntityTypeTabsProps {
  selectedType: EntityType;
  counts: EntityTypeCounts;
  onTypeChange: (type: EntityType) => void;
  isLoading?: boolean;
}

const entityTypeConfig: Record<
  EntityType,
  { icon: string; labelKey: string; color: string }
> = {
  all: { icon: '🔍', labelKey: 'all', color: 'text-gray-700 dark:text-gray-300' },
  dossiers: { icon: '📁', labelKey: 'dossiers', color: 'text-blue-600 dark:text-blue-400' },
  people: { icon: '👤', labelKey: 'people', color: 'text-green-600 dark:text-green-400' },
  engagements: {
    icon: '🤝',
    labelKey: 'engagements',
    color: 'text-purple-600 dark:text-purple-400',
  },
  positions: {
    icon: '📋',
    labelKey: 'positions',
    color: 'text-orange-600 dark:text-orange-400',
  },
  mous: { icon: '📜', labelKey: 'mous', color: 'text-red-600 dark:text-red-400' },
  documents: {
    icon: '📄',
    labelKey: 'documents',
    color: 'text-indigo-600 dark:text-indigo-400',
  },
};

export function EntityTypeTabs({
  selectedType,
  counts,
  onTypeChange,
  isLoading = false,
}: EntityTypeTabsProps) {
  const { t, i18n } = useTranslation();
  const tabsRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === 'ar';

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tabsRef.current?.contains(document.activeElement)) return;

      const types = Object.keys(entityTypeConfig) as EntityType[];
      const currentIndex = types.indexOf(selectedType);

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (isRTL) {
            // RTL: Left arrow moves forward
            const nextIndex = (currentIndex + 1) % types.length;
            onTypeChange(types[nextIndex]);
          } else {
            // LTR: Left arrow moves backward
            const prevIndex = (currentIndex - 1 + types.length) % types.length;
            onTypeChange(types[prevIndex]);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (isRTL) {
            // RTL: Right arrow moves backward
            const prevIndex = (currentIndex - 1 + types.length) % types.length;
            onTypeChange(types[prevIndex]);
          } else {
            // LTR: Right arrow moves forward
            const nextIndex = (currentIndex + 1) % types.length;
            onTypeChange(types[nextIndex]);
          }
          break;
        case 'Home':
          e.preventDefault();
          onTypeChange('all');
          break;
        case 'End':
          e.preventDefault();
          onTypeChange(types[types.length - 1]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedType, isRTL, onTypeChange]);

  return (
    <div ref={tabsRef} className="w-full overflow-x-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <Tabs value={selectedType} onValueChange={(value) => onTypeChange(value as EntityType)}>
        <TabsList
          className="inline-flex h-10 w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground sm:w-auto"
          role="tablist"
          aria-label={t('search.tabs.label')}
        >
          {(Object.keys(entityTypeConfig) as EntityType[]).map((type) => {
            const config = entityTypeConfig[type];
            const count = counts[type] || 0;
            const isSelected = selectedType === type;

            return (
              <TabsTrigger
                key={type}
                value={type}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`search-results-${type}`}
                className={`
                  inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5
                  text-sm font-medium ring-offset-background transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  disabled:pointer-events-none disabled:opacity-50
                  data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
                  ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
                `}
                disabled={isLoading}
              >
                {/* Icon */}
                <span className={`me-2 ${isRTL ? 'me-0 ms-2' : ''}`}>{config.icon}</span>

                {/* Label */}
                <span className={isSelected ? config.color : ''}>
                  {t(`search.entityTypes.${config.labelKey}`)}
                </span>

                {/* Count Badge */}
                {count > 0 && (
                  <span
                    className={`
                      ms-2 ${isRTL ? 'me-2 ms-0' : ''}
                      inline-flex h-5 min-w-5
                      items-center justify-center rounded-full px-1.5
                      text-xs font-semibold
                      ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted-foreground/20 text-muted-foreground'
                      }
                    `}
                    aria-label={t('search.tabs.countLabel', { count })}
                  >
                    {count > 999 ? '999+' : count}
                  </span>
                )}

                {/* Loading indicator */}
                {isLoading && isSelected && (
                  <span className="ms-2 inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Keyboard hint (visible on focus) */}
      <div className="sr-only" role="status" aria-live="polite">
        {t('search.tabs.keyboardHint')}
      </div>
    </div>
  );
}
