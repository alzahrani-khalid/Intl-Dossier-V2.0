/**
 * Structured Logging Utility for Edge Functions
 * Feature: 019-user-management-access
 * Task: T085
 *
 * Provides Winston-style structured logging for Edge Functions
 * Supports multiple log levels with context and metadata
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  function_name: string;
  user_id?: string;
  correlation_id?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class EdgeLogger {
  private context: LogContext;
  private minLevel: LogLevel;

  constructor(context: LogContext, minLevel: LogLevel = 'info') {
    this.context = context;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
    };

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    // Output structured JSON log
    console.log(JSON.stringify(entry));
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>) {
    this.log('error', message, metadata, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): EdgeLogger {
    return new EdgeLogger({ ...this.context, ...additionalContext }, this.minLevel);
  }

  /**
   * Update context for current logger
   */
  setContext(updates: Partial<LogContext>) {
    this.context = { ...this.context, ...updates };
  }
}

/**
 * Create a new logger instance for an Edge Function
 */
export function createLogger(
  functionName: string,
  req?: Request,
  minLevel: LogLevel = 'info'
): EdgeLogger {
  const context: LogContext = {
    function_name: functionName,
    correlation_id: crypto.randomUUID(),
  };

  if (req) {
    context.request_id = req.headers.get('x-request-id') || crypto.randomUUID();
    context.ip_address = getClientIp(req);
    context.user_agent = req.headers.get('user-agent') || 'unknown';
  }

  return new EdgeLogger(context, minLevel);
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  return '0.0.0.0';
}

/**
 * Sensitive headers that should never be logged
 */
const SENSITIVE_HEADERS = [
  'authorization',
  'apikey',
  'cookie',
  'x-client-info',
  'x-supabase-auth',
  'x-api-key',
  'x-access-token',
  'x-refresh-token',
  'set-cookie',
];

/**
 * Redact sensitive headers from a headers object
 */
function redactSensitiveHeaders(headers: Headers): Record<string, string> {
  const safeHeaders: Record<string, string> = {};

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.includes(lowerKey)) {
      safeHeaders[key] = '[REDACTED]';
    } else {
      safeHeaders[key] = value;
    }
  });

  return safeHeaders;
}

/**
 * Middleware: Add request logging to Edge Function
 */
export async function withRequestLogging(
  req: Request,
  functionName: string,
  handler: (req: Request, logger: EdgeLogger) => Promise<Response>
): Promise<Response> {
  const logger = createLogger(functionName, req);

  // SECURITY FIX: Redact sensitive headers before logging
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    headers: redactSensitiveHeaders(req.headers),
  });

  const startTime = Date.now();

  try {
    const response = await handler(req, logger);

    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      status: response.status,
      duration_ms: duration,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Request failed', error as Error, {
      duration_ms: duration,
    });

    throw error;
  }
}

/**
 * Export singleton for compatibility
 */
export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        metadata: meta,
      })
    );
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        metadata: meta,
      })
    );
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        metadata: meta,
      })
    );
  },
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        metadata: meta,
      })
    );
  },
};
