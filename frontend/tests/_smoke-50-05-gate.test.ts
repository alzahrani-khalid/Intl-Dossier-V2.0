// DELETE BEFORE MERGE — deliberate failure to prove Tests (frontend) blocks PRs to main.
// Phase 50-05 smoke gate proof. See .planning/phases/50-test-infrastructure-repair/50-05-PLAN.md.
import { describe, expect, it } from 'vitest'

describe('phase-50-05 smoke gate', () => {
  it('intentionally fails to prove branch protection blocks merge', () => {
    expect(true).toBe(false)
  })
})
