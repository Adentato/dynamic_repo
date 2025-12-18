import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const pathname = requestUrl.pathname

  // Public routes
  const publicRoutes = ['/', '/login', '/signup', '/onboarding']
  const isPublicRoute = publicRoutes.includes(pathname)

  // App routes that require authentication
  const isAppRoute = pathname.startsWith('/app') || pathname.startsWith('/dashboard')

  if (isAppRoute) {
    // Create Supabase client
    let response = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If not authenticated, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user has an organization
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!memberData) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    return response
  }

  // Allow public routes
  return NextResponse.next({
    request,
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
