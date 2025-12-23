'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { EntityTableWithFields, EntityRecord } from '@/types/entities'
import { useEntityColumns } from './columns-builder'

interface EntityTableProps {
  table: EntityTableWithFields
  initialRecords: EntityRecord[]
}

/**
 * Phase 2.3: EntityTable Component (Updated)
 *
 * Client Component that renders a dynamic table using TanStack Table
 *
 * Props:
 * - table: Table structure with fields (columns metadata)
 * - initialRecords: Array of records (rows data)
 *
 * Features:
 * - Dynamic column generation from entity_fields (via useEntityColumns)
 * - Smart cell rendering (select fields as badges, others as text)
 * - Tailwind styling (borders, header, responsive)
 * - Notion-style color palette for select badges
 *
 * The columns are built by useEntityColumns hook which maps each
 * EntityField to a TanStack ColumnDef with proper accessors and renderers.
 */
export function EntityTable({ table, initialRecords }: EntityTableProps) {
  // ===== 1. GENERATE COLUMNS DYNAMICALLY
  // useEntityColumns transforms entity_fields into TanStack columns
  // with smart rendering for different field types
  const columns = useEntityColumns(table.fields)

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

      {/* Debug Info */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <p className="text-xs text-gray-500">
          📊 <strong>{initialRecords.length}</strong> lignes |
          <strong> {table.fields.length}</strong> colonnes dynamiques
        </p>
        <p className="mt-1 text-xs text-gray-400">
          ✅ Phase 2.3: Colonnes générées dynamiquement (select fields = badges colorés)
        </p>
      </div>
    </div>
  )
}
