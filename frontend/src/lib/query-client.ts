/**
 * TanStack Query Client Configuration
 *
 * Provides global configuration for React Query with error handling,
 * retry logic, and caching strategies optimized for user management.
 *
 * Feature: 019-user-management-access
 * Task: T020
 *
 * @module lib/query-client
 */

import { QueryClient, QueryClientConfig } from '@tanstack/react-query';
import { toast } from 'sonner'; // or your preferred toast library

/**
 * Default query options
 */
const defaultQueryOptions: QueryClientConfig['defaultOptions'] = {
  queries: {
    // Stale time: 5 minutes (data is considered fresh for 5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: 10 minutes (unused data is garbage collected after 10 minutes)
    gcTime: 10 * 60 * 1000,

    // Retry failed requests with exponential backoff
    retry: (failureCount, error: unknown) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus for critical data
    refetchOnWindowFocus: false,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Don't refetch on mount if data is still fresh
    refetchOnMount: false,
  },

  mutations: {
    // Retry mutations once on failure
    retry: 1,

    // Global mutation error handler
    onError: (error) => {
      console.error('Mutation error:', error);

      // Extract error message
      let errorMessage = 'An unexpected error occurred';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        }
      }

      // Show error toast
      toast.error(errorMessage);
    },

    // Global mutation success handler
    onSuccess: () => {
      // Default success toast (can be overridden per mutation)
      toast.success('Operation completed successfully');
    },
  },
};

/**
 * Create Query Client instance
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Query keys for user management
 *
 * Centralized query key factory for consistency and easy invalidation.
 */
export const queryKeys = {
  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    permissions: (userId: string) => [...queryKeys.users.all, 'permissions', userId] as const,
  },

  // Role queries
  roles: {
    all: ['roles'] as const,
    approvals: () => [...queryKeys.roles.all, 'approvals'] as const,
  },

  // Delegation queries
  delegations: {
    all: ['delegations'] as const,
    my: () => [...queryKeys.delegations.all, 'my'] as const,
    granted: () => [...queryKeys.delegations.my(), 'granted'] as const,
    received: () => [...queryKeys.delegations.my(), 'received'] as const,
    detail: (id: string) => [...queryKeys.delegations.all, 'detail', id] as const,
  },

  // Access review queries
  accessReviews: {
    all: ['access-reviews'] as const,
    lists: () => [...queryKeys.accessReviews.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.accessReviews.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.accessReviews.all, 'detail', id] as const,
    inactiveUsers: () => [...queryKeys.accessReviews.all, 'inactive-users'] as const,
  },

  // Notification queries
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },

  // Session queries
  sessions: {
    all: ['sessions'] as const,
    my: () => [...queryKeys.sessions.all, 'my'] as const,
  },

  // Audit log queries
  auditLogs: {
    all: ['audit-logs'] as const,
    user: (userId: string) => [...queryKeys.auditLogs.all, 'user', userId] as const,
  },
};

/**
 * Utility function to invalidate related queries after mutations
 */
export const invalidateQueries = {
  /**
   * Invalidate all user-related queries
   */
  users: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },

  /**
   * Invalidate specific user details
   */
  userDetail: async (userId: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
  },

  /**
   * Invalidate user permissions
   */
  userPermissions: async (userId: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.permissions(userId) });
  },

  /**
   * Invalidate all delegation queries
   */
  delegations: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all });
  },

  /**
   * Invalidate role approvals
   */
  roleApprovals: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.roles.approvals() });
  },

  /**
   * Invalidate access reviews
   */
  accessReviews: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.accessReviews.all });
  },

  /**
   * Invalidate notifications
   */
  notifications: async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  },

  /**
   * Invalidate audit logs
   */
  auditLogs: async (userId?: string) => {
    if (userId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.user(userId) });
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs.all });
    }
  },
};

/**
 * HTTP client error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    message?: string
  ) {
    super(message || error);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response data
 */
export async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: response.statusText,
      message: 'Request failed',
    }));

    throw new ApiError(
      response.status,
      errorData.error || response.statusText,
      errorData.message
    );
  }

  return response.json();
}

/**
 * Prefetch user list
 *
 * Useful for pre-loading data on page navigation
 */
export async function prefetchUserList(filters?: unknown): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchApi(`/api/users?${new URLSearchParams(filters as Record<string, string>)}`),
  });
}

/**
 * Prefetch user details
 */
export async function prefetchUserDetail(userId: string): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => fetchApi(`/api/users/${userId}`),
  });
}

/**
 * Set query data manually (optimistic updates)
 */
export function setQueryData<T>(queryKey: unknown[], data: T): void {
  queryClient.setQueryData(queryKey, data);
}

/**
 * Get query data
 */
export function getQueryData<T>(queryKey: unknown[]): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}
