/**
 * MoU (Memorandum of Understanding) Model
 * Tracks agreements, deliverables, and performance metrics
 */

import { UUID, StandardMetadata, MoUState, Priority } from './types';

export interface MoUDeliverable {
  id: UUID;
  description: string;
  due_date: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'at-risk';
  responsible_party: UUID;
  completion_percentage: number;
}

export interface FinancialCommitment {
  amount: number;
  currency: string;
  payment_schedule: string;
  paid_to_date?: number;
}

export interface AlertConfig {
  milestone_alerts: number[];  // Days before milestone
  expiry_alerts: number[];    // Days before expiry
  escalation_rules?: Array<{
    days_before: number;
    notify: UUID[];
  }>;
}

export interface PerformanceMetrics {
  completion_rate: number;
  average_delay_days: number;
  impact_score: number;
  deliverables_completed: number;
  deliverables_total: number;
}

export interface MoU {
  id: UUID;
  reference_number: string;
  title_en: string;
  title_ar: string;
  type: 'bilateral' | 'multilateral' | 'framework' | 'technical';
  category: 'data_exchange' | 'capacity_building' | 'strategic' | 'technical';
  parties: Array<{
    entity_type: 'country' | 'organization';
    entity_id: UUID;
    role: 'primary' | 'secondary' | 'observer';
  }>;
  lifecycle_state: MoUState;
  dates: {
    signed?: Date;
    effective?: Date;
    expiry?: Date;
    last_reviewed?: Date;
  };
  deliverables: MoUDeliverable[];
  financial?: FinancialCommitment;
  alert_config: AlertConfig;
  performance_metrics: PerformanceMetrics;
  documents: UUID[];
  metadata: StandardMetadata;
}

export interface MoUInput {
  reference_number: string;
  title_en: string;
  title_ar: string;
  type: 'bilateral' | 'multilateral' | 'framework' | 'technical';
  category: 'data_exchange' | 'capacity_building' | 'strategic' | 'technical';
  parties: Array<{
    entity_type: 'country' | 'organization';
    entity_id: UUID;
    role: 'primary' | 'secondary' | 'observer';
  }>;
  lifecycle_state?: MoUState;
  dates?: {
    signed?: Date;
    effective?: Date;
    expiry?: Date;
  };
  deliverables?: MoUDeliverable[];
  financial?: FinancialCommitment;
  alert_config?: AlertConfig;
}

export interface MoUWithRelations extends MoU {
  parties_details?: Array<{
    entity_type: 'country' | 'organization';
    entity_id: UUID;
    name_en: string;
    name_ar: string;
    role: 'primary' | 'secondary' | 'observer';
  }>;
  commitments?: Array<{
    id: UUID;
    title: string;
    status: string;
    due_date: Date;
  }>;
  signature_requests?: Array<{
    id: UUID;
    status: string;
    provider: string;
  }>;
}