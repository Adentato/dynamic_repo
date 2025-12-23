'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateTableModal } from '@/components/create-table-modal'
import type { EntityTable } from '@/types/entities'
import { WorkspaceTablesList } from '@/components/workspace-tables-list'

interface DashboardClientProps {
  workspaceId: string
  organizationName: string
  userName: string
  tables: EntityTable[]
}

/**
 * Phase 2.4b - DashboardClient
 *
 * Client-side wrapper for dashboard UI
 * - Manages create table modal state
 * - Displays tables list or empty state
 * - Enables create table button
 */
export function DashboardClient({
  workspaceId,
  organizationName,
  userName,
  tables,
}: DashboardClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {tables.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">
                Vos tables ({tables.length})
              </h2>
              <CreateTableModal
                workspaceId={workspaceId}
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <Button>
                  Créer une table
                </Button>
              </CreateTableModal>
            </div>
            <WorkspaceTablesList workspaceId={workspaceId} tables={tables} />
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold text-zinc-900">
              Vous n'avez pas encore de tables
            </h2>
            <p className="mt-2 text-zinc-600">
              Commencez à organiser vos recherches UX en créant votre première table.
            </p>
            <div className="mt-6">
              <CreateTableModal
                workspaceId={workspaceId}
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <Button>
                  Créer une table
                </Button>
              </CreateTableModal>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
