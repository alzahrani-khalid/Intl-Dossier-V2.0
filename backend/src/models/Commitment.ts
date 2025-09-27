/**
 * Commitment Model
 * Tracks deliverables, obligations, and their fulfillment
 */

import { UUID, StandardMetadata, CommitmentStatus, Priority } from './types';

export interface CommitmentSource {
  type: 'mou' | 'activity' | 'forum' | 'bilateral_agreement' | 'manual';
  entity_id?: UUID;
  reference?: string;
}

export interface CommitmentResponsible {
  entity_type: 'country' | 'organization' | 'department';
  entity_id?: UUID;
  focal_point: UUID;
  backup_focal?: UUID;
}

export interface CommitmentTimeline {
  created_date: Date;
  start_date?: Date;
  due_date: Date;
  completed_date?: Date;
  original_due_date?: Date; // If extended
  extensions?: Array<{
    new_date: Date;
    reason: string;
    approved_by: UUID;
    approved_at: Date;
  }>;
}

export interface DeliverableDetails {
  type: 'report' | 'data' | 'payment' | 'participation' | 'implementation' | 'other';
  format?: string;
  quantity?: number;
  unit?: string;
  acceptance_criteria?: string[];
  submission_method?: 'email' | 'portal' | 'physical' | 'system';
}

export interface CommitmentTracking {
  progress_percentage: number;
  milestones?: Array<{
    name: string;
    due_date: Date;
    completed: boolean;
    completed_date?: Date;
  }>;
  alerts_sent: Array<{
    type: 'reminder' | 'overdue' | 'escalation';
    sent_at: Date;
    recipients: UUID[];
    message: string;
  }>;
  evidence_documents?: UUID[];
  verification_status?: 'pending' | 'verified' | 'rejected';
  verified_by?: UUID;
  verified_at?: Date;
}

export interface Commitment {
  id: UUID;
  title: string;
  type: 'deliverable' | 'payment' | 'report' | 'participation' | 'data_submission';
  source: CommitmentSource;
  responsible: CommitmentResponsible;
  timeline: CommitmentTimeline;
  status: CommitmentStatus;
  priority: Priority;
  dependencies?: UUID[]; // Other commitment IDs
  deliverable_details?: DeliverableDetails;
  tracking: CommitmentTracking;
  financial_value?: {
    amount: number;
    currency: string;
  };
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    occurrences?: number;
    end_date?: Date;
  };
  tags?: string[];
  metadata: StandardMetadata;
}

export interface CommitmentInput {
  title: string;
  type: 'deliverable' | 'payment' | 'report' | 'participation' | 'data_submission';
  source: CommitmentSource;
  responsible: CommitmentResponsible;
  due_date: Date;
  start_date?: Date;
  priority?: Priority;
  dependencies?: UUID[];
  deliverable_details?: DeliverableDetails;
  financial_value?: {
    amount: number;
    currency: string;
  };
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    occurrences?: number;
    end_date?: Date;
  };
  tags?: string[];
}

export interface CommitmentWithRelations extends Commitment {
  source_entity?: {
    type: string;
    id: UUID;
    title: string;
    reference?: string;
  };
  responsible_entity?: {
    type: string;
    id: UUID;
    name_en: string;
    name_ar: string;
  };
  focal_point_details?: {
    id: UUID;
    name: string;
    email: string;
    position: string;
  };
  dependent_commitments?: Array<{
    id: UUID;
    title: string;
    status: CommitmentStatus;
    due_date: Date;
  }>;
  evidence_documents_details?: Array<{
    id: UUID;
    title: string;
    type: string;
    uploaded_at: Date;
  }>;
}