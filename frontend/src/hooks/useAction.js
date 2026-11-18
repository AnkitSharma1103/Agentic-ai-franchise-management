import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '../services/apiClient'
import { useAsync } from './useAsync'
import { branchService } from '../services/branchService'

// Runs a mutation with a toast, then reloads. Returns true on success.
export function useAction(reload) {
  const [busy, setBusy] = useState(false)
  const run = async (fn, okMsg) => {
    setBusy(true)
    try { const r = await fn(); if (okMsg) toast.success(typeof okMsg === 'function' ? okMsg(r) : okMsg); await reload?.(); return true }
    catch (e) { toast.error(errorMessage(e)); return false } finally { setBusy(false) }
  }
  return { run, busy }
}
export const useBranchOptions = () => useAsync(branchService.options, [])
