import { describe, it, expect } from '@jest/globals';

/**
 * Contract Test: POST /positions/{id}/publish
 * This test MUST FAIL initially (endpoint not yet implemented).
 */

describe('POST /positions/{id}/publish - Contract Test', () => {
  it('should return 400 if position not approved', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/positions-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({ position_id: 'test-id' }),
    });
    expect(response.status).toBe(400);
  });

  it('should change status to published', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/positions-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({ position_id: 'approved-position-id' }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('published');
  });
});
