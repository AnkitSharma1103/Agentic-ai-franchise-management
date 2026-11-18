import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitBranch, LayoutGrid, Table2, Plus, Pencil, Trash2, Eye, Download, MapPin, UserRound } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import { useAsync } from '../../hooks/useAsync'
import { useAction } from '../../hooks/useAction'
import { branchService } from '../../services/branchService'
import { userService } from '../../services/userService'
import { useAuthStore } from '../../stores/authStore'
import { PageHeader, KpiCard, SearchBox, Select, StatusBadge, Delta, IconBtn, ErrorState } from '../../components/common/ui'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { exportCsv } from '../../utils/csv'
import { inr, num } from '../../utils/format'

export default function Branches() {
  const { isOwner } = useBusiness()
  const { data, loading, error, reload } = useAsync(branchService.list)
  const team = useAsync(() => (isOwner ? userService.list() : Promise.resolve(null)), [isOwner])
  const { run, busy } = useAction(async () => { await reload(); useAuthStore.getState().syncBranches() })
  const [q, setQ] = useState(''), [status, setStatus] = useState(''), [view, setView] = useState('table')
  const [form, setForm] = useState(null), [del, setDel] = useState(null)

  const rows = data ?? []
  const filtered = useMemo(() => rows.filter((b) => (!status || b.status === status) && `${b.name} ${b.city} ${b.manager ?? ''}`.toLowerCase().includes(q.toLowerCase())), [rows, q, status])
  if (error) return <ErrorState message={error} onRetry={reload} />

  const managers = (team.data?.users ?? []).filter((u) => u.role === 'MANAGER' && u.status === 'Active').map((u) => ({ value: u.id, label: u.name }))
  const fields = [
    { name: 'name', label: 'Branch name', placeholder: 'Modinagar' }, { name: 'city', label: 'City', placeholder: 'Modinagar' },
    { name: 'address', label: 'Address', span: 2, optional: true, placeholder: 'Street, locality, PIN' },
    { name: 'phone', label: 'Phone', type: 'tel', optional: true, placeholder: '+91 98765 43210' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
    { name: 'managerId', label: 'Manager', type: 'select', optional: true, placeholder: 'No manager', options: managers, span: 2, hint: 'Managers are invited from Settings → Team.' },
  ]
  const avg = rows.length ? rows.reduce((t, b) => t + b.revenue, 0) / rows.length : 0
  const cols = [
    { key: 'name', label: 'Branch', sortable: true, render: (b) => <Link to={`/branches/${b.id}`} className="font-semibold text-primary hover:underline">{b.name}</Link> },
    { key: 'city', label: 'Location', sortable: true }, { key: 'manager', label: 'Manager', sortable: true, render: (b) => b.manager ?? <span className="text-muted">Unassigned</span> },
    { key: 'revenue', label: 'Revenue', sortable: true, render: (b) => <span className="font-medium">{inr(b.revenue)}</span> },
    { key: 'customers', label: 'Customers', sortable: true, render: (b) => num(b.customers) }, { key: 'appointments', label: 'Appointments', sortable: true, render: (b) => num(b.appointments) },
    { key: 'growth', label: 'Growth', sortable: true, render: (b) => <Delta value={b.growth} /> }, { key: 'status', label: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    { key: 'actions', label: 'Actions', render: (b) => <div className="flex"><Link to={`/branches/${b.id}`} aria-label={`View ${b.name}`} title="View" className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"><Eye size={17} /></Link>{isOwner && <><IconBtn icon={Pencil} label={`Edit ${b.name}`} onClick={() => setForm({ edit: b })} /><IconBtn icon={Trash2} danger label={`Delete ${b.name}`} onClick={() => setDel(b)} /></>}</div> },
  ]
  const csvCols = [['name', 'Branch'], ['city', 'City'], ['manager', 'Manager'], ['revenue', 'Revenue (INR)'], ['customers', 'Customers'], ['appointments', 'Appointments'], ['growth', 'Growth %'], ['status', 'Status']].map(([key, label]) => ({ key, label }))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title="Branches" text={isOwner ? 'Manage every location in your business.' : 'Branches you are assigned to.'}>
        <button className="btn-outline" onClick={() => exportCsv('branches.csv', csvCols, filtered)} disabled={!filtered.length}><Download size={16} />Export CSV</button>
        {isOwner && <button className="btn-primary" onClick={() => setForm({})}><Plus size={16} />Add branch</button>}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={GitBranch} label="Total branches" value={rows.length} />
        <KpiCard icon={GitBranch} label="Active branches" value={rows.filter((b) => b.status === 'Active').length} tone="success" />
        <KpiCard icon={GitBranch} label="Average revenue / branch" value={inr(avg)} tone="info" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search by name, city or manager" />
        <Select label="Status filter" value={status} onChange={setStatus} all="All statuses" options={['Active', 'Inactive']} />
        <div className="ml-auto flex rounded-xl border border-line bg-white p-0.5" role="group" aria-label="View">
          {[['table', Table2, 'Table view'], ['grid', LayoutGrid, 'Grid view']].map(([v, I, l]) => <button key={v} aria-label={l} aria-pressed={view === v} onClick={() => setView(v)} className={`rounded-lg p-2 ${view === v ? 'bg-primary text-white' : 'text-muted'}`}><I size={17} /></button>)}
        </div>
      </div>

      {view === 'table' ? <DataTable columns={cols} rows={filtered} loading={loading} minWidth={1000} icon={GitBranch} emptyTitle="No branches match" emptyText="Try a different search or filter." initialSort={{ key: 'revenue', dir: 'desc' }} /> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between"><Link to={`/branches/${b.id}`} className="text-lg font-semibold hover:text-primary">{b.name}</Link><StatusBadge status={b.status} /></div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} />{b.city}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><UserRound size={14} />{b.manager ?? 'No manager'}</p>
              <p className="mt-4 text-2xl font-bold">{inr(b.revenue)}</p><Delta value={b.growth} />
              <div className="mt-4 flex justify-between border-t border-line pt-3 text-xs text-muted"><span>{num(b.customers)} customers</span><span>{num(b.appointments)} appointments</span></div>
              <div className="mt-3 flex gap-2"><Link to={`/branches/${b.id}`} className="btn-outline flex-1 !py-2">View</Link>{isOwner && <><button className="btn-outline !px-3 !py-2" aria-label={`Edit ${b.name}`} onClick={() => setForm({ edit: b })}><Pencil size={15} /></button><button className="btn-outline !px-3 !py-2 text-danger" aria-label={`Delete ${b.name}`} onClick={() => setDel(b)}><Trash2 size={15} /></button></>}</div>
            </div>
          ))}
          {!filtered.length && <p className="col-span-full py-10 text-center text-sm text-muted">No branches match.</p>}
        </div>
      )}

      {form && <FormModal title={form.edit ? `Edit ${form.edit.name}` : 'Add branch'} fields={fields} submitLabel={form.edit ? 'Save changes' : 'Add branch'}
        defaults={form.edit ? { name: form.edit.name, city: form.edit.city, address: form.edit.address, phone: form.edit.phone, status: form.edit.status, managerId: form.edit.managerId ?? '' } : { status: 'Active', name: '', city: '', address: '', phone: '', managerId: '' }}
        onClose={() => setForm(null)}
        onSubmit={async (v) => { const body = { ...v, managerId: v.managerId ?? null }; const ok = await run(() => (form.edit ? branchService.update(form.edit.id, body) : branchService.create(body)), form.edit ? 'Branch updated' : 'Branch added'); if (ok) setForm(null) }} />}
      <ConfirmDialog open={!!del} danger busy={busy} title={`Delete ${del?.name}?`} confirmLabel="Delete branch" onClose={() => setDel(null)}
        text="This permanently removes the branch along with its customers, sales, employees, inventory and appointments. Managers assigned only to this branch lose access."
        onConfirm={async () => { const b = del; setDel(null); await run(() => branchService.remove(b.id), `${b.name} deleted`) }} />
    </div>
  )
}
