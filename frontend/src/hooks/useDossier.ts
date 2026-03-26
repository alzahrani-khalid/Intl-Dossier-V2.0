/**
 * @deprecated Import from '@/domains/dossiers' instead.
 * Backward-compat re-export for existing consumers.
 */
export {
  useDossier,
  useDossiersFromDetail as useDossiers,
  useDossiersByType,
  useCreateDossier,
  useUpdateDossier,
  useDeleteDossier,
  usePrefetchDossier,
  useInvalidateDossiers,
  useDocumentLinks,
  useLinkDocument,
  useUnlinkDocument,
  useTypedDossier,
  useDossierCounts,
  useDossierCountByType,
  dossierDetailKeys as dossierKeys,
  documentLinksKeys,
  dossierCountsKeys,
} from '@/domains/dossiers'
