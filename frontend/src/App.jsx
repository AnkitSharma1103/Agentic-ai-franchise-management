import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing/Landing'
import AIAgents from './pages/AIAgents/AiAgents'
import Register from './pages/Register/Register'
import RegistrationSuccess from './pages/RegistrationSuccess/RegistrationSuccess'
import Login from './pages/Login/Login'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import InviteAccept from './pages/InviteAccept/InviteAccept'
import OwnerDashboard from './pages/Dashboard/OwnerDashboard'
import ManagerDashboard from './pages/ManagerDashboard/ManagerDashboard'
import UsersPage from './pages/Settings/UsersPage'
import ComingSoon from './pages/ComingSoon'
import Branches from './pages/Branches/Branches'
import BranchDetail from './pages/Branches/BranchDetail'
import Sales from './pages/Sales/Sales'
import Customers from './pages/Customers/Customers'
import Inventory from './pages/Inventory/Inventory'
import Employees from './pages/Employees/Employees'
import Appointments from './pages/Appointments/Appointments'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import { NAV_ITEMS } from './config/navigation'

const BUILT = { '/branches': Branches, '/sales': Sales, '/customers': Customers, '/inventory': Inventory, '/employees': Employees, '/appointments': Appointments, '/ai-agents': AIAgents }
const PLACEHOLDERS = NAV_ITEMS.filter((n) => n.to && !BUILT[n.to])

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/registration-success" element={<RegistrationSuccess />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/invite/:token" element={<InviteAccept />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ProtectedRoute roles={['OWNER', 'COMPANY_OWNER', 'FRANCHISE_OWNER']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/manager-dashboard" element={<ProtectedRoute roles={['MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/settings/users" element={<ProtectedRoute roles={['OWNER']}><UsersPage /></ProtectedRoute>} />
        {NAV_ITEMS.filter((n) => BUILT[n.to]).map((n) => { const Page = BUILT[n.to]; return <Route key={n.key} path={n.to} element={<ProtectedRoute perm={n.perm}><Page /></ProtectedRoute>} /> })}
        <Route path="/branches/:id" element={<ProtectedRoute perm="branches.view"><BranchDetail /></ProtectedRoute>} />
        {PLACEHOLDERS.map((n) => <Route key={n.key} path={`${n.to}/*`} element={<ProtectedRoute perm={n.perm}><ComingSoon /></ProtectedRoute>} />)}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
