import Logo from '../common/Logo'
import { ShieldCheck, LineChart, Bot } from 'lucide-react'

const points = [
  { icon: Bot, text: 'Six specialised AI agents for sales, customers, stock and staff' },
  { icon: LineChart, text: 'One view across every branch, with forecasts and churn alerts' },
  { icon: ShieldCheck, text: 'Separate owner and manager access, scoped to assigned branches' },
]
export default function AuthShell({ title, subtitle, children, wide = false }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="relative hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Logo dark />
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Every branch, one workspace.</h2>
          <ul className="mt-8 space-y-5">
            {points.map(({ icon: I, text }) => (
              <li key={text} className="flex gap-3 text-sm text-white/75"><I size={18} className="mt-0.5 shrink-0 text-secondary" />{text}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} FranchiseAI</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
