/**
 * Container Configuration
 *
 * Configures the DI container with all services, repositories, and infrastructure.
 * Demonstrates proper use of lifetime scopes.
 *
 * @module container/configure
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Redis } from 'ioredis'

import {
  ServiceProvider,
  initializeServiceProvider,
  ScopeLevel,
  IServiceScope,
  ScopeEvents,
  IDisposable,
} from './index'
import { TYPES } from './types'

// Port interfaces
import { ITaskRepository } from '../core/ports/repositories'
import { ICachePort, ILoggerPort, ILoggerFactory } from '../core/ports/infrastructure'

// Adapter implementations
import { SupabaseTaskRepository } from '../adapters/repositories/supabase'
import { RedisCacheAdapter } from '../adapters/infrastructure/cache'
import { WinstonLoggerFactory } from '../adapters/infrastructure/logging'

/**
 * Configuration options for the container
 */
export interface ContainerConfig {
  /** Supabase admin client (service role) */
  supabaseAdmin: SupabaseClient
  /** Supabase anon client (user role) */
  supabaseAnon: SupabaseClient
  /** Redis client */
  redis: Redis
  /** Enable debug logging */
  debug?: boolean
  /** Custom scope events */
  events?: ScopeEvents
}

/**
 * Request context - stores per-request information
 */
export interface RequestContext {
  requestId: string
  userId?: string
  tenantId?: string
  startTime: number
  metadata: Record<string, unknown>
}

/**
 * Request context implementation with disposal
 */
export class RequestContextImpl implements RequestContext, IDisposable {
  requestId: string
  userId?: string
  tenantId?: string
  startTime: number
  metadata: Record<string, unknown> = {}

  constructor(scope: IServiceScope) {
    this.requestId = scope.metadata.requestId ?? 'unknown'
    this.userId = scope.metadata.userId as string | undefined
    this.tenantId = scope.metadata.tenantId as string | undefined
    this.startTime = Date.now()
  }

  dispose(): void {
    // Log request duration on disposal
    const duration = Date.now() - this.startTime
    console.log(`[Request ${this.requestId}] Completed in ${duration}ms`)
  }
}

/**
 * Request logger - scoped logger for requests
 */
export class RequestLogger implements IDisposable {
  private readonly logger: ILoggerPort
  private readonly requestId: string

  constructor(loggerFactory: ILoggerFactory, requestId: string, _tenantId?: string) {
    this.requestId = requestId
    this.logger = loggerFactory.create(`Request:${requestId.slice(0, 8)}`)
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, { ...meta, requestId: this.requestId })
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, { ...meta, requestId: this.requestId })
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(message, { ...meta, error, requestId: this.requestId })
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, { ...meta, requestId: this.requestId })
  }

  dispose(): void {
    // Cleanup if needed
  }
}

/**
 * Tenant cache wrapper - provides tenant-isolated caching
 */
export class TenantCache implements IDisposable {
  private readonly cache: ICachePort
  private readonly tenantId: string
  private readonly prefix: string

  constructor(cache: ICachePort, tenantId: string) {
    this.cache = cache
    this.tenantId = tenantId
    this.prefix = `tenant:${tenantId}:`
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(this.prefix + key)
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.cache.set(this.prefix + key, value, ttlSeconds ? { ttl: ttlSeconds } : undefined)
  }

  async del(key: string): Promise<void> {
    await this.cache.del(this.prefix + key)
  }

  async invalidateAll(): Promise<void> {
    await this.cache.delPattern(`${this.prefix}*`)
  }

  dispose(): void {
    // Optionally clear tenant-specific cache on scope disposal
    // this.invalidateAll(); // Uncomment if needed
  }
}

/**
 * Configure the service provider with all dependencies
 */
export function configureServiceProvider(config: ContainerConfig): ServiceProvider {
  const { supabaseAdmin, supabaseAnon, redis, debug, events } = config

  // Create scope events with debug logging
  const scopeEvents: ScopeEvents = {
    onScopeCreated: (scope) => {
      if (debug) {
        console.log(`[DI] Scope created: ${scope.level} (${scope.id})`)
      }
      events?.onScopeCreated?.(scope)
    },
    onScopeDisposing: (scope) => {
      if (debug) {
        console.log(`[DI] Scope disposing: ${scope.level} (${scope.id})`)
      }
      events?.onScopeDisposing?.(scope)
    },
    onScopeDisposed: (scope) => {
      if (debug) {
        console.log(`[DI] Scope disposed: ${scope.level} (${scope.id})`)
      }
      events?.onScopeDisposed?.(scope)
    },
    onServiceResolved: (token, scope) => {
      if (debug) {
        console.log(`[DI] Resolved: ${token.toString()} from ${scope.level} scope`)
      }
      events?.onServiceResolved?.(token, scope)
    },
    onDisposalError: (token, error, scope) => {
      console.error(`[DI] Disposal error for ${token.toString()} in ${scope.level}:`, error)
      events?.onDisposalError?.(token, error, scope)
    },
  }

  const provider = initializeServiceProvider(scopeEvents)

  // ============================================
  // SINGLETON SERVICES (Application Lifetime)
  // ============================================

  // Logger factory - creates loggers for services
  provider.registerSingleton<ILoggerFactory>(TYPES.LoggerFactory, () => new WinstonLoggerFactory())

  // Root logger
  provider.registerSingleton<ILoggerPort>(TYPES.Logger, (scope) => {
    const factory = scope.resolve<ILoggerFactory>(TYPES.LoggerFactory)
    return factory.getRoot()
  })

  // Cache (Redis adapter)
  provider.registerSingleton<ICachePort>(TYPES.Cache, () => new RedisCacheAdapter(redis))

  // Raw clients as instances
  provider.registerInstance(TYPES.SupabaseAdminClient, supabaseAdmin)
  provider.registerInstance(TYPES.SupabaseClient, supabaseAnon)
  provider.registerInstance(TYPES.RedisClient, redis)

  // Task repository (singleton - uses admin client)
  provider.registerSingleton<ITaskRepository>(TYPES.TaskRepository, (scope) => {
    const factory = scope.resolve<ILoggerFactory>(TYPES.LoggerFactory)
    const logger = factory.create('TaskRepository')
    return new SupabaseTaskRepository(supabaseAdmin, logger)
  })

  // ============================================
  // TENANT-SCOPED SERVICES
  // ============================================

  // Tenant-specific cache wrapper
  provider.registerScoped<TenantCache>(
    TYPES.TenantCache,
    (scope) => {
      const cache = scope.resolve<ICachePort>(TYPES.Cache)
      const tenantId = scope.metadata.tenantId as string
      if (!tenantId) {
        throw new Error('TenantCache requires tenantId in scope metadata')
      }
      return new TenantCache(cache, tenantId)
    },
    ScopeLevel.Tenant,
  )

  // ============================================
  // REQUEST-SCOPED SERVICES
  // ============================================

  // Request context
  provider.registerScoped<RequestContext>(
    TYPES.RequestContext,
    (scope) => new RequestContextImpl(scope),
    ScopeLevel.Request,
  )

  // Request-scoped logger
  provider.registerScoped<RequestLogger>(
    TYPES.RequestLogger,
    (scope) => {
      const factory = scope.resolve<ILoggerFactory>(TYPES.LoggerFactory)
      const requestId = scope.metadata.requestId as string
      const tenantId = scope.metadata.tenantId as string | undefined
      return new RequestLogger(factory, requestId, tenantId)
    },
    ScopeLevel.Request,
  )

  return provider
}

/**
 * Quick setup helper - initializes the container with default configuration
 */
export function setupContainer(config: ContainerConfig): {
  provider: ServiceProvider
  rootScope: IServiceScope
} {
  const provider = configureServiceProvider(config)
  const rootScope = provider.getRootScope()
  return { provider, rootScope }
}
