/**
 * Winston Logger Adapter
 *
 * Implements the ILoggerPort using Winston as the logging backend.
 * This is an adapter in the hexagonal architecture.
 */

import {
  ILoggerPort,
  ILoggerFactory,
  LogLevel,
  LogContext,
} from '../../../core/ports/infrastructure'

// Log level priority mapping
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
}

// Operation tracking for timing
const activeOperations = new Map<string, { start: number; operation: string }>()

/**
 * Winston-compatible Logger Adapter
 *
 * This adapter provides a consistent logging interface that can work with
 * Winston, console, or other logging backends.
 */
export class WinstonLoggerAdapter implements ILoggerPort {
  private currentLevel: LogLevel = 'info'
  private baseContext: LogContext
  private operationCounter = 0

  constructor(
    private readonly serviceName: string,
    context: LogContext = {},
  ) {
    this.baseContext = {
      service: serviceName,
      ...context,
    }

    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
    if (envLevel && LOG_LEVEL_PRIORITY[envLevel] !== undefined) {
      this.currentLevel = envLevel
    }
  }

  /**
   * Log an error
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context)
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Log a trace message
   */
  trace(message: string, context?: LogContext): void {
    this.log('trace', message, context)
  }

  /**
   * Log with a specific level
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isLevelEnabled(level)) return

    const mergedContext = {
      ...this.baseContext,
      ...context,
      timestamp: new Date().toISOString(),
      level,
    }

    // Format error objects
    if (mergedContext.error instanceof Error) {
      mergedContext.error = {
        message: mergedContext.error.message,
        name: mergedContext.error.name,
        stack: mergedContext.error.stack,
      }
    }

    // Output based on log level
    const output = this.formatLog(message, mergedContext)

    switch (level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'debug':
      case 'trace':
        console.debug(output)
        break
      default:
        console.log(output)
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): ILoggerPort {
    return new WinstonLoggerAdapter(this.serviceName, {
      ...this.baseContext,
      ...context,
    })
  }

  /**
   * Start a timed operation
   */
  startTimer(operation: string): () => void {
    const start = Date.now()

    return () => {
      const duration = Date.now() - start
      this.info(`${operation} completed`, { operation, duration })
    }
  }

  /**
   * Log the start of an operation
   */
  startOperation(operation: string, context?: LogContext): string {
    const operationId = `${this.serviceName}-${++this.operationCounter}-${Date.now()}`

    activeOperations.set(operationId, {
      start: Date.now(),
      operation,
    })

    this.debug(`Starting ${operation}`, {
      ...context,
      operationId,
      operation,
    })

    return operationId
  }

  /**
   * Log the end of an operation
   */
  endOperation(operationId: string, context?: LogContext): void {
    const operationData = activeOperations.get(operationId)

    if (!operationData) {
      this.warn('Attempted to end unknown operation', { operationId })
      return
    }

    const duration = Date.now() - operationData.start
    activeOperations.delete(operationId)

    this.debug(`Completed ${operationData.operation}`, {
      ...context,
      operationId,
      operation: operationData.operation,
      duration,
    })
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel
  }

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.currentLevel]
  }

  /**
   * Format log output
   */
  private formatLog(message: string, context: LogContext): string {
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
      // JSON format for production
      return JSON.stringify({
        message,
        ...context,
      })
    }

    // Pretty format for development
    const { timestamp, level, service, ...rest } = context
    const contextStr = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ''
    const levelStr = typeof level === 'string' ? level.toUpperCase() : 'INFO'

    return `[${timestamp}] [${levelStr}] [${service}] ${message}${contextStr}`
  }
}

/**
 * Logger Factory Implementation
 */
export class WinstonLoggerFactory implements ILoggerFactory {
  private rootLogger: ILoggerPort
  private loggers = new Map<string, ILoggerPort>()

  constructor() {
    this.rootLogger = new WinstonLoggerAdapter('root')
  }

  /**
   * Create a logger for a specific service/module
   */
  create(serviceName: string): ILoggerPort {
    let logger = this.loggers.get(serviceName)

    if (!logger) {
      logger = new WinstonLoggerAdapter(serviceName)
      this.loggers.set(serviceName, logger)
    }

    return logger
  }

  /**
   * Get the root logger
   */
  getRoot(): ILoggerPort {
    return this.rootLogger
  }
}
