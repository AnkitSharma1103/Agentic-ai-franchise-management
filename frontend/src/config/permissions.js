// Frontend-only permissions for demonstration. Real authorization is enforced by the backend later.
export const PERMISSIONS = [
  { key: 'branches.view', label: 'View assigned branches' },
  { key: 'sales.view', label: 'View branch sales' },
  { key: 'appointments.manage', label: 'Manage appointments' },
  { key: 'customers.manage', label: 'Manage customers' },
  { key: 'inventory.manage', label: 'Manage inventory' },
  { key: 'employees.view', label: 'View employees' },
  { key: 'analytics.view', label: 'Branch analytics' },
  { key: 'ai.use', label: 'Use AI agents' },
  { key: 'reports.generate', label: 'Generate branch reports' },
  { key: 'users.invite', label: 'Invite users' },
]
export const MANAGER_DEFAULT = PERMISSIONS.map((p) => p.key).filter((k) => k !== 'users.invite')

export function hasPermission(user, perm) {
  if (!perm || user?.role === 'OWNER' || user?.role === 'COMPANY_OWNER' || user?.role === 'FRANCHISE_OWNER') return true
  return (user?.permissions ?? MANAGER_DEFAULT).includes(perm)
}
