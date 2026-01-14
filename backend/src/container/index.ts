/**
 * DI Container Module
 *
 * Exports the dependency injection container, interfaces, and utilities.
 *
 * @module container
 */

// Interfaces and types
export {
  ServiceLifetime,
  ScopeLevel,
  IDisposable,
  IAsyncDisposable,
  isDisposable,
  isAsyncDisposable,
  type ServiceFactory,
  type ServiceDescriptor,
  type IServiceScope,
  type IServiceProvider,
  type ScopeMetadata,
  type ScopeEvents,
} from './interfaces'

// Service scope implementation
export { ServiceScope } from './service-scope'

// Service provider (main container)
export {
  ServiceProvider,
  getServiceProvider,
  initializeServiceProvider,
  resetServiceProvider,
} from './service-provider'

// Express middleware
export {
  createScopeMiddleware,
  scopeMiddleware,
  getRequestScope,
  resolveFromRequest,
  tryResolveFromRequest,
  InjectFromScope,
  type ScopeMiddlewareOptions,
} from './scope-middleware'

// DI tokens
export { TYPES } from './types'
export type { DITypes } from './types'

// Container configuration
export {
  configureServiceProvider,
  setupContainer,
  RequestContextImpl,
  RequestLogger,
  TenantCache,
  type ContainerConfig,
  type RequestContext,
} from './configure'

// Legacy container exports (for backward compatibility)
export {
  Container,
  configureContainer,
  getContainer,
  initializeContainer,
  resetContainer,
} from './container'

// Anti-Corruption Layer (ACL) registration
export {
  registerACLServices,
  registerEmailService,
  registerSignatureService,
  registerCalendarService,
  registerAIService,
  loadACLConfiguration,
  getACLServiceTokens,
  type ACLConfiguration,
} from './acl-registration'
