import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Récupérer l'utilisateur
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Récupérer l'organisation via organization_members
  const { data: membership } = await supabase
    .from('organization_members')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', user.id)
    .single()

  console.log('Dashboard - User:', user.id)
  console.log('Dashboard - Membership:', membership)

  // Si pas d'organization, rediriger vers onboarding
  if (!membership || !membership.organization) {
    console.log('No organization found, redirecting to onboarding')
    redirect('/onboarding')
  }

  const organization = membership.organization

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-zinc-900">
            Bienvenue dans {organization.name}, {profile?.full_name || 'Utilisateur'}
          </h1>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            Vous n'avez pas encore de tables
          </h2>
          <p className="mt-2 text-zinc-600">
            Commencez à organiser vos recherches UX en créant votre première table.
          </p>
          <div className="mt-6">
            <Button disabled className="cursor-not-allowed" title="Disponible en Phase 2">
              Créer une table
            </Button>
            <p className="mt-2 text-sm text-zinc-500">
              Disponible en Phase 2
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}