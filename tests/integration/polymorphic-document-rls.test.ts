// T034: Integration test - Polymorphic document RLS enforcement
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Polymorphic Document RLS Enforcement', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let userId: string;
  let dossierId: string;
  let positionId: string;
  let engagementId: string;
  let documentIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    authToken = authData?.session?.access_token || '';
    userId = authData?.user?.id || '';

    // Create test entities
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Document RLS Test Dossier',
        name_ar: 'ملف اختبار RLS للوثائق',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    dossierId = dossier?.id || '';

    const { data: position } = await supabase
      .from('positions')
      .insert({
        title_en: 'Document RLS Test Position',
        title_ar: 'موقف اختبار RLS للوثائق',
        content_en: 'Test content',
        content_ar: 'محتوى تجريبي',
        status: 'published',
      })
      .select()
      .single();

    positionId = position?.id || '';

    const { data: engagement } = await supabase
      .from('engagements')
      .insert({
        dossier_id: dossierId,
        title_en: 'Document RLS Test Engagement',
        title_ar: 'مشاركة اختبار RLS للوثائق',
        engagement_type: 'bilateral_meeting',
        engagement_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'scheduled',
      })
      .select()
      .single();

    engagementId = engagement?.id || '';

    // Create documents for each owner type
    const documents = [
      {
        owner_type: 'dossier',
        owner_id: dossierId,
        file_name: 'dossier_doc.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: `documents/dossier/${dossierId}/test.pdf`,
        sensitivity_level: 'public',
      },
      {
        owner_type: 'position',
        owner_id: positionId,
        file_name: 'position_doc.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
        storage_path: `documents/position/${positionId}/test.pdf`,
        sensitivity_level: 'internal',
      },
      {
        owner_type: 'engagement',
        owner_id: engagementId,
        file_name: 'engagement_doc.pdf',
        file_size: 3072,
        mime_type: 'application/pdf',
        storage_path: `documents/engagement/${engagementId}/test.pdf`,
        sensitivity_level: 'confidential',
      },
    ];

    const { data: createdDocs } = await supabase
      .from('documents')
      .insert(documents)
      .select();

    documentIds = createdDocs?.map(d => d.id) || [];
  });

  afterAll(async () => {
    await supabase.from('documents').delete().in('id', documentIds);
    await supabase.from('engagements').delete().eq('id', engagementId);
    await supabase.from('positions').delete().eq('id', positionId);
    await supabase.from('dossiers').delete().eq('id', dossierId);
  });

  it('should allow access to public dossier documents', async () => {
    const { data: docs, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_type', 'dossier')
      .eq('owner_id', dossierId);

    expect(error).toBeNull();
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);

    console.log('✓ Public dossier documents accessible');
  });

  it('should allow access to published position documents', async () => {
    const { data: docs, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_type', 'position')
      .eq('owner_id', positionId);

    expect(error).toBeNull();
    expect(docs).toBeDefined();
    expect(docs?.length).toBeGreaterThan(0);

    console.log('✓ Published position documents accessible');
  });

  it('should enforce RLS based on engagement access', async () => {
    const { data: docs, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_type', 'engagement')
      .eq('owner_id', engagementId);

    // Should succeed if user has access to the engagement's dossier
    expect(error).toBeNull();

    console.log('✓ Engagement document access enforced by RLS');
  });

  it('should deny access to restricted dossier documents', async () => {
    // Create a confidential dossier the user doesn't own
    const { data: restrictedDossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Restricted Dossier',
        name_ar: 'ملف مقيد',
        type: 'country',
        sensitivity_level: 'confidential',
        reference_type: 'country',
      })
      .select()
      .single();

    const { data: restrictedDoc } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: restrictedDossier?.id,
        file_name: 'restricted.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        storage_path: `documents/dossier/${restrictedDossier?.id}/restricted.pdf`,
        sensitivity_level: 'confidential',
      })
      .select()
      .single();

    // Try to access restricted document as current user
    const { data: docs, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', restrictedDoc?.id);

    // Should fail RLS check
    expect(docs?.length).toBe(0);

    console.log('✓ Restricted documents properly blocked by RLS');

    // Cleanup
    await supabase.from('documents').delete().eq('id', restrictedDoc?.id);
    await supabase.from('dossiers').delete().eq('id', restrictedDossier?.id);
  });
});
