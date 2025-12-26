import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MembersClient from './members-client'

/**
 * Organization Members Management Page (Server Component)
 * 
 * Fetches user and organization data server-side,
 * then passes to client component for interactions
 */
export default async function MembersPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // Get user's organizations
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (membershipError || !memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  // Use the first organization (primary org)
  const organizationId = memberships[0].organization_id

  // Get organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  return (
    <MembersClient 
      user={user} 
      organizationId={organizationId}
      organizationName={organization?.name || 'Organization'}
    />
  )
}
