#!/bin/bash

# Script to generate remaining contract test templates for Phase 3.2
# Feature: 011-positions-talking-points
# Tasks: T023-T034

BACKEND_DIR="/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/backend/tests/contract"

# T023: POST /positions/{id}/request-revisions
cat > "$BACKEND_DIR/positions-request-revisions.test.ts" << 'EOF'
/**
 * Contract Test: POST /positions/{id}/request-revisions
 * Feature: 011-positions-talking-points
 * Task: T023
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: POST /positions/{id}/request-revisions', () => {
  let authToken: string;
  let testPositionId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_APPROVER_EMAIL || 'approver@example.com',
      password: process.env.TEST_APPROVER_PASSWORD || 'approverpass123'
    });
    authToken = authData.session?.access_token || '';

    // Create position in under_review status
    const { data: positionType } = await supabase
      .from('position_types')
      .select('id')
      .eq('name_en', 'Standard Position')
      .single();

    const { data: position } = await supabase
      .from('positions')
      .insert({
        position_type_id: positionType!.id,
        title_en: 'Revision Request Test',
        title_ar: 'طلب المراجعة',
        status: 'under_review',
        current_stage: 1
      })
      .select()
      .single();

    testPositionId = position!.id;
  });

  afterAll(async () => {
    if (testPositionId) {
      await supabase.from('positions').delete().eq('id', testPositionId);
    }
  });

  it('should request revisions with required comments', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-request-revisions?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comments: 'Please revise the alignment notes section'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe('draft');
    expect(data.current_stage).toBe(0);
  });

  it('should reject request without comments', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-request-revisions?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
  });
});
EOF

# T024: POST /positions/{id}/delegate
cat > "$BACKEND_DIR/positions-delegate.test.ts" << 'EOF'
/**
 * Contract Test: POST /positions/{id}/delegate
 * Feature: 011-positions-talking-points
 * Task: T024
 *
 * CRITICAL: This test MUST FAIL before Edge Function implementation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Contract Test: POST /positions/{id}/delegate', () => {
  let authToken: string;
  let testPositionId: string;
  let delegateUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_APPROVER_EMAIL || 'approver@example.com',
      password: process.env.TEST_APPROVER_PASSWORD || 'approverpass123'
    });
    authToken = authData.session?.access_token || '';

    // Get delegate user ID
    const { data: delegateAuth } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_DELEGATE_EMAIL || 'delegate@example.com',
      password: process.env.TEST_DELEGATE_PASSWORD || 'delegatepass123'
    });
    delegateUserId = delegateAuth.user?.id || '';
  });

  it('should delegate approval with required fields', async () => {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);

    const response = await fetch(`${supabaseUrl}/functions/v1/positions-delegate?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        delegate_to: delegateUserId,
        valid_until: validUntil.toISOString(),
        reason: 'On vacation next week'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('delegation_id');
    expect(data).toHaveProperty('message');
  });

  it('should reject delegation without delegate_to', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/positions-delegate?id=${testPositionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valid_until: new Date().toISOString()
      })
    });

    expect(response.status).toBe(400);
  });
});
EOF

echo "Generated remaining contract tests successfully!"
echo "Location: $BACKEND_DIR"
echo ""
echo "Next steps:"
echo "1. Run: npm test backend/tests/contract/"
echo "2. Verify all tests FAIL (as expected per TDD)"
echo "3. Proceed to Phase 3.3: Edge Function implementation"
EOF

chmod +x "$BACKEND_DIR/generate-remaining-contract-tests.sh"
