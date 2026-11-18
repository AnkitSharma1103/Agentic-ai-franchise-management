import { useMemo, useState } from 'react'
import { IndianRupee, Receipt, TrendingUp, Plus, Download, Undo2, ShoppingBag } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBusiness } from '../../context/BusinessContext'
import { useAsync } from '../../hooks/useAsync'
import { useAction, useBranchOptions } from '../../hooks/useAction'
import { salesService } from '../../services/salesService'
import { customerService } from '../../services/customerService'
import { PageHeader, KpiCard, ChartCard, SearchBox, Select, StatusBadge, IconBtn, ErrorState } from '../../components/common/ui'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { CATALOG, PAYMENTS } from '../../config/catalog'
import { exportCsv } from '../../utils/csv'
import { inr, lakh, num, fmtDate } from '../../utils/format'

const axis = { fontSize: 12, fill: '#77778C' }
const EMPTY = { q: '', branchId: '', status: '', payment: '', from: '', to: '' }

export default function Sales() {
  const { isOwner, business } = useBusiness()
  const { data, loading, error, reload } = useAsync(salesService.list)
  const custs = useAsync(() => (isOwner ? customerService.list() : Promise.resolve([])), [isOwner])
  const branches = useBranchOptions()
  const { run, busy } = useAction(reload)
  const [f, setF] = useState(EMPTY)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const [adding, setAdding] = useState(false), [refund, setRefund] = useState(null)

  const rows = data ?? []
  const filtered = useMemo(() => rows.filter((s) => {
    const day = s.date.slice(0, 10)
    return (!f.branchId || s.branchId === f.branchId) && (!f.status || s.status === f.status) && (!f.payment || s.payment === f.payment) && (!f.from || day >= f.from) && (!f.to || day <= f.to)
      && `${s.txn} ${s.customerName} ${s.item}`.toLowerCase().includes(f.q.toLowerCase())
  }), [rows, f])
  if (error) return <ErrorState message={error} onRetry={reload} />

  const done = filtered.filter((s) => s.status === 'Completed'), revenue = done.reduce((t, s) => t + s.amount, 0)
  const byDay = {}; done.forEach((s) => { const d = s.date.slice(0, 10); byDay[d] = (byDay[d] ?? 0) + s.amount })
  const trend = Object.keys(byDay).sort().slice(-30).map((d) => ({ day: new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: byDay[d] }))
  const byBranch = {}; done.forEach((s) => { byBranch[s.branchName] = (byBranch[s.branchName] ?? 0) + s.amount })
  const compare = Object.entries(byBranch).map(([name, revenue]) => ({ name, revenue }))

  const catalog = CATALOG[business.type] ?? CATALOG.other
  const fields = [
    { name: 'branchId', label: 'Branch', type: 'select', options: (branches.data ?? []).map((b) => ({ value: b.id, label: b.name })) },
    { name: 'customerId', label: 'Customer', type: 'select', optional: true, placeholder: 'Walk-in customer', options: (v) => (custs.data ?? []).filter((c) => c.branchId === v.branchId).map((c) => ({ value: c.id, label: c.name })) },
    { name: 'item', label: 'Service / product', type: 'select', options: catalog.map((c) => ({ value: c.name, label: `${c.name} (${inr(c.price)})` })), onPick: (v) => ({ amount: catalog.find((c) => c.name === v)?.price ?? '' }) },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1 },
    { name: 'payment', label: 'Payment method', type: 'select', options: PAYMENTS.map((p) => ({ value: p, label: p })) },
  ]
  const cols = [
    { key: 'txn', label: 'Transaction ID', sortable: true, render: (s) => <span className="font-mono text-xs">{s.txn}</span> },
    { key: 'customerName', label: 'Customer', sortable: true }, { key: 'branchName', label: 'Branch', sortable: true }, { key: 'item', label: 'Service / product', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (s) => <span className="font-medium">{inr(s.amount)}</span> }, { key: 'payment', label: 'Payment', sortable: true },
    { key: 'date', label: 'Date', sortable: true, render: (s) => fmtDate(s.date) }, { key: 'status', label: 'Status', sortable: true, render: (s) => <StatusBadge status={s.status} /> },
    ...(isOwner ? [{ key: 'a', label: '', render: (s) => s.status === 'Completed' && <IconBtn icon={Undo2} label={`Refund ${s.txn}`} onClick={() => setRefund(s)} /> }] : []),
  ]
  const csvCols = [['txn', 'Transaction ID'], ['customerName', 'Customer'], ['branchName', 'Branch'], ['item', 'Service/Product'], ['amount', 'Amount (INR)'], ['payment', 'Payment Method'], ['date', 'Date', (s) => s.date.slice(0, 10)], ['status', 'Status']].map(([key, label, csv]) => ({ key, label, csv }))
  const multi = (branches.data?.length ?? 0) > 1

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader title="Sales" text="Revenue, transactions and payment activity.">
        <button className="btn-outline" disabled={!filtered.length} onClick={() => exportCsv('sales.csv', csvCols, filtered)}><Download size={16} />Export CSV</button>
        {isOwner && <button className="btn-primary" disabled={!branches.data} onClick={() => setAdding(true)}><Plus size={16} />Add sale</button>}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={IndianRupee} label="Revenue" value={inr(revenue)} /><KpiCard icon={ShoppingBag} label="Completed sales" value={num(done.length)} tone="success" />
        <KpiCard icon={TrendingUp} label="Avg transaction value" value={inr(done.length ? revenue / done.length : 0)} tone="info" /><KpiCard icon={Receipt} label="Total transactions" value={num(filtered.length)} tone="warning" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue trend" className="lg:col-span-2"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="day" tick={axis} tickLine={false} axisLine={false} minTickGap={24} /><YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 100000 ? lakh(v) : `₹${Math.round(v / 1000)}k`)} width={56} /><Tooltip formatter={(v) => [inr(v), 'Revenue']} /><Area dataKey="revenue" type="monotone" stroke="#7C3AED" strokeWidth={2.5} fill="url(#sg)" /></AreaChart></ResponsiveContainer></div></ChartCard>
        <ChartCard title="Branch comparison"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={compare} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} /><YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={lakh} width={56} /><Tooltip formatter={(v) => [inr(v), 'Revenue']} /><Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></ChartCard>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={f.q} onChange={set('q')} placeholder="Search ID, customer or item" />
        {multi && <Select label="Branch filter" value={f.branchId} onChange={set('branchId')} all="All branches" options={branches.data.map((b) => ({ value: b.id, label: b.name }))} />}
        <Select label="Status filter" value={f.status} onChange={set('status')} all="All statuses" options={['Completed', 'Pending', 'Refunded']} />
        <Select label="Payment filter" value={f.payment} onChange={set('payment')} all="All payments" options={PAYMENTS} />
        <label className="flex items-center gap-2 text-sm text-muted">From<input type="date" aria-label="From date" value={f.from} onChange={(e) => set('from')(e.target.value)} className="input !w-auto" /></label>
        <label className="flex items-center gap-2 text-sm text-muted">To<input type="date" aria-label="To date" value={f.to} onChange={(e) => set('to')(e.target.value)} className="input !w-auto" /></label>
        {Object.values(f).some(Boolean) && <button className="btn-ghost" onClick={() => setF(EMPTY)}>Clear</button>}
      </div>
      <DataTable columns={cols} rows={filtered} loading={loading} minWidth={1000} icon={Receipt} emptyTitle="No sales match" emptyText="Adjust the filters or add a sale." initialSort={{ key: 'date', dir: 'desc' }} />

      {adding && <FormModal title="Add sale" fields={fields} defaults={{ branchId: branches.data?.length === 1 ? branches.data[0].id : '', customerId: '', item: '', amount: '', payment: 'UPI' }} submitLabel="Record sale" onClose={() => setAdding(false)}
        onSubmit={async (v) => { const category = catalog.find((c) => c.name === v.item)?.category; const ok = await run(() => salesService.create({ ...v, category, customerId: v.customerId ?? null }), 'Sale recorded'); if (ok) setAdding(false) }} />}
      <ConfirmDialog open={!!refund} danger busy={busy} title="Refund this sale?" confirmLabel="Refund" onClose={() => setRefund(null)} text={`${refund?.txn} (${refund ? inr(refund.amount) : ''}) will be marked Refunded and removed from revenue.`}
        onConfirm={async () => { const s = refund; setRefund(null); await run(() => salesService.update(s.id, { status: 'Refunded' }), 'Sale refunded') }} />
    </div>
  )
}
