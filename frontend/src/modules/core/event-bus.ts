/**
 * Modular Monolith - Event Bus
 *
 * Implementation of the inter-module event bus.
 * All modules communicate through this event bus for loose coupling.
 *
 * @module core/event-bus
 */

import type { ModuleId, ModuleEvent, ModuleEventHandler, ModuleEventSubscription } from './types'
import type { IModuleEventBus } from './contracts'
import { generateCorrelationId } from './types'

// ============================================================================
// Event Bus Implementation
// ============================================================================

type Subscription = {
  id: string
  handler: ModuleEventHandler
  filter?: {
    eventType?: string
    moduleId?: ModuleId
  }
}

/**
 * In-memory event bus implementation
 * Suitable for modular monolith architecture
 */
class ModuleEventBus implements IModuleEventBus {
  private subscriptions: Map<string, Subscription> = new Map()
  private eventHistory: ModuleEvent[] = []
  private maxHistorySize = 1000

  /**
   * Publish an event to the bus
   */
  async publish<TPayload>(event: ModuleEvent<TPayload>): Promise<void> {
    // Add to history
    this.addToHistory(event)

    // Notify all matching subscribers
    const promises: Promise<void>[] = []

    for (const subscription of this.subscriptions.values()) {
      if (this.matchesFilter(event, subscription.filter)) {
        const result = subscription.handler(event)
        if (result instanceof Promise) {
          promises.push(result)
        }
      }
    }

    // Wait for all handlers to complete
    await Promise.all(promises)
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<TPayload>(
    eventType: string,
    handler: ModuleEventHandler<TPayload>,
  ): ModuleEventSubscription {
    const id = this.generateSubscriptionId()
    this.subscriptions.set(id, {
      id,
      handler: handler as ModuleEventHandler,
      filter: { eventType },
    })

    return {
      unsubscribe: () => this.subscriptions.delete(id),
    }
  }

  /**
   * Subscribe to all events from a specific module
   */
  subscribeToModule(moduleId: ModuleId, handler: ModuleEventHandler): ModuleEventSubscription {
    const id = this.generateSubscriptionId()
    this.subscriptions.set(id, {
      id,
      handler,
      filter: { moduleId },
    })

    return {
      unsubscribe: () => this.subscriptions.delete(id),
    }
  }

  /**
   * Subscribe to all events (for logging/debugging)
   */
  subscribeAll(handler: ModuleEventHandler): ModuleEventSubscription {
    const id = this.generateSubscriptionId()
    this.subscriptions.set(id, {
      id,
      handler,
    })

    return {
      unsubscribe: () => this.subscriptions.delete(id),
    }
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(count: number = 100): ModuleEvent[] {
    return this.eventHistory.slice(-count)
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string, count: number = 100): ModuleEvent[] {
    return this.eventHistory.filter((e) => e.type === eventType).slice(-count)
  }

  /**
   * Get events from a module
   */
  getEventsByModule(moduleId: ModuleId, count: number = 100): ModuleEvent[] {
    return this.eventHistory.filter((e) => e.source === moduleId).slice(-count)
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size
  }

  private matchesFilter(event: ModuleEvent, filter?: Subscription['filter']): boolean {
    if (!filter) return true

    if (filter.eventType && event.type !== filter.eventType) {
      return false
    }

    if (filter.moduleId && event.source !== filter.moduleId) {
      return false
    }

    return true
  }

  private addToHistory(event: ModuleEvent): void {
    this.eventHistory.push(event)
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize / 2)
    }
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

// ============================================================================
// Event Factory
// ============================================================================

/**
 * Create a module event
 */
export function createModuleEvent<TPayload>(
  type: string,
  source: ModuleId,
  payload: TPayload,
  correlationId?: string,
): ModuleEvent<TPayload> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    source,
    timestamp: new Date().toISOString(),
    payload,
    correlationId: correlationId ?? generateCorrelationId(),
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let eventBusInstance: ModuleEventBus | null = null

/**
 * Get the global event bus instance
 */
export function getEventBus(): IModuleEventBus & {
  getRecentEvents: (count?: number) => ModuleEvent[]
  getEventsByType: (eventType: string, count?: number) => ModuleEvent[]
  getEventsByModule: (moduleId: ModuleId, count?: number) => ModuleEvent[]
  clearHistory: () => void
  getSubscriptionCount: () => number
} {
  if (!eventBusInstance) {
    eventBusInstance = new ModuleEventBus()
  }
  return eventBusInstance
}

/**
 * Reset the event bus (for testing)
 */
export function resetEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.clearHistory()
  }
  eventBusInstance = null
}

// ============================================================================
// Event Bus Hooks
// ============================================================================

/**
 * Hook to publish events from React components
 */
export function useEventBus() {
  const eventBus = getEventBus()

  return {
    publish: eventBus.publish.bind(eventBus),
    subscribe: eventBus.subscribe.bind(eventBus),
    subscribeToModule: eventBus.subscribeToModule.bind(eventBus),
    subscribeAll: eventBus.subscribeAll.bind(eventBus),
  }
}

// ============================================================================
// Logging Middleware
// ============================================================================

/**
 * Enable event logging to console (for development)
 */
export function enableEventLogging(): ModuleEventSubscription {
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
