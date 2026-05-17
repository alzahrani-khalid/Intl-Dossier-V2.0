// Phase 50 D-15 regression fixture for vi-mock-exports-required.
// `pnpm lint tools/eslint-fixtures/bad-vi-mock.ts` MUST exit non-zero.
// The mock factory deliberately omits the SpreadElement from vi.importActual.
// See frontend/docs/test-setup.md §The react-i18next mock contract.

import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
