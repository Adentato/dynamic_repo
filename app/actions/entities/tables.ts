'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createTableSchema,
  type CreateTableInput,
} from '@/lib/validations/entities'
import {
  requireAuth,
  requireWorkspaceAccess,
  requireProjectInWorkspace,
} from '@/lib/auth/workspace'
import { success, failure, type ActionResult } from '@/lib/types/action-result'
import type {
  EntityTable,
  EntityField,
  EntityTableWithFields,
} from '@/types/entities'

/**
 * Create a new entity table in a workspace or project
 *
 * @param input - CreateTableInput with workspace_id, name, description, and optional project_id
 * @returns ActionResult<EntityTable>
 */
export async function createEntityTableAction(
  input: CreateTableInput
): Promise<ActionResult<EntityTable>> {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Validate input
    const validatedInput = createTableSchema.parse(input)

    // Verify workspace access
    await requireWorkspaceAccess(supabase, user.id, validatedInput.workspace_id)

    // If project_id provided, verify it belongs to workspace
    if (validatedInput.project_id) {
      await requireProjectInWorkspace(
        supabase,
        validatedInput.project_id,
        validatedInput.workspace_id
      )
    }

    // Create table
    const { data: newTable, error: insertError } = await supabase
      .from('entity_tables')
      .insert({
        workspace_id: validatedInput.workspace_id,
        project_id: validatedInput.project_id || null,
        name: validatedInput.name,
        description: validatedInput.description,
      })
      .select('*')
      .single()

    if (insertError || !newTable) {
      throw new Error('Impossible de créer la table. Veuillez réessayer.')
    }

    // Revalidate cache
    revalidatePath('/dashboard')
    revalidatePath(`/workspace/${validatedInput.workspace_id}`)
    if (validatedInput.project_id) {
      revalidatePath(`/workspace/${validatedInput.workspace_id}/project/${validatedInput.project_id}`)
    }

    return success(newTable as EntityTable)
  } catch (error) {
    return failure(error)
  }
}

/**
 * Get entity table details with all its fields
 *
 * @param tableId - UUID of the entity_table
 * @returns ActionResult<EntityTableWithFields>
 */
export async function getEntityTableDetailsAction(
  tableId: string
): Promise<ActionResult<EntityTableWithFields>> {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Fetch table with fields
    const { data: table, error: tableError } = await supabase
      .from('entity_tables')
      .select('*, fields:entity_fields(*)')
      .eq('id', tableId)
      .maybeSingle()

    if (tableError) {
      throw new Error('Impossible de récupérer la table.')
    }

    if (!table) {
      throw new Error('Table non trouvée.')
    }

    // Verify workspace access
    await requireWorkspaceAccess(supabase, user.id, table.workspace_id)

    // Sort fields by order_index
    const sortedFields = (table.fields as EntityField[]).sort(
      (a, b) => a.order_index - b.order_index
    )

    // Build response
    const result: EntityTableWithFields = {
      id: table.id,
      workspace_id: table.workspace_id,
      project_id: table.project_id,
      name: table.name,
      description: table.description,
      created_at: table.created_at,
      updated_at: table.updated_at,
      fields: sortedFields,
    }

    return success(result)
  } catch (error) {
    return failure(error)
  }
}
