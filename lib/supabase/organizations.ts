import { createClient } from './server'
import { Organization } from '@/types/database'

export async function createOrganization(
  name: string,
  slug: string,
  description?: string
) {
  const supabase = await createClient()

  // Get current user
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return { organization: null, error: new Error('Not authenticated') }
  }

  const userId = authData.user.id

  // Create organization
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      description: description || null,
      created_by: userId,
    })
    .select()
    .single()

  if (orgError || !orgData) {
    return { organization: null, error: orgError }
  }

  const organization = orgData as Organization

  // Create organization member (owner)
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) {
    return { organization: null, error: memberError }
  }

  return { organization, error: null }
}

export async function getMyOrganization() {
  const supabase = await createClient()

  // Get current user
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return null
  }

  const userId = authData.user.id

  // Fetch organization
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select(
      'organization_id, organizations(id, name, slug, description, created_at, updated_at, created_by)'
    )
    .eq('user_id', userId)
    .single()

  if (memberError || !memberData || !memberData.organizations) {
    return null
  }

  return memberData.organizations as any as Organization
}
