import { describe, it, expect } from '@jest/globals';
describe('POST /positions/{id}/consistency-check', () => {
  it('should return ConsistencyCheck response', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/positions-consistency-check`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({ position_id: 'test-id' }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('consistency_score');
    expect(data).toHaveProperty('conflicts');
    expect(data).toHaveProperty('ai_service_available');
  });
});
