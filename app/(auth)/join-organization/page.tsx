'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

/**
 * Join Organization Page
 * 
 * Users can join an existing organization by:
 * 1. Entering an invitation code/token
 * 2. Following a link from email (token in URL)
 * 
 * TODO: Implement invitation validation and joining logic
 */
export default function JoinOrganizationPage() {
  const router = useRouter()
  const [invitationCode, setInvitationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!invitationCode.trim()) {
      setError('Veuillez entrer un code d\'invitation')
      setLoading(false)
      return
    }

    try {
      // TODO: Implement API call to validate and accept invitation
      console.log('Joining organization with code:', invitationCode)
      
      // For now, show a placeholder message
      setError('Fonctionnalité en cours de développement')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rejoindre une organisation
            </h1>
            <p className="text-gray-600">
              Entrez le code d'invitation que vous avez reçu
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label htmlFor="invitation-code" className="block text-sm font-medium text-gray-700 mb-2">
                Code d'invitation
              </label>
              <Input
                id="invitation-code"
                type="text"
                placeholder="Exemple: abc123def456ghi789"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                disabled={loading}
                className="w-full"
              />
              <p className="mt-2 text-xs text-gray-500">
                Vous pouvez aussi cliquer sur le lien dans l'email d'invitation
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Connexion en cours...' : 'Rejoindre'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou</span>
            </div>
          </div>

          {/* Alternative Action */}
          <button
            onClick={() => router.push('/after-signup')}
            className="w-full text-center py-3 text-purple-600 hover:text-purple-700 font-medium"
          >
            Créer une nouvelle organisation
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Vous n'avez pas d'invitation ?</p>
          <a href="mailto:support@example.com" className="text-purple-600 hover:text-purple-700 font-medium">
            Contactez l'administrateur
          </a>
        </div>
      </div>
    </div>
  )
}
