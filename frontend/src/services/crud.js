import { apiClient } from './apiClient'
// Generic REST helpers. Real backend: same paths under VITE_API_BASE_URL.
export const makeCrud = (path) => ({
  list: (params) => apiClient.get(path, { params }).then((r) => r.data),
  create: (body) => apiClient.post(path, body).then((r) => r.data),
  update: (id, body) => apiClient.patch(`${path}/${id}`, body).then((r) => r.data),
  remove: (id) => apiClient.delete(`${path}/${id}`).then((r) => r.data),
})
