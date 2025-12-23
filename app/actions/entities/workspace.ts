'use server'

import { createClient } from '@/lib/supabase/server'
import type { EntityTable } from '@/types/entities'

/**
 * Get all entity tables for a workspace
 *
 * @param workspaceId - UUID of the workspace (organization)
 * @returns { success: true, data: EntityTable[] } or { success: false, error: message }
 */
export async function getWorkspaceTablesAction(workspaceId: string) {
  try {
    // ===== 1. AUTHENTICATE USER
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Vous devez être connecté pour accéder aux tables.',
      }
    }

    // ===== 2. VERIFY USER HAS ACCESS TO WORKSPACE
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', workspaceId)
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Vous n\'avez pas accès à ce workspace.',
      }
    }

    // ===== 3. FETCH ALL TABLES FOR THIS WORKSPACE
    const { data: tables, error: tablesError } = await supabase
      .from('entity_tables')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (tablesError) {
      console.error('Error fetching tables:', tablesError)
      return {
        success: false,
        error: 'Impossible de récupérer les tables.',
      }
    }

    // ===== 4. RETURN SUCCESS
    return {
      success: true,
      data: (tables || []) as EntityTable[],
    }
  } catch (error) {
    console.error('Error in getWorkspaceTablesAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
    }
  }
}
