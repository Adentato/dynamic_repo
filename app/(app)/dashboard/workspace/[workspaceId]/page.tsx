import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { getWorkspaceHierarchyAction } from '@/app/actions/entities/projects'
import { DashboardClient } from '@/components/dashboard-client'
import { Breadcrumb } from '@/components/breadcrumb'

interface WorkspacePageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default async function WorkspacePage({ params: paramsPromise }: WorkspacePageProps) {
  try {
    const params = await paramsPromise
    const supabase = await createClient()
    
    // Récupérer l'utilisateur
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Vérifier que l'utilisateur a accès à ce workspace
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('*, organization:organizations(*)')
      .eq('user_id', user.id)
      .eq('organization_id', params.workspaceId)
      .maybeSingle()

    if (membershipError || !membership) {
      console.error('Workspace access denied')
      redirect('/dashboard')
    }

    const organization = (membership as any).organization

    // Récupérer la hiérarchie du workspace (projets + tables)
    const hierarchyResult = await getWorkspaceHierarchyAction(params.workspaceId)
    const hierarchy = hierarchyResult.success && hierarchyResult.data 
      ? hierarchyResult.data 
      : { projects: [], tablesWithoutProject: [] }

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
          {/* Header */}
          <div className="border-b border-zinc-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {/* Breadcrumb */}
              <div className="mb-4">
                <Breadcrumb
                  items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: organization.name },
                  ]}
                />
              </div>

              <h1 className="text-2xl font-bold text-zinc-900">
                Bienvenue dans {organization.name}, {profile?.full_name || 'Utilisateur'}
              </h1>
            </div>
          </div>

          {/* Content */}
          <DashboardClient
            workspaceId={params.workspaceId}
            organizationName={organization.name}
            userName={profile?.full_name || 'Utilisateur'}
            hierarchy={hierarchy}
          />
        </main>
      </>
    )
  } catch (error) {
    console.error('Workspace error:', error)
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
                Impossible de charger le workspace. Veuillez réessayer.
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }
}
