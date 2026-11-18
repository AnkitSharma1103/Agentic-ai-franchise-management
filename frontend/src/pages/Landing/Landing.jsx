import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts'
import { Menu, X, Building2, GitBranch, Bot, TrendingUp, Workflow, FileBarChart, LineChart, Users, Package, UserCog, Sparkles, BrainCircuit, Check, ArrowRight } from 'lucide-react'
import Logo from '../../components/common/Logo'
import { BUSINESS_TYPES } from '../../config/businessTypes'

const NAV = [['Features', '#features'], ['AI Agents', '#agents'], ['How It Works', '#how'], ['About', '#about']]
const trend = [['Jan', 14], ['Feb', 17], ['Mar', 16], ['Apr', 21], ['May', 24], ['Jun', 28]].map(([m, v]) => ({ m, v }))

const FEATURES = [
  { icon: Building2, title: 'Multi-business workspaces', text: 'Each business registers on its own and gets a private workspace with its own Business ID, users and data.' },
  { icon: GitBranch, title: 'Branch management', text: 'Add branches, assign managers and compare locations side by side. Managers only see the branches they’re assigned.' },
  { icon: Bot, title: 'AI business assistance', text: 'Ask plain questions about sales, customers or stock and a specialist agent answers with tables and recommendations.' },
  { icon: TrendingUp, title: 'Predictive analytics', text: 'Seven and thirty day sales forecasts, churn risk and demand predictions for every branch.' },
  { icon: Workflow, title: 'Business automation', text: 'Low-stock alerts, appointment reminders and at-risk customer nudges without manual checking.' },
  { icon: FileBarChart, title: 'Centralised reporting', text: 'Daily, monthly and branch reports you can preview, print or export to CSV.' },
]
const AGENTS = [
  { icon: LineChart, name: 'Sales Analytics', text: 'Summarises revenue and explains what changed.' },
  { icon: Users, name: 'Customer Intelligence', text: 'Finds at-risk and high-value customers.' },
  { icon: Package, name: 'Inventory Management', text: 'Flags low stock and suggests reorders.' },
  { icon: UserCog, name: 'Staff Performance', text: 'Tracks productivity and service quality.' },
  { icon: BrainCircuit, name: 'Business Analyst', text: 'Spots weak branches and proposes fixes.' },
  { icon: TrendingUp, name: 'Demand Forecasting', text: 'Predicts appointments and busy services.' },
]
const STEPS = [
  ['Register your business', 'Four steps: business, operations, owner details and review. You get a unique Business ID.'],
  ['Set up branches and team', 'Add branches, then invite managers and give each access to specific branches.'],
  ['Run operations', 'Track sales, customers, inventory, staff and appointments in one place.'],
  ['Ask, forecast, decide', 'Use AI agents and analytics to find what to fix and where to grow.'],
]
const BENEFITS = ['One login for every branch', 'Role-based access for owners and managers', 'Forecasts that show next month’s demand', 'Exports and printable reports', 'Built to connect to your own backend and ML models']

export default function Landing() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex" aria-label="Main">
            {NAV.map(([l, h]) => <a key={l} href={h} className="hover:text-ink">{l}</a>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="btn-ghost">Login</Link>
            <Link to="/register" className="btn-primary">Register your business</Link>
          </div>
          <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="border-t border-line px-5 py-4 md:hidden">
            {NAV.map(([l, h]) => <a key={l} href={h} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium">{l}</a>)}
            <div className="mt-3 flex gap-2"><Link to="/login" className="btn-outline flex-1">Login</Link><Link to="/register" className="btn-primary flex-1">Register</Link></div>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-canvas">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Manage Every Branch. Think Smarter. Grow Faster.</h1>
            <p className="mt-6 max-w-xl text-lg text-muted">An intelligent business management platform powered by specialized AI agents, predictive analytics, and centralized business intelligence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary !px-6 !py-3">Get Started</Link>
              <a href="#features" className="btn-outline !px-6 !py-3">Explore Platform</a>
            </div>
            <p className="mt-6 text-sm text-muted">Try the demo: Business ID <span className="font-semibold text-ink">FAI-DEMO01</span> on the <Link to="/login" className="font-medium text-primary hover:underline">login page</Link>.</p>
          </motion.div>
          <DashboardPreview />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl scroll-mt-16 px-5 py-20">
        <SectionHead title="Everything a multi-branch business needs" text="Built first for salons, designed to adapt to any small business." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: I, title, text }) => (
            <div key={title} className="card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><I size={20} /></span>
              <h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="agents" className="scroll-mt-16 bg-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHead dark title="Six specialist AI agents, one supervisor" text="Ask a question and the supervisor routes it to the agent best placed to answer." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map(({ icon: I, name, text }) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <I size={20} className="text-secondary" /><h3 className="mt-3 font-semibold">{name}</h3><p className="mt-1.5 text-sm text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <SectionHead title="Made for many kinds of business" text="Labels, categories and navigation adapt to your business type." />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(BUSINESS_TYPES).map(([k, t]) => {
            const I = t.icon
            return <div key={k} className="card flex flex-col items-center gap-3 p-5 text-center text-sm font-medium"><I size={26} className="text-primary" />{t.label}</div>
          })}
        </div>
      </section>

      <section id="how" className="scroll-mt-16 bg-canvas py-20">
        <div className="mx-auto max-w-5xl px-5">
          <SectionHead title="How it works" />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="card flex gap-4 p-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{i + 1}</span>
                <div><h3 className="font-semibold">{t}</h3><p className="mt-1.5 text-sm text-muted">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-7xl scroll-mt-16 gap-12 px-5 py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Why FranchiseAI</h2>
          <p className="mt-4 text-muted">Franchise owners juggle spreadsheets, chat groups and gut feeling. FranchiseAI brings branch data, people and predictions into one workspace, so decisions rest on what is actually happening.</p>
          <p className="mt-4 text-sm text-muted">This is a frontend demonstration. Data shown is simulated, and every integration point is ready for a real backend, AI agents and ML models.</p>
        </div>
        <ul className="space-y-3">
          {BENEFITS.map((b) => <li key={b} className="card flex items-center gap-3 px-5 py-4 text-sm font-medium"><Check size={18} className="shrink-0 text-success" />{b}</li>)}
        </ul>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-navy px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">Ready to see every branch in one place?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Register in four steps and get your Business ID right away.</p>
          <Link to="/register" className="btn-primary mt-8 !px-7 !py-3">Register your business<ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
          <Logo />
          <div className="flex gap-6">{NAV.map(([l, h]) => <a key={l} href={h} className="hover:text-ink">{l}</a>)}<Link to="/login" className="hover:text-ink">Login</Link></div>
          <p>© {new Date().getFullYear()} FranchiseAI</p>
        </div>
      </footer>
    </div>
  )
}

function SectionHead({ title, text, dark }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {text && <p className={`mt-3 ${dark ? 'text-white/70' : 'text-muted'}`}>{text}</p>}
    </div>
  )
}

function DashboardPreview() {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
      className="flex overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgba(23,23,47,.3)]" aria-label="Dashboard preview">
      <div className="hidden w-36 shrink-0 bg-navy p-4 text-xs text-white/70 sm:block">
        <p className="mb-4 font-bold text-white">FranchiseAI</p>
        {['Dashboard', 'Branches', 'Sales', 'Customers', 'AI Agents'].map((n, i) => <p key={n} className={`mb-1.5 rounded-lg px-2.5 py-2 ${i === 0 ? 'bg-primary text-white' : ''}`}>{n}</p>)}
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <p className="text-sm font-bold">Dashboard</p><p className="text-xs text-muted">Welcome back, Riya</p>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[['Revenue', '₹28,45,320', '+12.4%'], ['Customers', '12,480', '+8.2%'], ['Appointments', '1,932', '+10.5%']].map(([l, v, d]) => (
            <div key={l} className="rounded-xl border border-line p-2.5"><p className="text-[11px] text-muted">{l}</p><p className="mt-0.5 text-sm font-bold">{v}</p><p className="text-[11px] font-medium text-success">{d}</p></div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-line p-3">
          <p className="text-xs font-semibold">Revenue trend</p>
          <div className="h-32"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="m" interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#77778C' }} />
            <Area type="monotone" dataKey="v" stroke="#7C3AED" strokeWidth={2} fill="url(#g)" isAnimationActive={false} />
          </AreaChart></ResponsiveContainer></div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-xs"><Sparkles size={14} className="mt-0.5 shrink-0 text-primary" /><p>Revenue is up 12.4% this month. Modinagar is the best-performing branch.</p></div>
      </div>
    </motion.div>
  )
}
