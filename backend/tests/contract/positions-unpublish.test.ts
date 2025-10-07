import { describe, it, expect } from '@jest/globals';
describe('POST /positions/{id}/unpublish', () => {
  it('should change status from published', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/positions-unpublish`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({ position_id: 'published-id' }),
    });
    expect(response.status).toBe(200);
  });
});
