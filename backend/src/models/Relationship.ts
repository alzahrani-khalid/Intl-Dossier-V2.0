/**
 * Relationship Model
 * Tracks bilateral and multilateral relationships with health scoring
 */

import { UUID, StandardMetadata, HealthStatus, Priority } from './types';

export interface RelationshipParty {
  type: 'country' | 'organization';
  id: UUID;
  role: 'primary' | 'secondary' | 'partner';
}

export interface HealthMetrics {
  engagement_frequency: number;     // Interactions per month
  commitment_fulfillment: number;   // Percentage
  response_time: number;            // Average days
  last_interaction: Date;
  mou_completion_rate?: number;
  document_exchange_volume?: number;
  meeting_attendance_rate?: number;
}

export interface EngagementEntry {
  date: Date;
  type: 'meeting' | 'correspondence' | 'event' | 'agreement';
  title: string;
  outcome: 'positive' | 'neutral' | 'negative';
  impact: 'high' | 'medium' | 'low';
  participants?: UUID[];
}

export interface FocalPoint {
  department: string;
  primary_contact: UUID;
  backup_contact?: UUID;
  responsibilities: string[];
}

export interface Relationship {
  id: UUID;
  type: 'bilateral' | 'multilateral' | 'membership' | 'partnership';
  parties: RelationshipParty[];
  status: 'active' | 'developing' | 'dormant' | 'strategic' | 'at-risk';
  health_metrics: HealthMetrics;
  health_status: HealthStatus;
  health_score: number; // 0-100
  engagement_history: EngagementEntry[];
  strategic_importance: Priority;
  focal_points: FocalPoint[];
  next_actions?: string[];
  risk_factors?: string[];
  opportunities?: string[];
  notes?: string;
  metadata: StandardMetadata;
}

export interface RelationshipInput {
  type: 'bilateral' | 'multilateral' | 'membership' | 'partnership';
  parties: RelationshipParty[];
  status?: 'active' | 'developing' | 'dormant' | 'strategic' | 'at-risk';
  strategic_importance?: Priority;
  focal_points?: FocalPoint[];
  notes?: string;
}

export interface RelationshipWithRelations extends Relationship {
  parties_details?: Array<{
    type: 'country' | 'organization';
    id: UUID;
    name_en: string;
    name_ar: string;
    role: string;
  }>;
  recent_activities?: Array<{
    id: UUID;
    type: string;
    title: string;
    date: Date;
    outcome: string;
  }>;
  active_mous?: Array<{
    id: UUID;
    reference_number: string;
    title_en: string;
    status: string;
  }>;
  assigned_contacts?: Array<{
    id: UUID;
    name: string;
    position: string;
    department: string;
  }>;
}

/**
 * Calculate health score based on weighted metrics
 */
export function calculateHealthScore(metrics: HealthMetrics): number {
  const weights = {
    engagement_frequency: 0.40,
    commitment_fulfillment: 0.35,
    response_time: 0.25
  };

  // Normalize metrics to 0-100 scale
  const normalizedEngagement = Math.min(metrics.engagement_frequency * 10, 100); // 10 interactions/month = 100
  const normalizedResponse = Math.max(0, 100 - metrics.response_time * 5); // 20 days = 0, 0 days = 100

  return Math.round(
    normalizedEngagement * weights.engagement_frequency +
    metrics.commitment_fulfillment * weights.commitment_fulfillment +
    normalizedResponse * weights.response_time
  );
}

/**
 * Determine health status based on score
 */
export function getHealthStatus(score: number): HealthStatus {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'monitor';
  if (score >= 40) return 'at_risk';
  return 'critical';
}