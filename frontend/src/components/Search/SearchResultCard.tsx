/**
 * SearchResultCard Component
 * Feature: Cross-Entity Search Disambiguation
 *
 * Enhanced result card with:
 * - Clear entity type indicators with icons and colors
 * - Match reason indicators showing why each result matched
 * - Highlighted matching fields
 * - Relationship context
 * - Mobile-first, RTL-compatible design
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  ChevronLeft,
  Network,
  FileText,
  MapPin,
  Tag,
  Calendar,
  User,
  Building2,
  Globe,
  Users,
  Briefcase,
  Target,
  BookOpen,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Match reason types
export type MatchField =
  | 'title'
  | 'description'
  | 'content'
  | 'tags'
  | 'metadata'
  | 'related_entity'
  | 'parent_dossier'
  | 'semantic'

export interface MatchReason {
  field: MatchField
  value?: string
  highlight?: string
}

export interface RelationshipPathSegment {
  dossier_id: string
  dossier_name_en: string
  dossier_name_ar: string
  dossier_type: string
  relationship_type?: string
  relationship_strength?: 'primary' | 'secondary' | 'observer'
}

export interface SearchResultData {
  id: string
  entityType:
    | 'country'
    | 'organization'
    | 'forum'
    | 'engagement'
    | 'theme'
    | 'working_group'
    | 'person'
    | 'position'
    | 'document'
    | 'mou'
  title_en: string
  title_ar: string
  snippet_en?: string
  snippet_ar?: string
  description_en?: string
  description_ar?: string
  rankScore: number
  matchType: 'exact' | 'semantic'
  matchReasons?: MatchReason[]
  isArchived?: boolean
  updatedAt: string
  url: string
  status?: string
  tags?: string[]
  // Relationship context
  parentDossier?: {
    id: string
    name_en: string
    name_ar: string
    type: string
  }
  linkedDossiers?: Array<{
    id: string
    name_en: string
    name_ar: string
    type: string
    link_type?: string
  }>
  // Relationship path for multi-dossier entities
  relationshipPath?: RelationshipPathSegment[]
}

interface SearchResultCardProps {
  result: SearchResultData
  searchQuery?: string
  showMatchReasons?: boolean
  showRelationships?: boolean
  compact?: boolean
}

// Entity type configuration with icons and colors
const entityTypeConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    label: { en: string; ar: string }
    color: string
    bgColor: string
    description: { en: string; ar: string }
  }
> = {
  country: {
    icon: Globe,
    label: { en: 'Country', ar: 'دولة' },
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: { en: 'Partner country dossier', ar: 'ملف دولة شريكة' },
  },
  organization: {
    icon: Building2,
    label: { en: 'Organization', ar: 'منظمة' },
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: { en: 'Organization profile', ar: 'ملف تعريف المنظمة' },
  },
  forum: {
    icon: Users,
    label: { en: 'Forum', ar: 'منتدى' },
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    description: { en: 'Forum or conference', ar: 'منتدى أو مؤتمر' },
  },
  engagement: {
    icon: Briefcase,
    label: { en: 'Engagement', ar: 'مشاركة' },
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: { en: 'Meeting or event record', ar: 'سجل اجتماع أو فعالية' },
  },
  theme: {
    icon: Target,
    label: { en: 'Theme', ar: 'موضوع' },
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: { en: 'Thematic dossier', ar: 'ملف موضوعي' },
  },
  working_group: {
    icon: BookOpen,
    label: { en: 'Working Group', ar: 'مجموعة عمل' },
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: { en: 'Working group record', ar: 'سجل مجموعة عمل' },
  },
  person: {
    icon: User,
    label: { en: 'Person', ar: 'شخص' },
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    description: { en: 'Contact or delegate', ar: 'جهة اتصال أو مندوب' },
  },
  position: {
    icon: FileText,
    label: { en: 'Position', ar: 'موقف' },
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: { en: 'Position document', ar: 'وثيقة موقف' },
  },
  document: {
    icon: FileText,
    label: { en: 'Document', ar: 'وثيقة' },
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    description: { en: 'Attached document', ar: 'وثيقة مرفقة' },
  },
  mou: {
    icon: ScrollText,
    label: { en: 'MoU', ar: 'مذكرة تفاهم' },
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: { en: 'Memorandum of Understanding', ar: 'مذكرة تفاهم' },
  },
}

// Match field icons and labels
const matchFieldConfig: Record<
  MatchField,
  { icon: React.ComponentType<{ className?: string }>; label: { en: string; ar: string } }
> = {
  title: { icon: Tag, label: { en: 'Title match', ar: 'تطابق العنوان' } },
  description: { icon: FileText, label: { en: 'Description match', ar: 'تطابق الوصف' } },
  content: { icon: FileText, label: { en: 'Content match', ar: 'تطابق المحتوى' } },
  tags: { icon: Tag, label: { en: 'Tag match', ar: 'تطابق الوسم' } },
  metadata: { icon: MapPin, label: { en: 'Metadata match', ar: 'تطابق البيانات الوصفية' } },
  related_entity: { icon: Network, label: { en: 'Related entity', ar: 'كيان مرتبط' } },
  parent_dossier: { icon: Building2, label: { en: 'Parent dossier', ar: 'الدوسيه الأم' } },
  semantic: { icon: Sparkles, label: { en: 'Semantic match', ar: 'تطابق دلالي' } },
}

export function SearchResultCard({
  result,
  searchQuery,
  showMatchReasons = true,
  showRelationships = true,
  compact = false,
}: SearchResultCardProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [showRelationshipPath, setShowRelationshipPath] = useState(false)

  const config = entityTypeConfig[result.entityType] || entityTypeConfig.document
  const Icon = config.icon

  // Highlight search query in text
  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</mark>',
    )
  }

  const title = isRTL ? result.title_ar : result.title_en
  const secondaryTitle = isRTL ? result.title_en : result.title_ar
  const snippet = isRTL ? result.snippet_ar : result.snippet_en

  // Get relationship strength color
  const getRelationshipColor = (strength?: string) => {
    switch (strength) {
      case 'primary':
        return 'text-blue-600 dark:text-blue-400'
      case 'secondary':
        return 'text-gray-600 dark:text-gray-400'
      case 'observer':
        return 'text-gray-400 dark:text-gray-500'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <a
      href={result.url}
      className={cn(
        'block rounded-lg border border-gray-200 transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:hover:border-blue-400',
        compact ? 'p-3' : 'p-4',
      )}
      role="listitem"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-3">
        {/* Entity Type Icon */}
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg',
            config.bgColor,
            compact ? 'size-10' : 'size-12',
          )}
          title={isRTL ? config.description.ar : config.description.en}
        >
          <Icon className={cn(config.color, compact ? 'size-5' : 'size-6')} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Entity Type Badge + Status Row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {/* Entity type badge with full label */}
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1 border-0 font-medium',
                config.bgColor,
                config.color,
              )}
            >
              <Icon className="size-3" />
              {isRTL ? config.label.ar : config.label.en}
            </Badge>

            {/* Archived badge */}
            {result.isArchived && (
              <Badge variant="secondary" className="text-xs">
                {isRTL ? 'مؤرشف' : 'Archived'}
              </Badge>
            )}

            {/* Match type badge */}
            {result.matchType === 'semantic' && (
              <Badge
                variant="outline"
                className="inline-flex items-center gap-1 border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
              >
                <Sparkles className="size-3" />
                {isRTL ? 'تطابق دلالي' : 'Semantic'}
              </Badge>
            )}

            {/* Multi-dossier relationship badge */}
            {showRelationships && result.relationshipPath && result.relationshipPath.length > 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setShowRelationshipPath(!showRelationshipPath)
                }}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
              >
                <Network className="size-3" />
                {result.relationshipPath.length} {isRTL ? 'ملفات' : 'dossiers'}
              </button>
            )}
          </div>

          {/* Title (bilingual) */}
          <h3
            className={cn(
              'font-semibold text-gray-900 dark:text-gray-100',
              compact ? 'text-base' : 'text-lg',
            )}
            dangerouslySetInnerHTML={{
              __html: highlightText(title, searchQuery),
            }}
          />

          {/* Secondary title */}
          {secondaryTitle && title !== secondaryTitle && !compact && (
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{secondaryTitle}</p>
          )}

          {/* Snippet with highlights */}
          {snippet && !compact && (
            <div
              className="mb-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: snippet,
              }}
            />
          )}

          {/* Match Reasons */}
          {showMatchReasons && result.matchReasons && result.matchReasons.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {result.matchReasons.slice(0, 3).map((reason, idx) => {
                const fieldConfig = matchFieldConfig[reason.field]
                const FieldIcon = fieldConfig.icon
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    title={reason.highlight || reason.value}
                  >
                    <FieldIcon className="size-3" />
                    {isRTL ? fieldConfig.label.ar : fieldConfig.label.en}
                    {reason.value && (
                      <span className="max-w-20 truncate font-medium text-gray-800 dark:text-gray-200">
                        : {reason.value}
                      </span>
                    )}
                  </span>
                )
              })}
              {result.matchReasons.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                  +{result.matchReasons.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {result.tags && result.tags.length > 0 && !compact && (
            <div className="mb-2 flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{result.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {/* Updated date */}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(result.updatedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
            </span>

            {/* Rank score (dev mode) */}
            {process.env.NODE_ENV === 'development' && (
              <span className="font-mono">
                {isRTL ? 'الترتيب:' : 'Rank:'} {result.rankScore.toFixed(1)}
              </span>
            )}
          </div>

          {/* Parent Dossier Context */}
          {showRelationships && result.parentDossier && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Building2 className="size-3" />
              <span>{isRTL ? 'من:' : 'from'}</span>
              <Badge variant="outline" className="text-xs">
                {isRTL ? result.parentDossier.name_ar : result.parentDossier.name_en}
              </Badge>
              <span className="text-gray-400">({result.parentDossier.type})</span>
            </div>
          )}

          {/* Linked Dossiers */}
          {showRelationships &&
            result.linkedDossiers &&
            result.linkedDossiers.length > 0 &&
            !compact && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <Network className="size-3" />
                <span>{isRTL ? 'مرتبط بـ:' : 'linked to:'}</span>
                {result.linkedDossiers.slice(0, 2).map((dossier) => (
                  <Badge key={dossier.id} variant="outline" className="text-xs">
                    {isRTL ? dossier.name_ar : dossier.name_en}
                  </Badge>
                ))}
                {result.linkedDossiers.length > 2 && (
                  <span className="text-gray-400">
                    {isRTL
                      ? `...و ${result.linkedDossiers.length - 2} أخرى`
                      : `...and ${result.linkedDossiers.length - 2} more`}
                  </span>
                )}
              </div>
            )}

          {/* Expandable Relationship Path */}
          {showRelationshipPath &&
            result.relationshipPath &&
            result.relationshipPath.length > 0 && (
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
                            <span
                              className={cn(
                                'text-xs',
                                getRelationshipColor(segment.relationship_strength),
                              )}
                            >
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
      </div>
    </a>
  )
}
