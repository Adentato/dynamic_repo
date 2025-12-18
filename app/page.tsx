import Link from 'next/link'

import { getCurrentUser } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/Navbar'

export default async function Home() {
  const currentUser = await getCurrentUser()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl">
              Repository UX Interactif
            </h2>
            <p className="mt-6 text-xl text-zinc-600 max-w-3xl mx-auto">
              Organisez, visualisez et partagez vos recherches UX
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              {currentUser ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg">
                    Accéder à mon workspace
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="text-lg">
                      Commencer maintenant
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg"
                    >
                      Se connecter
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-zinc-900">
                Pour les Researchers
              </h3>
              <p className="mt-2 text-zinc-600">
                Centralisez vos insights, pain points et observations en un
                seul endroit pour une collaboration efficace.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-zinc-900">
                Pour les PMs
              </h3>
              <p className="mt-2 text-zinc-600">
                Consultez et priorisez les irritants utilisateurs pour
                orienter vos décisions produit.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-zinc-900">
                Pour les Managers
              </h3>
              <p className="mt-2 text-zinc-600">
                Vue d'ensemble interactive via treemap pour monitorer la santé
                UX de votre produit.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
