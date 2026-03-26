/**
 * Tags Domain Barrel
 * @module domains/tags
 */

export { tagKeys, useTagHierarchy, useCreateTag, useUpdateTag, useDeleteTag } from './hooks/useTagHierarchy'
export {
  templateKeys,
  useEntityTemplates,
  useEntityTemplate,
  useCreateEntityTemplate,
  useUpdateEntityTemplate,
  useDeleteEntityTemplate,
  useApplyEntityTemplate,
} from './hooks/useEntityTemplates'
export { suggestionKeys, useContextualSuggestions } from './hooks/useContextualSuggestions'

export * as tagsRepo from './repositories/tags.repository'
export * from './types'
