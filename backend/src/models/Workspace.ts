/**
 * Workspace Model
 * Collaborative spaces for projects and initiatives
 */

import { UUID, StandardMetadata } from './types';

export interface WorkspaceMember {
  user_id: UUID;
  role: 'owner' | 'admin' | 'contributor' | 'viewer';
  joined_at: Date;
  active: boolean;
  permissions?: string[];
}

export interface WorkspaceResource {
  type: 'dossier' | 'document' | 'mou' | 'task' | 'brief' | 'link';
  id?: UUID;
  title: string;
  url?: string;
  added_by: UUID;
  added_at: Date;
  pinned?: boolean;
}

export interface WorkspaceActivity {
  user_id: UUID;
  action: string;
  entity_type?: string;
  entity_id?: UUID;
  details?: string;
  timestamp: Date;
}

export interface WorkspaceSettings {
  visibility: 'private' | 'internal' | 'public';
  auto_archive_days?: number;
  notification_preferences?: {
    new_members: boolean;
    new_resources: boolean;
    task_updates: boolean;
    daily_digest: boolean;
  };
  allowed_file_types?: string[];
  max_file_size_mb?: number;
}

export interface Workspace {
  id: UUID;
  name: string;
  type: 'project' | 'committee' | 'initiative' | 'temporary' | 'permanent';
  purpose: string;
  description?: string;
  owner_department: string;
  members: WorkspaceMember[];
  related_entities?: Array<{
    type: string;
    id: UUID;
    relationship: string;
  }>;
  resources: WorkspaceResource[];
  activity_stream: WorkspaceActivity[];
  settings: WorkspaceSettings;
  status: 'active' | 'paused' | 'archived' | 'completed';
  start_date?: Date;
  end_date?: Date;
  tags?: string[];
  metadata: StandardMetadata;
}

export interface WorkspaceInput {
  name: string;
  type: 'project' | 'committee' | 'initiative' | 'temporary' | 'permanent';
  purpose: string;
  description?: string;
  owner_department: string;
  members?: Omit<WorkspaceMember, 'joined_at'>[];
  settings?: WorkspaceSettings;
  start_date?: Date;
  end_date?: Date;
  tags?: string[];
}

export interface WorkspaceWithRelations extends Workspace {
  members_details?: Array<{
    user_id: UUID;
    name: string;
    email: string;
    department: string;
    role: string;
    active: boolean;
  }>;
  active_tasks?: Array<{
    id: UUID;
    title: string;
    status: string;
    assigned_to: string;
    due_date: Date;
  }>;
  recent_documents?: Array<{
    id: UUID;
    title: string;
    type: string;
    uploaded_at: Date;
    uploaded_by: string;
  }>;
  related_mous?: Array<{
    id: UUID;
    reference_number: string;
    title_en: string;
    status: string;
  }>;
}