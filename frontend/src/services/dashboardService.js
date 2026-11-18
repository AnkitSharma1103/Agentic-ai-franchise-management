import { apiClient } from './apiClient'
export const dashboardService = {
  getOwner: (params) => apiClient.get('/dashboard/owner', { params }).then((r) => r.data),
  getManager: (params) => apiClient.get('/dashboard/manager', { params }).then((r) => r.data),
}
