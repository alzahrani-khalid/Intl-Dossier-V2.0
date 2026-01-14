/**
 * Logger Port
 *
 * Defines the contract for logging operations.
 * Adapters can implement using Winston, Pino, console, etc.
 */

/**
 * Log levels
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

/**
 * Log context - additional structured data
 */
export interface LogContext {
  [key: string]: unknown
  requestId?: string
  userId?: string
  service?: string
  operation?: string
  duration?: number
  error?: Error | unknown
}

/**
 * Logger Port
 *
 * Contract for logging operations. Implementations can use
 * Winston, Pino, Bunyan, or cloud-native logging services.
 */
export interface ILoggerPort {
  /**
   * Log an error
   */
  error(message: string, context?: LogContext): void

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext): void

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void

  /**
   * Log a trace message
   */
  trace(message: string, context?: LogContext): void

  /**
   * Log with a specific level
   */
  log(level: LogLevel, message: string, context?: LogContext): void

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ILoggerPort

  /**
   * Start a timed operation (returns function to call on completion)
   */
  startTimer(operation: string): () => void

  /**
   * Log the start of an operation
   */
  startOperation(operation: string, context?: LogContext): string // Returns operation ID

  /**
   * Log the end of an operation
   */
  endOperation(operationId: string, context?: LogContext): void

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void

  /**
   * Get the current log level
   */
  getLevel(): LogLevel

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean
}

/**
 * Logger factory interface
 */
export interface ILoggerFactory {
  /**
   * Create a logger for a specific service/module
   */
  create(serviceName: string): ILoggerPort

  /**
   * Get the root logger
   */
  getRoot(): ILoggerPort
}
