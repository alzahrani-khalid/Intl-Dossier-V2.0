/**
 * Dependency Injection Container Types
 *
 * Defines symbols and types for the DI container.
 * These symbols are used to identify dependencies for injection.
 */

/**
 * Dependency injection tokens
 * These symbols uniquely identify each injectable dependency
 */
export const TYPES = {
  // Infrastructure (Singleton)
  Logger: Symbol.for('Logger'),
  LoggerFactory: Symbol.for('LoggerFactory'),
  Cache: Symbol.for('Cache'),
  Database: Symbol.for('Database'),
  SupabaseClient: Symbol.for('SupabaseClient'),
  SupabaseAdminClient: Symbol.for('SupabaseAdminClient'),
  RedisClient: Symbol.for('RedisClient'),

  // Repositories (Singleton or Tenant-Scoped)
  TaskRepository: Symbol.for('TaskRepository'),
  CountryRepository: Symbol.for('CountryRepository'),
  OrganizationRepository: Symbol.for('OrganizationRepository'),
  DossierRepository: Symbol.for('DossierRepository'),
  ContactRepository: Symbol.for('ContactRepository'),
  DocumentRepository: Symbol.for('DocumentRepository'),
  EventRepository: Symbol.for('EventRepository'),
  CommitmentRepository: Symbol.for('CommitmentRepository'),
  UserRepository: Symbol.for('UserRepository'),

  // External Services (Singleton)
  AIService: Symbol.for('AIService'),
  NotificationService: Symbol.for('NotificationService'),
  StorageService: Symbol.for('StorageService'),
  EmailService: Symbol.for('EmailService'),

  // Domain Services (Singleton or Scoped)
  TaskDomainService: Symbol.for('TaskDomainService'),
  AuthService: Symbol.for('AuthService'),
  SearchService: Symbol.for('SearchService'),
  ExportService: Symbol.for('ExportService'),

  // Tenant Isolation (Tenant-Scoped)
  TenantService: Symbol.for('TenantService'),
  TenantContextManager: Symbol.for('TenantContextManager'),

  // Request-Scoped Services
  RequestContext: Symbol.for('RequestContext'),
  RequestLogger: Symbol.for('RequestLogger'),
  CurrentUser: Symbol.for('CurrentUser'),
  AuditLogger: Symbol.for('AuditLogger'),

  // Tenant-Scoped Services
  TenantCache: Symbol.for('TenantCache'),
  TenantConfig: Symbol.for('TenantConfig'),
  TenantAuditService: Symbol.for('TenantAuditService'),

  // Unit of Work (Request-Scoped)
  UnitOfWork: Symbol.for('UnitOfWork'),
} as const

/**
 * Type alias for dependency injection types
 */
export type DITypes = typeof TYPES
