import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy (replaces middleware.ts)
 *
 * This proxy runs before every request and handles:
 * 1. Session refresh (keeps user logged in)
 * 2. Route protection (redirects based on auth state)
 * 3. Automatic redirects for better UX
 *
 * Protected routes:
 * - /dashboard - Requires authentication + organization
 * - /onboarding - Requires authentication
 *
 * Public routes:
 * - / (home) - Accessible to everyone
 * - /login - Auto-redirects to /dashboard if already authenticated
 * - /signup - Auto-redirects to /dashboard if already authenticated
 */

export async function proxy(request: NextRequest) {
  // Initialize response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client for proxy
  // This client automatically handles cookie-based sessions
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies in request
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          // Update response
          supabaseResponse = NextResponse.next({
            request,
          })
          // Set cookies in response
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  // This is CRITICAL - it keeps users logged in across page loads
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ========================================
  // PUBLIC ROUTES - No auth required
  // ========================================

  if (pathname === '/') {
    // Home page is always accessible
    return supabaseResponse
  }

  // ========================================
  // AUTH PAGES - Special handling
  // ========================================

  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    // If user is already authenticated, redirect to dashboard
    // This prevents authenticated users from seeing login/signup pages
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // Not authenticated - allow access to login/signup
    return supabaseResponse
  }

  // ========================================
  // ONBOARDING - Requires authentication only
  // ========================================

  if (pathname.startsWith('/onboarding')) {
    // User must be authenticated to access onboarding
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // Add redirect param for post-login navigation
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    // User is authenticated - allow access
    return supabaseResponse
  }

  // ========================================
  // DASHBOARD & APP - Requires auth + organization
  // ========================================

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    // Step 1: Check if user is authenticated
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    // Step 2: Check if user has an organization
    // Using maybeSingle() to avoid errors when no organization exists
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('[proxy] User:', user.id, '| Path:', pathname)
    console.log('[proxy] Membership:', membership)

    // No organization found - redirect to onboarding
    if (!membership || membershipError) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      console.log('[proxy] No membership, redirecting to onboarding')
      return NextResponse.redirect(url)
    }

    // User has organization - allow access
    return supabaseResponse
  }

  // ========================================
  // ALL OTHER ROUTES - Allow by default
  // ========================================

  return supabaseResponse
}

/**
 * Matcher Configuration
 *
 * Defines which routes this proxy should run on
 * Using negative lookahead to exclude static files
 *
 * This proxy runs on all pages EXCEPT:
 * - _next/static/* (Next.js static files)
 * - _next/image/* (Next.js image optimization)
 * - favicon.ico
 * - Static assets (*.svg, *.png, etc.)
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
