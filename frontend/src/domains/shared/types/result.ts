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

/**
 * Unwrap result or throw error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data
  }
  throw result.error
}

/**
 * Unwrap result or return default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.data
  }
  return defaultValue
}

/**
 * Map over success value
 */
export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data))
  }
  return result
}

/**
 * Map over error value
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error))
  }
  return result
}

/**
 * Chain results (flatMap)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data)
  }
  return result
}

/**
 * Execute function on error without changing result
 */
export function tapErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
  if (isErr(result)) {
    fn(result.error)
  }
  return result
}

/**
 * Convert Promise to Result
 */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try {
    const data = await promise
    return ok(data)
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Combine multiple results into one
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = []
  for (const result of results) {
    if (isErr(result)) {
      return result
    }
    data.push(result.data)
  }
  return ok(data)
}
