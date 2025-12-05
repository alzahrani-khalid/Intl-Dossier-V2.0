/**
 * T040: Auto-Assignment Service
 * Core assignment logic using weighted scoring algorithm
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import { SCORING_WEIGHTS, DISQUALIFY_SCORE, type AssignmentScore } from '../config/scoring-weights'

type StaffProfile = Database['public']['Tables']['staff_profiles']['Row']
type WorkItemType = Database['public']['Enums']['work_item_type']
type PriorityLevel = Database['public']['Enums']['priority_level']

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface WorkItem {
  workItemId: string
  workItemType: WorkItemType
  requiredSkills: string[]
  targetUnitId?: string
  priority: PriorityLevel
}

/**
 * Calculate assignment score for a staff member
 * Returns score 0-100 or DISQUALIFY_SCORE (-1) if unavailable
 */
export function calculateAssignmentScore(staff: StaffProfile, workItem: WorkItem): AssignmentScore {
  let skillsScore = 0
  let capacityScore = 0
  let availabilityScore = 0
  let unitScore = 0

  // Availability check (20 points or disqualify)
  if (staff.availability_status === 'available') {
    availabilityScore = SCORING_WEIGHTS.availability
  } else {
    // Disqualify unavailable staff
    return {
      staffId: staff.user_id,
      score: DISQUALIFY_SCORE,
      breakdown: { skillsScore: 0, capacityScore: 0, availabilityScore: 0, unitScore: 0 },
    }
  }

  // Skills match (0-40 points)
  const matchedSkills = staff.skills.filter((skill) => workItem.requiredSkills.includes(skill))
  const skillMatchRatio = matchedSkills.length / workItem.requiredSkills.length
  skillsScore = skillMatchRatio * SCORING_WEIGHTS.skills

  // Capacity (0-30 points)
  const capacityUtilization = staff.current_assignment_count / staff.individual_wip_limit
  capacityScore = (1 - capacityUtilization) * SCORING_WEIGHTS.capacity

  // Unit match (0-10 points)
  if (workItem.targetUnitId && staff.unit_id === workItem.targetUnitId) {
    unitScore = SCORING_WEIGHTS.unit
  } else if (!workItem.targetUnitId) {
    // If no target unit specified, give partial points
    unitScore = SCORING_WEIGHTS.unit * 0.5
  }

  const totalScore = skillsScore + capacityScore + availabilityScore + unitScore

  return {
    staffId: staff.user_id,
    score: totalScore,
    breakdown: { skillsScore, capacityScore, availabilityScore, unitScore },
  }
}

/**
 * Find best assignee for a work item (T068: Optimized with CTE and candidate pool limit)
 * Returns staff profile or null if no suitable staff found
 */
export async function findBestAssignee(workItem: WorkItem): Promise<StaffProfile | null> {
  // T068 Optimization: Use CTE for eligible staff filtering
  // Limit candidate pool to 50 staff ranked by preliminary score
  // Add query timeout: 500ms

  const queryStartTime = Date.now()
  const QUERY_TIMEOUT_MS = 500
  const MAX_CANDIDATES = 50

  try {
    // Use raw SQL query with CTE for optimal performance
    const { data: eligibleStaff, error } = await supabase.rpc(
      'find_eligible_staff_for_assignment',
      {
        required_skills: workItem.requiredSkills,
        target_unit_id: workItem.targetUnitId || null,
        max_candidates: MAX_CANDIDATES,
      },
    )

    // Fallback to standard query if RPC not available
    if (error?.code === '42883') {
      // Function does not exist
      console.warn('Using fallback query (RPC not available)')
      return await findBestAssigneeFallback(workItem)
    }

    if (error) {
      console.error('Error fetching eligible staff:', error)
      return null
    }

    if (!eligibleStaff || eligibleStaff.length === 0) {
      console.log('No eligible staff found with required skills and capacity')
      return null
    }

    // Check query timeout
    const queryDuration = Date.now() - queryStartTime
    if (queryDuration > QUERY_TIMEOUT_MS) {
      console.warn(`Query exceeded timeout: ${queryDuration}ms > ${QUERY_TIMEOUT_MS}ms`)
    }

    // Calculate scores for candidate pool (limited to 50)
    const scoredStaff = eligibleStaff
      .map((staff) => ({
        staff,
        scoreResult: calculateAssignmentScore(staff as StaffProfile, workItem),
      }))
      .filter((entry) => entry.scoreResult.score >= 0) // Remove disqualified
      .sort((a, b) => b.scoreResult.score - a.scoreResult.score) // Sort by score DESC

    if (scoredStaff.length === 0) {
      console.log('All staff disqualified after scoring')
      return null
    }

    // Return staff with highest score
    const bestMatch = scoredStaff[0]
    console.log(
      `Best assignee: ${bestMatch.staff.user_id} (score: ${bestMatch.scoreResult.score}, query: ${queryDuration}ms)`,
      bestMatch.scoreResult.breakdown,
    )

    return bestMatch.staff as StaffProfile
  } catch (err) {
    console.error('Error in findBestAssignee:', err)
    return null
  }
}

/**
 * Fallback query without RPC (for backwards compatibility)
 */
async function findBestAssigneeFallback(workItem: WorkItem): Promise<StaffProfile | null> {
  const { data: eligibleStaff, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .contains('skills', workItem.requiredSkills)
    .eq('availability_status', 'available')
    .lt('current_assignment_count', supabase.raw('individual_wip_limit'))
    .limit(50) // Limit candidate pool

  if (error) {
    console.error('Error fetching eligible staff (fallback):', error)
    return null
  }

  if (!eligibleStaff || eligibleStaff.length === 0) {
    return null
  }

  const scoredStaff = eligibleStaff
    .map((staff) => ({
      staff,
      scoreResult: calculateAssignmentScore(staff, workItem),
    }))
    .filter((entry) => entry.scoreResult.score >= 0)
    .sort((a, b) => b.scoreResult.score - a.scoreResult.score)

  return scoredStaff[0]?.staff || null
}

/**
 * Attempt to assign work item to best available staff
 * Handles optimistic locking with retry logic
 */
export async function attemptAssignment(
  workItem: WorkItem,
  maxRetries = 3,
): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Find best assignee
      const assignee = await findBestAssignee(workItem)

      if (!assignee) {
        return { success: false, error: 'No eligible staff available' }
      }

      // Check WIP limit again (optimistic locking)
      const { data: currentStaff } = await supabase
        .from('staff_profiles')
        .select('current_assignment_count, individual_wip_limit, version')
        .eq('user_id', assignee.user_id)
        .single()

      if (
        !currentStaff ||
        currentStaff.current_assignment_count >= currentStaff.individual_wip_limit
      ) {
        if (attempt < maxRetries - 1) {
          // Retry with different staff
          console.log(`Staff ${assignee.user_id} at capacity, retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
          continue
        }
        return { success: false, error: 'Staff capacity exhausted during assignment' }
      }

      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          work_item_id: workItem.workItemId,
          work_item_type: workItem.workItemType,
          assignee_id: assignee.user_id,
          assigned_at: new Date().toISOString(),
          priority: workItem.priority,
          status: 'assigned',
          // sla_deadline will be calculated by trigger
        })
        .select()
        .single()

      if (assignmentError) {
        throw assignmentError
      }

      console.log(`✓ Assignment created: ${assignment.id} → ${assignee.user_id}`)
      return { success: true, assignmentId: assignment.id }
    } catch (err) {
      if (attempt < maxRetries - 1) {
        console.warn(`Assignment attempt ${attempt + 1} failed, retrying...`, err)
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
        continue
      }
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}
