/**
 * Modular Monolith - Module Registry
 *
 * Central registry for all modules in the system.
 * Manages module lifecycle, dependency resolution, and access.
 *
 * @module core/registry
 */

import type { ModuleId, ModuleStatus } from './types'
import type { IModule, ModuleHealthStatus } from './contracts'
import { getEventBus, createModuleEvent } from './event-bus'

// ============================================================================
// Module Registry
// ============================================================================

type ModuleEntry = {
  module: IModule
  status: ModuleStatus
  initializedAt?: string
}

/**
 * Module Registry
 * Manages registration, lifecycle, and access to all modules
 */
class ModuleRegistry {
  private modules: Map<ModuleId, ModuleEntry> = new Map()
  private initializationOrder: ModuleId[] = []

  /**
   * Register a module with the registry
   */
  register(module: IModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module ${module.id} is already registered`)
    }

    this.modules.set(module.id, {
      module,
      status: 'stopped',
    })
  }

  /**
   * Initialize all registered modules in dependency order
   */
  async initializeAll(): Promise<void> {
    const sorted = this.topologicalSort()
    this.initializationOrder = sorted

    const eventBus = getEventBus()

    for (const moduleId of sorted) {
      const entry = this.modules.get(moduleId)
      if (!entry) continue

      try {
        entry.status = 'initializing'

        // Check dependencies are ready
        for (const depId of entry.module.dependencies) {
          const depEntry = this.modules.get(depId)
          if (!depEntry || depEntry.status !== 'ready') {
            throw new Error(`Dependency ${depId} is not ready for module ${moduleId}`)
          }
        }

        await entry.module.initialize()
        entry.status = 'ready'
        entry.initializedAt = new Date().toISOString()

        // Publish initialization event
        await eventBus.publish(
          createModuleEvent('module.initialized', moduleId, {
            moduleId,
            version: entry.module.version,
          }),
        )
      } catch (error) {
        entry.status = 'degraded'
        console.error(`Failed to initialize module ${moduleId}:`, error)

        await eventBus.publish(
          createModuleEvent('module.initialization.failed', moduleId, {
            moduleId,
            error: error instanceof Error ? error.message : String(error),
          }),
        )

        throw error
      }
    }
  }

  /**
   * Stop all modules in reverse initialization order
   */
  async stopAll(): Promise<void> {
    const eventBus = getEventBus()
    const reversed = [...this.initializationOrder].reverse()

    for (const moduleId of reversed) {
      const entry = this.modules.get(moduleId)
      if (!entry || entry.status === 'stopped') continue

      try {
        await entry.module.stop()
        entry.status = 'stopped'

        await eventBus.publish(createModuleEvent('module.stopped', moduleId, { moduleId }))
      } catch (error) {
        console.error(`Error stopping module ${moduleId}:`, error)
      }
    }
  }

  /**
   * Get a module by ID
   */
  get<T extends IModule>(moduleId: ModuleId): T {
    const entry = this.modules.get(moduleId)
    if (!entry) {
      throw new Error(`Module ${moduleId} is not registered`)
    }
    if (entry.status !== 'ready') {
      throw new Error(`Module ${moduleId} is not ready (status: ${entry.status})`)
    }
    return entry.module as T
  }

  /**
   * Check if a module is registered
   */
  has(moduleId: ModuleId): boolean {
    return this.modules.has(moduleId)
  }

  /**
   * Get module status
   */
  getStatus(moduleId: ModuleId): ModuleStatus | null {
    const entry = this.modules.get(moduleId)
    return entry?.status ?? null
  }

  /**
   * Get all module statuses
   */
  getAllStatuses(): Map<ModuleId, ModuleStatus> {
    const statuses = new Map<ModuleId, ModuleStatus>()
    for (const [id, entry] of this.modules) {
      statuses.set(id, entry.status)
    }
    return statuses
  }

  /**
   * Get health status for all modules
   */
  async getHealthStatus(): Promise<ModuleHealthStatus[]> {
    const results: ModuleHealthStatus[] = []

    for (const entry of this.modules.values()) {
      if (entry.status === 'ready') {
        try {
          const health = await entry.module.healthCheck()
          results.push(health)
        } catch (error) {
          results.push({
            status: 'unhealthy',
            module: entry.module.id,
            timestamp: new Date().toISOString(),
            details: {
              error: error instanceof Error ? error.message : String(error),
            },
          })
        }
      } else {
        results.push({
          status: entry.status === 'degraded' ? 'degraded' : 'unhealthy',
          module: entry.module.id,
          timestamp: new Date().toISOString(),
          details: { reason: `Module status is ${entry.status}` },
        })
      }
    }

    return results
  }

  /**
   * Get registered module IDs
   */
  getRegisteredModules(): ModuleId[] {
    return Array.from(this.modules.keys())
  }

  /**
   * Topological sort of modules based on dependencies
   */
  private topologicalSort(): ModuleId[] {
    const sorted: ModuleId[] = []
    const visited = new Set<ModuleId>()
    const visiting = new Set<ModuleId>()

    const visit = (moduleId: ModuleId) => {
      if (visited.has(moduleId)) return
      if (visiting.has(moduleId)) {
        throw new Error(`Circular dependency detected involving module ${moduleId}`)
      }

      visiting.add(moduleId)

      const entry = this.modules.get(moduleId)
      if (entry) {
        for (const depId of entry.module.dependencies) {
          if (!this.modules.has(depId)) {
            throw new Error(`Module ${moduleId} depends on unregistered module ${depId}`)
          }
          visit(depId)
        }
      }

      visiting.delete(moduleId)
      visited.add(moduleId)
      sorted.push(moduleId)
    }

    for (const moduleId of this.modules.keys()) {
      visit(moduleId)
    }

    return sorted
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let registryInstance: ModuleRegistry | null = null

/**
 * Get the global module registry instance
 */
export function getModuleRegistry(): ModuleRegistry {
  if (!registryInstance) {
    registryInstance = new ModuleRegistry()
  }
  return registryInstance
}

/**
 * Reset the registry (for testing)
 */
export function resetModuleRegistry(): void {
  registryInstance = null
}

// ============================================================================
// Module Access Helper
// ============================================================================

/**
 * Get a module from the registry by ID
 * Convenience function for common access pattern
 */
export function getModule<T extends IModule>(moduleId: ModuleId): T {
  return getModuleRegistry().get<T>(moduleId)
}

// ============================================================================
// Module Registration Decorator (Future Use)
// ============================================================================

/**
 * Decorator for auto-registering modules (for future use with decorators)
 */
export function ModuleRegistration() {
  return function <T extends { new (...args: unknown[]): IModule }>(constructor: T) {
    // Future: Auto-register when decorators are enabled
    return constructor
  }
}

// ============================================================================
// React Integration
// ============================================================================

/**
 * Hook to access a module from React components
 */
export function useModule<T extends IModule>(moduleId: ModuleId): T {
  return getModuleRegistry().get<T>(moduleId)
}

/**
 * Hook to get all module statuses
 */
export function useModuleStatuses(): Map<ModuleId, ModuleStatus> {
  return getModuleRegistry().getAllStatuses()
}
