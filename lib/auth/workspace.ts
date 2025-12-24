import type { SupabaseClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

/**
 * Custom error for authorization failures
 */
export class WorkspaceAccessError extends Error {
  constructor(message: string = 'You do not have access to this workspace.') {
    super(message)
    this.name = 'WorkspaceAccessError'
  }
}

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'You must be logged in.') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Custom error for resource not found
 */
export class NotFoundError extends Error {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found.`)
    this.name = 'NotFoundError'
  }
}

/**
 * Authenticate user and return User object
 * Throws AuthenticationError if not authenticated
 *
 * @param supabase - Supabase client instance
 * @returns Authenticated User object
 *
 * @example
 * const user = await requireAuth(supabase)
 * // Now you have the user and can use user.id
 */
export async function requireAuth(supabase: SupabaseClient): Promise<User> {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    throw new AuthenticationError()
  }

  return authData.user
}

/**
 * Verify user has access to a specific workspace (organization)
 * Throws WorkspaceAccessError if no access
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @param workspaceId - Workspace (organization) ID
 * @returns Membership object if access granted
 *
 * @example
 * await requireWorkspaceAccess(supabase, user.id, workspaceId)
 * // If this doesn't throw, user has access
 */
export async function requireWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<{ organization_id: string }> {
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError || !membership) {
    throw new WorkspaceAccessError()
  }

  return membership
}

/**
 * Verify a project belongs to the specified workspace
 * Throws NotFoundError if project doesn't exist or doesn't belong to workspace
 *
 * @param supabase - Supabase client instance
 * @param projectId - Project ID to verify
 * @param workspaceId - Expected workspace ID
 * @returns Project workspace_id if valid
 *
 * @example
 * await requireProjectInWorkspace(supabase, projectId, workspaceId)
 * // If this doesn't throw, project belongs to workspace
 */
export async function requireProjectInWorkspace(
  supabase: SupabaseClient,
  projectId: string,
  workspaceId: string
): Promise<{ workspace_id: string }> {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('workspace_id')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (projectError || !project) {
    throw new NotFoundError('Project')
  }

  return project
}

/**
 * Verify a table belongs to the specified workspace
 * Throws NotFoundError if table doesn't exist or doesn't belong to workspace
 *
 * @param supabase - Supabase client instance
 * @param tableId - Table ID to verify
 * @param workspaceId - Expected workspace ID
 * @returns Table workspace_id if valid
 *
 * @example
 * await requireTableInWorkspace(supabase, tableId, workspaceId)
 * // If this doesn't throw, table belongs to workspace
 */
export async function requireTableInWorkspace(
  supabase: SupabaseClient,
  tableId: string,
  workspaceId: string
): Promise<{ workspace_id: string }> {
  const { data: table, error: tableError } = await supabase
    .from('entity_tables')
    .select('workspace_id')
    .eq('id', tableId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (tableError || !table) {
    throw new NotFoundError('Table')
  }

  return table
}

/**
 * Verify a record belongs to the specified workspace (via its table)
 * Throws NotFoundError if record doesn't exist or doesn't belong to workspace
 *
 * @param supabase - Supabase client instance
 * @param recordId - Record ID to verify
 * @param workspaceId - Expected workspace ID
 * @returns Record table_id if valid
 *
 * @example
 * await requireRecordInWorkspace(supabase, recordId, workspaceId)
 * // If this doesn't throw, record belongs to workspace
 */
export async function requireRecordInWorkspace(
  supabase: SupabaseClient,
  recordId: string,
  workspaceId: string
): Promise<{ table_id: string }> {
  const { data: record, error: recordError } = await supabase
    .from('entity_records')
    .select('table:entity_tables(workspace_id), id, table_id')
    .eq('id', recordId)
    .maybeSingle()

  if (recordError || !record) {
    throw new NotFoundError('Record')
  }

  // Check workspace access via nested table
  if ((record as any).table?.workspace_id !== workspaceId) {
    throw new NotFoundError('Record')
  }

  return { table_id: (record as any).table_id }
}

/**
 * Verify a field belongs to the specified workspace (via its table)
 * Throws NotFoundError if field doesn't exist or doesn't belong to workspace
 *
 * @param supabase - Supabase client instance
 * @param fieldId - Field ID to verify
 * @param workspaceId - Expected workspace ID
 * @returns Field table_id if valid
 *
 * @example
 * await requireFieldInWorkspace(supabase, fieldId, workspaceId)
 * // If this doesn't throw, field belongs to workspace
 */
export async function requireFieldInWorkspace(
  supabase: SupabaseClient,
  fieldId: string,
  workspaceId: string
): Promise<{ table_id: string }> {
  const { data: field, error: fieldError } = await supabase
    .from('entity_fields')
    .select('table:entity_tables(workspace_id), id, table_id')
    .eq('id', fieldId)
    .maybeSingle()

  if (fieldError || !field) {
    throw new NotFoundError('Field')
  }

  // Check workspace access via nested table
  if ((field as any).table?.workspace_id !== workspaceId) {
    throw new NotFoundError('Field')
  }

  return { table_id: (field as any).table_id }
}

/**
 * All-in-one helper: authenticate user AND verify workspace access
 * Returns both user and supabase client for convenience
 * Throws on any failure
 *
 * @param workspaceId - Workspace to verify access to
 * @returns Object with user and supabase client
 *
 * @example
 * const { user, supabase } = await requireAuthAndWorkspace(workspaceId)
 * // Now you have both and know user has workspace access
 */
export async function requireAuthAndWorkspace(workspaceId: string): Promise<{
  user: User
  supabase: SupabaseClient
}> {
  const supabase = await createClient()
  const user = await requireAuth(supabase)
  await requireWorkspaceAccess(supabase, user.id, workspaceId)

  return { user, supabase }
}

/**
 * Wrapper for server actions: automatically handles auth, workspace access, and error handling
 *
 * @param workspaceId - Required workspace ID for authorization
 * @param handler - Function that receives (user, supabase, input) and returns result
 * @returns Server action function that takes input and returns { success, data, error }
 *
 * @example
 * export const createProjectAction = protectedAction(
 *   async ({ user, supabase }, input: CreateProjectInput) => {
 *     const result = await supabase
 *       .from('projects')
 *       .insert({ workspace_id: input.workspace_id, ... })
 *       .single()
 *     return result
 *   },
 *   {
 *     getWorkspaceId: (input) => input.workspace_id
 *   }
 * )
 *
 * // Or without workspace requirement (for things like creating workspace):
 * export const createWorkspaceAction = protectedAction(
 *   async ({ user, supabase }, input) => {
 *     // ...
 *   }
 * )
 */
export function protectedAction<TInput, TOutput>(
  handler: (
    context: { user: User; supabase: SupabaseClient },
    input: TInput
  ) => Promise<TOutput>,
  options?: {
    /** Function to extract workspaceId from input (optional) */
    getWorkspaceId?: (input: TInput) => string
  }
) {
  return async (input: TInput): Promise<{ success: boolean; data?: TOutput; error?: string }> => {
    try {
      const supabase = await createClient()
      const user = await requireAuth(supabase)

      // Verify workspace access if required
      if (options?.getWorkspaceId) {
        const workspaceId = options.getWorkspaceId(input)
        await requireWorkspaceAccess(supabase, user.id, workspaceId)
      }

      const result = await handler({ user, supabase }, input)
      return { success: true, data: result }
    } catch (error) {
      // Return error with proper context
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.'
      return { success: false, error: errorMessage }
    }
  }
}
