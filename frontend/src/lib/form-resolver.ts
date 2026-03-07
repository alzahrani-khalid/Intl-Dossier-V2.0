/**
 * Type-safe zodResolver wrapper for Zod 4 + react-hook-form v7.71+
 *
 * Zod 4 schemas with .default() create different input/output types,
 * causing Resolver type mismatches with useForm generics.
 * This wrapper bridges the type gap while preserving runtime behavior.
 */
import { zodResolver as baseZodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver(schema: any, ...args: any[]): Resolver<any> {
  return baseZodResolver(schema, ...args) as Resolver<any>
}
