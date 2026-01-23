import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import {
  generateAccessReview,
  getAccessReviewDetail,
  certifyUserAccess,
  completeAccessReview,
  getInactiveUsers,
  scheduleAccessReview,
  type GenerateAccessReviewParams,
  type CertifyUserAccessParams,
  type CompleteAccessReviewParams,
  type ScheduleAccessReviewParams,
} from '@/services/user-management-api';

/**
 * Hook to generate a new access review
 *
 * @example
 * const { mutate: generateReview } = useGenerateAccessReview();
 * generateReview({
 *   review_name: 'Q1 2025 Review',
 *   review_scope: 'all_users'
 * });
 */
export function useGenerateAccessReview() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: generateAccessReview,
    onSuccess: () => {
      // Invalidate access reviews list
      queryClient.invalidateQueries({ queryKey: ['access-reviews'] });
    },
    meta: {
      successMessage: t('user_management.access_review_generated'),
      errorMessage: t('user_management.access_review_generate_failed'),
    },
  });
}

/**
 * Hook to fetch access review details including findings
 *
 * @param reviewId - The access review ID
 * @param findingType - Optional filter by finding type (inactive_users, excessive_permissions, etc.)
 */
export function useAccessReviewDetail(reviewId: string | null, findingType?: string) {
  return useQuery({
    queryKey: ['access-review-detail', reviewId, findingType],
    queryFn: () => {
      if (!reviewId) throw new Error('Review ID is required');
      return getAccessReviewDetail(reviewId, findingType);
    },
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to certify user access during review
 */
export function useCertifyUserAccess() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: certifyUserAccess,
    onSuccess: (_, variables) => {
      // Invalidate the specific review detail
      queryClient.invalidateQueries({
        queryKey: ['access-review-detail', variables.review_id]
      });
    },
    meta: {
      successMessage: t('user_management.user_access_certified'),
      errorMessage: t('user_management.certification_failed'),
    },
  });
}

/**
 * Hook to complete/finalize an access review
 */
export function useCompleteAccessReview() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: completeAccessReview,
    onSuccess: () => {
      // Invalidate all access reviews
      queryClient.invalidateQueries({ queryKey: ['access-reviews'] });
    },
    meta: {
      successMessage: t('user_management.access_review_completed'),
      errorMessage: t('user_management.review_completion_failed'),
    },
  });
}

/**
 * Hook to fetch inactive users (90+ days without login)
 *
 * @param daysThreshold - Number of days to consider inactive (default: 90)
 */
export function useInactiveUsers(daysThreshold: number = 90) {
  return useQuery({
    queryKey: ['inactive-users', daysThreshold],
    queryFn: () => getInactiveUsers(daysThreshold),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to schedule a new access review
 */
export function useScheduleAccessReview() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: scheduleAccessReview,
    onSuccess: () => {
      // Invalidate access reviews list
      queryClient.invalidateQueries({ queryKey: ['access-reviews'] });
    },
    meta: {
      successMessage: t('user_management.access_review_scheduled'),
      errorMessage: t('user_management.scheduling_failed'),
    },
  });
}

/**
 * Hook to list all access reviews
 *
 * @param status - Optional filter by review status (in_progress, completed)
 */
export function useAccessReviewsList(status?: 'in_progress' | 'completed') {
  return useQuery({
    queryKey: ['access-reviews', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_reviews')
        .select(`
          id,
          review_name,
          review_scope,
          reviewer_id,
          status,
          findings,
          review_date,
          completed_at,
          created_at,
          reviewer:users!reviewer_id (
            id,
            email,
            full_name
          )
        `)
        .order('review_date', { ascending: false });

      if (error) throw error;

      // Filter by status if provided
      if (status) {
        return data?.filter(review => review.status === status) || [];
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get access review summary statistics
 *
 * @param reviewId - The access review ID
 */
export function useAccessReviewSummary(reviewId: string | null) {
  const { data: reviewDetail } = useAccessReviewDetail(reviewId);

  return {
    totalFindings: reviewDetail?.findings?.length || 0,
    inactiveUsers: reviewDetail?.findings?.filter((f: any) =>
      f.issues?.includes('inactive_90_days')
    ).length || 0,
    excessivePermissions: reviewDetail?.findings?.filter((f: any) =>
      f.issues?.includes('excessive_permissions')
    ).length || 0,
    expiringGuests: reviewDetail?.findings?.filter((f: any) =>
      f.issues?.includes('guest_expiring_soon')
    ).length || 0,
    certifiedUsers: reviewDetail?.findings?.filter((f: any) =>
      f.certified_by && f.certified_at
    ).length || 0,
  };
}
