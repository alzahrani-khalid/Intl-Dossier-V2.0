import { describe, it, expect } from '@jest/globals';
describe('POST /positions/{id}/attachments', () => {
  it('should return 413 for files >50MB', async () => {
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/attachments-upload`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer mock-token' },
      body: JSON.stringify({ position_id: 'test-id', file_size: 52428801 }),
    });
    expect(response.status).toBe(413);
  });
});
