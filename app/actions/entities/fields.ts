'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createFieldSchema,
  updateFieldSchema,
  type CreateFieldInput,
  type UpdateFieldInput,
} from '@/lib/validations/entities'
import {
  requireAuth,
  requireWorkspaceAccess,
  NotFoundError,
} from '@/lib/auth/workspace'
import { success, failure, type ActionResult } from '@/lib/types/action-result'
import type {
  EntityField,
} from '@/types/entities'

/**
 * Create a new field in an entity table
 *
 * @param input - CreateFieldInput with table_id, name, type, options
 * @returns ActionResult<EntityField>
 */
export async function createEntityFieldAction(
  input: CreateFieldInput
): Promise<ActionResult<EntityField>> {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Validate input
    const validatedInput = createFieldSchema.parse(input)

    // Verify user has access to workspace (via parent table)
    const { data: parentTable, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', validatedInput.table_id)
      .maybeSingle()

    if (tableError || !parentTable) {
      throw new NotFoundError('Table parente non trouvée.')
    }

    // Verify workspace access
    await requireWorkspaceAccess(supabase, user.id, parentTable.workspace_id)

    // Calculate order_index
    const { data: maxOrderField } = await supabase
      .from('entity_fields')
      .select('order_index')
      .eq('table_id', validatedInput.table_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newOrderIndex = maxOrderField ? (maxOrderField as any).order_index + 1 : 0

    // Insert field
    const { data: newField, error: insertError } = await supabase
      .from('entity_fields')
      .insert({
        table_id: validatedInput.table_id,
        name: validatedInput.name,
        type: validatedInput.type,
        options: validatedInput.options || {},
        order_index: newOrderIndex,
      })
      .select('*')
      .single()

    if (insertError || !newField) {
      throw new Error('Impossible de créer le champ. Veuillez réessayer.')
    }

    // Revalidate cache
    revalidatePath('/dashboard')
    revalidatePath(`/table/${validatedInput.table_id}`)

    return success(newField as EntityField)
  } catch (error) {
    return failure(error)
  }
}

/**
 * Update an existing field
 *
 * @param input - UpdateFieldInput with field_id and optional fields to update
 * @returns ActionResult<EntityField>
 */
export async function updateEntityFieldAction(
  input: UpdateFieldInput
): Promise<ActionResult<EntityField>> {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Validate input
    const validatedInput = updateFieldSchema.parse(input)

    // Get field and verify workspace access
    const { data: field, error: fieldError } = await supabase
      .from('entity_fields')
      .select('table_id, table:entity_tables(workspace_id)')
      .eq('id', validatedInput.field_id)
      .maybeSingle()

    if (fieldError || !field) {
      throw new NotFoundError('Champ')
    }

    // Verify workspace access via table
    const workspaceId = (field as any).table?.workspace_id
    if (!workspaceId) {
      throw new NotFoundError('Table parente non trouvée.')
    }
    await requireWorkspaceAccess(supabase, user.id, workspaceId)

    // Build update object
    const updateData: Record<string, any> = {}
    if (validatedInput.name !== undefined) updateData.name = validatedInput.name
    if (validatedInput.type !== undefined) updateData.type = validatedInput.type
    if (validatedInput.options !== undefined) updateData.options = validatedInput.options
    if (validatedInput.order_index !== undefined) updateData.order_index = validatedInput.order_index

    // Update field
    const { data: updatedField, error: updateError } = await supabase
      .from('entity_fields')
      .update(updateData)
      .eq('id', validatedInput.field_id)
      .select('*')
      .single()

    if (updateError || !updatedField) {
      throw new Error('Impossible de modifier le champ. Veuillez réessayer.')
    }

    // Revalidate cache
    revalidatePath('/dashboard')
    revalidatePath(`/table/${(field as any).table_id}`)

    return success(updatedField as EntityField)
  } catch (error) {
    return failure(error)
  }
}

/**
 * Delete an entity field
 *
 * @param fieldId - UUID of the field to delete
 * @returns ActionResult<void>
 */
export async function deleteEntityFieldAction(fieldId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Get field and verify workspace access
    const { data: field, error: fieldError } = await supabase
      .from('entity_fields')
      .select('table_id, table:entity_tables(workspace_id)')
      .eq('id', fieldId)
      .maybeSingle()

    if (fieldError || !field) {
      throw new NotFoundError('Champ')
    }

    // Verify workspace access via table
    const workspaceId = (field as any).table?.workspace_id
    if (!workspaceId) {
      throw new NotFoundError('Table parente non trouvée.')
    }
    await requireWorkspaceAccess(supabase, user.id, workspaceId)

    // Delete field
    const { error: deleteError } = await supabase
      .from('entity_fields')
      .delete()
      .eq('id', fieldId)

    if (deleteError) {
      throw new Error('Impossible de supprimer le champ. Veuillez réessayer.')
    }

    // Revalidate cache
    revalidatePath('/dashboard')
    revalidatePath(`/table/${(field as any).table_id}`)

    return success(undefined)
  } catch (error) {
    return failure(error)
  }
}
