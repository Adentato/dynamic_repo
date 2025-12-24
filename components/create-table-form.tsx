'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTableSchema, type CreateTableInput } from '@/lib/validations/entities'
import { createEntityTableAction } from '@/app/actions/entities/tables'
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

interface CreateTableFormProps {
  workspaceId: string
  projectId?: string
  onSuccess?: (tableId: string) => void
  onOpenChange?: (open: boolean) => void
}

/**
 * Phase 2.4b - CreateTableForm
 *
 * Form component for creating a new entity table
 * - Validates input with Zod schema
 * - Submits to createEntityTableAction Server Action
 * - Handles loading and error states
 * - Calls onSuccess callback when table is created
 * - Optionally associates table with a project (Phase 3)
 */
export function CreateTableForm({
  workspaceId,
  projectId,
  onSuccess,
  onOpenChange,
}: CreateTableFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateTableInput>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      workspace_id: workspaceId,
      project_id: projectId || null,
      name: '',
      description: '',
    },
  })

  async function onSubmit(input: CreateTableInput) {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const result = await createEntityTableAction(input)

      if (!result.success) {
        setSubmitError(result.error.message)
        return
      }

      // Close modal and navigate to new table
      onOpenChange?.(false)
      onSuccess?.(result.data.id)

      // Reset form for next use
      form.reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Une erreur inconnue est survenue.'
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la table</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Produits, Utilisateurs, Projets..."
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Le nom de votre table (requis)
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
                  placeholder="Ex: Table de gestion des produits avec prix, stock, etc."
                  disabled={isSubmitting}
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                Une description pour vous aider à vous souvenir de l'usage de cette table
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
            onClick={() => onOpenChange?.(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création en cours...' : 'Créer la table'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
