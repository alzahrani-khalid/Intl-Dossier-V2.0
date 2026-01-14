/**
 * Plugin System Context Provider
 *
 * Provides plugin registry access throughout the React application.
 * Handles plugin initialization and state management.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { pluginRegistry } from '../registry/plugin-registry'
import type { EntityPlugin, PluginRegistryEvent } from '../types/plugin.types'

// ============================================================================
// Context Types
// ============================================================================

interface PluginContextValue {
  /** Whether the registry is initialized */
  isInitialized: boolean
  /** Whether plugins are loading */
  isLoading: boolean
  /** All registered plugins */
  plugins: EntityPlugin[]
  /** All enabled plugins */
  enabledPlugins: EntityPlugin[]
  /** All registered entity types */
  entityTypes: string[]
  /** Get a plugin by ID */
  getPlugin: (pluginId: string) => EntityPlugin | undefined
  /** Get a plugin by entity type */
  getPluginByEntityType: (entityType: string) => EntityPlugin | undefined
  /** Check if entity type is registered */
  hasEntityType: (entityType: string) => boolean
  /** Register a plugin */
  registerPlugin: (plugin: EntityPlugin) => Promise<void>
  /** Unregister a plugin */
  unregisterPlugin: (pluginId: string) => Promise<void>
  /** Enable a plugin */
  enablePlugin: (pluginId: string) => Promise<void>
  /** Disable a plugin */
  disablePlugin: (pluginId: string) => Promise<void>
}

// ============================================================================
// Context
// ============================================================================

const PluginContext = createContext<PluginContextValue | null>(null)

// ============================================================================
// Provider Props
// ============================================================================

interface PluginProviderProps {
  /** Child components */
  children: ReactNode
  /** Plugins to register on mount */
  initialPlugins?: EntityPlugin[]
  /** Called when plugins are loaded */
  onPluginsLoaded?: () => void
}

// ============================================================================
// Provider Component
// ============================================================================

export function PluginProvider({
  children,
  initialPlugins = [],
  onPluginsLoaded,
}: PluginProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [plugins, setPlugins] = useState<EntityPlugin[]>([])
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [, setUpdateTrigger] = useState(0)

  // Update state from registry
  const refreshState = useCallback(() => {
    setPlugins(pluginRegistry.getAllPlugins())
    setEntityTypes(pluginRegistry.getEntityTypes())
    setUpdateTrigger((t) => t + 1)
  }, [])

  // Initialize and register plugins
  useEffect(() => {
    let mounted = true

    async function initialize() {
      try {
        // Initialize registry
        await pluginRegistry.initialize()

        // Register initial plugins
        for (const plugin of initialPlugins) {
          if (!pluginRegistry.isRegistered(plugin.manifest.id)) {
            await pluginRegistry.register(plugin)
          }
        }

        if (mounted) {
          setIsInitialized(true)
          setIsLoading(false)
          refreshState()
          onPluginsLoaded?.()
        }
      } catch (error) {
        console.error('Failed to initialize plugin system:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [initialPlugins, refreshState, onPluginsLoaded])

  // Subscribe to registry events
  useEffect(() => {
    const unsubscribe = pluginRegistry.subscribe((_event: PluginRegistryEvent) => {
      refreshState()
    })

    return unsubscribe
  }, [refreshState])

  // Enabled plugins
  const enabledPlugins = useMemo(() => {
    return pluginRegistry.getEnabledPlugins()
  }, [plugins])

  // Get plugin by ID
  const getPlugin = useCallback((pluginId: string) => {
    return pluginRegistry.getPlugin(pluginId)
  }, [])

  // Get plugin by entity type
  const getPluginByEntityType = useCallback((entityType: string) => {
    return pluginRegistry.getPluginByEntityType(entityType)
  }, [])

  // Check if entity type exists
  const hasEntityType = useCallback((entityType: string) => {
    return pluginRegistry.hasEntityType(entityType)
  }, [])

  // Register plugin
  const registerPlugin = useCallback(
    async (plugin: EntityPlugin) => {
      await pluginRegistry.register(plugin)
      refreshState()
    },
    [refreshState],
  )

  // Unregister plugin
  const unregisterPlugin = useCallback(
    async (pluginId: string) => {
      await pluginRegistry.unregister(pluginId)
      refreshState()
    },
    [refreshState],
  )

  // Enable plugin
  const enablePlugin = useCallback(
    async (pluginId: string) => {
      await pluginRegistry.enable(pluginId)
      refreshState()
    },
    [refreshState],
  )

  // Disable plugin
  const disablePlugin = useCallback(
    async (pluginId: string) => {
      await pluginRegistry.disable(pluginId)
      refreshState()
    },
    [refreshState],
  )

  // Context value
  const value: PluginContextValue = useMemo(
    () => ({
      isInitialized,
      isLoading,
      plugins,
      enabledPlugins,
      entityTypes,
      getPlugin,
      getPluginByEntityType,
      hasEntityType,
      registerPlugin,
      unregisterPlugin,
      enablePlugin,
      disablePlugin,
    }),
    [
      isInitialized,
      isLoading,
      plugins,
      enabledPlugins,
      entityTypes,
      getPlugin,
      getPluginByEntityType,
      hasEntityType,
      registerPlugin,
      unregisterPlugin,
      enablePlugin,
      disablePlugin,
    ],
  )

  return <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the plugin system context
 */
export function usePluginContext(): PluginContextValue {
  const context = useContext(PluginContext)
  if (!context) {
    throw new Error('usePluginContext must be used within a PluginProvider')
  }
  return context
}

/**
 * Hook to check if plugin system is ready
 */
export function usePluginSystemReady(): boolean {
  const context = useContext(PluginContext)
  return context?.isInitialized ?? false
}
