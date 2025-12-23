import { z } from 'zod'

/**
 * Field type enum - Matches database CHECK constraint
 * Supports text, number, select, date, boolean, email, url, richtext, json, relation
 */
export const fieldTypeSchema = z.enum([
  'text',
  'number',
  'select',
  'date',
  'boolean',
  'email',
  'url',
  'richtext',
  'json',
  'relation',
] as const)

export type FieldType = z.infer<typeof fieldTypeSchema>

/**
 * Create a new entity table
 * Requires: workspace_id, name
 * Optional: description, project_id (Phase 3)
 */
export const createTableSchema = z.object({
  workspace_id: z.string().uuid({
    message: 'workspace_id doit être un UUID valide.',
  }),
  project_id: z.string().uuid({
    message: 'project_id doit être un UUID valide.',
  }).nullable().optional(),
  name: z.string().min(1, {
    message: 'Le nom de la table est requis.',
  }).max(255, {
    message: 'Le nom de la table ne peut pas dépasser 255 caractères.',
  }),
  description: z.string().max(1000).optional().default(''),
})

export type CreateTableInput = z.infer<typeof createTableSchema>

/**
 * Create a new field in an entity table
 * Requires: table_id, name, type
 * Optional: options (JSONB configuration), order_index
 */
export const createFieldSchema = z.object({
  table_id: z.string().uuid({
    message: 'table_id doit être un UUID valide.',
  }),
  name: z.string().min(1, {
    message: 'Le nom du champ est requis.',
  }).max(255, {
    message: 'Le nom du champ ne peut pas dépasser 255 caractères.',
  }),
  type: fieldTypeSchema,
  options: z.record(z.string(), z.any()).optional().default({}),
  order_index: z.number().int().min(0).optional().default(0),
})

export type CreateFieldInput = z.infer<typeof createFieldSchema>

/**
 * Update an existing field
 * Requires: field_id
 * Optional: name, type, options (partial update)
 */
export const updateFieldSchema = z.object({
  field_id: z.string().uuid({
    message: 'field_id doit être un UUID valide.',
  }),
  name: z.string().min(1).max(255).optional(),
  type: fieldTypeSchema.optional(),
  options: z.record(z.string(), z.any()).optional(),
  order_index: z.number().int().min(0).optional(),
}).refine(
  // At least one field should be updated
  (data) => Object.keys(data).length > 1,
  {
    message: 'Au moins un champ doit être modifié.',
  }
)

export type UpdateFieldInput = z.infer<typeof updateFieldSchema>

/**
 * Create or update a record in an entity table
 * Requires: table_id, data (JSONB object)
 * data keys should match field IDs, values match field types
 */
export const upsertRecordSchema = z.object({
  table_id: z.string().uuid({
    message: 'table_id doit être un UUID valide.',
  }),
  data: z.record(z.string(), z.any()).optional().default({}),
})

export type UpsertRecordInput = z.infer<typeof upsertRecordSchema>
