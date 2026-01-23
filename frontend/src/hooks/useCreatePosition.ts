/**
 * Create Position Hook
 * @module hooks/useCreatePosition
 * @feature position-management
 *
 * TanStack Query mutation hook for creating new position documents with automatic
 * cache invalidation.
 *
 * @description
 * This module provides a React hook for creating position documents:
 * - Mutation hook for creating new positions via edge function
 * - Automatic cache invalidation of position lists on success
 * - Error handling with descriptive messages
 * - Type-safe request/response using Position types
 * - Authentication token management
 *
 * @example
 * // Create a new position
 * const { mutate: createPosition, isPending } = useCreatePosition();
 * createPosition({
 *   title_en: 'Climate Policy',
 *   title_ar: 'سياسة المناخ',
 *   content_en: 'Policy content...',
 *   content_ar: 'محتوى السياسة...',
 *   type: 'policy',
 *   status: 'draft',
 * });
 *
 * @example
 * // Handle loading and error states
 * const { mutate, isPending, isError, error } = useCreatePosition();
 * if (isPending) return <Spinner />;
 * if (isError) return <ErrorAlert message={error.message} />;
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CreatePositionRequest, Position } from '../types/position';

// API base URL
const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

/**
 * Helper to get authentication headers for API requests
 *
 * @private
 * @returns Promise resolving to headers object with auth token
 * @throws Error if session is not available
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  };
};

/**
 * Hook to create a new position
 *
 * @description
 * Creates a new position document via the positions-create edge function.
 * Automatically invalidates the positions list query on success to reflect
 * the new position. Handles authentication and error responses gracefully.
 *
 * @returns TanStack Mutation result with mutate function accepting CreatePositionRequest
 *
 * @example
 * const { mutate: createPosition, isPending, isError } = useCreatePosition();
 *
 * // Create a policy position
 * createPosition({
 *   title_en: 'Climate Action Policy',
 *   title_ar: 'سياسة العمل المناخي',
 *   content_en: 'We support comprehensive climate action...',
 *   content_ar: 'نحن ندعم العمل المناخي الشامل...',
 *   type: 'policy',
 *   status: 'draft',
 *   thematic_category: 'environment',
 *   primary_language: 'en',
 * });
 *
 * @example
 * // Create with form data
 * const { mutate, isPending } = useCreatePosition();
 *
 * const handleSubmit = (formData) => {
 *   mutate({
 *     title_en: formData.titleEn,
 *     title_ar: formData.titleAr,
 *     content_en: formData.contentEn,
 *     content_ar: formData.contentAr,
 *     type: formData.type,
 *     status: 'draft',
 *   });
 * };
 *
 * @example
 * // Handle success with callback
 * const navigate = useNavigate();
 * const { mutate } = useCreatePosition();
 *
 * const handleCreate = () => {
 *   mutate(positionData, {
 *     onSuccess: (newPosition) => {
 *       toast.success('Position created successfully');
 *       navigate(`/positions/${newPosition.id}`);
 *     },
 *     onError: (error) => {
 *       toast.error(`Failed to create: ${error.message}`);
 *     },
 *   });
 * };
 */
export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePositionRequest): Promise<Position> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/positions-create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to create position: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate positions list to refetch with new position
      queryClient.invalidateQueries({ queryKey: ['positions', 'list'] });
    },
  });
};
