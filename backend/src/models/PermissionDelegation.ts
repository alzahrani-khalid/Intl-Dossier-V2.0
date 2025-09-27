export interface PermissionDelegation {
  id: string;
  grantor_id: string;
  grantee_id: string;
  resource_type: 'dossier' | 'mou' | 'all';
  resource_id?: string;
  permissions: string[];
  reason: string;
  valid_from: Date;
  valid_until: Date;
  revoked: boolean;
  revoked_at?: Date;
  revoked_by?: string;
  created_at: Date;
}

export type PermissionType = 'read' | 'write' | 'delete' | 'approve';

export interface CreatePermissionDelegationDto {
  grantee_id: string;
  resource_type: 'dossier' | 'mou' | 'all';
  resource_id?: string;
  permissions: PermissionType[];
  reason: string;
  valid_from: Date;
  valid_until: Date;
}

export interface UpdatePermissionDelegationDto {
  permissions?: PermissionType[];
  valid_until?: Date;
  reason?: string;
}

export interface RevokePermissionDelegationDto {
  revoked_by: string;
  revoked_at?: Date;
}

export class PermissionDelegationModel {
  static tableName = 'permission_delegations';

  static validate(delegation: Partial<PermissionDelegation>): boolean {
    if (!delegation.grantor_id || !delegation.grantee_id) {
      return false;
    }

    if (!delegation.resource_type) {
      return false;
    }

    if (!delegation.permissions || delegation.permissions.length === 0) {
      return false;
    }

    if (!delegation.valid_from || !delegation.valid_until) {
      return false;
    }

    if (new Date(delegation.valid_from) >= new Date(delegation.valid_until)) {
      return false;
    }

    return true;
  }

  static isActive(delegation: PermissionDelegation): boolean {
    if (delegation.revoked) {
      return false;
    }

    const now = new Date();
    return now >= new Date(delegation.valid_from) && 
           now <= new Date(delegation.valid_until);
  }

  static hasPermission(
    delegation: PermissionDelegation, 
    permission: PermissionType
  ): boolean {
    if (!this.isActive(delegation)) {
      return false;
    }

    return delegation.permissions.includes(permission);
  }

  static canAccessResource(
    delegation: PermissionDelegation,
    resourceType: string,
    resourceId?: string
  ): boolean {
    if (!this.isActive(delegation)) {
      return false;
    }

    if (delegation.resource_type === 'all') {
      return true;
    }

    if (delegation.resource_type !== resourceType) {
      return false;
    }

    if (delegation.resource_id && resourceId) {
      return delegation.resource_id === resourceId;
    }

    return !delegation.resource_id;
  }
}

export default PermissionDelegationModel;