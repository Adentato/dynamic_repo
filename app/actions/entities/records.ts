'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  upsertRecordSchema,
  type UpsertRecordInput,
} from '@/lib/validations/entities'
import type {
  EntityRecord,
} from '@/types/entities'

/**
 * Get all records for a specific table
 *
 * @param tableId - UUID of the entity_table
 * @returns { success: true, data: EntityRecord[] } or { success: false, error: message }
 */
export async function getEntityRecordsAction(tableId: string) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour accéder aux enregistrements.',
      }
    }

    // ===== 2. VERIFY USER HAS ACCESS TO WORKSPACE (via table)
    // Get the table first to check its workspace_id
    const { data: table, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', tableId)
      .maybeSingle()

    if (tableError || !table) {
      return {
        success: false,
        error: 'Table non trouvée.',
      }
    }

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

    // ===== 3. FETCH RECORDS SORTED BY created_at DESC
    const { data: records, error: recordsError } = await supabase
      .from('entity_records')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    if (recordsError) {
      console.error('Error fetching records:', recordsError)
      return {
        success: false,
        error: 'Impossible de récupérer les enregistrements.',
      }
    }

    // ===== 4. RETURN SUCCESS
    return {
      success: true,
      data: records as EntityRecord[],
    }
  } catch (error) {
    console.error('Error in getEntityRecordsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}

/**
 * Create a new record in an entity table
 *
 * @param input - UpsertRecordInput with table_id and data
 * @returns { success: true, data: record } or { success: false, error: message }
 */
export async function createEntityRecordAction(input: UpsertRecordInput) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer un enregistrement.',
      }
    }

    // ===== 2. VALIDATE INPUT
    const validatedInput = upsertRecordSchema.parse(input)

    // ===== 3. VERIFY USER HAS ACCESS TO WORKSPACE (via table)
    // Get the table first to check its workspace_id
    const { data: table, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', validatedInput.table_id)
      .maybeSingle()

    if (tableError || !table) {
      return {
        success: false,
        error: 'Table non trouvée.',
      }
    }

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

    // ===== 4. INSERT RECORD INTO DATABASE
    const { data: newRecord, error: insertError } = await supabase
      .from('entity_records')
      .insert({
        table_id: validatedInput.table_id,
        data: validatedInput.data || {},
      })
      .select('*')
      .single()

    if (insertError || !newRecord) {
      console.error('Error creating record:', insertError)
      return {
        success: false,
        error: 'Impossible de créer l\'enregistrement. Veuillez réessayer.',
      }
    }

    // ===== 5. REVALIDATE CACHE
    revalidatePath('/dashboard')
    revalidatePath(`/table/${validatedInput.table_id}`)

    // ===== 6. RETURN SUCCESS
    return {
      success: true,
      data: newRecord as EntityRecord,
    }
  } catch (error) {
    console.error('Error in createEntityRecordAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}

/**
 * Update an existing record
 *
 * @param recordId - UUID of the record to update
 * @param data - New data object to replace the existing data
 * @returns { success: true, data: record } or { success: false, error: message }
 */
export async function updateEntityRecordAction(recordId: string, data: Record<string, any>) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour modifier un enregistrement.',
      }
    }

    // ===== 2. VERIFY USER HAS ACCESS TO WORKSPACE (via record)
    // Get the record first to check its table_id
    const { data: record, error: recordError } = await supabase
      .from('entity_records')
      .select('table_id')
      .eq('id', recordId)
      .maybeSingle()

    if (recordError || !record) {
      return {
        success: false,
        error: 'Enregistrement non trouvé.',
      }
    }

    // Get the parent table to check workspace access
    const { data: table, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', (record as any).table_id)
      .maybeSingle()

    if (tableError || !table) {
      return {
        success: false,
        error: 'Table parente non trouvée.',
      }
    }

    // Check if user is member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', (table as any).workspace_id)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 3. UPDATE RECORD IN DATABASE
    const { data: updatedRecord, error: updateError } = await supabase
      .from('entity_records')
      .update({
        data: data,
      })
      .eq('id', recordId)
      .select('*')
      .single()

    if (updateError || !updatedRecord) {
      console.error('Error updating record:', updateError)
      return {
        success: false,
        error: 'Impossible de modifier l\'enregistrement. Veuillez réessayer.',
      }
    }

    // ===== 4. REVALIDATE CACHE
    revalidatePath('/dashboard')
    revalidatePath(`/table/${(record as any).table_id}`)

    // ===== 5. RETURN SUCCESS
    return {
      success: true,
      data: updatedRecord as EntityRecord,
    }
  } catch (error) {
    console.error('Error in updateEntityRecordAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}

/**
 * Delete an entity record
 *
 * @param recordId - UUID of the record to delete
 * @returns { success: true } or { success: false, error: message }
 */
export async function deleteEntityRecordAction(recordId: string) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour supprimer un enregistrement.',
      }
    }

    // ===== 2. VERIFY USER HAS ACCESS TO WORKSPACE (via record)
    // Get the record first to check its table_id
    const { data: record, error: recordError } = await supabase
      .from('entity_records')
      .select('table_id')
      .eq('id', recordId)
      .maybeSingle()

    if (recordError || !record) {
      return {
        success: false,
        error: 'Enregistrement non trouvé.',
      }
    }

    // Get the parent table to check workspace access
    const { data: table, error: tableError } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', (record as any).table_id)
      .maybeSingle()

    if (tableError || !table) {
      return {
        success: false,
        error: 'Table parente non trouvée.',
      }
    }

    // Check if user is member of the workspace
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', (table as any).workspace_id)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 3. DELETE RECORD FROM DATABASE
    const { error: deleteError } = await supabase
      .from('entity_records')
      .delete()
      .eq('id', recordId)

    if (deleteError) {
      console.error('Error deleting record:', deleteError)
      return {
        success: false,
        error: 'Impossible de supprimer l\'enregistrement. Veuillez réessayer.',
      }
    }

    // ===== 4. REVALIDATE CACHE
    revalidatePath('/dashboard')
    revalidatePath(`/table/${(record as any).table_id}`)

    // ===== 5. RETURN SUCCESS
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteEntityRecordAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}
