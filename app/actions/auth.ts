'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUpAction(formData: {
  email: string
  password: string
  fullName: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signInAction(formData: {
  email: string
  password: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getCurrentUserAction() {
  const supabase = await createClient()

  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return null
  }

  const user = authData.user

  // Fetch profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileData) {
    return null
  }

  const profile = profileData

  // Fetch organization
  const { data: memberData } = await supabase
    .from('organization_members')
    .select(
      'organization_id, organizations(id, name, slug, description, created_at, updated_at, created_by)'
    )
    .eq('user_id', user.id)
    .single()

  let organization = null

  if (memberData && memberData.organizations) {
    organization = memberData.organizations as any
  }

  return { user, profile, organization }
}

export async function createOrganizationAction(
  name: string,
  slug: string,
  description?: string
) {
  const supabase = await createClient()

  // Get current user
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return { organization: null, error: 'Not authenticated' }
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
    return { organization: null, error: orgError?.message || 'Error creating organization' }
  }

  const organization = orgData

  // Create organization member (owner)
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) {
    return { organization: null, error: memberError.message }
  }

  return { organization, error: null }
}
