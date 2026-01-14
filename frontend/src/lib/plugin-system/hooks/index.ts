/**
 * Plugin System Hooks - Barrel Export
 */

export {
  useEntityPlugin,
  usePluginEntities,
  usePluginEntity,
  useCreatePluginEntity,
  useUpdatePluginEntity,
  useDeletePluginEntity,
  entityPluginKeys,
  type UseEntityPluginOptions,
  type UseEntityPluginReturn,
} from './useEntityPlugin'

export {
  usePluginValidation,
  type UsePluginValidationOptions,
  type UsePluginValidationReturn,
} from './usePluginValidation'

export {
  usePluginPermissions,
  type UsePluginPermissionsOptions,
  type UsePluginPermissionsReturn,
} from './usePluginPermissions'

export {
  usePluginRelationships,
  type PluginRelationship,
  type RelationshipWithTarget,
  type CreateRelationshipInput,
  type UsePluginRelationshipsOptions,
  type UsePluginRelationshipsReturn,
} from './usePluginRelationships'

export {
  usePluginUI,
  useEntityDisplay,
  type UsePluginUIOptions,
  type UsePluginUIReturn,
} from './usePluginUI'
