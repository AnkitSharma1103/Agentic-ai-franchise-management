import { apiClient } from './apiClient'
export const businessService = {
  register: (payload) => apiClient.post('/businesses/register', payload).then((r) => r.data),
}
