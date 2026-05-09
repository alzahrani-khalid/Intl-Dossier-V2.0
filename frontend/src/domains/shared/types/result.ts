/**
 * Shared Kernel - Result Type
 *
 * Type-safe error handling pattern for operations that can fail.
 * Provides a consistent way to handle success and failure cases
 * across all bounded contexts.
 */

/**
 * Success result containing data
 */
export interface Success<T> {
  readonly success: true
  readonly data: T
  readonly error?: never
}

/**
 * Failure result containing error
 */
export interface Failure<E> {
  readonly success: false
  readonly data?: never
  readonly error: E
}

/**
 * Result type representing either success or failure
 */
export type Result<T, E = Error> = Success<T> | Failure<E>

/**
 * Create a success result
 */
export function ok<T>(data: T): Success<T> {
  return { success: true, data }
}

/**
 * Create a failure result
 */
export function err<E>(error: E): Failure<E> {
  return { success: false, error }
}

/**
 * Check if result is success
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true
}

/**
 * Check if result is failure
 */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false
}
