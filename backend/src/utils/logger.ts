import winston from 'winston'
import path from 'path'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
)

// Define log format for files (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

// Define which logs to show based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

// Create logs directory path
const logDir = path.join(process.cwd(), 'logs')

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    level: level(),
    format,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logDir, 'all.log'),
    level: 'debug',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for error logs only
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
]

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
})

// Helper functions for structured logging
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta)
}

export const logError = (message: string, error?: Error, meta?: any) => {
  const errorMeta = {
    ...meta,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }),
  }
  logger.error(message, errorMeta)
}

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta)
}

// API request logging helpers
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  meta?: any,
) => {
  logger.http('API request', {
    type: 'api',
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ...meta,
  })
}

// Security logging helpers
export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  meta?: any,
) => {
  const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
  logger[logLevel](`Security event: ${event}`, {
    type: 'security',
    severity,
    timestamp: new Date().toISOString(),
    ...meta,
  })
}

export const logAuthEvent = (event: string, userId?: string, meta?: any) => {
  logger.info(`Authentication event: ${event}`, {
    type: 'auth',
    userId,
    timestamp: new Date().toISOString(),
    ...meta,
  })
}

export default logger
