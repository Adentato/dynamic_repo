'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createFieldSchema,
  updateFieldSchema,
  type CreateFieldInput,
  type UpdateFieldInput,
} from '@/lib/validations/entities'
import type {
  EntityField,
} from '@/types/entities'

/**
 * Create a new field in an entity table
 *
 * @param input - CreateFieldInput with table_id, name, type, options
 * @returns { success: true, data: field } or { success: false, error: message }
 */
export async function createEntityFieldAction(input: CreateFieldInput) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer un champ.',
      }
    }

    // ===== 2. VALIDATE INPUT
    const validatedInput = createFieldSchema.parse(input)

    // ===== 3. VERIFY USER HAS ACCESS TO WORKSPACE (via parent table)
    // Get the table first to check its workspace_id
    const { data: parentTable, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', validatedInput.table_id)
      .maybeSingle()

    if (tableError || !parentTable) {
      return {
        success: false,
        error: 'Table parente non trouvée.',
      }
    }

    // Check if user is member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', parentTable.workspace_id)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 4. CALCULATE ORDER_INDEX
    // Get the highest order_index for this table
    const { data: maxOrderField } = await supabase
      .from('entity_fields')
      .select('order_index')
      .eq('table_id', validatedInput.table_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newOrderIndex = maxOrderField ? (maxOrderField as any).order_index + 1 : 0

    // ===== 5. INSERT FIELD INTO DATABASE
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
      console.error('Error creating field:', insertError)
      return {
        success: false,
        error: 'Impossible de créer le champ. Veuillez réessayer.',
      }
    }

    // ===== 6. REVALIDATE CACHE
    revalidatePath('/dashboard')
    revalidatePath(`/table/${validatedInput.table_id}`)

    // ===== 7. RETURN SUCCESS
    return {
      success: true,
      data: newField as EntityField,
    }
  } catch (error) {
    console.error('Error in createEntityFieldAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}

/**
 * Update an existing field
 *
 * @param input - UpdateFieldInput with field_id and optional fields to update
 * @returns { success: true, data: field } or { success: false, error: message }
 */
export async function updateEntityFieldAction(input: UpdateFieldInput) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour modifier un champ.',
      }
    }

    // ===== 2. VALIDATE INPUT
    const validatedInput = updateFieldSchema.parse(input)

    // ===== 3. VERIFY USER HAS ACCESS TO WORKSPACE (via field)
    // Get the field first
    const { data: field, error: fieldError } = await supabase
      .from('entity_fields')
      .select('table_id')
      .eq('id', validatedInput.field_id)
      .maybeSingle()

    if (fieldError || !field) {
      return {
        success: false,
        error: 'Champ non trouvé.',
      }
    }

    // Get the parent table to check workspace access
    const { data: parentTable, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', (field as any).table_id)
      .maybeSingle()

    if (tableError || !parentTable) {
      return {
        success: false,
        error: 'Table parente non trouvée.',
      }
    }

    // Check if user is member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', (parentTable as any).workspace_id)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 4. BUILD UPDATE OBJECT (only include provided fields)
    const updateData: Record<string, any> = {}
    if (validatedInput.name !== undefined) updateData.name = validatedInput.name
    if (validatedInput.type !== undefined) updateData.type = validatedInput.type
    if (validatedInput.options !== undefined) updateData.options = validatedInput.options
    if (validatedInput.order_index !== undefined) updateData.order_index = validatedInput.order_index

    // ===== 5. UPDATE FIELD IN DATABASE
    const { data: updatedField, error: updateError } = await supabase
      .from('entity_fields')
      .update(updateData)
      .eq('id', validatedInput.field_id)
      .select('*')
      .single()

    if (updateError || !updatedField) {
      console.error('Error updating field:', updateError)
      return {
        success: false,
        error: 'Impossible de modifier le champ. Veuillez réessayer.',
      }
    }

    // ===== 6. REVALIDATE CACHE
    revalidatePath('/dashboard')
    revalidatePath(`/table/${(field as any).table_id}`)

    // ===== 7. RETURN SUCCESS
    return {
      success: true,
      data: updatedField as EntityField,
    }
  } catch (error) {
    console.error('Error in updateEntityFieldAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}

/**
 * Delete an entity field
 *
 * @param fieldId - UUID of the field to delete
 * @returns { success: true } or { success: false, error: message }
 */
export async function deleteEntityFieldAction(fieldId: string) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour supprimer un champ.',
      }
    }

    // ===== 2. VERIFY USER HAS ACCESS TO WORKSPACE (via field)
    // Get the field first
    const { data: field, error: fieldError } = await supabase
      .from('entity_fields')
      .select('table_id')
      .eq('id', fieldId)
      .maybeSingle()

    if (fieldError || !field) {
      return {
        success: false,
        error: 'Champ non trouvé.',
      }
    }

    // Get the parent table to check workspace access
    const { data: parentTable, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', (field as any).table_id)
      .maybeSingle()

    if (tableError || !parentTable) {
      return {
        success: false,
        error: 'Table parente non trouvée.',
      }
    }

    // Check if user is member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', (parentTable as any).workspace_id)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 3. DELETE FIELD FROM DATABASE
    const { error: deleteError } = await supabase
      .from('entity_fields')
      .delete()
      .eq('id', fieldId)

    if (deleteError) {
      console.error('Error deleting field:', deleteError)
      return {
        success: false,
        error: 'Impossible de supprimer le champ. Veuillez réessayer.',
      }
    }

    // ===== 4. REVALIDATE CACHE
    revalidatePath('/dashboard')
    revalidatePath(`/table/${(field as any).table_id}`)

    // ===== 5. RETURN SUCCESS
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteEntityFieldAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}
