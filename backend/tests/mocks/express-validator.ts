import { vi } from 'vitest';

// Provide a mockable validationResult for tests that can be configured with
// validationResult.mockReturnValue({ isEmpty: () => boolean, array: () => any[] })
export const validationResult = vi.fn();

// Also export commonly used stubs if needed by other tests in future
export const body = vi.fn();
export const query = vi.fn();
export const param = vi.fn();
export const checkSchema = vi.fn();

export default {
  validationResult,
  body,
  query,
  param,
  checkSchema,
};

