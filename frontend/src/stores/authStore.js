import { create } from 'zustand'
import { authService } from '../services/authService'
import { branchService } from '../services/branchService'

const KEY = 'fai_session'
const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || 'null') } catch { return null }
}

export const useAuthStore = create((set) => ({
  session: read(),
  async login({ remember, ...creds }) {
    const session = await authService.login(creds)
    localStorage.removeItem(KEY); sessionStorage.removeItem(KEY)
    ;(remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session))
    set({ session })
    return session
  },
  // Refresh the authorised-branch list after branches are added, removed or reassigned.
  async syncBranches() {
    const branches = await branchService.options()
    set((st) => {
      if (!st.session) return st
      const session = { ...st.session, branches }
      const store = localStorage.getItem(KEY) ? localStorage : sessionStorage
      store.setItem(KEY, JSON.stringify(session))
      return { session }
    })
  },
  logout() {
    localStorage.removeItem(KEY); sessionStorage.removeItem(KEY)
    set({ session: null })
  },
}))

export const homeFor = (session) => {
  const r = session?.user.role
  if (r === 'STAFF') return '/appointments'
  if (r === 'MANAGER') return '/manager-dashboard'
  return '/dashboard'
}