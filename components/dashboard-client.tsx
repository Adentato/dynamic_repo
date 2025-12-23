'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateProjectModal } from '@/components/create-project-modal'
import { ProjectsList } from '@/components/projects-list'
import { WorkspaceTablesList } from '@/components/workspace-tables-list'
import type { WorkspaceHierarchy } from '@/types/entities'

interface DashboardClientProps {
  workspaceId: string
  organizationName: string
  userName: string
  hierarchy: WorkspaceHierarchy
}

/**
 * Phase 3 - DashboardClient (Updated)
 *
 * Client-side wrapper for dashboard UI
 * - Now displays projects instead of tables directly
 * - Projects can contain multiple related tables
 * - Also shows orphaned tables (backwards compatibility)
 */
export function DashboardClient({
  workspaceId,
  organizationName,
  userName,
  hierarchy,
}: DashboardClientProps) {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)

  const hasProjects = hierarchy.projects.length > 0
  const hasOrphanTables = hierarchy.tablesWithoutProject.length > 0
  const hasContent = hasProjects || hasOrphanTables

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {hasContent ? (
          <div className="space-y-8">
            {/* Projects Section */}
            {hasProjects && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-zinc-900">
                    Vos projets ({hierarchy.projects.length})
                  </h2>
                  <CreateProjectModal
                    workspaceId={workspaceId}
                    open={isCreateProjectModalOpen}
                    onOpenChange={setIsCreateProjectModalOpen}
                  >
                    <Button>
                      Créer un projet
                    </Button>
                  </CreateProjectModal>
                </div>
                <ProjectsList workspaceId={workspaceId} projects={hierarchy.projects} />
              </div>
            )}

            {/* Orphaned Tables Section (Backwards Compatibility) */}
            {hasOrphanTables && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                    Tables non assignées ({hierarchy.tablesWithoutProject.length})
                  </h2>
                  <p className="text-sm text-zinc-600 mb-4">
                    Ces tables n'ont pas de projet. Vous pouvez les assigner à un projet ou les laisser isolées.
                  </p>
                </div>
                <WorkspaceTablesList 
                  workspaceId={workspaceId} 
                  tables={hierarchy.tablesWithoutProject} 
                />
              </div>
            )}

            {/* Create first project button - shown only if no projects */}
            {!hasProjects && hasOrphanTables && (
              <div className="mt-8">
                <CreateProjectModal
                  workspaceId={workspaceId}
                  open={isCreateProjectModalOpen}
                  onOpenChange={setIsCreateProjectModalOpen}
                >
                  <Button>
                    Créer votre premier projet
                  </Button>
                </CreateProjectModal>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold text-zinc-900">
              Bienvenue dans votre workspace!
            </h2>
            <p className="mt-2 text-zinc-600">
              Commencez par créer un projet pour organiser vos tables relatives.
            </p>
            <div className="mt-6">
              <CreateProjectModal
                workspaceId={workspaceId}
                open={isCreateProjectModalOpen}
                onOpenChange={setIsCreateProjectModalOpen}
              >
                <Button>
                  Créer votre premier projet
                </Button>
              </CreateProjectModal>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
