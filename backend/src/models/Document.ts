/**
 * Document Model
 * Manages files, versions, and access control
 */

import { UUID, StandardMetadata, Classification, Language } from './types';

export interface FileInfo {
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  storage_url?: string;
  checksum?: string;
}

export interface VersionInfo {
  version_number: number;
  previous_version_id?: UUID;
  changes_summary?: string;
  versioned_by: UUID;
  versioned_at: Date;
}

export interface AccessControl {
  classification: Classification;
  access_groups?: string[];
  restricted_users?: UUID[];
  expiry_date?: Date;
  watermark_required?: boolean;
}

export interface RetentionPolicy {
  retention_period_days: number;
  disposal_date?: Date;
  legal_hold?: boolean;
  archival_required?: boolean;
}

export interface AccessLogEntry {
  user_id: UUID;
  accessed_at: Date;
  action: 'view' | 'download' | 'edit' | 'print' | 'share';
  ip_address?: string;
}

export interface Document {
  id: UUID;
  title: string;
  type: 'agreement' | 'report' | 'presentation' | 'correspondence' |
        'position_paper' | 'minutes' | 'brief' | 'other';
  file_info: FileInfo;
  version: VersionInfo;
  language: Language;
  related_entities: Array<{
    entity_type: string;
    entity_id: UUID;
  }>;
  tags: string[];
  access_control: AccessControl;
  retention: RetentionPolicy;
  access_log: AccessLogEntry[];
  metadata: StandardMetadata;
}

export interface DocumentInput {
  title: string;
  type: 'agreement' | 'report' | 'presentation' | 'correspondence' |
        'position_paper' | 'minutes' | 'brief' | 'other';
  file_info?: Partial<FileInfo>;
  language?: Language;
  related_entities?: Array<{
    entity_type: string;
    entity_id: UUID;
  }>;
  tags?: string[];
  classification?: Classification;
  retention_period_days?: number;
}

export interface DocumentWithRelations extends Document {
  related_mous?: Array<{
    id: UUID;
    reference_number: string;
    title_en: string;
  }>;
  signatures?: Array<{
    request_id: UUID;
    status: string;
    signed_at?: Date;
  }>;
  shared_with?: Array<{
    user_id: UUID;
    user_name: string;
    shared_at: Date;
  }>;
}