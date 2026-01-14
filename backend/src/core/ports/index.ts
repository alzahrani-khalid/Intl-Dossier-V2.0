/**
 * Ports Index
 *
 * Central export point for all port interfaces in the hexagonal architecture.
 *
 * Ports define the contracts (interfaces) that connect the core domain
 * to the outside world. They are implemented by adapters.
 *
 * - Repository ports: Data access contracts
 * - Service ports: External service contracts
 * - Infrastructure ports: Infrastructure service contracts
 */

// Repository ports
export * from './repositories'

// Service ports
export * from './services'

// Infrastructure ports
export * from './infrastructure'
