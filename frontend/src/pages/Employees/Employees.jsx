import { useMemo, useState } from 'react'
import { UserCog, UserCheck, Gauge, Plus, Download, Pencil, Trash2, Eye, Sparkles, Building2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBusiness } from '../../context/BusinessContext'
import { useAsync } from '../../hooks/useAsync'
import { useAction, useBranchOptions } from '../../hooks/useAction'
import { employeeService } from '../../services/employeeService'
import { PageHeader, KpiCard, ChartCard, SearchBox, Select, StatusBadge, IconBtn, ErrorState } from '../../components/common/ui'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import { exportCsv } from '../../utils/csv'
import { fmtDate, todayStr } from '../../utils/format'

const axis = { fontSize: 12, fill: '#77778C' }
const STATUSES = ['Active', 'On leave', 'Inactive']

export default function Employees() {
  const { isOwner, cfg } = useBusiness()
  const { data, loading, error, reload } = useAsync(employeeService.list)
  const branches = useBranchOptions()
  const { run, busy } = useAction(reload)
  const [q, setQ] = useState(''), [branchId, setBranchId] = useState(''), [status, setStatus] = useState('')
  const [form, setForm] = useState(null), [del, setDel] = useState(null), [profile, setProfile] = useState(null)

  const rows = data ?? []
  const filtered = useMemo(() => rows.filter((e) => (!branchId || e.branchId === branchId) && (!status || e.status === status) && `${e.name} ${e.empCode} ${e.position}`.toLowerCase().includes(q.toLowerCase())), [rows, q, branchId, status])
  if (error) return <ErrorState message={error} onRetry={reload} />

  const per = {}; rows.forEach((e) => { const x = (per[e.branchName] ??= { name: e.branchName, count: 0, sum: 0 }); x.count++; x.sum += e.performance })
  const perBranch = Object.values(per).map((x) => ({ name: x.name, employees: x.count, avg: Math.round(x.sum / x.count) }))
  const avgAll = rows.length ? Math.round(rows.reduce((t, e) => t + e.performance, 0) / rows.length) : 0
  const sorted = [...rows].sort((a, b) => b.performance - a.performance), top = sorted[0], bottom = sorted[sorted.length - 1]
  const bopts = (branches.data ?? []).map((b) => ({ value: b.id, label: b.name })), multi = bopts.length > 1

  const fields = [
    { name: 'branchId', label: 'Branch', type: 'select', options: bopts }, { name: 'name', label: 'Full name', placeholder: 'Sneha Kapoor' },
    { name: 'position', label: 'Position', placeholder: 'Senior Stylist' }, { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
    { name: 'email', label: 'Email', type: 'email', optional: true }, { name: 'joinedOn', label: 'Joining date', type: 'date', optional: true },
    { name: 'performance', label: 'Performance (%)', type: 'number', int: true, max: 100, optional: true }, { name: 'status', label: 'Status', type: 'select', options: STATUSES.map((s) => ({ value: s, label: s })) },
  ]
  const cols = [
    { key: 'name', label: 'Name', sortable: true, render: (e) => <span className="font-semibold">{e.name}</span> }, { key: 'empCode', label: 'Employee ID', sortable: true, render: (e) => <span className="font-mono text-xs">{e.empCode}</span> },
    { key: 'branchName', label: 'Branch', sortable: true }, { key: 'position', label: 'Position', sortable: true }, { key: 'phone', label: 'Contact' },
    { key: 'joinedOn', label: 'Joined', sortable: true, render: (e) => fmtDate(e.joinedOn) },
    { key: 'performance', label: 'Performance', sortable: true, render: (e) => <div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-line"><div className="h-full rounded-full bg-primary" style={{ width: `${e.performance}%` }} /></div><span className="text-xs font-medium">{e.performance}%</span></div> },
    { key: 'status', label: 'Status', sortable: true, render: (e) => <StatusBadge status={e.status} /> },
    { key: 'a', label: 'Actions', render: (e) => <div className="flex"><IconBtn icon={Eye} label={`View ${e.name}`} onClick={() => setProfile(e)} />{isOwner && <><IconBtn icon={Pencil} label={`Edit ${e.name}`} onClick={() => setForm({ edit: e })} /><IconBtn icon={Trash2} danger label={`Delete ${e.name}`} onClick={() => setDel(e)} /></>}</div> },
  ]
  const csvCols = [['empCode', 'Employee ID'], ['name', 'Name'], ['branchName', 'Branch'], ['position', 'Position'], ['phone', 'Phone'], ['email', 'Email'], ['joinedOn', 'Joined'], ['performance', 'Performance %'], ['status', 'Status']].map(([key, label]) => ({ key, label }))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title="Employees" text={isOwner ? `Your ${cfg.labels.staff.toLowerCase()} and team across branches.` : `${cfg.labels.staff} at your branches (view only).`}>
        <button className="btn-outline" disabled={!filtered.length} onClick={() => exportCsv('employees.csv', csvCols, filtered)}><Download size={16} />Export CSV</button>
        {isOwner && <button className="btn-primary" disabled={!branches.data} onClick={() => setForm({})}><Plus size={16} />Add employee</button>}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={UserCog} label="Total employees" value={rows.length} /><KpiCard icon={UserCheck} label="Active employees" value={rows.filter((e) => e.status === 'Active').length} tone="success" />
        <KpiCard icon={Building2} label="Branches staffed" value={perBranch.length} tone="info" /><KpiCard icon={Gauge} label="Avg performance" value={`${avgAll}%`} tone="warning" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Employees per branch"><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={perBranch} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="employees" name="Employees" fill="#A78BFA" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></ChartCard>
        <ChartCard title="Average performance by branch"><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={perBranch} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => `${v}%`} /><Bar dataKey="avg" name="Avg performance" fill="#7C3AED" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></ChartCard>
        <div className="rounded-2xl bg-primary/10 p-5"><p className="flex items-center gap-2 font-semibold text-primary"><Sparkles size={18} />AI insights <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-muted">simulated</span></p>
          {top && <ul className="mt-3 space-y-2.5 text-sm"><li>{top.name} ({top.branchName}) leads with {top.performance}% performance.</li><li>{bottom.name} is at {bottom.performance}%. A coaching session could help.</li><li>{rows.filter((e) => e.status === 'On leave').length} employees are on leave. Check weekend coverage.</li></ul>}</div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, ID or position" />
        {multi && <Select label="Branch filter" value={branchId} onChange={setBranchId} all="All branches" options={bopts} />}
        <Select label="Status filter" value={status} onChange={setStatus} all="All statuses" options={STATUSES} />
        {(q || branchId || status) && <button className="btn-ghost" onClick={() => { setQ(''); setBranchId(''); setStatus('') }}>Clear</button>}
      </div>
      <DataTable columns={cols} rows={filtered} loading={loading} minWidth={1050} icon={UserCog} emptyTitle="No employees match" emptyText="Adjust the filters." initialSort={{ key: 'empCode', dir: 'asc' }} />

      {form && <FormModal title={form.edit ? 'Edit employee' : 'Add employee'} fields={fields} submitLabel={form.edit ? 'Save changes' : 'Add employee'} onClose={() => setForm(null)}
        defaults={form.edit ? { branchId: form.edit.branchId, name: form.edit.name, position: form.edit.position, phone: form.edit.phone, email: form.edit.email ?? '', joinedOn: form.edit.joinedOn, performance: form.edit.performance, status: form.edit.status } : { branchId: bopts.length === 1 ? bopts[0].value : '', name: '', position: '', phone: '', email: '', joinedOn: todayStr(), performance: 75, status: 'Active' }}
        onSubmit={async (v) => { const ok = await run(() => (form.edit ? employeeService.update(form.edit.id, v) : employeeService.create(v)), form.edit ? 'Employee updated' : 'Employee added'); if (ok) setForm(null) }} />}
      <ConfirmDialog open={!!del} danger busy={busy} title={`Delete ${del?.name}?`} confirmLabel="Delete" onClose={() => setDel(null)} text="Employees with scheduled appointments can’t be deleted. Reassign or cancel those first."
        onConfirm={async () => { const e = del; setDel(null); await run(() => employeeService.remove(e.id), `${e.name} deleted`) }} />
      {profile && (
        <Modal open onClose={() => setProfile(null)} title={profile.name} footer={<button className="btn-outline" onClick={() => setProfile(null)}>Close</button>}>
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={profile.status} /><span className="text-muted">{profile.position} · {profile.branchName}</span></div>
            <dl className="divide-y divide-line rounded-xl border border-line">{[['Employee ID', profile.empCode], ['Phone', profile.phone], ['Email', profile.email || '—'], ['Joined', fmtDate(profile.joinedOn)], [`Completed ${cfg.labels.appointments.toLowerCase()}`, profile.completed], ['Upcoming', profile.upcoming]].map(([k, v]) => <div key={k} className="flex justify-between px-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
            <div><div className="mb-1.5 flex justify-between"><span className="font-medium">Performance</span><span>{profile.performance}%</span></div><div className="h-2 rounded-full bg-line"><div className="h-full rounded-full bg-primary" style={{ width: `${profile.performance}%` }} /></div></div>
          </div>
        </Modal>)}
    </div>
  )
}
