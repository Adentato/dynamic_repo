import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { getWorkspaceTablesAction } from '@/app/actions/entities/workspace'
import { DashboardClient } from '@/components/dashboard-client'

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    
    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
    }

    // Récupérer le profil avec maybeSingle() pour éviter les erreurs
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Récupérer l'organisation via organization_members avec maybeSingle()
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) {
      console.error('Error fetching membership:', membershipError)
    }

    console.log('Dashboard - User:', user.id)
    console.log('Dashboard - Membership:', membership)

    // Si pas d'organization, rediriger vers onboarding
    if (!membership || !membership.organization) {
      console.log('No organization found, redirecting to onboarding')
      redirect('/onboarding')
    }

    const organization = membership.organization

    // ===== FETCH WORKSPACE TABLES
    const tablesResult = await getWorkspaceTablesAction(organization.id)
    console.log('Dashboard - Tables Result:', tablesResult)
    const tables = tablesResult.success && tablesResult.data ? tablesResult.data : []
    console.log('Dashboard - Tables Count:', tables.length)

    // Prepare currentUser object for Navbar
    const currentUser = profile ? {
      profile: {
        full_name: profile.full_name,
        email: profile.email || '',
      },
      organization: {
        name: organization.name,
        slug: organization.slug,
      }
    } : null

    return (
      <>
        <Navbar currentUser={currentUser} />
        <main className="min-h-screen bg-zinc-50">
          <div className="border-b border-zinc-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-zinc-900">
                Bienvenue dans {organization.name}, {profile?.full_name || 'Utilisateur'}
              </h1>
            </div>
          </div>
          <DashboardClient
            workspaceId={organization.id}
            organizationName={organization.name}
            userName={profile?.full_name || 'Utilisateur'}
            tables={tables}
          />
        </main>
      </>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return (
      <>
        <Navbar currentUser={null} />
        <main className="min-h-screen bg-zinc-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
              <h2 className="text-lg font-semibold text-red-900">
                Une erreur est survenue
              </h2>
              <p className="mt-2 text-red-700">
                Impossible de charger le tableau de bord. Veuillez réessayer.
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }
}
