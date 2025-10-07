/**
 * Contract Test: POST /positions
 * Feature: 011-positions-talking-points
 * Task: T018
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: POST /positions', () => {
  let authToken: string;
  let testPositionTypeId: string;
  let testAudienceGroupId: string;
  let createdPositionIds: string[] = [];

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123'
    });
    authToken = authData.session?.access_token || '';

    // Get test position type
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();
    testPositionTypeId = positionType?.id || '';

    // Get test audience group
    const { data: audienceGroup } = await supabase
      .from('audience_groups')
      .select('id')
      .eq('name_en', 'All Staff')
      .single();
    testAudienceGroupId = audienceGroup?.id || '';
  });

  afterAll(async () => {
    // Cleanup created positions
    for (const id of createdPositionIds) {
      await supabase.from('positions').delete().eq('id', id);
    }
  });

  it('should create position with required fields', async () => {
    const requestBody = {
      position_type_id: testPositionTypeId,
      title_en: 'New Trade Policy Position',
      title_ar: 'موقف سياسة التجارة الجديد',
      thematic_category: 'Trade Policy',
      audience_groups: [testAudienceGroupId]
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty('id');
    expect(data.title_en).toBe('New Trade Policy Position');
    expect(data.title_ar).toBe('موقف سياسة التجارة الجديد');
    expect(data.status).toBe('draft');
    expect(data.version).toBe(1);

    createdPositionIds.push(data.id);
  });

  it('should reject position without required bilingual titles', async () => {
    const requestBody = {
      position_type_id: testPositionTypeId,
      title_en: 'English Only',
      // Missing title_ar
      thematic_category: 'Trade Policy'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  it('should create version 1 record on position creation', async () => {
    const requestBody = {
      position_type_id: testPositionTypeId,
      title_en: 'Version Test Position',
      title_ar: 'موقف اختبار الإصدار',
      thematic_category: 'Climate'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    // Verify version record created
    const { data: versionData } = await supabase
      .from('position_versions')
      .select('*')
      .eq('position_id', data.id)
      .eq('version_number', 1)
      .single();

    expect(versionData).toBeDefined();
    expect(versionData?.version_number).toBe(1);

    createdPositionIds.push(data.id);
  });

  it('should associate audience groups via junction table', async () => {
    const requestBody = {
      position_type_id: testPositionTypeId,
      title_en: 'Audience Test Position',
      title_ar: 'موقف اختبار الجمهور',
      thematic_category: 'Security',
      audience_groups: [testAudienceGroupId]
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(201);
    const data = await response.json();

    // Verify junction table entry
    const { data: junctionData } = await supabase
      .from('position_audience_groups')
      .select('*')
      .eq('position_id', data.id);

    expect(junctionData).toBeDefined();
    expect(junctionData?.length).toBeGreaterThan(0);

    createdPositionIds.push(data.id);
  });
});
