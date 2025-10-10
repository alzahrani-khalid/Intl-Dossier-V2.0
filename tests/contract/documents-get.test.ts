// T024: Contract test for GET /documents (polymorphic)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('GET /documents (polymorphic)', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testDossierId: string;
  let testPositionId: string;
  let documentIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kazahrani@stats.gov.sa',
      password: 'itisme',
    });

    if (authError || !authData.session) {
      throw new Error(`Auth failed: ${authError?.message}`);
    }

    authToken = authData.session.access_token;
    testUserId = authData.user.id;

    // Create test dossier
    const { data: dossier } = await supabase
      .from('dossiers')
      .insert({
        name_en: 'Test Dossier for Documents',
        name_ar: 'ملف تجريبي للوثائق',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = dossier?.id || '';

    // Create test position
    const { data: position } = await supabase
      .from('positions')
      .insert({
        title_en: 'Test Position for Documents',
        title_ar: 'موقف تجريبي للوثائق',
        status: 'published',
        position_type: 'bilateral',
        sensitivity_level: 'public',
      })
      .select()
      .single();

    testPositionId = position?.id || '';

    // Create test documents for dossier
    const { data: dossierDocs } = await supabase
      .from('documents')
      .insert([
        {
          owner_type: 'dossier',
          owner_id: testDossierId,
          file_name: 'test-memo.pdf',
          file_size: 1024000,
          mime_type: 'application/pdf',
          storage_path: 'test/test-memo.pdf',
          document_type: 'memo',
          language: 'en',
          scan_status: 'clean',
          sensitivity_level: 'public',
          uploaded_by: testUserId,
        },
        {
          owner_type: 'dossier',
          owner_id: testDossierId,
          file_name: 'test-report-ar.pdf',
          file_size: 2048000,
          mime_type: 'application/pdf',
          storage_path: 'test/test-report-ar.pdf',
          document_type: 'report',
          language: 'ar',
          scan_status: 'clean',
          sensitivity_level: 'internal',
          uploaded_by: testUserId,
        },
      ])
      .select();

    if (dossierDocs) {
      documentIds.push(...dossierDocs.map(d => d.id));
    }

    // Create test document for position
    const { data: positionDoc } = await supabase
      .from('documents')
      .insert({
        owner_type: 'position',
        owner_id: testPositionId,
        file_name: 'position-brief.docx',
        file_size: 512000,
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        storage_path: 'test/position-brief.docx',
        document_type: 'brief',
        language: 'both',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: testUserId,
      })
      .select()
      .single();

    if (positionDoc) {
      documentIds.push(positionDoc.id);
    }
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('documents').delete().in('id', documentIds);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
    await supabase.from('positions').delete().eq('id', testPositionId);
  });

  it('should return 200 with documents for dossier', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('documents');
    expect(data).toHaveProperty('total_count');
    expect(Array.isArray(data.documents)).toBe(true);
    expect(data.total_count).toBeGreaterThanOrEqual(2);
  });

  it('should return documents with all required fields', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    const doc = data.documents[0];

    expect(doc).toHaveProperty('id');
    expect(doc).toHaveProperty('owner_type', 'dossier');
    expect(doc).toHaveProperty('owner_id', testDossierId);
    expect(doc).toHaveProperty('file_name');
    expect(doc).toHaveProperty('file_size');
    expect(doc).toHaveProperty('mime_type');
    expect(doc).toHaveProperty('storage_path');
    expect(doc).toHaveProperty('document_type');
    expect(doc).toHaveProperty('language');
    expect(doc).toHaveProperty('scan_status');
    expect(doc).toHaveProperty('sensitivity_level');
    expect(doc).toHaveProperty('uploaded_by');
    expect(doc).toHaveProperty('uploaded_at');
  });

  it('should filter by document_type', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}&document_type=memo`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.documents.every((d: any) => d.document_type === 'memo')).toBe(true);
  });

  it('should filter by language', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}&language=ar`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.documents.every((d: any) => d.language === 'ar')).toBe(true);
  });

  it('should support pagination', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}&limit=1&offset=0`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.documents.length).toBe(1);
    expect(data.total_count).toBeGreaterThanOrEqual(2);
  });

  it('should return documents for position owner_type', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=position&owner_id=${testPositionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.documents.length).toBeGreaterThanOrEqual(1);
    expect(data.documents[0].owner_type).toBe('position');
  });

  it('should return 401 when unauthorized', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(401);
  });

  it('should return 400 for missing owner_type', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_id=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid owner_type', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=invalid&owner_id=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(400);
  });

  it('should exclude soft-deleted documents', async () => {
    // Soft delete one document
    await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentIds[0]);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    expect(data.documents.every((d: any) => !d.deleted_at)).toBe(true);

    // Restore document
    await supabase
      .from('documents')
      .update({ deleted_at: null })
      .eq('id', documentIds[0]);
  });

  it('should order by uploaded_at DESC (newest first)', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-get?owner_type=dossier&owner_id=${testDossierId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (data.documents.length > 1) {
      const dates = data.documents.map((d: any) => new Date(d.uploaded_at).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    }
  });
});
