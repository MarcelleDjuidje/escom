'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface Column {
  key: string
  label: string
  render?: (item: any) => ReactNode
  className?: string
}

export function DataTable({
  endpoint, columns, searchPlaceholder, emptyText, filters = {},
  onRowClick, paginated = true,
}: {
  endpoint: string
  columns: Column[]
  searchPlaceholder?: string
  emptyText?: string
  filters?: Record<string, string>
  onRowClick?: (item: any) => void
  paginated?: boolean
}) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(endpoint, {
        params: { page, search: search || undefined, ...filters }
      })
      const data = res.data
      if (Array.isArray(data)) {
        setItems(data); setLastPage(1)
      } else {
        setItems(data.data || [])
        setLastPage(data.last_page || 1)
      }
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() /* eslint-disable-next-line */ }, [endpoint, page, JSON.stringify(filters)])

  return (
    <div className="card-escom overflow-hidden">
      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-escom-neutral-400" />
          <input
            type="search" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
            placeholder={searchPlaceholder || 'Rechercher...'}
            className="input-escom pl-10"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-escom-neutral-50 border-b">
            <tr>
              {columns.map(c => (
                <th key={c.key} className={`px-4 py-3 text-left text-xs uppercase font-semibold text-escom-neutral-700 ${c.className || ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-escom-blue-600" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={columns.length} className="py-12 text-center text-escom-neutral-500">{emptyText || 'Aucune donnée'}</td></tr>
            ) : items.map((it, i) => (
              <tr key={i} onClick={() => onRowClick?.(it)}
                className={`border-b border-escom-neutral-100 hover:bg-escom-neutral-50 transition ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map(c => (
                  <td key={c.key} className={`px-4 py-3 text-sm ${c.className || ''}`}>
                    {c.render ? c.render(it) : it[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginated && lastPage > 1 && (
        <div className="p-4 border-t flex items-center justify-between text-sm">
          <span className="text-escom-neutral-500">Page {page} / {lastPage}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-escom-neutral-50">Précédent</button>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-escom-neutral-50">Suivant</button>
          </div>
        </div>
      )}
    </div>
  )
}
