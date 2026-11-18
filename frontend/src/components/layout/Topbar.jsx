import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, ChevronDown, LogOut, Settings, Building2 } from 'lucide-react'
import { useBusiness } from '../../context/BusinessContext'
import { useAuthStore } from '../../stores/authStore'
import { useNavItems } from './Sidebar'
import { initials } from '../../utils/format'

function useOutside(ref, onOut) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onOut()
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [ref, onOut])
}

export function usePageMeta() {
  const { pathname } = useLocation()
  const items = useNavItems()
  const { isOwner } = useBusiness()
  const match = [...items].sort((a, b) => b.to.length - a.to.length).find((n) => pathname === n.to || pathname.startsWith(n.to + '/'))
  const sub = pathname === '/settings/users' ? 'Team' : null
  const title = sub ?? match?.label ?? 'Dashboard'
  const crumbs = [{ label: 'Home', to: isOwner ? '/dashboard' : '/manager-dashboard' }, ...(match && match.key !== 'dashboard' ? [{ label: match.label, to: match.to }] : []), ...(sub ? [{ label: sub }] : [])]
  return { title, crumbs }
}

export default function Topbar({ onMenu }) {
  const { user, business, role, isOwner } = useBusiness()
  const logout = useAuthStore((s) => s.logout)
  const nav = useNavigate()
  const items = useNavItems()
  const { title, crumbs } = usePageMeta()
  const [q, setQ] = useState(''), [menu, setMenu] = useState(false), [focus, setFocus] = useState(false)
  const userRef = useRef(null), searchRef = useRef(null)
  useOutside(userRef, () => setMenu(false)); useOutside(searchRef, () => setFocus(false))

  const pool = [...items, ...(isOwner ? [{ key: 'team', label: 'Team & managers', to: '/settings/users', icon: Settings }] : [])]
  const results = q.trim() ? pool.filter((n) => n.label.toLowerCase().includes(q.trim().toLowerCase())) : []
  const go = (to) => { nav(to); setQ(''); setFocus(false) }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button className="rounded-lg p-2 text-muted hover:bg-canvas lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          <nav aria-label="Breadcrumb" className="hidden text-xs text-muted sm:block">
            {crumbs.map((c, i) => <span key={c.label}>{i > 0 && ' / '}{c.to && i < crumbs.length - 1 ? <Link to={c.to} className="hover:text-primary">{c.label}</Link> : c.label}</span>)}
          </nav>
        </div>

        <div ref={searchRef} className="relative ml-auto hidden w-64 md:block lg:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0].to)}
            placeholder="Search pages…" aria-label="Search pages" className="input !rounded-xl !bg-canvas !py-2 !pl-9" />
          {focus && q.trim() && (
            <ul className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-card">
              {results.length ? results.map((r) => <li key={r.to}><button onClick={() => go(r.to)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-canvas"><r.icon size={15} className="text-muted" />{r.label}</button></li>) : <li className="px-3 py-2 text-sm text-muted">No matching pages</li>}
            </ul>
          )}
        </div>

        <span className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs text-muted xl:flex" title="Current business"><Building2 size={14} />{business.name}</span>
        <Link to="/notifications" aria-label="Notifications" className="relative rounded-lg p-2 text-muted hover:bg-canvas"><Bell size={20} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" /></Link>

        <div ref={userRef} className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} className="flex items-center gap-2.5 rounded-xl p-1 pr-2 hover:bg-canvas">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(user.name)}</span>
            <span className="hidden text-left sm:block"><span className="block text-sm font-semibold leading-tight">{user.name}</span><span className="block text-xs capitalize text-muted">{role.toLowerCase()}</span></span>
            <ChevronDown size={15} className="text-muted" />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-line bg-white p-1.5 shadow-card">
              <div className="border-b border-line px-3 py-2.5"><p className="truncate text-sm font-semibold">{user.email}</p><p className="mt-0.5 text-xs text-muted">{business.name} · {business.businessId}</p><span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{role === 'OWNER' ? 'Owner' : 'Manager'}</span></div>
              <Link role="menuitem" to="/settings" onClick={() => setMenu(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-canvas"><Settings size={16} />Settings</Link>
              <button role="menuitem" onClick={() => { logout(); nav('/login', { replace: true }) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-canvas"><LogOut size={16} />Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
