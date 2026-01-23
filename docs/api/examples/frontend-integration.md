# Frontend Integration Guide

## Overview

This guide covers frontend integration patterns for the Intl-Dossier Edge Functions API using TanStack Query (React Query), React 19+, and TypeScript. All examples follow mobile-first and RTL-aware design principles.

## Table of Contents

1. [TanStack Query Setup](#tanstack-query-setup)
2. [Query Patterns](#query-patterns)
3. [Mutation Patterns](#mutation-patterns)
4. [Infinite Queries](#infinite-queries)
5. [Real-time Integration](#real-time-integration)
6. [Mobile-First Patterns](#mobile-first-patterns)
7. [RTL & Internationalization](#rtl--internationalization)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)

---

## TanStack Query Setup

### Provider Configuration

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
          retry: 3,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: true,
          refetchOnReconnect: true
        },
        mutations: {
          retry: 1,
          retryDelay: 1000
        }
      }
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Custom Hook Base

```typescript
// lib/api/base.ts
import { supabase } from '@/lib/supabase';

export interface APIError {
  error: string;
  error_ar?: string;
  code?: string;
  details?: Record<string, any>;
}

export const invokeFunction = async <TResponse>(
  functionName: string,
  body?: Record<string, any>
): Promise<TResponse> => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body
  });

  if (error) {
    throw error;
  }

  return data as TResponse;
};
```

---

## Query Patterns

### Basic Query Hook

```typescript
// hooks/usePosition.ts
import { useQuery } from '@tanstack/react-query';
import { invokeFunction } from '@/lib/api/base';

interface Position {
  id: string;
  title_en: string;
  title_ar: string;
  status: string;
  created_at: string;
}

export const usePosition = (positionId: string) => {
  return useQuery({
    queryKey: ['positions', positionId],
    queryFn: () => invokeFunction<Position>('positions-get', {
      position_id: positionId
    }),
    enabled: !!positionId, // Only run if positionId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
};

// Usage in component
const PositionDetail = ({ id }: { id: string }) => {
  const { data: position, isLoading, error } = usePosition(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!position) return <div>Position not found</div>;

  return (
    <div>
      <h1>{position.title_en}</h1>
      <p>Status: {position.status}</p>
    </div>
  );
};
```

### Parameterized List Query

```typescript
// hooks/usePositions.ts
import { useQuery } from '@tanstack/react-query';
import { invokeFunction } from '@/lib/api/base';

interface PositionsFilters {
  status?: string;
  thematic_category?: string;
  search?: string;
}

interface PositionsResponse {
  data: Position[];
  total_count: number;
}

export const usePositions = (filters: PositionsFilters = {}) => {
  return useQuery({
    queryKey: ['positions', 'list', filters],
    queryFn: () => invokeFunction<PositionsResponse>('positions-list', {
      ...filters
    }),
    keepPreviousData: true, // Keep old data while fetching new
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

// Usage with filters
const PositionsList = () => {
  const [filters, setFilters] = useState<PositionsFilters>({
    status: 'published'
  });

  const { data, isLoading, isFetching } = usePositions(filters);

  return (
    <div>
      <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>

      {isFetching && <div>Updating...</div>}

      {data?.data.map(position => (
        <div key={position.id}>{position.title_en}</div>
      ))}
    </div>
  );
};
```

### Dependent Queries

```typescript
// hooks/usePositionWithMetadata.ts
import { useQuery } from '@tanstack/react-query';

export const usePositionWithMetadata = (positionId: string) => {
  // First query: Get position
  const positionQuery = useQuery({
    queryKey: ['positions', positionId],
    queryFn: () => invokeFunction<Position>('positions-get', {
      position_id: positionId
    }),
    enabled: !!positionId
  });

  // Second query: Get metadata (depends on first)
  const metadataQuery = useQuery({
    queryKey: ['positions', positionId, 'metadata'],
    queryFn: () => invokeFunction('positions-get-metadata', {
      position_id: positionId
    }),
    enabled: !!positionQuery.data, // Only run after position is loaded
  });

  return {
    position: positionQuery.data,
    metadata: metadataQuery.data,
    isLoading: positionQuery.isLoading || metadataQuery.isLoading,
    error: positionQuery.error || metadataQuery.error
  };
};
```

### Parallel Queries

```typescript
// hooks/useDashboardData.ts
import { useQueries } from '@tanstack/react-query';

export const useDashboardData = (userId: string) => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['work-items', 'summary'],
        queryFn: () => invokeFunction('unified-work-list', {
          action: 'summary'
        })
      },
      {
        queryKey: ['productivity', userId],
        queryFn: () => invokeFunction('unified-work-list', {
          action: 'metrics',
          user_id: userId
        })
      },
      {
        queryKey: ['notifications', userId],
        queryFn: () => invokeFunction('notifications-list', {
          user_id: userId,
          unread_only: true
        })
      }
    ]
  });

  return {
    summary: results[0].data,
    productivity: results[1].data,
    notifications: results[2].data,
    isLoading: results.some(r => r.isLoading),
    error: results.find(r => r.error)?.error
  };
};
```

---

## Mutation Patterns

### Basic Mutation

```typescript
// hooks/useCreatePosition.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunction } from '@/lib/api/base';

interface CreatePositionInput {
  position_type_id: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
}

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePositionInput) =>
      invokeFunction<Position>('positions-create', input),
    onSuccess: (newPosition) => {
      // Invalidate and refetch positions list
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });

      // Optionally set the new position in cache
      queryClient.setQueryData(['positions', newPosition.id], newPosition);
    },
    onError: (error) => {
      console.error('Failed to create position:', error);
    }
  });
};

// Usage in component
const CreatePositionForm = () => {
  const createPosition = useCreatePosition();

  const handleSubmit = async (formData: CreatePositionInput) => {
    try {
      const position = await createPosition.mutateAsync(formData);
      alert('Position created successfully!');
      // Navigate to position detail page
    } catch (error) {
      alert('Failed to create position');
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(/* form data */);
    }}>
      {/* Form fields */}
      <button type="submit" disabled={createPosition.isPending}>
        {createPosition.isPending ? 'Creating...' : 'Create Position'}
      </button>
    </form>
  );
};
```

### Optimistic Update

```typescript
// hooks/useUpdatePosition.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdatePositionInput {
  position_id: string;
  title_en?: string;
  title_ar?: string;
  status?: string;
}

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePositionInput) =>
      invokeFunction<Position>('positions-update', input),
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['positions', input.position_id]
      });

      // Snapshot previous value
      const previousPosition = queryClient.getQueryData<Position>([
        'positions',
        input.position_id
      ]);

      // Optimistically update
      if (previousPosition) {
        queryClient.setQueryData<Position>(
          ['positions', input.position_id],
          { ...previousPosition, ...input }
        );
      }

      // Return context with snapshot
      return { previousPosition };
    },
    onError: (err, input, context) => {
      // Rollback on error
      if (context?.previousPosition) {
        queryClient.setQueryData(
          ['positions', input.position_id],
          context.previousPosition
        );
      }
    },
    onSettled: (data, error, input) => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: ['positions', input.position_id]
      });
    }
  });
};
```

### File Upload Mutation

```typescript
// hooks/useUploadAttachment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface UploadAttachmentInput {
  file: File;
  entity_type: string;
  entity_id: string;
  filename: string;
}

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadAttachmentInput) => {
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('metadata', JSON.stringify({
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        filename: input.filename
      }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/attachments-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate attachments list for this entity
      queryClient.invalidateQueries({
        queryKey: ['attachments', variables.entity_type, variables.entity_id]
      });
    }
  });
};

// Usage with progress
const FileUploadComponent = ({ entityId }: { entityId: string }) => {
  const uploadAttachment = useUploadAttachment();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadAttachment.mutateAsync({
      file,
      entity_type: 'document',
      entity_id: entityId,
      filename: file.name
    });
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {uploadAttachment.isPending && <div>Uploading...</div>}
      {uploadAttachment.isError && (
        <div>Error: {uploadAttachment.error.message}</div>
      )}
      {uploadAttachment.isSuccess && <div>Upload successful!</div>}
    </div>
  );
};
```

---

## Infinite Queries

### Infinite Scroll Pattern

```typescript
// hooks/useInfiniteWorkItems.ts
import { useInfiniteQuery } from '@tanstack/react-query';

interface WorkItemsResponse {
  data: WorkItem[];
  cursor: {
    deadline: string;
    id: string;
  } | null;
  has_more: boolean;
}

export const useInfiniteWorkItems = (filters: any = {}) => {
  return useInfiniteQuery({
    queryKey: ['work-items', 'infinite', filters],
    queryFn: ({ pageParam }) =>
      invokeFunction<WorkItemsResponse>('unified-work-list', {
        action: 'list',
        ...filters,
        cursor_deadline: pageParam?.deadline,
        cursor_id: pageParam?.id,
        limit: 20
      }),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
    initialPageParam: undefined
  });
};

// Usage in component
const InfiniteWorkItemsList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteWorkItems();

  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.data.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      ))}

      {hasNextPage && (
        <div ref={loadMoreRef}>
          {isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </div>
      )}
    </div>
  );
};
```

### Load More Button Pattern

```typescript
// Alternative to infinite scroll
const LoadMoreWorkItemsList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteWorkItems();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.data.map(item => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

---

## Real-time Integration

### Query with Real-time Updates

```typescript
// hooks/usePositionRealtime.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const usePositionRealtime = (positionId: string) => {
  const queryClient = useQueryClient();

  // Standard query
  const query = useQuery({
    queryKey: ['positions', positionId],
    queryFn: () => invokeFunction<Position>('positions-get', {
      position_id: positionId
    }),
    enabled: !!positionId
  });

  // Real-time subscription
  useEffect(() => {
    if (!positionId) return;

    const channel = supabase
      .channel(`position-${positionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `id=eq.${positionId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            // Update cache with new data
            queryClient.setQueryData(
              ['positions', positionId],
              payload.new as Position
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove from cache
            queryClient.removeQueries({
              queryKey: ['positions', positionId]
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [positionId, queryClient]);

  return query;
};
```

### List with Real-time Updates

```typescript
// hooks/useWorkItemsRealtime.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useWorkItemsRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['work-items', 'list', userId],
    queryFn: () => invokeFunction('unified-work-list', {
      action: 'list'
    })
  });

  useEffect(() => {
    const channel = supabase
      .channel('work-items-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${userId}`
        },
        () => {
          // Invalidate to trigger refetch
          queryClient.invalidateQueries({
            queryKey: ['work-items', 'list', userId]
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['work-items', 'list', userId]
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, queryClient]);

  return query;
};
```

---

## Mobile-First Patterns

### Responsive Data Fetching

```typescript
// hooks/useResponsivePositions.ts
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const useResponsivePositions = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return useQuery({
    queryKey: ['positions', 'list', { limit: isMobile ? 10 : 20 }],
    queryFn: () => invokeFunction('positions-list', {
      limit: isMobile ? 10 : 20 // Load fewer items on mobile
    }),
    staleTime: isMobile ? 1 * 60 * 1000 : 5 * 60 * 1000, // Shorter stale time on mobile
    refetchOnWindowFocus: !isMobile // Don't refetch on mobile focus
  });
};
```

### Offline-First Pattern

```typescript
// hooks/useOfflineFirst.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetworkState } from '@/hooks/useNetworkState';

export const useOfflineFirstWorkItems = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkState();

  const query = useQuery({
    queryKey: ['work-items', 'offline'],
    queryFn: () => invokeFunction('unified-work-list', {
      action: 'list'
    }),
    enabled: isOnline,
    gcTime: Infinity, // Keep cached data forever
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity
  });

  const mutation = useMutation({
    mutationFn: (input: any) => invokeFunction('work-items-update', input),
    onMutate: async (input) => {
      // Always update cache optimistically
      const previous = queryClient.getQueryData(['work-items', 'offline']);

      queryClient.setQueryData(['work-items', 'offline'], (old: any) => {
        // Update local cache
        return { ...old, ...input };
      });

      return { previous };
    },
    // Only sync when online
    retry: !isOnline ? false : 3
  });

  return { query, mutation };
};
```

---

## RTL & Internationalization

### Language-Aware Queries

```typescript
// hooks/usePositionI18n.ts
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const usePositionI18n = (positionId: string) => {
  const { i18n } = useTranslation();

  return useQuery({
    queryKey: ['positions', positionId, i18n.language],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('positions-get', {
        body: { position_id: positionId },
        headers: {
          'Accept-Language': i18n.language
        }
      });

      if (error) throw error;
      return data as Position;
    },
    // Refetch when language changes
    enabled: !!positionId,
    select: (data) => ({
      ...data,
      // Return appropriate language field
      title: i18n.language === 'ar' ? data.title_ar : data.title_en,
      content: i18n.language === 'ar' ? data.content_ar : data.content_en
    })
  });
};

// Usage in component
const PositionDetailI18n = ({ id }: { id: string }) => {
  const { i18n } = useTranslation();
  const { data: position } = usePositionI18n(id);

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-start">{position?.title}</h1>
      <p className="text-start">{position?.content}</p>
    </div>
  );
};
```

### RTL-Aware Error Messages

```typescript
// lib/api/errors.ts
import { useTranslation } from 'react-i18next';

export const useAPIErrorHandler = () => {
  const { i18n } = useTranslation();

  return (error: any) => {
    const isRTL = i18n.language === 'ar';

    const message = isRTL && error.error_ar
      ? error.error_ar
      : error.error || 'An error occurred';

    return {
      message,
      direction: isRTL ? 'rtl' : 'ltr'
    };
  };
};

// Usage
const PositionComponent = () => {
  const { data, error } = usePosition('id');
  const handleError = useAPIErrorHandler();

  if (error) {
    const { message, direction } = handleError(error);
    return (
      <div dir={direction} className="text-start text-red-600">
        {message}
      </div>
    );
  }

  return <div>{data?.title_en}</div>;
};
```

---

## Error Handling

### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div role="alert" className="p-4 border border-red-500 rounded">
      <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
      <pre className="mt-2 text-sm">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
};

export const QueryErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary onReset={reset} FallbackComponent={ErrorFallback}>
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
```

### Custom Error Hook

```typescript
// hooks/useQueryError.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useQueryError = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        const error = event.action.error as any;
        toast.error(error.message || 'An error occurred');
      }
    });

    return unsubscribe;
  }, [queryClient]);
};
```

---

## Performance Optimization

### Prefetching Data

```typescript
// hooks/usePrefetchPosition.ts
import { useQueryClient } from '@tanstack/react-query';

export const usePrefetchPosition = () => {
  const queryClient = useQueryClient();

  return (positionId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['positions', positionId],
      queryFn: () => invokeFunction('positions-get', {
        position_id: positionId
      }),
      staleTime: 5 * 60 * 1000
    });
  };
};

// Usage in list component
const PositionListItem = ({ position }: { position: Position }) => {
  const prefetchPosition = usePrefetchPosition();

  return (
    <Link
      to={`/positions/${position.id}`}
      onMouseEnter={() => prefetchPosition(position.id)}
    >
      {position.title_en}
    </Link>
  );
};
```

### Selective Rendering

```typescript
// hooks/usePositionField.ts
import { useQuery } from '@tanstack/react-query';

export const usePositionTitle = (positionId: string) => {
  return useQuery({
    queryKey: ['positions', positionId],
    queryFn: () => invokeFunction('positions-get', {
      position_id: positionId
    }),
    select: (data) => data.title_en, // Only re-render when title changes
    enabled: !!positionId
  });
};
```

### Debounced Queries

```typescript
// hooks/useDebounced.ts
import { useEffect, useState } from 'react';

export const useDebouncedValue = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Usage with search
const SearchPositions = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data } = useQuery({
    queryKey: ['positions', 'search', debouncedSearch],
    queryFn: () => invokeFunction('search-positions', {
      query: debouncedSearch
    }),
    enabled: debouncedSearch.length > 2
  });

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search positions..."
    />
  );
};
```

---

## Related Documentation

- [TypeScript Examples](./typescript-examples.md) - Basic API integration examples
- [Authentication API](../authentication.md) - Auth setup details
- [Unified Work Management](../unified-work-management.md) - Work items API
- [Edge Functions Reference](../edge-functions-reference.md) - Complete API reference
- [Mobile-First Guidelines](../../CLAUDE.md#mobile-first--responsive-design-mandatory) - Mobile patterns
- [RTL Support Guidelines](../../CLAUDE.md#arabic-rtl-support-guidelines-mandatory) - RTL patterns
