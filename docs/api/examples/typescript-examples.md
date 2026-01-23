# TypeScript/JavaScript Usage Examples

## Overview

This guide provides practical TypeScript/JavaScript examples for integrating with the Intl-Dossier Edge Functions API. All examples use modern TypeScript with proper type safety and error handling.

## Table of Contents

1. [Authentication Setup](#authentication-setup)
2. [Error Handling](#error-handling)
3. [Pagination](#pagination)
4. [File Uploads](#file-uploads)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Common Patterns](#common-patterns)

---

## Authentication Setup

### Basic Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
```

### Email/Password Authentication

```typescript
// Sign up new user
const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Sign in existing user
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Sign out
const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};
```

### MFA (Multi-Factor Authentication)

```typescript
// Enroll in MFA
const enrollMFA = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });

  if (error) {
    throw new Error(error.message);
  }

  // data contains: id, qr_code, secret, uri
  return {
    factorId: data.id,
    qrCode: data.qr_code,
    secret: data.secret
  };
};

// Verify MFA code
const verifyMFA = async (factorId: string, code: string) => {
  const challenge = await supabase.auth.mfa.challenge({
    factorId
  });

  if (challenge.error) {
    throw new Error(challenge.error.message);
  }

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
```

### Getting the Current User

```typescript
// Get current session
const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
};

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

---

## Error Handling

### Basic Error Handling Pattern

```typescript
interface APIError {
  error: string;
  error_ar?: string;
  code?: string;
  details?: Record<string, any>;
}

const handleAPIError = (error: APIError, language: 'en' | 'ar' = 'en') => {
  // Use Arabic error message if available and language is Arabic
  const message = language === 'ar' && error.error_ar
    ? error.error_ar
    : error.error;

  console.error('API Error:', {
    message,
    code: error.code,
    details: error.details
  });

  return message;
};
```

### Typed API Call with Error Handling

```typescript
interface Position {
  id: string;
  title_en: string;
  title_ar: string;
  status: string;
  created_at: string;
}

const fetchPosition = async (positionId: string): Promise<Position> => {
  try {
    const { data, error } = await supabase.functions.invoke('positions-get', {
      body: { position_id: positionId }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Position not found');
    }

    return data as Position;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to fetch position:', error.message);
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
};
```

### Retry Logic for Failed Requests

```typescript
const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxAttempts) {
        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
};

// Usage
const position = await retry(() => fetchPosition('position-id'));
```

### Rate Limit Handling

```typescript
const callAPIWithRateLimitHandling = async (
  functionName: string,
  body: Record<string, any>
) => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: any) {
    // Check if rate limited (429 status)
    if (error.status === 429 || error.message?.includes('rate limit')) {
      const retryAfter = error.context?.retryAfter || 60; // Default 60 seconds

      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);

      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

      return callAPIWithRateLimitHandling(functionName, body);
    }

    throw error;
  }
};
```

---

## Pagination

### Cursor-Based Pagination (Recommended)

```typescript
interface WorkItem {
  id: string;
  title: string;
  deadline: string;
  priority: string;
  status: string;
}

interface PaginatedResponse<T> {
  data: T[];
  cursor: {
    deadline: string;
    id: string;
  } | null;
  has_more: boolean;
}

const fetchWorkItemsPage = async (
  cursor?: { deadline: string; id: string },
  limit: number = 20
): Promise<PaginatedResponse<WorkItem>> => {
  const { data, error } = await supabase.functions.invoke('unified-work-list', {
    body: {
      action: 'list',
      cursor_deadline: cursor?.deadline,
      cursor_id: cursor?.id,
      limit
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as PaginatedResponse<WorkItem>;
};

// Fetch all pages
const fetchAllWorkItems = async (): Promise<WorkItem[]> => {
  const allItems: WorkItem[] = [];
  let cursor: { deadline: string; id: string } | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchWorkItemsPage(cursor);
    allItems.push(...response.data);

    hasMore = response.has_more;
    cursor = response.cursor || undefined;
  }

  return allItems;
};

// Infinite scroll pattern
const useInfiniteWorkItems = () => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [cursor, setCursor] = useState<{ deadline: string; id: string } | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchWorkItemsPage(cursor);
      setItems(prev => [...prev, ...response.data]);
      setCursor(response.cursor || undefined);
      setHasMore(response.has_more);
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setLoading(false);
    }
  };

  return { items, loadMore, hasMore, loading };
};
```

### Offset-Based Pagination (Legacy)

```typescript
interface OffsetPaginatedResponse<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
}

const fetchPositionsPage = async (
  page: number = 1,
  pageSize: number = 20
): Promise<OffsetPaginatedResponse<Position>> => {
  const { data, error } = await supabase.functions.invoke('positions-list', {
    body: {
      page,
      page_size: pageSize
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as OffsetPaginatedResponse<Position>;
};
```

---

## File Uploads

### Single File Upload

```typescript
interface UploadAttachmentRequest {
  file: File;
  entityType: 'document' | 'position' | 'engagement';
  entityId: string;
  filename: string;
  filename_ar?: string;
  description?: string;
  description_ar?: string;
  tags?: string[];
  visibility?: 'private' | 'organization' | 'public';
}

interface Attachment {
  id: string;
  filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  checksum: string;
  virus_scan_status: 'pending' | 'clean' | 'infected';
  created_at: string;
}

const uploadAttachment = async (
  request: UploadAttachmentRequest
): Promise<Attachment> => {
  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('file', request.file);
  formData.append('metadata', JSON.stringify({
    entity_type: request.entityType,
    entity_id: request.entityId,
    filename: request.filename,
    filename_ar: request.filename_ar,
    description: request.description,
    description_ar: request.description_ar,
    tags: request.tags,
    visibility: request.visibility
  }));

  // Use fetch directly for FormData
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/attachments-upload`,
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

  return await response.json() as Attachment;
};
```

### Multiple File Upload with Progress

```typescript
interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

const uploadMultipleAttachments = async (
  files: File[],
  entityType: string,
  entityId: string,
  onProgress?: (progress: UploadProgress[]) => void
): Promise<Attachment[]> => {
  const progressMap = new Map<string, UploadProgress>(
    files.map(file => [
      file.name,
      { fileName: file.name, progress: 0, status: 'pending' }
    ])
  );

  const updateProgress = () => {
    if (onProgress) {
      onProgress(Array.from(progressMap.values()));
    }
  };

  const uploadResults = await Promise.allSettled(
    files.map(async (file) => {
      try {
        progressMap.set(file.name, {
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        });
        updateProgress();

        const result = await uploadAttachment({
          file,
          entityType: entityType as any,
          entityId,
          filename: file.name
        });

        progressMap.set(file.name, {
          fileName: file.name,
          progress: 100,
          status: 'completed'
        });
        updateProgress();

        return result;
      } catch (error) {
        progressMap.set(file.name, {
          fileName: file.name,
          progress: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
        updateProgress();

        throw error;
      }
    })
  );

  // Return successfully uploaded attachments
  return uploadResults
    .filter((result): result is PromiseFulfilledResult<Attachment> =>
      result.status === 'fulfilled'
    )
    .map(result => result.value);
};
```

### File Download

```typescript
const downloadAttachment = async (attachmentId: string): Promise<Blob> => {
  const { data, error } = await supabase.functions.invoke('attachments-download', {
    body: { attachment_id: attachmentId }
  });

  if (error) {
    throw new Error(error.message);
  }

  // Get presigned URL
  const presignedUrl = data.download_url;

  // Download file
  const response = await fetch(presignedUrl);

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  return await response.blob();
};

// Download and trigger browser download
const downloadAttachmentToDevice = async (
  attachmentId: string,
  filename: string
) => {
  const blob = await downloadAttachment(attachmentId);

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
```

---

## Real-time Subscriptions

### Subscribe to Table Changes

```typescript
import { RealtimeChannel } from '@supabase/supabase-js';

// Subscribe to position changes
const subscribeToPosition = (
  positionId: string,
  onUpdate: (position: Position) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`position-${positionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'positions',
        filter: `id=eq.${positionId}`
      },
      (payload) => {
        console.log('Position updated:', payload.new);
        onUpdate(payload.new as Position);
      }
    )
    .subscribe();

  return channel;
};

// Cleanup subscription
const unsubscribe = (channel: RealtimeChannel) => {
  channel.unsubscribe();
};

// Usage in React component
const PositionView = ({ positionId }: { positionId: string }) => {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    // Initial load
    fetchPosition(positionId).then(setPosition);

    // Subscribe to updates
    const channel = subscribeToPosition(positionId, (updatedPosition) => {
      setPosition(updatedPosition);
    });

    // Cleanup
    return () => {
      unsubscribe(channel);
    };
  }, [positionId]);

  return <div>{position?.title_en}</div>;
};
```

### Subscribe to Multiple Events

```typescript
const subscribeToWorkItems = (
  userId: string,
  callbacks: {
    onInsert?: (item: WorkItem) => void;
    onUpdate?: (item: WorkItem) => void;
    onDelete?: (itemId: string) => void;
  }
): RealtimeChannel => {
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
      (payload) => {
        callbacks.onInsert?.(payload.new as WorkItem);
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
      (payload) => {
        callbacks.onUpdate?.(payload.new as WorkItem);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'tasks',
        filter: `assignee_id=eq.${userId}`
      },
      (payload) => {
        callbacks.onDelete?.(payload.old.id);
      }
    )
    .subscribe();

  return channel;
};
```

### Presence (User Online Status)

```typescript
interface PresenceState {
  user_id: string;
  online_at: string;
  status: 'online' | 'away' | 'busy';
}

const trackPresence = (userId: string, status: 'online' | 'away' | 'busy') => {
  const channel = supabase.channel('online-users');

  // Track this user's presence
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>();
      console.log('Online users:', Object.keys(state).length);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('Users joined:', newPresences);
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('Users left:', leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          status
        });
      }
    });

  return channel;
};
```

### Broadcast (Send Messages)

```typescript
interface ChatMessage {
  user_id: string;
  message: string;
  sent_at: string;
}

const setupChatChannel = (roomId: string) => {
  const channel = supabase.channel(`chat-${roomId}`);

  // Listen for messages
  channel
    .on('broadcast', { event: 'message' }, ({ payload }) => {
      const message = payload as ChatMessage;
      console.log('New message:', message);
    })
    .subscribe();

  // Send message
  const sendMessage = async (userId: string, message: string) => {
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        user_id: userId,
        message,
        sent_at: new Date().toISOString()
      }
    });
  };

  return { channel, sendMessage };
};
```

---

## Common Patterns

### Debounced Search

```typescript
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Usage for search
const searchPositions = async (query: string) => {
  const { data, error } = await supabase.functions.invoke('search-positions', {
    body: { query }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const debouncedSearch = debounce(searchPositions, 300);

// In React component
const SearchComponent = () => {
  const [results, setResults] = useState([]);

  const handleSearch = (query: string) => {
    debouncedSearch(query).then(setResults);
  };

  return (
    <input
      type="text"
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search positions..."
    />
  );
};
```

### Optimistic Updates

```typescript
const updatePositionWithOptimisticUI = async (
  positionId: string,
  updates: Partial<Position>,
  onOptimisticUpdate: (position: Position) => void,
  onRollback: (originalPosition: Position) => void
) => {
  // Store original state
  const originalPosition = await fetchPosition(positionId);

  // Apply optimistic update immediately
  onOptimisticUpdate({ ...originalPosition, ...updates });

  try {
    // Make actual API call
    const { data, error } = await supabase.functions.invoke('positions-update', {
      body: {
        position_id: positionId,
        ...updates
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    // Return actual result
    return data as Position;
  } catch (error) {
    // Rollback on error
    onRollback(originalPosition);
    throw error;
  }
};
```

### Batch Operations

```typescript
const batchCreatePositions = async (
  positions: Array<Partial<Position>>
): Promise<Position[]> => {
  const results = await Promise.allSettled(
    positions.map(position =>
      supabase.functions.invoke('positions-create', {
        body: position
      })
    )
  );

  const successful: Position[] = [];
  const failed: Array<{ position: Partial<Position>; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value.data);
    } else {
      failed.push({
        position: positions[index],
        error: result.reason.message
      });
    }
  });

  if (failed.length > 0) {
    console.error('Some positions failed to create:', failed);
  }

  return successful;
};
```

### Bilingual Request Handling

```typescript
const createBilingualPosition = async (
  titleEn: string,
  titleAr: string,
  contentEn: string,
  contentAr: string,
  language: 'en' | 'ar' = 'en'
) => {
  try {
    const { data, error } = await supabase.functions.invoke('positions-create', {
      body: {
        title_en: titleEn,
        title_ar: titleAr,
        content_en: contentEn,
        content_ar: contentAr,
        position_type_id: 'some-type-id'
      },
      headers: {
        'Accept-Language': language
      }
    });

    if (error) {
      // Error messages will be in the requested language
      const errorMessage = language === 'ar' && error.error_ar
        ? error.error_ar
        : error.error;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Failed to create position:', error);
    throw error;
  }
};
```

---

## Related Documentation

- [Frontend Integration Guide](./frontend-integration.md) - TanStack Query patterns
- [Authentication API](../authentication.md) - MFA and auth details
- [Unified Work Management](../unified-work-management.md) - Pagination examples
- [Attachments API](../categories/attachments.md) - File upload details
- [Edge Functions Reference](../edge-functions-reference.md) - Complete API reference
