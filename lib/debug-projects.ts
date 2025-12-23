/**
 * Debug script to check if projects exist in Supabase
 *
 * Usage: This file helps troubleshoot why getProjectAction returns "Project not found"
 */

export async function debugGetProject(projectId: string) {
  console.log(`\n🔍 Debugging project lookup for ID: ${projectId}\n`)

  // This would need to be run in a server component or action
  // Just documenting the issue here

  console.log('Known issues to check:')
  console.log('1. Project ID format - should be a valid UUID')
  console.log('2. RLS policies - verify user has access to workspace')
  console.log('3. Supabase select syntax - nested selects might fail')
  console.log('4. Project exists in database - check projects table directly')

  console.log('\nSolution: Use separate queries instead of nested selects')
  console.log('- First: Get project by ID')
  console.log('- Second: Get tables for that project')
  console.log('- Third: Verify RLS access\n')
}
