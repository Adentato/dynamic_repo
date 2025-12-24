import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'

interface Organization {
  id: string
  name: string
  slug: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Récupérer l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Récupérer toutes les organisations de l'utilisateur
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)

  if (membershipError || !memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  // Si l'utilisateur n'a qu'une seule organization, rediriger vers elle
  if (memberships.length === 1) {
    const workspace = (memberships[0] as any).organization as Organization
    redirect(`/dashboard/workspace/${workspace.id}`)
  }

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Prepare currentUser object for Navbar
  const currentUser = profile ? {
    profile: {
      full_name: profile.full_name,
      email: profile.email || '',
    },
    organization: {
      name: (memberships[0] as any).organization.name,
      slug: (memberships[0] as any).organization.slug,
    }
  } : null

  const organizations = memberships.map((m: any) => m.organization) as Organization[]

  return (
    <>
      <Navbar currentUser={currentUser} />
      <main className="min-h-screen bg-zinc-50">
        {/* Header */}
        <div className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-zinc-900">
              Mes Workspaces
            </h1>
            <p className="mt-2 text-zinc-600">
              Sélectionnez un workspace pour voir vos projets et tables
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Link
                key={org.id}
                href={`/dashboard/workspace/${org.id}`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <span className="text-lg font-bold text-blue-600">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  {org.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {org.slug}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
                  Accéder →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
