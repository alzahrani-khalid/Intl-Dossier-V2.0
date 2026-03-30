/**
 * Intake Promotion Integration Tests
 * Requirements: LIFE-04
 *
 * Tests for promoting engagement-type intake tickets to full engagements,
 * including field mapping, status updates, and dossier linking.
 */
import { describe, it } from 'vitest'

describe('Intake Promotion (integration)', () => {
  describe('promote intake ticket to engagement (LIFE-04)', () => {
    it.todo('promotes engagement-type intake ticket to new engagement at intake stage')
    it.todo('sets intake ticket status to converted with convertedToId')
    it.todo('maps ticket fields to engagement fields')
    it.todo('links promoted engagement to specified dossiers')
    it.todo('rejects promotion of non-engagement-type tickets')
  })
})
