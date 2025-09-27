import { Request, Response } from 'express';
import { PreferencesService } from '../../services/preferences-service';
import { DEFAULT_PREFERENCES } from '../../models/user-preferences';
import { z } from 'zod';

const paramsSchema = z.object({
  userId: z.string().uuid(),
});

export async function getUserPreferences(
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
        message: 'Cannot access other user\'s preferences',
      });
      return;
    }

    const preferences = await preferencesService.getUserPreferences(params.userId);

    if (!preferences) {
      res.status(404).json({
        error: 'PREFERENCES_NOT_FOUND',
        message: 'No preferences found for user',
        defaultsApplied: true,
      });
      return;
    }

    res.status(200).json(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: error.errors,
      });
      return;
    }

    console.error('Error getting user preferences:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve preferences',
    });
  }
}