/**
 * Persons Domain Barrel
 * @module domains/persons
 *
 * Re-exports all hooks, repository, and types for the persons domain.
 * Canonical import path for consumers: `@/domains/persons`
 */

// Hooks
export {
  personKeys,
  usePersons,
  usePerson,
  usePersonNetwork,
  useCreatePerson,
  useUpdatePerson,
  useArchivePerson,
  useAddPersonRole,
  useDeletePersonRole,
  useAddPersonAffiliation,
  useDeletePersonAffiliation,
  useAddPersonRelationship,
  useDeletePersonRelationship,
  useInvalidatePersons,
} from './hooks/usePersons'

// Repository
export * as personsRepo from './repositories/persons.repository'

// Types
export * from './types'
