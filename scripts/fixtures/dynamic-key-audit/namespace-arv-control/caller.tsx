import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
type TFn = (key: string, fallback: string) => string
function renderType(ctx: { t: TFn; runtimeType: string }, key: string) { const { t, runtimeType } = ctx; return t(key, runtimeType) }
export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return renderType({ t, runtimeType }, key)
}
