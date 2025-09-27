import { Request, Response, NextFunction } from 'express';
import { AppError } from "../utils/errors";
import { logError, logSecurityEvent } from '../utils/logger';

class ErrorHandler {
  public handleError(err: AppError & { code?: string }, req: Request, res: Response, next: NextFunction) {
    const { statusCode = 500, message } = err;
    const code = (err as any).code;

    // Log error
    logError(`Error ${statusCode}: ${message}`, err, {
      url: req.url,
      method: req.method,
      ip: req.ip,
      user: req.user?.id
    });

    // Security event for suspicious errors
    if (statusCode === 401 || statusCode === 403) {
      logSecurityEvent('Unauthorized access attempt', 'medium', {
        url: req.url,
        ip: req.ip
      });
    }

    // Send error response
    res.status(statusCode).json({
      success: false,
      error: {
        code: code || 'INTERNAL_ERROR',
        message: this.getClientMessage(statusCode, message),
        ...(process.env.NODE_ENV === 'development' && {
          stack: err.stack,
          details: err
        })
      },
      timestamp: new Date().toISOString()
    });
  }

  private getClientMessage(statusCode: number, message: string): string {
    // Sanitize error messages for production
    if (process.env.NODE_ENV === 'production') {
      const clientMessages: Record<number, string> = {
        400: 'Invalid request',
        401: 'Authentication required',
        403: 'Access forbidden',
        404: 'Resource not found',
        409: 'Conflict with existing resource',
        422: 'Invalid input data',
        429: 'Too many requests',
        500: 'Internal server error',
        502: 'Service temporarily unavailable',
        503: 'Service unavailable'
      };

      return clientMessages[statusCode] || 'An error occurred';
    }

    return message;
  }

  public isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational || false;
    }
    return false;
  }
}

// Create custom error classes
export class BadRequestError extends Error {
  statusCode = 400;
  isOperational = true;

  constructor(message: string, public code?: string) {
    super(message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Unauthorized', public code?: string) {
    super(message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Forbidden', public code?: string) {
    super(message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;

  constructor(message: string = 'Not found', public code?: string) {
    super(message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends Error {
  statusCode = 422;
  isOperational = true;

  constructor(message: string, public code?: string, public errors?: any) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler instance
const errorHandler = new ErrorHandler();

// Export middleware
export const errorMiddleware = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  errorHandler.handleError(err, req, res, next);
};

// Process error handlers
process.on('unhandledRejection', (reason: Error) => {
  logError('Unhandled Rejection', reason);
  throw reason;
});

process.on('uncaughtException', (error: Error) => {
  logError('Uncaught Exception', error);
  if (!errorHandler.isOperationalError(error)) {
    process.exit(1);
  }
});

export default errorHandler;
