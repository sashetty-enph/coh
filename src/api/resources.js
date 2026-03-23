import { api } from './client'

export const resourcesApi = {
  getAll: (includeInactive = false) => 
    api.get(`/api/resources?includeInactive=${includeInactive}`),
  
  getById: (id) => 
    api.get(`/api/resources/${id}`),
  
  create: (resource) => 
    api.post('/api/resources', resource),
  
  update: (id, resource) => 
    api.put(`/api/resources/${id}`, resource),
  
  delete: (id) => 
    api.delete(`/api/resources/${id}`),
}
