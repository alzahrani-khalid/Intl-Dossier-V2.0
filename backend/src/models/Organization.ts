/**
 * Organization Model
 * International bodies with membership and obligations
 */

import { UUID, StandardMetadata } from './types';

export interface Membership {
  status: 'member' | 'observer' | 'partner' | 'none';
  joined_date?: Date;
  membership_type?: string;
}

export interface Committee {
  name: string;
  role: string;
  participation_level: 'active' | 'occasional' | 'observer';
}

export interface ReportingRequirement {
  name: string;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'ad_hoc';
  next_due: Date;
  responsible_department: string;
}

export interface Organization {
  id: UUID;
  code: string;                          // Unique identifier (e.g., 'UN', 'WB')
  name_en: string;
  name_ar: string;
  type: 'un_agency' | 'regional' | 'development_bank' | 'research' | 'other';
  parent_org_id?: UUID;                  // For sub-organizations
  headquarters_country: string;
  website: string;
  membership: Membership;
  committees: Committee[];
  reporting_requirements: ReportingRequirement[];
  metadata: StandardMetadata;
}

/**
 * Organization creation/update input
 */
export interface OrganizationInput {
  code: string;
  name_en: string;
  name_ar: string;
  type: 'un_agency' | 'regional' | 'development_bank' | 'research' | 'other';
  parent_org_id?: UUID;
  headquarters_country: string;
  website: string;
  membership?: Membership;
  committees?: Committee[];
  reporting_requirements?: ReportingRequirement[];
}

/**
 * Organization with relationships
 */
export interface OrganizationWithRelations extends Organization {
  parent_organization?: {
    id: UUID;
    code: string;
    name_en: string;
    name_ar: string;
  };
  sub_organizations?: Array<{
    id: UUID;
    code: string;
    name_en: string;
    name_ar: string;
    type: string;
  }>;
  countries?: Array<{
    id: UUID;
    code: string;
    name_en: string;
    relationship_type: string;
  }>;
}