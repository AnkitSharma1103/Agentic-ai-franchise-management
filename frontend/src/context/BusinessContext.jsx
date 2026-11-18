import { createContext, useContext, useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'
import { BUSINESS_TYPES } from '../config/businessTypes'
import { hasPermission, MANAGER_DEFAULT } from '../config/permissions'

const Ctx = createContext(null)

// Single source for "who is logged in, for which business, with which access".
export function BusinessProvider({ children }) {
  const session = useAuthStore((s) => s.session)
  const value = useMemo(() => {
    const user = { ...session.user, permissions: session.user.role === 'MANAGER' ? session.user.permissions ?? MANAGER_DEFAULT : undefined }
    return {
      business: session.business, user, role: user.role, branches: session.branches, isOwner: user.role === 'OWNER',
      cfg: BUSINESS_TYPES[session.business.type] ?? BUSINESS_TYPES.other, can: (perm) => hasPermission(user, perm),
    }
  }, [session])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useBusiness = () => useContext(Ctx)
