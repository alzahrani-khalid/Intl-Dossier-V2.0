/**
 * Lifecycle Stage Integration Tests
 * Requirements: LIFE-01
 *
 * Tests for the lifecycle_stage column on engagement_dossiers,
 * including default value, valid values, and independence from engagement_status.
 */
import { describe, it } from 'vitest'

describe('Lifecycle Stage (integration)', () => {
  describe('engagement_dossiers.lifecycle_stage (LIFE-01)', () => {
    it.todo('new engagement defaults to intake lifecycle_stage')
    it.todo('lifecycle_stage only accepts 6 valid values')
    it.todo('lifecycle_stage rejects invalid values')
    it.todo('lifecycle_stage is independent of engagement_status')
    it.todo('lifecycle_stage can be updated without changing engagement_status')
  })
})
