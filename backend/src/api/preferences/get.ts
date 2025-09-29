import { Request, Response } from 'express';
import { PreferencesService } from '../../services/preferences-service';
import { validateUserId } from '../../models/user-preference';
import { z } from 'zod';

const paramsSchema = z.object({
  userId: z.string().min(1),
});

export async function getUserPreferences(
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
        message: 'Cannot access other user\'s preferences',
      });
      return;
    }

    const preferencesService = new PreferencesService();
    const preferences = await preferencesService.getPreferences(userId);

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

    if (error instanceof Error && error.message === 'Invalid user ID format') {
      res.status(400).json({
        error: 'Invalid user ID format',
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