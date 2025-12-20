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

  // Signup simple sans redirections complexes
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
      },
    },
  })

  if (signUpError) {
    return { error: signUpError.message, success: false }
  }

  if (!signUpData.user) {
    return { error: 'Erreur lors de la création du compte', success: false }
  }

  // Attendre un peu que Supabase synchronise
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Connexion automatique avec les mêmes credentials
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (signInError) {
    console.error('Auto-login error:', signInError)
    return { 
      error: 'Compte créé ! Connectez-vous maintenant avec vos identifiants.', 
      success: true 
    }
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
