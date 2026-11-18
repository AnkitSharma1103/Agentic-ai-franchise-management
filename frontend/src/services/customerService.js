import { apiClient } from './apiClient'
import { makeCrud } from './crud'
export const customerService = { ...makeCrud('/customers'), history: (id) => apiClient.get(`/customers/${id}/history`).then((r) => r.data) }
