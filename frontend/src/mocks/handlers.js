import { loadDb, saveDb } from './db'
import { generateBusinessId, uid } from '../utils/id'
import { wait, fail, safeUser } from './util'
import { dashboardHandlers } from './handlers.dashboard'
import { userHandlers } from './handlers.users'
import { collectionHandlers } from './collections'

export const handlers = {
  'POST /auth/login': async ({ businessId, email, password }) => {
    await wait()
    const db = loadDb()
    const biz = db.businesses.find((b) => b.businessId === businessId.trim().toUpperCase())
    if (!biz) throw fail(404, 'No business found with this Business ID.')
    const user = db.users.find((u) => u.businessId === biz.businessId && u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user || user.password !== password) throw fail(401, 'Email or password is incorrect.')
    if (user.status === 'Suspended') throw fail(403, 'This account is suspended. Contact the business owner.')
    user.lastLogin = new Date().toISOString(); saveDb(db)
    const branches = db.branches.filter((b) => b.businessId === biz.businessId && (user.branchIds.includes('*') || user.branchIds.includes(b.id)))
    return { token: `mock.${uid('tok')}`, user: safeUser(user), business: biz, branches }
  },

  'POST /businesses/register': async (payload) => {
    await wait(900)
    const db = loadDb()
    const email = payload.owner.email.toLowerCase()
    if (db.users.some((u) => u.email.toLowerCase() === email && db.businesses.some((b) => b.businessId === u.businessId && b.name.toLowerCase() === payload.business.name.toLowerCase())))
      throw fail(409, 'A business with this name and owner email already exists.')
    const businessId = generateBusinessId((id) => db.businesses.some((b) => b.businessId === id))
    const ownerId = uid('usr')
    const business = { ...payload.business, businessId, ownerId, status: 'Active', createdAt: new Date().toISOString(), operations: payload.operations }
    const owner = { id: ownerId, businessId, name: payload.owner.fullName, email: payload.owner.email, phone: payload.owner.phone, password: payload.owner.password, role: 'OWNER', branchIds: ['*'], status: 'Active', lastLogin: null }
    const branchList = payload.operations.branches?.length ? payload.operations.branches : [{ name: payload.business.city || 'Main Branch', city: payload.business.city }]
    const branches = branchList.map((b) => ({ id: uid('br'), businessId, name: b.name, city: b.city, managerId: null, status: 'Active' }))
    db.businesses.push(business); db.users.push(owner); db.branches.push(...branches)
    saveDb(db)
    return { businessId, businessName: business.name, ownerName: owner.name, businessType: business.type, status: 'Active', registeredAt: business.createdAt }
  },

  'POST /auth/forgot-password': async ({ businessId, email }) => {
    await wait()
    const db = loadDb()
    const ok = db.users.some((u) => u.businessId === businessId.trim().toUpperCase() && u.email.toLowerCase() === email.trim().toLowerCase())
    // Same response either way so accounts cannot be probed.
    return { sent: true, simulated: true, found: ok }
  },

  ...dashboardHandlers,
  ...userHandlers,
  ...collectionHandlers,
}
