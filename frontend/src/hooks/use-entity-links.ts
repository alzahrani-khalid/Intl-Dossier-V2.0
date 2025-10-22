/**
 * Entity Links Hook
 * Feature: 024-intake-entity-linking
 * Task: T043
 *
 * TanStack Query hook for intake entity link CRUD operations
 * with optimistic updates for <50ms perceived latency
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { intakeEntityLinksAPI, type EntityLinksAPIError } from '@/services/entity-links-api';
import type {
  EntityLink,
  CreateLinkRequest,
  UpdateLinkRequest,
} from '../../../backend/src/types/intake-entity-links.types';
import { useToast } from './use-toast';

/**
 * Query keys for cache management
 */
export const entityLinksKeys = {
  all: ['entity-links'] as const,
  lists: () => [...entityLinksKeys.all, 'list'] as const,
  list: (intakeId: string, includeDeleted = false) =>
    [...entityLinksKeys.lists(), intakeId, includeDeleted] as const,
  detail: (intakeId: string, linkId: string) =>
    [...entityLinksKeys.all, 'detail', intakeId, linkId] as const,
  auditLog: (intakeId: string, linkId: string) =>
    [...entityLinksKeys.all, 'audit', intakeId, linkId] as const,
};

/**
 * Hook to fetch entity links for an intake
 */
export function useEntityLinks(intakeId: string, includeDeleted = false) {
  const { t } = useTranslation();

  return useQuery({
    queryKey: entityLinksKeys.list(intakeId, includeDeleted),
    queryFn: () => intakeEntityLinksAPI.getLinks(intakeId, includeDeleted),
    enabled: !!intakeId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to create a new entity link
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateEntityLink(intakeId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateLinkRequest, 'intake_id'>) =>
      intakeEntityLinksAPI.createLink(intakeId, data),

    // Optimistic update for <50ms perceived latency
    onMutate: async (newLink) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });

      // Snapshot the previous value
      const previousLinks = queryClient.getQueryData<EntityLink[]>(
        entityLinksKeys.list(intakeId, false)
      );

      // Optimistically update the cache
      if (previousLinks) {
        const optimisticLink: EntityLink = {
          id: `temp-${Date.now()}`, // Temporary ID
          intake_id: intakeId,
          entity_type: newLink.entity_type,
          entity_id: newLink.entity_id,
          link_type: newLink.link_type,
          notes: newLink.notes,
          link_order: previousLinks.length + 1,
          created_by: 'current-user', // Will be replaced with actual value
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null,
          _version: 1,
        };

        queryClient.setQueryData<EntityLink[]>(
          entityLinksKeys.list(intakeId, false),
          [...previousLinks, optimisticLink]
        );
      }

      // Return context with snapshot
      return { previousLinks };
    },

    // On error, rollback to previous value
    onError: (error: EntityLinksAPIError, newLink, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(
          entityLinksKeys.list(intakeId, false),
          context.previousLinks
        );
      }

      toast({
        variant: 'destructive',
        title: t('entityLinks.createError'),
        description: error.message || t('entityLinks.createErrorDescription'),
      });
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });
    },

    // On success, show confirmation
    onSuccess: (data) => {
      toast({
        title: t('entityLinks.createSuccess'),
        description: t('entityLinks.createSuccessDescription'),
      });
    },
  });
}

/**
 * Hook to update an existing entity link
 */
export function useUpdateEntityLink(intakeId: string, linkId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateLinkRequest) =>
      intakeEntityLinksAPI.updateLink(intakeId, linkId, data),

    // Optimistic update
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });

      const previousLinks = queryClient.getQueryData<EntityLink[]>(
        entityLinksKeys.list(intakeId, false)
      );

      if (previousLinks) {
        queryClient.setQueryData<EntityLink[]>(
          entityLinksKeys.list(intakeId, false),
          previousLinks.map((link) =>
            link.id === linkId
              ? {
                  ...link,
                  ...updatedData,
                  updated_at: new Date().toISOString(),
                  _version: link._version + 1,
                }
              : link
          )
        );
      }

      return { previousLinks };
    },

    onError: (error: EntityLinksAPIError, updatedData, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(
          entityLinksKeys.list(intakeId, false),
          context.previousLinks
        );
      }

      // Handle optimistic locking conflicts
      if (error.code === 'OPTIMISTIC_LOCK_FAILURE') {
        toast({
          variant: 'destructive',
          title: t('entityLinks.conflictError'),
          description: t('entityLinks.conflictErrorDescription'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('entityLinks.updateError'),
          description: error.message || t('entityLinks.updateErrorDescription'),
        });
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });
    },

    onSuccess: () => {
      toast({
        title: t('entityLinks.updateSuccess'),
        description: t('entityLinks.updateSuccessDescription'),
      });
    },
  });
}

/**
 * Hook to delete an entity link (soft delete)
 */
export function useDeleteEntityLink(intakeId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => intakeEntityLinksAPI.deleteLink(intakeId, linkId),

    // Optimistic update
    onMutate: async (linkId) => {
      await queryClient.cancelQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });

      const previousLinks = queryClient.getQueryData<EntityLink[]>(
        entityLinksKeys.list(intakeId, false)
      );

      if (previousLinks) {
        queryClient.setQueryData<EntityLink[]>(
          entityLinksKeys.list(intakeId, false),
          previousLinks.filter((link) => link.id !== linkId)
        );
      }

      return { previousLinks };
    },

    onError: (error: EntityLinksAPIError, linkId, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(
          entityLinksKeys.list(intakeId, false),
          context.previousLinks
        );
      }

      toast({
        variant: 'destructive',
        title: t('entityLinks.deleteError'),
        description: error.message || t('entityLinks.deleteErrorDescription'),
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });
    },

    onSuccess: () => {
      toast({
        title: t('entityLinks.deleteSuccess'),
        description: t('entityLinks.deleteSuccessDescription'),
      });
    },
  });
}

/**
 * Hook to restore a deleted entity link
 * Only available to steward+ roles
 */
export function useRestoreEntityLink(intakeId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => intakeEntityLinksAPI.restoreLink(intakeId, linkId),

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: entityLinksKeys.list(intakeId, true),
      });
      queryClient.invalidateQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });
    },

    onError: (error: EntityLinksAPIError) => {
      toast({
        variant: 'destructive',
        title: t('entityLinks.restoreError'),
        description: error.message || t('entityLinks.restoreErrorDescription'),
      });
    },

    onSuccess: () => {
      toast({
        title: t('entityLinks.restoreSuccess'),
        description: t('entityLinks.restoreSuccessDescription'),
      });
    },
  });
}

/**
 * Hook to reorder entity links
 * Uses debounced mutations for drag-and-drop
 */
export function useReorderEntityLinks(intakeId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkOrders: Array<{ link_id: string; link_order: number }>) =>
      intakeEntityLinksAPI.reorderLinks(intakeId, linkOrders),

    // Optimistic update
    onMutate: async (linkOrders) => {
      await queryClient.cancelQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });

      const previousLinks = queryClient.getQueryData<EntityLink[]>(
        entityLinksKeys.list(intakeId, false)
      );

      if (previousLinks) {
        const reorderedLinks = [...previousLinks];
        linkOrders.forEach(({ link_id, link_order }) => {
          const linkIndex = reorderedLinks.findIndex((link) => link.id === link_id);
          if (linkIndex !== -1) {
            reorderedLinks[linkIndex] = {
              ...reorderedLinks[linkIndex],
              link_order,
            };
          }
        });

        reorderedLinks.sort((a, b) => a.link_order - b.link_order);

        queryClient.setQueryData<EntityLink[]>(
          entityLinksKeys.list(intakeId, false),
          reorderedLinks
        );
      }

      return { previousLinks };
    },

    onError: (error: EntityLinksAPIError, linkOrders, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(
          entityLinksKeys.list(intakeId, false),
          context.previousLinks
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });
    },
  });
}

/**
 * Hook to create multiple entity links in batch
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateBatchEntityLinks(intakeId: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      links: Array<{
        entity_type: string;
        entity_id: string;
        link_type: string;
        notes?: string;
      }>
    ) =>
      intakeEntityLinksAPI.createBatchLinks(intakeId, {
        links: links.map((link) => ({
          ...link,
          link_type: link.link_type as any,
          entity_type: link.entity_type as any,
        })),
      }),

    // Optimistic update for batch creation
    onMutate: async (newLinks) => {
      await queryClient.cancelQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });

      const previousLinks = queryClient.getQueryData<EntityLink[]>(
        entityLinksKeys.list(intakeId, false)
      );

      // Optimistically add all new links
      if (previousLinks) {
        const optimisticLinks: EntityLink[] = newLinks.map((link, index) => ({
          id: `temp-${Date.now()}-${index}`,
          intake_id: intakeId,
          entity_type: link.entity_type as any,
          entity_id: link.entity_id,
          link_type: link.link_type as any,
          notes: link.notes || '',
          link_order: previousLinks.length + index + 1,
          created_by: 'current-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          deleted_by: null,
          _version: 1,
        }));

        queryClient.setQueryData<EntityLink[]>(
          entityLinksKeys.list(intakeId, false),
          [...previousLinks, ...optimisticLinks]
        );
      }

      return { previousLinks };
    },

    onError: (error: EntityLinksAPIError, newLinks, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(
          entityLinksKeys.list(intakeId, false),
          context.previousLinks
        );
      }

      toast({
        variant: 'destructive',
        title: t('entityLinks.createBatchError'),
        description: error.message || t('entityLinks.createBatchErrorDescription'),
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: entityLinksKeys.list(intakeId, false),
      });
    },

    onSuccess: (data) => {
      const successCount = data.created_links.length;
      const failCount = data.failed_links.length;

      if (failCount > 0) {
        toast({
          variant: 'default',
          title: t('entityLinks.createBatchPartialSuccess'),
          description: t('entityLinks.createBatchPartialSuccessDescription', {
            success: successCount,
            failed: failCount,
          }),
        });
      } else {
        toast({
          title: t('entityLinks.createBatchSuccess'),
          description: t('entityLinks.createBatchSuccessDescription', {
            count: successCount,
          }),
        });
      }
    },
  });
}

/**
 * Hook to fetch audit log for a link
 */
export function useEntityLinkAuditLog(intakeId: string, linkId: string) {
  return useQuery({
    queryKey: entityLinksKeys.auditLog(intakeId, linkId),
    queryFn: () => intakeEntityLinksAPI.getAuditLog(intakeId, linkId),
    enabled: !!intakeId && !!linkId,
    staleTime: 1000 * 60, // 1 minute
  });
}
