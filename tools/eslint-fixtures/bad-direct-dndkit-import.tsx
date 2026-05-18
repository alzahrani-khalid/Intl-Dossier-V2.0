// Phase 57 D-21 / D-57-08 regression fixture for the @dnd-kit/core direct-import ban.
// After Plan 57-02 widens eslint.config.mjs `no-restricted-imports` patterns to include
// '@dnd-kit/core', running
//   `pnpm exec eslint -c eslint.config.mjs --max-warnings 0 tools/eslint-fixtures/bad-direct-dndkit-import.tsx`
// MUST exit non-zero. The fixture deliberately imports @dnd-kit/core directly,
// mirroring the WorkBoard.tsx anti-pattern that this phase migrates away from.
// See 57-CONTEXT.md D-57-08 and docs/adr/0001-mobile-dnd-scope-out.md.

import { DndContext } from '@dnd-kit/core'

void DndContext

export {}
