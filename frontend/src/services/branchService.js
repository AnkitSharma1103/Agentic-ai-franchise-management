import { apiClient } from './apiClient'
import { makeCrud } from './crud'
export const branchService = { ...makeCrud('/branches'), options: () => apiClient.get('/branches/options').then((r) => r.data), get: (id) => apiClient.get(`/branches/${id}`).then((r) => r.data) }
