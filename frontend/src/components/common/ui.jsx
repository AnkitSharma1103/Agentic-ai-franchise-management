import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react'
import { pct } from '../../utils/format'

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-xl bg-line/70 ${className}`} />

export function Delta({ value }) {
  const up = value >= 0
  const I = up ? TrendingUp : TrendingDown
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-success' : 'text-danger'}`}><I size={13} />{pct(value)}</span>
}

export function KpiCard({ icon: Icon, label, value, delta, tone = 'primary' }) {
  const tones = { primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', info: 'bg-blue-500/10 text-blue-600' }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={20} /></span>{delta !== undefined && <Delta value={delta} />}</div>
      <p className="mt-4 text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

export function ChartCard({ title, action, children, className = '' }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2>{action}</div>
      {children}
    </section>
  )
}

const BADGE = { Active: 'bg-success/10 text-success', Completed: 'bg-success/10 text-success', 'In stock': 'bg-success/10 text-success', 'High-value': 'bg-primary/10 text-primary', Regular: 'bg-blue-500/10 text-blue-600', Occasional: 'bg-line text-muted', Suspended: 'bg-danger/10 text-danger', Cancelled: 'bg-danger/10 text-danger', 'Out of stock': 'bg-danger/10 text-danger', 'At-risk': 'bg-danger/10 text-danger', Refunded: 'bg-danger/10 text-danger', Invited: 'bg-warning/15 text-[#B45309]', Pending: 'bg-warning/15 text-[#B45309]', 'Low stock': 'bg-warning/15 text-[#B45309]', 'On leave': 'bg-warning/15 text-[#B45309]', Scheduled: 'bg-blue-500/10 text-blue-600', Inactive: 'bg-line text-muted' }
export const StatusBadge = ({ status }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[status] ?? BADGE.Inactive}`}>{status}</span>

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <AlertTriangle className="mx-auto text-danger" size={32} />
      <p className="mt-3 font-semibold">Couldn’t load this page</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline mt-5"><RefreshCw size={15} />Try again</button>}
    </div>
  )
}

export const EmptyState = ({ icon: Icon, title, text }) => (
  <div className="py-10 text-center">{Icon && <Icon className="mx-auto text-muted" size={30} />}<p className="mt-3 font-medium">{title}</p>{text && <p className="mt-1 text-sm text-muted">{text}</p>}</div>
)

export function PageHeader({ title, text, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-2xl font-bold tracking-tight">{title}</h2>{text && <p className="text-sm text-muted">{text}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

import { Search } from 'lucide-react'
export const SearchBox = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative min-w-[200px] flex-1 sm:max-w-xs"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="input !pl-9" /></div>
)
export const Select = ({ label, value, onChange, options, all }) => (
  <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="input !w-auto">{all && <option value="">{all}</option>}{options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>
)
export const IconBtn = ({ icon: I, label, onClick, danger, disabled }) => <button disabled={disabled} onClick={onClick} title={label} aria-label={label} className={`rounded-lg p-2 hover:bg-canvas disabled:opacity-40 ${danger ? 'text-danger' : 'text-muted hover:text-ink'}`}><I size={17} /></button>
