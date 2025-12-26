'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { success, failure, type ActionResult } from '@/lib/types/action-result'

interface WorkspaceInvitation {
  id: string
  organization_id: string
  email: string
  token: string
  role: string
  created_by_user_id: string
  created_at: string
  expires_at: string | null
  accepted_at: string | null
  accepted_by_user_id: string | null
}

/**
 * Send an invitation to join an organization
 * Only organization owners/admins can invite
 * 
 * @param organizationId - UUID of the organization
 * @param email - Email of the person to invite
 * @param role - Role for the invited user (default: 'member')
 * @returns ActionResult with invitation details
 */
export async function inviteUserToOrganizationAction(
  organizationId: string,
  email: string,
  role: string = 'member'
): Promise<ActionResult<{ invitation: WorkspaceInvitation }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return failure('Non authentifié')
    }

    // Verify user is owner/admin of organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return failure('Vous n\'avez pas les permissions pour inviter des utilisateurs')
    }

    // Check if invitation already exists for this email/org
    const { data: existingInvitation } = await supabase
      .from('workspace_invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('accepted_by_user_id', null)
      .maybeSingle()

    if (existingInvitation) {
      return failure('Une invitation est déjà en attente pour cet email')
    }

    // Generate unique token
    const token = crypto.randomUUID()

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('workspace_invitations')
      .insert({
        organization_id: organizationId,
        email: email,
        token: token,
        role: role,
        created_by_user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (inviteError || !invitation) {
      console.error('Error creating invitation:', inviteError)
      return failure('Erreur lors de l\'envoi de l\'invitation')
    }

    // TODO: Send email with invitation link
    // For now, just return the token so admin can share manually
    console.log(`[Invitation Created] Email: ${email}, Token: ${token}`)

    revalidatePath(`/dashboard/settings/members`)

    return success({ invitation })
  } catch (error) {
    return failure(error)
  }
}

/**
 * Accept an invitation and join an organization
 * 
 * @param token - Unique invitation token
 * @returns ActionResult with redirect to dashboard
 */
export async function acceptInvitationAction(
  token: string
): Promise<ActionResult<{ organizationId: string }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return failure('Non authentifié - Veuillez vous connecter')
    }

    // Find invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (inviteError || !invitation) {
      return failure('Invitation invalide ou expirée')
    }

    // Check if invitation is expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return failure('L\'invitation a expiré')
    }

    // Check if invitation is already accepted
    if (invitation.accepted_at) {
      return failure('Cette invitation a déjà été acceptée')
    }

    // Check if email matches current user
    const userEmail = user.email || ''
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return failure('Cette invitation est destinée à un autre email')
    }

    // Check if user is already member of organization
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      return failure('Vous êtes déjà membre de cette organisation')
    }

    // Add user as member of organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      })

    if (memberError) {
      console.error('Error adding organization member:', memberError)
      return failure('Erreur lors de l\'ajout à l\'organisation')
    }

    // Mark invitation as accepted
    const { error: acceptError } = await supabase
      .from('workspace_invitations')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: user.id,
      })
      .eq('token', token)

    if (acceptError) {
      console.error('Error accepting invitation:', acceptError)
      return failure('Erreur lors de l\'acceptation de l\'invitation')
    }

    revalidatePath('/dashboard', 'layout')

    return success({ organizationId: invitation.organization_id })
  } catch (error) {
    return failure(error)
  }
}

/**
 * Get all members of an organization
 * Only accessible to organization members
 * 
 * @param organizationId - UUID of the organization
 * @returns ActionResult with list of members
 */
export async function getOrganizationMembersAction(
  organizationId: string
): Promise<ActionResult<{ members: Array<{ id: string; email: string; role: string; joined_at: string }> }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return failure('Non authentifié')
    }

    // Verify user is member of organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return failure('Vous n\'êtes pas membre de cette organisation')
    }

    // Get all members with their email from profiles/auth
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('id, user_id, role, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })

    if (membersError) {
      return failure('Erreur lors de la récupération des membres')
    }

    if (!members || members.length === 0) {
      return success({ members: [] })
    }

    // Get user emails from auth
    const memberIds = members.map(m => m.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', memberIds)

    if (profilesError) {
      console.warn('Error fetching profiles:', profilesError)
    }

    // Map members with their email
    const memberList = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id)
      return {
        id: member.user_id,
        email: profile?.email || 'unknown@example.com',
        role: member.role,
        joined_at: member.created_at
      }
    })

    return success({ members: memberList })
  } catch (error) {
    return failure(error)
  }
}

/**
 * Get all invitations for an organization
 * Only accessible to organization admins
 * 
 * @param organizationId - UUID of the organization
 * @returns ActionResult with list of invitations
 */
export async function getOrganizationInvitationsAction(
  organizationId: string
): Promise<ActionResult<{ invitations: WorkspaceInvitation[] }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return failure('Non authentifié')
    }

    // Verify user is owner/admin of organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return failure('Vous n\'avez pas les permissions pour voir les invitations')
    }

    // Get all invitations (pending and accepted)
    const { data: invitations, error: inviteError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (inviteError) {
      return failure('Erreur lors de la récupération des invitations')
    }

    return success({ invitations: invitations || [] })
  } catch (error) {
    return failure(error)
  }
}

/**
 * Delete/revoke an invitation
 * Only accessible to organization admins
 * 
 * @param invitationId - UUID of the invitation
 * @returns ActionResult
 */
export async function revokeInvitationAction(
  invitationId: string
): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return failure('Non authentifié')
    }

    // Get invitation and verify permissions
    const { data: invitation, error: inviteError } = await supabase
      .from('workspace_invitations')
      .select('organization_id')
      .eq('id', invitationId)
      .maybeSingle()

    if (inviteError || !invitation) {
      return failure('Invitation not found')
    }

    // Verify user is owner/admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return failure('Vous n\'avez pas les permissions')
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      return failure('Erreur lors de la suppression de l\'invitation')
    }

    revalidatePath(`/dashboard/settings/members`)

    return success(null)
  } catch (error) {
    return failure(error)
  }
}
