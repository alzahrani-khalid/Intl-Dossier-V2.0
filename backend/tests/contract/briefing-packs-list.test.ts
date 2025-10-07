import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_ANON_KEY || ''
);

describe('GET /engagements/{id}/briefing-packs - Contract Tests', () => {
  let authToken: string;
  let testEngagementId: string;
  let testDossierId: string;
  let englishPackId: string;
  let arabicPackId: string;

  beforeAll(async () => {
    // Sign in test user
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'test@gastat.sa',
      password: 'Test@12345'
    });
    authToken = authData.session?.access_token || '';

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({ title: 'Test Dossier for Briefing Packs', status: 'active' })
      .select()
      .single();
    testDossierId = dossier.id;

    // Create test engagement
    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: testDossierId,
        title: 'Test Engagement',
        date: new Date().toISOString(),
      })
      .select()
      .single();
    testEngagementId = engagement.id;

    // Create test briefing packs
    const { data: englishPack } = await supabase
      .from('briefing_packs')
      .insert({
        engagement_id: testEngagementId,
        position_ids: ['00000000-0000-0000-0000-000000000001'],
        language: 'en',
        generated_by: authData.user?.id,
        file_url: 'https://example.com/pack-en.pdf',
        file_size_bytes: 1024,
      })
      .select()
      .single();
    englishPackId = englishPack.id;

    const { data: arabicPack } = await supabase
      .from('briefing_packs')
      .insert({
        engagement_id: testEngagementId,
        position_ids: ['00000000-0000-0000-0000-000000000001'],
        language: 'ar',
        generated_by: authData.user?.id,
        file_url: 'https://example.com/pack-ar.pdf',
        file_size_bytes: 2048,
      })
      .select()
      .single();
    arabicPackId = arabicPack.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('briefing_packs').delete().in('id', [englishPackId, arabicPackId]);
    await supabase.from('engagements').delete().eq('id', testEngagementId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('T015: should return 200 with all briefing packs', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data.briefing_packs)).toBe(true);
    expect(data.briefing_packs.length).toBeGreaterThanOrEqual(2);

    const pack = data.briefing_packs[0];
    expect(pack).toHaveProperty('id');
    expect(pack).toHaveProperty('language');
    expect(pack).toHaveProperty('file_url');
    expect(pack).toHaveProperty('generated_at');
  });

  it('T015: should filter by language=en', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs?language=en`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    data.briefing_packs.forEach((pack: any) => {
      expect(pack.language).toBe('en');
    });
  });

  it('T015: should filter by language=ar', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs?language=ar`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    data.briefing_packs.forEach((pack: any) => {
      expect(pack.language).toBe('ar');
    });
  });

  it('T015: should return all packs when language=all', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs?language=all`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    const languages = data.briefing_packs.map((pack: any) => pack.language);
    expect(languages).toContain('en');
    expect(languages).toContain('ar');
  });

  it('T015: should return 401 for unauthenticated requests', async () => {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${testEngagementId}/briefing-packs`
    );

    expect(response.status).toBe(401);
  });

  it('T015: should return 404 for non-existent engagement', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/engagements/${fakeId}/briefing-packs`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status).toBe(404);
  });
});
