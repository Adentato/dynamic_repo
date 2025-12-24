import { notFound } from 'next/navigation'
import { getEntityTableDetailsAction } from '@/app/actions/entities/tables'
import { getEntityRecordsAction } from '@/app/actions/entities/records'
import { getProjectAction } from '@/app/actions/entities/projects'
import { Navbar } from '@/components/Navbar'
import { EntityTable } from '@/components/datatable/entity-table'
import { Breadcrumb } from '@/components/breadcrumb'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

interface TablePageProps {
  params: Promise<{
    projectId: string
    tableId: string
  }>
}

/**
 * Phase 2.1: Table Page under Dashboard
 *
 * Server Component that:
 * 1. Validates user authentication and workspace access
 * 2. Fetches table structure (entity_fields)
 * 3. Fetches table data (entity_records)
 * 4. Displays the data for verification
 * 5. Shows breadcrumb navigation
 */
export default async function TablePage({ params }: TablePageProps) {
  try {
    // ===== 1. AUTHENTICATE USER
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organization) {
      notFound()
    }

    const { projectId, tableId } = await params

    // ===== 2. FETCH PROJECT INFO FOR BREADCRUMB
    const projectResult = await getProjectAction(projectId)
    if (!projectResult.success || !projectResult.data) {
      notFound()
    }
    const project = projectResult.data

    // Get organization info for breadcrumb
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: membership } = await supabase
      .from('organization_members')
      .select('*, organization:organizations(*)')
      .eq('user_id', user?.id || '')
      .maybeSingle()
    const organization = (membership as any)?.organization

    // ===== 3. FETCH TABLE STRUCTURE (with fields)
    const tableResult = await getEntityTableDetailsAction(tableId)

    if (!tableResult.success) {
      console.error('Error fetching table:', tableResult.error.message)
      notFound()
    }

    const table = tableResult.data

    // ===== 4. FETCH TABLE RECORDS
    const recordsResult = await getEntityRecordsAction(tableId)

    if (!recordsResult.success) {
      console.error('Error fetching records:', recordsResult.error.message)
    }

    const records = recordsResult.success ? recordsResult.data : { records: [], total: 0, page: 1, pageSize: 50, hasNextPage: false, hasPreviousPage: false, totalPages: 0 }

    // ===== 5. RENDER PAGE
    return (
      <>
        <Navbar currentUser={currentUser} />
        <main className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {/* Breadcrumb */}
              <div className="mb-4">
                <Breadcrumb
                  items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: organization?.name || 'Workspace', href: '/dashboard' },
                    { label: project.name, href: `/dashboard/project/${projectId}` },
                    { label: table.name },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {table.name}
                  </h1>
                  {table.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {table.description}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{table.fields.length} colonnes</p>
                  <p>{records.records.length} lignes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Data Verification Section */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              {/* Table Structure */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  📋 Structure (Colonnes)
                </h2>
                <pre className="overflow-auto rounded bg-gray-900 p-4 text-xs text-green-400">
                  {JSON.stringify(table.fields, null, 2)}
                </pre>
              </div>

              {/* Table Data - Now with TanStack Table */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  📊 Données ({records.records.length} lignes)
                </h2>
                <EntityTable table={table} initialRecords={records.records} />
              </div>

              {/* Debug Info */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-2 text-sm font-semibold text-blue-900">
                  🔍 Debug Info
                </h3>
                <dl className="space-y-1 text-sm text-blue-800">
                  <div>
                    <dt className="font-semibold">Table ID:</dt>
                    <dd className="font-mono">{table.id}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Workspace ID:</dt>
                    <dd className="font-mono">{table.workspace_id}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Project ID:</dt>
                    <dd className="font-mono">{projectId}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Created:</dt>
                    <dd>{new Date(table.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Fields Sorted:</dt>
                    <dd>
                      {table.fields.map((f) => `${f.name}(${f.order_index})`).join(', ')}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Next Steps */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                <h3 className="mb-2 text-sm font-semibold text-amber-900">
                  🚀 Prochaines étapes
                </h3>
                <ol className="list-inside list-decimal space-y-1 text-sm text-amber-800">
                  <li>
                    <span className="line-through">Phase 2.2: Ajouter TanStack Table (structure)</span>{' '}
                    ✅
                  </li>
                  <li>
                    <span className="line-through">Phase 2.3: Mapper entity_fields → colonnes TanStack</span>{' '}
                    ✅
                  </li>
                  <li>Phase 2.4: Ajouter les interactions (tri, filtre)</li>
                </ol>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error('Error in TablePage:', error)
    return (
      <>
        <Navbar currentUser={null} />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
              <h2 className="text-lg font-semibold text-red-900">
                Une erreur est survenue
              </h2>
              <p className="mt-2 text-red-700">
                {error instanceof Error ? error.message : 'Erreur inconnue'}
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }
}
