// Phase 52 regression fixture for ESLint no-restricted-imports widening (D-18).
// After Plan 04 widens patterns to include '@/components/kibo-ui/*',
// `pnpm exec eslint -c eslint.config.mjs tools/eslint-fixtures/bad-kibo-ui-import.tsx` MUST exit non-zero.
// The fixture deliberately imports from the local kibo-ui kanban path.
// See eslint.config.mjs and 52-CONTEXT.md D-18.

import { KanbanProvider } from '@/components/kibo-ui/kanban'

void KanbanProvider

export {}
