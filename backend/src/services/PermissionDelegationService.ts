import { createClient } from '@supabase/supabase-js';
import { 
  PermissionDelegation, 
  CreatePermissionDelegationDto, 
  UpdatePermissionDelegationDto,
  RevokePermissionDelegationDto,
  PermissionType 
} from '../models/PermissionDelegation';

export class PermissionDelegationService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async delegate(
    grantorId: string,
    dto: CreatePermissionDelegationDto
  ): Promise<PermissionDelegation> {
    // Validate that grantor has the permissions they're trying to delegate
    const hasPermissions = await this.validateGrantorPermissions(
      grantorId,
      dto.resource_type,
      dto.resource_id,
      dto.permissions
    );

    if (!hasPermissions) {
      throw new Error('Cannot delegate permissions you do not have');
    }

    // Check for circular delegations
    const hasCircular = await this.checkCircularDelegation(
      grantorId,
      dto.grantee_id,
      dto.resource_type,
      dto.resource_id
    );

    if (hasCircular) {
      throw new Error('Circular delegation detected');
    }

    const { data, error } = await this.supabase
      .from('permission_delegations')
      .insert({
        grantor_id: grantorId,
        grantee_id: dto.grantee_id,
        resource_type: dto.resource_type,
        resource_id: dto.resource_id,
        permissions: dto.permissions,
        reason: dto.reason,
        valid_from: dto.valid_from,
        valid_until: dto.valid_until,
        revoked: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create delegation: ${error.message}`);
    }

    return data;
  }

  async revoke(
    delegationId: string,
    userId: string
  ): Promise<void> {
    const { data: delegation, error: fetchError } = await this.supabase
      .from('permission_delegations')
      .select('grantor_id')
      .eq('id', delegationId)
      .single();

    if (fetchError || !delegation) {
      throw new Error('Delegation not found');
    }

    // Only grantor or admin can revoke
    if (delegation.grantor_id !== userId) {
      const isAdmin = await this.checkUserIsAdmin(userId);
      if (!isAdmin) {
        throw new Error('Only the grantor can revoke this delegation');
      }
    }

    const { error } = await this.supabase
      .from('permission_delegations')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_by: userId
      })
      .eq('id', delegationId);

    if (error) {
      throw new Error(`Failed to revoke delegation: ${error.message}`);
    }
  }

  async checkDelegatedPermissions(
    userId: string,
    resourceType: string,
    resourceId?: string
  ): Promise<PermissionType[]> {
    const now = new Date().toISOString();

    const query = this.supabase
      .from('permission_delegations')
      .select('permissions')
      .eq('grantee_id', userId)
      .eq('revoked', false)
      .lte('valid_from', now)
      .gte('valid_until', now);

    // Handle 'all' resource type
    if (resourceType !== 'all') {
      query.or(`resource_type.eq.all,resource_type.eq.${resourceType}`);
    }

    if (resourceId) {
      query.or(`resource_id.is.null,resource_id.eq.${resourceId}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check permissions: ${error.message}`);
    }

    // Combine all permissions from active delegations
    const allPermissions = new Set<PermissionType>();
    data?.forEach(delegation => {
      delegation.permissions.forEach((p: PermissionType) => allPermissions.add(p));
    });

    return Array.from(allPermissions);
  }

  async getDelegationsGranted(userId: string): Promise<PermissionDelegation[]> {
    const { data, error } = await this.supabase
      .from('permission_delegations')
      .select('*')
      .eq('grantor_id', userId)
      .eq('revoked', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch granted delegations: ${error.message}`);
    }

    return data || [];
  }

  async getDelegationsReceived(userId: string): Promise<PermissionDelegation[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('permission_delegations')
      .select('*')
      .eq('grantee_id', userId)
      .eq('revoked', false)
      .lte('valid_from', now)
      .gte('valid_until', now)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch received delegations: ${error.message}`);
    }

    return data || [];
  }

  async updateDelegation(
    delegationId: string,
    userId: string,
    updates: UpdatePermissionDelegationDto
  ): Promise<PermissionDelegation> {
    // Verify user can update
    const { data: delegation, error: fetchError } = await this.supabase
      .from('permission_delegations')
      .select('grantor_id')
      .eq('id', delegationId)
      .single();

    if (fetchError || !delegation) {
      throw new Error('Delegation not found');
    }

    if (delegation.grantor_id !== userId) {
      throw new Error('Only the grantor can update this delegation');
    }

    const { data, error } = await this.supabase
      .from('permission_delegations')
      .update(updates)
      .eq('id', delegationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update delegation: ${error.message}`);
    }

    return data;
  }

  async getExpiringDelegations(daysAhead: number = 7): Promise<PermissionDelegation[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await this.supabase
      .from('permission_delegations')
      .select('*')
      .eq('revoked', false)
      .lte('valid_until', futureDate.toISOString())
      .gte('valid_until', new Date().toISOString())
      .order('valid_until', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch expiring delegations: ${error.message}`);
    }

    return data || [];
  }

  private async validateGrantorPermissions(
    grantorId: string,
    resourceType: string,
    resourceId: string | undefined,
    permissions: PermissionType[]
  ): Promise<boolean> {
    // Check if grantor has the permissions they're trying to delegate
    // This would integrate with your main permission system
    const { data, error } = await this.supabase
      .rpc('check_user_permissions', {
        p_user_id: grantorId,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_permissions: permissions
      });

    if (error) {
      console.error('Permission validation error:', error);
      return false;
    }

    return data === true;
  }

  private async checkCircularDelegation(
    grantorId: string,
    granteeId: string,
    resourceType: string,
    resourceId?: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('permission_delegations')
      .select('id, resource_id')
      .eq('grantor_id', granteeId)
      .eq('grantee_id', grantorId)
      .eq('resource_type', resourceType)
      .eq('revoked', false);

    if (error) {
      console.error('Circular check error:', error);
      return false;
    }

    if (!resourceId) {
      return (data?.length || 0) > 0;
    }

    const filtered = data?.filter(
      (d: any) => d.resource_id === resourceId || d.resource_id === null
    );

    return (filtered?.length || 0) > 0;
  }

  private async checkUserIsAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === 'admin' || data.role === 'security_admin';
  }
}

export default PermissionDelegationService;