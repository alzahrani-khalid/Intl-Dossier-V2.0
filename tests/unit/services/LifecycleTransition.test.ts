/**
 * Lifecycle Transition Service Tests
 * Requirements: LIFE-02, LIFE-03
 *
 * Tests for stage transition logic including sequential, skip, backward,
 * optional notes, and duration computation.
 */
import { describe, it } from 'vitest'

describe('LifecycleTransitionService', () => {
  describe('stage transitions (LIFE-02)', () => {
    it.todo('transitions engagement to next sequential stage')
    it.todo('allows skipping stages forward')
    it.todo('allows moving backward to previous stage')
    it.todo('rejects transition to the same stage')
    it.todo('rejects transition with invalid stage value')
  })

  describe('transition metadata (LIFE-03)', () => {
    it.todo('records optional note for non-adjacent transitions')
    it.todo('computes duration_in_stage_seconds from previous transition')
    it.todo('sets duration_in_stage_seconds to null for first transition')
    it.todo('records user_id of the person performing the transition')
    it.todo('sets transitioned_at to current timestamp by default')
  })
})
