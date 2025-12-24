'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CreateTableForm } from '@/components/create-table-form'

interface CreateTableModalProps {
  workspaceId: string
  projectId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

/**
 * Phase 2.4b - CreateTableModal
 *
 * Modal dialog for creating a new entity table
 * - Wraps CreateTableForm in a Dialog component
 * - Handles navigation to new table after creation
 * - Accepts open/onOpenChange props for controlled state
 * - Can be used with a trigger button (via children) or controlled externally
 * - Optionally associates table with a project (Phase 3)
 */
export function CreateTableModal({
  workspaceId,
  projectId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
}: CreateTableModalProps) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  // Support both controlled and uncontrolled states
  const isOpen = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen

  const handleSuccess = (tableId: string) => {
    setOpen(false)
    // Navigate to the new table with full path
    if (projectId) {
      router.push(`/dashboard/workspace/${workspaceId}/project/${projectId}/table/${tableId}`)
    } else {
      // Fallback if no projectId provided
      router.push(`/dashboard/workspace/${workspaceId}`)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      {children && <Dialog.Trigger asChild>{children}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border border-gray-200 bg-white p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Créer une nouvelle table
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-6 text-sm text-gray-600">
            Donnez un nom à votre table et ajoutez une description optionnelle pour l'identifier facilement.
          </Dialog.Description>

          <CreateTableForm
            workspaceId={workspaceId}
            projectId={projectId}
            onSuccess={handleSuccess}
            onOpenChange={setOpen}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
