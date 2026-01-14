/**
 * Adapters Index
 *
 * Central export point for all adapter implementations.
 *
 * Adapters implement the port interfaces defined in core/ports.
 * They bridge the gap between the domain and external systems.
 *
 * - Repository adapters: Database implementations (Supabase, PostgreSQL)
 * - Infrastructure adapters: Cache, logging, messaging implementations
 * - External adapters: Third-party service implementations
 */

// Repository adapters
export * from './repositories'

// Infrastructure adapters
export * from './infrastructure'
