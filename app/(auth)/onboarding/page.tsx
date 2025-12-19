'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { createOrganizationAction } from '@/app/actions/auth'
import {
  createWorkspaceSchema,
  generateSlug,
  type CreateWorkspaceInput,
} from '@/lib/validations/workspace'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  })

  // Auto-generate slug when name changes
  useEffect(() => {
    const name = form.getValues('name')
    if (name) {
      const generatedSlug = generateSlug(name)
      form.setValue('slug', generatedSlug)
    }
  }, [form.watch('name'), form])

  const onSubmit = async (values: CreateWorkspaceInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const { organization, error: createError } = await createOrganizationAction(
        values.name,
        values.slug,
        values.description
      )

      if (createError) {
        setError(createError)
        return
      }

      if (organization) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900">
            Créez votre workspace
          </h2>
          <p className="mt-2 text-zinc-600">
            Votre workspace est l'espace où vous allez organiser vos recherches
            UX.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700">
                      Nom du workspace
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mon workspace UX"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700">URL</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-zinc-600 text-sm mr-2">
                          /workspace/
                        </span>
                        <Input
                          placeholder="mon-workspace-ux"
                          {...field}
                          disabled={isLoading}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700">
                      Description (optionnel)
                    </FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Décrivez votre workspace..."
                        {...field}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Création en cours...' : 'Créer mon workspace'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
