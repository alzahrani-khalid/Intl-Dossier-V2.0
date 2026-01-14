/**
 * Service Provider Implementation
 *
 * The main DI container that manages service registration and scope creation.
 * Supports hierarchical scopes: Application → Tenant → Request
 *
 * @module container/service-provider
 */

import {
  IServiceProvider,
  IServiceScope,
  ServiceDescriptor,
  ServiceLifetime,
  ScopeLevel,
  ScopeEvents,
  ServiceFactory,
  ScopeMetadata,
  isDisposable,
  isAsyncDisposable,
} from './interfaces'
import { ServiceScope } from './service-scope'

/**
 * ServiceProvider - The root DI container
 *
 * Features:
 * - Service registration with different lifetimes
 * - Hierarchical scope creation (Application → Tenant → Request)
 * - Singleton caching at application level
 * - Event hooks for monitoring
 * - Proper cleanup and disposal
 */
export class ServiceProvider implements IServiceProvider {
  private readonly descriptors = new Map<symbol, ServiceDescriptor>()
  private readonly singletonInstances = new Map<symbol, unknown>()
  private readonly tenantScopes = new Map<string, IServiceScope>()
  private rootScope: IServiceScope | null = null
  private readonly events?: ScopeEvents
  private isDisposed = false

  constructor(events?: ScopeEvents) {
    this.events = events
  }

  /**
   * Register a service with a descriptor
   */
  register<T>(descriptor: ServiceDescriptor<T>): this {
    this.ensureNotDisposed()

    // Validate descriptor
    if (!descriptor.token) {
      throw new Error('Service descriptor must have a token')
    }
    if (!descriptor.factory) {
      throw new Error('Service descriptor must have a factory')
    }

    this.descriptors.set(descriptor.token, descriptor as ServiceDescriptor)
    return this
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(token: symbol, factory: ServiceFactory<T>): this {
    return this.register({
      token,
      factory: factory as ServiceFactory<unknown>,
      lifetime: ServiceLifetime.Singleton,
    })
  }

  /**
   * Register a scoped service with optional minimum scope level
   */
  registerScoped<T>(
    token: symbol,
    factory: ServiceFactory<T>,
    minimumLevel: ScopeLevel = ScopeLevel.Request,
  ): this {
    return this.register({
      token,
      factory: factory as ServiceFactory<unknown>,
      lifetime: ServiceLifetime.Scoped,
      minimumScopeLevel: minimumLevel,
    })
  }

  /**
   * Register a tenant-scoped service
   */
  registerTenantScoped<T>(token: symbol, factory: ServiceFactory<T>): this {
    return this.register({
      token,
      factory: factory as ServiceFactory<unknown>,
      lifetime: ServiceLifetime.Scoped,
      minimumScopeLevel: ScopeLevel.Tenant,
    })
  }

  /**
   * Register a request-scoped service
   */
  registerRequestScoped<T>(token: symbol, factory: ServiceFactory<T>): this {
    return this.register({
      token,
      factory: factory as ServiceFactory<unknown>,
      lifetime: ServiceLifetime.Scoped,
      minimumScopeLevel: ScopeLevel.Request,
    })
  }

  /**
   * Register a transient service
   */
  registerTransient<T>(token: symbol, factory: ServiceFactory<T>): this {
    return this.register({
      token,
      factory: factory as ServiceFactory<unknown>,
      lifetime: ServiceLifetime.Transient,
    })
  }

  /**
   * Register an existing instance as singleton
   */
  registerInstance<T>(token: symbol, instance: T): this {
    this.ensureNotDisposed()

    this.descriptors.set(token, {
      token,
      factory: () => instance,
      lifetime: ServiceLifetime.Singleton,
    })

    // Pre-store the instance
    this.singletonInstances.set(token, instance)
    return this
  }

  /**
   * Get the root (application-level) scope
   */
  getRootScope(): IServiceScope {
    this.ensureNotDisposed()

    if (!this.rootScope) {
      this.rootScope = new ServiceScope(
        ScopeLevel.Application,
        this.descriptors,
        this.singletonInstances,
        null,
        { scopeId: 'root' },
        this.events,
      )
    }

    return this.rootScope
  }

  /**
   * Create a tenant-level scope
   */
  createTenantScope(tenantId: string): IServiceScope {
    this.ensureNotDisposed()

    // Check for existing tenant scope
    const existing = this.tenantScopes.get(tenantId)
    if (existing) {
      return existing
    }

    const rootScope = this.getRootScope()
    const tenantScope = rootScope.createChildScope(ScopeLevel.Tenant, {
      tenantId,
    })

    this.tenantScopes.set(tenantId, tenantScope)
    return tenantScope
  }

  /**
   * Get an existing tenant scope or undefined
   */
  getTenantScope(tenantId: string): IServiceScope | undefined {
    return this.tenantScopes.get(tenantId)
  }

  /**
   * Create a request-level scope
   */
  createRequestScope(
    parentScope: IServiceScope,
    requestId: string,
    userId?: string,
  ): IServiceScope {
    this.ensureNotDisposed()

    // Validate parent scope level
    if (parentScope.level !== ScopeLevel.Application && parentScope.level !== ScopeLevel.Tenant) {
      throw new Error(
        `Request scope must have Application or Tenant scope as parent, got ${parentScope.level}`,
      )
    }

    return parentScope.createChildScope(ScopeLevel.Request, {
      requestId,
      userId,
    })
  }

  /**
   * Dispose a tenant scope
   */
  async disposeTenantScope(tenantId: string): Promise<void> {
    const scope = this.tenantScopes.get(tenantId)
    if (scope) {
      await scope.dispose()
      this.tenantScopes.delete(tenantId)
    }
  }

  /**
   * Check if a service is registered
   */
  has(token: symbol): boolean {
    return this.descriptors.has(token)
  }

  /**
   * Get all registered tokens
   */
  getRegisteredTokens(): symbol[] {
    return Array.from(this.descriptors.keys())
  }

  /**
   * Get the descriptor for a token
   */
  getDescriptor(token: symbol): ServiceDescriptor | undefined {
    return this.descriptors.get(token)
  }

  /**
   * Dispose the entire container
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) {
      return
    }

    // Dispose all tenant scopes
    const tenantScopesArray = Array.from(this.tenantScopes.values())
    for (const scope of tenantScopesArray) {
      await scope.dispose()
    }
    this.tenantScopes.clear()

    // Dispose root scope
    if (this.rootScope) {
      await this.rootScope.dispose()
      this.rootScope = null
    }

    // Dispose singletons in reverse order
    const instances = Array.from(this.singletonInstances.entries()).reverse()
    for (const [token, instance] of instances) {
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
          this.getRootScope(),
        )
      }
    }
    this.singletonInstances.clear()

    this.isDisposed = true
  }

  /**
   * Ensure the container has not been disposed
   */
  private ensureNotDisposed(): void {
    if (this.isDisposed) {
      throw new Error('ServiceProvider has been disposed')
    }
  }
}

/**
 * Global service provider instance
 */
let globalProvider: ServiceProvider | null = null

/**
 * Get the global service provider
 */
export function getServiceProvider(): ServiceProvider {
  if (!globalProvider) {
    throw new Error('ServiceProvider not initialized. Call initializeServiceProvider() first.')
  }
  return globalProvider
}

/**
 * Initialize the global service provider
 */
export function initializeServiceProvider(events?: ScopeEvents): ServiceProvider {
  if (globalProvider) {
    throw new Error('ServiceProvider already initialized')
  }
  globalProvider = new ServiceProvider(events)
  return globalProvider
}

/**
 * Reset the global service provider (for testing)
 */
export async function resetServiceProvider(): Promise<void> {
  if (globalProvider) {
    await globalProvider.dispose()
    globalProvider = null
  }
}
