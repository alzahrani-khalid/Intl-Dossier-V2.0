import { Request, Response } from 'express';
import { PreferencesService } from '../../services/preferences-service';
import { UserPreferenceUpdateSchema, validateUserId, ThemeEnum, ColorModeEnum, LanguageEnum } from '../../models/user-preference';
import { z } from 'zod';

const paramsSchema = z.object({
  userId: z.string().min(1),
});

export async function updateUserPreferences(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params = paramsSchema.parse(req.params);
    const { userId } = params;
    
    // Validate user ID format
    if (!validateUserId(userId)) {
      res.status(400).json({
        error: 'Invalid user ID format',
      });
      return;
    }
    
    // Check authentication if needed
    const authUserId = (req as any).user?.id;
    if (authUserId && authUserId !== userId) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Cannot update other user\'s preferences',
      });
      return;
    }

    // Validate request body
    const updates = UserPreferenceUpdateSchema.parse(req.body);

    const preferencesService = new PreferencesService();
    const preferences = await preferencesService.upsertPreferences(userId, updates);

    res.status(200).json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors[0];
      
      if (fieldError.path[0] && fieldError.code === 'invalid_enum_value') {
        const field = fieldError.path[0] as string;
        let validValues: string[] = [];
        
        // Get valid values based on field
        if (field === 'theme') {
          validValues = ['gastat', 'blue-sky'];
        } else if (field === 'colorMode') {
          validValues = ['light', 'dark'];
        } else if (field === 'language') {
          validValues = ['en', 'ar'];
        }
        
        res.status(400).json({
          error: `Invalid ${field}`,
          [`valid${field.charAt(0).toUpperCase() + field.slice(1)}s`]: validValues,
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

    if (error instanceof Error && error.message === 'Invalid user ID format') {
      res.status(400).json({
        error: 'Invalid user ID format',
      });
      return;
    }

    console.error('Error updating user preferences:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update preferences',
    });
  }
}