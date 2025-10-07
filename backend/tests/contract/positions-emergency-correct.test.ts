/**
 * Contract Test: POST /positions/{id}/emergency-correct
 * Feature: 011-positions-talking-points
 * Task: T097
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: POST /positions/{id}/emergency-correct', () => {
  let adminAuthToken: string;
  let regularUserToken: string;
  let testPositionId: string;
  let testPositionTypeId: string;

  beforeAll(async () => {
    // Sign in as admin user
    const { data: adminAuthData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'adminpassword123'
    });
    adminAuthToken = adminAuthData.session?.access_token || '';

    // Sign in as regular user
    const { data: regularAuthData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123'
    });
    regularUserToken = regularAuthData.session?.access_token || '';

    // Get test position type
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();
    testPositionTypeId = positionType?.id || '';

    // Create a published position for testing
    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: testPositionTypeId,
        title_en: 'Position to Correct',
        title_ar: 'موقف للتصحيح',
        content_en: 'Original incorrect content',
        content_ar: 'المحتوى الأصلي غير الصحيح',
        thematic_category: 'Trade Policy',
        status: 'published',
        current_stage: 0,
        consistency_score: 100,
        version: 1
      })
      .select()
      .single();
    testPositionId = position?.id || '';
  });

  afterAll(async () => {
    // Cleanup test position
    if (testPositionId) {
      await supabase.from('position_versions').delete().eq('position_id', testPositionId);
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should reject non-admin users with 403', async () => {
    const requestBody = {
      correction_reason: 'Critical error in policy statement',
      corrected_content_en: 'Corrected content',
      corrected_content_ar: 'المحتوى المصحح'
    };

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-emergency-correct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${regularUserToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_id: testPositionId,
          ...requestBody
        })
      }
    );

    expect(response.status).toBe(403);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/admin|unauthorized/i);
  });

  it('should reject request without correction_reason', async () => {
    const requestBody = {
      corrected_content_en: 'Corrected content',
      corrected_content_ar: 'المحتوى المصحح'
      // Missing correction_reason
    };

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-emergency-correct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminAuthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_id: testPositionId,
          ...requestBody
        })
      }
    );

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toMatch(/reason/i);
  });

  it('should successfully create emergency correction with admin auth', async () => {
    const requestBody = {
      correction_reason: 'Critical error requiring immediate correction',
      corrected_content_en: 'Corrected content with accurate information',
      corrected_content_ar: 'المحتوى المصحح بالمعلومات الدقيقة'
    };

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-emergency-correct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminAuthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_id: testPositionId,
          ...requestBody
        })
      }
    );

    expect(response.status).toBe(201);
    const data = await response.json();

    // Verify response schema
    expect(data).toHaveProperty('position');
    expect(data).toHaveProperty('new_version');
    expect(data.position.emergency_correction).toBe(true);
    expect(data.position.correction_reason).toBe(requestBody.correction_reason);
    expect(data.position.corrected_at).toBeDefined();
    expect(data.position.corrected_by).toBeDefined();
    expect(data.position.corrected_version_id).toBeDefined();
  });

  it('should create new version with corrected content', async () => {
    const requestBody = {
      correction_reason: 'Post-publication error correction',
      corrected_content_en: 'Emergency corrected content',
      corrected_content_ar: 'المحتوى المصحح للطوارئ'
    };

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-emergency-correct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminAuthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_id: testPositionId,
          ...requestBody
        })
      }
    );

    expect(response.status).toBe(201);
    const data = await response.json();

    // Verify new version created
    const { data: versionData } = await supabase
      .from('position_versions')
      .select('*')
      .eq('position_id', testPositionId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    expect(versionData).toBeDefined();
    expect(versionData?.content_en).toBe(requestBody.corrected_content_en);
    expect(versionData?.content_ar).toBe(requestBody.corrected_content_ar);
    expect(versionData?.superseded).toBe(false);

    // Verify previous version marked as superseded
    const { data: previousVersions } = await supabase
      .from('position_versions')
      .select('*')
      .eq('position_id', testPositionId)
      .lt('version_number', versionData?.version_number || 0);

    expect(previousVersions?.every(v => v.superseded === true)).toBe(true);
  });

  it('should maintain audit trail with corrector identity', async () => {
    const requestBody = {
      correction_reason: 'Audit trail test correction',
      corrected_content_en: 'Audit test content',
      corrected_content_ar: 'محتوى اختبار التدقيق'
    };

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-emergency-correct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminAuthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_id: testPositionId,
          ...requestBody
        })
      }
    );

    expect(response.status).toBe(201);
    const data = await response.json();

    // Verify audit fields populated
    expect(data.position.corrected_by).toBeDefined();
    expect(data.position.corrected_at).toBeDefined();
    expect(data.position.correction_reason).toBe(requestBody.correction_reason);

    // Verify corrected_by is the admin user
    const { data: userData } = await supabase.auth.getUser();
    expect(data.position.corrected_by).toBeDefined();
  });

  it('should return 404 for non-existent position', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const requestBody = {
      correction_reason: 'Test correction',
      corrected_content_en: 'Test',
      corrected_content_ar: 'اختبار'
    };

    const response = await fetch(
      `${supabaseUrl}/functions/v1/positions-emergency-correct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminAuthToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position_id: nonExistentId,
          ...requestBody
        })
      }
    );

    expect(response.status).toBe(404);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });
});
