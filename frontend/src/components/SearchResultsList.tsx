/**
 * SearchResultsList Component
 * Feature: 015-search-retrieval-spec + 017-entity-relationships-and
 * Tasks: T045, T097, T099
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
 * - Relationship context display (T097)
 * - Relationship path highlighting (T099)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Network } from 'lucide-react';

interface RelationshipPathSegment {
  dossier_id: string;
  dossier_name_en: string;
  dossier_name_ar: string;
  dossier_type: string;
  relationship_type?: string;
  relationship_strength?: 'primary' | 'secondary' | 'observer';
}

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
  // T097: Relationship context
  parentDossier?: {
    id: string;
    name_en: string;
    name_ar: string;
    type: string;
  };
  linkedDossiers?: Array<{
    id: string;
    name_en: string;
    name_ar: string;
    type: string;
    link_type?: string;
  }>;
  // T099: Relationship path for multi-dossier entities
  relationshipPath?: RelationshipPathSegment[];
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
  const [showRelationshipPath, setShowRelationshipPath] = useState(false);

  // T099: Get relationship strength color
  const getRelationshipColor = (strength?: string) => {
    switch (strength) {
      case 'primary':
        return 'text-blue-600 dark:text-blue-400';
      case 'secondary':
        return 'text-gray-600 dark:text-gray-400';
      case 'observer':
        return 'text-gray-400 dark:text-gray-500';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <a
      href={result.url}
      className="block rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-400"
      role="listitem"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Entity type badge */}
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${badge.color}`}>
              <span className="me-1">{badge.icon}</span>
              {isRTL ? badge.label.ar : badge.label.en}
            </span>

            {/* Archived badge */}
            {result.isArchived && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {isRTL ? 'مؤرشف' : 'Archived'}
              </span>
            )}

            {/* Match type badge */}
            {result.matchType === 'semantic' && (
              <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {isRTL ? 'تطابق دلالي' : 'Semantic match'}
              </span>
            )}

            {/* T099: Multi-dossier relationship badge */}
            {result.relationshipPath && result.relationshipPath.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowRelationshipPath(!showRelationshipPath);
                }}
                className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
              >
                <Network className="me-1 size-3" />
                {result.relationshipPath.length} {isRTL ? 'ملفات' : 'dossiers'}
              </button>
            )}
          </div>

          {/* Title (bilingual) */}
          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isRTL ? result.title_ar : result.title_en}
          </h3>

          {/* Secondary title */}
          {result.title_en && result.title_ar && (
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {isRTL ? result.title_en : result.title_ar}
            </p>
          )}

          {/* Snippet with highlights */}
          {(result.snippet_en || result.snippet_ar) && (
            <div
              className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: isRTL ? result.snippet_ar || '' : result.snippet_en || '',
              }}
            />
          )}

          {/* Metadata */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {isRTL ? 'آخر تحديث:' : 'Updated:'} {new Date(result.updatedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
          </div>

          {/* T097: Relationship Context - Parent Dossier */}
          {result.parentDossier && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <span>{isRTL ? 'من:' : 'from'}</span>
              <Badge variant="outline" className="text-xs">
                {isRTL ? result.parentDossier.name_ar : result.parentDossier.name_en}
              </Badge>
              <span className="text-gray-400">({result.parentDossier.type})</span>
            </div>
          )}

          {/* T097: Relationship Context - Linked Dossiers */}
          {result.linkedDossiers && result.linkedDossiers.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <span>{isRTL ? 'مرتبط بـ:' : 'linked to:'}</span>
              {result.linkedDossiers.slice(0, 2).map((dossier, idx) => (
                <Badge key={dossier.id} variant="outline" className="text-xs">
                  {isRTL ? dossier.name_ar : dossier.name_en}
                </Badge>
              ))}
              {result.linkedDossiers.length > 2 && (
                <span className="text-gray-400">
                  {isRTL ? `...و ${result.linkedDossiers.length - 2} أخرى` : `...and ${result.linkedDossiers.length - 2} more`}
                </span>
              )}
            </div>
          )}

          {/* T099: Expandable Relationship Path */}
          {showRelationshipPath && result.relationshipPath && result.relationshipPath.length > 0 && (
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                {isRTL ? 'مسار العلاقة:' : 'Relationship Path:'}
              </div>
              <div className="flex flex-col gap-2">
                {result.relationshipPath.map((segment, idx) => (
                  <div key={segment.dossier_id} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {isRTL ? segment.dossier_name_ar : segment.dossier_name_en}
                    </Badge>
                    {idx < result.relationshipPath!.length - 1 && (
                      <>
                        {isRTL ? (
                          <ChevronLeft className="size-3 text-gray-400" />
                        ) : (
                          <ChevronRight className="size-3 text-gray-400" />
                        )}
                        {segment.relationship_type && (
                          <span className={`text-xs ${getRelationshipColor(segment.relationship_strength)}`}>
                            {segment.relationship_type}
                          </span>
                        )}
                        {isRTL ? (
                          <ChevronLeft className="size-3 text-gray-400" />
                        ) : (
                          <ChevronRight className="size-3 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rank score (dev mode only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="shrink-0 text-end">
            <div className="text-xs text-gray-500 dark:text-gray-400">Rank</div>
            <div className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
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
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
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
      <div className="py-12 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('search.noResults.title')}
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          {t('search.noResults.description')}
        </p>

        {/* Typo suggestions */}
        {typoSuggestions.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
              {t('search.noResults.didYouMean')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {typoSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="rounded-md bg-blue-50 px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
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
          <div className="mx-auto max-w-md text-start">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('search.noResults.tips')}
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
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
            <h2 className="mb-3 px-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              <h2 className="mb-3 mt-6 px-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
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
          <div className="pt-4 text-center">
            <button
              onClick={onLoadMore}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              {t('search.loadMore')}
            </button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
