/**
 * Integration Test: Async AI Extraction with Notifications
 *
 * Tests async extraction workflow for large documents with push notifications
 * Following TDD approach - this test should FAIL until implementation is complete
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient>;
let authToken: string;
let testUserId: string;

beforeAll(async () => {
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Authenticate test user
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: 'kazahrani@stats.gov.sa',
    password: 'itisme'
  });

  if (error) throw error;
  authToken = authData.session?.access_token || '';
  testUserId = authData.user?.id || '';
});

afterAll(async () => {
  await supabase.auth.signOut();
});

describe('Async AI Extraction with Notifications', () => {
  it('should queue large document for async processing and send notification when complete', async () => {
    // Upload test document to Supabase Storage
    const testPdfUrl = `${supabaseUrl}/storage/v1/object/public/test-documents/large-meeting-minutes.pdf`;

    // Step 1: Initiate async extraction
    const extractResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-async`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_url: testPdfUrl,
        document_type: 'application/pdf',
        language: 'en',
        notification_config: {
          push_enabled: true,
          email_enabled: false
        }
      })
    });

    expect(extractResponse.status).toBe(202); // Accepted for async processing

    const extractData = await extractResponse.json();
    expect(extractData).toHaveProperty('job_id');
    expect(extractData).toHaveProperty('estimated_completion_seconds');

    const jobId = extractData.job_id;

    // Step 2: Poll job status until complete
    let status = 'queued';
    let attempts = 0;
    let maxAttempts = 35; // 35 seconds max (requirement: <30s)
    let finalResult: any;

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      finalResult = await statusResponse.json();
      status = finalResult.status;
      attempts++;

      // Verify progress updates
      expect(finalResult.progress_percentage).toBeGreaterThanOrEqual(0);
      expect(finalResult.progress_percentage).toBeLessThanOrEqual(100);
    }

    // Step 3: Verify completion within time limit
    expect(attempts).toBeLessThan(maxAttempts);
    expect(status).toBe('completed');

    // Step 4: Verify extraction results
    expect(finalResult.results).toBeDefined();
    expect(finalResult.results.decisions).toBeDefined();
    expect(finalResult.results.commitments).toBeDefined();
    expect(finalResult.results.risks).toBeDefined();

    // Step 5: Verify notification was queued
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'ai_extraction_complete')
      .eq('reference_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(notifications).toBeDefined();
    expect(notifications?.length).toBeGreaterThan(0);

    const notification = notifications?.[0];
    expect(notification.title).toContain('extraction complete');
    expect(notification.data).toHaveProperty('job_id', jobId);
    expect(notification.data).toHaveProperty('entity_counts');

    // Step 6: Verify notification includes entity counts for quick review
    expect(notification.data.entity_counts).toHaveProperty('decisions');
    expect(notification.data.entity_counts).toHaveProperty('commitments');
    expect(notification.data.entity_counts).toHaveProperty('risks');
  }, 40000); // Increase test timeout to 40s

  it('should handle extraction failure gracefully with error notification', async () => {
    // Attempt to extract from invalid document
    const extractResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-async`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_url: 'https://example.com/non-existent-document.pdf',
        document_type: 'application/pdf',
        language: 'en',
        notification_config: {
          push_enabled: true,
          email_enabled: false
        }
      })
    });

    const extractData = await extractResponse.json();
    const jobId = extractData.job_id;

    // Poll until failed
    let status = 'queued';
    let attempts = 0;
    let finalResult: any;

    while (status !== 'failed' && attempts < 15) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      finalResult = await statusResponse.json();
      status = finalResult.status;
      attempts++;
    }

    // Verify failure status
    expect(status).toBe('failed');
    expect(finalResult).toHaveProperty('error_message');
    expect(finalResult).toHaveProperty('error_code');

    // Verify error notification was sent
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'ai_extraction_failed')
      .eq('reference_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(notifications?.length).toBeGreaterThan(0);

    const notification = notifications?.[0];
    expect(notification.title).toContain('extraction failed');
    expect(notification.data).toHaveProperty('error_message');
    expect(notification.action_url).toContain('/after-action/create'); // Link to retry manually
  }, 20000);

  it('should cache extraction results in Redis for 30 days', async () => {
    const testDocument = `
      Decision: Implement new policy framework
      Commitment: Update documentation by next month
      Risk: Timeline constraints (High, Likely)
    `;

    // First extraction - should process and cache
    const firstResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_content: testDocument,
        document_type: 'text/plain',
        language: 'en'
      })
    });

    const firstResult = await firstResponse.json();
    const firstProcessingTime = firstResult.processing_time_ms;

    // Second extraction of same content - should return cached result
    const secondResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_content: testDocument,
        document_type: 'text/plain',
        language: 'en'
      })
    });

    const secondResult = await secondResponse.json();
    const secondProcessingTime = secondResult.processing_time_ms;

    // Cached result should be significantly faster (<100ms vs potentially >1s)
    expect(secondProcessingTime).toBeLessThan(firstProcessingTime * 0.5);

    // Results should be identical
    expect(secondResult.decisions).toEqual(firstResult.decisions);
    expect(secondResult.commitments).toEqual(firstResult.commitments);
    expect(secondResult.risks).toEqual(firstResult.risks);

    // Verify cache header
    expect(secondResult).toHaveProperty('from_cache', true);
  });

  it('should support batch extraction for multiple documents', async () => {
    const documents = [
      {
        url: `${supabaseUrl}/storage/v1/object/public/test-documents/doc1.pdf`,
        type: 'application/pdf',
        language: 'en'
      },
      {
        url: `${supabaseUrl}/storage/v1/object/public/test-documents/doc2.pdf`,
        type: 'application/pdf',
        language: 'ar'
      },
      {
        url: `${supabaseUrl}/storage/v1/object/public/test-documents/doc3.pdf`,
        type: 'application/pdf',
        language: 'en'
      }
    ];

    // Submit batch extraction
    const batchResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/extract-batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documents,
        notification_config: {
          push_enabled: true,
          batch_completion_only: true // Only notify when entire batch completes
        }
      })
    });

    expect(batchResponse.status).toBe(202);

    const batchData = await batchResponse.json();
    expect(batchData).toHaveProperty('batch_id');
    expect(batchData).toHaveProperty('job_ids');
    expect(batchData.job_ids.length).toBe(3);

    // Poll batch status
    let allCompleted = false;
    let attempts = 0;

    while (!allCompleted && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`${supabaseUrl}/functions/v1/ai-extraction/batch-status/${batchData.batch_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const statusData = await statusResponse.json();
      allCompleted = statusData.completed_count === statusData.total_count;
      attempts++;
    }

    expect(allCompleted).toBe(true);

    // Verify single batch completion notification
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'ai_extraction_batch_complete')
      .eq('reference_id', batchData.batch_id)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(notifications?.length).toBe(1);

    const notification = notifications?.[0];
    expect(notification.data).toHaveProperty('total_documents', 3);
    expect(notification.data).toHaveProperty('successful_count');
    expect(notification.data).toHaveProperty('failed_count');
  }, 70000); // Longer timeout for batch processing
});
