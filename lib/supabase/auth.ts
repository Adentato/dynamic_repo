import { createClient } from './server'
import { Profile, Organization, OrganizationMember } from '@/types/database'

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  return { user: data.user, error }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { user: data.user, error }
}

export async function signOut() {
  const supabase = await createClient()
  return await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return null
  }

  const user = authData.user

  // Fetch profile - use maybeSingle() to avoid errors if no profile exists
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profileData) {
    return null
  }

  const profile = profileData as Profile

  // Fetch organization - use maybeSingle() to avoid errors if no org exists
  // maybeSingle() returns null instead of throwing when no row is found
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, slug, description, created_at, updated_at, created_by)')
    .eq('user_id', user.id)
    .maybeSingle()

  let organization: Organization | null = null

  // Only set organization if memberData exists and has organizations
  if (!memberError && memberData && memberData.organizations) {
    organization = memberData.organizations as any as Organization
  }

  // Return in the format expected by Navbar and other components
  return {
    profile: {
      full_name: profile.full_name,
      email: profile.email || user.email || '',
    },
    organization: organization ? {
      name: organization.name,
      slug: organization.slug,
    } : null,
  }
}
