/**
 * Tags Domain Barrel
 * @module domains/tags
 */

export {
  tagKeys,
  useTagHierarchy,
  useTagHierarchyTree,
  useTagsFlat,
  useTagSearch,
  useEntityTagging,
  useTagAnalytics,
  useRefreshTagAnalytics,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useMergeTags,
  useTagMergeHistory,
  useTagRenameHistory,
} from './hooks/useTagHierarchy'
export {
  templateKeys,
  useEntityTemplates,
  useEntityTemplate,
  useCreateEntityTemplate,
  useUpdateEntityTemplate,
  useDeleteEntityTemplate,
  useApplyEntityTemplate,
  useContextAwareTemplates,
  useToggleFavorite,
  useApplyTemplate,
} from './hooks/useEntityTemplates'
export {
  suggestionKeys,
  hasUrgentSuggestions,
  useContextualSuggestions,
} from './hooks/useContextualSuggestions'

export * as tagsRepo from './repositories/tags.repository'
export * from './types'
