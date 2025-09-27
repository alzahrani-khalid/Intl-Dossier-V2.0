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
        .select('*', { count: 'exact' });

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

      // Filter by deliverables due if requested
      let filteredData = data || [];
      if (has_deliverables_due && filteredData.length > 0) {
        const now = new Date();
        filteredData = filteredData.filter(mou =>
          mou.deliverables?.some((d: any) =>
            d.status !== 'completed' && new Date(d.due_date) <= now
          )
        );
      }

      const result = {
        data: filteredData,
        total: count || 0,
        page,
        pages: Math.ceil((count || 0) / limit)
      };

      // Cache result
      await cacheHelpers.set(cacheKey, result, this.cacheTTL);

      logInfo(`Retrieved ${filteredData.length} MoUs`);
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
      const cacheKey = `${this.cachePrefix}${id}`;
      const cached = await cacheHelpers.get<MoU>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabaseAdmin
        .from('mous')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

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
  async createMoU(mouData: Partial<MoU>, createdBy: string): Promise<MoU> {
    try {
      // Generate reference number
      const referenceNumber = await this.generateReferenceNumber(mouData.type || 'bilateral');

      const { data, error } = await supabaseAdmin
        .from('mous')
        .insert({
          ...mouData,
          reference_number: referenceNumber,
          status: mouData.status || 'draft',
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Schedule alerts if applicable
      if (data.expiry_date && data.status === 'active') {
        await this.scheduleAlerts(data);
      }

      // Clear cache
      await this.clearMoUCache();

      logInfo(`Created MoU: ${data.reference_number}`);
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
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reschedule alerts if dates changed
      if (updates.expiry_date || updates.effective_date) {
        await this.scheduleAlerts(data);
      }

      // Clear cache
      await cacheHelpers.del(`${this.cachePrefix}${id}`);
      await this.clearMoUCache();

      logInfo(`Updated MoU: ${data.reference_number}`);
      return data;
    } catch (error) {
      logError(`Error updating MoU ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Transition MoU status with validation
   */
  async transitionMoUStatus(id: string, newStatus: MoU['status'], userId: string): Promise<MoU> {
    try {
      // Get current MoU
      const currentMoU = await this.getMoUById(id);
      if (!currentMoU) {
        throw new Error('MoU not found');
      }

      // Validate transition
      const transition = this.validateStateTransition(currentMoU.status, newStatus);
      if (!transition.allowed) {
        throw new Error(`Invalid status transition from ${currentMoU.status} to ${newStatus}`);
      }

      // Check required fields
      if (transition.required_fields) {
        for (const field of transition.required_fields) {
          if (!currentMoU[field as keyof MoU]) {
            throw new Error(`Required field missing for transition: ${field}`);
          }
        }
      }

      // Update status
      const updates: Partial<MoU> = { status: newStatus };

      // Set additional fields based on transition
      if (newStatus === 'active' && !currentMoU.effective_date) {
        updates.effective_date = new Date();
      }

      if (newStatus === 'expired') {
        updates.expiry_date = new Date();
      }

      // Update MoU
      const updatedMoU = await this.updateMoU(id, updates);

      // Log state transition
      await this.logStateTransition(id, currentMoU.status, newStatus, userId);

      // Trigger notifications for important transitions
      if (['signed', 'active', 'expired', 'terminated'].includes(newStatus)) {
        // TODO: Trigger notifications via NotificationService
      }

      return updatedMoU;
    } catch (error) {
      logError(`Error transitioning MoU ${id} status`, error as Error);
      throw error;
    }
  }

  /**
   * Update deliverable status
   */
  async updateDeliverable(
    mouId: string,
    deliverableId: string,
    updates: Partial<MoU['deliverables'][0]>
  ): Promise<MoU> {
    try {
      const mou = await this.getMoUById(mouId);
      if (!mou) {
        throw new Error('MoU not found');
      }

      // Find and update deliverable
      const deliverables = mou.deliverables || [];
      const deliverableIndex = deliverables.findIndex(d => d.id === deliverableId);

      if (deliverableIndex === -1) {
        throw new Error('Deliverable not found');
      }

      deliverables[deliverableIndex] = {
        ...deliverables[deliverableIndex],
        ...updates
      };

      // Update MoU
      const updatedMoU = await this.updateMoU(mouId, { deliverables });

      // Check if all deliverables are completed
      const allCompleted = deliverables.every(d => d.status === 'completed');
      if (allCompleted) {
        // TODO: Trigger notification for all deliverables completed
      }

      logInfo(`Updated deliverable ${deliverableId} for MoU ${mouId}`);
      return updatedMoU;
    } catch (error) {
      logError('Error updating deliverable', error as Error);
      throw error;
    }
  }

  /**
   * Get MoUs expiring soon
   */
  async getExpiringMoUs(days: number = 90): Promise<MoU[]> {
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
        .select('*')
        .lte('expiry_date', expiryDate.toISOString())
        .gte('expiry_date', new Date().toISOString())
        .in('status', ['active', 'signed'])
        .order('expiry_date', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        await cacheHelpers.set(cacheKey, data, 3600); // 1 hour cache
      }

      return data || [];
    } catch (error) {
      logError('Error fetching expiring MoUs', error as Error);
      throw error;
    }
  }

  /**
   * Get deliverables due
   */
  async getDeliverablesDue(days: number = 30): Promise<any[]> {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      const { data: mous, error } = await supabaseAdmin
        .from('mous')
        .select('id, reference_number, title_en, deliverables')
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      const deliverablesDue: any[] = [];
      const now = new Date();

      mous?.forEach(mou => {
        mou.deliverables?.forEach((deliverable: any) => {
          const deliverableDueDate = new Date(deliverable.due_date);
          if (
            deliverable.status !== 'completed' &&
            deliverableDueDate >= now &&
            deliverableDueDate <= dueDate
          ) {
            deliverablesDue.push({
              mou_id: mou.id,
              mou_reference: mou.reference_number,
              mou_title: mou.title_en,
              ...deliverable
            });
          }
        });
      });

      // Sort by due date
      deliverablesDue.sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );

      return deliverablesDue;
    } catch (error) {
      logError('Error fetching deliverables due', error as Error);
      throw error;
    }
  }

  /**
   * Calculate MoU performance
   */
  async calculateMoUPerformance(mouId: string): Promise<{
    deliverables_completion: number;
    on_time_delivery: number;
    metrics_achievement: number;
    overall_score: number;
  }> {
    try {
      const mou = await this.getMoUById(mouId);
      if (!mou) {
        throw new Error('MoU not found');
      }

      // Calculate deliverables completion
      const deliverables = mou.deliverables || [];
      const completedDeliverables = deliverables.filter(d => d.status === 'completed');
      const deliverables_completion = deliverables.length > 0
        ? (completedDeliverables.length / deliverables.length) * 100
        : 0;

      // Calculate on-time delivery
      const completedOnTime = completedDeliverables.filter(d =>
        d.completion_date && new Date(d.completion_date) <= new Date(d.due_date)
      );
      const on_time_delivery = completedDeliverables.length > 0
        ? (completedOnTime.length / completedDeliverables.length) * 100
        : 0;

      // Calculate metrics achievement
      const metrics = mou.performance_metrics || [];
      const metricsAchieved = metrics.filter(m =>
        m.current_value >= m.target_value
      );
      const metrics_achievement = metrics.length > 0
        ? (metricsAchieved.length / metrics.length) * 100
        : 0;

      // Calculate overall score
      const overall_score = (
        deliverables_completion * 0.4 +
        on_time_delivery * 0.3 +
        metrics_achievement * 0.3
      );

      return {
        deliverables_completion,
        on_time_delivery,
        metrics_achievement,
        overall_score
      };
    } catch (error) {
      logError(`Error calculating performance for MoU ${mouId}`, error as Error);
      throw error;
    }
  }

  // Helper methods

  private validateStateTransition(from: MoU['status'], to: MoU['status']): {
    allowed: boolean;
    required_fields?: string[];
  } {
    const transition = this.stateTransitions.find(
      t => t.from_status === from && t.to_status === to
    );

    return {
      allowed: transition?.allowed || false,
      required_fields: transition?.required_fields
    };
  }

  private async generateReferenceNumber(type: MoU['type']): Promise<string> {
    const year = new Date().getFullYear();
    const typePrefix = type.substring(0, 3).toUpperCase();

    // Get the count of MoUs this year
    const { count } = await supabaseAdmin
      .from('mous')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`);

    const sequence = (count || 0) + 1;
    return `MOU-${typePrefix}-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  private async scheduleAlerts(mou: MoU): Promise<void> {
    // Implementation would integrate with the background job system
    // to schedule reminder notifications
    logInfo(`Scheduling alerts for MoU ${mou.reference_number}`);
  }

  private async logStateTransition(
    mouId: string,
    fromStatus: MoU['status'],
    toStatus: MoU['status'],
    userId: string
  ): Promise<void> {
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'mou',
      entity_id: mouId,
      action: 'status_change',
      changes: {
        from: fromStatus,
        to: toStatus
      },
      user_id: userId,
      created_at: new Date().toISOString()
    });
  }

  private async clearMoUCache(): Promise<void> {
    await cacheHelpers.clearPattern(`${this.cachePrefix}list:*`);
    await cacheHelpers.clearPattern(`${this.cachePrefix}expiring:*`);
  }
}

export default MoUService;