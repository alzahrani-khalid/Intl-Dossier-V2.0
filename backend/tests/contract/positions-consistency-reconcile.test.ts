import { describe, it, expect } from '@jest/globals';
describe('PUT /positions/{id}/consistency-check/{check_id}/reconcile', () => {
  it('should reconcile conflicts', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/positions-consistency-reconcile`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({
        position_id: 'test-id',
        check_id: 'check-id',
        resolved_conflicts: [],
      }),
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('updated_score');
  });
});
