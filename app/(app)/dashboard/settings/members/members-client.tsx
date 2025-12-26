'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Navbar } from '@/components/Navbar'
import { Users, UserPlus, Trash2, Copy, Check } from 'lucide-react'
import { 
  inviteUserToOrganizationAction, 
  getOrganizationInvitationsAction, 
  revokeInvitationAction,
  getOrganizationMembersAction 
} from '@/app/actions/entities/invitations'
import type { User } from '@supabase/supabase-js'

interface Member {
  id: string
  email: string
  role: string
  joined_at?: string
}

interface Invitation {
  id: string
  email: string
  token: string
  role: string
  created_at: string
  accepted_at: string | null
}

interface MembersClientProps {
  user: User
  organizationId: string
  organizationName: string
}

/**
 * Members Management Client Component
 */
export default function MembersClient({ user, organizationId, organizationName }: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Load invitations and members on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Get members
        const membersResult = await getOrganizationMembersAction(organizationId)
        if (membersResult.success) {
          setMembers(membersResult.data.members)
        } else {
          setError(membersResult.error.message)
        }

        // Get invitations
        const inviteResult = await getOrganizationInvitationsAction(organizationId)
        if (inviteResult.success) {
          setInvitations(inviteResult.data.invitations)
        }
      } catch (err) {
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [organizationId, user.id, user.email])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError('Veuillez entrer un email')
      setInviting(false)
      return
    }

    try {
      const result = await inviteUserToOrganizationAction(organizationId, email.trim(), 'member')
      if (result.success) {
        setSuccess(`Invitation envoyée à ${email}`)
        setEmail('')
        // Reload invitations
        const inviteResult = await getOrganizationInvitationsAction(organizationId)
        if (inviteResult.success) {
          setInvitations(inviteResult.data.invitations)
        }
      } else {
        setError(result.error.message)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
      return
    }

    try {
      const result = await revokeInvitationAction(invitationId)
      if (result.success) {
        setSuccess('Invitation annulée')
        // Reload invitations
        const inviteResult = await getOrganizationInvitationsAction(organizationId)
        if (inviteResult.success) {
          setInvitations(inviteResult.data.invitations)
        }
      } else {
        setError(result.error.message)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur')
    }
  }

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (loading) {
    return (
      <>
        <Navbar currentUser={{
          profile: {
            full_name: user.user_metadata?.full_name || user.email || '',
            email: user.email || ''
          }
        } as any} />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
            <p>Chargement...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar currentUser={{
        profile: {
          full_name: user.user_metadata?.full_name || user.email || '',
          email: user.email || ''
        }
      } as any} />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-8 w-8 text-gray-900" />
              <h1 className="text-3xl font-bold text-gray-900">Gérer les membres</h1>
            </div>
            <p className="text-gray-600">
              {organizationName} - Invitez des membres à rejoindre votre organisation
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Invite Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inviter un nouveau membre</h2>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email du membre à inviter"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={inviting}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={inviting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {inviting ? 'Envoi...' : 'Inviter'}
              </Button>
            </form>
          </div>

          {/* Current Members */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Membres ({members.length})
            </h2>
            {members.length === 0 ? (
              <p className="text-gray-600">Aucun membre pour le moment</p>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{member.email}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                    </div>
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        // onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Invitations en attente ({invitations.filter(i => !i.accepted_at).length})
              </h2>
              {invitations.filter(i => !i.accepted_at).length === 0 ? (
                <p className="text-gray-600">Aucune invitation en attente</p>
              ) : (
                <div className="space-y-4">
                  {invitations
                    .filter(i => !i.accepted_at)
                    .map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-500">Lien d'invitation</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(
                              `${window.location.origin}/invitations/${invitation.token}?email=${encodeURIComponent(invitation.email)}`,
                              invitation.token
                            )}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
                          >
                            {copiedToken === invitation.token ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copié
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copier
                              </>
                            )}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRevokeInvitation(invitation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
