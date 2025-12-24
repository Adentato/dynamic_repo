'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

/**
 * Breadcrumb component for navigation hierarchy
 * 
 * Displays a breadcrumb trail like: Dashboard > Project > Table
 * Only clickable items have href, last item is always plain text
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
