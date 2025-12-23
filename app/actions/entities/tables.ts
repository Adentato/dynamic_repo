'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createTableSchema,
  type CreateTableInput,
} from '@/lib/validations/entities'
import type {
  EntityTable,
  EntityField,
  EntityTableWithFields,
} from '@/types/entities'

/**
 * Create a new entity table in a workspace
 *
 * @param input - CreateTableInput with workspace_id, name, description
 * @returns { success: true, data: table } or { success: false, error: message }
 */
export async function createEntityTableAction(input: CreateTableInput) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer une table.',
      }
    }

    // ===== 2. VALIDATE INPUT
    const validatedInput = createTableSchema.parse(input)

    // ===== 3. VERIFY USER HAS ACCESS TO WORKSPACE
    // Check if user is member of this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', validatedInput.workspace_id)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 4. INSERT TABLE INTO DATABASE
    const { data: newTable, error: insertError } = await supabase
      .from('entity_tables')
      .insert({
        workspace_id: validatedInput.workspace_id,
        name: validatedInput.name,
        description: validatedInput.description,
      })
      .select('*')
      .single()

    if (insertError || !newTable) {
      console.error('Error creating table:', insertError)
      return {
        success: false,
        error: 'Impossible de créer la table. Veuillez réessayer.',
      }
    }

    // ===== 5. REVALIDATE CACHE
    revalidatePath('/dashboard')
    revalidatePath(`/workspace/${validatedInput.workspace_id}`)

    // ===== 6. RETURN SUCCESS
    return {
      success: true,
      data: newTable as EntityTable,
    }
  } catch (error) {
    console.error('Error in createEntityTableAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}

/**
 * Get entity table details with all its fields
 *
 * @param tableId - UUID of the entity_table
 * @returns { success: true, data: EntityTableWithFields } or { success: false, error: message }
 */
export async function getEntityTableDetailsAction(tableId: string) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour accéder à cette table.',
      }
    }

    // ===== 2. FETCH TABLE WITH FIELDS (NESTED SELECT)
    // The 'fields:entity_fields(*)' syntax creates a nested object with all fields
    const { data: table, error: tableError } = await supabase
      .from('entity_tables')
      .select('*, fields:entity_fields(*)')
      .eq('id', tableId)
      .maybeSingle()

    if (tableError) {
      console.error('Error fetching table:', tableError)
      return {
        success: false,
        error: 'Impossible de récupérer la table.',
      }
    }

    if (!table) {
      return {
        success: false,
        error: 'Table non trouvée.',
      }
    }

    // ===== 3. VERIFY USER HAS ACCESS TO WORKSPACE
    // Check if user is member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', table.workspace_id)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 4. SORT FIELDS BY ORDER_INDEX
    // Supabase nested selects can't be sorted directly in the query,
    // so we sort in JavaScript after retrieval
    const sortedFields = (table.fields as EntityField[])
      .sort((a, b) => a.order_index - b.order_index)

    // ===== 5. BUILD RESPONSE WITH TYPED RESULT
    const result: EntityTableWithFields = {
      id: table.id,
      workspace_id: table.workspace_id,
      name: table.name,
      description: table.description,
      created_at: table.created_at,
      updated_at: table.updated_at,
      fields: sortedFields,
    }

    // ===== 6. RETURN SUCCESS
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Error in getEntityTableDetailsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}
