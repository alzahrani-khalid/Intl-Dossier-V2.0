import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

type Organization = Database['public']['Tables']['organizations']['Row'];

export interface OrganizationNode extends Organization {
  children?: OrganizationNode[];
  level: number;
  path: string[];
}

export interface HierarchyOptions {
  maxDepth?: number;
  includeInactive?: boolean;
  expandAll?: boolean;
}

export class OrganizationHierarchyService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private cache: Map<string, OrganizationNode> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async getFullHierarchy(options: HierarchyOptions = {}): Promise<OrganizationNode[]> {
    const {
      maxDepth = 10,
      includeInactive = false,
      expandAll = false
    } = options;

    // Fetch all organizations
    let query = this.supabase
      .from('organizations')
      .select('*')
      .order('name_en');

    if (!includeInactive) {
      query = query.in('status', ['active', 'pending']);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    // Build hierarchy
    return this.buildHierarchy(data || [], null, 0, maxDepth, [], expandAll);
  }

  private buildHierarchy(
    organizations: Organization[],
    parentId: string | null,
    currentLevel: number,
    maxDepth: number,
    path: string[],
    expandAll: boolean
  ): OrganizationNode[] {
    if (currentLevel >= maxDepth) {
      return [];
    }

    const children = organizations.filter(org => 
      org.parent_organization_id === parentId
    );

    return children.map(org => {
      const nodePath = [...path, org.id];
      const node: OrganizationNode = {
        ...org,
        level: currentLevel,
        path: nodePath
      };

      if (expandAll || currentLevel < 2) {
        node.children = this.buildHierarchy(
          organizations,
          org.id,
          currentLevel + 1,
          maxDepth,
          nodePath,
          expandAll
        );
      }

      this.cache.set(org.id, node);
      return node;
    });
  }

  async getOrganizationPath(organizationId: string): Promise<Organization[]> {
    const path: Organization[] = [];
    let currentId: string | null = organizationId;

    while (currentId) {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', currentId)
        .single();

      if (error || !data) {
        break;
      }

      path.unshift(data);
      currentId = data.parent_organization_id;
    }

    return path;
  }

  async getChildren(
    parentId: string,
    recursive: boolean = false,
    maxDepth: number = 10
  ): Promise<OrganizationNode[]> {
    if (!recursive) {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('parent_organization_id', parentId)
        .order('name_en');

      if (error) {
        throw new Error(`Failed to fetch children: ${error.message}`);
      }

      return (data || []).map(org => ({
        ...org,
        level: 0,
        path: [org.id]
      }));
    }

    // Recursive fetch
    const allOrgs = await this.getAllOrganizations();
    return this.buildHierarchy(allOrgs, parentId, 0, maxDepth, [], true);
  }

  async getSiblings(organizationId: string): Promise<Organization[]> {
    // First get the organization to find its parent
    const { data: org, error: orgError } = await this.supabase
      .from('organizations')
      .select('parent_organization_id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    // Then get all siblings (including self)
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('parent_organization_id', org.parent_organization_id || 'null')
      .order('name_en');

    if (error) {
      throw new Error(`Failed to fetch siblings: ${error.message}`);
    }

    // Filter out the current organization
    return (data || []).filter(sibling => sibling.id !== organizationId);
  }

  async getAncestors(organizationId: string): Promise<Organization[]> {
    const path = await this.getOrganizationPath(organizationId);
    // Remove the organization itself, keeping only ancestors
    return path.slice(0, -1);
  }

  async getDescendants(
    organizationId: string,
    maxDepth: number = 10
  ): Promise<OrganizationNode[]> {
    const allOrgs = await this.getAllOrganizations();
    const descendants: OrganizationNode[] = [];

    const collectDescendants = (
      parentId: string,
      level: number,
      path: string[]
    ): void => {
      if (level >= maxDepth) return;

      const children = allOrgs.filter(org => 
        org.parent_organization_id === parentId
      );

      children.forEach(child => {
        const nodePath = [...path, child.id];
        const node: OrganizationNode = {
          ...child,
          level,
          path: nodePath,
          children: []
        };

        descendants.push(node);
        collectDescendants(child.id, level + 1, nodePath);
      });
    };

    collectDescendants(organizationId, 0, [organizationId]);
    return descendants;
  }

  async getRootOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .is('parent_organization_id', null)
      .eq('status', 'active')
      .order('name_en');

    if (error) {
      throw new Error(`Failed to fetch root organizations: ${error.message}`);
    }

    return data || [];
  }

  async moveOrganization(
    organizationId: string,
    newParentId: string | null
  ): Promise<Organization> {
    // Check for circular reference
    if (newParentId) {
      const descendants = await this.getDescendants(organizationId);
      if (descendants.some(d => d.id === newParentId)) {
        throw new Error('Cannot move organization to its own descendant');
      }
    }

    const { data, error } = await this.supabase
      .from('organizations')
      .update({ parent_organization_id: newParentId })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to move organization: ${error.message}`);
    }

    this.cache.clear(); // Clear cache after structural change
    return data;
  }

  async getOrganizationStats(organizationId: string): Promise<any> {
    const [
      descendants,
      { data: mous },
      { data: events }
    ] = await Promise.all([
      this.getDescendants(organizationId),
      this.supabase
        .from('mous')
        .select('id', { count: 'exact', head: true })
        .or(`primary_party_id.eq.${organizationId},secondary_party_id.eq.${organizationId}`),
      this.supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', organizationId)
    ]);

    return {
      totalDescendants: descendants.length,
      directChildren: descendants.filter(d => d.level === 0).length,
      maxDepth: Math.max(0, ...descendants.map(d => d.level)),
      relatedMous: mous?.count || 0,
      organizedEvents: events?.count || 0
    };
  }

  async searchInHierarchy(
    searchTerm: string,
    parentId?: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<OrganizationNode[]> {
    const column = language === 'en' ? 'name_en' : 'name_ar';
    
    let query = this.supabase
      .from('organizations')
      .select('*')
      .ilike(column, `%${searchTerm}%`);

    if (parentId) {
      // Get all descendants of parentId first
      const descendants = await this.getDescendants(parentId);
      const descendantIds = descendants.map(d => d.id);
      descendantIds.push(parentId); // Include parent itself
      
      query = query.in('id', descendantIds);
    }

    const { data, error } = await query.order(column);

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Get paths for each result
    const results = await Promise.all(
      (data || []).map(async (org) => {
        const path = await this.getOrganizationPath(org.id);
        return {
          ...org,
          level: path.length - 1,
          path: path.map(p => p.id)
        } as OrganizationNode;
      })
    );

    return results;
  }

  private async getAllOrganizations(): Promise<Organization[]> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch all organizations: ${error.message}`);
    }

    return data || [];
  }

  async validateHierarchy(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const allOrgs = await this.getAllOrganizations();
    
    // Check for circular references
    for (const org of allOrgs) {
      if (org.parent_organization_id) {
        const path = new Set<string>();
        let current = org;
        
        while (current.parent_organization_id) {
          if (path.has(current.id)) {
            errors.push(`Circular reference detected for organization ${org.name_en}`);
            break;
          }
          path.add(current.id);
          
          const parent = allOrgs.find(o => o.id === current.parent_organization_id);
          if (!parent) {
            errors.push(`Orphaned organization ${org.name_en} - parent not found`);
            break;
          }
          current = parent;
        }
      }
    }

    // Check for orphaned organizations (parent_id exists but parent doesn't)
    const orgIds = new Set(allOrgs.map(o => o.id));
    for (const org of allOrgs) {
      if (org.parent_organization_id && !orgIds.has(org.parent_organization_id)) {
        errors.push(`Organization ${org.name_en} references non-existent parent`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export factory function
export function createOrganizationHierarchyService(
  supabaseUrl: string,
  supabaseKey: string
): OrganizationHierarchyService {
  return new OrganizationHierarchyService(supabaseUrl, supabaseKey);
}