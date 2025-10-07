import { describe, it, expect } from '@jest/globals';
describe('DELETE /attachments/{id}', () => {
  it('should return 204 on success', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/attachments-delete`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({ attachment_id: 'test-id' }),
    });
    expect(response.status).toBe(204);
  });
});
