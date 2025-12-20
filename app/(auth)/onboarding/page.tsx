'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { createOrganizationAction } from '@/app/actions/auth'
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

const formSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  slug: z.string().min(2, 'Le slug est requis'),
  description: z.string().optional(),
})

type FormSchema = z.infer<typeof formSchema>

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  })

  // Auto-generate slug from name
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.name && !form.formState.dirtyFields.slug) {
        const slug = generateSlug(value.name)
        form.setValue('slug', slug, { shouldValidate: false })
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  async function onSubmit(values: FormSchema) {
    setLoading(true)
    setError(null)

    const result = await createOrganizationAction(
      values.name,
      values.slug,
      values.description
    )

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // Si succès, la redirection est gérée par createOrganizationAction
  }

  return (
    <div className="container max-w-lg mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Créez votre workspace</h1>
        <p className="text-gray-600">
          Votre workspace est l'espace où vous allez organiser vos recherches UX.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du workspace</FormLabel>
                <FormControl>
                  <Input placeholder="Équipe UX Acme Corp" {...field} />
                </FormControl>
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
                    <span className="text-gray-500">/workspace/</span>
                    <Input
                      placeholder="equipe-ux-acme-corp"
                      {...field}
                      readOnly={!form.formState.dirtyFields.slug}
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon workspace'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
