/**
 * Core Module Index
 *
 * Central export point for the core/domain layer.
 *
 * The core layer contains:
 * - Ports: Interface definitions for external dependencies
 * - Domain: Business logic and domain services
 *
 * This layer has NO dependencies on external frameworks or infrastructure.
 * It only defines interfaces (ports) that adapters implement.
 */

// Ports (interfaces)
export * from './ports'

// Domain services
export * from './domain'
