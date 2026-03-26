/**
 * @deprecated Import from '@/domains/dossiers' instead.
 * Backward-compat re-export for existing consumers.
 */
export {
  useDossierActivityTimeline,
  type UseDossierActivityTimelineOptions,
  type UseDossierActivityTimelineReturn,
  type TimelineActivity,
  type TimelineFilters,
  type DossierActivityTimelineResponse,
} from '@/domains/dossiers'

export { default } from '@/domains/dossiers/hooks/useDossierActivityTimeline'
