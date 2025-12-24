import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getProjectAction } from '@/app/actions/entities/projects'
import { WorkspaceTablesList } from '@/components/workspace-tables-list'
import { CreateTableModal } from '@/components/create-table-modal'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'

interface ProjectPageProps {
  params: Promise<{
    workspaceId: string
    projectId: string
  }>
}

export default async function ProjectPage({ params: paramsPromise }: ProjectPageProps) {
  const params = await paramsPromise
  
  try {
    // Get current user for navbar
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization:organizations(*)')
      .eq('organization_id', params.workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()

    const organization = membership?.organization

    // Fetch project with tables
    console.log('Fetching project:', params.projectId)
    const projectResult = await getProjectAction(params.projectId)
    console.log('Project result:', projectResult)

    if (!projectResult.success) {
      return (
        <>
          <Navbar currentUser={null} />
          <main className="min-h-screen bg-zinc-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
              <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
                <h2 className="text-lg font-semibold text-red-900">
                  {projectResult.error.message || 'Projet non trouvé'}
                </h2>
                <p className="mt-2 text-sm text-red-600">
                  Project ID: {params.projectId}
                </p>
                <Link href="/dashboard">
                  <Button className="mt-6" variant="default">
                    Retour au dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </main>
        </>
      )
    }

    const project = projectResult.data
    const currentUser = profile && organization ? {
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
              {/* Back button */}
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au dashboard
              </Link>

              {/* Project title and info */}
              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: getColorValue(project.color, 0.1),
                  }}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: getColorValue(project.color),
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-zinc-900">
                    {project.name}
                  </h1>
                  {project.description && (
                    <p className="mt-2 text-zinc-600">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            {project.tables && project.tables.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-900">
                    Tables du projet ({project.tables.length})
                  </h2>
                  <CreateTableModal
                    workspaceId={params.workspaceId}
                    projectId={params.projectId}
                  >
                    <Button>
                      Créer une table
                    </Button>
                  </CreateTableModal>
                </div>
                <WorkspaceTablesList
                  workspaceId={params.workspaceId}
                  tables={project.tables}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Aucune table dans ce projet
                </h2>
                <p className="mt-2 text-zinc-600">
                  Créez votre première table pour commencer à collecter des données.
                </p>
                <div className="mt-6">
                  <CreateTableModal
                    workspaceId={params.workspaceId}
                    projectId={params.projectId}
                  >
                    <Button>
                      Créer une table
                    </Button>
                  </CreateTableModal>
                </div>
              </div>
            )}
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error('Project page error:', error)
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
                {error instanceof Error ? error.message : 'Impossible de charger le projet.'}
              </p>
              <Link href="/dashboard">
                <Button className="mt-6" variant="default">
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }
}

function getColorValue(colorName: string | null, opacity?: number): string {
  const colorMap: Record<string, string> = {
    red: '#ef4444',
    pink: '#ec4899',
    orange: '#f97316',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    blue: '#3b82f6',
    indigo: '#6366f1',
    purple: '#a855f7',
    violet: '#7c3aed',
    fuchsia: '#d946ef',
  }

  const hex = colorMap[colorName || 'blue'] || colorMap.blue
  if (opacity !== undefined) {
    return hex + Math.round(opacity * 255).toString(16).padStart(2, '0')
  }
  return hex
}
