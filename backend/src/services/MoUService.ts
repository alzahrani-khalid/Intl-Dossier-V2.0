import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';

interface MoU {
  id: string;
  reference_number: string;
  title_en: string;
  title_ar: string;
  type: 'bilateral' | 'multilateral' | 'framework' | 'technical' | 'cooperation';
  status: 'draft' | 'negotiation' | 'signed' | 'active' | 'expired' | 'terminated' | 'renewed';
  parties: Array<{
    type: 'country' | 'organization';
    country_id?: string;
    organization_id?: string;
    role: 'primary' | 'secondary';
    signed_date?: Date;
    signatory_name?: string;
    signatory_position?: string;
  }>;
  thematic_areas: string[];
  objectives_en?: string;
  objectives_ar?: string;
  scope_en?: string;
  scope_ar?: string;
  sign_date?: Date;
  effective_date?: Date;
  expiry_date?: Date;
  duration_months?: number;
  auto_renewal: boolean;
  renewal_notice_days?: number;
  deliverables: Array<{
    id: string;
    title_en: string;
    title_ar?: string;
    description_en?: string;
    description_ar?: string;
    responsible_party: string;
    due_date: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
    completion_date?: Date;
    completion_percentage?: number;
    notes?: string;
    attachments?: string[];
  }>;
  financial_implications?: {
    has_financial: boolean;
    estimated_value?: number;
    currency?: string;
    payment_terms?: string;
    budget_allocated?: boolean;
  };
  performance_metrics?: Array<{
    metric_name: string;
    target_value: number;
    current_value: number;
    unit: string;
    measurement_frequency: string;
  }>;
  alerts: Array<{
    type: 'expiry' | 'renewal' | 'deliverable' | 'review';
    date: Date;
    days_before: number;
    recipients: string[];
    sent: boolean;
  }>;
  documents: string[];
  notes?: string;
  metadata?: Record<string, any>;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface MoUTransition {
  from_status: MoU['status'];
  to_status: MoU['status'];
  allowed: boolean;
  conditions?: string[];
  required_fields?: string[];
}

interface MoUSearchParams {
  query?: string;
  type?: MoU['type'];
  status?: MoU['status'] | MoU['status'][];
  party_id?: string;
  party_type?: 'country' | 'organization';
  thematic_area?: string;
  expiring_days?: number;
  has_deliverables_due?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

const MOU_COLUMNS = 'id, reference_number, title_en, title_ar, description_en, description_ar, workflow_state, primary_party_id, secondary_party_id, document_url, document_version, signing_date, effective_date, expiry_date, auto_renewal, renewal_period_months, owner_id, created_at, updated_at';

export class MoUService {
  private readonly cachePrefix = 'mou:';
  private readonly cacheTTL = 1800; // 30 minutes

  // State transition rules
  private readonly stateTransitions: MoUTransition[] = [
    { from_status: 'draft', to_status: 'negotiation', allowed: true },
    { from_status: 'draft', to_status: 'terminated', allowed: true },
    { from_status: 'negotiation', to_status: 'signed', allowed: true, required_fields: ['sign_date', 'parties'] },
    { from_status: 'negotiation', to_status: 'draft', allowed: true },
    { from_status: 'negotiation', to_status: 'terminated', allowed: true },
    { from_status: 'signed', to_status: 'active', allowed: true, required_fields: ['effective_date'] },
    { from_status: 'signed', to_status: 'terminated', allowed: true },
    { from_status: 'active', to_status: 'expired', allowed: true },
    { from_status: 'active', to_status: 'renewed', allowed: true },
    { from_status: 'active', to_status: 'terminated', allowed: true },
    { from_status: 'expired', to_status: 'renewed', allowed: true },
    { from_status: 'expired', to_status: 'terminated', allowed: true },
    { from_status: 'renewed', to_status: 'active', allowed: true }
  ];

  /**
   * Get all MoUs with filters
   */
  async getMoUs(params: MoUSearchParams = {}): Promise<{
    data: MoU[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const {
        query,
        type,
        status,
        party_id,
        party_type,
        thematic_area,
        expiring_days,
        has_deliverables_due,
        page = 1,
        limit = 50,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = params;

      // Check cache
      const cacheKey = `${this.cachePrefix}list:${JSON.stringify(params)}`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) {
        return cached as any;
      }

      // Build query
      let queryBuilder = supabaseAdmin
        .from('mous')
        .select(MOU_COLUMNS, { count: 'exact' });

      // Apply filters
      if (query) {
        queryBuilder = queryBuilder.or(
          `title_en.ilike.%${query}%,title_ar.ilike.%${query}%,reference_number.ilike.%${query}%`
        );
      }

      if (type) {
        queryBuilder = queryBuilder.eq('type', type);
      }

      if (status) {
        if (Array.isArray(status)) {
          queryBuilder = queryBuilder.in('status', status);
        } else {
          queryBuilder = queryBuilder.eq('status', status);
        }
      }

      if (party_id && party_type) {
        const partyField = party_type === 'country' ? 'country_id' : 'organization_id';
        queryBuilder = queryBuilder.contains('parties', [{ [partyField]: party_id }]);
      }

      if (thematic_area) {
        queryBuilder = queryBuilder.contains('thematic_areas', [thematic_area]);
      }

      if (expiring_days) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiring_days);
        queryBuilder = queryBuilder
          .lte('expiry_date', expiryDate.toISOString())
          .gte('expiry_date', new Date().toISOString())
          .in('status', ['active', 'signed']);
      }

      // Apply sorting
      queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await queryBuilder;

      if (error) {
        throw error;
      }

      const result = {
        data: data || [],
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit)
      };

      // Cache result
      await cacheHelpers.set(cacheKey, result, this.cacheTTL);

      logInfo(`Retrieved ${data?.length || 0} MoUs`);
      return result;
    } catch (error) {
      logError('Error fetching MoUs', error as Error);
      throw error;
    }
  }

  /**
   * Get MoU by ID
   */
  async getMoUById(id: string): Promise<MoU | null> {
    try {
      // Check cache
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await cacheHelpers.get<MoU>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabaseAdmin
        .from('mous')
        .select(MOU_COLUMNS)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Cache result
      if (data) {
        await cacheHelpers.set(cacheKey, data, this.cacheTTL);
      }

      return data;
    } catch (error) {
      logError(`Error fetching MoU ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Create MoU
   */
  async createMoU(mouData: Partial<MoU>): Promise<MoU> {
    try {
      const { data, error } = await supabaseAdmin
        .from('mous')
        .insert({
          ...mouData,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(MOU_COLUMNS)
        .single();

      if (error) {
        throw error;
      }

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('MoU created', { mouId: data.id });
      return data;
    } catch (error) {
      logError('Error creating MoU', error as Error);
      throw error;
    }
  }

  /**
   * Update MoU
   */
  async updateMoU(id: string, updates: Partial<MoU>): Promise<MoU> {
    try {
      const { data, error } = await supabaseAdmin
        .from('mous')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(MOU_COLUMNS)
        .single();

      if (error) {
        throw error;
      }

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`);
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('MoU updated', { mouId: id });
      return data;
    } catch (error) {
      logError(`Error updating MoU ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete MoU
   */
  async deleteMoU(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('mous')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Invalidate cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`);
      await cacheHelpers.del(`${this.cachePrefix}list:*`);

      logInfo('MoU deleted', { mouId: id });
      return true;
    } catch (error) {
      logError(`Error deleting MoU ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  validateTransition(currentStatus: MoU['status'], newStatus: MoU['status']): boolean {
    const transition = this.stateTransitions.find(
      t => t.from_status === currentStatus && t.to_status === newStatus
    );
    return transition?.allowed || false;
  }

  /**
   * Transition MoU status
   */
  async transitionStatus(
    id: string,
    newStatus: MoU['status'],
    notes?: string
  ): Promise<MoU> {
    try {
      // Get current MoU
      const currentMoU = await this.getMoUById(id);
      if (!currentMoU) {
        throw new Error('MoU not found');
      }

      // Validate transition
      if (!this.validateTransition(currentMoU.status, newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentMoU.status} to ${newStatus}`
        );
      }

      // Update status
      const updatedMoU = await this.updateMoU(id, {
        status: newStatus,
        notes: notes || currentMoU.notes
      });

      logInfo('MoU status transitioned', {
        mouId: id,
        from: currentMoU.status,
        to: newStatus
      });

      return updatedMoU;
    } catch (error) {
      logError(`Error transitioning MoU status ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Get expiring MoUs
   */
  async getExpiringMoUs(days: number = 30): Promise<MoU[]> {
    try {
      const cacheKey = `${this.cachePrefix}expiring:${days}`;
      const cached = await cacheHelpers.get<MoU[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const { data, error } = await supabaseAdmin
        .from('mous')
        .select(MOU_COLUMNS)
        .lte('expiry_date', expiryDate.toISOString())
        .gte('expiry_date', new Date().toISOString())
        .in('status', ['active', 'signed'])
        .order('expiry_date');

      if (error) {
        throw error;
      }

      await cacheHelpers.set(cacheKey, data || [], 3600); // Cache for 1 hour
      return data || [];
    } catch (error) {
      logError('Error fetching expiring MoUs', error as Error);
      throw error;
    }
  }

  /**
   * Get MoU statistics
   */
  async getStatistics(): Promise<{
    total: number;
    draft: number;
    active: number;
    expired: number;
    expiring_soon: number;
  }> {
    try {
      const cacheKey = `${this.cachePrefix}statistics`;
      const cached = await cacheHelpers.get(cacheKey);
      if (cached) {
        return cached;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const [totalResult, draftResult, activeResult, expiredResult, expiringSoonResult] = await Promise.all([
        supabaseAdmin.from('mous').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('mous').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabaseAdmin.from('mous').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabaseAdmin.from('mous').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
        supabaseAdmin
          .from('mous')
          .select('id', { count: 'exact', head: true })
          .lte('expiry_date', expiryDate.toISOString())
          .gte('expiry_date', new Date().toISOString())
          .in('status', ['active', 'signed'])
      ]);

      const stats = {
        total: totalResult.count || 0,
        draft: draftResult.count || 0,
        active: activeResult.count || 0,
        expired: expiredResult.count || 0,
        expiring_soon: expiringSoonResult.count || 0
      };

      await cacheHelpers.set(cacheKey, stats, 300); // Cache for 5 minutes
      return stats;
    } catch (error) {
      logError('Error fetching MoU statistics', error as Error);
      throw error;
    }
  }

  // Methods for API compatibility
  async findAll(params?: MoUSearchParams) {
    return this.getMoUs(params);
  }

  async findById(id: string) {
    return this.getMoUById(id);
  }

  async create(mou: Partial<MoU>) {
    return this.createMoU(mou);
  }

  async update(id: string, updates: Partial<MoU>) {
    return this.updateMoU(id, updates);
  }

  async delete(id: string) {
    return this.deleteMoU(id);
  }
}

export default MoUService;
