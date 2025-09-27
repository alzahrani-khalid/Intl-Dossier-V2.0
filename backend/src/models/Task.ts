/**
 * Task Model
 * Action items and follow-ups with escalation rules
 */

import { UUID, StandardMetadata, TaskStatus, UrgentPriority } from './types';

export interface TaskSource {
  type: 'activity' | 'mou' | 'commitment' | 'brief' | 'manual';
  entity_id?: UUID;
  description?: string;
}

export interface TaskAssignment {
  assigned_to: UUID;
  assigned_by: UUID;
  assigned_at: Date;
  role: 'owner' | 'assignee' | 'reviewer' | 'observer';
  department?: string;
}

export interface TaskTimeline {
  created_date: Date;
  start_date?: Date;
  due_date: Date;
  completed_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
}

export interface TaskDependency {
  depends_on: UUID[];
  blocks: UUID[];
  related_tasks: UUID[];
}

export interface EscalationRule {
  days_before_due: number;
  escalate_to: UUID;
  notification_type: 'email' | 'sms' | 'system';
  message_template?: string;
}

export interface TaskProgress {
  percentage: number;
  milestones?: Array<{
    name: string;
    completed: boolean;
    completed_at?: Date;
  }>;
  comments: Array<{
    user_id: UUID;
    comment: string;
    created_at: Date;
  }>;
  attachments?: UUID[];
}

export interface Task {
  id: UUID;
  title: string;
  description: string;
  type: 'action_item' | 'follow_up' | 'preparation' | 'analysis' | 'review' | 'approval';
  source: TaskSource;
  assignment: TaskAssignment;
  timeline: TaskTimeline;
  status: TaskStatus;
  priority: UrgentPriority;
  dependencies?: TaskDependency;
  escalation?: EscalationRule[];
  progress: TaskProgress;
  tags?: string[];
  metadata: StandardMetadata;
}

export interface TaskInput {
  title: string;
  description: string;
  type: 'action_item' | 'follow_up' | 'preparation' | 'analysis' | 'review' | 'approval';
  source: TaskSource;
  assigned_to: UUID;
  due_date: Date;
  start_date?: Date;
  priority?: UrgentPriority;
  dependencies?: TaskDependency;
  escalation?: EscalationRule[];
  tags?: string[];
}

export interface TaskWithRelations extends Task {
  assigned_to_details?: {
    id: UUID;
    name: string;
    email: string;
    department: string;
  };
  related_entity?: {
    type: string;
    id: UUID;
    title: string;
  };
  parent_tasks?: Array<{
    id: UUID;
    title: string;
    status: TaskStatus;
  }>;
  subtasks?: Array<{
    id: UUID;
    title: string;
    status: TaskStatus;
    assigned_to: string;
  }>;
}