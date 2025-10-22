/**
 * QuickSwitcher Component (T098)
 *
 * Command palette-style modal for quick navigation
 * Triggered by Cmd+K (Mac) or Ctrl+K (Windows)
 *
 * Features:
 * - Typeahead search across all entities
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Recent entities cache
 * - Grouped results by entity type
 * - Relationship context display
 * - Mobile-first full-screen modal
 * - RTL support
 * - Focus trap accessibility
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  FileText,
  Users,
  Briefcase,
  FileCheck,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface SearchResult {
  id: string;
  entityType: 'dossier' | 'person' | 'engagement' | 'position' | 'mou' | 'intelligence_signal';
  title_en: string;
  title_ar: string;
  url: string;
  relationshipContext?: {
    parent_dossier_name_en?: string;
    parent_dossier_name_ar?: string;
    linked_dossiers_count?: number;
  };
  recent?: boolean;
}

const entityIcons = {
  dossier: FileText,
  person: Users,
  engagement: Briefcase,
  position: FileCheck,
  mou: FileCheck,
  intelligence_signal: Lightbulb,
};

const entityLabels = {
  en: {
    dossier: 'Dossier',
    person: 'Person',
    engagement: 'Engagement',
    position: 'Position',
    mou: 'MoU',
    intelligence_signal: 'Intelligence',
  },
  ar: {
    dossier: 'ملف',
    person: 'شخص',
    engagement: 'مشاركة',
    position: 'موقف',
    mou: 'مذكرة تفاهم',
    intelligence_signal: 'معلومات',
  },
};

export function QuickSwitcher() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isRTL = i18n.language === 'ar';

  // Debounce search query
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent_entities');
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored).slice(0, 10));
      } catch (e) {
        console.error('Failed to load recent items:', e);
      }
    }
  }, []);

  // Global keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Search API call
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual global search API call from feature 015
        // For now, using mock data structure
        const mockResults: SearchResult[] = [
          // This would come from the API
        ];
        setResults(mockResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const displayedResults = searchQuery ? results : recentItems;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < displayedResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = displayedResults[selectedIndex];
        if (selected) {
          handleSelectResult(selected);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    },
    [searchQuery, results, recentItems, selectedIndex, handleSelectResult]
  );

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    // Save to recent items
    const updated = [
      result,
      ...recentItems.filter((item) => item.id !== result.id),
    ].slice(0, 10);
    setRecentItems(updated);
    localStorage.setItem('recent_entities', JSON.stringify(updated));

    // Navigate to URL
    navigate({ to: result.url });
    setOpen(false);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  // Group results by entity type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.entityType]) {
      acc[result.entityType] = [];
    }
    acc[result.entityType].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const displayedResults = searchQuery ? results : recentItems;

  return (
    <>
      {/* Trigger button (optional - can be placed in navbar) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 sm:flex"
        aria-label={t('quickswitcher.open')}
      >
        <Search className="size-4" />
        <span className="hidden md:inline">{t('quickswitcher.search')}</span>
        <kbd className="hidden items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800 md:inline-flex">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>

      {/* Quick Switcher Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-2xl"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <DialogHeader className="px-4 pb-0 pt-4">
            <DialogTitle className="sr-only">
              {t('quickswitcher.title')}
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="relative">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isRTL ? 'end-3' : 'start-3'
                } size-4 text-gray-400`}
              />
              <Input
                ref={inputRef}
                type="search"
                placeholder={t('quickswitcher.placeholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className={`w-full ${isRTL ? 'pe-10' : 'ps-10'} border-0 focus-visible:ring-0`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1 px-4 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
                {t('quickswitcher.searching')}
              </div>
            ) : displayedResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? (
                  <>
                    <Search className="mb-2 size-8 opacity-50" />
                    <p>{t('quickswitcher.no_results')}</p>
                  </>
                ) : (
                  <>
                    <Clock className="mb-2 size-8 opacity-50" />
                    <p>{t('quickswitcher.no_recent')}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {/* Recent items header */}
                {!searchQuery && recentItems.length > 0 && (
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <Clock className="me-1 inline size-3" />
                    {t('quickswitcher.recent')}
                  </div>
                )}

                {/* Results grouped by type (if searching) or recent items */}
                {searchQuery
                  ? Object.entries(groupedResults).map(([type, items]) => (
                      <div key={type} className="space-y-1">
                        <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                          {isRTL
                            ? entityLabels.ar[type as keyof typeof entityLabels.ar]
                            : entityLabels.en[type as keyof typeof entityLabels.en]}
                        </div>
                        {items.map((result) => {
                          const globalIndex = results.indexOf(result);
                          const Icon =
                            entityIcons[result.entityType as keyof typeof entityIcons];
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleSelectResult(result)}
                              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-start transition-colors ${
                                globalIndex === selectedIndex
                                  ? 'bg-blue-50 dark:bg-blue-900/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <Icon className="size-4 shrink-0 text-gray-400" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {isRTL ? result.title_ar : result.title_en}
                                </div>
                                {result.relationshipContext && (
                                  <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                    {isRTL ? 'من: ' : 'from '}
                                    {isRTL
                                      ? result.relationshipContext.parent_dossier_name_ar
                                      : result.relationshipContext.parent_dossier_name_en}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))
                  : displayedResults.map((result) => {
                      const Icon =
                        entityIcons[result.entityType as keyof typeof entityIcons];
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-start transition-colors ${
                            idx === selectedIndex
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="size-4 shrink-0 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {isRTL ? result.title_ar : result.title_en}
                            </div>
                            {result.relationshipContext && (
                              <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {isRTL ? 'من: ' : 'from '}
                                {isRTL
                                  ? result.relationshipContext.parent_dossier_name_ar
                                  : result.relationshipContext.parent_dossier_name_en}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {isRTL
                              ? entityLabels.ar[result.entityType as keyof typeof entityLabels.ar]
                              : entityLabels.en[result.entityType as keyof typeof entityLabels.en]}
                          </Badge>
                        </button>
                      );
                    })}
              </div>
            )}
          </ScrollArea>

          {/* Footer with keyboard hints */}
          <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                    ↑↓
                  </kbd>{' '}
                  {t('quickswitcher.navigate')}
                </span>
                <span>
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                    ↵
                  </kbd>{' '}
                  {t('quickswitcher.select')}
                </span>
              </div>
              <span>
                <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
                  esc
                </kbd>{' '}
                {t('quickswitcher.close')}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
