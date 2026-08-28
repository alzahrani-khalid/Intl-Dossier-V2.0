import { useTranslation } from '@/fixture/decoy-i18n'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return useTranslation('graph').t(key, runtimeType)
}
