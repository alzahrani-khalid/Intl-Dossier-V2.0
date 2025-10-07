/**
 * Test data factory functions
 * Creates test records for assignments, staff, etc.
 */

import { createServiceRoleClient } from './supabase-client';
import type { Database } from '../../src/types/database';

type Tables = Database['public']['Tables'];

const supabase = createServiceRoleClient();

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  // Delete assignments and queue entries first (have foreign keys)
  await supabase.from('assignments').delete().ilike('work_item_id', 'test-%');
  await supabase.from('assignment_queue').delete().ilike('work_item_id', 'test-%');
  await supabase.from('escalation_events').delete().ilike('notes', '%test%');

  // Delete staff profiles (references skills and org units)
  await supabase.from('staff_profiles').delete().eq('role', 'staff');

  // Delete test skills and organizational units
  await supabase.from('skills').delete().eq('category', 'test');
  await supabase.from('organizational_units').delete().ilike('name_en', 'unit-%');
}

/**
 * Create test skill
 */
export async function createTestSkill(overrides?: { name_ar?: string; name_en?: string; category?: string }) {
  const { data, error } = await supabase
    .from('skills')
    .insert({
      name_ar: overrides?.name_ar || `مهارة-${crypto.randomUUID().slice(0, 8)}`,
      name_en: overrides?.name_en || `skill-${crypto.randomUUID().slice(0, 8)}`,
      category: overrides?.category || 'test',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create test organizational unit
 */
export async function createTestOrgUnit(overrides?: { name_ar?: string; name_en?: string; unit_wip_limit?: number }) {
  const { data, error } = await supabase
    .from('organizational_units')
    .insert({
      name_ar: overrides?.name_ar || `وحدة-${crypto.randomUUID().slice(0, 8)}`,
      name_en: overrides?.name_en || `unit-${crypto.randomUUID().slice(0, 8)}`,
      unit_wip_limit: overrides?.unit_wip_limit || 20,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create test user in auth.users
 */
export async function createTestUser(overrides?: { email?: string; id?: string }) {
  const userId = overrides?.id || crypto.randomUUID();
  const email = overrides?.email || `test-${userId.slice(0, 8)}@test.com`;

  // Insert directly into auth.users using service role
  const { error } = await supabase.rpc('create_test_user', {
    user_id: userId,
    user_email: email,
  });

  if (error) {
    // Fallback: Try direct insert if RPC not available
    const { error: insertError } = await supabase.from('auth.users' as any).insert({
      id: userId,
      email,
      encrypted_password: '',
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      aud: 'authenticated',
      role: 'authenticated',
    });

    if (insertError) throw insertError;
  }

  return { id: userId, email };
}

/**
 * Create test staff profile
 */
export async function createTestStaff(overrides?: Partial<Tables['staff_profiles']['Insert']> & { skillNames?: string[] }) {
  // Extract skillNames before passing to insert
  const { skillNames, ...dbFields } = overrides || {};

  // Create test user if user_id not provided
  const userId = dbFields?.user_id || (await createTestUser()).id;

  // Create organizational unit if not provided
  const unitId = dbFields?.unit_id || (await createTestOrgUnit()).id;

  // Create skills if skill names provided
  let skillIds: string[] = [];
  if (skillNames) {
    const skills = await Promise.all(
      skillNames.map(name => createTestSkill({ name_en: name }))
    );
    skillIds = skills.map(s => s.id);
  }

  const { data, error } = await supabase
    .from('staff_profiles')
    .insert({
      user_id: userId,
      unit_id: unitId,
      skills: skillIds,
      individual_wip_limit: 5,
      role: 'staff',
      availability_status: 'available',
      ...dbFields,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create test assignment
 */
export async function createTestAssignment(overrides?: Partial<Tables['assignments']['Insert']>) {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      work_item_id: `test-${crypto.randomUUID()}`,
      work_item_type: 'ticket',
      assignee_id: crypto.randomUUID(),
      assigned_at: new Date().toISOString(),
      sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: 'normal',
      status: 'assigned',
      ...overrides,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
