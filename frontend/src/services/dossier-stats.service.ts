/**
 * Dossier Stats Service
 * Feature: 030-health-commitment
 *
 * API client for fetching dossier statistics (commitments, engagements, documents, health scores)
 * Connects to Supabase Edge Functions: dossier-stats, calculate-health-score
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Dossier statistics response
 */
export interface DossierStats {
  dossierId: string;
  commitments?: {
    total: number;
    active: number;
    overdue: number;
    fulfilled: number;
    upcoming: number;
    fulfillmentRate: number;
  };
  engagements?: {
    total365d: number;
    recent90d: number;
    latestDate: string | null;
    frequencyScore: number;
  };
  documents?: {
    total: number;
  };
  health?: {
    overallScore: number | null;
    components: {
      engagementFrequency: number;
      commitmentFulfillment: number;
      recencyScore: number;
    } | null;
    sufficientData: boolean;
    reason: string | null;
    calculatedAt: string | null;
  };
  dataFreshness?: {
    isCurrent: boolean;
    calculatedAt: string | null;
    ageMinutes: number | null;
  };
}

/**
 * Bulk dossier stats response
 */
export interface BulkDossierStatsResponse {
  stats: DossierStats[];
  totalCount: number;
}

/**
 * Health score response
 */
export interface HealthScoreResponse {
  dossierId: string;
  overallScore: number | null;
  components: {
    engagementFrequency: number;
    commitmentFulfillment: number;
    recencyScore: number;
  };
  sufficientData: boolean;
  reason: string | null;
  calculatedAt: string;
  calculationTimeMs: number;
  cached: boolean;
}

/**
 * Get statistics for a single dossier
 *
 * @param dossierId - UUID of the dossier
 * @param include - Optional array of stat categories to include (default: all)
 * @returns Dossier statistics
 */
export async function getStats(
  dossierId: string,
  include?: Array<'commitments' | 'engagements' | 'documents' | 'health'>
): Promise<DossierStats> {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) {
    throw new Error('User not authenticated');
  }

  const url = new URL(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-stats`
  );
  url.searchParams.append('dossierId', dossierId);
  if (include && include.length > 0) {
    url.searchParams.append('include', include.join(','));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message_en || 'Failed to fetch dossier stats');
  }

  return response.json();
}

/**
 * Get statistics for multiple dossiers in a single request
 *
 * @param dossierIds - Array of dossier UUIDs (max 100)
 * @param include - Optional array of stat categories to include (default: all)
 * @returns Bulk dossier statistics
 */
export async function getBulkStats(
  dossierIds: string[],
  include?: Array<'commitments' | 'engagements' | 'documents' | 'health'>
): Promise<BulkDossierStatsResponse> {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) {
    throw new Error('User not authenticated');
  }

  if (dossierIds.length === 0) {
    return { stats: [], totalCount: 0 };
  }

  if (dossierIds.length > 100) {
    throw new Error('Cannot fetch more than 100 dossiers at once');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dossier-stats`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dossierIds,
        include,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message_en || 'Failed to fetch bulk dossier stats');
  }

  return response.json();
}

/**
 * Calculate or retrieve health score for a dossier
 *
 * @param dossierId - UUID of the dossier
 * @param forceRecalculation - If true, recalculate even if cached score exists (default: false)
 * @returns Health score response
 */
export async function calculateHealthScore(
  dossierId: string,
  forceRecalculation = false
): Promise<HealthScoreResponse> {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-health-score`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dossierId,
        forceRecalculation,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message_en || 'Failed to calculate health score');
  }

  return response.json();
}

/**
 * Get health score color based on value
 *
 * @param score - Health score (0-100) or null
 * @returns Tailwind CSS color class
 */
export function getHealthScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get health score label based on value
 *
 * @param score - Health score (0-100) or null
 * @returns Human-readable label
 */
export function getHealthScoreLabel(score: number | null): string {
  if (score === null) return 'Insufficient Data';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}
