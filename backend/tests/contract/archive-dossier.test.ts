/**
 * Contract Test: DELETE /dossiers/:id (Archive)
 * Task: T017
 * Status: MUST FAIL until T024 implemented
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
let authToken: string;
let testDossierId: string;

const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

beforeAll(async () => {
  // TODO: Authenticate test user
});

beforeEach(async () => {
  // Create a test dossier for each test
  const { data } = await supabaseService.from('dossiers').insert({
    name_en: 'Test Dossier for Archive',
    name_ar: 'ملف اختبار للأرشفة',
    type: 'theme',
    sensitivity_level: 'low',
  }).select().single();
  
  testDossierId = data!.id;
});

describe('DELETE /dossiers/:id - Archive', () => {
  const ENDPOINT = `${SUPABASE_URL}/functions/v1/dossiers-archive`;

  it('should archive dossier successfully', async () => {
    const response = await fetch(`${ENDPOINT}/${testDossierId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');

    // Verify dossier is archived
    const { data } = await supabaseService
      .from('dossiers')
      .select('archived')
      .eq('id', testDossierId)
      .single();
    
    expect(data?.archived).toBe(true);
  });

  it('should return 401 Unauthorized without auth token', async () => {
    const response = await fetch(`${ENDPOINT}/${testDossierId}`, {
      method: 'DELETE'
    });

    expect(response.status).toBe(401);
  });

  it('should return 403 Forbidden for non-owner non-admin', async () => {
    // TODO: Test with user who is not owner and not admin
  });

  it('should return 404 Not Found for non-existent dossier', async () => {
    const response = await fetch(`${ENDPOINT}/00000000-0000-0000-0000-999999999999`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.status).toBe(404);
  });
});
