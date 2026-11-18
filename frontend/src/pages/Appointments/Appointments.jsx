import { useMemo, useState } from 'react'
import { CalendarCheck, CalendarClock, CheckCircle2, XCircle, Plus, Download, Pencil, Check, Ban, Table2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useBusiness } from '../../context/BusinessContext'
import { useAsync } from '../../hooks/useAsync'
import { useAction, useBranchOptions } from '../../hooks/useAction'
import { appointmentService } from '../../services/appointmentService'
import { customerService } from '../../services/customerService'
import { employeeService } from '../../services/employeeService'
import { PageHeader, KpiCard, SearchBox, Select, StatusBadge, IconBtn, ErrorState } from '../../components/common/ui'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { CATALOG } from '../../config/catalog'
import { exportCsv } from '../../utils/csv'
import { inr, fmtDate, fmtTime, todayStr } from '../../utils/format'

const STATUSES = ['Scheduled', 'Completed', 'Cancelled']
const pad = (n) => String(n).padStart(2, '0')
const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`

export default function Appointments() {
  const { business, cfg } = useBusiness()
  const label = cfg.labels.appointments
  const { data, loading, error, reload } = useAsync(appointmentService.list)
  const custs = useAsync(customerService.list), emps = useAsync(employeeService.list)
  const branches = useBranchOptions()
  const { run, busy } = useAction(reload)
  const [q, setQ] = useState(''), [branchId, setBranchId] = useState(''), [status, setStatus] = useState(''), [date, setDate] = useState('')
  const [view, setView] = useState('table'), [form, setForm] = useState(null), [cancel, setCancel] = useState(null)
  const [cal, setCal] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })

  const rows = data ?? [], today = todayStr()
  // The calendar ignores the date filter so every day stays visible while one is selected.
  const base = useMemo(() => rows.filter((a) => (!branchId || a.branchId === branchId) && (!status || a.status === status) && `${a.customerName} ${a.service} ${a.employeeName}`.toLowerCase().includes(q.toLowerCase())), [rows, q, branchId, status])
  const filtered = useMemo(() => (date ? base.filter((a) => a.date === date) : base), [base, date])
  if (error) return <ErrorState message={error} onRetry={reload} />

  const catalog = CATALOG[business.type] ?? CATALOG.other
  const bopts = (branches.data ?? []).map((b) => ({ value: b.id, label: b.name })), multi = bopts.length > 1
  const fields = [
    { name: 'branchId', label: 'Branch', type: 'select', options: bopts },
    { name: 'customerId', label: 'Customer', type: 'select', options: (v) => (custs.data ?? []).filter((c) => c.branchId === v.branchId).map((c) => ({ value: c.id, label: c.name })) },
    { name: 'service', label: 'Service', type: 'select', options: catalog.map((c) => ({ value: c.name, label: c.name })), onPick: (v) => ({ price: catalog.find((c) => c.name === v)?.price ?? '' }) },
    { name: 'employeeId', label: 'Employee', type: 'select', options: (v) => (emps.data ?? []).filter((e) => e.branchId === v.branchId && e.status === 'Active').map((e) => ({ value: e.id, label: e.name })) },
    { name: 'date', label: 'Date', type: 'date' }, { name: 'time', label: 'Time', type: 'time' }, { name: 'price', label: 'Price (₹)', type: 'number', min: 0, span: 2 },
  ]
  const stats = { today: rows.filter((a) => a.date === today && a.status !== 'Cancelled').length, upcoming: rows.filter((a) => a.status === 'Scheduled' && a.date >= today).length, done: rows.filter((a) => a.status === 'Completed').length, cancelled: rows.filter((a) => a.status === 'Cancelled').length }

  const complete = (a) => run(() => appointmentService.update(a.id, { status: 'Completed' }), (r) => (r?.saleCreated ? 'Marked completed. Sale recorded.' : 'Marked completed'))
  const actions = (a) => a.status === 'Scheduled' && <div className="flex"><IconBtn icon={Check} label={`Mark ${a.customerName} completed`} onClick={() => complete(a)} /><IconBtn icon={Pencil} label={`Edit ${a.customerName}'s appointment`} onClick={() => setForm({ edit: a })} /><IconBtn icon={Ban} danger label={`Cancel ${a.customerName}'s appointment`} onClick={() => setCancel(a)} /></div>
  const cols = [
    { key: 'customerName', label: 'Customer', sortable: true, render: (a) => <span className="font-semibold">{a.customerName}</span> }, { key: 'service', label: 'Service', sortable: true },
    { key: 'employeeName', label: 'Employee', sortable: true }, { key: 'branchName', label: 'Branch', sortable: true },
    { key: 'date', label: 'Date', sortable: true, value: (a) => a.date + a.time, render: (a) => fmtDate(a.date) }, { key: 'time', label: 'Time', render: (a) => fmtTime(a.time) },
    { key: 'price', label: 'Price', sortable: true, render: (a) => inr(a.price) }, { key: 'status', label: 'Status', sortable: true, render: (a) => <StatusBadge status={a.status} /> },
    { key: 'a', label: 'Actions', render: actions },
  ]
  const csvCols = [['customerName', 'Customer'], ['service', 'Service'], ['employeeName', 'Employee'], ['branchName', 'Branch'], ['date', 'Date'], ['time', 'Time'], ['price', 'Price (INR)'], ['status', 'Status']].map(([k, l]) => ({ key: k, label: l }))
  const clearable = q || branchId || status || date

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title={label} text={`Schedule, track and complete ${label.toLowerCase()}.`}>
        <button className="btn-outline" disabled={!filtered.length} onClick={() => exportCsv('appointments.csv', csvCols, filtered)}><Download size={16} />Export CSV</button>
        <button className="btn-primary" disabled={!branches.data || !custs.data || !emps.data} onClick={() => setForm({})}><Plus size={16} />Add</button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CalendarCheck} label="Today" value={stats.today} /><KpiCard icon={CalendarClock} label="Upcoming" value={stats.upcoming} tone="info" />
        <KpiCard icon={CheckCircle2} label="Completed" value={stats.done} tone="success" /><KpiCard icon={XCircle} label="Cancelled" value={stats.cancelled} tone="warning" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search customer, service or employee" />
        {multi && <Select label="Branch filter" value={branchId} onChange={setBranchId} all="All branches" options={bopts} />}
        <Select label="Status filter" value={status} onChange={setStatus} all="All statuses" options={STATUSES} />
        <input type="date" aria-label="Date filter" value={date} onChange={(e) => setDate(e.target.value)} className="input !w-auto" />
        {clearable && <button className="btn-ghost" onClick={() => { setQ(''); setBranchId(''); setStatus(''); setDate('') }}>Clear</button>}
        <div className="ml-auto flex rounded-xl border border-line bg-white p-0.5" role="group" aria-label="View">
          {[['table', Table2, 'Table view'], ['calendar', CalendarDays, 'Calendar view']].map(([v, I, l]) => <button key={v} aria-label={l} aria-pressed={view === v} onClick={() => setView(v)} className={`rounded-lg p-2 ${view === v ? 'bg-primary text-white' : 'text-muted'}`}><I size={17} /></button>)}
        </div>
      </div>

      {view === 'table'
        ? <DataTable columns={cols} rows={filtered} loading={loading} minWidth={1050} icon={CalendarDays} emptyTitle={`No ${label.toLowerCase()} match`} emptyText="Adjust the filters or add one." initialSort={{ key: 'date', dir: 'desc' }} />
        : <Calendar cal={cal} setCal={setCal} rows={base} today={today} selected={date} onSelect={(d) => setDate(date === d ? '' : d)} actions={actions} />}

      {form && <FormModal title={form.edit ? `Edit ${label.toLowerCase().replace(/s$/, '')}` : `Add ${label.toLowerCase().replace(/s$/, '')}`} fields={fields} submitLabel={form.edit ? 'Save changes' : 'Schedule'} onClose={() => setForm(null)}
        defaults={form.edit ? { branchId: form.edit.branchId, customerId: form.edit.customerId, service: form.edit.service, employeeId: form.edit.employeeId, date: form.edit.date, time: form.edit.time, price: form.edit.price } : { branchId: bopts.length === 1 ? bopts[0].value : '', customerId: '', service: '', employeeId: '', date: today, time: '11:00', price: '' }}
        onSubmit={async (v) => { const ok = await run(() => (form.edit ? appointmentService.update(form.edit.id, v) : appointmentService.create(v)), form.edit ? 'Updated' : 'Scheduled'); if (ok) setForm(null) }} />}
      <ConfirmDialog open={!!cancel} danger busy={busy} title="Cancel this booking?" confirmLabel="Cancel booking" onClose={() => setCancel(null)} text={`${cancel?.customerName}, ${cancel?.service} on ${cancel ? fmtDate(cancel.date) : ''}. This can’t be undone.`}
        onConfirm={async () => { const a = cancel; setCancel(null); await run(() => appointmentService.update(a.id, { status: 'Cancelled' }), 'Cancelled') }} />
    </div>
  )
}

function Calendar({ cal, setCal, rows, today, selected, onSelect, actions }) {
  const { y, m } = cal
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const by = {}; rows.forEach((a) => (by[a.date] ??= []).push(a))
  const shift = (n) => setCal(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const dayList = selected ? (by[selected] ?? []).sort((a, b) => a.time.localeCompare(b.time)) : []
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-1"><button aria-label="Previous month" onClick={() => shift(-1)} className="rounded-lg p-2 hover:bg-canvas"><ChevronLeft size={18} /></button><button onClick={() => { const d = new Date(); setCal({ y: d.getFullYear(), m: d.getMonth() }) }} className="btn-ghost !px-3 !py-1.5">Today</button><button aria-label="Next month" onClick={() => shift(1)} className="rounded-lg p-2 hover:bg-canvas"><ChevronRight size={18} /></button></div>
      </div>
      <div className="overflow-x-auto"><div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-line pb-2 text-center text-xs font-medium text-muted">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}</div>
        <div className="grid grid-cols-7">{cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[92px] border-b border-r border-line bg-canvas/50" />
          const k = key(y, m, d), list = by[k] ?? []
          return (
            <button key={i} onClick={() => onSelect(k)} aria-label={`${d} ${list.length} bookings`} aria-pressed={selected === k} className={`min-h-[92px] border-b border-r border-line p-1.5 text-left align-top hover:bg-canvas ${selected === k ? 'bg-primary/5 ring-2 ring-inset ring-primary' : ''}`}>
              <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs ${k === today ? 'bg-primary font-semibold text-white' : ''}`}>{d}</span>
              {list.slice(0, 2).map((a) => <span key={a.id} className={`mt-1 block truncate rounded px-1.5 py-0.5 text-[11px] ${a.status === 'Cancelled' ? 'bg-danger/10 text-danger line-through' : a.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{fmtTime(a.time)} {a.customerName.split(' ')[0]}</span>)}
              {list.length > 2 && <span className="mt-0.5 block text-[11px] text-muted">+{list.length - 2} more</span>}
            </button>
          )
        })}</div>
      </div></div>
      {selected && (
        <div className="mt-5 border-t border-line pt-4"><h3 className="font-semibold">{fmtDate(selected)}</h3>
          {!dayList.length ? <p className="mt-2 text-sm text-muted">No bookings this day.</p> : <ul className="mt-3 divide-y divide-line">{dayList.map((a) => <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><span><span className="font-medium">{fmtTime(a.time)}</span> · {a.customerName} · {a.service} <span className="text-muted">with {a.employeeName}</span></span><span className="flex items-center gap-2"><StatusBadge status={a.status} />{actions(a)}</span></li>)}</ul>}
        </div>)}
    </div>
  )
}
