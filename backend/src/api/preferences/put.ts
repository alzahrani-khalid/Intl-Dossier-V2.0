import { Request, Response } from 'express';
import { PreferencesService } from '../../services/preferences-service';
import { PreferenceUpdateSchema } from '../../models/user-preferences';
import { z } from 'zod';

const paramsSchema = z.object({
  userId: z.string().uuid(),
});

export async function updateUserPreferences(
  req: Request,
  res: Response,
  preferencesService: PreferencesService
): Promise<void> {
  try {
    const params = paramsSchema.parse(req.params);
    
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
      return;
    }

    if (authUserId !== params.userId) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Cannot update other user\'s preferences',
      });
      return;
    }

    const updates = PreferenceUpdateSchema.parse(req.body);

    const existingPreferences = await preferencesService.getUserPreferences(params.userId);
    
    let preferences;
    let statusCode;
    
    if (existingPreferences) {
      preferences = await preferencesService.updateUserPreferences(params.userId, updates);
      statusCode = 200;
    } else {
      preferences = await preferencesService.createUserPreferences(params.userId, updates);
      statusCode = 201;
    }

    res.status(statusCode).json(preferences);
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
      } else {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: fieldError.message || 'Invalid request body',
          field: fieldError.path[0] as string,
        });
      }
      return;
    }

    console.error('Error updating user preferences:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update preferences',
    });
  }
}