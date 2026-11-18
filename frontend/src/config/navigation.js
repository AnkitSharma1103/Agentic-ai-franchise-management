import { LayoutDashboard, GitBranch, BarChart3, Users, Package, UserCog, CalendarDays, Bot, LineChart, FileText, Bell, Settings } from 'lucide-react'

// `label` may come from the business-type config (e.g. Appointments → Orders for restaurants).
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'branches', label: 'Branches', icon: GitBranch, to: '/branches', perm: 'branches.view' },
  { key: 'sales', label: 'Sales', icon: BarChart3, to: '/sales', perm: 'sales.view' },
  { key: 'customers', label: 'Customers', icon: Users, to: '/customers', perm: 'customers.manage' },
  { key: 'inventory', label: 'Inventory', icon: Package, to: '/inventory', perm: 'inventory.manage' },
  { key: 'employees', label: 'Employees', icon: UserCog, to: '/employees', perm: 'employees.view' },
  { key: 'appointments', label: 'Appointments', icon: CalendarDays, to: '/appointments', perm: 'appointments.manage', typeLabel: 'appointments' },
  { key: 'ai', label: 'AI Agents', icon: Bot, to: '/ai-agents', perm: 'ai.use' },
  { key: 'analytics', label: 'Analytics', icon: LineChart, to: '/analytics', perm: 'analytics.view' },
  { key: 'reports', label: 'Reports', icon: FileText, to: '/reports', perm: 'reports.generate' },
  { key: 'notifications', label: 'Notifications', icon: Bell, to: '/notifications' },
  { key: 'settings', label: 'Settings', icon: Settings, to: '/settings' },
]
export const PHASES = { '/ai-agents': 4, '/analytics': 4, '/reports': 5, '/notifications': 5, '/settings': 5 }
