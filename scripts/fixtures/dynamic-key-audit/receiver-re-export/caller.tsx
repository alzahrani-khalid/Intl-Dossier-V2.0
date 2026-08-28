import { useTranslation } from '@/fixture/i18n-export'
import { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return t(key, runtimeType)
}
