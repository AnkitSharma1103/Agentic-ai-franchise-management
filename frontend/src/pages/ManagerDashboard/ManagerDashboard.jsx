import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { IndianRupee, Users, CalendarCheck, UserCog, Sparkles, Activity, Star, PackageX } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import { useAsync } from '../../hooks/useAsync'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, ChartCard, Skeleton, ErrorState, EmptyState } from '../../components/common/ui'
import Donut from '../../components/charts/Donut'
import { List } from '../Dashboard/OwnerDashboard'
import { inr, lakh, num } from '../../utils/format'

const axis = { fontSize: 12, fill: '#77778C' }

export default function ManagerDashboard() {
  const { user, cfg } = useBusiness()
  const [branchId, setBranchId] = useState(undefined)
  const { data: d, loading, error, reload } = useAsync(() => dashboardService.getManager({ branchId }), [branchId])

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (d && !d.branch) return <div className="card mx-auto max-w-md"><EmptyState title="No branch assigned yet" text="Ask the business owner to assign you to a branch." /></div>
  const k = d?.kpis, ap = d?.appointmentOverview
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}</h2><p className="text-sm text-muted">{d ? `Showing ${d.branch.name}` : 'Loading your branch…'}{d?.branches.length > 1 && ' (your assigned branches)'}</p></div>
        {d?.branches.length > 1 && <select aria-label="Branch" value={d.branch.id} onChange={(e) => setBranchId(e.target.value)} className="input !w-auto !py-2">{d.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      </div>

      {loading && !d ? (
        <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}</div><Skeleton className="h-80" /></div>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={IndianRupee} label="Branch Revenue" value={inr(k.revenue)} delta={k.revenueGrowth} />
            <KpiCard icon={Users} label="Branch Customers" value={num(k.customers)} tone="success" />
            <KpiCard icon={CalendarCheck} label={cfg.labels.appointments} value={num(k.appointments)} tone="info" />
            <KpiCard icon={UserCog} label="Employees" value={num(k.employees)} tone="warning" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <ChartCard title="Branch sales, last 14 days" className="lg:col-span-2">
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.dailySales} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs><linearGradient id="ds" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#E8E8F0" /><XAxis dataKey="day" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} /><YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)} width={56} />
                <Tooltip formatter={(v) => [inr(v), 'Sales']} /><Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#ds)" />
              </AreaChart></ResponsiveContainer></div>
            </ChartCard>
            <ChartCard title={`${cfg.labels.appointments} today`}>
              <Donut center={ap.total} centerLabel="today" data={[{ name: 'Completed', value: ap.completed, label: ap.completed }, { name: 'Upcoming', value: ap.upcoming, label: ap.upcoming }, { name: 'Cancelled', value: ap.cancelled, label: ap.cancelled }]} />
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Inventory alerts">
              <ul className="space-y-4">{d.inventoryAlerts.map((i) => (
                <li key={i.product}><div className="flex justify-between text-sm"><span className="flex items-center gap-2 font-medium"><PackageX size={15} className="text-danger" />{i.product}</span><span className="text-muted">Stock {i.stock} / reorder {i.reorder}</span></div>
                  <div className="mt-2 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-danger" style={{ width: `${Math.min(100, (i.stock / i.reorder) * 100)}%` }} /></div></li>
              ))}</ul>
            </ChartCard>
            <ChartCard title="Employee performance">
              <ul className="divide-y divide-line">{d.employeePerformance.map((e) => (
                <li key={e.name} className="flex items-center justify-between py-3 text-sm"><div><p className="font-medium">{e.name}</p><p className="text-xs text-muted">{e.services} services this month</p></div><span className="inline-flex items-center gap-1 font-semibold"><Star size={14} className="fill-warning text-warning" />{e.rating.toFixed(1)}</span></li>
              ))}</ul>
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-primary/10 p-5"><p className="flex items-center gap-2 font-semibold text-primary"><Sparkles size={18} />AI insights for {d.branch.name}</p><ul className="mt-3 space-y-2.5 text-sm">{d.insights.map((t) => <li key={t}>{t}</li>)}</ul></div>
            <ChartCard title="Recent activity"><List icon={Activity} items={d.activity.map((a) => ({ text: a.text, meta: a.time }))} /></ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}
