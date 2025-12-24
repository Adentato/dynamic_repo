'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  upsertRecordSchema,
  type UpsertRecordInput,
} from '@/lib/validations/entities'
import {
  requireAuth,
  requireTableInWorkspace,
  NotFoundError,
} from '@/lib/auth/workspace'
import { success, failure, type ActionResult } from '@/lib/types/action-result'
import type { EntityRecord } from '@/types/entities'

/**
 * Phase 4 - Entity Records Server Actions
 *
 * Manages records (data) within entity tables.
 * All actions use centralized auth helpers and pagination support.
 */

// ===== PAGINATION TYPES
export interface PaginatedRecords {
  records: EntityRecord[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalPages: number
}

// ===== GET RECORDS WITH PAGINATION
/**
 * Fetch records from a table with pagination support
 *
 * @param tableId - UUID of the entity_table
 * @param page - Page number (1-indexed), default: 1
 * @param pageSize - Records per page, default: 50
 * @returns ActionResult<PaginatedRecords>
 *
 * @example
 * const result = await getEntityRecordsAction(tableId, 1, 50)
 * // Returns: { success: true, data: { total: 1000, hasNextPage: true, records: [...50 items] } }
 */
export async function getEntityRecordsAction(
  tableId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<ActionResult<PaginatedRecords>> {
  try {
    const supabase = await createClient()
    await requireAuth(supabase)

    // Validate pagination params
    if (page < 1) page = 1
    if (pageSize < 1 || pageSize > 500) pageSize = 50 // Max 500 per page

    // ===== VERIFY TABLE EXISTS AND USER HAS ACCESS
    const { data: table } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', tableId)
      .maybeSingle()

    if (!table) {
      throw new NotFoundError('Table')
    }

    // Verify workspace access (uses helper)
    await requireTableInWorkspace(supabase, tableId, table.workspace_id)

    // ===== FETCH TOTAL COUNT (for pagination metadata)
    const { count: total, error: countError } = await supabase
      .from('entity_records')
      .select('*', { count: 'exact', head: true })
      .eq('table_id', tableId)

    if (countError || total === null) {
      throw new Error('Failed to fetch record count.')
    }

    // ===== FETCH PAGINATED RECORDS
    const offset = (page - 1) * pageSize
    const { data: records, error: recordsError } = await supabase
      .from('entity_records')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (recordsError) {
      throw new Error('Failed to fetch records.')
    }

    // ===== CALCULATE PAGINATION METADATA
    const totalPages = Math.ceil(total / pageSize)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return success({
      records: (records || []) as EntityRecord[],
      total,
      page,
      pageSize,
      hasNextPage,
      hasPreviousPage,
      totalPages,
    } as PaginatedRecords)
  } catch (error) {
    return failure(error)
  }
}

/**
 * Create a new record in an entity table
 *
 * @param input - UpsertRecordInput with table_id and data
 * @returns ActionResult<EntityRecord>
 */
export async function createEntityRecordAction(
  input: UpsertRecordInput
): Promise<ActionResult<EntityRecord>> {
  try {
    const supabase = await createClient()
    await requireAuth(supabase)

    // Validate input
    const validatedInput = upsertRecordSchema.parse(input)

    // ===== VERIFY TABLE EXISTS AND USER HAS ACCESS
    const { data: table } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', validatedInput.table_id)
      .maybeSingle()

    if (!table) {
      throw new NotFoundError('Table')
    }

    // Verify workspace access
    await requireTableInWorkspace(supabase, validatedInput.table_id, table.workspace_id)

    // ===== CREATE RECORD
    const { data: record, error: recordError } = await supabase
      .from('entity_records')
      .insert({
        table_id: validatedInput.table_id,
        data: validatedInput.data,
      })
      .select()
      .single()

    if (recordError) throw new Error('Failed to create record.')

    // Revalidate table view
    revalidatePath(`/workspace/*/table/${validatedInput.table_id}`)

    return success(record as EntityRecord)
  } catch (error) {
    return failure(error)
  }
}

/**
 * Update an existing record
 *
 * @param recordId - UUID of the record to update
 * @param tableId - UUID of the table
 * @param data - Partial data to update
 * @returns ActionResult<EntityRecord>
 */
export async function updateEntityRecordAction(
  recordId: string,
  tableId: string,
  data: Record<string, any>
): Promise<ActionResult<EntityRecord>> {
  try {
    const supabase = await createClient()
    await requireAuth(supabase)

    // ===== VERIFY TABLE EXISTS AND USER HAS ACCESS
    const { data: table } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', tableId)
      .maybeSingle()

    if (!table) {
      throw new NotFoundError('Table')
    }

    // Verify workspace access
    await requireTableInWorkspace(supabase, tableId, table.workspace_id)

    // ===== UPDATE RECORD
    const { data: record, error: recordError } = await supabase
      .from('entity_records')
      .update({ data })
      .eq('id', recordId)
      .eq('table_id', tableId)
      .select()
      .single()

    if (recordError) throw new Error('Failed to update record.')

    // Revalidate table view
    revalidatePath(`/workspace/*/table/${tableId}`)

    return success(record as EntityRecord)
  } catch (error) {
    return failure(error)
  }
}

/**
 * Delete a record
 *
 * @param recordId - UUID of the record to delete
 * @param tableId - UUID of the table (for validation)
 * @returns ActionResult<void>
 */
export async function deleteEntityRecordAction(
  recordId: string,
  tableId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    await requireAuth(supabase)

    // ===== VERIFY TABLE EXISTS AND USER HAS ACCESS
    const { data: table } = await supabase
      .from('entity_tables')
      .select('workspace_id')
      .eq('id', tableId)
      .maybeSingle()

    if (!table) {
      throw new NotFoundError('Table')
    }

    // Verify workspace access
    await requireTableInWorkspace(supabase, tableId, table.workspace_id)

    // ===== DELETE RECORD
    const { error: deleteError } = await supabase
      .from('entity_records')
      .delete()
      .eq('id', recordId)
      .eq('table_id', tableId)

    if (deleteError) throw new Error('Failed to delete record.')

    // Revalidate table view
    revalidatePath(`/workspace/*/table/${tableId}`)

    return success(undefined)
  } catch (error) {
    return failure(error)
  }
}
