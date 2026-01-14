/**
 * DI Container Interfaces
 *
 * Defines core interfaces for the dependency injection system including
 * disposable resources, service providers, and scope management.
 *
 * @module container/interfaces
 */

/**
 * Service lifetime types
 */
export enum ServiceLifetime {
  /** Single instance for the entire application */
  Singleton = 'singleton',
  /** New instance per scope (request/tenant) */
  Scoped = 'scoped',
  /** New instance per resolution */
  Transient = 'transient',
}

/**
 * Scope hierarchy levels
 */
export enum ScopeLevel {
  /** Root/application level - lives for entire app lifetime */
  Application = 'application',
  /** Tenant level - lives for tenant session */
  Tenant = 'tenant',
  /** Request level - lives for single HTTP request */
  Request = 'request',
}

/**
 * Interface for disposable resources
 * Implement this to handle cleanup when a scope ends
 */
export interface IDisposable {
  /** Clean up resources */
  dispose(): void | Promise<void>
}

/**
 * Interface for async disposable resources
 */
export interface IAsyncDisposable {
  /** Async clean up resources */
  disposeAsync(): Promise<void>
}

/**
 * Type guard to check if an object is disposable
 */
export function isDisposable(obj: unknown): obj is IDisposable {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'dispose' in obj &&
    typeof (obj as IDisposable).dispose === 'function'
  )
}

/**
 * Type guard to check if an object is async disposable
 */
export function isAsyncDisposable(obj: unknown): obj is IAsyncDisposable {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'disposeAsync' in obj &&
    typeof (obj as IAsyncDisposable).disposeAsync === 'function'
  )
}

/**
 * Service factory type - creates a service instance
 */
export type ServiceFactory<T> = (scope: IServiceScope) => T

/**
 * Service registration descriptor
 */
export interface ServiceDescriptor<T = unknown> {
  /** Unique token identifying the service */
  token: symbol
  /** Factory function to create instances */
  factory: ServiceFactory<T>
  /** Lifetime of the service */
  lifetime: ServiceLifetime
  /** Minimum scope level where this service can be resolved */
  minimumScopeLevel?: ScopeLevel
}

/**
 * Service scope interface - represents a resolution scope
 */
export interface IServiceScope extends IDisposable {
  /** Unique identifier for this scope */
  readonly id: string
  /** The level of this scope in the hierarchy */
  readonly level: ScopeLevel
  /** Parent scope (null for root) */
  readonly parent: IServiceScope | null
  /** Scope metadata (e.g., tenantId, requestId) */
  readonly metadata: ScopeMetadata

  /**
   * Resolve a service from this scope
   * @param token - The service token
   * @returns The resolved service instance
   */
  resolve<T>(token: symbol): T

  /**
   * Try to resolve a service, returning undefined if not found
   * @param token - The service token
   * @returns The resolved service instance or undefined
   */
  tryResolve<T>(token: symbol): T | undefined

  /**
   * Check if a service is registered
   * @param token - The service token
   */
  has(token: symbol): boolean

  /**
   * Create a child scope
   * @param level - The level of the child scope
   * @param metadata - Additional metadata for the scope
   */
  createChildScope(level: ScopeLevel, metadata?: Partial<ScopeMetadata>): IServiceScope

  /**
   * Register a scoped instance for this scope only
   * Used for request-specific registrations
   */
  registerScopedInstance<T>(token: symbol, instance: T): void
}

/**
 * Scope metadata
 */
export interface ScopeMetadata {
  /** Unique scope ID */
  scopeId: string
  /** Tenant ID (for tenant and request scopes) */
  tenantId?: string
  /** Request ID (for request scopes) */
  requestId?: string
  /** User ID (for request scopes) */
  userId?: string
  /** Additional custom metadata */
  [key: string]: unknown
}

/**
 * Service provider interface - the main container
 */
export interface IServiceProvider {
  /**
   * Register a service with the container
   */
  register<T>(descriptor: ServiceDescriptor<T>): this

  /**
   * Register a singleton service
   */
  registerSingleton<T>(token: symbol, factory: ServiceFactory<T>): this

  /**
   * Register a scoped service
   */
  registerScoped<T>(token: symbol, factory: ServiceFactory<T>, minimumLevel?: ScopeLevel): this

  /**
   * Register a transient service
   */
  registerTransient<T>(token: symbol, factory: ServiceFactory<T>): this

  /**
   * Register an existing instance as a singleton
   */
  registerInstance<T>(token: symbol, instance: T): this

  /**
   * Get the root scope
   */
  getRootScope(): IServiceScope

  /**
   * Create a new tenant-level scope
   */
  createTenantScope(tenantId: string): IServiceScope

  /**
   * Create a new request-level scope
   */
  createRequestScope(parentScope: IServiceScope, requestId: string, userId?: string): IServiceScope

  /**
   * Check if a service is registered
   */
  has(token: symbol): boolean

  /**
   * Get all registered tokens
   */
  getRegisteredTokens(): symbol[]
}

/**
 * Scope events for monitoring
 */
export interface ScopeEvents {
  /** Called when a scope is created */
  onScopeCreated?: (scope: IServiceScope) => void
  /** Called when a scope is being disposed */
  onScopeDisposing?: (scope: IServiceScope) => void
  /** Called when a scope has been disposed */
  onScopeDisposed?: (scope: IServiceScope) => void
  /** Called when a service is resolved */
  onServiceResolved?: (token: symbol, scope: IServiceScope) => void
  /** Called when disposal of a service fails */
  onDisposalError?: (token: symbol, error: Error, scope: IServiceScope) => void
}
