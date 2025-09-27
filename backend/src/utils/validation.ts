import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export class ValidationError extends Error {
  public details: any[];

  constructor(message: string, details: any[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Middleware factory for request validation
 */
export const validate = (schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        const result = await schema.body.parseAsync(req.body);
        req.body = result;
      }

      if (schema.query) {
        const result = await schema.query.parseAsync(req.query);
        req.query = result as any;
      }

      if (schema.params) {
        const result = await schema.params.parseAsync(req.params);
        req.params = result as any;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message,
          type: err.code
        }));

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  lang: z.enum(['en', 'ar']).optional(),
  ...paginationSchema.shape
});

// Bilingual field validation
export const bilingualFieldSchema = z.object({
  en: z.string(),
  ar: z.string()
});

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(
  data => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: 'Start date must be before end date' }
);

// File upload validation
export const fileUploadSchema = z.object({
  mimetype: z.string().min(1, 'Invalid mimetype'),
  size: z.number().max(10 * 1024 * 1024) // 10MB max
});

/**
 * Helper function to create bilingual error messages
 */
export const createBilingualError = (messageEn: string, messageAr: string, lang = 'en') => {
  return lang === 'ar' ? messageAr : messageEn;
};

/**
 * Helper to extract language preference from request
 */
export const getRequestLanguage = (req: Request): 'en' | 'ar' => {
  const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  return lang === 'ar' ? 'ar' : 'en';
};
