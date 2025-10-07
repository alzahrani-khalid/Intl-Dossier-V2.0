/**
 * SearchResultsList Component
 * Feature: 015-search-retrieval-spec
 * Task: T045
 *
 * Results list with:
 * - Bilingual result cards (title, snippet with highlights)
 * - Entity type badges
 * - Rank scores
 * - "Archived" badges
 * - Infinite scroll/pagination
 * - Empty states with typo suggestions
 * - Section dividers (Exact vs Related)
 * - Loading skeletons
 * - ARIA accessibility
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResult {
  id: string;
  entityType: 'dossier' | 'person' | 'engagement' | 'position' | 'document' | 'mou';
  title_en: string;
  title_ar: string;
  snippet_en?: string;
  snippet_ar?: string;
  rankScore: number;
  matchType: 'exact' | 'semantic';
  isArchived?: boolean;
  updatedAt: string;
  url: string;
}

interface SearchResultsListProps {
  results: SearchResult[];
  exactMatches?: SearchResult[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  typoSuggestions?: string[];
  searchTips?: string[];
}

const entityTypeBadges: Record<
  string,
  { icon: string; label: { en: string; ar: string }; color: string }
> = {
  dossier: {
    icon: '📁',
    label: { en: 'Dossier', ar: 'ملف' },
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  person: {
    icon: '👤',
    label: { en: 'Person', ar: 'شخص' },
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  engagement: {
    icon: '🤝',
    label: { en: 'Engagement', ar: 'مشاركة' },
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  position: {
    icon: '📋',
    label: { en: 'Position', ar: 'موقف' },
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  document: {
    icon: '📄',
    label: { en: 'Document', ar: 'وثيقة' },
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
  mou: {
    icon: '📜',
    label: { en: 'MoU', ar: 'مذكرة تفاهم' },
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
};

function ResultCard({ result, isRTL }: { result: SearchResult; isRTL: boolean }) {
  const badge = entityTypeBadges[result.entityType] || entityTypeBadges.dossier;

  return (
    <a
      href={result.url}
      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
      role="listitem"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Entity type badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${badge.color}`}>
              <span className="me-1">{badge.icon}</span>
              {isRTL ? badge.label.ar : badge.label.en}
            </span>

            {/* Archived badge */}
            {result.isArchived && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {isRTL ? 'مؤرشف' : 'Archived'}
              </span>
            )}

            {/* Match type badge */}
            {result.matchType === 'semantic' && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {isRTL ? 'تطابق دلالي' : 'Semantic match'}
              </span>
            )}
          </div>

          {/* Title (bilingual) */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isRTL ? result.title_ar : result.title_en}
          </h3>

          {/* Secondary title */}
          {result.title_en && result.title_ar && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {isRTL ? result.title_en : result.title_ar}
            </p>
          )}

          {/* Snippet with highlights */}
          {(result.snippet_en || result.snippet_ar) && (
            <div
              className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: isRTL ? result.snippet_ar || '' : result.snippet_en || '',
              }}
            />
          )}

          {/* Metadata */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {isRTL ? 'آخر تحديث:' : 'Updated:'} {new Date(result.updatedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
          </div>
        </div>

        {/* Rank score (dev mode only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex-shrink-0 text-end">
            <div className="text-xs text-gray-500 dark:text-gray-400">Rank</div>
            <div className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
              {result.rankScore.toFixed(1)}
            </div>
          </div>
        )}
      </div>
    </a>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

export function SearchResultsList({
  results,
  exactMatches = [],
  isLoading = false,
  hasMore = false,
  onLoadMore,
  typoSuggestions = [],
  searchTips = [],
}: SearchResultsListProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Empty state
  if (!isLoading && results.length === 0 && exactMatches.length === 0) {
    return (
      <div className="text-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('search.noResults.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('search.noResults.description')}
        </p>

        {/* Typo suggestions */}
        {typoSuggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {t('search.noResults.didYouMean')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {typoSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  onClick={() => {
                    // This would trigger a new search
                    // onSearchQueryChange(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search tips */}
        {searchTips.length > 0 && (
          <div className="max-w-md mx-auto text-start">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('search.noResults.tips')}
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              {searchTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-4" role="list">
        {/* Exact Matches Section */}
        {exactMatches.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1">
              {t('search.sections.exactMatches')} ({exactMatches.length})
            </h2>
            <div className="space-y-3">
              {exactMatches.map((result) => (
                <ResultCard key={result.id} result={result} isRTL={isRTL} />
              ))}
            </div>
          </div>
        )}

        {/* Related/Semantic Matches Section */}
        {results.length > 0 && (
          <div>
            {exactMatches.length > 0 && (
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 px-1 mt-6">
                {t('search.sections.related')} ({results.length})
              </h2>
            )}
            <div className="space-y-3">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} isRTL={isRTL} />
              ))}
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <LoadingSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Load more button */}
        {!isLoading && hasMore && onLoadMore && (
          <div className="text-center pt-4">
            <button
              onClick={onLoadMore}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {t('search.loadMore')}
            </button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
