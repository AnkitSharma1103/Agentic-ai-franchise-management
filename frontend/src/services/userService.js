import { apiClient } from './apiClient'
export const userService = {
  list: () => apiClient.get('/users').then((r) => r.data),
  invite: (payload) => apiClient.post('/users/invite', payload).then((r) => r.data),
  update: (id, patch) => apiClient.patch(`/users/${id}`, patch).then((r) => r.data),
  remove: (id) => apiClient.delete(`/users/${id}`).then((r) => r.data),
  getInvitation: (token) => apiClient.get(`/invitations/${token}`).then((r) => r.data),
  acceptInvitation: (token, password) => apiClient.post(`/invitations/${token}/accept`, { password }).then((r) => r.data),
}
