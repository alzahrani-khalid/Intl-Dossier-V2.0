/**
 * Modular Monolith - Main Entry Point
 *
 * This file exports all modules and provides initialization utilities.
 * Import from here to access the module system.
 *
 * @example
 * import { initializeModules, getModule } from '@/modules'
 *
 * // Initialize all modules at app startup
 * await initializeModules()
 *
 * // Access a module
 * const documentsModule = getModule<IDocumentModule>('documents')
 */

// ============================================================================
// Core Exports
// ============================================================================

export * from './core'

// ============================================================================
// Module Exports
// ============================================================================

export { documentModule } from './documents'
export { relationshipModule } from './relationships'
export { aiModule } from './ai'

// ============================================================================
// Module Types Re-exports
// ============================================================================

export type { IDocumentModule, IRelationshipModule, IAIModule } from './core/contracts'

// ============================================================================
// Initialization
// ============================================================================

import { getModuleRegistry, getEventBus } from './core'
import { documentModule } from './documents'
import { relationshipModule } from './relationships'
import { aiModule } from './ai'

/**
 * Initialize all modules
 * Call this at application startup
 */
export async function initializeModules(): Promise<void> {
  const registry = getModuleRegistry()

  // Register all modules
  registry.register(documentModule)
  registry.register(relationshipModule)
  registry.register(aiModule)

  // Initialize in dependency order
  await registry.initializeAll()

  console.log('✅ All modules initialized successfully')
}

/**
 * Stop all modules
 * Call this at application shutdown
 */
export async function stopModules(): Promise<void> {
  const registry = getModuleRegistry()
  await registry.stopAll()

  console.log('✅ All modules stopped')
}

/**
 * Get the health status of all modules
 */
export async function getModulesHealth() {
  const registry = getModuleRegistry()
  return registry.getHealthStatus()
}

/**
 * Enable development mode with event logging
 */
export function enableDevMode() {
  const eventBus = getEventBus()
  return eventBus.subscribeAll((event) => {
    console.group(`📨 [${event.source}] ${event.type}`)
    console.log('Event ID:', event.id)
    console.log('Timestamp:', event.timestamp)
    console.log('Payload:', event.payload)
    if (event.correlationId) {
      console.log('Correlation ID:', event.correlationId)
    }
    console.groupEnd()
  })
}

// ============================================================================
// React Integration
// ============================================================================

import { useEffect, useState } from 'react'
import type { ModuleHealthStatus } from './core/contracts'

/**
 * Hook to initialize modules in a React app
 */
export function useModuleInitialization() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        await initializeModules()
        if (mounted) {
          setIsInitialized(true)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize modules'))
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  return { isInitialized, error }
}

/**
 * Hook to get module health status
 */
export function useModuleHealth() {
  const [health, setHealth] = useState<ModuleHealthStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await getModulesHealth()
        setHealth(status)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  return { health, loading }
}
