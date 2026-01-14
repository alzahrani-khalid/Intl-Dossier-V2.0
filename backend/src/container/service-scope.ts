/**
 * Service Scope Implementation
 *
 * Represents a resolution scope in the DI container hierarchy.
 * Manages scoped service instances and handles disposal.
 *
 * @module container/service-scope
 */

import { randomUUID } from 'crypto'
import {
  IServiceScope,
  ServiceDescriptor,
  ServiceLifetime,
  ScopeLevel,
  ScopeMetadata,
  ScopeEvents,
  isDisposable,
  isAsyncDisposable,
} from './interfaces'

/**
 * Scope level priority for validation
 */
const SCOPE_LEVEL_PRIORITY: Record<ScopeLevel, number> = {
  [ScopeLevel.Application]: 0,
  [ScopeLevel.Tenant]: 1,
  [ScopeLevel.Request]: 2,
}

/**
 * ServiceScope - A hierarchical scope for dependency resolution
 *
 * Features:
 * - Hierarchical scope chain (Application → Tenant → Request)
 * - Instance caching for scoped and singleton services
 * - Proper disposal of created instances
 * - Request-specific instance registration
 */
export class ServiceScope implements IServiceScope {
  readonly id: string
  readonly level: ScopeLevel
  readonly parent: IServiceScope | null
  readonly metadata: ScopeMetadata

  private readonly descriptors: Map<symbol, ServiceDescriptor>
  private readonly singletonInstances: Map<symbol, unknown>
  private readonly scopedInstances: Map<symbol, unknown> = new Map()
  private readonly childScopes: Set<IServiceScope> = new Set()
  private readonly events?: ScopeEvents
  private isDisposed = false

  constructor(
    level: ScopeLevel,
    descriptors: Map<symbol, ServiceDescriptor>,
    singletonInstances: Map<symbol, unknown>,
    parent: IServiceScope | null = null,
    metadata: Partial<ScopeMetadata> = {},
    events?: ScopeEvents,
  ) {
    this.id = randomUUID()
    this.level = level
    this.descriptors = descriptors
    this.singletonInstances = singletonInstances
    this.parent = parent
    this.events = events
    this.metadata = {
      scopeId: this.id,
      ...metadata,
    }

    // Notify scope creation
    this.events?.onScopeCreated?.(this)
  }

  /**
   * Resolve a service from this scope
   */
  resolve<T>(token: symbol): T {
    this.ensureNotDisposed()

    const instance = this.resolveInternal<T>(token)

    if (instance === undefined) {
      throw new Error(
        `Service not registered: ${token.toString()}. ` + `Scope: ${this.level}, ID: ${this.id}`,
      )
    }

    this.events?.onServiceResolved?.(token, this)
    return instance
  }

  /**
   * Try to resolve a service, returning undefined if not found
   */
  tryResolve<T>(token: symbol): T | undefined {
    this.ensureNotDisposed()

    try {
      return this.resolveInternal<T>(token)
    } catch {
      return undefined
    }
  }

  /**
   * Check if a service is registered
   */
  has(token: symbol): boolean {
    return this.descriptors.has(token)
  }

  /**
   * Internal resolution logic
   */
  private resolveInternal<T>(token: symbol): T | undefined {
    const descriptor = this.descriptors.get(token)

    if (!descriptor) {
      return undefined
    }

    // Validate scope level
    this.validateScopeLevel(descriptor)

    // Route based on lifetime
    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        return this.resolveSingleton<T>(token, descriptor)

      case ServiceLifetime.Scoped:
        return this.resolveScoped<T>(token, descriptor)

      case ServiceLifetime.Transient:
        return this.resolveTransient<T>(descriptor)

      default:
        throw new Error(`Unknown lifetime: ${descriptor.lifetime}`)
    }
  }

  /**
   * Resolve a singleton service
   * Singletons are stored at the root level
   */
  private resolveSingleton<T>(token: symbol, descriptor: ServiceDescriptor): T {
    // Check if already created
    if (this.singletonInstances.has(token)) {
      return this.singletonInstances.get(token) as T
    }

    // Create instance using root scope for singleton factory
    const rootScope = this.getRootScope()
    const instance = descriptor.factory(rootScope) as T
    this.singletonInstances.set(token, instance)

    return instance
  }

  /**
   * Resolve a scoped service
   * Scoped services are cached per scope
   */
  private resolveScoped<T>(token: symbol, descriptor: ServiceDescriptor): T {
    // Check if already created in this scope
    if (this.scopedInstances.has(token)) {
      return this.scopedInstances.get(token) as T
    }

    // Determine the appropriate scope for this service
    const targetScope = this.findScopeForService(descriptor)

    if (targetScope !== this) {
      // Resolve from the appropriate parent scope
      return targetScope.resolve<T>(token)
    }

    // Create and cache instance
    const instance = descriptor.factory(this) as T
    this.scopedInstances.set(token, instance)

    return instance
  }

  /**
   * Resolve a transient service
   * Always creates a new instance
   */
  private resolveTransient<T>(descriptor: ServiceDescriptor): T {
    return descriptor.factory(this) as T
  }

  /**
   * Find the appropriate scope for a scoped service
   */
  private findScopeForService(descriptor: ServiceDescriptor): IServiceScope {
    const minLevel = descriptor.minimumScopeLevel ?? ScopeLevel.Request
    const minPriority = SCOPE_LEVEL_PRIORITY[minLevel]
    const currentPriority = SCOPE_LEVEL_PRIORITY[this.level]

    // If current scope is at or below minimum level, use current
    if (currentPriority >= minPriority) {
      return this
    }

    // Otherwise, this scope is too high (e.g., Application for a Request-scoped service)
    throw new Error(
      `Cannot resolve ${descriptor.token.toString()} from ${this.level} scope. ` +
        `Minimum scope level is ${minLevel}.`,
    )
  }

  /**
   * Get the root scope
   */
  private getRootScope(): IServiceScope {
    let current: IServiceScope = this
    while (current.parent) {
      current = current.parent
    }
    return current
  }

  /**
   * Validate that the current scope can resolve the service
   */
  private validateScopeLevel(descriptor: ServiceDescriptor): void {
    const minLevel = descriptor.minimumScopeLevel

    if (!minLevel) {
      return
    }

    const minPriority = SCOPE_LEVEL_PRIORITY[minLevel]
    const currentPriority = SCOPE_LEVEL_PRIORITY[this.level]

    if (currentPriority < minPriority) {
      throw new Error(
        `Service ${descriptor.token.toString()} requires ${minLevel} scope or deeper, ` +
          `but current scope is ${this.level}`,
      )
    }
  }

  /**
   * Create a child scope
   */
  createChildScope(level: ScopeLevel, metadata: Partial<ScopeMetadata> = {}): IServiceScope {
    this.ensureNotDisposed()

    // Validate scope hierarchy
    const currentPriority = SCOPE_LEVEL_PRIORITY[this.level]
    const childPriority = SCOPE_LEVEL_PRIORITY[level]

    if (childPriority <= currentPriority) {
      throw new Error(
        `Cannot create ${level} scope as child of ${this.level} scope. ` +
          `Child scope must be deeper in hierarchy.`,
      )
    }

    // Inherit metadata from parent
    const childMetadata: Partial<ScopeMetadata> = {
      ...this.metadata,
      ...metadata,
      scopeId: undefined, // Will be set by constructor
    }

    const childScope = new ServiceScope(
      level,
      this.descriptors,
      this.singletonInstances,
      this,
      childMetadata,
      this.events,
    )

    this.childScopes.add(childScope)
    return childScope
  }

  /**
   * Register a scoped instance for this scope only
   */
  registerScopedInstance<T>(token: symbol, instance: T): void {
    this.ensureNotDisposed()
    this.scopedInstances.set(token, instance)
  }

  /**
   * Dispose this scope and all child scopes
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) {
      return
    }

    this.events?.onScopeDisposing?.(this)

    // Dispose child scopes first (bottom-up)
    const childScopesArray = Array.from(this.childScopes)
    for (const childScope of childScopesArray) {
      await childScope.dispose()
    }
    this.childScopes.clear()

    // Dispose scoped instances in reverse creation order
    const instances = Array.from(this.scopedInstances.entries()).reverse()

    for (const [token, instance] of instances) {
      await this.disposeInstance(token, instance)
    }
    this.scopedInstances.clear()

    // Remove from parent's child set
    if (this.parent instanceof ServiceScope) {
      this.parent.childScopes.delete(this)
    }

    this.isDisposed = true
    this.events?.onScopeDisposed?.(this)
  }

  /**
   * Dispose a single instance
   */
  private async disposeInstance(token: symbol, instance: unknown): Promise<void> {
    try {
      if (isAsyncDisposable(instance)) {
        await instance.disposeAsync()
      } else if (isDisposable(instance)) {
        await Promise.resolve(instance.dispose())
      }
    } catch (error) {
      this.events?.onDisposalError?.(
        token,
        error instanceof Error ? error : new Error(String(error)),
        this,
      )
    }
  }

  /**
   * Ensure the scope has not been disposed
   */
  private ensureNotDisposed(): void {
    if (this.isDisposed) {
      throw new Error(`Scope has been disposed: ${this.level}, ID: ${this.id}`)
    }
  }
}
