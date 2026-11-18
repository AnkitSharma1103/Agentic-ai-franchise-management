import axios from 'axios'
import { handlers } from '../mocks/handlers'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// Mock adapter: resolves requests from src/mocks/handlers.js. Disabled when VITE_USE_MOCK=false.
const mockAdapter = async (config) => {
  const method = config.method.toUpperCase()
  const path = config.url.replace(config.baseURL ?? '', '').split('?')[0]
  const respond = (status, data) => ({ data, status, statusText: String(status), headers: {}, config })
  let handler, params = {}
  for (const [key, h] of Object.entries(handlers)) {
    const [m, pattern] = key.split(' ')
    if (m !== method) continue
    const names = []
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, n) => { names.push(n); return '([^/]+)' }) + '$')
    const hit = path.match(re)
    if (hit) { handler = h; params = Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(hit[i + 1])])); break }
  }
  if (!handler) return Promise.reject(Object.assign(new Error(`No mock handler for ${method} ${path}`), { response: respond(404, { message: 'Not implemented in mock mode.' }) }))
  try {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    return respond(200, await handler(body, { params, query: config.params }))
  } catch (e) {
    return Promise.reject(Object.assign(e, { response: respond(e.status ?? 500, { message: e.message }) }))
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
})

apiClient.interceptors.request.use((cfg) => {
  const token = JSON.parse(localStorage.getItem('fai_session') || 'null')?.token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const errorMessage = (e) => e?.response?.data?.message || e?.message || 'Something went wrong. Try again.'
