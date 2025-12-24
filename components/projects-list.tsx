'use client'

import Link from 'next/link'
import { FolderOpen, ChevronRight } from 'lucide-react'
import type { ProjectWithTables } from '@/types/entities'

interface ProjectsListProps {
  workspaceId: string
  projects: ProjectWithTables[]
}

/**
 * Phase 3 - ProjectsList Component
 *
 * Displays projects as cards in a grid layout
 * Each card shows: name, description, table count, color indicator
 */
export function ProjectsList({ workspaceId, projects }: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <FolderOpen className="mx-auto h-12 w-12 text-zinc-400 mb-3" />
        <p className="text-sm text-zinc-600">Aucun projet trouvé</p>
        <p className="mt-1 text-xs text-zinc-500">
          Créez votre premier projet pour commencer
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const href = workspaceId
          ? `/dashboard/workspace/${workspaceId}/project/${project.id}`
          : `/dashboard/project/${project.id}`
        
        return (
        <Link
          key={project.id}
          href={href}
          className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white transition-all hover:border-zinc-400 hover:shadow-md"
        >
          {/* Color indicator bar */}
          <div
            className="absolute top-0 left-0 h-1 w-full"
            style={{
              backgroundColor: getColorValue(project.color),
            }}
          />

          <div className="p-5">
            {/* Header with icon and name */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="mt-1 h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: getColorValue(project.color, 0.1),
                  }}
                >
                  <FolderOpen
                    className="h-5 w-5"
                    style={{ color: getColorValue(project.color) }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-900 truncate">
                    {project.name}
                  </h3>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400 ml-2 flex-shrink-0 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Description */}
            {project.description && (
              <p className="mb-4 text-sm text-zinc-600 line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Footer: Table count and creation date */}
            <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
              <div className="text-xs text-zinc-500">
                <span className="font-medium text-zinc-700">
                  {project.tables?.length || 0}
                </span>{' '}
                {(project.tables?.length || 0) === 1 ? 'table' : 'tables'}
              </div>
              <div className="text-xs text-zinc-500">
                Créé le{' '}
                {new Date(project.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </Link>
        )
      })}
    </div>
  )
}

/**
 * Helper function to convert color name to hex value
 * Uses a predefined color palette
 */
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
