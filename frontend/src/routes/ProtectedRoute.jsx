import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, homeFor } from '../stores/authStore'
import { hasPermission } from '../config/permissions'

// Frontend guard for demonstration only. The backend must enforce real authorization.
export default function ProtectedRoute({ children, roles, perm }) {
  const session = useAuthStore((s) => s.session)
  const loc = useLocation()
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if ((roles && !roles.includes(session.user.role)) || !hasPermission(session.user, perm)) return <Navigate to={homeFor(session)} replace />
  return children
}
