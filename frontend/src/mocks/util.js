import { MANAGER_DEFAULT } from '../config/permissions'
export const wait = (ms = 500) => new Promise((r) => setTimeout(r, ms))
export const fail = (status, message) => Object.assign(new Error(message), { status, mock: true })
export const safeUser = ({ password, ...u }) => u

export function currentSession() {
  try { return JSON.parse(localStorage.getItem('fai_session') || sessionStorage.getItem('fai_session') || 'null') } catch { return null }
}
// Mock of server-side auth: resolves the caller from the stored token/session.
export function requireUser(db) {
  const s = currentSession()
  const user = s && db.users.find((u) => u.id === s.user.id)
  if (!user) throw fail(401, 'Your session has expired. Log in again.')
  if (user.status === 'Suspended') throw fail(403, 'This account is suspended.')
  return { ...user, permissions: user.role === 'MANAGER' ? user.permissions ?? MANAGER_DEFAULT : undefined }
}
export function requireOwner(db) {
  const u = requireUser(db)
  if (u.role !== 'OWNER') throw fail(403, 'Only the business owner can do this.')
  return u
}
