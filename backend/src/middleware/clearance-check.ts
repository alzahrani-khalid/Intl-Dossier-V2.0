/**
 * Clearance Level Validation Middleware
 * Feature: 024-intake-entity-linking
 *
 * Validates that the authenticated user has sufficient clearance level
 * to access classified entities before allowing link creation.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { EntityType } from '../types/intake-entity-links.types';

/**
 * Middleware to check if user has sufficient clearance for entity access
 *
 * Note: This is a placeholder implementation until clearance_level is added to users table.
 * Currently allows all access. Will be updated when clearance system is implemented.
 */
export async function checkClearanceLevel(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { entity_type, entity_id } = req.body;
    const userId = req.user?.id; // Assumes auth middleware sets req.user

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
      return;
    }

    if (!entity_type || !entity_id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'entity_type and entity_id are required'
      });
      return;
    }

    // TODO: Implement actual clearance check when user clearance system is in place
    // For now, use database function check_clearance_level
    const { data, error } = await supabase.rpc('check_clearance_level', {
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_user_id: userId
    });

    if (error) {
      console.error('Clearance check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate clearance level'
      });
      return;
    }

    if (!data) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient clearance level to access this entity'
      });
      return;
    }

    // Clearance check passed
    next();
  } catch (error) {
    console.error('Clearance check middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Clearance validation failed'
    });
  }
}

/**
 * Batch clearance check for multiple entities
 */
export async function checkBatchClearance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { links } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
      return;
    }

    if (!links || !Array.isArray(links)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'links array is required'
      });
      return;
    }

    // Check clearance for each entity
    const clearanceChecks = await Promise.all(
      links.map(async (link: { entity_type: EntityType; entity_id: string }) => {
        const { data } = await supabase.rpc('check_clearance_level', {
          p_entity_type: link.entity_type,
          p_entity_id: link.entity_id,
          p_user_id: userId
        });
        return {
          entity_type: link.entity_type,
          entity_id: link.entity_id,
          has_clearance: data === true
        };
      })
    );

    // Find entities with insufficient clearance
    const forbidden = clearanceChecks.filter(check => !check.has_clearance);

    if (forbidden.length > 0) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient clearance for some entities',
        forbidden_entities: forbidden.map(f => ({
          entity_type: f.entity_type,
          entity_id: f.entity_id
        }))
      });
      return;
    }

    // All clearance checks passed
    next();
  } catch (error) {
    console.error('Batch clearance check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Batch clearance validation failed'
    });
  }
}
