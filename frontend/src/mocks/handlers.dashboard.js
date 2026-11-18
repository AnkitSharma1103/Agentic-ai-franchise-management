import { loadDb } from './db'
import { wait, fail, requireUser } from './util'
import { ownerDashboard, managerDashboard } from './dashboardData'

export const dashboardHandlers = {
  'GET /dashboard/owner': async (_b, { query } = {}) => {
    await wait(400)
    const db = loadDb(), u = requireUser(db)
    if (u.role !== 'OWNER') throw fail(403, 'Only owners can view business-wide data.')
    return ownerDashboard(db, u.businessId, { months: Number(query?.months) || 6, branchId: query?.branchId })
  },
  'GET /dashboard/manager': async (_b, { query } = {}) => {
    await wait(400)
    const db = loadDb(), u = requireUser(db)
    if (u.role !== 'MANAGER') throw fail(403, 'This dashboard is for managers.')
    if (query?.branchId && !u.branchIds.includes(query.branchId)) throw fail(403, 'You are not assigned to this branch.')
    return managerDashboard(db, u, { branchId: query?.branchId })
  },
}
