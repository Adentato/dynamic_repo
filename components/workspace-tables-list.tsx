'use client'

import Link from 'next/link'
import { ChevronRight, Database } from 'lucide-react'
import type { EntityTable } from '@/types/entities'

interface WorkspaceTablesListProps {
  workspaceId: string
  tables: EntityTable[]
  projectId?: string
}

/**
 * Phase 2.4a: Workspace Tables List
 *
 * Displays all tables in a workspace as clickable cards
 * Each card shows:
 * - Table name
 * - Description (if available)
 * - Number of fields (placeholder - will fetch in Phase 2.5)
 * - Click to navigate to table view
 *
 * Props:
 * - workspaceId: UUID of the workspace
 * - tables: Array of EntityTable objects
 * - projectId: Optional UUID of the project (for dashboard/workspace navigation)
 */
export function WorkspaceTablesList({ workspaceId, tables, projectId }: WorkspaceTablesListProps) {
  if (tables.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <Database className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucune table</h3>
        <p className="mt-2 text-sm text-gray-600">
          Commence à organiser tes données en créant ta première table.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => {
        const href = projectId
          ? `/dashboard/workspace/${workspaceId}/project/${projectId}/table/${table.id}`
          : `/workspace/${workspaceId}/table/${table.id}`
        
        return (
        <Link
          key={table.id}
          href={href}
          className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {table.name}
                </h3>
                {table.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {table.description}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
            <span>
              Créée le {new Date(table.created_at).toLocaleDateString('fr-FR')}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {table.id.slice(0, 8)}...
            </span>
          </div>
        </Link>
        )
      })}
    </div>
  )
}
