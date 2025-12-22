'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Poll until a condition is met or timeout is reached
 * @param condition - Function that returns true when condition is met
 * @param maxAttempts - Maximum number of attempts (default: 10)
 * @param delayMs - Delay between attempts in milliseconds (default: 500)
 */
async function pollUntil(
  condition: () => Promise<boolean>,
  maxAttempts: number = 10,
  delayMs: number = 500
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
    // Check if user already exists
    if (signUpError.message.includes('already registered') || 
        signUpError.message.includes('User already exists')) {
      return { 
        error: 'Cet email est déjà utilisé. Veuillez vous connecter à votre compte ou utiliser un autre email.', 
        success: false 
      }
    }
    return { error: signUpError.message, success: false }
  }

  if (!signUpData.user) {
    return { error: 'Erreur lors de la création du compte', success: false }
  }

  // Poll until profile is created by Supabase auth trigger
  const userId = signUpData.user.id
  const profileCreated = await pollUntil(
    async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      return !!data
    },
    15,
    300
  )

  if (!profileCreated) {
    console.warn('Profile not created after polling, continuing anyway')
  }

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


export async function createOrganizationAction(formData: {
  name: string
  slug: string
  description?: string
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log('[createOrganizationAction] User:', user?.id, 'Error:', userError)

  if (userError || !user) {
    return { error: 'Non authentifié' }
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

  console.log('[createOrganizationAction] Organization created:', organization?.id, 'Error:', orgError)

  if (orgError) {
    return { error: orgError.message }
  }

  if (!organization) {
    return { error: 'Erreur lors de la création de l\'organisation' }
  }

  // Create organization member (owner)
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: user.id,
      role: 'owner',
    })

  console.log('[createOrganizationAction] Member created for org:', organization.id, 'user:', user.id, 'Error:', memberError)

  if (memberError) {
    // Rollback: delete the organization if member creation fails
    await supabase.from('organizations').delete().eq('id', organization.id)
    console.log('[createOrganizationAction] Rolled back organization due to member error')
    return { error: 'Erreur lors de l\'ajout comme membre: ' + memberError.message }
  }

  console.log('[createOrganizationAction] Success, revalidating and redirecting to /dashboard')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
