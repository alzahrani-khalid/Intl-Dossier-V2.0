import * as i18n from '@/fixture/decoy-i18n'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
const { useTranslation: factory } = i18n
export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = factory('graph')

  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  // @audit-line 7
  return t(key, runtimeType)
}
