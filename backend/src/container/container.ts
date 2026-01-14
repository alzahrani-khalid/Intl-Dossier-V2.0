/**
 * Dependency Injection Container
 *
 * A lightweight DI container that manages the creation and lifecycle
 * of dependencies. This enables clean separation of concerns and
 * easy testing through dependency injection.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Redis } from 'ioredis'

import { TYPES } from './types'

// Port interfaces
import { ITaskRepository } from '../core/ports/repositories'
import { ICachePort, ILoggerPort, ILoggerFactory } from '../core/ports/infrastructure'

// Adapter implementations
import { SupabaseTaskRepository } from '../adapters/repositories/supabase'
import { RedisCacheAdapter } from '../adapters/infrastructure/cache'
import { WinstonLoggerFactory } from '../adapters/infrastructure/logging'

/**
 * Service factory type - creates a service instance
 */
type ServiceFactory<T> = () => T

/**
 * Service definition with optional singleton flag
 */
interface ServiceDefinition<T> {
  factory: ServiceFactory<T>
  singleton: boolean
  instance?: T
}

/**
 * Dependency Injection Container
 *
 * Manages service registration and resolution. Supports both
 * singleton and transient service lifetimes.
 */
export class Container {
  private services = new Map<symbol, ServiceDefinition<unknown>>()

  /**
   * Register a service with the container
   */
  register<T>(token: symbol, factory: ServiceFactory<T>, singleton = true): this {
    this.services.set(token, {
      factory,
      singleton,
    })
    return this
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(token: symbol, factory: ServiceFactory<T>): this {
    return this.register(token, factory, true)
  }

  /**
   * Register a transient service (new instance per resolution)
   */
  registerTransient<T>(token: symbol, factory: ServiceFactory<T>): this {
    return this.register(token, factory, false)
  }

  /**
   * Register an existing instance
   */
  registerInstance<T>(token: symbol, instance: T): this {
    this.services.set(token, {
      factory: () => instance,
      singleton: true,
      instance,
    })
    return this
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: symbol): T {
    const definition = this.services.get(token)

    if (!definition) {
      throw new Error(`Service not registered: ${token.toString()}`)
    }

    // Return singleton instance if available
    if (definition.singleton && definition.instance !== undefined) {
      return definition.instance as T
    }

    // Create new instance
    const instance = definition.factory() as T

    // Store singleton instance
    if (definition.singleton) {
      definition.instance = instance
    }

    return instance
  }

  /**
   * Check if a service is registered
   */
  has(token: symbol): boolean {
    return this.services.has(token)
  }

  /**
   * Remove a service registration
   */
  unregister(token: symbol): boolean {
    return this.services.delete(token)
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear()
  }

  /**
   * Get all registered tokens
   */
  getRegisteredTokens(): symbol[] {
    return Array.from(this.services.keys())
  }
}

/**
 * Configure the container with all dependencies
 */
export function configureContainer(config: {
  supabaseAdmin: SupabaseClient
  supabaseAnon: SupabaseClient
  redis: Redis
}): Container {
  const container = new Container()

  // Register infrastructure

  // Logger factory
  container.registerSingleton<ILoggerFactory>(TYPES.LoggerFactory, () => new WinstonLoggerFactory())

  // Root logger
  container.registerSingleton<ILoggerPort>(TYPES.Logger, () =>
    container.resolve<ILoggerFactory>(TYPES.LoggerFactory).getRoot(),
  )

  // Cache
  container.registerSingleton<ICachePort>(TYPES.Cache, () => new RedisCacheAdapter(config.redis))

  // Register raw clients as instances
  container.registerInstance(TYPES.SupabaseAdminClient, config.supabaseAdmin)
  container.registerInstance(TYPES.SupabaseClient, config.supabaseAnon)
  container.registerInstance(TYPES.RedisClient, config.redis)

  // Register repositories

  // Task repository
  container.registerSingleton<ITaskRepository>(TYPES.TaskRepository, () => {
    const logger = container.resolve<ILoggerFactory>(TYPES.LoggerFactory).create('TaskRepository')
    return new SupabaseTaskRepository(config.supabaseAdmin, logger)
  })

  return container
}

/**
 * Global container instance
 */
let globalContainer: Container | null = null

/**
 * Get or create the global container instance
 */
export function getContainer(): Container {
  if (!globalContainer) {
    throw new Error('Container not initialized. Call initializeContainer() first.')
  }
  return globalContainer
}

/**
 * Initialize the global container
 */
export function initializeContainer(config: {
  supabaseAdmin: SupabaseClient
  supabaseAnon: SupabaseClient
  redis: Redis
}): Container {
  globalContainer = configureContainer(config)
  return globalContainer
}

/**
 * Reset the global container (useful for testing)
 */
export function resetContainer(): void {
  globalContainer = null
}
