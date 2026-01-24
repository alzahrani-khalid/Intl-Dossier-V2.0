/**
 * Entity Navigation Tracking Hooks
 * @module hooks/useEntityNavigation
 *
 * Automatic breadcrumb trail tracking for entity detail pages.
 *
 * @description
 * This module provides hooks for automatically tracking entity navigation history
 * to build breadcrumb trails and enable quick navigation between recently viewed
 * entities. History is managed by the entityHistoryStore and persisted across
 * sessions.
 *
 * Features:
 * - Automatic entity tracking on mount (with deduplication)
 * - Type-specific tracking hooks for dossiers, persons, engagements, positions
 * - Generic hook for custom entity types
 * - Conditional tracking with skip option
 * - History retrieval and management utilities
 * - Automatic cleanup on entity ID changes
 *
 * @example
 * // Track a dossier in detail page
 * function DossierDetailPage({ id }) {
 *   const { data: dossier } = useDossier(id);
 *   useDossierNavigation(id, dossier);
 *
 *   return <div>{dossier?.name_en}</div>;
 * }
 *
 * @example
 * // Get recent entity history for breadcrumbs
 * function BreadcrumbTrail() {
 *   const { recentEntities } = useEntityHistory(5);
 *
 *   return (
 *     <nav>
 *       {recentEntities.map(entity => (
 *         <Link key={entity.id} to={entity.route}>
 *           {entity.name_en}
 *         </Link>
 *       ))}
 *     </nav>
 *   );
 * }
 *
 * @example
 * // Conditional tracking (skip while loading)
 * useDossierNavigation(id, dossier, { skip: isLoading || !dossier });
 */

import { useEffect, useRef } from 'react'
import {
  useEntityHistoryStore,
  type EntityType,
  type EntityHistoryEntry,
  createDossierHistoryEntry,
  createPersonHistoryEntry,
  createEngagementHistoryEntry,
  createPositionHistoryEntry,
} from '@/store/entityHistoryStore'

interface UseEntityNavigationOptions {
  /** Skip tracking this entity (e.g., when loading) */
  skip?: boolean
}

/**
 * Hook to track a dossier entity in navigation history
 *
 * @description
 * Automatically adds a dossier to the navigation history when the component mounts.
 * Tracks only once per entity ID to avoid duplicate entries. Useful for building
 * breadcrumb trails and recent entity lists.
 *
 * @param id - The unique identifier (UUID) of the dossier, or undefined if not loaded
 * @param dossier - The dossier data object containing name and type information
 * @param dossier.name_en - English name of the dossier
 * @param dossier.name_ar - Arabic name of the dossier
 * @param dossier.dossier_type - Type of the dossier (country, organization, etc.)
 * @param dossier.type - Alternative type field (fallback if dossier_type not present)
 * @param options - Optional configuration
 * @param options.skip - If true, skip tracking this entity (e.g., when loading)
 *
 * @example
 * // Basic usage in dossier detail page
 * function CountryDetail({ id }) {
 *   const { data: dossier, isLoading } = useDossier(id);
 *
 *   // Track navigation, but skip while loading
 *   useDossierNavigation(id, dossier, { skip: isLoading });
 *
 *   return <div>{dossier?.name_en}</div>;
 * }
 *
 * @example
 * // Track immediately when data is available
 * function DossierCard({ dossier }) {
 *   useDossierNavigation(dossier.id, dossier);
 *   // Entity is tracked as soon as component mounts
 * }
 */
export function useDossierNavigation(
  id: string | undefined,
  dossier:
    | { name_en?: string; name_ar?: string; dossier_type?: string; type?: string }
    | null
    | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    // Skip if no ID, no dossier data, explicitly skipped, or already tracked
    if (!id || !dossier || options?.skip || hasTracked.current) {
      return
    }

    // Track this entity
    const entry = createDossierHistoryEntry(id, dossier)
    addEntity(entry)
    hasTracked.current = true
  }, [id, dossier, options?.skip, addEntity])

  // Reset tracking when ID changes
  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to track a person entity in navigation history
 *
 * @description
 * Automatically adds a person to the navigation history when the component mounts.
 * Tracks only once per entity ID to avoid duplicate entries.
 *
 * @param id - The unique identifier (UUID) of the person, or undefined if not loaded
 * @param person - The person data object containing name information
 * @param person.name_en - English name of the person
 * @param person.name_ar - Arabic name of the person
 * @param options - Optional configuration
 * @param options.skip - If true, skip tracking this entity (e.g., when loading)
 *
 * @example
 * // Track person in detail page
 * function PersonDetail({ id }) {
 *   const { data: person } = usePerson(id);
 *   usePersonNavigation(id, person);
 *   return <div>{person?.name_en}</div>;
 * }
 */
export function usePersonNavigation(
  id: string | undefined,
  person: { name_en?: string; name_ar?: string } | null | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !person || options?.skip || hasTracked.current) {
      return
    }

    const entry = createPersonHistoryEntry(id, person)
    addEntity(entry)
    hasTracked.current = true
  }, [id, person, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to track an engagement entity in navigation history
 *
 * @description
 * Automatically adds an engagement to the navigation history when the component mounts.
 * Tracks only once per entity ID to avoid duplicate entries.
 *
 * @param id - The unique identifier (UUID) of the engagement, or undefined if not loaded
 * @param engagement - The engagement data object containing name and type information
 * @param engagement.name_en - English name of the engagement
 * @param engagement.name_ar - Arabic name of the engagement
 * @param engagement.engagement_type - Type of the engagement (meeting, visit, etc.)
 * @param options - Optional configuration
 * @param options.skip - If true, skip tracking this entity (e.g., when loading)
 *
 * @example
 * // Track engagement in detail page
 * function EngagementDetail({ id }) {
 *   const { data: engagement } = useEngagement(id);
 *   useEngagementNavigation(id, engagement);
 *   return <div>{engagement?.name_en}</div>;
 * }
 */
export function useEngagementNavigation(
  id: string | undefined,
  engagement: { name_en?: string; name_ar?: string; engagement_type?: string } | null | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !engagement || options?.skip || hasTracked.current) {
      return
    }

    const entry = createEngagementHistoryEntry(id, engagement)
    addEntity(entry)
    hasTracked.current = true
  }, [id, engagement, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to track a position entity in navigation history
 *
 * @description
 * Automatically adds a position to the navigation history when the component mounts.
 * Tracks only once per entity ID to avoid duplicate entries.
 *
 * @param id - The unique identifier (UUID) of the position, or undefined if not loaded
 * @param position - The position data object containing title and type information
 * @param position.title_en - English title of the position
 * @param position.title_ar - Arabic title of the position
 * @param position.position_type - Type of the position (diplomatic, technical, etc.)
 * @param options - Optional configuration
 * @param options.skip - If true, skip tracking this entity (e.g., when loading)
 *
 * @example
 * // Track position in detail page
 * function PositionDetail({ id }) {
 *   const { data: position } = usePosition(id);
 *   usePositionNavigation(id, position);
 *   return <div>{position?.title_en}</div>;
 * }
 */
export function usePositionNavigation(
  id: string | undefined,
  position: { title_en?: string; title_ar?: string; position_type?: string } | null | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !position || options?.skip || hasTracked.current) {
      return
    }

    const entry = createPositionHistoryEntry(id, position)
    addEntity(entry)
    hasTracked.current = true
  }, [id, position, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Generic hook to track any entity in navigation history
 *
 * @description
 * Provides a flexible way to track custom entity types in the navigation history.
 * Use this when you need to track entities that don't have dedicated tracking hooks
 * or when you need full control over the tracking parameters.
 *
 * @param id - The unique identifier (UUID) of the entity, or undefined if not loaded
 * @param entityData - The entity data object
 * @param entityData.name_en - English name of the entity
 * @param entityData.name_ar - Arabic name of the entity
 * @param entityData.type - Type of the entity (dossier, person, engagement, position, etc.)
 * @param entityData.route - Route path for navigating to this entity
 * @param entityData.subType - Optional subtype for additional categorization
 * @param options - Optional configuration
 * @param options.skip - If true, skip tracking this entity (e.g., when loading)
 *
 * @example
 * // Track a custom entity type
 * function CustomEntityDetail({ id, entity }) {
 *   useEntityNavigation(id, {
 *     name_en: entity.name_en,
 *     name_ar: entity.name_ar,
 *     type: 'dossier',
 *     route: `/entities/${id}`,
 *     subType: entity.category
 *   });
 *
 *   return <div>{entity.name_en}</div>;
 * }
 *
 * @example
 * // Conditional tracking with derived route
 * useEntityNavigation(
 *   entity?.id,
 *   entity ? {
 *     name_en: entity.title,
 *     name_ar: entity.title_ar,
 *     type: 'engagement',
 *     route: `/engagements/${entity.id}`,
 *     subType: entity.status
 *   } : null,
 *   { skip: !entity }
 * );
 */
export function useEntityNavigation(
  id: string | undefined,
  entityData:
    | {
        name_en?: string
        name_ar?: string
        type: EntityType
        route: string
        subType?: string
      }
    | null
    | undefined,
  options?: UseEntityNavigationOptions,
) {
  const { addEntity } = useEntityHistoryStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!id || !entityData || options?.skip || hasTracked.current) {
      return
    }

    const entry: Omit<EntityHistoryEntry, 'timestamp'> = {
      id,
      type: entityData.type,
      name_en: entityData.name_en || 'Unknown',
      name_ar: entityData.name_ar || entityData.name_en || 'غير معروف',
      route: entityData.route,
      subType: entityData.subType,
    }

    addEntity(entry)
    hasTracked.current = true
  }, [id, entityData, options?.skip, addEntity])

  useEffect(() => {
    hasTracked.current = false
  }, [id])
}

/**
 * Hook to retrieve and manage entity navigation history
 *
 * @description
 * Provides access to the entity navigation history for building breadcrumb trails,
 * recent entity lists, and navigation utilities. The history is persisted across
 * sessions and automatically cleaned up based on the store's retention policy.
 *
 * @param count - Optional limit for recent entities (returns all if not specified)
 * @returns Entity history management object containing:
 * - `history`: Complete array of all tracked entities
 * - `recentEntities`: Most recent N entities (limited by count parameter)
 * - `clearHistory`: Function to clear all history
 * - `removeEntity`: Function to remove a specific entity by ID
 * - `isEmpty`: Boolean indicating if history is empty
 * - `count`: Total number of entities in history
 *
 * @example
 * // Display breadcrumb trail with recent 5 entities
 * function Breadcrumbs() {
 *   const { recentEntities, removeEntity } = useEntityHistory(5);
 *
 *   return (
 *     <nav className="breadcrumbs">
 *       {recentEntities.map(entity => (
 *         <div key={entity.id}>
 *           <Link to={entity.route}>{entity.name_en}</Link>
 *           <button onClick={() => removeEntity(entity.id)}>×</button>
 *         </div>
 *       ))}
 *     </nav>
 *   );
 * }
 *
 * @example
 * // Show all history with clear option
 * function HistoryPanel() {
 *   const { history, clearHistory, isEmpty, count } = useEntityHistory();
 *
 *   if (isEmpty) {
 *     return <p>No history yet</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <h3>History ({count} items)</h3>
 *       <button onClick={clearHistory}>Clear All</button>
 *       {history.map(entity => (
 *         <div key={entity.id}>{entity.name_en}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useEntityHistory(count?: number) {
  const { history, getRecentEntities, clearHistory, removeEntity } = useEntityHistoryStore()

  return {
    history,
    recentEntities: getRecentEntities(count),
    clearHistory,
    removeEntity,
    isEmpty: history.length === 0,
    count: history.length,
  }
}
