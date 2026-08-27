import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
const runtimeType = 'country'
export const routeKey = DOSSIER_CARD_TYPES.includes(runtimeType) ? `type.${runtimeType}` : 'type.unknown'
