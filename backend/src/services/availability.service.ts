/**
 * Availability Service
 * Handles staff availability updates and automatic reassignment workflows
 *
 * Dependencies:
 * - T004: staff_profiles table with availability_status
 * - T007: assignments table
 * - FR-011a: Urgent/high items auto-reassigned on leave
 * - FR-011b: Normal/low items flagged for manual review
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface AvailabilityUpdateRequest {
  status: 'available' | 'on_leave' | 'unavailable';
  unavailable_until?: string | null;
  reason?: string | null;
}

export interface AvailabilityUpdateResponse {
  updated: true;
  status: 'available' | 'on_leave' | 'unavailable';
  reassigned_items: ReassignedItem[];
  flagged_for_review: FlaggedItem[];
}

export interface ReassignedItem {
  assignment_id: string;
  work_item_id: string;
  work_item_type: string;
  priority: string;
  old_assignee_id: string;
  new_assignee_id: string;
  new_assignee_name_ar?: string;
  new_assignee_name_en?: string;
}

export interface FlaggedItem {
  assignment_id: string;
  work_item_id: string;
  work_item_type: string;
  priority: string;
  reason: string;
}

export interface Assignment {
  id: string;
  work_item_id: string;
  work_item_type: string;
  assignee_id: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: string;
  required_skills?: string[];
}

export class AvailabilityService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Update staff availability status
   * Triggers reassignment workflow if status changes to on_leave/unavailable
   */
  async updateAvailability(
    staffId: string,
    request: AvailabilityUpdateRequest
  ): Promise<AvailabilityUpdateResponse> {
    // Validate unavailable_until is in future if status is on_leave
    if (request.status === 'on_leave' && request.unavailable_until) {
      const until = new Date(request.unavailable_until);
      if (until < new Date()) {
        throw new Error('unavailable_until must be in the future');
      }
    }

    // Update staff profile
    const { error: updateError } = await this.supabase
      .from('staff_profiles')
      .update({
        availability_status: request.status,
        unavailable_until: request.unavailable_until || null,
        unavailable_reason: request.reason || null,
        availability_source: 'manual',
      })
      .eq('user_id', staffId);

    if (updateError) {
      throw new Error(`Failed to update availability: ${updateError.message}`);
    }

    let reassigned_items: ReassignedItem[] = [];
    let flagged_for_review: FlaggedItem[] = [];

    // If going on leave or unavailable, handle existing assignments
    if (request.status === 'on_leave' || request.status === 'unavailable') {
      const reassignResult = await this.reassignUrgentHighItems(staffId);
      reassigned_items = reassignResult;

      const flaggedResult = await this.flagNormalLowItems(staffId);
      flagged_for_review = flaggedResult;

      // Send notification to supervisor about flagged items
      if (flagged_for_review.length > 0) {
        await this.notifySupervisorOfFlaggedItems(staffId, flagged_for_review);
      }
    }

    return {
      updated: true,
      status: request.status,
      reassigned_items,
      flagged_for_review,
    };
  }

  /**
   * Reassign urgent and high priority items automatically
   * Uses auto-assignment service to find best assignee
   */
  async reassignUrgentHighItems(staffId: string): Promise<ReassignedItem[]> {
    // Get all urgent/high assignments for this staff member
    const { data: assignments, error } = await this.supabase
      .from('assignments')
      .select('id, work_item_id, work_item_type, assignee_id, priority')
      .eq('assignee_id', staffId)
      .in('status', ['assigned', 'in_progress'])
      .in('priority', ['urgent', 'high']);

    if (error) {
      throw new Error(`Failed to get assignments: ${error.message}`);
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const reassignedItems: ReassignedItem[] = [];

    // Get staff's skills and unit for finding replacement
    const { data: staffProfile, error: staffError } = await this.supabase
      .from('staff_profiles')
      .select('unit_id, skills')
      .eq('user_id', staffId)
      .single();

    if (staffError || !staffProfile) {
      throw new Error(`Failed to get staff profile: ${staffError?.message}`);
    }

    // Try to reassign each item
    for (const assignment of assignments) {
      try {
        // Find best available staff in same unit with matching skills
        const { data: candidates, error: candidateError } = await this.supabase
          .from('staff_profiles')
          .select('user_id, full_name_ar, full_name_en, individual_wip_limit, current_assignment_count, skills')
          .eq('unit_id', staffProfile.unit_id)
          .eq('availability_status', 'available')
          .lt('current_assignment_count', this.supabase.raw('individual_wip_limit'));

        if (candidateError || !candidates || candidates.length === 0) {
          console.warn(`No available candidates for reassignment of ${assignment.id}`);
          continue;
        }

        // Filter candidates with matching skills
        const skillsRequired = staffProfile.skills || [];
        const eligibleCandidates = candidates.filter((candidate) => {
          const candidateSkills = candidate.skills || [];
          return skillsRequired.every((skill: string) => candidateSkills.includes(skill));
        });

        if (eligibleCandidates.length === 0) {
          console.warn(`No eligible candidates with required skills for ${assignment.id}`);
          continue;
        }

        // Pick candidate with most available capacity
        const bestCandidate = eligibleCandidates.sort(
          (a, b) => a.current_assignment_count - b.current_assignment_count
        )[0];

        // Reassign to best candidate
        const { error: reassignError } = await this.supabase
          .from('assignments')
          .update({
            assignee_id: bestCandidate.user_id,
            assigned_at: new Date().toISOString(), // Reset assignment time
            reassigned_from: staffId,
            reassignment_reason: 'Staff unavailable',
          })
          .eq('id', assignment.id);

        if (reassignError) {
          console.error(`Failed to reassign ${assignment.id}:`, reassignError);
          continue;
        }

        reassignedItems.push({
          assignment_id: assignment.id,
          work_item_id: assignment.work_item_id,
          work_item_type: assignment.work_item_type,
          priority: assignment.priority,
          old_assignee_id: staffId,
          new_assignee_id: bestCandidate.user_id,
          new_assignee_name_ar: bestCandidate.full_name_ar,
          new_assignee_name_en: bestCandidate.full_name_en,
        });
      } catch (err) {
        console.error(`Error reassigning assignment ${assignment.id}:`, err);
      }
    }

    return reassignedItems;
  }

  /**
   * Flag normal and low priority items for manual review
   * These items remain assigned but are marked for supervisor attention
   */
  async flagNormalLowItems(staffId: string): Promise<FlaggedItem[]> {
    // Get all normal/low assignments for this staff member
    const { data: assignments, error } = await this.supabase
      .from('assignments')
      .select('id, work_item_id, work_item_type, assignee_id, priority')
      .eq('assignee_id', staffId)
      .in('status', ['assigned', 'in_progress'])
      .in('priority', ['normal', 'low']);

    if (error) {
      throw new Error(`Failed to get assignments: ${error.message}`);
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const flaggedItems: FlaggedItem[] = [];

    // Flag each item for review
    for (const assignment of assignments) {
      const { error: flagError } = await this.supabase
        .from('assignments')
        .update({
          needs_review: true,
          review_reason: 'Staff unavailable',
          flagged_at: new Date().toISOString(),
        })
        .eq('id', assignment.id);

      if (flagError) {
        console.error(`Failed to flag ${assignment.id}:`, flagError);
        continue;
      }

      flaggedItems.push({
        assignment_id: assignment.id,
        work_item_id: assignment.work_item_id,
        work_item_type: assignment.work_item_type,
        priority: assignment.priority,
        reason: 'Staff unavailable',
      });
    }

    return flaggedItems;
  }

  /**
   * Notify supervisor about items flagged for manual review
   */
  private async notifySupervisorOfFlaggedItems(
    staffId: string,
    flaggedItems: FlaggedItem[]
  ): Promise<void> {
    // Get staff's unit supervisor
    const { data: staffProfile, error: staffError } = await this.supabase
      .from('staff_profiles')
      .select('unit_id, full_name_ar, full_name_en')
      .eq('user_id', staffId)
      .single();

    if (staffError || !staffProfile) {
      console.error('Failed to get staff profile for notification');
      return;
    }

    const { data: supervisor, error: supervisorError } = await this.supabase
      .from('staff_profiles')
      .select('user_id')
      .eq('unit_id', staffProfile.unit_id)
      .eq('role', 'supervisor')
      .single();

    if (supervisorError || !supervisor) {
      console.error('Failed to find unit supervisor for notification');
      return;
    }

    // Create notification for supervisor
    const itemCount = flaggedItems.length;
    const staffNameAr = staffProfile.full_name_ar || 'موظف';
    const staffNameEn = staffProfile.full_name_en || 'Staff member';

    const notification = {
      user_id: supervisor.user_id,
      type: 'staff_leave_items_for_review',
      reference_id: staffId,
      reference_type: 'staff_profile',
      message_ar: `${itemCount} عنصر يحتاج إلى مراجعة بسبب عدم توفر ${staffNameAr}`,
      message_en: `${itemCount} items need review due to ${staffNameEn}'s unavailability`,
      metadata: {
        flagged_items: flaggedItems.map((item) => item.assignment_id),
        staff_id: staffId,
      },
      read_at: null,
      created_at: new Date().toISOString(),
    };

    const { error: notifError } = await this.supabase.from('notifications').insert(notification);

    if (notifError) {
      console.error('Failed to create supervisor notification:', notifError);
    }
  }

  /**
   * Return staff to available status
   * Does NOT automatically re-assign flagged items - supervisor must do this manually
   */
  async setAvailable(staffId: string): Promise<void> {
    const { error } = await this.supabase
      .from('staff_profiles')
      .update({
        availability_status: 'available',
        unavailable_until: null,
        unavailable_reason: null,
        availability_source: 'manual',
      })
      .eq('user_id', staffId);

    if (error) {
      throw new Error(`Failed to set availability: ${error.message}`);
    }

    // Clear review flags on previously flagged items (optional - may want supervisor to manually clear)
    // Commented out to require manual review
    // await this.supabase
    //   .from('assignments')
    //   .update({ needs_review: false, review_reason: null, flagged_at: null })
    //   .eq('assignee_id', staffId)
    //   .eq('needs_review', true);
  }

  /**
   * Get all items flagged for review for a unit
   * Used by supervisors to see pending reviews
   */
  async getFlaggedItemsForUnit(unitId: string): Promise<FlaggedItem[]> {
    const { data: assignments, error } = await this.supabase
      .from('assignments')
      .select('id, work_item_id, work_item_type, priority, assignee_id, review_reason')
      .eq('needs_review', true)
      .in(
        'assignee_id',
        this.supabase
          .from('staff_profiles')
          .select('user_id')
          .eq('unit_id', unitId)
      );

    if (error) {
      throw new Error(`Failed to get flagged items: ${error.message}`);
    }

    return (assignments || []).map((assignment) => ({
      assignment_id: assignment.id,
      work_item_id: assignment.work_item_id,
      work_item_type: assignment.work_item_type,
      priority: assignment.priority,
      reason: assignment.review_reason || 'Unknown',
    }));
  }
}
