// PHASE 55 MERGE-02 SMOKE — DO NOT MERGE. Evidence captured in 55-SMOKE-PR-EVIDENCE.{json,png}.
//
// This test exists to import the bad-vi-mock fixture into the Tests (frontend) context
// AND the react-i18next Factory Check lint context. The fixture's broken
// `vi.mock("react-i18next", () => ({}))` (missing `...actual` spread) triggers:
//   - Tests (frontend): vi.mock side-effect produces broken react-i18next runtime
//   - react-i18next Factory Check: ESLint rule flags the missing-spread pattern
//
// The file is isolated in __smoke__/ and removed when the smoke branch is deleted (D-12).

import { describe, it, expect } from 'vitest'

// Relative path from frontend/tests/__smoke__/ to tools/eslint-fixtures/
// (frontend/tests/__smoke__/ → frontend/ → repo root → tools/eslint-fixtures/)
import '../../../tools/eslint-fixtures/bad-vi-mock'

describe('Phase 55 MERGE-02 smoke', () => {
  it('imports the bad-vi-mock fixture to fail Tests + Factory Check contexts', () => {
    // The mere import above does the work. This assertion is a placeholder
    // so vitest considers the file a valid test file.
    expect(true).toBe(true)
  })
})
