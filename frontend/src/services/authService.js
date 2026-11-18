import { apiClient } from './apiClient'
export const authService = {
  login: (creds) => apiClient.post('/auth/login', creds).then((r) => r.data),
  forgotPassword: (payload) => apiClient.post('/auth/forgot-password', payload).then((r) => r.data),
}
