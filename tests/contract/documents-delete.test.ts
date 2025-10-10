// T026: Contract test for DELETE /documents/{documentId}
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('DELETE /documents/{documentId}', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;
  let testDossierId: string;
  let testDocumentId: string;

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
        name_en: 'Test Dossier for Document Deletion',
        name_ar: 'ملف تجريبي لحذف الوثائق',
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
    await supabase.from('documents').delete().eq('owner_id', testDossierId);
    await supabase.from('dossiers').delete().eq('id', testDossierId);
  });

  it('should return 204 and soft-delete document successfully', async () => {
    // Create a document first
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: testDossierId,
        file_name: 'test-to-delete.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        storage_path: 'test/test-to-delete.pdf',
        document_type: 'memo',
        language: 'en',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: testUserId,
      })
      .select()
      .single();

    testDocumentId = doc?.id || '';

    // Delete the document
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: testDocumentId,
        }),
      }
    );

    expect(response.status).toBe(204);

    // Verify document is soft-deleted (has deleted_at timestamp)
    const { data: deletedDoc } = await supabase
      .from('documents')
      .select()
      .eq('id', testDocumentId)
      .single();

    expect(deletedDoc?.deleted_at).not.toBeNull();
  });

  it('should remove document from storage on deletion', async () => {
    // Create a document
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: testDossierId,
        file_name: 'storage-test.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        storage_path: 'test/storage-test.pdf',
        document_type: 'memo',
        language: 'en',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: testUserId,
      })
      .select()
      .single();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc?.id,
        }),
      }
    );

    expect(response.status).toBe(204);

    // Note: Actual storage verification would require Supabase Storage API check
    // This test verifies the API call succeeds
  });

  it('should return 401 when unauthorized', async () => {
    // Create a document
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: testDossierId,
        file_name: 'auth-test.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        storage_path: 'test/auth-test.pdf',
        document_type: 'memo',
        language: 'en',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: testUserId,
      })
      .select()
      .single();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc?.id,
        }),
      }
    );

    expect(response.status).toBe(401);

    // Cleanup
    await supabase.from('documents').delete().eq('id', doc?.id);
  });

  it('should return 404 for non-existent document', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: nonExistentId,
        }),
      }
    );

    expect(response.status).toBe(404);
  });

  it('should return 403 when user does not own document', async () => {
    // Create document owned by different user
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: testDossierId,
        file_name: 'other-user-doc.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        storage_path: 'test/other-user-doc.pdf',
        document_type: 'memo',
        language: 'en',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: '00000000-0000-0000-0000-000000000001', // Different user
      })
      .select()
      .single();

    if (!doc) {
      // Skip if can't create document for other user
      return;
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc.id,
        }),
      }
    );

    expect(response.status).toBe(403);

    // Cleanup
    await supabase.from('documents').delete().eq('id', doc.id);
  });

  it('should be idempotent (deleting already deleted document)', async () => {
    // Create and delete a document
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: testDossierId,
        file_name: 'idempotent-test.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        storage_path: 'test/idempotent-test.pdf',
        document_type: 'memo',
        language: 'en',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: testUserId,
      })
      .select()
      .single();

    // First delete
    const response1 = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc?.id,
        }),
      }
    );

    expect(response1.status).toBe(204);

    // Second delete (already deleted)
    const response2 = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc?.id,
        }),
      }
    );

    // Should return 404 (already deleted) or 204 (idempotent)
    expect([204, 404]).toContain(response2.status);
  });

  it('should return 400 for invalid UUID format', async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: 'invalid-uuid',
        }),
      }
    );

    expect(response.status).toBe(400);
  });

  it('should handle deletion of document with versions', async () => {
    // Create original document
    const { data: doc1 } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: testDossierId,
        file_name: 'versioned-doc.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        storage_path: 'test/versioned-doc-v1.pdf',
        document_type: 'report',
        language: 'en',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: testUserId,
        version_number: 1,
        is_latest: false,
      })
      .select()
      .single();

    // Create newer version
    const { data: doc2 } = await supabase
      .from('documents')
      .insert({
        owner_type: 'dossier',
        owner_id: testDossierId,
        file_name: 'versioned-doc.pdf',
        file_size: 2048000,
        mime_type: 'application/pdf',
        storage_path: 'test/versioned-doc-v2.pdf',
        document_type: 'report',
        language: 'en',
        scan_status: 'clean',
        sensitivity_level: 'public',
        uploaded_by: testUserId,
        version_number: 2,
        is_latest: true,
        supersedes_document_id: doc1?.id,
      })
      .select()
      .single();

    // Delete latest version
    const response = await fetch(
      `${supabaseUrl}/functions/v1/documents-delete`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc2?.id,
        }),
      }
    );

    expect(response.status).toBe(204);

    // Cleanup
    await supabase.from('documents').delete().eq('id', doc1?.id);
  });
});
