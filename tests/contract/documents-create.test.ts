// T025: Contract test for POST /documents
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('POST /documents', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testDossierId: string;
  let createdDocumentIds: string[] = [];

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
        name_en: 'Test Dossier for Document Upload',
        name_ar: 'ملف تجريبي لرفع الوثائق',
        type: 'country',
        sensitivity_level: 'public',
        reference_type: 'country',
      })
      .select()
      .single();

    testDossierId = dossier?.id || '';
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('documents').delete().in('id', createdDocumentIds);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should return 201 and create document successfully', async () => {
    // Create a small test file (base64 encoded)
    const testFileContent = Buffer.from('Test document content').toString('base64');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_type: 'dossier',
          owner_id: testDossierId,
          file_name: 'test-document.pdf',
          file_content: testFileContent,
          mime_type: 'application/pdf',
          document_type: 'memo',
          language: 'en',
          sensitivity_level: 'public',
          tags: ['test', 'contract'],
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('owner_type', 'dossier');
    expect(data).toHaveProperty('owner_id', testDossierId);
    expect(data).toHaveProperty('file_name', 'test-document.pdf');
    expect(data).toHaveProperty('storage_path');
    expect(data).toHaveProperty('scan_status', 'pending');
    expect(data).toHaveProperty('uploaded_by', testUserId);
    expect(data).toHaveProperty('uploaded_at');

    createdDocumentIds.push(data.id);
  });

  it('should support all owner_types', async () => {
    const ownerTypes = ['dossier', 'position', 'engagement', 'mou'];

    for (const ownerType of ownerTypes) {
      const testFileContent = Buffer.from(`Test ${ownerType} document`).toString('base64');

      const response = await fetch(
        `${supabaseUrl}/functions/v1/documents-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner_type: ownerType,
            owner_id: testDossierId, // Using dossier ID for simplicity
            file_name: `test-${ownerType}.pdf`,
            file_content: testFileContent,
            mime_type: 'application/pdf',
            document_type: 'report',
            language: 'en',
            sensitivity_level: 'public',
          }),
        }
      );

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.owner_type).toBe(ownerType);

      createdDocumentIds.push(data.id);
    }
  });

  it('should support all sensitivity levels', async () => {
    const levels = ['public', 'internal', 'confidential', 'secret'];

    for (const level of levels) {
      const testFileContent = Buffer.from(`Test ${level} document`).toString('base64');

      const response = await fetch(
        `${supabaseUrl}/functions/v1/documents-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner_type: 'dossier',
            owner_id: testDossierId,
            file_name: `test-${level}.pdf`,
            file_content: testFileContent,
            mime_type: 'application/pdf',
            document_type: 'memo',
            language: 'en',
            sensitivity_level: level,
          }),
        }
      );

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.sensitivity_level).toBe(level);

      createdDocumentIds.push(data.id);
    }
  });

  it('should support bilingual documents', async () => {
    const languages = ['en', 'ar', 'both'];

    for (const lang of languages) {
      const testFileContent = Buffer.from(`Test ${lang} document`).toString('base64');

      const response = await fetch(
        `${supabaseUrl}/functions/v1/documents-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner_type: 'dossier',
            owner_id: testDossierId,
            file_name: `test-${lang}.pdf`,
            file_content: testFileContent,
            mime_type: 'application/pdf',
            document_type: 'report',
            language: lang,
            sensitivity_level: 'public',
          }),
        }
      );

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.language).toBe(lang);

      createdDocumentIds.push(data.id);
    }
  });

  it('should reject file exceeding 100MB limit', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_type: 'dossier',
          owner_id: testDossierId,
          file_name: 'huge-file.pdf',
          file_content: 'base64content',
          mime_type: 'application/pdf',
          file_size: 104857601, // 100MB + 1 byte
          document_type: 'report',
          language: 'en',
          sensitivity_level: 'public',
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should return 401 when unauthorized', async () => {
    const testFileContent = Buffer.from('Test document').toString('base64');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_type: 'dossier',
          owner_id: testDossierId,
          file_name: 'test.pdf',
          file_content: testFileContent,
          mime_type: 'application/pdf',
          document_type: 'memo',
          language: 'en',
          sensitivity_level: 'public',
        }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('should validate required fields', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_type: 'dossier',
          // Missing owner_id, file_name, etc.
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should set scan_status to pending on upload', async () => {
    const testFileContent = Buffer.from('Test scan pending').toString('base64');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_type: 'dossier',
          owner_id: testDossierId,
          file_name: 'scan-test.pdf',
          file_content: testFileContent,
          mime_type: 'application/pdf',
          document_type: 'memo',
          language: 'en',
          sensitivity_level: 'public',
        }),
      }
    );

    const data = await response.json();
    expect(data.scan_status).toBe('pending');
    expect(data.is_latest).toBe(true);
    expect(data.version_number).toBe(1);

    createdDocumentIds.push(data.id);
  });

  it('should support tags array', async () => {
    const testFileContent = Buffer.from('Test tags').toString('base64');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_type: 'dossier',
          owner_id: testDossierId,
          file_name: 'tagged-document.pdf',
          file_content: testFileContent,
          mime_type: 'application/pdf',
          document_type: 'report',
          language: 'en',
          sensitivity_level: 'public',
          tags: ['important', 'q1-2025', 'finance'],
        }),
      }
    );

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.tags).toEqual(['important', 'q1-2025', 'finance']);

    createdDocumentIds.push(data.id);
  });
});
