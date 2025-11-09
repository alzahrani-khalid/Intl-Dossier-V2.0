/**
 * SearchSuggestions Component
 * Feature: 015-search-retrieval-spec
 * Task: T043
 *
 * Typeahead dropdown with:
 * - Keyboard navigation (↑/↓ arrows, Enter, Escape)
 * - Entity type grouping
 * - Bilingual suggestions
 * - Match highlighting
 * - ARIA accessibility
 */

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Suggestion {
 id: string;
 title_en: string;
 title_ar: string;
 type: 'dossier' | 'person' | 'engagement' | 'position' | 'document' | 'mou';
 preview?: string;
 score: number;
}

interface SearchSuggestionsProps {
 suggestions: Suggestion[];
 isOpen: boolean;
 activeIndex: number;
 onSelect: (suggestion: Suggestion) => void;
 onClose: () => void;
 onActiveIndexChange: (index: number) => void;
 isLoading?: boolean;
}

const entityTypeIcons: Record<string, string> = {
 dossier: '📁',
 person: '👤',
 engagement: '🤝',
 position: '📋',
 document: '📄',
 mou: '📜',
};

const entityTypeLabels: Record<string, { en: string; ar: string }> = {
 dossier: { en: 'Dossier', ar: 'ملف' },
 person: { en: 'Person', ar: 'شخص' },
 engagement: { en: 'Engagement', ar: 'مشاركة' },
 position: { en: 'Position', ar: 'موقف' },
 document: { en: 'Document', ar: 'وثيقة' },
 mou: { en: 'MoU', ar: 'مذكرة تفاهم' },
};

export function SearchSuggestions({
 suggestions,
 isOpen,
 activeIndex,
 onSelect,
 onClose,
 onActiveIndexChange,
 isLoading = false,
}: SearchSuggestionsProps) {
 const { t, i18n } = useTranslation();
 const listRef = useRef<HTMLDivElement>(null);
 const activeItemRef = useRef<HTMLDivElement>(null);
 const isRTL = i18n.language === 'ar';

 // Scroll active item into view
 useEffect(() => {
 if (activeItemRef.current && isOpen) {
 activeItemRef.current.scrollIntoView({
 block: 'nearest',
 behavior: 'smooth',
 });
 }
 }, [activeIndex, isOpen]);

 // Handle keyboard navigation
 useEffect(() => {
 if (!isOpen) return;

 const handleKeyDown = (e: KeyboardEvent) => {
 switch (e.key) {
 case 'ArrowDown':
 e.preventDefault();
 onActiveIndexChange(Math.min(activeIndex + 1, suggestions.length - 1));
 break;
 case 'ArrowUp':
 e.preventDefault();
 onActiveIndexChange(Math.max(activeIndex - 1, 0));
 break;
 case 'Enter':
 e.preventDefault();
 if (activeIndex >= 0 && suggestions[activeIndex]) {
 onSelect(suggestions[activeIndex]);
 }
 break;
 case 'Escape':
 e.preventDefault();
 onClose();
 break;
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [isOpen, activeIndex, suggestions, onActiveIndexChange, onSelect, onClose]);

 if (!isOpen) return null;

 // Group suggestions by entity type
 const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
 if (!acc[suggestion.type]) {
 acc[suggestion.type] = [];
 }
 acc[suggestion.type].push(suggestion);
 return acc;
 }, {} as Record<string, Suggestion[]>);

 return (
 <div
 className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
 role="listbox"
 aria-label={t('search.suggestions.label')}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <ScrollArea className="max-h-96">
 <div ref={listRef} className="p-2">
 {isLoading ? (
 <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
 {t('search.suggestions.loading')}
 </div>
 ) : suggestions.length === 0 ? (
 <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
 {t('search.suggestions.noResults')}
 </div>
 ) : (
 Object.entries(groupedSuggestions).map(([type, items]) => (
 <div key={type} className="mb-3 last:mb-0">
 {/* Entity Type Header */}
 <div className="px-3 py-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
 <span className="me-1">{entityTypeIcons[type]}</span>
 {isRTL
 ? entityTypeLabels[type]?.ar || type
 : entityTypeLabels[type]?.en || type}
 </div>

 {/* Suggestions List */}
 {items.map((suggestion, idx) => {
 const globalIndex = suggestions.indexOf(suggestion);
 const isActive = globalIndex === activeIndex;

 return (
 <div
 key={suggestion.id}
 ref={isActive ? activeItemRef : null}
 role="option"
 aria-selected={isActive}
 className={`
 cursor-pointer rounded-md px-3 py-2 transition-colors
 ${
 isActive
 ? 'bg-blue-50 dark:bg-blue-900/20'
 : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
 }
 `}
 onClick={() => onSelect(suggestion)}
 onMouseEnter={() => onActiveIndexChange(globalIndex)}
 >
 <div className="flex items-start justify-between">
 {/* Title (bilingual) */}
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
 {isRTL ? suggestion.title_ar : suggestion.title_en}
 </div>
 {/* Secondary title */}
 {suggestion.title_en && suggestion.title_ar && (
 <div className="truncate text-xs text-gray-500 dark:text-gray-400">
 {isRTL ? suggestion.title_en : suggestion.title_ar}
 </div>
 )}
 {/* Preview text */}
 {suggestion.preview && (
 <div className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
 {suggestion.preview}
 </div>
 )}
 </div>

 {/* Score badge (for debugging in dev mode) */}
 {process.env.NODE_ENV === 'development' && (
 <div className="ms-2 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
 {(suggestion.score * 100).toFixed(0)}%
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 ))
 )}
 </div>
 </ScrollArea>

 {/* Footer hint */}
 {!isLoading && suggestions.length > 0 && (
 <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800/50">
 <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
 <span>
 {isRTL
 ? 'استخدم ↑/↓ للتنقل، Enter للاختيار، Esc للإغلاق'
 : 'Use ↑/↓ to navigate, Enter to select, Esc to close'}
 </span>
 </div>
 </div>
 )}
 </div>
 );
}
