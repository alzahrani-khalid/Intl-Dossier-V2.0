import { Request, Response, NextFunction } from 'express';
import { PreferenceUpdateSchema } from '../models/user-preferences';
import { z } from 'zod';

export function validatePreferences(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'PUT' || req.method === 'POST') {
    try {
      PreferenceUpdateSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0];
        
        if (fieldError.path[0] && fieldError.code === 'invalid_enum_value') {
          const field = fieldError.path[0] as string;
          const validValues = (fieldError as any).options || [];
          
          res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: `Invalid ${field} value`,
            field,
            validValues,
          });
        } else if (fieldError.code === 'custom' && fieldError.message.includes('At least one')) {
          res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'At least one preference field must be provided',
          });
        } else {
          res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: fieldError.message || 'Invalid request body',
            field: fieldError.path[0] as string,
          });
        }
      } else {
        res.status(500).json({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate preferences',
        });
      }
    }
  } else {
    next();
  }
}