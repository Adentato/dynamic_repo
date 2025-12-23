'use client'

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import type { EntityField, EntityRecord } from '@/types/entities'

/**
 * Color mapping for select field badges
 * Maps field.options.choices[].color to Tailwind classes
 *
 * Notion-style color palette with background + text color
 */
const colorMap: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  pink: 'bg-pink-100 text-pink-700',
  purple: 'bg-purple-100 text-purple-700',
  blue: 'bg-blue-100 text-blue-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  teal: 'bg-teal-100 text-teal-700',
  green: 'bg-green-100 text-green-700',
  lime: 'bg-lime-100 text-lime-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  amber: 'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-700',
  slate: 'bg-slate-100 text-slate-700',
  zinc: 'bg-zinc-100 text-zinc-700',
  // Default
  default: 'bg-gray-100 text-gray-700',
}

/**
 * Get Tailwind classes for a color
 * Safely returns default if color doesn't exist
 */
function getColorClasses(color?: string): string {
  if (!color) return colorMap.default
  return colorMap[color] || colorMap.default
}

/**
 * Phase 2.3: useEntityColumns Hook
 *
 * Transforms EntityField[] into TanStack ColumnDef[]
 *
 * Key features:
 * - Maps field.id → column accessor
 * - Maps field.name → column header
 * - Accesses row data via row.data[field.id] (JSONB structure)
 * - Smart cell rendering:
 *   - Select fields: Colored badges (Notion-style)
 *   - Other fields: String representation
 * - useMemo for performance optimization
 *
 * @param fields - Array of EntityField from table.fields
 * @returns ColumnDef<EntityRecord>[] ready for TanStack Table
 */
export function useEntityColumns(fields: EntityField[]): ColumnDef<EntityRecord>[] {
  return useMemo(() => {
    return fields.map((field) => ({
      // ===== Column Identifier
      id: field.id,
      header: field.name,

      // ===== Data Accessor
      // Access the JSONB data using the field ID as key
      accessorFn: (row: EntityRecord) => row.data[field.id],

      // ===== Cell Rendering
      cell: (info) => {
        const value = info.getValue()

        // Handle null/undefined
        if (value === null || value === undefined) {
          return <span className="text-gray-400">—</span>
        }

        // ===== SELECT FIELD: Render as badge
        if (field.type === 'select') {
          // value should be a string or array of strings
          const values = Array.isArray(value) ? value : [String(value)]

          return (
            <div className="flex flex-wrap gap-1">
              {values.map((v, idx) => {
                // Find the choice config to get color
                const choice = field.options?.choices?.find((c) => c.id === v)
                const color = choice?.color

                return (
                  <span
                    key={idx}
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getColorClasses(color)}`}
                  >
                    {choice?.label || String(v)}
                  </span>
                )
              })}
            </div>
          )
        }

        // ===== OTHER FIELDS: Render as text
        // Convert to string for safe display
        return <span>{String(value)}</span>
      },

      // ===== Column Sizing
      size: 150,
      minSize: 100,
      maxSize: 500,
    }))
  }, [fields])
}
