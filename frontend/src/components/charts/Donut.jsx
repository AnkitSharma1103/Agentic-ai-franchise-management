import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export const COLORS = ['#7C3AED', '#A78BFA', '#C4B5FD', '#4C1D95', '#DDD6FE', '#6D28D9']

export default function Donut({ data, center, centerLabel = 'Total', format = (v) => v, unit = '' }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none">{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
            <Tooltip formatter={(v) => format(v) + unit} /></PieChart>
        </ResponsiveContainer>
        {center && <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-sm font-bold">{center}</p><p className="text-[11px] text-muted">{centerLabel}</p></div></div>}
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2.5 text-sm">
        {data.map((d, i) => <li key={d.name} className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="truncate">{d.name}</span></span><span className="font-semibold">{d.label ?? `${d.value}%`}</span></li>)}
      </ul>
    </div>
  )
}
