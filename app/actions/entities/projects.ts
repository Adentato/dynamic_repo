'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  requireAuth,
  requireWorkspaceAccess,
  AuthenticationError,
  WorkspaceAccessError,
  NotFoundError,
} from '@/lib/auth/workspace'
import type { Project, ProjectWithTables, WorkspaceHierarchy } from '@/types/entities'

/**
 * Phase 3 - Projects (Table Spaces) Server Actions
 *
 * Manages projects within a workspace. Projects are intermediate level
 * that contain related tables that can reference each other.
 *
 * All actions use centralized auth helpers to reduce duplication:
 * - requireAuth() for authentication
 * - requireWorkspaceAccess() for authorization
 * - Custom error classes for proper error handling
 */

// ===== Validation schemas
const createProjectSchema = z.object({
  workspace_id: z.string().uuid('workspace_id must be a valid UUID'),
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().max(1000).optional().default(''),
  color: z.string().optional().default('blue'),
})

const updateProjectSchema = createProjectSchema.partial().extend({
  project_id: z.string().uuid('project_id must be a valid UUID'),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// ===== CREATE PROJECT
export async function createProjectAction(input: CreateProjectInput) {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Validate input
    const validatedInput = createProjectSchema.parse(input)

    // Verify workspace access (auth + permission check)
    await requireWorkspaceAccess(supabase, user.id, validatedInput.workspace_id)

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        workspace_id: validatedInput.workspace_id,
        name: validatedInput.name,
        description: validatedInput.description || null,
        color: validatedInput.color,
      })
      .select()
      .single()

    if (projectError) throw new Error('Failed to create project.')

    // Revalidate paths
    revalidatePath('/dashboard')
    revalidatePath(`/workspace/${validatedInput.workspace_id}`)

    return { success: true, data: project as Project }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    return { success: false, error: message }
  }
}

// ===== GET PROJECT
export async function getProjectAction(projectId: string) {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Get project by ID
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle()

    if (projectError || !project) {
      throw new NotFoundError('Project')
    }

    // Verify user has access to workspace (this also validates the project workspace_id)
    await requireWorkspaceAccess(supabase, user.id, project.workspace_id)

    // Get all tables in this project
    const { data: tables, error: tablesError } = await supabase
      .from('entity_tables')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (tablesError) throw new Error('Failed to fetch project tables.')

    return {
      success: true,
      data: {
        ...project,
        tables: tables || [],
      } as ProjectWithTables,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    return { success: false, error: message }
  }
}

// ===== UPDATE PROJECT
export async function updateProjectAction(input: UpdateProjectInput) {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Validate input
    const validatedInput = updateProjectSchema.parse(input)

    // Get project and verify it exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', validatedInput.project_id)
      .maybeSingle()

    if (projectError || !project) {
      throw new NotFoundError('Project')
    }

    // Verify workspace access
    await requireWorkspaceAccess(supabase, user.id, project.workspace_id)

    // Update project
    const updateData: Record<string, any> = {}
    if ('name' in validatedInput && validatedInput.name)
      updateData.name = validatedInput.name
    if ('description' in validatedInput) updateData.description = validatedInput.description
    if ('color' in validatedInput) updateData.color = validatedInput.color

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', validatedInput.project_id)
      .select()
      .single()

    if (updateError) throw new Error('Failed to update project.')

    revalidatePath('/dashboard')
    revalidatePath(`/workspace/${project.workspace_id}`)

    return { success: true, data: updatedProject as Project }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    return { success: false, error: message }
  }
}

// ===== DELETE PROJECT
export async function deleteProjectAction(projectId: string) {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Get project and verify it exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .maybeSingle()

    if (projectError || !project) {
      throw new NotFoundError('Project')
    }

    // Verify workspace access
    await requireWorkspaceAccess(supabase, user.id, project.workspace_id)

    // Delete project (cascade will delete associated tables)
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId)

    if (deleteError) throw new Error('Failed to delete project.')

    revalidatePath('/dashboard')
    revalidatePath(`/workspace/${project.workspace_id}`)

    return { success: true, data: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    return { success: false, error: message }
  }
}

// ===== GET WORKSPACE HIERARCHY (Projects + Tables)
export async function getWorkspaceHierarchyAction(
  workspaceId: string
): Promise<{ success: boolean; data?: WorkspaceHierarchy; error?: string }> {
  try {
    const supabase = await createClient()
    const user = await requireAuth(supabase)

    // Verify workspace access
    await requireWorkspaceAccess(supabase, user.id, workspaceId)

    // Query 1: Fetch all projects in workspace
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (projectsError) throw new Error('Failed to fetch projects.')

    // Query 2: Fetch tables in each project
    // TODO: Optimize with nested select once Supabase relationship is defined
    const projectsWithTables: ProjectWithTables[] = []

    for (const project of projects || []) {
      const { data: tables, error: tablesError } = await supabase
        .from('entity_tables')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      if (!tablesError) {
        projectsWithTables.push({
          ...project,
          tables: tables || [],
        })
      }
    }

    // Query 3: Fetch tables without project (backwards compatibility)
    const { data: orphanTables, error: orphanError } = await supabase
      .from('entity_tables')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('project_id', null)
      .order('created_at', { ascending: false })

    if (orphanError) throw new Error('Failed to fetch tables.')

    const hierarchy: WorkspaceHierarchy = {
      projects: projectsWithTables,
      tablesWithoutProject: orphanTables || [],
    }

    return { success: true, data: hierarchy }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    return { success: false, error: message }
  }
}
