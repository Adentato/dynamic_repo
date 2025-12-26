'use client'

import { redirect } from 'next/navigation'

/**
 * Post-Signup Page - Simplified
 * 
 * Directly redirects to /onboarding where user creates their first organization.
 * This keeps the flow simple: Signup → Onboarding → Dashboard
 */
export default function AfterSignupPage() {
  // Immediately redirect to onboarding
  redirect('/onboarding')
}
