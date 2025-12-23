'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table'
import type { EntityTableWithFields, EntityRecord } from '@/types/entities'

interface EntityTableProps {
  table: EntityTableWithFields
  initialRecords: EntityRecord[]
}

/**
 * Phase 2.2: EntityTable Component
 *
 * Client Component that renders a dynamic table using TanStack Table
 *
 * Props:
 * - table: Table structure with fields (columns metadata)
 * - initialRecords: Array of records (rows data)
 *
 * Features:
 * - Core rendering with useReactTable
 * - Columns definition (empty for now - Phase 2.3 will add dynamic mapping)
 * - Tailwind styling (borders, header, responsive)
 *
 * Phase 2.3 will replace the empty columns array with dynamic column definitions
 * based on table.fields (entity_fields)
 */
export function EntityTable({ table, initialRecords }: EntityTableProps) {
  // ===== 1. DEFINE COLUMNS
  // For Phase 2.2, we use an empty array.
  // Phase 2.3 will dynamically generate columns from table.fields
  const columns: ColumnDef<EntityRecord>[] = []

  // ===== 2. INITIALIZE TABLE
  const tableInstance = useReactTable({
    data: initialRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { getHeaderGroups, getRowModel } = tableInstance

  // ===== 3. RENDER
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            {getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody>
            {getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  Aucune donnée à afficher.
                  <br />
                  <span className="text-xs text-gray-400">
                    Les colonnes seront ajoutées en Phase 2.3
                  </span>
                </td>
              </tr>
            ) : (
              getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Debug Info (temporary - remove in Phase 2.3) */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <p className="text-xs text-gray-500">
          📊 <strong>{initialRecords.length}</strong> lignes |
          <strong> {table.fields.length}</strong> colonnes (vides pour l'instant)
        </p>
        <p className="mt-1 text-xs text-gray-400">
          💡 Phase 2.3 mappera entity_fields → colonnes TanStack dynamiquement
        </p>
      </div>
    </div>
  )
}
