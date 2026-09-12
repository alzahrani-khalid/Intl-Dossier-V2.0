import { useTranslation } from '@/fixture/i18n-export'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')
  const key = `type.${runtimeType}`
  return t(key, runtimeType)
}
