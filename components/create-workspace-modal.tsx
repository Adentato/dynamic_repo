'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { createWorkspaceAction } from '@/app/actions/entities/workspace'
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
import { useRouter } from 'next/navigation'

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  slug: z.string().min(2, 'Le slug est requis').max(100),
  description: z.string().max(1000),
})

type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface CreateWorkspaceModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

/**
 * Modal for creating a new workspace (Organization)
 * 
 * Allows authenticated users to create additional workspaces
 * after the initial onboarding
 */
export function CreateWorkspaceModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
}: CreateWorkspaceModalProps) {
  const router = useRouter()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  const isOpen = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue('name', name)

    // Generate slug only if user hasn't manually modified it
    if (!form.formState.dirtyFields.slug) {
      const slug = generateSlug(name)
      form.setValue('slug', slug, { shouldValidate: false, shouldDirty: false })
    }
  }

  async function onSubmit(input: CreateWorkspaceInput) {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const result = await createWorkspaceAction(input)

      // If we get here, there was an error (redirect doesn't return)
      if (result && !result.success) {
        setSubmitError(result.error || 'Une erreur inconnue est survenue.')
        setIsSubmitting(false)
        return
      }
    } catch (error) {
      // redirect() throws, but that's expected - the page will navigate
      // We can safely ignore this exception
      console.log('Workspace creation - redirect in progress')
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
              Créer un nouveau workspace
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
            Créez un nouveau workspace pour organiser vos projets et vos équipes.
          </Dialog.Description>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du workspace</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Équipe UX, Projet Acme..."
                        disabled={isSubmitting}
                        onChange={handleNameChange}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Le nom de votre workspace (requis)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du workspace</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">/workspace/</span>
                        <Input 
                          placeholder="equipe-ux" 
                          disabled={isSubmitting}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Généré automatiquement à partir du nom
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
                        placeholder="Décrivez votre workspace..."
                        disabled={isSubmitting}
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Une description pour clarifier l'utilité de ce workspace
                    </FormDescription>
                    <FormMessage />
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
                  {isSubmitting ? 'Création en cours...' : 'Créer le workspace'}
                </Button>
              </div>
            </form>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
