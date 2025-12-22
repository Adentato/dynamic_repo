'use client'

import Link from 'next/link'
import { signOutAction } from '@/app/actions/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

/**
 * Client Component for User Menu
 *
 * Why this is a client component:
 * - Requires interactivity (dropdown open/close state)
 * - Handles onClick events (sign out)
 * - Manages UI state (menu visibility)
 *
 * Design decisions:
 * - Receives user data as props from server component (no client-side fetching)
 * - Minimal client-side JavaScript (only what's needed for interaction)
 * - Server Action for sign out (signOutAction) keeps auth logic server-side
 *
 * Props:
 * @param user - User object with profile information from server
 */

interface UserMenuProps {
  user: {
    profile: {
      full_name: string
      email: string
    }
    organization?: {
      name: string
      slug: string
    } | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  // Generate user initials from full name for avatar
  // Example: "Jean Dupont" -> "JD"
  const initials = user.profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <DropdownMenu>
      {/* Trigger button - accessible and keyboard navigable */}
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-1 hover:bg-zinc-100 transition-colors"
          aria-label="Menu utilisateur"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-zinc-200 text-zinc-700">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      {/* Dropdown menu content */}
      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.profile.full_name}</p>
            <p className="text-xs text-zinc-500">{user.profile.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation items - using Link for client-side navigation */}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            Mon profil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            Paramètres
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign out action - calls server action */}
        <DropdownMenuItem
          onClick={() => signOutAction()}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
