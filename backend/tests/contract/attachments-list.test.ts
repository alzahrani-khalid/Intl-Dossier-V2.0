import { describe, it, expect } from '@jest/globals';
describe('GET /positions/{id}/attachments', () => {
  it('should return array of attachments', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/attachments-list?position_id=test-id`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer mock-token' },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.attachments)).toBe(true);
  });
});
