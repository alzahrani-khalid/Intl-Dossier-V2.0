/**
 * Plugin Registry - Core Registration System
 *
 * Manages plugin registration, lifecycle, and lookup.
 * Provides a centralized registry for all entity plugins.
 */

import type {
  EntityPlugin,
  RegisteredPlugin,
  PluginRegistryState,
  PluginRegistryEvent,
  PluginEventListener,
} from '../types/plugin.types'

// ============================================================================
// Registry Implementation
// ============================================================================

class PluginRegistry {
  private state: PluginRegistryState = {
    plugins: new Map(),
    entityTypeMap: new Map(),
    initialized: false,
  }

  private listeners: Set<PluginEventListener> = new Set()
  private loadOrder = 0

  // ==========================================================================
  // Registration Methods
  // ==========================================================================

  /**
   * Register a new entity plugin
   */
  async register<T>(plugin: EntityPlugin<T>): Promise<void> {
    const { id, entityType } = plugin.manifest

    // Check for duplicate registration
    if (this.state.plugins.has(id)) {
      console.warn(`Plugin "${id}" is already registered. Skipping.`)
      return
    }

    // Check for entity type conflict
    const existingPluginId = this.state.entityTypeMap.get(entityType)
    if (existingPluginId) {
      throw new Error(
        `Entity type "${entityType}" is already registered by plugin "${existingPluginId}"`,
      )
    }

    // Check dependencies
    if (plugin.manifest.dependencies) {
      for (const depId of plugin.manifest.dependencies) {
        if (!this.state.plugins.has(depId)) {
          throw new Error(`Plugin "${id}" depends on "${depId}" which is not registered`)
        }
      }
    }

    // Create registered plugin entry
    const registeredPlugin: RegisteredPlugin<T> = {
      plugin: plugin as EntityPlugin<T>,
      enabled: true,
      registeredAt: new Date().toISOString(),
      loadOrder: this.loadOrder++,
    }

    // Register plugin
    this.state.plugins.set(id, registeredPlugin as RegisteredPlugin)
    this.state.entityTypeMap.set(entityType, id)

    // Call lifecycle hook
    if (plugin.lifecycle?.onRegister) {
      await plugin.lifecycle.onRegister()
    }

    // Emit event
    this.emit({ type: 'PLUGIN_REGISTERED', pluginId: id })

    console.info(`Plugin "${id}" registered successfully for entity type "${entityType}"`)
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const registeredPlugin = this.state.plugins.get(pluginId)
    if (!registeredPlugin) {
      console.warn(`Plugin "${pluginId}" is not registered`)
      return
    }

    // Check if other plugins depend on this one
    for (const [id, rp] of this.state.plugins) {
      if (rp.plugin.manifest.dependencies?.includes(pluginId)) {
        throw new Error(`Cannot unregister "${pluginId}": plugin "${id}" depends on it`)
      }
    }

    const { entityType } = registeredPlugin.plugin.manifest

    // Call lifecycle hook
    if (registeredPlugin.plugin.lifecycle?.onUnregister) {
      await registeredPlugin.plugin.lifecycle.onUnregister()
    }

    // Remove from registry
    this.state.plugins.delete(pluginId)
    this.state.entityTypeMap.delete(entityType)

    // Emit event
    this.emit({ type: 'PLUGIN_UNREGISTERED', pluginId })

    console.info(`Plugin "${pluginId}" unregistered`)
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<void> {
    const registeredPlugin = this.state.plugins.get(pluginId)
    if (!registeredPlugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`)
    }

    if (registeredPlugin.enabled) {
      return
    }

    // Check dependencies are enabled
    const dependencies = registeredPlugin.plugin.manifest.dependencies || []
    for (const depId of dependencies) {
      const dep = this.state.plugins.get(depId)
      if (!dep?.enabled) {
        throw new Error(`Cannot enable "${pluginId}": dependency "${depId}" is not enabled`)
      }
    }

    registeredPlugin.enabled = true

    // Call lifecycle hook
    if (registeredPlugin.plugin.lifecycle?.onEnable) {
      await registeredPlugin.plugin.lifecycle.onEnable()
    }

    // Emit event
    this.emit({ type: 'PLUGIN_ENABLED', pluginId })
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<void> {
    const registeredPlugin = this.state.plugins.get(pluginId)
    if (!registeredPlugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`)
    }

    if (!registeredPlugin.enabled) {
      return
    }

    // Check if enabled plugins depend on this one
    for (const [id, rp] of this.state.plugins) {
      if (rp.enabled && rp.plugin.manifest.dependencies?.includes(pluginId)) {
        throw new Error(`Cannot disable "${pluginId}": enabled plugin "${id}" depends on it`)
      }
    }

    registeredPlugin.enabled = false

    // Call lifecycle hook
    if (registeredPlugin.plugin.lifecycle?.onDisable) {
      await registeredPlugin.plugin.lifecycle.onDisable()
    }

    // Emit event
    this.emit({ type: 'PLUGIN_DISABLED', pluginId })
  }

  // ==========================================================================
  // Lookup Methods
  // ==========================================================================

  /**
   * Get a plugin by ID
   */
  getPlugin<T = Record<string, unknown>>(pluginId: string): EntityPlugin<T> | undefined {
    const registered = this.state.plugins.get(pluginId)
    return registered?.plugin as EntityPlugin<T> | undefined
  }

  /**
   * Get a plugin by entity type
   */
  getPluginByEntityType<T = Record<string, unknown>>(
    entityType: string,
  ): EntityPlugin<T> | undefined {
    const pluginId = this.state.entityTypeMap.get(entityType)
    if (!pluginId) return undefined
    return this.getPlugin<T>(pluginId)
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): EntityPlugin[] {
    return Array.from(this.state.plugins.values())
      .sort((a, b) => a.loadOrder - b.loadOrder)
      .map((rp) => rp.plugin)
  }

  /**
   * Get all enabled plugins
   */
  getEnabledPlugins(): EntityPlugin[] {
    return Array.from(this.state.plugins.values())
      .filter((rp) => rp.enabled)
      .sort((a, b) => a.loadOrder - b.loadOrder)
      .map((rp) => rp.plugin)
  }

  /**
   * Get all registered entity types
   */
  getEntityTypes(): string[] {
    return Array.from(this.state.entityTypeMap.keys())
  }

  /**
   * Check if a plugin is registered
   */
  isRegistered(pluginId: string): boolean {
    return this.state.plugins.has(pluginId)
  }

  /**
   * Check if a plugin is enabled
   */
  isEnabled(pluginId: string): boolean {
    return this.state.plugins.get(pluginId)?.enabled ?? false
  }

  /**
   * Check if an entity type is registered
   */
  hasEntityType(entityType: string): boolean {
    return this.state.entityTypeMap.has(entityType)
  }

  // ==========================================================================
  // Event System
  // ==========================================================================

  /**
   * Subscribe to registry events
   */
  subscribe(listener: PluginEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: PluginRegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Plugin event listener error:', error)
      }
    }
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the registry
   */
  async initialize(): Promise<void> {
    if (this.state.initialized) {
      return
    }

    this.state.initialized = true
    this.emit({ type: 'REGISTRY_INITIALIZED' })
    console.info('Plugin registry initialized')
  }

  /**
   * Check if registry is initialized
   */
  isInitialized(): boolean {
    return this.state.initialized
  }

  /**
   * Get registry state (for debugging)
   */
  getState(): Readonly<PluginRegistryState> {
    return this.state
  }

  /**
   * Clear all plugins (for testing)
   */
  async clear(): Promise<void> {
    const pluginIds = Array.from(this.state.plugins.keys())

    // Unregister in reverse order to handle dependencies
    for (const id of pluginIds.reverse()) {
      await this.unregister(id)
    }

    this.state.initialized = false
    this.loadOrder = 0
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Global plugin registry instance
 */
export const pluginRegistry = new PluginRegistry()

/**
 * Type export for registry
 */
export type { PluginRegistry }
