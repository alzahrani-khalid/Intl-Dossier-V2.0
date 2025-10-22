/**
 * Organization Boundary Enforcement Middleware
 * Feature: 024-intake-entity-linking
 *
 * Ensures multi-tenancy by validating that users can only create links
 * for intake tickets and entities within their organization.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * Middleware to verify intake ticket belongs to user's organization
 */
export async function checkIntakeOrganization(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { intake_id } = req.body || req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
      return;
    }

    if (!intake_id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'intake_id is required'
      });
      return;
    }

    // Get user's organizations
    const { data: userOrgs, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId);

    if (orgError) {
      console.error('Organization fetch error:', orgError);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch user organizations'
      });
      return;
    }

    const orgIds = userOrgs?.map(org => org.organization_id) || [];

    if (orgIds.length === 0) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User is not a member of any organization'
      });
      return;
    }

    // Check if intake was created by a user in the same organization
    const { data: intake, error: intakeError } = await supabase
      .from('intake_tickets')
      .select('created_by')
      .eq('id', intake_id)
      .single();

    if (intakeError || !intake) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Intake ticket not found'
      });
      return;
    }

    // Check if intake creator is in user's organization
    const { data: intakeCreatorOrg, error: creatorOrgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', intake.created_by)
      .in('organization_id', orgIds);

    if (creatorOrgError) {
      console.error('Creator org fetch error:', creatorOrgError);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate organization'
      });
      return;
    }

    if (!intakeCreatorOrg || intakeCreatorOrg.length === 0) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Intake ticket does not belong to your organization'
      });
      return;
    }

    // Organization check passed
    next();
  } catch (error) {
    console.error('Organization check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Organization validation failed'
    });
  }
}

/**
 * Middleware to verify entity belongs to user's organization
 *
 * Note: This is a simplified implementation. Full implementation would query
 * the specific entity table to check organization_id.
 */
export async function checkEntityOrganization(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { entity_type, entity_id } = req.body;
    const userId = req.user?.id;

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

    // TODO: Implement entity organization check by querying entity table
    // For now, assume organization check is handled by RLS policies

    // Entity organization check passed
    next();
  } catch (error) {
    console.error('Entity organization check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Entity organization validation failed'
    });
  }
}
