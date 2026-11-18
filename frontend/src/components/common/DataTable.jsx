import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton, EmptyState } from './ui'

// columns: [{ key, label, sortable, value?(row) for sorting, render?(row), className }]
export default function DataTable({ columns, rows, loading, pageSize = 10, emptyTitle = 'Nothing here yet', emptyText, initialSort, minWidth = 800, icon }) {
  const [sort, setSort] = useState(initialSort ?? null)
  const [page, setPage] = useState(0)
  useEffect(() => { setPage(0) }, [rows.length])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key), val = (r) => (col?.value ? col.value(r) : r[sort.key])
    return [...rows].sort((a, b) => { const x = val(a), y = val(b); const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }); return sort.dir === 'asc' ? c : -c })
  }, [rows, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize)), cur = Math.min(page, pages - 1)
  const slice = sorted.slice(cur * pageSize, cur * pageSize + pageSize)
  const toggle = (k) => setSort((s) => (s?.key === k ? (s.dir === 'asc' ? { key: k, dir: 'desc' } : null) : { key: k, dir: 'asc' }))

  if (loading && !rows.length) return <div className="card space-y-3 p-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
  return (
    <div className={`card overflow-hidden ${loading ? 'opacity-70' : ''}`}>
      {!rows.length ? <EmptyState icon={icon} title={emptyTitle} text={emptyText} /> : (<>
        <div className="overflow-x-auto"><table className="w-full text-sm" style={{ minWidth }}>
          <thead><tr className="border-b border-line bg-canvas text-left text-muted">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 font-medium ${c.className ?? ''}`} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                {c.sortable ? <button onClick={() => toggle(c.key)} className="inline-flex items-center gap-1 hover:text-ink">{c.label}{sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button> : c.label}
              </th>
            ))}
          </tr></thead>
          <tbody>{slice.map((r) => <tr key={r.id} className="border-b border-line last:border-0 hover:bg-canvas/60">{columns.map((c) => <td key={c.key} className={`px-4 py-3 ${c.className ?? ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
        </table></div>
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
          <span>Showing {cur * pageSize + 1}–{Math.min(sorted.length, (cur + 1) * pageSize)} of {sorted.length}</span>
          <div className="flex items-center gap-1">
            <button aria-label="Previous page" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="rounded-lg p-1.5 hover:bg-canvas disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="px-2">Page {cur + 1} of {pages}</span>
            <button aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="rounded-lg p-1.5 hover:bg-canvas disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      </>)}
    </div>
  )
}
