import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import Logo from '../common/Logo'
import { NAV_ITEMS } from '../../config/navigation'
import { useBusiness } from '../../context/BusinessContext'

export function useNavItems() {
  const { can, cfg, user } = useBusiness()
  const home = user.role === 'MANAGER' ? '/manager-dashboard' : '/dashboard'
  return NAV_ITEMS.filter((n) => can(n.perm)).map((n) => ({ ...n, to: n.to ?? home, label: n.typeLabel ? cfg.labels[n.typeLabel] : n.label }))
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  const { business, branches } = useBusiness()
  const items = useNavItems()
  const narrow = collapsed && !mobileOpen
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-navy/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-navy text-white transition-all duration-200 lg:static ${narrow ? 'lg:w-[76px]' : 'lg:w-64'} w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} aria-label="Sidebar">
        <div className="flex h-16 items-center justify-between px-4">
          {narrow ? <span className="mx-auto"><Logo dark to="/" iconOnly /></span> : <Logo dark />}
          <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary">
          {items.map(({ key, to, label, icon: Icon }) => (
            <NavLink key={key} to={to} end={key === 'dashboard' || key === 'branches'} onClick={onClose} title={narrow ? label : undefined}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${narrow ? 'justify-center' : ''} ${isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={19} className="shrink-0" />{!narrow && label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <div className={`rounded-xl bg-white/10 p-3 ${narrow ? 'text-center' : ''}`}>
            {narrow ? <span className="text-xs font-bold">{business.name[0]}</span> : (<><p className="truncate text-sm font-semibold">{business.name}</p><p className="text-xs text-white/60">{branches.length} {branches.length === 1 ? 'Branch' : 'Branches'}</p></>)}
          </div>
          <button onClick={onToggle} className="mt-2 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white lg:flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} />Collapse</>}
          </button>
        </div>
      </aside>
    </>
  )
}
