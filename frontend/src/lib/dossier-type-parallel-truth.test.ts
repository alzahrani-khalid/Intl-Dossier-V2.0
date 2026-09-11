import { describe, expect, it } from 'vitest'

import { GUIDE_GRID_TYPES } from '@/components/dossier/DossierTypeGuide'
import { VALID_TYPES } from '@/components/dossier/wizard/hooks/useDraftMigration'
import { DOSSIER_TYPE_ORDER } from '@/components/keyboard-shortcuts/command-palette-order'
import { DOSSIER_CARD_TYPES, DOSSIER_TYPES } from '@/lib/dossier-type-guards'

describe('dossier type parallel truth', () => {
  it('the three parallel copies of the dossier-type list are element-equal to the canonical exports', () => {
    expect(GUIDE_GRID_TYPES).toEqual([...DOSSIER_TYPES])
    expect(VALID_TYPES).toEqual([...DOSSIER_TYPES])
    expect(DOSSIER_TYPE_ORDER).toEqual([...DOSSIER_CARD_TYPES])
  })
})
