'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { acceptInvitationAction } from '@/app/actions/entities/invitations'
import { createClient } from '@/lib/supabase/client'

/**
 * Invitation Acceptance Page
 * 
 * For users who are already authenticated:
 *   - Accepts the invitation and adds them to the organization
 * 
 * For users who are NOT authenticated:
 *   - Redirects to signup with pre-filled email and token
 */
export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const token = params.token as string

  useEffect(() => {
    let isMounted = true

    const handleInvitation = async () => {
      try {
        if (!token) {
          if (isMounted) {
            setError('Token d\'invitation manquant')
            setLoading(false)
          }
          return
        }

        // Check if user is authenticated
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          // User not authenticated - get invitation details to pre-fill email
          const { data: invitation } = await supabase
            .from('workspace_invitations')
            .select('email')
            .eq('token', token)
            .maybeSingle()

          if (invitation?.email) {
            // Mark as redirecting to prevent state updates after navigation
            if (isMounted) {
              setIsRedirecting(true)
            }
            // Redirect to signup with pre-filled email and token
            router.push(`/signup?email=${encodeURIComponent(invitation.email)}&token=${token}`)
            return
          } else {
            if (isMounted) {
              setError('Invitation invalide')
              setLoading(false)
            }
            return
          }
        }

        // User is authenticated - try to accept invitation
        const result = await acceptInvitationAction(token)

        if (!isMounted) return

        if (result.success) {
          setSuccess(true)
          setOrganizationId(result.data.organizationId)
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            if (isMounted) {
              router.push('/dashboard')
            }
          }, 3000)
        } else {
          setError(result.error.message)
          setLoading(false)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Erreur lors de l\'acceptation de l\'invitation')
          setLoading(false)
        }
      }
    }

    // Small delay to show loading state
    const timer = setTimeout(handleInvitation, 500)
    
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [token, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Traitement...
            </h1>
            <p className="text-gray-600">
              Nous traitons votre invitation
            </p>
          </div>
        )}

        {/* Success State */}
        {success && !loading && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenue ! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Vous avez accepté l'invitation et êtes maintenant membre de l'organisation.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirection vers le tableau de bord dans quelques secondes...
            </p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Aller au tableau de bord
            </Button>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erreur
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Aller au tableau de bord
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
