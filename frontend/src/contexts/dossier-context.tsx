/**
 * Backward compatibility re-export
 *
 * The dossier context has been split into focused sub-contexts:
 * - DossierNavigationContext: active dossier, selection state
 * - DossierCollectionContext: recent, pinned dossiers
 * - DossierInheritanceContext: URL resolution, inheritance logic
 *
 * This file re-exports from the new directory-based module so existing
 * imports like `from '@/contexts/dossier-context'` continue to work.
 *
 * For new code, prefer importing individual sub-context hooks:
 *   import { useDossierNavigation } from '@/contexts/dossier-context'
 *   import { useDossierCollection } from '@/contexts/dossier-context'
 *   import { useDossierInheritance } from '@/contexts/dossier-context'
 */

export {
  DossierContextProvider,
  DossierProvider,
  useDossierContextInternal,
  useDossierContextSafe,
  useDossierNavigation,
  useDossierNavigationSafe,
  useDossierCollection,
  useDossierCollectionSafe,
  useDossierInheritance,
  useDossierInheritanceSafe,
} from './dossier-context/index'

export type {
  ExtendedDossierContextValue,
  DossierContextProviderProps,
  DossierNavigationContextValue,
  DossierCollectionContextValue,
  DossierInheritanceContextValue,
} from './dossier-context/index'
