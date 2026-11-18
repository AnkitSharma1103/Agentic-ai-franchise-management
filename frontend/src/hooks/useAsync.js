import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../services/apiClient'

// Loads data through a service function; re-runs when deps change. Ignores stale responses.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, error: '' }))
    fn().then((data) => live && setState({ data, loading: false, error: '' }), (e) => live && setState({ data: null, loading: false, error: errorMessage(e) }))
    return () => { live = false }
  }, [...deps, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) }
}
