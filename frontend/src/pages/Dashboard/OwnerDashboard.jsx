import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { IndianRupee, GitBranch, Users, UserCog, CalendarCheck, Sparkles, AlertTriangle, Lightbulb, Activity } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import { useAsync } from '../../hooks/useAsync'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, ChartCard, Skeleton, ErrorState, StatusBadge, Delta, EmptyState } from '../../components/common/ui'
import Donut from '../../components/charts/Donut'
import { inr, lakh, num } from '../../utils/format'

const axis = { fontSize: 12, fill: '#77778C' }
const RANGES = [[3, 'Last 3 months'], [6, 'Last 6 months'], [12, 'Last 12 months']]

export default function OwnerDashboard() {
  const { user, cfg } = useBusiness()
  const [months, setMonths] = useState(6), [branchId, setBranchId] = useState('all')
  const { data: d, loading, error, reload } = useAsync(() => dashboardService.getOwner({ months, branchId }), [months, branchId])

  if (error) return <ErrorState message={error} onRetry={reload} />
  const k = d?.kpis
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}</h2><p className="text-sm text-muted">Here’s how {d?.business.name ?? 'your business'} is doing this month.</p></div>
        <div className="flex gap-2">
          <select aria-label="Date range" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="input !w-auto !py-2">{RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select aria-label="Branch filter" value={branchId} onChange={(e) => setBranchId(e.target.value)} className="input !w-auto !py-2"><option value="all">All branches</option>{d?.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </div>
      </div>

      {loading && !d ? <Skeletons /> : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <KpiCard icon={IndianRupee} label="Total Revenue" value={inr(k.revenue)} delta={k.revenueGrowth} />
            <KpiCard icon={GitBranch} label="Total Branches" value={k.branches} tone="info" />
            <KpiCard icon={Users} label="Total Customers" value={num(k.customers)} delta={k.customersGrowth} tone="success" />
            <KpiCard icon={UserCog} label="Total Employees" value={num(k.employees)} tone="warning" />
            <KpiCard icon={CalendarCheck} label={`Total ${cfg.labels.appointments}`} value={num(k.appointments)} delta={k.appointmentsGrowth} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <ChartCard title="Monthly revenue trend" className="lg:col-span-2">
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} /><YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={lakh} width={60} />
                <Tooltip formatter={(v) => [inr(v), 'Revenue']} /><Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart></ResponsiveContainer></div>
            </ChartCard>
            <ChartCard title="Branch-wise revenue">
              <Donut data={d.branchShare.map((b) => ({ name: b.name, value: b.revenue, label: `${b.pct}%` }))} center={lakh(k.revenue)} format={inr} />
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <ChartCard title="Sales comparison" className="lg:col-span-2">
              <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.comparison} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={6}>
                <CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} /><YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={lakh} width={60} />
                <Tooltip formatter={(v) => inr(v)} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="lastMonth" name="Last month" fill="#DDD6FE" radius={[6, 6, 0, 0]} /><Bar dataKey="thisMonth" name="This month" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart></ResponsiveContainer></div>
            </ChartCard>
            <ChartCard title={`${cfg.labels.catalog} categories`}><Donut data={d.services.map((s) => ({ name: s.name, value: s.pct }))} center="100%" centerLabel="of sales" /></ChartCard>
          </div>

          <ChartCard title="Branch performance" className="mt-6">
            {d.branchTable.length ? (
              <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b border-line text-left text-muted">{['Branch', 'Revenue', 'Customers', cfg.labels.appointments, 'Growth', 'Status'].map((h) => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}</tr></thead>
                <tbody>{d.branchTable.map((b) => (
                  <tr key={b.id} className="border-b border-line last:border-0"><td className="py-3.5 pr-4"><p className="font-semibold">{b.name}</p><p className="text-xs text-muted">{b.location}</p></td><td className="pr-4 font-medium">{inr(b.revenue)}</td><td className="pr-4">{num(b.customers)}</td><td className="pr-4">{num(b.appointments)}</td><td className="pr-4"><Delta value={b.growth} /></td><td><StatusBadge status={b.status} /></td></tr>
                ))}</tbody>
              </table></div>
            ) : <EmptyState title="No branches yet" text="Add a branch to see performance." />}
          </ChartCard>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3"><Sparkles className="mt-0.5 shrink-0 text-primary" size={20} /><div><p className="font-semibold text-primary">AI Insight</p><p className="mt-1 text-sm">{d.insight}</p></div></div>
            <Link to="/ai-agents" className="btn-primary shrink-0">Ask AI Agent</Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <ChartCard title="Recent activity"><List icon={Activity} items={d.activity.map((a) => ({ text: a.text, meta: a.time }))} /></ChartCard>
            <ChartCard title="Business alerts"><List icon={AlertTriangle} tone="text-warning" items={d.alerts.map((a) => ({ text: a.text }))} /></ChartCard>
            <ChartCard title="AI recommendations"><List icon={Lightbulb} tone="text-primary" items={d.recommendations.map((t) => ({ text: t }))} /></ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}

export function List({ icon: Icon, items, tone = 'text-muted' }) {
  if (!items.length) return <EmptyState title="Nothing to show yet" />
  return <ul className="space-y-3.5">{items.map((it, i) => <li key={i} className="flex gap-3 text-sm"><Icon size={16} className={`mt-0.5 shrink-0 ${tone}`} /><div className="min-w-0"><p>{it.text}</p>{it.meta && <p className="text-xs text-muted">{it.meta}</p>}</div></li>)}</ul>
}

function Skeletons() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-32" />)}</div><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div><Skeleton className="h-64" /></div>
}
