/**
 * Capacity Service
 * Handles staff and unit capacity checks and WIP limit enforcement
 *
 * Dependencies:
 * - T004: staff_profiles table with individual_wip_limit, current_assignment_count
 * - T002: organizational_units table with unit_wip_limit
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface CapacityStatus {
  current_count: number;
  limit: number;
  utilization_pct: number;
  has_capacity: boolean;
  available_slots: number;
}

export interface StaffCapacityStatus extends CapacityStatus {
  staff_id: string;
  availability_status: 'available' | 'on_leave' | 'unavailable';
  unit_id: string;
}

export interface UnitCapacityStatus extends CapacityStatus {
  unit_id: string;
  total_staff: number;
  staff_breakdown: {
    available: number;
    on_leave: number;
    unavailable: number;
  };
}

export interface WorkItem {
  work_item_id: string;
  work_item_type: 'dossier' | 'ticket' | 'position' | 'task';
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

export class CapacityService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Check individual staff capacity
   * Returns current assignment count vs WIP limit
   */
  async checkStaffCapacity(staffId: string): Promise<StaffCapacityStatus> {
    const { data: staff, error } = await this.supabase
      .from('staff_profiles')
      .select('individual_wip_limit, current_assignment_count, availability_status, unit_id')
      .eq('user_id', staffId)
      .single();

    if (error || !staff) {
      throw new Error(`Staff profile not found: ${staffId}`);
    }

    const current_count = staff.current_assignment_count;
    const limit = staff.individual_wip_limit;
    const utilization_pct = (current_count / limit) * 100;
    const has_capacity = current_count < limit && staff.availability_status === 'available';
    const available_slots = Math.max(0, limit - current_count);

    return {
      staff_id: staffId,
      current_count,
      limit,
      utilization_pct: Math.round(utilization_pct * 100) / 100, // Round to 2 decimal places
      has_capacity,
      available_slots,
      availability_status: staff.availability_status,
      unit_id: staff.unit_id,
    };
  }

  /**
   * Check organizational unit capacity
   * Returns aggregated capacity across all unit members
   */
  async checkUnitCapacity(unitId: string): Promise<UnitCapacityStatus> {
    // Get unit WIP limit
    const { data: unit, error: unitError } = await this.supabase
      .from('organizational_units')
      .select('unit_wip_limit')
      .eq('id', unitId)
      .single();

    if (unitError || !unit) {
      throw new Error(`Organizational unit not found: ${unitId}`);
    }

    // Get all staff in unit with availability breakdown
    const { data: staffProfiles, error: staffError } = await this.supabase
      .from('staff_profiles')
      .select('current_assignment_count, availability_status')
      .eq('unit_id', unitId);

    if (staffError) {
      throw new Error(`Failed to get staff profiles for unit: ${unitId}`);
    }

    const profiles = staffProfiles || [];
    const total_staff = profiles.length;

    // Calculate availability breakdown
    const staff_breakdown = {
      available: profiles.filter((p) => p.availability_status === 'available').length,
      on_leave: profiles.filter((p) => p.availability_status === 'on_leave').length,
      unavailable: profiles.filter((p) => p.availability_status === 'unavailable').length,
    };

    // Calculate current total assignments
    const current_count = profiles.reduce((sum, p) => sum + p.current_assignment_count, 0);
    const limit = unit.unit_wip_limit;
    const utilization_pct = (current_count / limit) * 100;
    const has_capacity = current_count < limit;
    const available_slots = Math.max(0, limit - current_count);

    return {
      unit_id: unitId,
      current_count,
      limit,
      utilization_pct: Math.round(utilization_pct * 100) / 100,
      has_capacity,
      available_slots,
      total_staff,
      staff_breakdown,
    };
  }

  /**
   * Check if staff can accept a new assignment
   * Validates both individual and unit WIP limits
   */
  async canAcceptAssignment(staffId: string, workItem: WorkItem): Promise<boolean> {
    // Check individual capacity
    const staffCapacity = await this.checkStaffCapacity(staffId);

    if (!staffCapacity.has_capacity) {
      return false;
    }

    // Check unit capacity
    const unitCapacity = await this.checkUnitCapacity(staffCapacity.unit_id);

    if (!unitCapacity.has_capacity) {
      return false;
    }

    return true;
  }

  /**
   * Get capacity status for multiple staff members
   * Useful for assignment decision-making
   */
  async checkMultipleStaffCapacity(staffIds: string[]): Promise<Map<string, StaffCapacityStatus>> {
    const capacityMap = new Map<string, StaffCapacityStatus>();

    // Batch query for performance
    const { data: staffProfiles, error } = await this.supabase
      .from('staff_profiles')
      .select('user_id, individual_wip_limit, current_assignment_count, availability_status, unit_id')
      .in('user_id', staffIds);

    if (error) {
      throw new Error(`Failed to get staff profiles: ${error.message}`);
    }

    for (const staff of staffProfiles || []) {
      const current_count = staff.current_assignment_count;
      const limit = staff.individual_wip_limit;
      const utilization_pct = (current_count / limit) * 100;
      const has_capacity = current_count < limit && staff.availability_status === 'available';
      const available_slots = Math.max(0, limit - current_count);

      capacityMap.set(staff.user_id, {
        staff_id: staff.user_id,
        current_count,
        limit,
        utilization_pct: Math.round(utilization_pct * 100) / 100,
        has_capacity,
        available_slots,
        availability_status: staff.availability_status,
        unit_id: staff.unit_id,
      });
    }

    return capacityMap;
  }

  /**
   * Get capacity warning threshold status
   * Returns true if capacity is at or above warning threshold (default 75%)
   */
  async isCapacityAtWarning(
    staffId: string,
    warningThreshold: number = 75
  ): Promise<boolean> {
    const capacity = await this.checkStaffCapacity(staffId);
    return capacity.utilization_pct >= warningThreshold;
  }

  /**
   * Get unit capacity warning status
   * Returns true if unit is at or above warning threshold
   */
  async isUnitCapacityAtWarning(
    unitId: string,
    warningThreshold: number = 75
  ): Promise<boolean> {
    const capacity = await this.checkUnitCapacity(unitId);
    return capacity.utilization_pct >= warningThreshold;
  }

  /**
   * Find staff with available capacity in a specific unit
   * Sorted by available slots (descending)
   */
  async findAvailableStaffInUnit(
    unitId: string,
    requiredSkills?: string[]
  ): Promise<StaffCapacityStatus[]> {
    let query = this.supabase
      .from('staff_profiles')
      .select('user_id, individual_wip_limit, current_assignment_count, availability_status, unit_id, skills')
      .eq('unit_id', unitId)
      .eq('availability_status', 'available');

    const { data: staffProfiles, error } = await query;

    if (error) {
      throw new Error(`Failed to find available staff: ${error.message}`);
    }

    const profiles = staffProfiles || [];

    // Filter by skills if required
    let filteredProfiles = profiles;
    if (requiredSkills && requiredSkills.length > 0) {
      filteredProfiles = profiles.filter((staff) => {
        const staffSkills = staff.skills || [];
        return requiredSkills.every((skill) => staffSkills.includes(skill));
      });
    }

    // Convert to capacity status and filter for available capacity
    const capacityStatuses = filteredProfiles
      .map((staff) => {
        const current_count = staff.current_assignment_count;
        const limit = staff.individual_wip_limit;
        const utilization_pct = (current_count / limit) * 100;
        const has_capacity = current_count < limit;
        const available_slots = Math.max(0, limit - current_count);

        return {
          staff_id: staff.user_id,
          current_count,
          limit,
          utilization_pct: Math.round(utilization_pct * 100) / 100,
          has_capacity,
          available_slots,
          availability_status: staff.availability_status as 'available' | 'on_leave' | 'unavailable',
          unit_id: staff.unit_id,
        };
      })
      .filter((status) => status.has_capacity)
      .sort((a, b) => b.available_slots - a.available_slots); // Most available first

    return capacityStatuses;
  }

  /**
   * Calculate capacity utilization trend for analytics
   * Returns historical utilization data for dashboards
   */
  async getCapacityUtilizationHistory(
    unitId: string,
    days: number = 30
  ): Promise<Array<{ date: string; utilization_pct: number }>> {
    const { data, error } = await this.supabase
      .from('capacity_snapshots')
      .select('snapshot_date, utilization_pct')
      .eq('unit_id', unitId)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('snapshot_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get capacity utilization history: ${error.message}`);
    }

    return (data || []).map((row) => ({
      date: row.snapshot_date,
      utilization_pct: row.utilization_pct,
    }));
  }
}
