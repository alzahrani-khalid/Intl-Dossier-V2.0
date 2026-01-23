/**
 * Unit Tests for Mutation Factory
 *
 * Tests auth handling, error handling, query invalidation,
 * URL building, and different HTTP methods.
 *
 * @module lib/mutation-factory.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMutation, mutationHelpers, type MutationConfig } from './mutation-factory';
import { supabase } from './supabase';
import React from 'react';

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    supabaseUrl: 'https://test.supabase.co',
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Mutation Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Authentication Handling', () => {
    it('should throw error when not authenticated', async () => {
      // Mock no session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Not authenticated');
    });

    it('should include auth token in request headers', async () => {
      const mockSession = {
        access_token: 'test-token-123',
        user: { id: 'user-1' },
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });
  });

  describe('URL Building', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should build URL with endpoint only', async () => {
      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/test-endpoint',
        expect.any(Object)
      );
    });

    it('should build URL with static query parameters', async () => {
      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: {
          endpoint: 'test-endpoint',
          queryParams: { dossierId: 'dossier-123', active: true },
        },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/test-endpoint?dossierId=dossier-123&active=true',
        expect.any(Object)
      );
    });

    it('should build URL with dynamic query parameters', async () => {
      const config: MutationConfig<{ parentId: string }, unknown> = {
        method: 'DELETE',
        url: {
          endpoint: 'test-endpoint',
          queryParams: (input) => ({ parentId: input.parentId }),
        },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ parentId: 'parent-456' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/test-endpoint?parentId=parent-456',
        expect.any(Object)
      );
    });

    it('should filter out undefined and null query parameters', async () => {
      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: {
          endpoint: 'test-endpoint',
          queryParams: {
            validParam: 'value',
            nullParam: null as any,
            undefinedParam: undefined
          },
        },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('validParam=value');
      expect(url).not.toContain('nullParam');
      expect(url).not.toContain('undefinedParam');
    });

    it('should use custom buildUrl function when provided', async () => {
      const config: MutationConfig<{ id: string }, unknown> = {
        method: 'PATCH',
        url: {
          endpoint: 'test-endpoint',
          buildUrl: (input) => `https://custom.api.com/resources/${input.id}`,
        },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'resource-789' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/resources/resource-789',
        expect.any(Object)
      );
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should send POST request with body', async () => {
      const config: MutationConfig<{ name: string; value: number }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      const input = { name: 'test', value: 42 };
      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        })
      );
    });

    it('should send DELETE request without body', async () => {
      const config: MutationConfig<{ id: string }, unknown> = {
        method: 'DELETE',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'item-123' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
          body: undefined,
        })
      );
    });

    it('should send PATCH request with body', async () => {
      const config: MutationConfig<{ id: string; status: string }, unknown> = {
        method: 'PATCH',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      const input = { id: 'item-123', status: 'active' };
      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(input),
        })
      );
    });

    it('should send PUT request with body', async () => {
      const config: MutationConfig<{ data: unknown }, unknown> = {
        method: 'PUT',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      const input = { data: { foo: 'bar' } };
      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(input),
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid input', message: 'Validation failed' }),
      });

      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Invalid input');
    });

    it('should use error.message if error.error is not present', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });

      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Internal server error');
    });

    it('should handle error when response.json() fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('JSON parse error');
        },
      });

      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Internal Server Error');
    });

    it('should use fallback error message when no error details available', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: '',
        json: async () => ({}),
      });

      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Failed to execute mutation');
    });
  });

  describe('Query Invalidation', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'result-123' }),
      });
    });

    it('should invalidate static query keys', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test'], ['related', 'data']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['test'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['related', 'data'] });
    });

    it('should invalidate dynamic query keys based on variables', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const config: MutationConfig<
        { parentId: string; childId: string },
        { id: string }
      > = {
        method: 'DELETE',
        url: { endpoint: 'test-endpoint' },
        invalidation: {
          queryKeys: (variables, response) => [
            ['relationships', variables.parentId],
            ['relationships', variables.childId],
            ['result', response.id],
          ],
        },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      result.current.mutate({ parentId: 'parent-1', childId: 'child-1' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['relationships', 'parent-1'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['relationships', 'child-1'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['result', 'result-123'],
      });
    });
  });

  describe('Custom Headers', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should merge static custom headers with default headers', async () => {
      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Request-ID': 'request-123',
        },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
            'X-Request-ID': 'request-123',
          }),
        })
      );
    });

    it('should use dynamic headers based on input', async () => {
      const config: MutationConfig<{ userId: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
        headers: (input) => ({
          'X-User-ID': input.userId,
        }),
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ userId: 'user-456' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-User-ID': 'user-456',
          }),
        })
      );
    });

    it('should allow custom headers to override default Content-Type', async () => {
      const config: MutationConfig<{ test: string }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });
  });

  describe('Request Body Transformation', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should send input as-is by default', async () => {
      const config: MutationConfig<{ name: string; value: number }, unknown> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      const input = { name: 'test', value: 42 };
      result.current.mutate(input);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(input),
        })
      );
    });

    it('should transform request body using custom function', async () => {
      const config: MutationConfig<
        { userId: string; items: string[] },
        unknown
      > = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
        transformBody: (input) => ({
          user_id: input.userId, // Transform to snake_case
          item_count: input.items.length,
          items: input.items,
        }),
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(() => useMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ userId: 'user-123', items: ['a', 'b', 'c'] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            user_id: 'user-123',
            item_count: 3,
            items: ['a', 'b', 'c'],
          }),
        })
      );
    });
  });

  describe('Custom onSuccess Callback', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'result-123', status: 'created' }),
      });
    });

    it('should call custom onSuccess after query invalidation', async () => {
      const onSuccessMock = vi.fn();

      const config: MutationConfig<{ test: string }, { id: string; status: string }> = {
        method: 'POST',
        url: { endpoint: 'test-endpoint' },
        invalidation: { queryKeys: [['test']] },
      };

      const useMutation = createMutation(config);
      const { result } = renderHook(
        () =>
          useMutation({
            onSuccess: onSuccessMock,
          }),
        {
          wrapper: createWrapper(),
        }
      );

      result.current.mutate({ test: 'data' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccessMock).toHaveBeenCalledWith(
        { id: 'result-123', status: 'created' },
        { test: 'data' }
      );
    });
  });

  describe('Mutation Helpers', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'token', user: { id: '1' } } },
        error: null,
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('should create POST mutation with helper', async () => {
      const useCreateResource = mutationHelpers.create<
        { name: string },
        unknown
      >('create-resource', [['resources']]);

      const { result } = renderHook(() => useCreateResource(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ name: 'test' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/create-resource',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      );
    });

    it('should create DELETE mutation with helper', async () => {
      const useDeleteResource = mutationHelpers.delete<
        { parentId: string; childId: string },
        unknown
      >(
        'delete-resource',
        (input) => ({
          parentId: input.parentId,
          childId: input.childId,
        }),
        (variables) => [
          ['resources', variables.parentId],
          ['resources', variables.childId],
        ]
      );

      const { result } = renderHook(() => useDeleteResource(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ parentId: 'p1', childId: 'c1' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/delete-resource?parentId=p1&childId=c1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should create PATCH mutation with helper', async () => {
      const useUpdateResource = mutationHelpers.update<
        { id: string; status: string },
        unknown
      >('update-resource', [['resources']]);

      const { result } = renderHook(() => useUpdateResource(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'r1', status: 'active' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/update-resource',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ id: 'r1', status: 'active' }),
        })
      );
    });
  });
});
