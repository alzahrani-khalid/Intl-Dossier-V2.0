/**
 * Test Helper Utilities
 * Common utilities for testing intake entity linking
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { EntityType, LinkType } from '../../src/types/intake-entity-links.types';

// Initialize test Supabase client
export const getTestSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';

  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Create a test user with specified clearance level
 */
export async function createTestUser(
  clearanceLevel: number = 3,
  organizationId?: string
) {
  const supabase = getTestSupabaseClient();
  const userId = uuidv4();
  const email = `test-${userId}@example.com`;

  // If no org ID provided, create a test organization
  if (!organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .insert({
        name: `Test Org ${userId.slice(0, 8)}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    organizationId = org?.id;
  }

  // Create user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      email,
      clearance_level: clearanceLevel,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return { userId, email, clearanceLevel, organizationId, profile };
}

/**
 * Create a test intake ticket
 */
export async function createTestIntake(
  organizationId: string,
  overrides: Partial<any> = {}
) {
  const supabase = getTestSupabaseClient();

  const { data: intake, error } = await supabase
    .from('intake_tickets')
    .insert({
      title: overrides.title || `Test Intake ${uuidv4().slice(0, 8)}`,
      description: overrides.description || 'Test intake description',
      org_id: organizationId,
      classification_level: overrides.classification_level || 2,
      status: overrides.status || 'pending',
      priority: overrides.priority || 'medium',
      created_at: new Date().toISOString(),
      ...overrides,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test intake: ${error.message}`);
  }

  return intake;
}

/**
 * Create a test entity (dossier, position, etc.)
 */
export async function createTestEntity(
  entityType: EntityType,
  organizationId: string,
  overrides: Partial<any> = {}
) {
  const supabase = getTestSupabaseClient();

  const tableMap: Record<EntityType, string> = {
    dossier: 'dossiers',
    country: 'countries',
    organization: 'organizations',
    forum: 'forums',
    position: 'positions',
    mou: 'mous',
    engagement: 'engagements',
    assignment: 'assignments',
    commitment: 'commitments',
    intelligence_signal: 'intelligence_signals',
    working_group: 'working_groups',
    topic: 'topics',
  };

  const table = tableMap[entityType];
  if (!table) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const baseData: Record<string, any> = {
    name: overrides.name || `Test ${entityType} ${uuidv4().slice(0, 8)}`,
    created_at: new Date().toISOString(),
  };

  // Add organization_id for entity types that have it
  if (entityType !== 'country') {
    baseData.organization_id = organizationId;
  }

  // Add classification_level for entity types that have it
  if (['dossier', 'position', 'mou', 'engagement', 'assignment'].includes(entityType)) {
    baseData.classification_level = overrides.classification_level || 2;
  }

  const { data: entity, error } = await supabase
    .from(table)
    .insert({ ...baseData, ...overrides })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test ${entityType}: ${error.message}`);
  }

  return entity;
}

/**
 * Create a test entity link
 */
export async function createTestLink(
  intakeId: string,
  entityType: EntityType,
  entityId: string,
  linkType: LinkType,
  userId: string,
  overrides: Partial<any> = {}
) {
  const supabase = getTestSupabaseClient();

  const { data: link, error } = await supabase
    .from('intake_entity_links')
    .insert({
      intake_id: intakeId,
      entity_type: entityType,
      entity_id: entityId,
      link_type: linkType,
      source: overrides.source || 'human',
      confidence: overrides.confidence || null,
      notes: overrides.notes || null,
      link_order: overrides.link_order || 1,
      linked_by: userId,
      _version: 1,
      created_at: new Date().toISOString(),
      ...overrides,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test link: ${error.message}`);
  }

  return link;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(entityIds: {
  userIds?: string[];
  intakeIds?: string[];
  linkIds?: string[];
  organizationIds?: string[];
}) {
  const supabase = getTestSupabaseClient();

  // Clean up links first (foreign key constraints)
  if (entityIds.linkIds && entityIds.linkIds.length > 0) {
    await supabase
      .from('intake_entity_links')
      .delete()
      .in('id', entityIds.linkIds);
  }

  // Clean up intakes
  if (entityIds.intakeIds && entityIds.intakeIds.length > 0) {
    await supabase
      .from('intake_tickets')
      .delete()
      .in('id', entityIds.intakeIds);
  }

  // Clean up users
  if (entityIds.userIds && entityIds.userIds.length > 0) {
    await supabase
      .from('profiles')
      .delete()
      .in('user_id', entityIds.userIds);
  }

  // Clean up organizations last
  if (entityIds.organizationIds && entityIds.organizationIds.length > 0) {
    await supabase
      .from('organizations')
      .delete()
      .in('id', entityIds.organizationIds);
  }
}

/**
 * Generate mock JWT token for testing
 */
export function generateMockJWT(userId: string, clearanceLevel: number, organizationId: string) {
  // In a real scenario, you'd use jsonwebtoken to sign a proper JWT
  // For testing, we'll use a simple format that our middleware can parse
  return Buffer.from(
    JSON.stringify({
      sub: userId,
      email: `test-${userId}@example.com`,
      clearance_level: clearanceLevel,
      organization_id: organizationId,
    })
  ).toString('base64');
}
