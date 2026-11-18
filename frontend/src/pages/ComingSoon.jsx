import { Link, useLocation } from 'react-router-dom'
import { Hammer, Users } from 'lucide-react'
import { PHASES } from '../config/navigation'
import { useBusiness } from '../context/BusinessContext'
import { usePageMeta } from '../components/layout/Topbar'

export default function ComingSoon() {
  const { pathname } = useLocation()
  const { title } = usePageMeta()
  const { isOwner } = useBusiness()
  const phase = PHASES['/' + pathname.split('/')[1]]
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <Hammer className="mx-auto text-primary" size={30} />
      <h2 className="mt-4 text-lg font-semibold">{title} arrives in Phase {phase}</h2>
      <p className="mt-2 text-sm text-muted">This section is on the build plan. Your layout, navigation and access rules for it are already in place.</p>
      {pathname === '/settings' && isOwner && <Link to="/settings/users" className="btn-primary mt-6"><Users size={16} />Manage team and managers</Link>}
    </div>
  )
}
