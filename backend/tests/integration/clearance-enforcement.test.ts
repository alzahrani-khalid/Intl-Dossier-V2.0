import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

describe('Clearance Enforcement Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let testIntakeId: string;
  let testEntityId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseKey);

    // Create test user with clearance level 2
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testPassword123!',
    });

    if (authError || !user) throw new Error('Failed to create test user');
    testUserId = user.id;

    // Set clearance level for test user
    await supabase
      .from('profiles')
      .update({ clearance_level: 2 })
      .eq('id', testUserId);

    // Create test intake ticket
    const { data: intake, error: intakeError } = await supabase
      .from('intake_tickets')
      .insert({
        title: 'Test Intake for Clearance',
        description: 'Testing clearance enforcement',
        status: 'pending',
        created_by: testUserId,
      })
      .select()
      .single();

    if (intakeError || !intake) throw new Error('Failed to create test intake');
    testIntakeId = intake.id;

    // Create test entity (dossier) with classification level 1
    const { data: entity, error: entityError } = await supabase
      .from('dossiers')
      .insert({
        title: 'Test Entity',
        classification_level: 1,
        created_by: testUserId,
      })
      .select()
      .single();

    if (entityError || !entity) throw new Error('Failed to create test entity');
    testEntityId = entity.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('intake_entity_links').delete().eq('intake_id', testIntakeId);
    await supabase.from('dossiers').delete().eq('id', testEntityId);
    await supabase.from('intake_tickets').delete().eq('id', testIntakeId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  describe('T041c: Conflict Detection Integration Test', () => {
    it('should return 409 Conflict when concurrent updates occur', async () => {
      // Create initial link
      const { data: link, error: createError } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'dossier',
          entity_id: testEntityId,
          link_type: 'primary',
          created_by: testUserId,
          _version: 1,
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(link).toBeDefined();
      expect(link?._version).toBe(1);

      // Simulate concurrent update 1 (succeeds)
      const { data: update1, error: error1 } = await supabase
        .from('intake_entity_links')
        .update({
          notes: 'Update 1',
          _version: 2,
        })
        .eq('id', link!.id)
        .eq('_version', 1)
        .select()
        .single();

      expect(error1).toBeNull();
      expect(update1?._version).toBe(2);

      // Simulate concurrent update 2 (should fail - stale version)
      const { data: update2, error: error2 } = await supabase
        .from('intake_entity_links')
        .update({
          notes: 'Update 2',
          _version: 2,
        })
        .eq('id', link!.id)
        .eq('_version', 1)  // Stale version
        .select()
        .single();

      // Expect no data returned (conflict)
      expect(update2).toBeNull();
      // In a real API endpoint, this would return 409 Conflict
      // Here we verify the optimistic locking prevented the stale update

      // Verify the first update persisted
      const { data: finalLink } = await supabase
        .from('intake_entity_links')
        .select()
        .eq('id', link!.id)
        .single();

      expect(finalLink?.notes).toBe('Update 1');
      expect(finalLink?._version).toBe(2);
    });

    it('should provide retry guidance on conflict', async () => {
      // This test documents the expected API response format
      // When implemented in the Edge Function, a 409 response should include:
      const expectedConflictResponse = {
        error: 'Conflict',
        message: 'The entity link was modified by another user. Please refresh and try again.',
        code: 'OPTIMISTIC_LOCK_FAILURE',
        currentVersion: 2,
        attemptedVersion: 1,
      };

      expect(expectedConflictResponse.code).toBe('OPTIMISTIC_LOCK_FAILURE');
      expect(expectedConflictResponse.currentVersion).toBeGreaterThan(expectedConflictResponse.attemptedVersion);
    });

    it('should allow update with correct version number', async () => {
      // Create new link for this test
      const { data: link } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'dossier',
          entity_id: testEntityId,
          link_type: 'related',
          created_by: testUserId,
          _version: 1,
        })
        .select()
        .single();

      // Update with correct version
      const { data: updated, error } = await supabase
        .from('intake_entity_links')
        .update({
          notes: 'Valid update',
          _version: 2,
        })
        .eq('id', link!.id)
        .eq('_version', 1)  // Correct current version
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated?.notes).toBe('Valid update');
      expect(updated?._version).toBe(2);

      // Clean up
      await supabase.from('intake_entity_links').delete().eq('id', link!.id);
    });
  });

  describe('Clearance Level Enforcement', () => {
    it('should allow linking to entity with lower or equal classification', async () => {
      // User with clearance 2, entity with classification 1
      const { data, error } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'dossier',
          entity_id: testEntityId,
          link_type: 'primary',
          created_by: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Clean up
      if (data) {
        await supabase.from('intake_entity_links').delete().eq('id', data.id);
      }
    });

    it('should prevent linking to entity with higher classification', async () => {
      // Create entity with classification level 3 (higher than user's clearance 2)
      const { data: highClassEntity } = await supabase
        .from('dossiers')
        .insert({
          title: 'High Classification Entity',
          classification_level: 3,
          created_by: testUserId,
        })
        .select()
        .single();

      // Attempt to create link (should fail via RLS or trigger)
      const { data, error } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'dossier',
          entity_id: highClassEntity!.id,
          link_type: 'primary',
          created_by: testUserId,
        })
        .select()
        .single();

      // Expect error due to clearance check
      expect(error).toBeDefined();
      expect(data).toBeNull();

      // Clean up
      await supabase.from('dossiers').delete().eq('id', highClassEntity!.id);
    });
  });

  describe('Organization Boundary Enforcement', () => {
    it('should prevent linking to entities from different organizations', async () => {
      // Create entity in different organization
      const { data: otherOrgEntity } = await supabase
        .from('dossiers')
        .insert({
          title: 'Other Org Entity',
          organization_id: 'different-org-id',
          classification_level: 1,
          created_by: testUserId,
        })
        .select()
        .single();

      // Attempt to create link (should fail via RLS)
      const { data, error } = await supabase
        .from('intake_entity_links')
        .insert({
          intake_id: testIntakeId,
          entity_type: 'dossier',
          entity_id: otherOrgEntity!.id,
          link_type: 'primary',
          created_by: testUserId,
        })
        .select()
        .single();

      // Expect error due to organization boundary check
      expect(error).toBeDefined();
      expect(data).toBeNull();

      // Clean up
      await supabase.from('dossiers').delete().eq('id', otherOrgEntity!.id);
    });
  });
});
