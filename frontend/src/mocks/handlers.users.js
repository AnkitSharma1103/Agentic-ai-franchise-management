import { loadDb, saveDb } from './db'
import { uid } from '../utils/id'
import { wait, fail, safeUser, requireOwner } from './util'
import { MANAGER_DEFAULT } from '../config/permissions'

const token = () => uid('inv') + uid('t')
// Keep each branch's managerId consistent with a manager's assignments.
function syncBranchManagers(db, userId, businessId, branchIds) {
  for (const b of db.branches.filter((x) => x.businessId === businessId)) {
    if (b.managerId === userId && !branchIds.includes(b.id)) b.managerId = null
    if (branchIds.includes(b.id) && !b.managerId) b.managerId = userId
  }
}
const pendingRow = (i) => ({ id: i.id, name: i.name, email: i.email, phone: i.phone, role: 'MANAGER', branchIds: i.branchIds, permissions: i.permissions, status: 'Invited', lastLogin: null, inviteToken: i.token })

export const userHandlers = {
  'GET /users': async () => {
    await wait(350)
    const db = loadDb(), o = requireOwner(db)
    const users = db.users.filter((u) => u.businessId === o.businessId).map((u) => ({ ...safeUser(u), permissions: u.role === 'MANAGER' ? u.permissions ?? MANAGER_DEFAULT : undefined }))
    const invites = db.invitations.filter((i) => i.businessId === o.businessId && i.status === 'Pending').map(pendingRow)
    return { users: [...users, ...invites], branches: db.branches.filter((b) => b.businessId === o.businessId).map((b) => ({ id: b.id, name: b.name })) }
  },

  'POST /users/invite': async (p) => {
    await wait(500)
    const db = loadDb(), o = requireOwner(db), email = p.email.trim().toLowerCase()
    if (db.users.some((u) => u.businessId === o.businessId && u.email.toLowerCase() === email) || db.invitations.some((i) => i.businessId === o.businessId && i.status === 'Pending' && i.email === email))
      throw fail(409, 'This email already belongs to your team or has a pending invitation.')
    const valid = db.branches.filter((b) => b.businessId === o.businessId).map((b) => b.id)
    if (!p.branchIds?.length || p.branchIds.some((id) => !valid.includes(id))) throw fail(400, 'Select at least one of your branches.')
    const inv = { id: uid('inv'), token: token(), businessId: o.businessId, invitedBy: o.id, name: p.name.trim(), email, phone: p.phone ?? '', branchIds: p.branchIds, permissions: p.permissions ?? MANAGER_DEFAULT, status: 'Pending', createdAt: new Date().toISOString() }
    db.invitations.push(inv); saveDb(db)
    return pendingRow(inv)
  },

  'PATCH /users/:id': async (p, { params }) => {
    await wait(400)
    const db = loadDb(), o = requireOwner(db)
    const inv = db.invitations.find((i) => i.id === params.id && i.businessId === o.businessId && i.status === 'Pending')
    const target = inv ?? db.users.find((u) => u.id === params.id && u.businessId === o.businessId)
    if (!target) throw fail(404, 'User not found in your business.')
    if (target.role === 'OWNER') throw fail(403, 'The owner account cannot be changed here.')
    if (p.branchIds) {
      const valid = db.branches.filter((b) => b.businessId === o.businessId).map((b) => b.id)
      if (!p.branchIds.length || p.branchIds.some((id) => !valid.includes(id))) throw fail(400, 'Select at least one of your branches.')
      target.branchIds = p.branchIds
    }
    if (p.name) target.name = p.name.trim()
    if (p.phone !== undefined) target.phone = p.phone
    if (p.permissions) target.permissions = p.permissions
    if (p.status && !inv) target.status = p.status
    if (!inv) syncBranchManagers(db, target.id, o.businessId, target.status === 'Active' ? target.branchIds : [])
    saveDb(db)
    return inv ? pendingRow(inv) : safeUser(target)
  },

  'DELETE /users/:id': async (_b, { params }) => {
    await wait(400)
    const db = loadDb(), o = requireOwner(db)
    const inv = db.invitations.find((i) => i.id === params.id && i.businessId === o.businessId)
    if (inv) { inv.status = 'Revoked'; saveDb(db); return { removed: true } }
    const u = db.users.find((x) => x.id === params.id && x.businessId === o.businessId)
    if (!u) throw fail(404, 'User not found in your business.')
    if (u.role === 'OWNER') throw fail(403, 'The owner cannot be removed.')
    db.users = db.users.filter((x) => x.id !== u.id)
    syncBranchManagers(db, u.id, o.businessId, [])
    saveDb(db)
    return { removed: true }
  },

  'GET /invitations/:token': async (_b, { params }) => {
    await wait(300)
    const db = loadDb(), i = db.invitations.find((x) => x.token === params.token)
    if (!i || i.status !== 'Pending') throw fail(404, 'This invitation is invalid, already used, or has been revoked.')
    const biz = db.businesses.find((b) => b.businessId === i.businessId)
    return { businessId: i.businessId, businessName: biz?.name, name: i.name, email: i.email, branchNames: db.branches.filter((b) => i.branchIds.includes(b.id)).map((b) => b.name) }
  },

  'POST /invitations/:token/accept': async ({ password }, { params }) => {
    await wait(600)
    const db = loadDb(), i = db.invitations.find((x) => x.token === params.token)
    if (!i || i.status !== 'Pending') throw fail(404, 'This invitation is invalid, already used, or has been revoked.')
    if (!password || password.length < 8) throw fail(400, 'Password must be at least 8 characters.')
    const user = { id: uid('usr'), businessId: i.businessId, name: i.name, email: i.email, phone: i.phone, password, role: 'MANAGER', branchIds: i.branchIds, permissions: i.permissions, status: 'Active', lastLogin: null }
    db.users.push(user); i.status = 'Accepted'
    syncBranchManagers(db, user.id, i.businessId, i.branchIds)
    saveDb(db)
    return { businessId: i.businessId, email: i.email }
  },
}
