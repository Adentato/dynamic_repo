'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { createProjectAction } from '@/app/actions/entities/projects'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { z } from 'zod'

const createProjectSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(1000).optional().default(''),
  color: z.string().optional().default('blue'),
})

type CreateProjectInput = z.infer<typeof createProjectSchema>

interface CreateProjectModalProps {
  workspaceId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (projectId: string) => void
  children?: React.ReactNode
}

const COLOR_OPTIONS = [
  { name: 'red', label: 'Red' },
  { name: 'orange', label: 'Orange' },
  { name: 'yellow', label: 'Yellow' },
  { name: 'green', label: 'Green' },
  { name: 'blue', label: 'Blue' },
  { name: 'indigo', label: 'Indigo' },
  { name: 'purple', label: 'Purple' },
  { name: 'pink', label: 'Pink' },
]

const colorMap: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

/**
 * Phase 3 - CreateProjectModal Component
 *
 * Modal for creating a new project (Table Space)
 * - Wraps CreateProjectForm in a Dialog component
 * - Handles navigation after project creation
 */
export function CreateProjectModal({
  workspaceId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  children,
}: CreateProjectModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const isOpen = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      workspace_id: workspaceId,
      name: '',
      description: '',
      color: 'blue',
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function onSubmit(input: CreateProjectInput) {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const result = await createProjectAction(input)

      if (!result.success) {
        setSubmitError(result.error)
        return
      }

      setOpen(false)
      onSuccess?.(result.data.id)
      form.reset()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
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
              Créer un nouveau projet
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
            Créez un espace de projet pour organiser vos tables relationnelles.
          </Dialog.Description>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du projet</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Recherche UX, Gestion Produits..."
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Le nom de votre projet (requis)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Tables pour les irritants, observations et sessions..."
                        disabled={isSubmitting}
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Une description pour clarifier l'utilité de ce projet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur (optionnel)</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-4 gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => field.onChange(color.name)}
                            className={`h-10 rounded-lg border-2 transition-all ${
                              field.value === color.name
                                ? 'border-zinc-900'
                                : 'border-zinc-200'
                            } ${colorMap[color.name]}`}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Couleur pour identifier votre projet
                    </FormDescription>
                  </FormItem>
                )}
              />

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex gap-4 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                </Button>
              </div>
            </form>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
