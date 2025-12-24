/**
 * Error codes for categorizing server action failures
 */
export enum ErrorCode {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured error object for server actions
 */
export interface ActionError {
  code: ErrorCode
  message: string
  details?: unknown
}

/**
 * Type-safe result wrapper using discriminated union
 *
 * @example
 * // Success case
 * const result = await createProjectAction(input)
 * if (result.success) {
 *   console.log(result.data) // TypeScript knows this is Project
 * } else {
 *   console.log(result.error.message)
 * }
 *
 * // Using helpers
 * const { data, error } = result
 * if (error) {
 *   console.log(error.code) // Can handle specific error codes
 * }
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError }

/**
 * Convert any error to structured ActionError
 *
 * Maps custom error classes:
 * - AuthenticationError → AUTHENTICATION_ERROR
 * - WorkspaceAccessError → AUTHORIZATION_ERROR
 * - NotFoundError → NOT_FOUND
 * - ZodError → VALIDATION_ERROR (with generic message)
 * - Supabase database errors (code 23*) → DATABASE_ERROR
 * - Other Error objects → UNKNOWN_ERROR
 *
 * @param error - Any error object
 * @returns Structured ActionError
 */
export function toActionError(error: unknown): ActionError {
  // Handle custom error classes by name
  if (error && typeof error === 'object' && 'name' in error) {
    const errorName = (error as any).name
    const message = (error as Error).message

    if (errorName === 'AuthenticationError') {
      return {
        code: ErrorCode.AUTHENTICATION_ERROR,
        message,
      }
    }

    if (errorName === 'WorkspaceAccessError') {
      return {
        code: ErrorCode.AUTHORIZATION_ERROR,
        message,
      }
    }

    if (errorName === 'NotFoundError') {
      return {
        code: ErrorCode.NOT_FOUND,
        message,
      }
    }

    if (errorName === 'ZodError') {
      return {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed. Please check your input.',
        details: error,
      }
    }
  }

  // Handle Supabase/database errors with code
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const dbError = error as { code?: string; message?: string }
    if (dbError.code && dbError.code.match(/^23/)) {
      return {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database operation failed. Please try again.',
        details: dbError,
      }
    }
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
    }
  }

  // Fallback for unknown error types
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'An unknown error occurred.',
    details: error,
  }
}

/**
 * Create a success result
 *
 * @example
 * return success(project)
 */
export function success<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Create an error result
 *
 * @example
 * catch (error) {
 *   return failure(error)
 * }
 */
export function failure<T = never>(error: unknown): ActionResult<T> {
  return { success: false, error: toActionError(error) }
}

/**
 * Extract error message from ActionResult
 *
 * @example
 * const message = getErrorMessage(result) // string | null
 */
export function getErrorMessage<T>(result: ActionResult<T>): string | null {
  return result.success ? null : result.error.message
}

/**
 * Extract error code from ActionResult
 *
 * @example
 * const code = getErrorCode(result) // ErrorCode | null
 * if (code === ErrorCode.AUTHENTICATION_ERROR) {
 *   // redirect to login
 * }
 */
export function getErrorCode<T>(result: ActionResult<T>): ErrorCode | null {
  return result.success ? null : result.error.code
}
