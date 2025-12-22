import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/UserMenu'

/**
 * Server Component Navbar
 *
 * Optimizations applied:
 * - Converted from client component to server component
 * - Receives user data as prop (no duplicate fetching)
 * - No loading state flicker (data ready on initial render)
 * - Reduced JavaScript bundle size (less client-side code)
 * - Extracted interactive menu to separate UserMenu client component
 *
 * Benefits:
 * - Faster initial page load
 * - Better SEO (fully rendered on server)
 * - No race conditions or useEffect waterfalls
 * - Single data fetch per page (passed from parent)
 * - No infinite render loops
 *
 * Props:
 * @param currentUser - Optional user object fetched by parent component
 */

interface NavbarProps {
  currentUser?: {
    profile: {
      full_name: string
      email: string
    }
    organization?: {
      name: string
      slug: string
    } | null
  } | null
}

export function Navbar({ currentUser = null }: NavbarProps) {
  // User data comes from props - no server-side fetching here
  // This prevents duplicate database calls and infinite loops

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand - static, no interaction needed */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-zinc-900">
              UX Repository
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            {/* Conditional rendering based on auth state */}
            {currentUser && currentUser.profile ? (
              // User is authenticated - show interactive menu
              // UserMenu is a client component for dropdown interactions
              <UserMenu user={currentUser} />
            ) : (
              // User is not authenticated - show static login/signup buttons
              <>
                <Link href="/login">
                  <Button variant="ghost">Connexion</Button>
                </Link>
                <Link href="/signup">
                  <Button>S'inscrire</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
