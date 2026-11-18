import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { BusinessProvider } from '../../context/BusinessContext'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('fai_sidebar') === '1')
  const [mobile, setMobile] = useState(false)
  const toggle = () => setCollapsed((c) => { localStorage.setItem('fai_sidebar', c ? '0' : '1'); return !c })
  return (
    <BusinessProvider>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar collapsed={collapsed} onToggle={toggle} mobileOpen={mobile} onClose={() => setMobile(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobile(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6"><Outlet /></main>
        </div>
      </div>
    </BusinessProvider>
  )
}
