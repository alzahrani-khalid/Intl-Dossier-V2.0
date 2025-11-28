/**
 * useCreationContext Hook
 * Feature: 033-unified-work-creation-hub
 *
 * Auto-captures route context for work item creation.
 * Detects entity type and ID from current URL path.
 *
 * Note: Safe to use outside RouterProvider - returns default context.
 */

import { useMemo } from 'react';
import { useRouterState } from '@tanstack/react-router';

export type EntityType = 'dossier' | 'engagement' | 'after_action' | 'position' | 'intake';

export interface CreationContext {
  // Auto-captured from route
  route: string;
  entityType?: EntityType;
  entityId?: string;

  // Derived context
  dossierId?: string;
  engagementId?: string;
  afterActionId?: string;
  positionId?: string;

  // For database storage
  createdFromEntity?: {
    type: EntityType;
    id: string;
  };
}

/**
 * Detects entity type from URL path
 */
function detectEntityType(pathname: string): EntityType | undefined {
  if (pathname.includes('/dossiers/') || pathname.includes('/dossier/')) {
    return 'dossier';
  }
  if (pathname.includes('/engagements/') || pathname.includes('/engagement/')) {
    return 'engagement';
  }
  if (pathname.includes('/after-actions/') || pathname.includes('/after-action/')) {
    return 'after_action';
  }
  if (pathname.includes('/positions/') || pathname.includes('/position/')) {
    return 'position';
  }
  if (pathname.includes('/intake/')) {
    return 'intake';
  }
  return undefined;
}

/**
 * Extracts entity ID from URL path
 */
function extractEntityId(pathname: string, entityType: EntityType): string | undefined {
  const patterns: Record<EntityType, RegExp> = {
    dossier: /\/dossiers?\/([a-f0-9-]+)/i,
    engagement: /\/engagements?\/([a-f0-9-]+)/i,
    after_action: /\/after-actions?\/([a-f0-9-]+)/i,
    position: /\/positions?\/([a-f0-9-]+)/i,
    intake: /\/intake\/([a-f0-9-]+)/i,
  };

  const match = pathname.match(patterns[entityType]);
  return match?.[1];
}

/**
 * Hook to capture creation context from current route
 * Now used inside RouterProvider via __root.tsx
 */
export function useCreationContext(): CreationContext {
  // Get router state - now safe since WorkCreationProvider is inside RouterProvider
  const routerState = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      params: s.matches.at(-1)?.params ?? {},
    }),
  });

  const context = useMemo<CreationContext>(() => {
    const { pathname, params } = routerState;
    const entityType = detectEntityType(pathname);
    const entityId = entityType ? extractEntityId(pathname, entityType) : undefined;

    // Build context object
    const result: CreationContext = {
      route: pathname,
      entityType,
      entityId,
    };

    const typedParams = params as Record<string, string | undefined>;

    // Set specific IDs based on entity type or route params
    if (entityType === 'dossier' && entityId) {
      result.dossierId = entityId;
    } else if (typedParams.dossierId) {
      result.dossierId = typedParams.dossierId;
    }

    if (entityType === 'engagement' && entityId) {
      result.engagementId = entityId;
    } else if (typedParams.engagementId) {
      result.engagementId = typedParams.engagementId;
    }

    if (entityType === 'after_action' && entityId) {
      result.afterActionId = entityId;
    } else if (typedParams.afterActionId) {
      result.afterActionId = typedParams.afterActionId;
    }

    if (entityType === 'position' && entityId) {
      result.positionId = entityId;
    } else if (typedParams.positionId) {
      result.positionId = typedParams.positionId;
    }

    // Build createdFromEntity for database storage
    if (entityType && entityId) {
      result.createdFromEntity = {
        type: entityType,
        id: entityId,
      };
    }

    return result;
  }, [routerState]);

  return context;
}

export default useCreationContext;
