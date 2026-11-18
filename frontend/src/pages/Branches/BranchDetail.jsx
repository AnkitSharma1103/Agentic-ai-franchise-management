import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, UserRound, IndianRupee, Users, CalendarCheck, UserCog } from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useBusiness } from '../../context/BusinessContext'
import { useAsync } from '../../hooks/useAsync'
import { branchService } from '../../services/branchService'
import { KpiCard, ChartCard, StatusBadge, ErrorState, Skeleton, Delta, EmptyState } from '../../components/common/ui'
import Donut from '../../components/charts/Donut'
import { inr, lakh, num, fmtDate, fmtTime } from '../../utils/format'

const TABS = ['Overview', 'Sales', 'Employees', 'Customers', 'Appointments', 'Inventory', 'Analytics']
const axis = { fontSize: 12, fill: '#77778C' }

function Mini({ cols, rows, empty }) {
  if (!rows.length) return <EmptyState title={empty} />
  return <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-line text-left text-muted">{cols.map((c) => <th key={c.label} className="pb-3 pr-4 font-medium">{c.label}</th>)}</tr></thead>
    <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-line last:border-0">{cols.map((c) => <td key={c.label} className="py-3 pr-4">{c.render(r)}</td>)}</tr>)}</tbody></table></div>
}

export default function BranchDetail() {
  const { id } = useParams()
  const { cfg } = useBusiness()
  const { data: d, loading, error, reload } = useAsync(() => branchService.get(id), [id])
  const [tab, setTab] = useState('Overview')
  if (error) return <div className="space-y-4"><Link to="/branches" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><ArrowLeft size={15} />Back to branches</Link><ErrorState message={error} onRetry={reload} /></div>
  if (loading || !d) return <div className="mx-auto max-w-[1400px] space-y-5"><Skeleton className="h-24" /><Skeleton className="h-96" /></div>
  const { branch: b } = d
  const lowStock = d.inventory.filter((i) => i.status !== 'In stock')

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <Link to="/branches" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><ArrowLeft size={15} />Back to branches</Link>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div><div className="flex items-center gap-3"><h2 className="text-2xl font-bold tracking-tight">{b.name}</h2><StatusBadge status={b.status} /></div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted"><span className="flex items-center gap-1.5"><MapPin size={14} />{b.address || b.city}</span><span className="flex items-center gap-1.5"><UserRound size={14} />{b.manager ?? 'No manager'}</span>{b.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{b.phone}</span>}</div></div>
        <div className="text-right"><p className="text-sm text-muted">Revenue this month</p><p className="text-2xl font-bold">{inr(b.revenue)}</p><Delta value={b.growth} /></div>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'}`}>{t === 'Appointments' ? cfg.labels.appointments : t}</button>)}
      </div>

      {tab === 'Overview' && (<div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={IndianRupee} label="Revenue" value={inr(b.revenue)} delta={b.growth} /><KpiCard icon={Users} label="Customers" value={num(b.customers)} tone="success" />
          <KpiCard icon={CalendarCheck} label={cfg.labels.appointments} value={num(b.appointments)} tone="info" /><KpiCard icon={UserCog} label="Employees" value={d.employees.length} tone="warning" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title={`Upcoming ${cfg.labels.appointments.toLowerCase()}`}><Mini empty="Nothing scheduled" rows={d.appointments.slice(0, 5)} cols={[{ label: 'Customer', render: (a) => a.customerName }, { label: 'Service', render: (a) => a.service }, { label: 'When', render: (a) => `${fmtDate(a.date)}, ${fmtTime(a.time)}` }]} /></ChartCard>
          <ChartCard title="Stock needing attention"><Mini empty="All stocked up" rows={lowStock.slice(0, 5)} cols={[{ label: 'Product', render: (i) => i.name }, { label: 'Qty', render: (i) => `${i.quantity} / ${i.reorderLevel}` }, { label: 'Status', render: (i) => <StatusBadge status={i.status} /> }]} /></ChartCard>
        </div>
      </div>)}

      {tab === 'Sales' && <ChartCard title="Recent sales"><Mini empty="No sales yet" rows={d.sales} cols={[{ label: 'ID', render: (s) => s.txn }, { label: 'Customer', render: (s) => s.customerName }, { label: 'Item', render: (s) => s.item }, { label: 'Amount', render: (s) => inr(s.amount) }, { label: 'Payment', render: (s) => s.payment }, { label: 'Date', render: (s) => fmtDate(s.date) }, { label: 'Status', render: (s) => <StatusBadge status={s.status} /> }]} /></ChartCard>}
      {tab === 'Employees' && <ChartCard title={`${d.employees.length} employees`}><Mini empty="No employees" rows={d.employees} cols={[{ label: 'Name', render: (e) => <span className="font-medium">{e.name}</span> }, { label: 'ID', render: (e) => e.empCode }, { label: 'Position', render: (e) => e.position }, { label: 'Performance', render: (e) => `${e.performance}%` }, { label: 'Status', render: (e) => <StatusBadge status={e.status} /> }]} /></ChartCard>}
      {tab === 'Customers' && <ChartCard title="Top customers by spend"><Mini empty="No customers" rows={d.customers} cols={[{ label: 'Name', render: (c) => <span className="font-medium">{c.name}</span> }, { label: 'Segment', render: (c) => <StatusBadge status={c.segment} /> }, { label: 'Visits', render: (c) => c.visits }, { label: 'Total spent', render: (c) => inr(c.totalSpend) }, { label: 'Last visit', render: (c) => fmtDate(c.lastVisit) }]} /></ChartCard>}
      {tab === 'Appointments' && <ChartCard title={`Upcoming ${cfg.labels.appointments.toLowerCase()}`}><Mini empty="Nothing scheduled" rows={d.appointments} cols={[{ label: 'Customer', render: (a) => a.customerName }, { label: 'Service', render: (a) => a.service }, { label: 'Employee', render: (a) => a.employeeName }, { label: 'When', render: (a) => `${fmtDate(a.date)}, ${fmtTime(a.time)}` }, { label: 'Price', render: (a) => inr(a.price) }]} /></ChartCard>}
      {tab === 'Inventory' && <ChartCard title={`${d.inventory.length} products`}><Mini empty="No products" rows={d.inventory} cols={[{ label: 'Product', render: (i) => i.name }, { label: 'Category', render: (i) => i.category }, { label: 'Quantity', render: (i) => i.quantity }, { label: 'Reorder at', render: (i) => i.reorderLevel }, { label: 'Status', render: (i) => <StatusBadge status={i.status} /> }]} /></ChartCard>}

      {tab === 'Analytics' && (<div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue, last 6 months" className="lg:col-span-2"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs><linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} /><YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={lakh} width={60} /><Tooltip formatter={(v) => [inr(v), 'Revenue']} /><Area dataKey="revenue" type="monotone" stroke="#7C3AED" strokeWidth={2.5} fill="url(#bd)" /></AreaChart></ResponsiveContainer></div></ChartCard>
        <ChartCard title="Sales by category">{d.serviceMix.length ? <Donut data={d.serviceMix.map((s) => ({ name: s.name, value: s.pct }))} center="100%" centerLabel="of sales" /> : <EmptyState title="No sales yet" />}</ChartCard>
        <ChartCard title="Employee performance" className="lg:col-span-3"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.employees.slice(0, 12)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="name" tick={{ ...axis, fontSize: 11 }} tickLine={false} axisLine={false} interval={0} tickFormatter={(n) => n.split(' ')[0]} /><YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => [`${v}%`, 'Performance']} /><Bar dataKey="performance" fill="#7C3AED" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></ChartCard>
      </div>)}
    </div>
  )
}
