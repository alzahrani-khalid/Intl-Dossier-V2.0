import { Request, Response, NextFunction } from 'express';
import * as EV from 'express-validator';
const { validationResult } = EV as unknown as {
  validationResult: (req: Request) => { isEmpty: () => boolean; array: () => any[] };
};
import { createBilingualError, getRequestLanguage } from '../utils/validation';

// Re-export validate from utils for middleware compatibility
export {
  validate,
  // Re-export helpers and schemas for tests and middleware consumers
  createBilingualError,
  getRequestLanguage,
  paginationSchema,
  idParamSchema,
  searchQuerySchema,
  bilingualFieldSchema,
  dateRangeSchema,
  fileUploadSchema,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '../utils/validation';

/**
 * Middleware to check validation errors
 */
export const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const lang = getRequestLanguage(req);
    return res.status(400).json({
      error: createBilingualError(
        'Validation failed',
        'فشل التحقق من البيانات',
        lang
      ),
      details: errors.array()
    });
  }
  next();
};

/**
 * Export the same as handleValidation for compatibility
 */
export const handleValidation = checkValidation;

// no-op
