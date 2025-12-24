'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { EntityTable } from '@/types/entities'

/**
 * Poll until a condition is met or timeout is reached
 * Used to wait for Supabase RLS to sync new memberships
 */
async function pollUntil(
  condition: () => Promise<boolean>,
  maxAttempts: number = 20,
  delayMs: number = 200
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await condition()) {
      return true
    }
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  return false
}

/**
 * Create a new workspace (Organization) for the authenticated user
 * 
 * @param formData - { name, slug, description? }
 * @returns { success: true, data: { id } } or { success: false, error: message }
 */
export async function createWorkspaceAction(formData: {
  name: string
  slug: string
  description?: string
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      error: 'Non authentifié',
    }
  }

  // Validate input
  if (!formData.name || !formData.slug) {
    return {
      success: false,
      error: 'Le nom et le slug sont requis',
    }
  }

  // Check if slug already exists for this user
  const { data: existingWorkspace } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', formData.slug)
    .eq('created_by', user.id)
    .maybeSingle()

  if (existingWorkspace) {
    return {
      success: false,
      error: 'Ce slug est déjà utilisé',
    }
  }

  // Create organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (orgError) {
    console.error('Error creating organization:', orgError)
    return {
      success: false,
      error: orgError.message,
    }
  }

  if (!organization) {
    return {
      success: false,
      error: 'Erreur lors de la création du workspace',
    }
  }

  // Create organization member (owner)
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    // Rollback: delete the organization if member creation fails
    await supabase.from('organizations').delete().eq('id', organization.id)
    console.error('Error creating member:', memberError)
    return {
      success: false,
      error: 'Erreur lors de l\'ajout comme membre: ' + memberError.message,
    }
  }

  // Success - wait for RLS to recognize the new membership
  // Poll until the membership is visible through RLS policy
  const membershipVisible = await pollUntil(
    async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('user_id', user.id)
        .maybeSingle()
      return !!data
    },
    20,
    200
  )

  if (!membershipVisible) {
    console.warn('Membership not visible via RLS after polling, continuing anyway')
  }

  // Revalidate and redirect
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/', 'layout')
  
  // Use server-side redirect to ensure data is ready
  redirect('/dashboard')
}

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
