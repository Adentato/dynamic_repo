'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { signUpAction } from '@/app/actions/auth'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
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

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get invitation token and email from URL params
  const invitationToken = searchParams.get('token')
  const invitationEmail = searchParams.get('email')

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      full_name: '',
      email: invitationEmail || '',
      password: '',
      confirm_password: '',
    },
  })

  // Update email field when invitationEmail changes
  useEffect(() => {
    if (invitationEmail) {
      form.setValue('email', invitationEmail)
    }
  }, [invitationEmail, form])

  const onSubmit = async (values: SignUpInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUpAction({
        email: values.email,
        password: values.password,
        fullName: values.full_name,
        invitationToken: invitationToken || undefined,
      })

      if (result?.error) {
        if (result.success) {
          // Compte créé mais pas auto-login, rediriger vers login
          router.push('/login?message=Compte créé avec succès ! Connectez-vous.')
        } else {
          setError(result.error)
          setIsLoading(false)
        }
      }
      // Si pas de result, la redirection vers /onboarding est gérée par signUpAction
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-zinc-900">S'inscrire</h2>
          <p className="mt-2 text-zinc-600">
            Créez votre compte pour commencer
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
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700">Nom complet</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jean Dupont"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="vous@exemple.com"
                        type="email"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700">Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
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
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-700">
                      Confirmer le mot de passe
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                        disabled={isLoading}
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
                {isLoading ? 'Création en cours...' : 'Créer mon compte'}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-500">ou</span>
            </div>
          </div>

          <p className="text-center text-sm text-zinc-600">
            Vous avez déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-medium text-zinc-900 hover:text-zinc-700"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
