import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  type: 'project' | 'initiative' | 'committee' | 'temporary';
  members: Array<{
    user_id: string;
    role: 'owner' | 'admin' | 'contributor' | 'viewer';
    joined_at: string;
  }>;
  resources: Array<{
    type: 'dossier' | 'document' | 'mou' | 'task';
    id: string;
    added_by: string;
    added_at: string;
  }>;
  activity_feed: Array<{
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    timestamp: string;
  }>;
  settings: {
    visibility: 'private' | 'internal' | 'public';
    auto_archive_days: number;
  };
  active: boolean;
  created_at: string;
  archived_at?: string;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
  type: 'project' | 'initiative' | 'committee' | 'temporary';
  settings: {
    visibility: 'private' | 'internal' | 'public';
    auto_archive_days: number;
  };
}

export interface UpdateWorkspaceDto extends Partial<CreateWorkspaceDto> {
  active?: boolean;
}

export interface WorkspaceSearchParams {
  type?: string;
  visibility?: string;
  active?: boolean;
  member_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class WorkspaceService {
  private readonly cachePrefix = 'workspace:';
  private readonly cacheTTL = 1800; // 30 minutes

  /**
   * Get all workspaces with filters
   */
  async findAll(params: WorkspaceSearchParams = {}): Promise<{ data: Workspace[]; total: number }> {
    try {
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify(params)}`;
      const cached = await cacheHelpers.get<{ data: Workspace[]; total: number }>(cacheKey);
      if (cached) return cached;

      let query = supabaseAdmin
        .from('workspaces')
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `);

      // Apply filters
      if (params.type) {
        query = query.eq('type', params.type);
      }
      if (params.visibility) {
        query = query.eq('settings->visibility', params.visibility);
      }
      if (params.active !== undefined) {
        query = query.eq('active', params.active);
      }
      if (params.member_id) {
        query = query.contains('members', [{ user_id: params.member_id }]);
      }
      if (params.search) {
        query = query.or(`
          name.ilike.%${params.search}%,
          description.ilike.%${params.search}%
        `);
      }

      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const result = {
        data: data || [],
        total: count || 0
      };

      await cacheHelpers.set(cacheKey, result, this.cacheTTL);
      return result;
    } catch (error) {
      logError('WorkspaceService.findAll error', error as Error);
      throw error;
    }
  }

  /**
   * Get workspace by ID
   */
  async findById(id: string): Promise<Workspace | null> {
    try {
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await cacheHelpers.get<Workspace>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      return data;
    } catch (error) {
      logError('WorkspaceService.findById error', error as Error);
      throw error;
    }
  }

  /**
   * Create new workspace
   */
  async create(workspaceData: CreateWorkspaceDto, createdBy: string): Promise<Workspace> {
    try {
      const workspace = {
        ...workspaceData,
        members: [{
          user_id: createdBy,
          role: 'owner',
          joined_at: new Date().toISOString()
        }],
        resources: [],
        activity_feed: [],
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .insert(workspace)
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('Workspace created', { workspaceId: data.id, createdBy });
      return data;
    } catch (error) {
      logError('WorkspaceService.create error', error as Error);
      throw error;
    }
  }

  /**
   * Update workspace
   */
  async update(id: string, updates: UpdateWorkspaceDto, updatedBy: string): Promise<Workspace> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .single();

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Workspace updated', { workspaceId: id, updatedBy });
      return data;
    } catch (error) {
      logError('WorkspaceService.update error', error as Error);
      throw error;
    }
  }

  /**
   * Delete workspace (soft delete)
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('workspaces')
        .update({
          active: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${id}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Workspace deleted', { workspaceId: id, deletedBy });
      return true;
    } catch (error) {
      logError('WorkspaceService.delete error', error as Error);
      throw error;
    }
  }

  /**
   * Add member to workspace
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: 'admin' | 'contributor' | 'viewer',
    addedBy: string
  ): Promise<Workspace> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      // Check if user is already a member
      const existingMember = workspace.members.find(m => m.user_id === userId);
      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }

      const newMember = {
        user_id: userId,
        role,
        joined_at: new Date().toISOString()
      };

      const updatedMembers = [...workspace.members, newMember];

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update({
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .single();

      if (error) throw error;

      // Add to activity feed
      await this.addActivity(workspaceId, {
        user_id: addedBy,
        action: 'member_added',
        entity_type: 'user',
        entity_id: userId,
        timestamp: new Date().toISOString()
      });

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${workspaceId}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Member added to workspace', { workspaceId, userId, role, addedBy });
      return data;
    } catch (error) {
      logError('WorkspaceService.addMember error', error as Error);
      throw error;
    }
  }

  /**
   * Remove member from workspace
   */
  async removeMember(
    workspaceId: string,
    userId: string,
    removedBy: string
  ): Promise<Workspace> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      // Check if user is the owner
      const owner = workspace.members.find(m => m.role === 'owner');
      if (owner && owner.user_id === userId) {
        throw new Error('Cannot remove workspace owner');
      }

      const updatedMembers = workspace.members.filter(m => m.user_id !== userId);

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update({
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .single();

      if (error) throw error;

      // Add to activity feed
      await this.addActivity(workspaceId, {
        user_id: removedBy,
        action: 'member_removed',
        entity_type: 'user',
        entity_id: userId,
        timestamp: new Date().toISOString()
      });

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${workspaceId}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Member removed from workspace', { workspaceId, userId, removedBy });
      return data;
    } catch (error) {
      logError('WorkspaceService.removeMember error', error as Error);
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: 'admin' | 'contributor' | 'viewer',
    updatedBy: string
  ): Promise<Workspace> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      // Check if user is the owner
      const owner = workspace.members.find(m => m.role === 'owner');
      if (owner && owner.user_id === userId) {
        throw new Error('Cannot change workspace owner role');
      }

      const updatedMembers = workspace.members.map(member =>
        member.user_id === userId
          ? { ...member, role: newRole }
          : member
      );

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update({
          members: updatedMembers,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .single();

      if (error) throw error;

      // Add to activity feed
      await this.addActivity(workspaceId, {
        user_id: updatedBy,
        action: 'member_role_updated',
        entity_type: 'user',
        entity_id: userId,
        timestamp: new Date().toISOString()
      });

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${workspaceId}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Member role updated', { workspaceId, userId, newRole, updatedBy });
      return data;
    } catch (error) {
      logError('WorkspaceService.updateMemberRole error', error as Error);
      throw error;
    }
  }

  /**
   * Add resource to workspace
   */
  async addResource(
    workspaceId: string,
    resource: {
      type: 'dossier' | 'document' | 'mou' | 'task';
      id: string;
    },
    addedBy: string
  ): Promise<Workspace> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      const newResource = {
        ...resource,
        added_by: addedBy,
        added_at: new Date().toISOString()
      };

      const updatedResources = [...workspace.resources, newResource];

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update({
          resources: updatedResources,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .single();

      if (error) throw error;

      // Add to activity feed
      await this.addActivity(workspaceId, {
        user_id: addedBy,
        action: 'resource_added',
        entity_type: resource.type,
        entity_id: resource.id,
        timestamp: new Date().toISOString()
      });

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${workspaceId}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Resource added to workspace', { workspaceId, resource, addedBy });
      return data;
    } catch (error) {
      logError('WorkspaceService.addResource error', error as Error);
      throw error;
    }
  }

  /**
   * Remove resource from workspace
   */
  async removeResource(
    workspaceId: string,
    resourceId: string,
    removedBy: string
  ): Promise<Workspace> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      const updatedResources = workspace.resources.filter(r => r.id !== resourceId);

      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .update({
          resources: updatedResources,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .single();

      if (error) throw error;

      // Add to activity feed
      await this.addActivity(workspaceId, {
        user_id: removedBy,
        action: 'resource_removed',
        entity_type: 'resource',
        entity_id: resourceId,
        timestamp: new Date().toISOString()
      });

      // Invalidate cache
      await cacheHelpers.del([
        `${this.cachePrefix}${workspaceId}`,
        `${this.cachePrefix}list:*`
      ]);

      logInfo('Resource removed from workspace', { workspaceId, resourceId, removedBy });
      return data;
    } catch (error) {
      logError('WorkspaceService.removeResource error', error as Error);
      throw error;
    }
  }

  /**
   * Add activity to workspace feed
   */
  async addActivity(
    workspaceId: string,
    activity: {
      user_id: string;
      action: string;
      entity_type: string;
      entity_id: string;
      timestamp: string;
    }
  ): Promise<void> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      const updatedActivityFeed = [...workspace.activity_feed, activity];

      // Keep only last 100 activities
      const trimmedActivityFeed = updatedActivityFeed.slice(-100);

      await supabaseAdmin
        .from('workspaces')
        .update({
          activity_feed: trimmedActivityFeed,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId);

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}${workspaceId}`);
    } catch (error) {
      logError('WorkspaceService.addActivity error', error as Error);
      throw error;
    }
  }

  /**
   * Get workspaces for user
   */
  async findByUser(userId: string): Promise<Workspace[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .select(`
          *,
          workspace_members:workspace_members(
            user_id,
            role,
            joined_at,
            user:users(name_en, name_ar, email)
          )
        `)
        .contains('members', [{ user_id: userId }])
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError('WorkspaceService.findByUser error', error as Error);
      throw error;
    }
  }

  /**
   * Check if user has permission in workspace
   */
  async checkPermission(
    workspaceId: string,
    userId: string,
    permission: 'read' | 'write' | 'admin'
  ): Promise<boolean> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) return false;

      const member = workspace.members.find(m => m.user_id === userId);
      if (!member) return false;

      const rolePermissions = {
        owner: ['read', 'write', 'admin'],
        admin: ['read', 'write', 'admin'],
        contributor: ['read', 'write'],
        viewer: ['read']
      };

      const userPermissions = rolePermissions[member.role as keyof typeof rolePermissions] || [];
      return userPermissions.includes(permission);
    } catch (error) {
      logError('WorkspaceService.checkPermission error', error as Error);
      return false;
    }
  }

  /**
   * Get workspace statistics
   */
  async getStatistics(workspaceId: string): Promise<{
    total_members: number;
    total_resources: number;
    recent_activities: number;
    by_resource_type: Record<string, number>;
    by_member_role: Record<string, number>;
  }> {
    try {
      const workspace = await this.findById(workspaceId);
      if (!workspace) throw new Error('Workspace not found');

      const byResourceType: Record<string, number> = {};
      const byMemberRole: Record<string, number> = {};

      workspace.resources.forEach(resource => {
        byResourceType[resource.type] = (byResourceType[resource.type] || 0) + 1;
      });

      workspace.members.forEach(member => {
        byMemberRole[member.role] = (byMemberRole[member.role] || 0) + 1;
      });

      // Count recent activities (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivities = workspace.activity_feed.filter(activity =>
        new Date(activity.timestamp) > sevenDaysAgo
      ).length;

      return {
        total_members: workspace.members.length,
        total_resources: workspace.resources.length,
        recent_activities: recentActivities,
        by_resource_type: byResourceType,
        by_member_role: byMemberRole
      };
    } catch (error) {
      logError('WorkspaceService.getStatistics error', error as Error);
      throw error;
    }
  }
}

export default WorkspaceService;
